class VoiceAssistant {
    constructor() {
        this.ws = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.isRecording = false;
        this.isConnected = false;
        this.isSpeaking = false;
        this.silenceTimer = null;
        this.silenceThreshold = 30; // Silence threshold
        this.silenceDuration = 2000; // 2 seconds of silence
        
        this.initializeElements();
        this.setupEventListeners();
        this.connectWebSocket();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.conversationLog = document.getElementById('conversationLog');
        this.visualizer = document.getElementById('visualizer');
        this.canvasCtx = this.visualizer.getContext('2d');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else if (this.isSpeaking) {
                this.interruptSpeech();
            }
        });
    }

    connectWebSocket() {
        this.ws = new WebSocket('ws://localhost:3001');
        
        this.ws.onopen = () => {
            this.isConnected = true;
            this.updateStatus('connected', 'Connected');
            this.ws.send(JSON.stringify({ type: 'start_session' }));
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            this.updateStatus('disconnected', 'Disconnected');
            this.addMessage('system', 'Connection lost. Refresh to reconnect.');
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.addMessage('error', 'Connection error occurred.');
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'session_started':
                this.addMessage('system', 'Session started. You can now speak!');
                break;
            case 'text_response':
                this.addMessage('ai', data.text);
                this.speakText(data.text);
                break;
            case 'interrupted':
                this.addMessage('system', 'Response interrupted.');
                break;
            case 'error':
                this.addMessage('error', `Error: ${data.message}`);
                break;
        }
    }

    async startRecording() {
        if (!this.isConnected) {
            this.addMessage('error', 'Not connected to server.');
            return;
        }

        // Interrupt AI if it's speaking
        if (this.isSpeaking) {
            this.interruptSpeech();
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });

            this.setupAudioContext(stream);
            this.setupMediaRecorder(stream);
            
            this.mediaRecorder.start(100); // Send data every 100ms
            this.isRecording = true;
            
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.stopBtn.innerHTML = '<span class="btn-icon">⏹️</span>Stop';
            this.updateStatus('listening', 'Listening...');
            this.addMessage('user', 'Started speaking...');
            
            this.visualizeAudio();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.addMessage('error', 'Could not access microphone.');
        }
    }

    setupAudioContext(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        this.analyser.fftSize = 256;
    }

    setupMediaRecorder(stream) {
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });

        let audioChunks = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = () => {
                const audioData = reader.result.split(',')[1];
                this.ws.send(JSON.stringify({
                    type: 'audio_data',
                    audio: audioData
                }));
                audioChunks = [];
            };
            reader.readAsDataURL(audioBlob);
        };
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            if (this.silenceTimer) {
                clearTimeout(this.silenceTimer);
                this.silenceTimer = null;
            }
            
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.updateStatus('connected', 'Processing...');
            this.addMessage('user', 'Processing audio...');
        }
    }
    
    interruptSpeech() {
        if (this.isSpeaking) {
            // Multiple methods to ensure speech stops
            speechSynthesis.cancel();
            speechSynthesis.pause();
            
            // Force stop with timeout
            setTimeout(() => {
                speechSynthesis.cancel();
            }, 100);
            
            this.isSpeaking = false;
            this.ws.send(JSON.stringify({ type: 'interrupt' }));
            this.updateStatus('connected', 'Connected');
            this.stopBtn.innerHTML = '<span class="btn-icon">⏹️</span>Stop';
            this.stopBtn.disabled = true;
            this.addMessage('user', 'Speech interrupted.');
        }
    }

    speakText(text) {
        if ('speechSynthesis' in window) {
            // Cancel any existing speech first
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateStatus('speaking', 'Speaking...');
                this.stopBtn.disabled = false;
                this.stopBtn.innerHTML = '<span class="btn-icon">⏹️</span>Interrupt';
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateStatus('connected', 'Connected');
                this.stopBtn.innerHTML = '<span class="btn-icon">⏹️</span>Stop';
                this.stopBtn.disabled = true;
            };
            
            utterance.onerror = () => {
                this.isSpeaking = false;
                this.updateStatus('connected', 'Connected');
                this.stopBtn.innerHTML = '<span class="btn-icon">⏹️</span>Stop';
                this.stopBtn.disabled = true;
            };
            
            speechSynthesis.speak(utterance);
        }
    }

    visualizeAudio() {
        if (!this.isRecording) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this.isRecording) return;
            
            requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume for silence detection
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            
            // Check for silence
            if (average < this.silenceThreshold) {
                if (!this.silenceTimer) {
                    this.silenceTimer = setTimeout(() => {
                        this.stopRecording();
                    }, this.silenceDuration);
                }
            } else {
                if (this.silenceTimer) {
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = null;
                }
            }
            
            this.canvasCtx.fillStyle = '#f9f9f9';
            this.canvasCtx.fillRect(0, 0, this.visualizer.width, this.visualizer.height);
            
            const barWidth = (this.visualizer.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * this.visualizer.height;
                
                this.canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                this.canvasCtx.fillRect(x, this.visualizer.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }

    updateStatus(status, text) {
        this.statusDot.className = `status-dot ${status}`;
        this.statusText.textContent = text;
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = `${new Date().toLocaleTimeString()}: ${content}`;
        
        this.conversationLog.appendChild(messageDiv);
        this.conversationLog.scrollTop = this.conversationLog.scrollHeight;
    }
}

// Initialize the voice assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceAssistant();
});
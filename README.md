# Rev Voice Assistant - Gemini Live API Implementation

A real-time conversational voice interface replicating the Revolt Motors chatbot functionality using Google's Gemini Live API.

## Features

- **Real-time Voice Conversation**: Natural speech-to-speech interaction
- **Interruption Support**: Users can interrupt the AI mid-response
- **Low Latency**: Optimized for 1-2 second response times
- **Audio Visualization**: Real-time audio waveform display
- **Revolt Motors Focus**: AI assistant trained specifically for Revolt Motors queries
- **Server-to-Server Architecture**: Secure backend implementation

## Prerequisites

- Node.js (v16 or higher)
- Google AI Studio API key
- Modern web browser with microphone access

## Setup Instructions

### 1. Get Gemini API Key
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Create a free account
3. Generate an API key

### 2. Configure Environment
1. Open `.env` file in the root directory
2. Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3001
   ```

### 3. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 4. Run the Application

**Start Backend Server:**
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

**Start Frontend Server:**
```bash
cd frontend
npm start
```

### 5. Access the Application
- Open your browser and go to `http://localhost:3000`
- Allow microphone permissions when prompted
- Click "Start Conversation" to begin talking with Rev

## Usage

1. **Start Conversation**: Click the green "Start Conversation" button
2. **Speak**: Talk naturally about Revolt Motors topics
3. **Interrupt**: You can interrupt the AI while it's speaking by clicking "Stop" or starting to speak again
4. **Stop**: Click the red "Stop" button to end the conversation

## Model Configuration

The application is configured to use:
- **Production**: `gemini-2.5-flash-preview-native-audio-dialog` (recommended for final deployment)
- **Development**: `gemini-2.0-flash-live-001` (for testing due to rate limits)

To switch models, edit the model name in `backend/server.js`:
```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-preview-native-audio-dialog', // Change this line
  systemInstruction: systemInstruction
});
```

## System Instructions

The AI is configured with specific instructions to only discuss Revolt Motors topics:
- Electric motorcycles (RV400, RV1+)
- Company information
- Sustainable mobility solutions
- Charging infrastructure
- Product features and services

## Technical Architecture

- **Backend**: Node.js/Express with WebSocket support
- **Frontend**: Vanilla JavaScript with Web Audio API
- **Communication**: Real-time WebSocket connection
- **Audio Processing**: PCM audio format for Gemini Live API
- **Visualization**: Canvas-based audio waveform display

## Troubleshooting

### Common Issues:

1. **Microphone Access Denied**
   - Ensure browser permissions allow microphone access
   - Use HTTPS in production for microphone access

2. **API Rate Limits**
   - Switch to `gemini-2.0-flash-live-001` for development
   - Monitor usage in Google AI Studio console

3. **Connection Issues**
   - Check if backend server is running on port 3001
   - Verify WebSocket connection in browser developer tools

4. **Audio Playback Issues**
   - Ensure browser supports Web Audio API
   - Check audio codec compatibility

## Development Notes

- The application uses server-to-server architecture as required
- WebSocket handles real-time bidirectional communication
- Audio is processed in PCM format for optimal Gemini Live API compatibility
- Interruption handling is implemented through WebSocket messaging

## Demo Video Requirements

When creating your demo video, ensure to show:
1. Natural conversation flow
2. Clear interruption of AI mid-response
3. Overall responsiveness and low latency
4. Audio visualization working
5. Revolt Motors-specific responses

## License

This project is created for assessment purposes and demonstrates integration with Google's Gemini Live API.
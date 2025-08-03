const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `You are Rev, the voice assistant for Revolt Motors. You only discuss topics related to Revolt Motors, their electric motorcycles, products, services, and company information. 

Key information about Revolt Motors:
- Leading electric motorcycle manufacturer in India
- Known for RV400 and RV1+ electric motorcycles
- Focus on sustainable mobility solutions
- Offers innovative features like swappable batteries
- Has charging infrastructure across India

Keep responses conversational, helpful, and focused only on Revolt Motors. If asked about unrelated topics, politely redirect the conversation back to Revolt Motors.`;

wss.on('connection', (ws) => {
  console.log('Client connected');
  let model = null;
  let chatSession = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'start_session') {
        model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemInstruction
        });
        chatSession = model.startChat();
        ws.send(JSON.stringify({ type: 'session_started' }));
      }
      
      if (data.type === 'audio_data' && chatSession) {
        const result = await chatSession.sendMessage([{
          inlineData: {
            mimeType: 'audio/webm',
            data: data.audio
          }
        }]);
        const response = result.response.text();
        
        ws.send(JSON.stringify({
          type: 'text_response',
          text: response
        }));
      }
      
      if (data.type === 'interrupt') {
        ws.send(JSON.stringify({ type: 'interrupted' }));
      }

    } catch (error) {
      console.error('Error:', error);
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
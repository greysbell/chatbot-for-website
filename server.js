require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 80;
const systemInstruction = "You are Greyston Bellino, an accomplished computer science student...";


console.log("Initializing GoogleGenerativeAI...");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings: [] });


app.use(cors({
  origin: 'https://greysb.ca',  
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
let chatHistory = [];

try {
  const data = fs.readFileSync(path.resolve(__dirname, 'chat_history.json'), 'utf-8');
  const jsonHistory = JSON.parse(data);
  chatHistory.push(...jsonHistory.map(entry => ({
    role: entry.role,
    parts: [{ text: entry.message }]
  })));
  console.log("Chat history loaded successfully:", chatHistory);
} catch (error) {
  console.error("Failed to load chat history:", error);
}

console.log("Starting chat with initial history...");
const chat = model.startChat({ history: chatHistory });

app.post('/chat', async (req, res) => {
  const { message } = req.body;


  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.warn("Received an empty message from client.");
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  try {
    console.log("Sending message to AI model:", message);
    const result = await chat.sendMessage(message);

    const modelResponse = result.response.text();
    console.log("Model response text:", modelResponse);

    res.json({ userMessage: { role: "user", message }, modelMessage: { role: "model", message: modelResponse } });
  } catch (error) {
    console.error("Error generating response from AI model:", error);
    res.status(500).json({ error: "Failed to get response from AI model" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

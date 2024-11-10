// Import necessary modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 5002;
const systemInstruction = "You are Greyston Bellino, an accomplished computer science student...";

// Initialize GoogleGenerativeAI with API key
console.log("Initializing GoogleGenerativeAI...");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Set up CORS for Render deployment
app.use(cors({
  origin: 'http://localhost:3000'  // Update if you deploy frontend elsewhere
}));

app.use(express.json());

// Load chat history for initial context
let chatHistory = [];
chatHistory.push({
  role: "user",
  parts: [{ text: systemInstruction }]
});

// Load chat history from file and log any errors if they occur
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

// Initialize chat session
console.log("Starting chat with initial history...");
const chat = model.startChat({ history: chatHistory });

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  // Validate incoming message
  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.warn("Received an empty message from client.");
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  try {
    console.log("Sending message to AI model:", message);
    const result = await chat.sendMessage(message);

    // Log the full result to inspect if it's the expected object structure
    console.log("Result from AI:", result.response.text());

    // Extract the model's response and send back to the client
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

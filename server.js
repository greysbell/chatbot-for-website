require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 5001;
const systemInstruction="You are Greyston Bellino, an accomplished computer science student with expertise in web development, data science, and software engineering. Respond to questions about your skills, projects, and background in a friendly and knowledgeable tone, as if speaking directly about your experience in 1-2 sentences. Keep answers concise, using 1-2 sentences to provide key insights about your academic history and professional accomplishments."


const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemInstruction});


app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(express.json());


let chatHistory = [];
try {
  const data = fs.readFileSync(path.resolve(__dirname, 'chat_history.json'), 'utf-8');
  const jsonHistory = JSON.parse(data);


  chatHistory = jsonHistory.map(entry => ({
    role: entry.role,
    parts: [{ text: entry.message }]
  }));

  console.log("Chat history loaded successfully.");
} catch (error) {
  console.error("Failed to load chat history:", error);
}

console.log(chatHistory);


const chat = model.startChat({ history: chatHistory });

app.post('/chat', async (req, res) => {
  const { message } = req.body;


  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  try {

    const result = await chat.sendMessage(message);

    const modelResponse = result.response.text();

    res.json({ userMessage: { role: "user", message }, modelMessage: { role: "model", message: modelResponse } });
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).json({ error: "Failed to get response from AI model" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

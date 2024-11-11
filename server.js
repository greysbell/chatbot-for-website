require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 80;
const systemInstruction = `
You are Greyston Bellino, an accomplished Computer Science student at Toronto Metropolitan University with a strong foundation in web development, data science, and software engineering. You are expected to graduate in May 2025 and have earned Dean's List honors for two years.

If asked about how the chatbot was built refer to the AI chatbot greyston build with google generative AI.

Do not uses '*' in any of your text reponses.

Your relevant coursework includes Data Structures, Discrete Structures, Algorithms, Databases, Artificial Intelligence, Machine Learning, Software Engineering, Software Project Management, Operating Systems, and Cyber-Security, with a minor in Cyber-Security. You possess a solid command of tools like Azure, Figma, and Tableau, and your technical skills span HTML, CSS, JavaScript, Angular, React, Python, Java, SQL, and more. You have successfully applied your skills to deliver impactful projects, including:

1. **AI Chatbot with Google Generative AI**: Developed an AI chatbot utilizing Google Generative AI to handle real-time, interactive conversations on your website, allowing users to learn about your skills and projects.
2. **Python Anti-Recoil Script for FPS Games**: Built a Python script that reads and counters mouse recoil patterns in FPS games, demonstrating your skills in data capture and vector math.
3. **Multi-Language 'War' Card Game Development**: Created a card game in Rust, SmallTalk, Ruby, and Elixir to explore different programming paradigms.
4. **Bowling Score Tracker Terminal in Python**: Designed a Python application for calculating and displaying bowling scores accurately in real time.

Answer questions concisely (1-2 sentences) with a friendly and knowledgeable tone, directly referencing your skills, projects, and achievements where relevant. Provide quick insights into your academic history, project work, and accomplishments.
`;



console.log("Initializing GoogleGenerativeAI...");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings: [], systemInstruction: systemInstruction });


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

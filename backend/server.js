require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// นำเข้าไฟล์จาก POC ของคุณ
const { storyContent } = require('./story_content.js');
const { getInitialPrompt } = require('./initial_prompt.js');

const Conversation = require('./models/Conversation');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Database Connection ---
const MONGO_URI = 'mongodb://127.0.0.1:27017/mr_robby_db';
mongoose.connect(MONGO_URI)
    .then(() => console.log('เชื่อมต่อกับ MongoDB สำเร็จ!'))
    .catch((err) => console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ MongoDB:', err));

// --- Google AI Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// **แก้ไข 1:** ใช้ชื่อโมเดลที่ถูกต้อง
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- API Route สำหรับ Text-to-Speech ---
app.post('/api/tts', async (req, res) => {
    const { text, languageCode, voiceName } = req.body;
    const TTS_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GEMINI_API_KEY}`;

    const requestBody = {
        input: { text: text },
        voice: { languageCode: languageCode, name: voiceName },
        audioConfig: { audioEncoding: 'MP3' }
    };

    try {
        const ttsResponse = await axios.post(TTS_API_URL, requestBody);
        res.json({ audioContent: ttsResponse.data.audioContent });
    } catch (error) {
        console.error('Error with Text-to-Speech API:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error generating speech' });
    }
});


// --- API Route สำหรับ Chat ---
app.post('/api/chat', async (req, res) => {
    try {
        const { userMessage, history, language, totalQuestions = 5 } = req.body;

        if (!userMessage || !history) {
            return res.status(400).json({ message: 'Message and history are required' });
        }
        
        // **แก้ไข 2:** ส่ง 'language' เข้าไปใน getInitialPrompt
        // เพื่อให้ AI ได้รับ "เอกสารภารกิจ" ที่ถูกต้องตามภาษาที่ผู้ใช้เลือก
        const initialPrompt = getInitialPrompt(storyContent, totalQuestions, language);

        const contents = [
            { role: "user", parts: [{ text: initialPrompt }] },
            ...history,
            { role: "user", parts: [{ text: userMessage }] }
        ];

        const result = await model.generateContent({ contents });
        const response = await result.response;
        const aiResponseText = response.text();

        const newConversation = new Conversation({
            userText: userMessage,
            aiText: aiResponseText
        });
        await newConversation.save();

        res.json({ reply: aiResponseText });

    } catch (error) {
        console.error("Error with Gemini AI:", error);
        res.status(500).json({ message: 'Error communicating with AI' });
    }
});

// ไม่จำเป็นต้องมี langConfig ในไฟล์นี้แล้ว เพราะ Logic ถูกย้ายไปที่ initial_prompt.js

app.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์กำลังทำงานที่ http://localhost:${PORT}`);
});
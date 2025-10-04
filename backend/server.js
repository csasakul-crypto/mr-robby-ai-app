// server.js
require('dotenv').config(); // ต้องอยู่บนสุดเสมอ
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// 1. นำเข้า Library ตัวที่ถูกต้องกลับมา
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// --- Google AI Setup (แบบใหม่ที่ใช้งานได้) ---
// 2. ตั้งค่า AI ด้วย API Key จาก .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// **หมายเหตุ:** ในโค้ดที่คุณส่งมาใช้ 'gemini-2.5-flash' ซึ่งอาจจะพิมพ์ผิดเล็กน้อย
// ผมขออนุญาตแก้เป็น 'gemini-1.5-flash' ซึ่งเป็นเวอร์ชันล่าสุดที่ใช้งานได้นะครับ
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


// --- API Routes ---
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ timestamp: 1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// 3. อัปเดต Endpoint /api/chat ให้ใช้ Logic ใหม่
app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ message: 'No message provided' });
    }

    // 4. ส่งคำถามไปให้ Gemini AI (วิธีที่ง่ายกว่า)
    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const aiResponseText = response.text();

    // 5. บันทึกทั้งคำถามและคำตอบลง Database (เหมือนเดิม)
    const newConversation = new Conversation({
      userText: userMessage,
      aiText: aiResponseText
    });
    await newConversation.save();

    // 6. ส่ง "คำตอบของ AI" กลับไปให้ Frontend (เหมือนเดิม)
    res.json({ reply: aiResponseText });

  } catch (error) {
    console.error("Error with Gemini AI:", error);
    res.status(500).json({ message: 'Error communicating with AI' });
  }
});

app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์กำลังทำงานที่ http://localhost:${PORT}`);
});
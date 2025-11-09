// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// const { storyContent } = require('./story_content.js');
// const { getInitialPrompt } = require('./initial_prompt.js');
const ConversationSession = require('./models/ConversationSession');
const Lesson = require('./models/Lesson'); // Assume Lesson model exists
const MonthlyUsage = require('./models/MonthlyUsage');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mr_robby_db';
mongoose.connect(MONGO_URI)
    .then(() => console.log('เชื่อมต่อกับ MongoDB สำเร็จ!'))
    .catch((err) => console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ MongoDB:', err));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- API TTS (แก้ไข) ---
app.post('/api/tts', async (req, res) => {
    // รับ sessionId เพิ่ม
    const { text, languageCode, voiceName, sessionId } = req.body;
    const TTS_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GEMINI_API_KEY}`;

    if (!sessionId) {
        console.error('TTS request missing sessionId');
        // ส่ง audio กลับไปก่อน แต่ log error ไว้
    }

    const requestBody = {
        input: { text: text },
        voice: { languageCode: languageCode, name: voiceName },
        audioConfig: { audioEncoding: 'MP3' }
    };

    try {
        const ttsResponse = await axios.post(TTS_API_URL, requestBody);

        // นับจำนวนตัวอักษร
        const characterCount = text ? text.length : 0;

        // อัปเดต totalTTSCharacters ใน Session ที่เกี่ยวข้อง (ถ้ามี sessionId)
        if (sessionId && characterCount > 0) {
            await ConversationSession.findOneAndUpdate(
                { sessionId: sessionId },
                { $inc: { totalTTSCharacters: characterCount } },
                { upsert: false } // ไม่สร้างใหม่ถ้าไม่เจอ
            );
        }

        res.json({ audioContent: ttsResponse.data.audioContent });
    } catch (error) {
        console.error('Error with Text-to-Speech API:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error generating speech' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { userMessage, history, language, totalQuestions, sessionData, sessionId, lessonCode, lessonName } = req.body;

        // --- ตรวจสอบ Input พื้นฐาน ---
        if (!userMessage || !history || !sessionId || !lessonCode || !language) {
            return res.status(400).json({ message: 'Missing required fields: userMessage, history, sessionId, lessonCode, language' });
        }

        //console.log(`--- Request for lessonCode: ${lessonCode}, Language: ${language} ---`); // <-- Log 1: แสดง lessonCode และ language ที่ได้รับ

        // --- 1. ดึงข้อมูลบทเรียนจาก Database ---
        const lesson = await Lesson.findOne({ lessonCode: lessonCode });
        if (!lesson) {
            return res.status(404).json({ message: `Lesson with code '${lessonCode}' not found.` });
        }

        // --- 2. เลือก Prompt และ Story ตามภาษา ---
        const promptTemplate = language === 'en-US' ? lesson.initialPromptEN : lesson.initialPromptTH;
        const storyContentForPrompt = language === 'en-US' ? lesson.storyContentEN : lesson.storyContentTH;
        const effectiveTotalQuestions = totalQuestions || lesson.totalQuestions; // ใช้ค่าที่ส่งมา ถ้าไม่มีใช้ค่าจาก DB

        //console.log(`   Fetched Prompt (${language}):`, promptTemplate || 'Not Found'); // <-- แสดงเต็ม
        // --- 3. สร้าง Prompt แบบไดนามิก ---
        // (สมมติว่าใน Prompt มี placeholder `{storyContent}` และ `{totalQuestions}`)
        // ถ้าไม่มี placeholder ก็อาจจะต้องปรับ Prompt ใน DB หรือวิธีประกอบ Prompt ตรงนี้
        let dynamicInitialPrompt = promptTemplate;
        // if (dynamicInitialPrompt.includes('{storyContent}')) {
        //      dynamicInitialPrompt = dynamicInitialPrompt.replaceAll('{storyContent}', storyContentForPrompt);
        //  }else{
        //     dynamicInitialPrompt = `${promptTemplate}\n\nHere is the content:\n${storyContentForPrompt}`;
        //  }
        dynamicInitialPrompt = `${promptTemplate}\n\nHere is the content:\n${storyContentForPrompt}`;

        if (dynamicInitialPrompt.includes('{totalQuestions}')) {
            dynamicInitialPrompt = dynamicInitialPrompt.replaceAll('{totalQuestions}', effectiveTotalQuestions);
        }

        //console.log("   TotalQuestions:", effectiveTotalQuestions); // <-- แสดงเต็ม

        //console.log("   Final Dynamic Prompt:", dynamicInitialPrompt); // <-- แสดงเต็ม

        // --- 4. เตรียมข้อมูลส่งให้ Gemini ---
        const contents = [
            { role: "user", parts: [{ text: dynamicInitialPrompt }] }, // ใช้ Prompt ที่สร้างขึ้น
            ...history.map(turn => ({ role: turn.role, parts: [{ text: turn.text }] })),
            { role: "user", parts: [{ text: userMessage }] }
        ];

        // --- 5. เรียก Gemini API (เหมือนเดิม) ---
        const result = await model.generateContent({ contents });
        const response = await result.response;
        const aiResponseText = response.text();
        const usageMetadata = response.usageMetadata;
        //console.log('Token Usage:', usageMetadata);

        // --- 6. ตรวจสอบ {EVALUATION:} และบันทึก (เหมือนเดิม แต่ใช้ lessonName ที่รับมา) ---
        if (aiResponseText.includes('{EVALUATION:}')) {
            const evaluationText = aiResponseText.split('{EVALUATION:}')[1].trim();
            const fullHistory = [
                ...history,
                { role: 'user', text: userMessage }, // User turn (no token count here)
                {
                    role: 'model',
                    text: aiResponseText,
                    promptTokens: usageMetadata?.promptTokenCount,
                    completionTokens: usageMetadata?.candidatesTokenCount || usageMetadata?.candidateTokenCount // บางที API อาจใช้ชื่อต่างกัน
                }
            ];

// backend/server.js
            const sessionUpdateData = {
                studentId: sessionData.studentId,
                schoolCode: sessionData.schoolCode,
                studentGrade: sessionData.studentGrade,
                academicYear: String(new Date().getFullYear() + 543),
                lessonCode: lessonCode, 
                lessonName: lessonName || lesson.lessonName, 
                studentNameTH: sessionData.studentNameTH,
                studentNameEN: sessionData.studentNameEN,
                schoolNameTH: sessionData.schoolNameTH,
                schoolNameEN: sessionData.schoolNameEN,
                // startTime: sessionData.startTime, // <-- ลบออกแล้ว
                endTime: new Date(), // <-- กำหนดเวลาจบ
                totalQuestions: effectiveTotalQuestions,
                aiEvaluation: evaluationText, // <-- บันทึก Evaluation
                conversationHistory: fullHistory, // <-- บันทึกประวัติทั้งหมด
            };

            const updatedSession = await ConversationSession.findOneAndUpdate(
                { sessionId: sessionId },
                { $set: sessionUpdateData, $setOnInsert: { startTime: sessionData.startTime, sessionId: sessionId } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log('บันทึก/อัปเดต Session การสนทนาสำเร็จ! ID:', updatedSession._id);
        }

        // --- 7. ส่งคำตอบกลับ (เหมือนเดิม) ---
        res.json({ reply: aiResponseText });

    } catch (error) {
        console.error("Error in /api/chat:", error); // <-- เปลี่ยน Log ให้ชัดเจนขึ้น
        res.status(500).json({ message: 'Error processing chat request' });
    }
});

// --- API CRUD สำหรับ Lessons ---

// GET: ดึงข้อมูลบทเรียนทั้งหมด
app.get('/api/lessons', async (req, res) => {
    try {
        const lessons = await Lesson.find().sort({ lessonCode: 1 });
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลบทเรียนได้', error });
    }
});

// POST: สร้างบทเรียนใหม่
app.post('/api/lessons', async (req, res) => {
    try {
        const newLesson = new Lesson(req.body);
        await newLesson.save();
        res.status(201).json(newLesson);
    } catch (error) {
        res.status(400).json({ message: 'ไม่สามารถสร้างบทเรียนได้', error });
    }
});

// PUT: อัปเดตบทเรียนตาม ID
app.put('/api/lessons/:id', async (req, res) => {
    try {
        const updatedLesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedLesson) return res.status(404).json({ message: 'ไม่พบบทเรียน' });
        res.json(updatedLesson);
    } catch (error) {
        res.status(400).json({ message: 'ไม่สามารถอัปเดตบทเรียนได้', error });
    }
});

// DELETE: ลบบทเรียนตาม ID
app.delete('/api/lessons/:id', async (req, res) => {
    try {
        const deletedLesson = await Lesson.findByIdAndDelete(req.params.id);
        if (!deletedLesson) return res.status(404).json({ message: 'ไม่พบบทเรียน' });
        res.json({ message: 'ลบบทเรียนสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'ไม่สามารถลบบทเรียนได้', error });
    }
});


// --- API สรุปยอดการใช้งานรายเดือน ---

// POST: คำนวณและบันทึกสรุปยอดของเดือนที่ระบุ
app.post('/api/usage/summarize-month', async (req, res) => {
    const { month } = req.body; // รับเดือน YYYY-MM จาก request body
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: 'กรุณาระบุเดือนในรูปแบบ YYYY-MM' });
    }

    try {
        const startDate = new Date(`${month}-01T00:00:00.000Z`);
        const nextMonth = new Date(startDate);
        nextMonth.setUTCMonth(startDate.getUTCMonth() + 1);

        const result = await ConversationSession.aggregate([
            {
                $match: { // กรอง Session เฉพาะในเดือนที่ระบุ (ใช้ createdAt)
                    createdAt: {
                        $gte: startDate,
                        $lt: nextMonth
                    }
                }
            },
            {
                $unwind: "$conversationHistory" // แยกแต่ละ Turn ใน history ออกมา
            },
            {
                $group: { // จัดกลุ่มตาม Session เพื่อรวม Token แต่ละ Turn ก่อน
                    _id: "$_id", // ใช้ ID ของ Session เป็นตัวจัดกลุ่ม
                    sessionId: { $first: "$sessionId" }, // เก็บ sessionId ไว้
                    totalPromptTokensInTurns: { $sum: "$conversationHistory.promptTokens" },
                    totalCompletionTokensInTurns: { $sum: "$conversationHistory.completionTokens" },
                    totalTTSCharacters: { $first: "$totalTTSCharacters" }, // ดึงค่า TTS รวมของ Session
                    createdAt: { $first: "$createdAt" } // เก็บวันที่สร้างไว้เผื่อใช้
                }
            },
            {
                $group: { // จัดกลุ่มทั้งหมดอีกครั้ง เพื่อรวมยอดทั้งเดือน
                    _id: null, // ไม่ต้องจัดกลุ่มย่อยแล้ว
                    totalPromptTokens: { $sum: "$totalPromptTokensInTurns" },
                    totalCompletionTokens: { $sum: "$totalCompletionTokensInTurns" },
                    totalTTSCharacters: { $sum: "$totalTTSCharacters" },
                    sessionCount: { $sum: 1 } // นับจำนวน Session ทั้งหมด
                }
            }
        ]);

        let summaryData = {
            month: month,
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            totalTTSCharacters: 0,
            sessionCount: 0,
            updatedAt: new Date()
        };

        if (result.length > 0) {
            summaryData = {
                ...summaryData, // เก็บ month และ updatedAt
                totalPromptTokens: result[0].totalPromptTokens || 0,
                totalCompletionTokens: result[0].totalCompletionTokens || 0,
                totalTTSCharacters: result[0].totalTTSCharacters || 0,
                sessionCount: result[0].sessionCount || 0,
            };
        }

        // บันทึกหรืออัปเดตข้อมูลสรุปใน collection 'monthlyusages'
        const savedSummary = await MonthlyUsage.findOneAndUpdate(
            { month: month },
            summaryData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json(savedSummary);

    } catch (error) {
        console.error('Error summarizing monthly usage:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสรุปยอด', error });
    }
});

// GET: ดึงข้อมูลสรุปยอดของเดือนที่ระบุ (หรือเดือนปัจจุบันถ้าไม่ระบุ)
app.get('/api/usage/summary', async (req, res) => {
    let { month } = req.query; // รับเดือน YYYY-MM จาก query parameter

    if (!month) { // ถ้าไม่ระบุเดือน ให้ใช้เดือนปัจจุบัน
        const now = new Date();
        month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: 'รูปแบบเดือนไม่ถูกต้อง กรุณาใช้ YYYY-MM' });
    }

    try {
        const summary = await MonthlyUsage.findOne({ month: month });
        if (!summary) {
            // ถ้ายังไม่มีข้อมูลสรุปของเดือนนี้ อาจจะคืนค่า 0 หรือข้อความว่ายังไม่มีข้อมูล
            return res.json({
                month: month,
                totalPromptTokens: 0,
                totalCompletionTokens: 0,
                totalTTSCharacters: 0,
                sessionCount: 0,
                message: "ยังไม่มีข้อมูลสรุปสำหรับเดือนนี้ ลองเรียก POST /api/usage/summarize-month ก่อน"
            });
        }
        res.json(summary);
    } catch (error) {
        console.error('Error fetching monthly summary:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป', error });
    }
});
// ----------------------------------------

// --- เพิ่ม API Endpoint ใหม่ ---
// GET: ดึงข้อมูลบทเรียนเฉพาะตาม lessonCode
app.get('/api/lessons/code/:lessonCode', async (req, res) => {
    try {
        const lesson = await Lesson.findOne({ lessonCode: req.params.lessonCode });
        if (!lesson) {
            return res.status(404).json({ message: 'ไม่พบบทเรียนสำหรับรหัสนี้' });
        }
        // ส่งเฉพาะข้อมูลที่ Frontend ต้องการในตอนเริ่มต้น (ไม่ส่งเนื้อหาเต็ม)
        res.json({
            _id: lesson._id,
            lessonCode: lesson.lessonCode,
            lessonName: lesson.lessonName,
            totalQuestions: lesson.totalQuestions,
            studentGrade: lesson.studentGrade // อาจจะส่ง grade ไปด้วยก็ได้
        });
    } catch (error) {
        console.error('Error fetching lesson by code:', error);
        res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลบทเรียนได้', error });
    }
});
// ----------------------------

app.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์กำลังทำงานที่ http://localhost:${PORT}`);
});
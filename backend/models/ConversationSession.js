// backend/models/ConversationSession.js
const mongoose = require('mongoose');

const conversationTurnSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'model'], required: true },
    text: { type: String, required: true },
    audioUrl: { type: String },
    timestamp: { type: Date, default: Date.now },
    // --- เพิ่มฟิลด์ Token ---
    promptTokens: { type: Number },
    completionTokens: { type: Number }
});

const conversationSessionSchema = new mongoose.Schema({
    // --- ข้อมูลชุดเดิม ---
    sessionId: { type: String, required: true, unique: true, index: true }, // <-- เพิ่ม ID เฉพาะ
    schoolCode: { type: String, required: true },
    studentGrade: { type: String },
    academicYear: { type: String },
    lessonCode: { type: String, required: true },
    lessonName: { type: String},

    // --- VVV เพิ่มฟิลด์ใหม่ 4 ฟิลด์เข้ามาตรงนี้ VVV ---
    studentNameTH: { type: String },
    studentNameEN: { type: String },
    schoolNameTH: { type: String },
    schoolNameEN: { type: String },
    // -----------------------------------------

    startTime: { type: Date, required: true },
    endTime: { type: Date },
    totalQuestions: { type: Number, default: 5 },
    aiEvaluation: { type: String },
    totalTTSCharacters: { type: Number, default: 0 }, // <-- เพิ่มฟิลด์นับ TTS
    conversationHistory: [conversationTurnSchema]
}, { timestamps: true }); // <-- เพิ่ม timestamps: true เพื่อให้มี createdAt, updatedAt อัตโนมัติ

module.exports = mongoose.model('ConversationSession', conversationSessionSchema);
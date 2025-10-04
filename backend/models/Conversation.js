// models/Conversation.js
const mongoose = require('mongoose');

// สร้างพิมพ์เขียว (Schema) สำหรับข้อมูลการสนทนา
const conversationSchema = new mongoose.Schema({
  userText: {
    type: String,
    required: true
  },
  aiText: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// สร้าง Model จาก Schema เพื่อใช้ในการสร้างและค้นหาข้อมูล
const Conversation = mongoose.model('Conversation', conversationSchema);

// ส่งออก Model เพื่อให้ไฟล์อื่นนำไปใช้ได้
module.exports = Conversation;
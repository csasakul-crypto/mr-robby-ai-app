// backend/models/Lesson.js
const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    studentGrade: { type: String, required: true },
    lessonCode: { type: String, required: true, unique: true },
    lessonName: { type: String, required: true }, 
    totalQuestions: { type: Number, default: 5 },
    storyContentTH: { type: String, required: true },
    storyContentEN: { type: String, required: true },
    initialPromptTH: { type: String, required: true }, 
    initialPromptEN: { type: String, required: true }, 
    QuestionFormActivitiesBook: { type: String},
}, { timestamps: true }); // timestamps: 

module.exports = mongoose.model('Lesson', lessonSchema);
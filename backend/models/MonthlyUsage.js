// backend/models/MonthlyUsage.js
const mongoose = require('mongoose');

const monthlyUsageSchema = new mongoose.Schema({
    month: { type: String, required: true, unique: true, index: true }, // Format: YYYY-MM
    totalPromptTokens: { type: Number, default: 0 },
    totalCompletionTokens: { type: Number, default: 0 },
    totalTTSCharacters: { type: Number, default: 0 },
    sessionCount: { type: Number, default: 0 }, // นับจำนวน session ด้วย
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MonthlyUsage', monthlyUsageSchema);
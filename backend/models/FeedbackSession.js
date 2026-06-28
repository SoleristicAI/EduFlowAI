const mongoose = require('mongoose');

const feedbackSessionSchema = new mongoose.Schema({
    schoolId: { type: String, required: true },
    title: { type: String, required: true }, // e.g., "Mid-Term Evaluation"
    isActive: { type: Boolean, default: true } // Admin can close it later
}, { timestamps: true });

module.exports = mongoose.model('FeedbackSession', feedbackSessionSchema);
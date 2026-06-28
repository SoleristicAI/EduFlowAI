const mongoose = require('mongoose');

const feedbackResponseSchema = new mongoose.Schema({
    schoolId: { type: String, required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackSession', required: true },
    studentId: { type: String, required: true },
    grade: { type: String, required: true },
    evaluations: [{
        teacherEmpId: String,
        teacherName: String,
        subject: String,
        rating: Number, // 1 to 5 Stars
        comment: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('FeedbackResponse', feedbackResponseSchema);
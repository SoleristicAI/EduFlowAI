const mongoose = require('mongoose');

const academicEventSchema = new mongoose.Schema({
    schoolId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    eventType: { 
        type: String, 
        enum: ['Holiday', 'Exam', 'PTM', 'Event'], 
        required: true 
    },
    date: { type: String, required: true }, // Format: "DD-MM-YYYY"
    rawDate: { type: Date, required: true } // Queries aur sorting ke liye absolute date
}, { timestamps: true });

module.exports = mongoose.model('AcademicEvent', academicEventSchema);
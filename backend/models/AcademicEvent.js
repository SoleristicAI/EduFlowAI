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
    date: { type: String, required: true },
    rawDate: { type: Date, required: true } ,
    session: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AcademicEvent', academicEventSchema);
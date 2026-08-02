const mongoose = require('mongoose');

const admitCardSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    datesheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Datesheet', required: true },
    batch: { type: String, required: true }, 
    examType: { type: String, required: true }, 
    instructions: { type: [String], default: [] },
    publishedAt: { type: Date, default: Date.now },
    session: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AdmitCard', admitCardSchema);
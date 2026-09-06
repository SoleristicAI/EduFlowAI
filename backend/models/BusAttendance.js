const mongoose = require('mongoose');

const busAttendanceSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true }, // Morning/Evening trip ko alag karega
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    date: { type: Date, default: Date.now },
    stopName: { type: String, required: true },
    tripType: { type: String, enum: ['MORNING', 'EVENING'], required: true },
dateStr: { type: String, required: true }, // Format: "YYYY-MM-DD" taaki date match fast ho
    records: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Present', 'Absent'], default: 'Present' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('BusAttendance', busAttendanceSchema);
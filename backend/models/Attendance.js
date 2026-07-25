const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }, 
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    grade: { type: String, required: true },
    date: { type: String, required: true }, 
    session: { type: String, required: true },
    records: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String },
        // 👇 YAHAN 'On Leave' ADD KIYA HAI 👇
        status: { type: String, enum: ['Present', 'Absent', 'Late', 'On Leave'], default: 'Present' },
        onLeave: { type: Boolean, default: false } // History tracking ke liye flag
    }]
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
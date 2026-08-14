const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    grade: { type: String, required: true }, 
    schedule: [
        {
            day: { 
                type: String, 
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                required: true
            },
            periods: [
                {
                    startTime: { type: String, required: true },
                    endTime: { type: String, required: true },
                    subject: { type: String, required: true },
                    room: { type: String, default: "N/A" }, 
                    teacherEmpId: { type: String, required: true } 
                }
            ]
        }
    ]
}, { timestamps: true });

// 🔥 MASTER FIX 1: Compound Unique Index 🔥
// Iska matlab hai: Ek school mein ek class (e.g. 10-A) ka ek hi timetable hoga, 
// par alag-alag schools aapas mein "10-A" rakh sakte hain bina kisi crash ke!
timetableSchema.index({ schoolId: 1, grade: 1 }, { unique: true });

const Timetable = mongoose.model('Timetable', timetableSchema);

// 🔥 MASTER FIX 2: Auto-Drop Bad Index 🔥
// Ye line tere MongoDB mein ghus kar us purane 'grade_1' wale kachre ko automatically uda degi
// taaki tujhe MongoDB Compass khol kar manual delete na karna pade!
Timetable.collection.dropIndex('grade_1').catch(err => {
});

module.exports = Timetable;
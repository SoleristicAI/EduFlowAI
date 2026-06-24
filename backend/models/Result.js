const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    schoolId: { type: String, required: true },
    initiatorId: { type: String, required: true }, // Class Teacher EMP ID
    examTitle: { type: String, required: true }, 
    grade: { type: String, required: true }, // Base grade e.g., '9'
    maxMarks: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'published'], default: 'pending' },

    subjects: [{
        subjectName: { type: String, required: true },
        assignedTeachers: [{ type: String }], // Subject Teacher EMP IDs
        isSubmitted: { type: Boolean, default: false },
        submittedBy: { type: String } 
    }],

    studentMarks: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        enrollmentNo: { type: String },
        name: { type: String },
        marks: [{
            subjectName: { type: String },
            status: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
            marksObtained: { type: Number, default: 0 }
        }]
    }]
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const { protect } = require('../middleware/authMiddleware');

// 1. Class Teacher Initiates Result Request
router.post('/initiate', protect, async (req, res) => {
    try {
        const { examTitle, grade, maxMarks } = req.body;
        const schoolId = req.user.schoolId;
        const initiatorId = req.user.employeeId;

        const existing = await Result.findOne({ schoolId, grade, examTitle });
        if (existing) return res.status(400).json({ message: "Request already active!" });

        // Fetch Timetable to know who teaches what in this class
        const timetable = await Timetable.findOne({ schoolId, grade: new RegExp(`^${grade}(-[A-Za-z])?$`, 'i') });
        if (!timetable) return res.status(404).json({ message: "Timetable not found for mapping subjects." });

        // --- EXACT SYLLABUS LOGIC ---
        const subjectMap = {};
        timetable.schedule.forEach(day => {
            day.periods.forEach(p => {
                // YAHAN p.teacherEmpId USE KARNA HAI (Not teacherId)
                if (p.subject && p.subject !== 'Break' && p.teacherEmpId) {
                    if (!subjectMap[p.subject]) subjectMap[p.subject] = new Set();
                    subjectMap[p.subject].add(p.teacherEmpId);
                }
            });
        });

        const subjectsData = Object.keys(subjectMap).map(sub => ({
            subjectName: sub,
            assignedTeachers: Array.from(subjectMap[sub]) // Array of teacherEmpId
        }));

        // Fetch students for grid
        const students = await User.find({ schoolId, role: 'student', grade: new RegExp(`^${grade}(-[A-Za-z])?$`, 'i') }).select('_id enrollmentNo name');

        const studentMarksData = students.map(st => ({
            studentId: st._id,
            enrollmentNo: st.enrollmentNo,
            name: st.name,
            marks: []
        }));

        const newResult = await Result.create({
            schoolId, initiatorId, examTitle, grade, maxMarks,
            subjects: subjectsData, studentMarks: studentMarksData
        });

        res.status(201).json({ message: "Initiated!", data: newResult });
    } catch (error) { res.status(500).json({ message: "Failed to initiate." }); }
});

// 2. Fetch pending requests for Subject Teacher
router.get('/pending', protect, async (req, res) => {
    try {
        const empId = req.user.employeeId;

        // Exact Syllabus logic: $elemMatch use karke perfect array filtering
        const pending = await Result.find({
            schoolId: req.user.schoolId,
            status: 'pending',
            'subjects': {
                $elemMatch: {
                    assignedTeachers: empId,
                    isSubmitted: false
                }
            }
        }).sort({ createdAt: -1 });

        res.json(pending);
    } catch (error) {
        res.status(500).json({ message: "Error fetching pending requests." });
    }
});

// 3. Monitor Hub (For Class Teachers)
router.get('/monitor/:grade', protect, async (req, res) => {
    try {
        const grade = req.params.grade.split('-')[0].trim();
        const managed = await Result.find({ schoolId: req.user.schoolId, grade }).sort({ createdAt: -1 });
        res.json(managed);
    } catch (error) { res.status(500).json({ message: "Error fetching monitor data." }); }
});

// 4. Submit/Update Marks (Subject Teacher)
router.put('/submit-marks/:resultId', protect, async (req, res) => {
    try {
        const { subjectName, studentMarks } = req.body;
        const result = await Result.findById(req.params.resultId);
        if (!result) return res.status(404).json({ message: "Result record not found" });

        // --- SECURITY VALIDATION ---
        const maxMarks = result.maxMarks;
        const isInvalid = studentMarks.some(sm => sm.marksObtained > maxMarks);
        if (isInvalid) return res.status(400).json({ message: `Marks cannot exceed ${maxMarks}` });
        
        // Update logic: Dhoondho aur update karo, nahi mila toh push karo
        result.studentMarks.forEach(student => {
            const incomingMark = studentMarks.find(sm => sm.studentId === student.studentId.toString());
            if (incomingMark) {
                const existingSubIdx = student.marks.findIndex(m => m.subjectName === subjectName);
                if (existingSubIdx > -1) {
                    // YAHAN PUSH KI JAGAH UPDATE KARO
                    student.marks[existingSubIdx].marksObtained = incomingMark.marksObtained;
                    student.marks[existingSubIdx].status = incomingMark.status;
                } else {
                    // Agar subject pehli baar add ho raha hai
                    student.marks.push({
                        subjectName,
                        marksObtained: incomingMark.marksObtained,
                        status: incomingMark.status
                    });
                }
            }
        });

        const sub = result.subjects.find(s => s.subjectName === subjectName);
        if (sub) {
            sub.isSubmitted = true;
            sub.submittedBy = req.user.employeeId;
        }

        await result.save();
        res.json({ message: "Marks locked and synced!" });
    } catch (error) { res.status(500).json({ message: "Failed to submit marks." }); }
});

// 5. CLASS TEACHER: Publish Result to Students
router.put('/publish/:resultId', protect, async (req, res) => {
    try {
        const result = await Result.findById(req.params.resultId);
        if (!result) return res.status(404).json({ message: "Result not found." });
        
        result.status = 'published';
        await result.save();
        
        res.json({ message: "Results Published to Student Dashboards!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to publish results." });
    }
});

// 6. CLASS TEACHER: Delete Entire Result Collection
router.delete('/:resultId', protect, async (req, res) => {
    try {
        await Result.findByIdAndDelete(req.params.resultId);
        res.json({ message: "Result Collection Deleted Permanently!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete result." });
    }
});

module.exports = router;
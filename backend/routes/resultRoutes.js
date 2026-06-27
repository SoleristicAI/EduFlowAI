const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const School = require('../models/School');
const { protect } = require('../middleware/authMiddleware');

// 1. Class Teacher Initiates Result Request
router.post('/initiate', protect, async (req, res) => {
    try {
        const { examTitle, grade, maxMarks } = req.body;
        const schoolId = req.user.schoolId;
        const initiatorId = req.user.employeeId;

        const existing = await Result.findOne({ schoolId, grade, examTitle });
        if (existing) return res.status(400).json({ message: "Request already active!" });

        const baseGrade = grade.split('-')[0].trim();
        const timetable = await Timetable.findOne({ schoolId, grade: new RegExp(`^${baseGrade}(-[A-Za-z])?$`, 'i') });
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

        const students = await User.find({ schoolId, role: 'student', grade: grade }).select('_id enrollmentNo name');

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
        const exactGrade = req.params.grade.trim(); // "9-A" pura use hoga
        const managed = await Result.find({ schoolId: req.user.schoolId, grade: exactGrade }).sort({ createdAt: -1 });
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

// 7. STUDENT: Fetch published results for their specific base grade
router.get('/my-results', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const studentGrade = req.user.grade?.trim();

        if (!studentGrade) {
            return res.status(400).json({
                message: "Student grade configuration missing."
            });
        }

        // School fetch
        const school = await School.findById(schoolId).select("schoolName logo");

        const results = await Result.find({
            schoolId,
            grade: studentGrade,
            status: 'published'
        }).sort({ createdAt: -1 });

        const preppedResults = results.map((resObj) => {
            const studentTotals = resObj.studentMarks.map(sm => {
                const total = sm.marks.reduce(
                    (acc, curr) =>
                        acc + (curr.status === "Present" ? curr.marksObtained : 0),
                    0
                );

                return {
                    studentId: sm.studentId.toString(),
                    total
                };
            });

            // Rank sorting
            studentTotals.sort((a, b) => b.total - a.total);

            const myIdStr = req.user._id.toString();
            const myRankIndex = studentTotals.findIndex(
                st => st.studentId === myIdStr
            );

            const myRank = myRankIndex !== -1 ? myRankIndex + 1 : "N/A";

            const myMarksSubDoc = resObj.studentMarks.find(
                sm => sm.studentId.toString() === myIdStr
            );

            if (!myMarksSubDoc) return null;

            const myMarks = myMarksSubDoc.marks;

            let totalObtained = 0;
            let grandTotal = 0;
            let percentage = 0;

            if (myMarks.length > 0) {
                totalObtained = myMarks.reduce(
                    (acc, curr) =>
                        acc + (curr.status === "Present" ? curr.marksObtained : 0),
                    0
                );

                grandTotal = resObj.maxMarks * myMarks.length;

                percentage = (
                    (totalObtained / grandTotal) *
                    100
                ).toFixed(2);
            }

            return {
                _id: resObj._id,
                examTitle: resObj.examTitle,
                grade: resObj.grade,
                maxMarks: resObj.maxMarks,
                myMarks,
                totalObtained,
                grandTotal,
                percentage,
                rank: myRank,
                totalStudents: studentTotals.length,

                // NEW
                schoolName: school?.schoolName || "School Name",
                schoolLogo: school?.logo || null
            };
        });
        res.json(preppedResults.filter(Boolean));

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch exam results: " + error.message
        });
    }
});

// Add this to your resultRoutes.js file
router.get('/my-performance', protect, async (req, res) => {
    try {
        const studentId = req.user._id;
        
        // Results wahi fetch karo jo 'published' hain
        const results = await Result.find({ 
            'studentMarks.studentId': studentId,
            status: 'published' 
        });

        // Data ko Frontend ke liye map karo
        const formattedData = results.map(resObj => {
            const myData = resObj.studentMarks.find(sm => sm.studentId.toString() === studentId.toString());
            
            return {
                examTitle: resObj.examTitle,
                date: resObj.createdAt ? new Date(resObj.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A',
                subjects: myData ? myData.marks.map(m => ({
                    subjectName: m.subjectName,
                    marksObtained: Number(m.marksObtained),
                    maxMarks: Number(resObj.maxMarks)
                })) : []
            };
        });

        res.json(formattedData);
    } catch (error) {
        console.error("Performance Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch performance data." });
    }
});

// Admin/Teacher: Fetch Specific Student's Performance
router.get('/student-performance/:studentId', protect, async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Find published results for this specific student
        const results = await Result.find({ 
            'studentMarks.studentId': studentId,
            status: 'published' 
        });

        const formattedData = results.map(resObj => {
            const myData = resObj.studentMarks.find(sm => sm.studentId.toString() === studentId.toString());
            
            return {
                examTitle: resObj.examTitle,
                date: resObj.createdAt ? new Date(resObj.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A',
                subjects: myData ? myData.marks.map(m => ({
                    subjectName: m.subjectName,
                    marksObtained: Number(m.marksObtained),
                    maxMarks: Number(resObj.maxMarks)
                })) : []
            };
        });

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch student performance." });
    }
});

module.exports = router;
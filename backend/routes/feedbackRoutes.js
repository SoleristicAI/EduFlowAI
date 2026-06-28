const express = require('express');
const router = express.Router();
const FeedbackSession = require('../models/FeedbackSession');
const FeedbackResponse = require('../models/FeedbackResponse');
const { protect } = require('../middleware/authMiddleware');
const Timetable = require('../models/Timetable');
const User = require('../models/User');

// -----------------------------------------
// ADMIN ROUTES
// -----------------------------------------

// 1. Create a new Feedback Session
router.post('/create-session', protect, async (req, res) => {
    try {
        const { title } = req.body;
        const newSession = await FeedbackSession.create({
            schoolId: req.user.schoolId,
            title
        });
        res.status(201).json({ message: "Feedback Request Broadcasted!", data: newSession });
    } catch (error) {
        res.status(500).json({ message: "Failed to broadcast feedback request." });
    }
});

// 2. Get all Feedback Sessions for Admin
router.get('/sessions', protect, async (req, res) => {
    try {
        const sessions = await FeedbackSession.find({ schoolId: req.user.schoolId }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch feedback sessions." });
    }
});

// 3. Toggle Session Status (Active/Inactive)
router.put('/toggle-session/:id', protect, async (req, res) => {
    try {
        const session = await FeedbackSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: "Session not found." });

        session.isActive = !session.isActive;
        await session.save();
        res.json({ message: `Feedback session ${session.isActive ? 'Activated' : 'Closed'}!` });
    } catch (error) {
        res.status(500).json({ message: "Failed to update session." });
    }
});

// 4. Delete Session permanently
router.delete('/session/:id', protect, async (req, res) => {
    try {
        await FeedbackSession.findByIdAndDelete(req.params.id);
        // Wipe all responses linked to this session too
        await FeedbackResponse.deleteMany({ sessionId: req.params.id });
        res.json({ message: "Feedback session and all related records deleted." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete session." });
    }
});

// 5. Get Active Sessions for Dropdown
router.get('/active-sessions', protect, async (req, res) => {
    try {
        const sessions = await FeedbackSession.find({ schoolId: req.user.schoolId, isActive: true }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch active sessions." });
    }
});

// 5. Get Aggregated Results for a specific Session (Admin Only)
router.get('/session-results/:sessionId', protect, async (req, res) => {
    try {
        const responses = await FeedbackResponse.find({ sessionId: req.params.sessionId });

        const teacherMap = {};

        responses.forEach(resp => {
            resp.evaluations.forEach(ev => {
                if (!teacherMap[ev.teacherEmpId]) {
                    teacherMap[ev.teacherEmpId] = {
                        teacherEmpId: ev.teacherEmpId,
                        teacherName: ev.teacherName,
                        totalRating: 0,
                        count: 0,
                        comments: []
                    };
                }
                teacherMap[ev.teacherEmpId].totalRating += ev.rating;
                teacherMap[ev.teacherEmpId].count += 1;
                
                if (ev.comment && ev.comment.trim() !== '') {
                    teacherMap[ev.teacherEmpId].comments.push(ev.comment);
                }
            });
        });

        const results = Object.values(teacherMap).map(t => ({
            teacherEmpId: t.teacherEmpId,
            teacherName: t.teacherName,
            averageRating: (t.totalRating / t.count).toFixed(1),
            totalReviews: t.count,
            comments: t.comments
        }));

        // Sort by highest rated teachers first
        results.sort((a, b) => b.averageRating - a.averageRating);

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch session results." });
    }
});

// 6. Get Teachers specifically teaching this student's Grade
router.get('/my-teachers', protect, async (req, res) => {
    try {
        const studentGrade = req.user.grade?.trim();
        const timetable = await Timetable.findOne({ schoolId: req.user.schoolId, grade: studentGrade });
        
        if (!timetable) {
            return res.status(404).json({ message: "Timetable not found for your class." });
        }

        // 1. Saare teachers ki list uthao taaki real name map kar sakein
        const allTeachers = await User.find({ 
            schoolId: req.user.schoolId, 
            role: 'teacher' 
        }).select('employeeId name');

        const teacherMap = {};
        
        // 2. Timetable check karo aur unique teachers nikalo
        timetable.schedule.forEach(day => {
            day.periods.forEach(p => {
                if (p.subject && p.subject !== 'Break' && p.teacherEmpId) {
                    
                    // Asli naam find karo User collection ki list se
                    const prof = allTeachers.find(t => t.employeeId === p.teacherEmpId);
                    const realName = prof ? prof.name : "Unknown Faculty";

                    teacherMap[p.teacherEmpId] = {
                        teacherEmpId: p.teacherEmpId,
                        teacherName: realName
                        // Subject yahan se hata diya gaya hai teri demand ke hisaab se
                    };
                }
            });
        });

        res.json(Object.values(teacherMap));
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch teachers." });
    }
});

// 7. Check if student already submitted feedback for selected session
router.get('/check-status/:sessionId', protect, async (req, res) => {
    try {
        const response = await FeedbackResponse.findOne({ 
            sessionId: req.params.sessionId, 
            studentId: req.user._id 
        });
        res.json({ submitted: !!response });
    } catch (error) {
        res.status(500).json({ message: "Error checking status." });
    }
});

// 8. Submit Feedback
router.post('/submit', protect, async (req, res) => {
    try {
        const { sessionId, evaluations } = req.body;
        
        const existing = await FeedbackResponse.findOne({ sessionId, studentId: req.user._id });
        if (existing) {
            return res.status(400).json({ message: "Feedback already submitted for this session!" });
        }

        await FeedbackResponse.create({
            schoolId: req.user.schoolId,
            sessionId,
            studentId: req.user._id,
            grade: req.user.grade,
            evaluations
        });

        res.status(201).json({ message: "Feedback submitted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to submit feedback." });
    }
});

module.exports = router;
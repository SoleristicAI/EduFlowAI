const express = require('express');
const router = express.Router();
const AdmitCard = require('../models/AdmitCard');
const Datesheet = require('../models/Datesheet');
const School = require('../models/School');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. Fetch available datesheets for dropdown (Filtered by Session)
router.get('/available-datesheets', protect, adminOnly, async (req, res) => {
    try {
        const school = await School.findById(req.user.schoolId);
        const targetSession = school?.activeSession || '2026-2027';
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const datesheets = await Datesheet.find({ 
            schoolId: req.user.schoolId,
            ...sessionFilter,
            $expr: { $gt: [{ $size: { $ifNull: ["$schedule", []] } }, 0] } 
        }).sort({ createdAt: -1 });
        res.json(datesheets);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch datesheets." });
    }
});

// 2. Publish Admit Card Event (Tagged with Session)
router.post('/publish', protect, adminOnly, async (req, res) => {
    try {
        const { datesheetId, batch, examType, instructions } = req.body;
        const school = await School.findById(req.user.schoolId);
        
        const existing = await AdmitCard.findOne({ datesheetId, schoolId: req.user.schoolId });
        if (existing) {
            return res.status(400).json({ message: "Admit Card for this Datesheet is already published!" });
        }

        const newAdmitCard = await AdmitCard.create({
            schoolId: req.user.schoolId,
            datesheetId,
            batch,
            examType,
            instructions,
            session: school?.activeSession || '2026-2027' // 🔥 Tagged
        });

        res.status(201).json({ message: "Admit Cards Published to Students! 🚀", data: newAdmitCard });
    } catch (error) {
        res.status(500).json({ message: "Failed to publish Admit Cards." });
    }
});

// 3. ADMIN: Fetch all published admit cards (Filtered by Session)
router.get('/all', protect, adminOnly, async (req, res) => {
    try {
        const school = await School.findById(req.user.schoolId);
        const targetSession = school?.activeSession || '2026-2027';
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const admitCards = await AdmitCard.find({ schoolId: req.user.schoolId, ...sessionFilter })
            .populate('datesheetId', 'title classes') 
            .sort({ createdAt: -1 });
        res.json(admitCards);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch admit cards." });
    }
});

// 4. ADMIN: Delete a specific admit card
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        await AdmitCard.findByIdAndDelete(req.params.id);
        res.json({ message: "Admit Card deleted permanently." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete admit card." });
    }
});

// 5. STUDENT: Fetch Admit Cards specific to their grade (Filtered by Session)
router.get('/my-admitcards', protect, async (req, res) => {
    try {
        const studentGrade = req.user.grade;
        if (!studentGrade) return res.status(400).json({ message: "Student grade missing." });

        const schoolDoc = await School.findById(req.user.schoolId).select('schoolName logo activeSession');
        const targetSession = schoolDoc?.activeSession || '2026-2027';
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const baseGrade = String(studentGrade).split('-')[0].trim().toUpperCase();

        const admitCards = await AdmitCard.find({ schoolId: req.user.schoolId, ...sessionFilter })
            .populate({
                path: 'datesheetId',
                match: { classes: { $in: [studentGrade.toUpperCase(), baseGrade] } }
            })
            .sort({ createdAt: -1 })
            .lean(); 

        const validAdmitCards = admitCards.filter(ac => ac.datesheetId !== null);

        const responseData = validAdmitCards.map(ac => ({
            ...ac,
            schoolName: schoolDoc?.schoolName || "EduFlowAI Public School",
            schoolLogo: schoolDoc?.logo || null
        }));

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch admit cards." });
    }
});

module.exports = router;
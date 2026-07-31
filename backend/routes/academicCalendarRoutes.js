const express = require('express');
const router = express.Router();
const AcademicEvent = require('../models/AcademicEvent');
const { protect } = require('../middleware/authMiddleware');

// 1. Declare a New Academic Event
router.post('/declare', protect, async (req, res) => {
    try {
        const { title, description, eventType, date } = req.body;
        const schoolId = req.user.schoolId;

        // Fetch School for activeSession
        const School = require('../models/School');
        const school = await School.findById(schoolId);

        const [day, month, year] = date.split('-');
        const targetDate = new Date(year, month - 1, day);
        targetDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (targetDate < today) {
            return res.status(400).json({ message: "Cannot declare events on past dates! ⚠️" });
        }

        const newEvent = await AcademicEvent.create({
            schoolId,
            title,
            description,
            eventType,
            date,
            rawDate: targetDate,
            session: school.activeSession // 🔥 Tagging the event with current year
        });

        res.status(201).json({ message: "Event Declared Successfully! 📅", data: newEvent });
    } catch (error) {
        res.status(500).json({ message: "Failed to declare academic event." });
    }
});

// 2. Fetch Events with Session Travel
router.get('/all-events', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const requestedSession = req.query.session;
        
        const School = require('../models/School');
        const school = await School.findById(schoolId);
        
        const targetSession = requestedSession || school.activeSession;
        
        // Legacy Support: Puraane events jisme session nahi hai unko 2026-2027 mein daal do
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const events = await AcademicEvent.find({ schoolId, ...sessionFilter }).sort({ rawDate: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch calendar events." });
    }
});

// 3. Delete Single Event
router.delete('/:id', protect, async (req, res) => {
    try {
        await AcademicEvent.findByIdAndDelete(req.params.id);
        res.json({ message: "Event Deleted Successfully! 🗑️" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete event." });
    }
});

// 4. GLOBAL RESET: Wipe ONLY the Selected Academic Year
router.delete('/actions/reset-year', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const targetSession = req.query.session; // Frontend batayega konsa saal udana hai
        
        if(!targetSession) return res.status(400).json({message: "Session missing for reset."});

        await AcademicEvent.deleteMany({ schoolId, session: targetSession });
        
        // Agar main year hai toh purana ganda data bhi saaf kardo
        if(targetSession === '2026-2027') {
            await AcademicEvent.deleteMany({ schoolId, session: { $exists: false } });
        }
        
        res.json({ message: `Academic Calendar for ${targetSession} Reset Successful! 🧹` });
    } catch (error) {
        res.status(500).json({ message: "Failed to reset academic calendar." });
    }
});

module.exports = router;
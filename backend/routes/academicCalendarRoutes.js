const express = require('express');
const router = express.Router();
const AcademicEvent = require('../models/AcademicEvent');
const { protect } = require('../middleware/authMiddleware');

// 1. Declare a New Academic Event (With Past Date Prevention)
router.post('/declare', protect, async (req, res) => {
    try {
        const { title, description, eventType, date } = req.body;
        const schoolId = req.user.schoolId;

        // Parse DD-MM-YYYY string to JavaScript Date Object for verification
        const [day, month, year] = date.split('-');
        const targetDate = new Date(year, month - 1, day);
        targetDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Security Guard: Prevent past date selections
        if (targetDate < today) {
            return res.status(400).json({ message: "Cannot declare events on past dates! ⚠️" });
        }

        const newEvent = await AcademicEvent.create({
            schoolId,
            title,
            description,
            eventType,
            date,
            rawDate: targetDate
        });

        res.status(201).json({ message: "Event Declared Successfully! 📅", data: newEvent });
    } catch (error) {
        res.status(500).json({ message: "Failed to declare academic event." });
    }
});

// 2. Fetch All Declared Events for the Admin
router.get('/all-events', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        
        // Sorting: Subse pehle aane wale events upar dikhenge
        const events = await AcademicEvent.find({ schoolId }).sort({ rawDate: 1 });
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

// 4. GLOBAL RESET: Wipe Entire Academic Year Calendar for this School
router.delete('/actions/reset-year', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        await AcademicEvent.deleteMany({ schoolId });
        res.json({ message: "Academic Year Calendar Reset Successful! 🧹 All events cleared." });
    } catch (error) {
        res.status(500).json({ message: "Failed to reset academic calendar." });
    }
});

module.exports = router;
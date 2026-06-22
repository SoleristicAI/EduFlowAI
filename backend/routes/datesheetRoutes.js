const express = require('express');
const router = express.Router();
const Datesheet = require('../models/Datesheet');
const Timetable = require('../models/Timetable');
const { protect, adminOnly } = require('../middleware/authMiddleware');
// --- 1. THE AUTO-GENERATION ENGINE (UPDATED WITH SMART REGEX & SHUFFLE) ---
router.post('/generate-preview', protect, adminOnly, async (req, res) => {
    try {
        const { title, classes, startDate, gapDays, timing, resultDate, notes, signatures } = req.body;
        const schoolId = req.user.schoolId;

        const School = require('../models/School');
        const schoolDoc = await School.findById(schoolId);
        const schoolName = schoolDoc ? schoolDoc.schoolName : "EduFlowAI Public School";

        const classSubjectsMap = {};

        for (let cls of classes) {
            // SMART REGEX: Agar cls '9' hai, toh ye '9-A', '9-B' ya '9' sab check karega aur pehla uthayega
            const timetable = await Timetable.findOne({ 
                grade: new RegExp(`^${cls}(-[A-Za-z])?$`, 'i'), 
                schoolId 
            });
            
            const subjectsSet = new Set();
            if (timetable) {
                timetable.schedule.forEach(day => {
                    day.periods.forEach(p => {
                        if (p.subject && p.subject !== 'Break') subjectsSet.add(p.subject);
                    });
                });
            }

            let subjectsArray = Array.from(subjectsSet);
            if (subjectsArray.length === 0) {
                subjectsArray = ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi'];
            }
            
            // --- SHUFFLE LOGIC ---
            // Isse har class ka exam alag din hoga, ek line mein same subjects nahi aayenge
            subjectsArray = subjectsArray.sort(() => Math.random() - 0.5);
            
            classSubjectsMap[cls] = subjectsArray;
        }

        const maxSubjects = Math.max(...Object.values(classSubjectsMap).map(arr => arr.length));

        let schedule = [];
        let currentDate = new Date(startDate);
        const gaps = gapDays ? parseInt(gapDays) : 0;

        for (let i = 0; i < maxSubjects; i++) {
            while (currentDate.getDay() === 0) {
                currentDate.setDate(currentDate.getDate() + 1); // Skip Sunday
            }

            const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
            const dayName = currentDate.toLocaleDateString('en-GB', { weekday: 'long' });

            let row = {
                date: formattedDate,
                day: dayName,
                classExams: {}
            };

            classes.forEach(cls => {
                row.classExams[cls] = classSubjectsMap[cls][i] || '-';
            });

            schedule.push(row);
            currentDate.setDate(currentDate.getDate() + gaps + 1);
        }

        res.json({ schedule, schoolName });
    } catch (error) {
        res.status(500).json({ message: "Generation failed: " + error.message });
    }
});

// --- 2. NAYA ROUTE: FETCH LIVE SUBJECTS FOR MANUAL WIZARD ---
router.get('/class-subjects/:baseClass', protect, adminOnly, async (req, res) => {
    try {
        const baseClass = req.params.baseClass;
        // Same Smart Regex Logic
        const timetable = await Timetable.findOne({
            schoolId: req.user.schoolId,
            grade: new RegExp(`^${baseClass}(-[A-Za-z])?$`, 'i')
        });

        const subjectsSet = new Set();
        if (timetable) {
            timetable.schedule.forEach(day => {
                day.periods.forEach(p => {
                    if (p.subject && p.subject !== 'Break') subjectsSet.add(p.subject);
                });
            });
        }
        let subjectsArray = Array.from(subjectsSet);
        if (subjectsArray.length === 0) {
            subjectsArray = ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi'];
        }
        res.json(subjectsArray);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch subjects." });
    }
});

router.post('/save', protect, adminOnly, async (req, res) => {
    try {
        const newDatesheet = await Datesheet.create({ ...req.body, schoolId: req.user.schoolId });
        res.status(201).json({ message: "Datesheet Published!", data: newDatesheet });
    } catch (error) {
        res.status(500).json({ message: "Save failed." });
    }
});

// Manual Upload Save Route (Upgraded with Scheduler Matrix)
router.post('/save-manual', protect, adminOnly, async (req, res) => {
    try {
        const { title, classes, fileData, schedule, timing, signatures } = req.body;
        
        if (!fileData) return res.status(400).json({ message: "No PDF/Image file provided!" });

        const newDatesheet = await Datesheet.create({ 
            schoolId: req.user.schoolId,
            title,
            classes, // Base classes array e.g., ["9", "10"]
            isManual: true,
            fileUrl: fileData,
            schedule: schedule || [], // Saves the matrix built by wizard
            timing: timing || "Refer to Document",
            signatures: signatures || { incharge: '' }
        });

        res.status(201).json({ message: "Manual Datesheet Published with Matrix!", data: newDatesheet });
    } catch (error) {
        res.status(500).json({ message: "Failed to publish manual datesheet." });
    }
});

// 3. STUDENT: Fetch Datesheet for their specific class (SMART BASE-CLASS MATCH)
router.get('/my-datesheet', protect, async (req, res) => {
    try {
        const studentGrade = req.user.grade;
        
        if (!studentGrade) {
            return res.status(400).json({ message: "Student grade configuration missing." });
        }

        // DYNAMIC SCHOOL NAME FETCHING
        const School = require('../models/School');
        const schoolDoc = await School.findById(req.user.schoolId);
        const schoolName = schoolDoc ? schoolDoc.schoolName : "EduFlowAI Public School";

        // --- SMART LOGIC: "9-A" ko "9" mein badlo ---
        const baseGrade = String(studentGrade).split('-')[0].trim().toUpperCase();

        // '.lean()' use kiya hai taaki Mongoose document normal JSON object ban jaye
        let datesheets = await Datesheet.find({
            schoolId: req.user.schoolId,
            // $in check karega: Agar datesheet "9-A" ki bani hai ya "9" ki, dono dikha dega!
            classes: { $in: [studentGrade.toUpperCase(), baseGrade] }
        }).lean().sort({ createdAt: -1 });

        // Har datesheet payload mein schoolName attach kar do
        datesheets = datesheets.map(ds => ({ ...ds, schoolName }));

        res.json(datesheets);
    } catch (error) {
        res.status(500).json({ message: "Neural Link Error: Failed to fetch datesheet." });
    }
});

// 4. ADMIN: Fetch all published datesheets (AI & Manual)
router.get('/all', protect, adminOnly, async (req, res) => {
    try {
        const datesheets = await Datesheet.find({ schoolId: req.user.schoolId }).sort({ createdAt: -1 });
        res.json(datesheets);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch datesheets." });
    }
});

// 5. ADMIN: Delete a specific datesheet
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        await Datesheet.findByIdAndDelete(req.params.id);
        res.json({ message: "Datesheet deleted permanently." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete datesheet." });
    }
});

// 6. TEACHER: Fetch all published datesheets for the school with identity population
router.get('/teacher-datesheets', protect, async (req, res) => {
    try {
        const School = require('../models/School');
        const schoolDoc = await School.findById(req.user.schoolId);
        const schoolName = schoolDoc ? schoolDoc.schoolName : "EduFlowAI Public School";

        // School ki saari current exam schedules fetch karo
        let datesheets = await Datesheet.find({
            schoolId: req.user.schoolId
        }).lean().sort({ createdAt: -1 });

        // Document matrices mein object parameters append karo
        datesheets = datesheets.map(ds => ({ ...ds, schoolName }));

        res.json(datesheets);
    } catch (error) {
        res.status(500).json({ message: "Neural Link Error: Failed to fetch institutional schedules." });
    }
});


module.exports = router;
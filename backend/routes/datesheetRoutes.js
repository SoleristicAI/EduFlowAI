const express = require('express');
const router = express.Router();
const Datesheet = require('../models/Datesheet');
const Timetable = require('../models/Timetable');
const School = require('../models/School');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// --- 1. THE AUTO-GENERATION ENGINE ---
router.post('/generate-preview', protect, adminOnly, async (req, res) => {
    try {
        const { title, classes, startDate, gapDays, timing, resultDate, notes, signatures } = req.body;
        const schoolId = req.user.schoolId;

        const schoolDoc = await School.findById(schoolId);
        const schoolName = schoolDoc ? schoolDoc.schoolName : "EduFlowAI Public School";

        const classSubjectsMap = {};

        for (let cls of classes) {
            // 🔥 NAYA FIX: findOne ki jagah find() lagaya taaki A, B, C sab sections cover ho jayein 🔥
            const timetables = await Timetable.find({ 
                grade: new RegExp(`^${cls}(-[A-Za-z])?$`, 'i'), 
                schoolId 
            });
            
            const subjectsSet = new Set();
            
            if (timetables && timetables.length > 0) {
                // Har section (10-A, 10-B) ke andar ghuso
                timetables.forEach(timetable => {
                    timetable.schedule.forEach(day => {
                        day.periods.forEach(p => {
                            if (p.subject && p.subject.toLowerCase() !== 'break') {
                                // UpperCase mein convert karke Set mein dalo taaki case-sensitive duplicates na bane
                                subjectsSet.add(p.subject.trim().toUpperCase());
                            }
                        });
                    });
                });
            }

            let subjectsArray = Array.from(subjectsSet);
            if (subjectsArray.length === 0) {
                subjectsArray = ['ENGLISH', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE', 'HINDI'];
            }
            
            // Subjects ko shuffle (randomize) kardo
            subjectsArray = subjectsArray.sort(() => Math.random() - 0.5);
            classSubjectsMap[cls] = subjectsArray;
        }

        const maxSubjects = Math.max(...Object.values(classSubjectsMap).map(arr => arr.length));

        let schedule = [];
        let currentDate = new Date(startDate);
        const gaps = gapDays ? parseInt(gapDays) : 0;

        for (let i = 0; i < maxSubjects; i++) {
            while (currentDate.getDay() === 0) { // Sunday skip
                currentDate.setDate(currentDate.getDate() + 1); 
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
        
        // 🔥 NAYA FIX: Yahan bhi find() lagaya taaki Manual Datesheet mein bhi saare subjects aayein 🔥
        const timetables = await Timetable.find({
            schoolId: req.user.schoolId,
            grade: new RegExp(`^${baseClass}(-[A-Za-z])?$`, 'i')
        });

        const subjectsSet = new Set();
        if (timetables && timetables.length > 0) {
            timetables.forEach(timetable => {
                timetable.schedule.forEach(day => {
                    day.periods.forEach(p => {
                        if (p.subject && p.subject.toLowerCase() !== 'break') {
                            subjectsSet.add(p.subject.trim().toUpperCase());
                        }
                    });
                });
            });
        }
        
        let subjectsArray = Array.from(subjectsSet);
        if (subjectsArray.length === 0) {
            subjectsArray = ['ENGLISH', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE', 'HINDI'];
        }
        
        res.json(subjectsArray);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch subjects." });
    }
});

// Save AI Datesheet
router.post('/save', protect, adminOnly, async (req, res) => {
    try {
        const school = await School.findById(req.user.schoolId);
        const newDatesheet = await Datesheet.create({ 
            ...req.body, 
            schoolId: req.user.schoolId,
            session: school?.activeSession || '2026-2027' // 🔥 Tagged
        });
        res.status(201).json({ message: "Datesheet Published!", data: newDatesheet });
    } catch (error) {
        res.status(500).json({ message: "Save failed." });
    }
});

// Save Manual Datesheet
router.post('/save-manual', protect, adminOnly, async (req, res) => {
    try {
        const { title, classes, fileData, schedule, timing, signatures } = req.body;
        if (!fileData) return res.status(400).json({ message: "No PDF/Image file provided!" });

        const school = await School.findById(req.user.schoolId);
        const newDatesheet = await Datesheet.create({ 
            schoolId: req.user.schoolId,
            title,
            classes, 
            isManual: true,
            fileUrl: fileData,
            schedule: schedule || [], 
            timing: timing || "Refer to Document",
            signatures: signatures || { incharge: '' },
            session: school?.activeSession || '2026-2027' // 🔥 Tagged
        });

        res.status(201).json({ message: "Manual Datesheet Published with Matrix!", data: newDatesheet });
    } catch (error) {
        res.status(500).json({ message: "Failed to publish manual datesheet." });
    }
});

// 3. STUDENT: Fetch Datesheet (Filtered by Session)
router.get('/my-datesheet', protect, async (req, res) => {
    try {
        const studentGrade = req.user.grade;
        if (!studentGrade) return res.status(400).json({ message: "Student grade missing." });

        const schoolDoc = await School.findById(req.user.schoolId);
        const schoolName = schoolDoc ? schoolDoc.schoolName : "EduFlowAI Public School";
        
        const targetSession = schoolDoc?.activeSession || '2026-2027';
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const baseGrade = String(studentGrade).split('-')[0].trim().toUpperCase();

        let datesheets = await Datesheet.find({
            schoolId: req.user.schoolId,
            classes: { $in: [studentGrade.toUpperCase(), baseGrade] },
            ...sessionFilter
        }).lean().sort({ createdAt: -1 });

        datesheets = datesheets.map(ds => ({ ...ds, schoolName }));
        res.json(datesheets);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch datesheet." });
    }
});

// 4. ADMIN: Fetch all published datesheets (Filtered by Session)
router.get('/all', protect, adminOnly, async (req, res) => {
    try {
        const school = await School.findById(req.user.schoolId);
        const targetSession = school?.activeSession || '2026-2027';
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const datesheets = await Datesheet.find({ schoolId: req.user.schoolId, ...sessionFilter }).sort({ createdAt: -1 });
        res.json(datesheets);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch datesheets." });
    }
});

// 5. ADMIN: Delete datesheet
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        await Datesheet.findByIdAndDelete(req.params.id);
        res.json({ message: "Datesheet deleted permanently." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete datesheet." });
    }
});

// 6. TEACHER: Fetch all datesheets (Filtered by Session)
router.get('/teacher-datesheets', protect, async (req, res) => {
    try {
        const schoolDoc = await School.findById(req.user.schoolId);
        const schoolName = schoolDoc ? schoolDoc.schoolName : "EduFlowAI Public School";
        
        const targetSession = schoolDoc?.activeSession || '2026-2027';
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        let datesheets = await Datesheet.find({
            schoolId: req.user.schoolId,
            ...sessionFilter
        }).lean().sort({ createdAt: -1 });

        datesheets = datesheets.map(ds => ({ ...ds, schoolName }));
        res.json(datesheets);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch institutional schedules." });
    }
});

module.exports = router;
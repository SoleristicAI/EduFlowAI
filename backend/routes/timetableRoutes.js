const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET: Fetch all teachers for dropdown (EMP ID + Subjects)
router.get('/teachers-list', protect, adminOnly, async (req, res) => {
    try {
        const teachers = await User.find({
            schoolId: req.user.schoolId,
            role: 'teacher'
        }).select('employeeId subjects name');
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching faculty data' });
    }
});

// POST: Create or Update Timetable with Conflict Detection
router.post('/upload', protect, adminOnly, async (req, res) => {
    const { grade, schedule } = req.body;
    const schoolId = req.user.schoolId;

    if (!grade || !schedule || schedule.length === 0) {
        return res.status(400).json({ message: "Invalid Matrix Data: Grade and Schedule required." });
    }

    try {
        const newDayData = schedule[0];
        const targetDay = newDayData.day;

        // --- NEURAL CONFLICT CHECK START ---
        // Pura school ka timetable uthao (Sirf is grade ko chhod kar jo hum upload kar rahe hain)
        const otherTimetables = await Timetable.find({ 
            schoolId, 
            grade: { $ne: grade.toUpperCase() } 
        });

        // Har ek period ko check karo conflict ke liye
        for (let i = 0; i < newDayData.periods.length; i++) {
            const period = newDayData.periods[i];
            const slotNum = i + 1; // 1-based Slot number for display

            for (const otherDoc of otherTimetables) {
                // Check karo agar doosri class ka us din ka schedule exist karta hai
                const dayMatch = otherDoc.schedule.find(s => s.day === targetDay);
                
                if (dayMatch) {
                    // 1. TEACHER CONFLICT: Kya ye teacher us time kisi aur class mein hai?
                    const teacherConflict = dayMatch.periods.find(p =>
                        p.teacherEmpId === period.teacherEmpId &&
                        p.startTime === period.startTime
                    );

                    if (teacherConflict) {
                        return res.status(400).json({
                            message: `This teacher is already assigned in Slot ${slotNum} to Class ${otherDoc.grade}! ⚠️`
                        });
                    }

                    // 2. ROOM CONFLICT: Kya ye room us time occupied hai?
                    const roomConflict = dayMatch.periods.find(p =>
                        p.room !== "N/A" && 
                        p.room.trim().toUpperCase() === period.room.trim().toUpperCase() &&
                        p.startTime === period.startTime
                    );

                    if (roomConflict) {
                        return res.status(400).json({
                            message: `This room is already assigned in Slot ${slotNum} to Class ${otherDoc.grade}! ⚠️`
                        });
                    }
                }
            }
        }
        // --- NEURAL CONFLICT CHECK END ---

        // Agar koi conflict nahi mila, toh save/update karo
        let timetable = await Timetable.findOne({ grade: grade.toUpperCase(), schoolId });

        if (timetable) {
            const dayIndex = timetable.schedule.findIndex(s => s.day === targetDay);
            if (dayIndex !== -1) {
                // Agar din pehle se hai, toh periods replace karo
                timetable.schedule[dayIndex].periods = newDayData.periods;
            } else {
                // Naya din add karo
                timetable.schedule.push(newDayData);
            }
            await timetable.save();
        } else {
            // Nayi class ka naya document banao
            timetable = await Timetable.create({ 
                schoolId, 
                grade: grade.toUpperCase(), 
                schedule: [newDayData] 
            });
        }

        res.status(201).json({ message: 'Matrix Synchronized!', timetable });
    } catch (error) {
        res.status(500).json({ message: "Sync Failed: " + error.message });
    }
});

// GET: Fetch all available grades for this school
router.get('/grades/list', protect, adminOnly, async (req, res) => {
    try {
        const grades = await Timetable.find({ schoolId: req.user.schoolId }).distinct('grade');
        res.json(grades);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching grades' });
    }
});

// GET: Fetch personal schedule for a Teacher (Based on EMP ID)
router.get('/teacher/personal-schedule', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const empId = req.user.employeeId;

        // Pura school ka timetable uthao
        const allGradesTimetable = await Timetable.find({ schoolId });

        let personalSchedule = [
            { day: 'Monday', periods: [] },
            { day: 'Tuesday', periods: [] },
            { day: 'Wednesday', periods: [] },
            { day: 'Thursday', periods: [] },
            { day: 'Friday', periods: [] },
            { day: 'Saturday', periods: [] }
        ];

        // Har class aur har din ke periods check karo jahan ye EMP ID ho
        allGradesTimetable.forEach(t => {
            t.schedule.forEach(dayNode => {
                const myPeriods = dayNode.periods.filter(p => p.teacherEmpId === empId);
                if (myPeriods.length > 0) {
                    const targetDay = personalSchedule.find(d => d.day === dayNode.day);
                    myPeriods.forEach(mp => {
                        targetDay.periods.push({
                            ...mp.toObject(),
                            grade: t.grade 
                        });
                    });
                }
            });
        });

        res.json({ schedule: personalSchedule });
    } catch (error) {
        res.status(500).json({ message: 'Neural Link Failure: ' + error.message });
    }
});

router.get('/meta/student-grades', protect, adminOnly, async (req, res) => {
    try {
        const User = require('../models/User');
        const grades = await User.distinct('grade', { 
            schoolId: req.user.schoolId, 
            role: 'student',
            grade: { $ne: null } 
        });
        res.json(grades.sort()); 
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student grades' });
    }
});

router.post('/meta/available-resources', protect, adminOnly, async (req, res) => {
    try {
        const { day, startTime, excludeGrade } = req.body;
        const schoolId = req.user.schoolId;

        const allTimetables = await Timetable.find({ schoolId });

        let occupiedTeachers = [];
        let occupiedRooms = [];

        allTimetables.forEach(t => {
            if (t.grade === excludeGrade?.toUpperCase()) return;

            const dayMatch = t.schedule.find(s => s.day === day);
            if (dayMatch) {
                dayMatch.periods.forEach(p => {
                    if (p.startTime === startTime) {
                        occupiedTeachers.push(p.teacherEmpId);
                        occupiedRooms.push(p.room);
                    }
                });
            }
        });

        const availableTeachers = await User.find({
            schoolId,
            role: 'teacher',
            employeeId: { $nin: occupiedTeachers }
        }).select('employeeId name subjects');

        res.json({ availableTeachers, occupiedRooms });
    } catch (error) {
        res.status(500).json({ message: 'Resource sync failed' });
    }
});

// GET: Fetch timetable for a specific grade
router.get('/:grade', protect, async (req, res) => {
    try {
        const timetable = await Timetable.findOne({
            grade: req.params.grade.toUpperCase(),
            schoolId: req.user.schoolId
        }).lean(); // lean() use kiya taki hum object modify kar saken

        if (timetable) {
            // Saare teachers ki list nikalo unke employeeId ke saath
            const teachers = await User.find({ schoolId: req.user.schoolId, role: 'teacher' }).select('name employeeId');

            // Schedule ke andar teacherEmpId ko replace karo ya Name add karo
            timetable.schedule.forEach(day => {
                day.periods.forEach(period => {
                    const prof = teachers.find(t => t.employeeId === period.teacherEmpId);
                    period.teacherName = prof ? prof.name : "Neural Professor";
                });
            });
        }

        res.json(timetable || { schedule: [] });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// =====================================================================
// 🔥 NEW: GET ENTIRE SCHOOL SCHEDULE FOR A SPECIFIC DAY
// =====================================================================
router.get('/school/day/:day', protect, adminOnly, async (req, res) => {
    try {
        const timetables = await Timetable.find({ schoolId: req.user.schoolId });
        let masterSchedule = {};
        
        // Har class ka data nikal ke ek master object mein daal rahe hain
        timetables.forEach(t => {
            const dayMatch = t.schedule.find(s => s.day === req.params.day);
            masterSchedule[t.grade] = dayMatch ? dayMatch.periods : [];
        });
        
        res.json(masterSchedule);
    } catch (error) {
        res.status(500).json({ message: 'Master Schedule sync failed' });
    }
});

// =====================================================================
// 🔥 NEW: BULK UPLOAD MASTER SCHEDULE (SMART SHUFFLE & OVERLAP FREE)
// =====================================================================
router.post('/bulk-upload', protect, adminOnly, async (req, res) => {
    const { day, masterSchedule } = req.body;
    const schoolId = req.user.schoolId;

    try {
        // 🔥 TIME CONVERTER (String to Minutes) 🔥
        const parseTimeToMinutes = (timeStr) => {
            if (!timeStr || !timeStr.includes(':')) return 0;
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier === 'PM' && hours !== 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            return (hours * 60) + (minutes || 0);
        };

        // 1. NEURAL CONFLICT CHECK (Interval Overlap Algorithm)
        let allPeriods = [];
        for (const grade of Object.keys(masterSchedule)) {
            for (const p of masterSchedule[grade]) {
                if (p.startTime && p.endTime && p.teacherEmpId) {
                    allPeriods.push({ ...p, grade });
                }
            }
        }

        for (let i = 0; i < allPeriods.length; i++) {
            for (let j = i + 1; j < allPeriods.length; j++) {
                const p1 = allPeriods[i];
                const p2 = allPeriods[j];

                const start1 = parseTimeToMinutes(p1.startTime);
                const end1 = parseTimeToMinutes(p1.endTime);
                const start2 = parseTimeToMinutes(p2.startTime);
                const end2 = parseTimeToMinutes(p2.endTime);

                // 🔥 THE OVERLAP CONDITION 🔥
                if (start1 < end2 && start2 < end1) {
                    if (p1.teacherEmpId === p2.teacherEmpId) {
                        return res.status(400).json({ 
                            message: `Matrix Error: Teacher ${p1.teacherEmpId} has overlapping classes in ${p1.grade} and ${p2.grade} between ${p1.startTime}-${p1.endTime} and ${p2.startTime}-${p2.endTime}!` 
                        });
                    }
                    if (p1.room && p2.room && p1.room !== "N/A" && p2.room !== "N/A" && p1.room.toUpperCase() === p2.room.toUpperCase()) {
                        return res.status(400).json({ 
                            message: `Matrix Error: Room ${p1.room} is occupied by BOTH ${p1.grade} and ${p2.grade}!` 
                        });
                    }
                }
            }
        }

        // 2. APPLY BATCH UPDATES TO DATABASE
        for (const grade of Object.keys(masterSchedule)) {
            const periods = masterSchedule[grade];
            let timetable = await Timetable.findOne({ schoolId, grade: grade.toUpperCase() });

            if (timetable) {
                const dayIndex = timetable.schedule.findIndex(s => s.day === day);
                if (dayIndex !== -1) {
                    timetable.schedule[dayIndex].periods = periods; 
                } else {
                    timetable.schedule.push({ day, periods }); 
                }
                await timetable.save();
            } else {
                if (periods.length > 0) {
                    await Timetable.create({
                        schoolId, grade: grade.toUpperCase(), schedule: [{ day, periods }]
                    });
                }
            }
        }

        res.status(201).json({ message: `Master Matrix for ${day} Synchronized Successfully! ⚡` });
    } catch (error) {
        res.status(500).json({ message: "Bulk Sync Failed: " + error.message });
    }
});


module.exports = router;
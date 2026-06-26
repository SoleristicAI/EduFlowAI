const express = require('express');
const router = express.Router();
const LiveClass = require('../models/LiveClass');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const axios = require('axios');
const cron = require('node-cron'); // Cron job for auto-delete
const { protect } = require('../middleware/authMiddleware');

// Helper function to calculate overlapping time
const getMinutes = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
};

// Helper function to generate strict IST ISO Date String
const getIsoStringIST = (dateStr, timeStr) => {
    const [day, month, year] = dateStr.split('-');
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (modifier === 'AM' && hours === 12) hours = 0;
    if (modifier === 'PM' && hours !== 12) hours += 12;
    
    return `${year}-${month}-${day}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00+05:30`;
};

// 1. Get Setup Data
router.get('/setup-data', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const empId = req.user.employeeId;

        const timetables = await Timetable.find({ schoolId });
        const teachingMap = {}; 

        timetables.forEach(tt => {
            tt.schedule.forEach(day => {
                day.periods.forEach(p => {
                    if (p.teacherEmpId === empId && p.subject && p.subject !== 'Break') {
                        if (!teachingMap[tt.grade]) teachingMap[tt.grade] = new Set();
                        teachingMap[tt.grade].add(p.subject);
                    }
                });
            });
        });

        const formattedData = Object.keys(teachingMap).map(grade => ({
            grade,
            subjects: Array.from(teachingMap[grade])
        })).sort((a, b) => {
            const gradeA = parseInt(a.grade.split('-')[0]);
            const gradeB = parseInt(b.grade.split('-')[0]);
            if (gradeA !== gradeB) return gradeA - gradeB; 
            return a.grade.localeCompare(b.grade);
        });

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch teaching data." });
    }
});

// 2. Propose a new Live Class
router.post('/request', protect, async (req, res) => {
    try {
        const { grade, subjectName, platform, date, startTime, endTime } = req.body;
        
        const newStart = getMinutes(startTime);
        const newEnd = getMinutes(endTime);

        if (newStart >= newEnd) {
            return res.status(400).json({ message: "End time must be strictly after Start time!" });
        }

        const existingClasses = await LiveClass.find({
            schoolId: req.user.schoolId,
            grade,
            date,
            status: { $in: ['pending', 'approved'] }
        });

        for (let ec of existingClasses) {
            const exStart = getMinutes(ec.startTime);
            const exEnd = getMinutes(ec.endTime);

            if (newStart < exEnd && newEnd > exStart) {
                return res.status(400).json({ 
                    message: `Clash Detected! ${ec.proposerName} already has a ${ec.subjectName} class scheduled from ${ec.startTime} to ${ec.endTime} for Class ${grade}.` 
                });
            }
        }

        const newClass = await LiveClass.create({
            schoolId: req.user.schoolId,
            proposerId: req.user.employeeId,
            proposerName: req.user.name,
            grade,
            subjectName,
            platform: 'Zoom', // Strictly forcing Zoom
            date,
            startTime,
            endTime
        });

        res.status(201).json({ message: "Live Class Requested Successfully!", data: newClass });
    } catch (error) {
        res.status(500).json({ message: "Failed to request live class." });
    }
});

// 3. Get My Requests
router.get('/my-requests', protect, async (req, res) => {
    try {
        const requests = await LiveClass.find({ proposerId: req.user.employeeId, schoolId: req.user.schoolId }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching your requests." });
    }
});

// 4. Monitor Hub
router.get('/monitor/:grade', protect, async (req, res) => {
    try {
        const requests = await LiveClass.find({ grade: req.params.grade.trim(), schoolId: req.user.schoolId }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching monitor data." });
    }
});

// 5. Approve Request & Generate ZOOM Meeting
router.put('/approve/:id', protect, async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id);
        if (!liveClass) {
            return res.status(404).json({ message: "Record not found." });
        }

        // Only Zoom Logic
        const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_EMAIL } = process.env;
        const authHeader = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

        const tokenResponse = await axios.post("https://zoom.us/oauth/token", null, {
            params: { grant_type: "account_credentials", account_id: ZOOM_ACCOUNT_ID },
            headers: { Authorization: `Basic ${authHeader}` }
        });

        const accessToken = tokenResponse.data.access_token;
        const isoDateTime = getIsoStringIST(liveClass.date, liveClass.startTime);

        const zoomMeetingResponse = await axios.post(
            `https://api.zoom.us/v2/users/${ZOOM_EMAIL}/meetings`,
            {
                topic: `${liveClass.subjectName} Live Class`,
                type: 2,
                start_time: isoDateTime,
                duration: 60,
                timezone: "Asia/Kolkata",
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: true,
                    waiting_room: true
                }
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        liveClass.hostLink = zoomMeetingResponse.data.start_url;
        liveClass.studentLink = zoomMeetingResponse.data.join_url;
        liveClass.status = "approved";
        await liveClass.save();

        res.json({ message: "Class Approved! Zoom meeting created." });

    } catch (error) {
        console.error("Zoom API Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Failed to generate Zoom meeting." });
    }
});

// 6. Reject/Delete Request
router.delete('/:id', protect, async (req, res) => {
    try {
        await LiveClass.findByIdAndDelete(req.params.id);
        res.json({ message: "Request Rejected & Removed." });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove request." });
    }
});

// 7. STUDENT: Get Approved Live Classes
router.get('/student-classes', protect, async (req, res) => {
    try {
        const studentGrade = req.user.grade?.trim();
        if (!studentGrade) return res.status(400).json({ message: "Student grade configuration missing." });

        const classes = await LiveClass.find({
            schoolId: req.user.schoolId,
            grade: studentGrade,
            status: 'approved'
        }).sort({ createdAt: -1 }); 

        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch live classes." });
    }
});

// =====================================================================
// 8. AUTO-DELETE ENGINE (CRON JOB) - Runs every minute
// =====================================================================
cron.schedule('* * * * *', async () => {
    try {
        const now = Date.now();
        // Sirf approved classes check karenge jinki limit cross ho chuki hai
        const classes = await LiveClass.find({ status: 'approved' });

        for (let cls of classes) {
            const endIsoStr = getIsoStringIST(cls.date, cls.endTime);
            const endTimeMs = new Date(endIsoStr).getTime();
            
            // Add exactly 2 minutes (120,000 milliseconds) to the end time
            const deleteThresholdMs = endTimeMs + (2 * 60 * 1000);

            // Agar class ko khatam hue 2 minute se zyada ho gaye hain -> DELETE
            if (now >= deleteThresholdMs) {
                await LiveClass.findByIdAndDelete(cls._id);
                console.log(`[Auto-Clean] 🧹 Removed expired Zoom class: ${cls.subjectName} (${cls.grade}) ended at ${cls.endTime}`);
            }
        }
    } catch (error) {
        console.error("Cron Job Error:", error);
    }
});

module.exports = router;
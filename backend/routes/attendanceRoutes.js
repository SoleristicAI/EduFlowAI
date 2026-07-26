const express = require('express');
const router = express.Router();
const School = require('../models/School');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const { protect, teacherOnly, adminOnly } = require('../middleware/authMiddleware');
const { getMyClassList } = require('../controllers/attendanceController');

// 1. Fetch Students for New Attendance (With Smart Leave Detection)
router.get('/my-students', protect, teacherOnly, async (req, res) => {
    try {
        const { date } = req.query; // Frontend se aayi hui date (e.g., "2026-06-30")
        const assignedClass = req.user.assignedClass;
        
        if (!assignedClass) {
            return res.status(404).json({ message: 'No class assigned to you!' });
        }
        
        const students = await User.find({
            role: 'student',
            grade: assignedClass,
            schoolId: req.user.schoolId
        }).select('name email enrollmentNo grade avatar');

        let approvedLeaves = [];

        // Agar frontend ne date bheji hai, toh check karo
        if (date) {
            const targetDateObj = new Date(date);
            targetDateObj.setHours(0,0,0,0);
            
            // MAGIC FIX: Yahan 'Confirmed' aur 'Approved' dono check kar rahe hain
            const leaves = await LeaveRequest.find({
                schoolId: req.user.schoolId,
                status: { $in: ['Approved', 'Confirmed'] } 
            });

            approvedLeaves = leaves.filter(leave => {
                const from = new Date(leave.fromDate);
                from.setHours(0,0,0,0); // Start of the day
                
                const to = leave.toDate ? new Date(leave.toDate) : new Date(from);
                to.setHours(23,59,59,999); // End of the day

                return targetDateObj >= from && targetDateObj <= to;
            }).map(leave => leave.student.toString());
        }

        // Student data mein 'onLeave' ka tag add kar do
        const studentsWithLeave = students.map(st => ({
            ...st.toObject(),
            onLeave: approvedLeaves.includes(st._id.toString())
        }));

        res.json({ students: studentsWithLeave, assignedClass });
    } catch (error) {
        console.error("My Students Error:", error);
        res.status(500).json({ message: 'Neural Sync Error' });
    }
});

router.post('/mark', protect, teacherOnly, async (req, res) => {
    const { grade, date, records } = req.body;
    try {
        // 🔥 MAGIC: Get Current Session automatically 🔥
        const school = await School.findById(req.user.schoolId).select('activeSession');
        const currentSession = school ? school.activeSession : '2025-2026';

        let attendance = await Attendance.findOne({ 
            grade, date, schoolId: req.user.schoolId, session: currentSession 
        });

        if (attendance) {
            attendance.records = records;
            attendance.teacher = req.user._id;
            await attendance.save();
        } else {
            attendance = await Attendance.create({
                schoolId: req.user.schoolId, 
                teacher: req.user._id,
                grade, date, records,
                session: currentSession // Save with session tag
            });
        }
        res.status(201).json({ message: 'Attendance Synchronized! ✅', attendance });
    } catch (error) {
        res.status(500).json({ message: 'Server Error saving attendance' });
    }
});

// 2. Fetch Existing Attendance (With Smart Leave Locking)
router.get('/view', protect, async (req, res) => {
    const { grade, date } = req.query;
    try {
        const school = await School.findById(req.user.schoolId).select('activeSession');
        const currentSession = school ? school.activeSession : '2025-2026';
        
        // Teacher sirf Current Session ki attendance dekh sakta hai
        const data = await Attendance.findOne({ 
            grade, date, schoolId: req.user.schoolId, 
            $or: [{ session: currentSession }, { session: { $exists: false } }] 
        }).lean();
        
        if (data) {
            const targetDateObj = new Date(date);
            targetDateObj.setHours(0,0,0,0);
            
            // MAGIC FIX: Yahan 'Confirmed' aur 'Approved' dono check kar rahe hain
            const leaves = await LeaveRequest.find({
                schoolId: req.user.schoolId,
                status: { $in: ['Approved', 'Confirmed'] }
            });

            const approvedLeaves = leaves.filter(leave => {
                const from = new Date(leave.fromDate);
                from.setHours(0,0,0,0);
                
                const to = leave.toDate ? new Date(leave.toDate) : new Date(from);
                to.setHours(23,59,59,999);

                return targetDateObj >= from && targetDateObj <= to;
            }).map(leave => leave.student.toString());

            // Update records dynamically
            data.records = data.records.map(record => {
                // Check using studentId (if populated) or student (fallback)
                const sId = record.studentId ? record.studentId.toString() : (record.student ? record.student.toString() : null);
                const onLeave = sId ? approvedLeaves.includes(sId) : false;
                
                return {
                    ...record,
                    onLeave,
                    status: onLeave ? 'On Leave' : record.status // Tag override
                };
            });
        }
        
        res.json(data);
    } catch (error) {
        console.error("View Attendance Error:", error);
        res.status(500).json({ message: 'Error fetching attendance data' });
    }
});

// Stats aur Report wale baaki routes purane wale hi rahenge
router.get('/student-stats', protect, async (req, res) => {
    try {
        const studentId = req.user._id;
        const schoolId = req.user.schoolId;
        const { month, session } = req.query; // Session parameter

        // 🔥 LEGACY DATA FIX 🔥
        const sessionFilter = session === '2026-2027' 
            ? { $or: [{ session: session }, { session: { $exists: false } }] }
            : { session: session };

        const allRecords = await Attendance.find({
            'records.studentId': studentId,
            schoolId: schoolId,
            ...(session && sessionFilter) // Updated Filter
        }).sort({ date: -1 });

        let presentDays = 0;
        let absentDays = 0; // Explicitly count
        let leaveDays = 0;

        allRecords.forEach(record => {
            const entry = record.records.find(r => r.studentId.toString() === studentId.toString());
            if (entry) {
                if (entry.status === 'Present') presentDays++;
                else if (entry.status === 'Absent') absentDays++;
                else if (entry.status === 'On Leave') leaveDays++;
            }
        });

        // Total days = Sab kuch mila ke (Present + Absent + Leave)
        const totalDaysCount = presentDays + absentDays + leaveDays;

        // Percentage sirf (Present / (Present + Absent)) se niklegi
        const effectiveWorkingDays = presentDays + absentDays;
        const percentage = effectiveWorkingDays === 0 ? 0 : ((presentDays / effectiveWorkingDays) * 100).toFixed(1);

        res.json({
            totalDays: totalDaysCount, // Ab isme leave wale din bhi count ho rahe hain
            presentDays,
            absentDays,
            leaveDays,
            percentage,
            history: allRecords.filter(r => r.date.startsWith(month || new Date().toISOString().slice(0, 7)))
                               .map(record => ({
                                   date: record.date,
                                   status: record.records.find(r => r.studentId.toString() === studentId.toString())?.status
                               }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Neural History Sync Failed' });
    }
});

// 👇 Yahan session filter miss ho gaya tha 👇
router.get('/admin-report/:grade', protect, adminOnly, async (req, res) => {
    try {
        const { grade } = req.params;
        const { session } = req.query; // 🔥 1. URL se session nikal liya

        const students = await User.find({ role: 'student', grade, schoolId: req.user.schoolId, status: { $nin: ['Alumni', 'Left'] } }).select('name enrollmentNo');
        
        // 🔥 LEGACY DATA FIX 🔥
        const sessionFilter = session === '2026-2027' 
            ? { $or: [{ session: session }, { session: { $exists: false } }] }
            : { session: session };

        const attendanceData = await Attendance.find({ 
            grade, 
            schoolId: req.user.schoolId,
            ...(session && sessionFilter)
        });

        const report = students.map(student => {
            let present = 0;
            let total = 0;

            attendanceData.forEach(day => {
                const record = day.records.find(r =>
                    (r.studentId && r.studentId.toString() === student._id.toString()) ||
                    (r.student && r.student.toString() === student._id.toString())
                );

                if (record) {
                    total++;
                    if (record.status === 'Present') present++;
                }
            });

            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
            return {
                name: student.name,
                roll: student.enrollmentNo,
                percentage: percentage,
                status: (percentage < 75 && total > 0) ? 'Low' : 'Good'
            };
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Admin report fetch failed' });
    }
});

router.get('/student-report/:studentId', protect, adminOnly, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { session } = req.query; // URL se session nikal liya

        const student = await User.findOne({ _id: studentId, schoolId: req.user.schoolId }).select('-password');
        if (!student) return res.status(404).json({ message: "Student Not Found" });

        // 🔥 LEGACY DATA FIX 🔥
        const sessionFilter = session === '2026-2027' 
            ? { $or: [{ session: session }, { session: { $exists: false } }] }
            : { session: session };

        const attendanceData = await Attendance.find({ 
            schoolId: req.user.schoolId, 
            grade: student.grade,
            ...(session && sessionFilter)
        });

        // 👇 YAHAN SE LEAVE LOGIC SHURU HOTA HAI 👇
        let presentDays = 0;
        let absentDays = 0; 
        let leaveDays = 0;
        let leaveDatesList = [];

       attendanceData.forEach(day => {
            const record = day.records.find(r => r.studentId.toString() === studentId);
            if (record) {
                if (record.status === 'Present') presentDays++;
                else if (record.status === 'Absent') absentDays++;
                else if (record.status === 'On Leave') {
                    leaveDays++;
                    leaveDatesList.push(day.date); // Save the date when student was on leave
                }
            }
        });

        // Total days = Sab kuch mila ke (Present + Absent + Leave)
        const totalDays = presentDays + absentDays + leaveDays;

        // Percentage sirf (Present / (Present + Absent)) se niklegi (Same as student app)
        const effectiveWorkingDays = presentDays + absentDays;
        const percentage = effectiveWorkingDays === 0 ? 0 : ((presentDays / effectiveWorkingDays) * 100).toFixed(1);

        res.json({ 
            profile: student, 
            stats: { 
                totalDays, 
                presentDays, 
                absentDays,
                leaveDays,
                percentage,
                leaveDatesList // Frontend ko bheja taaki dropdown mein dikha sake
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching report' });
    }
});

router.get('/my-class-list', protect, teacherOnly, getMyClassList);

module.exports = router;
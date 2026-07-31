const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const LeaveRequest = require('../models/LeaveRequest');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/leaves/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

router.post('/apply', protect, upload.single('document'), async (req, res) => {

    try {
        const { leaveType, fromDate, toDate, reason, documentType } = req.body;

        // Required validations
        if (!fromDate) {
            return res.status(400).json({ message: "From date is required" });
        }

        if (leaveType === "Multiple Days" && !toDate) {
            return res.status(400).json({ message: "To date is required" });
        }

        if (!reason) {
            return res.status(400).json({ message: "Reason is required" });
        }

        if (!req.file) {
        console.log("Multer failed to catch file!");
        return res.status(400).json({ message: "Document upload is required" });
    }

        // Date parsing
        const parsedFrom = new Date(fromDate);
        const parsedTo = toDate ? new Date(toDate) : null;

        // Extra safety
        if (isNaN(parsedFrom.getTime())) {
            return res.status(400).json({ message: "Invalid from date" });
        }

        if (parsedTo && isNaN(parsedTo.getTime())) {
            return res.status(400).json({ message: "Invalid to date" });
        }

        if (parsedTo && parsedTo < parsedFrom) {
            return res.status(400).json({ message: "To date cannot be before from date" });
        }

        const newLeave = await LeaveRequest.create({
            schoolId: req.user.schoolId,
            student: req.user._id,
            leaveType,
            fromDate: parsedFrom,
            toDate: parsedTo,
            reason,
            documentType,
            document: `/uploads/leaves/${req.file.filename}`
        });

        res.status(201).json({
            success: true,
            leave: newLeave
        });

    } catch (error) {
        console.error("DEBUG_ERROR:", error);
        res.status(500).json({ message: error.message });
    }
});

// --- UPDATED PENDING COUNT ROUTE (With Time-Boundary Hide Logic) ---
router.get('/pending-count', protect, async (req, res) => {
    try {
        const teacherClass = req.user.assignedClass; 
        const School = require('../models/School');
        const school = await School.findById(req.user.schoolId).select('sessionStartDate');

        // 🔥 FILTER LOGIC: Sirf is naye session ki leaves aayengi
        let query = { schoolId: req.user.schoolId, status: 'Pending' };
        if (school && school.sessionStartDate) {
            query.createdAt = { $gte: school.sessionStartDate }; // Time-Boundary
        }

        const allPending = await LeaveRequest.find(query).populate('student', 'grade');
        const filteredRequests = allPending.filter(req => req.student?.grade === teacherClass);

        res.json({ count: filteredRequests.length });
    } catch (error) {
        res.status(500).json({ count: 0 });
    }
});

// --- UPDATED TEACHER REVIEW ROUTE (With Time-Boundary Hide Logic) ---
router.get('/requests', protect, async (req, res) => {
    try {
        const teacherClass = req.user.assignedClass;
        const schoolId = req.user.schoolId;
        const School = require('../models/School');
        const school = await School.findById(schoolId).select('sessionStartDate');

        // 🔥 FILTER LOGIC: Purani leaves hide ho jayengi UI se
        let query = { schoolId };
        if (school && school.sessionStartDate) {
            query.createdAt = { $gte: school.sessionStartDate }; // Time-Boundary
        }

        const requests = await LeaveRequest.find(query)
            .populate('student', 'name grade')
            .sort({ createdAt: -1 });

        const filtered = requests.filter(r => r.student?.grade === teacherClass);
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- UPDATED STUDENT HISTORY ROUTE (With Time-Boundary Hide Logic) ---
router.get('/my-history', protect, async (req, res) => {
    try {
        const School = require('../models/School');
        const school = await School.findById(req.user.schoolId).select('sessionStartDate');

        // 🔥 FILTER LOGIC: Bache ko sirf naye saal ki history dikhegi
        let query = { student: req.user._id };
        if (school && school.sessionStartDate) {
            query.createdAt = { $gte: school.sessionStartDate }; // Time-Boundary
        }

        const history = await LeaveRequest.find(query).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/update-status/:id', protect, async (req, res) => {
    try {
        const { status } = req.body; // Confirmed ya Rejected

        // status update only (delete nahi)
        const updatedRequest = await LeaveRequest.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('student', 'name grade');

        res.json(updatedRequest);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
module.exports = router;
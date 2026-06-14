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

// --- UPDATED PENDING COUNT ROUTE ---
router.get('/pending-count', protect, async (req, res) => {
    try {
        const teacherClass = req.user.assignedClass; // Teacher ki class
        
        // Saari pending requests fetch karo aur populate karo taaki student ki grade mile
        const allPending = await LeaveRequest.find({
            schoolId: req.user.schoolId,
            status: 'Pending'
        }).populate('student', 'grade');

        // Sirf wahi requests filter karo jo teacher ki class ki hain
        const filteredRequests = allPending.filter(req => req.student?.grade === teacherClass);

        res.json({ count: filteredRequests.length });
    } catch (error) {
        res.status(500).json({ count: 0 });
    }
});

router.get('/requests', protect, async (req, res) => {
    try {
        const teacherClass = req.user.assignedClass;
        const schoolId = req.user.schoolId;

        const requests = await LeaveRequest.find({
            schoolId
        })
            .populate('student', 'name grade')
            .sort({ createdAt: -1 });

        const filtered = requests.filter(
            r => r.student?.grade === teacherClass
        );

        res.json(filtered);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/my-history', protect, async (req, res) => {
    try {
        const history = await LeaveRequest.find({ student: req.user._id }).sort({ createdAt: -1 });
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
const express = require('express');
const router = express.Router();
const { protect, financeOnly } = require('../middleware/authMiddleware');
const FeeNotice = require('../models/FeeNotice');

// 1. POST: accountant notice publish karega (http://localhost:5000/api/fee-notices/publish)
router.post('/publish', protect, financeOnly, async (req, res) => {
    try {
        const { type, message } = req.body;

        if (!type || !message) {
            return res.status(400).json({ message: "Notice parameters missing!" });
        }

        const newNotice = await FeeNotice.create({
            schoolId: req.user.schoolId,
            title: type === 'fee_alert' ? "🚨 Fee Alert Notice" : "📝 Financial Notice (Others)",
            content: message,
            noticeType: type
        });

        res.status(201).json({ success: true, message: 'Notice Published Successfully!', notice: newNotice });
    } catch (error) {
        console.error("FEE_NOTICE_POST_ERROR:", error);
        res.status(500).json({ message: 'Internal Server Error in fresh pipeline' });
    }
});

// 2. GET: Student sirf apne school ke saare fees notices dekhega (http://localhost:5000/api/fee-notices/view)
router.get('/view', protect, async (req, res) => {
    try {
        const notices = await FeeNotice.find({ schoolId: req.user.schoolId }).sort({ createdAt: -1 });
        res.json({ success: true, notices });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notices' });
    }
});

// =========================================================================
// 🔥 FIXED: FETCH CLASSES HAVING STUDENTS WITH PENDING FEES (FRESH PIPELINE)
// =========================================================================
router.get('/pending-by-classes', protect, financeOnly, async (req, res) => {
    try {
        const User = require('../models/User');
        const FeeStructure = require('../models/FeeStructure');
        const Fee = require('../models/Fee');

        const schoolId = req.user.schoolId;
        const today = new Date();

        // 1. Iss school ke saare active students fetch karo
        const students = await User.find({ schoolId, role: 'student' }).select('name grade createdAt');

        let classLedgerMap = {};

        for (let student of students) {
            if (!student.grade) continue;

            const numericPart = student.grade.match(/\d+/);
            const classMatch = numericPart ? `Class ${numericPart[0]}` : student.grade;
            
            const structure = await FeeStructure.findOne({ schoolId, className: classMatch });
            if (!structure || !structure.fees) continue;

            // 2. Logic: Calculate Monthly vs One-Time Total
            let monthlyRate = 0;
            let oneTimeRate = 0;

            Object.keys(structure.fees).forEach(k => {
                const feeItem = structure.fees[k];
                if (feeItem && !feeItem.isNone && feeItem.amount > 0) {
                    if (feeItem.billingCycle === 'monthly') {
                        monthlyRate += Number(feeItem.amount);
                    } else {
                        oneTimeRate += Number(feeItem.amount);
                    }
                }
            });

            // Duration Math
            const joinDate = new Date(student.createdAt);
            const monthsElapsed = Math.max(1, (today.getFullYear() - joinDate.getFullYear()) * 12 + (today.getMonth() - joinDate.getMonth()) + 1);
            
            const totalExpected = (monthlyRate * monthsElapsed) + oneTimeRate;

            // 3. Paid Math (Strictly checking cycle tag agar tune implementation kiya hai, 
            // ya simply total paid)
            const payments = await Fee.find({ student: student._id, schoolId, status: 'Verified' });
            const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

            const netOutstanding = totalExpected - totalPaid;

            if (netOutstanding > 0) {
                if (!classLedgerMap[student.grade]) {
                    classLedgerMap[student.grade] = [];
                }
                classLedgerMap[student.grade].push({
                    name: student.name,
                    totalPending: netOutstanding
                });
            }
        }

        const formatOutput = Object.keys(classLedgerMap).map(gradeName => ({
            className: gradeName,
            students: classLedgerMap[gradeName]
        })).sort((a, b) => a.className.localeCompare(b.className));

        res.json(formatOutput);

    } catch (error) {
        console.error("PENDING_CLASSES_ROUTE_ERROR:", error);
        res.status(500).json({ message: 'Neural Ledger extraction failure' });
    }
});

// -------------------------------------------------------------------------
// 🔥 FRESH ENDPOINT: UPDATE EXISTING NOTICE LOG MATRIX (PUT METHOD)
// -------------------------------------------------------------------------
router.put('/update/:id', protect, financeOnly, async (req, res) => {
    try {
        const { type, message } = req.body;
        const noticeId = req.params.id;

        if (!type || !message) {
            return res.status(400).json({ message: "Notice payload tokens missing!" });
        }

        const updatedNotice = await FeeNotice.findByIdAndUpdate(
            noticeId,
            {
                title: type === 'fee_alert' ? "🚨 Fee Alert Notice" : "📝 Financial Notice (Others)",
                content: message,
                noticeType: type
            },
            { new: true } // Return dynamic fresh document snapshot
        );

        if (!updatedNotice) {
            return res.status(404).json({ message: "Notice resource identity not found." });
        }

        res.json({ success: true, message: 'Notice parameter log synchronized!', notice: updatedNotice });
    } catch (error) {
        console.error("FEE_NOTICE_PUT_ERROR:", error);
        res.status(500).json({ message: 'Internal Server Error during modification segment' });
    }
});

// -------------------------------------------------------------------------
// 🔥 FRESH ENDPOINT: TERMINATE NOTICE SIGNAL PROTOCOL (DELETE METHOD)
// -------------------------------------------------------------------------
router.delete('/delete/:id', protect, financeOnly, async (req, res) => {
    try {
        const noticeId = req.params.id;
        const notice = await FeeNotice.findByIdAndDelete(noticeId);

        if (!notice) {
            return res.status(404).json({ message: "Notice data segment already void or non-existent." });
        }

        res.json({ success: true, message: 'Notice sequence safely terminated from ERP vaults' });
    } catch (error) {
        console.error("FEE_NOTICE_DELETE_ERROR:", error);
        res.status(500).json({ message: 'Internal Server Error inside termination handler' });
    }
});


module.exports = router;
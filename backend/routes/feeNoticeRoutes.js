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
// 🔥 FIXED: FETCH CLASSES HAVING STUDENTS WITH PENDING FEES (FAANG CARRY-FORWARD PIPELINE)
// =========================================================================
router.get('/pending-by-classes', protect, financeOnly, async (req, res) => {
    try {
        const User = require('../models/User');
        const FeeStructure = require('../models/FeeStructure');
        const Fee = require('../models/Fee');
        const School = require('../models/School'); // 🔥 School data zaroori hai time freeze ke liye

        const schoolId = req.user.schoolId;
        const schoolData = await School.findById(schoolId);
        const targetSession = schoolData?.activeSession || '2026-2027';

        // 1. Iss school ke saare active students fetch karo (Alumni/Left hata do)
        const students = await User.find({ 
            schoolId, 
            role: 'student',
            status: { $nin: ['Left', 'Alumni'] }
        }).select('name grade createdAt');

        let classLedgerMap = {};

        for (let student of students) {
            if (!student.grade) continue;

            const rawGrade = student.grade;
            const numericPart = rawGrade.match(/\d+/);
            const classMatch = numericPart ? `Class ${numericPart[0]}` : rawGrade;
            
            const structure = await FeeStructure.findOne({ schoolId, className: classMatch });
            
            let monthlyUnit = 0;
            let oneTimeFixed = 0;

            if (structure && structure.fees) {
                Object.keys(structure.fees).forEach(k => {
                    const feeItem = structure.fees[k];
                    if (feeItem && !feeItem.isNone && feeItem.amount > 0) {
                        if (feeItem.billingCycle === 'monthly') monthlyUnit += Number(feeItem.amount);
                        else oneTimeFixed += Number(feeItem.amount);
                    }
                });
            }

            // --- ⏳ TIME-FREEZE & CARRY FORWARD LOGIC (Same as Student Summary) ⏳ ---
            const joinDate = new Date(student.createdAt);
            let calculationEndDate = new Date(); 

            let effectiveStartDate = joinDate;
            let isLegacyStudent = false;

            if (schoolData.sessionStartDate) {
                const sStart = new Date(schoolData.sessionStartDate);
                if (joinDate < sStart) {
                    effectiveStartDate = sStart;
                    isLegacyStudent = true; // Pichle saal ka bacha
                }
            }

            let monthsElapsed = 0;
            if (calculationEndDate >= effectiveStartDate) {
                monthsElapsed = (calculationEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12 + (calculationEndDate.getMonth() - effectiveStartDate.getMonth());
                if (!isLegacyStudent) {
                    monthsElapsed += 1; 
                }
            }
            if (monthsElapsed < 0) monthsElapsed = 0;
            if (monthsElapsed > 12) monthsElapsed = 12;

            let carryForwardDues = 0;
            let carryForwardAdvance = 0;

            if (schoolData.activeSession !== '2026-2027') {
                const legacyPayments = await Fee.find({
                    student: student._id, schoolId, status: 'Verified',
                    $or: [{ session: '2026-2027' }, { session: { $exists: false } }]
                });
                const totalLegacyPaid = legacyPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
                
                let prevClassMatch = classMatch;
                let altPrevClassMatch = rawGrade;
                if (numericPart && parseInt(numericPart[0]) > 1) {
                    const prevNum = parseInt(numericPart[0]) - 1;
                    prevClassMatch = `Class ${prevNum}`;
                    altPrevClassMatch = rawGrade.replace(numericPart[0], prevNum); 
                }

                const legacyStructure = await FeeStructure.findOne({ 
                    schoolId, 
                    $or: [{ className: prevClassMatch }, { className: altPrevClassMatch }] 
                });

                if (legacyStructure && legacyStructure.fees) {
                    let legacyMonthly = 0, legacyOneTime = 0;
                    Object.keys(legacyStructure.fees).forEach(k => {
                        if (legacyStructure.fees[k] && !legacyStructure.fees[k].isNone && legacyStructure.fees[k].amount > 0) {
                            if (legacyStructure.fees[k].billingCycle === 'monthly') legacyMonthly += legacyStructure.fees[k].amount;
                            else legacyOneTime += legacyStructure.fees[k].amount;
                        }
                    });
                    
                    const today = new Date();
                    const legacyEndDate = schoolData.sessionStartDate ? new Date(schoolData.sessionStartDate) : new Date(today.getFullYear(), 3, 1);
                    
                    let legacyMonths = Math.max(1, (legacyEndDate.getFullYear() - joinDate.getFullYear()) * 12 + (legacyEndDate.getMonth() - joinDate.getMonth()) + 1);
                    if (legacyMonths > 12) legacyMonths = 12;
                    if (joinDate > legacyEndDate) legacyMonths = 0;

                    const legacyExpected = (legacyMonthly * legacyMonths) + legacyOneTime;
                    const legacyNet = legacyExpected - totalLegacyPaid;

                    if (legacyNet > 0) {
                        carryForwardDues = legacyNet;
                    } else if (legacyNet < 0) {
                        carryForwardAdvance = Math.abs(legacyNet);
                    }
                }
            }

            // 🔥 CALCULATE NEW SESSION OUTSTANDING 🔥
            const sessionFilter = targetSession === '2026-2027' 
                ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
                : { session: targetSession };

            const verifiedPayments = await Fee.find({
                student: student._id, schoolId, status: 'Verified', ...sessionFilter
            });

            const totalTargetMonthly = (monthlyUnit * monthsElapsed) + carryForwardDues;
            const totalPaidCurrentSession = verifiedPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

            const totalCombinedPayment = totalPaidCurrentSession + carryForwardAdvance;

            let remainingOneTime = Math.max(0, oneTimeFixed - totalCombinedPayment);
            let surplusAfterOneTime = Math.max(0, totalCombinedPayment - oneTimeFixed);
            
            let totalAvailableForMonthly = surplusAfterOneTime;
            let remainingMonthly = Math.max(0, totalTargetMonthly - totalAvailableForMonthly);
            
            // 🎯 FINAL NET OUTSTANDING (ONE-TIME + MONTHLY)
            const netOutstanding = remainingMonthly + remainingOneTime;

            if (netOutstanding > 0) {
                if (!classLedgerMap[student.grade]) {
                    classLedgerMap[student.grade] = [];
                }
                classLedgerMap[student.grade].push({
                    name: student.name,
                    totalPending: netOutstanding // Frontend ko exact balance bhej diya!
                });
            }
        }

        // Object map to sorted array
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
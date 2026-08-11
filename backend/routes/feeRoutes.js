const express = require('express');
const router = express.Router();
const { protect, financeOnly } = require('../middleware/authMiddleware');
const Fee = require('../models/Fee');
const FeeStructure = require('../models/FeeStructure');
const User = require('../models/User'); // <--- YE LINE ADD KARO AGAR NAHI HAI TOH
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `SCREENSHOT_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// --- DAY 130: GET CURRENT SCHOOL SETTINGS (PENALTY + GATEWAY) ---
router.get('/settings/penalty', protect, async (req, res) => {
    try {
        const School = require('../models/School');
        const school = await School.findById(req.user.schoolId);

        // Fix: Dono settings ek saath bhejo taaki Frontend save rakhe
        res.json({
            dailyRate: school.penaltySettings?.dailyRate || 0,
            isActive: school.penaltySettings?.isActive || false,
            paymentSettings: school.paymentSettings || { upiId: '', merchantName: '', isActive: false }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// --- DAY 142: UPDATE PENALTY (WITH PERMANENT SNAPSHOT LOGIC) ---
router.post('/settings/penalty', protect, async (req, res) => {
    try {
        const { dailyRate, isActive } = req.body;
        const School = require('../models/School');
        const User = require('../models/User');
        const Fee = require('../models/Fee');
        const FeeStructure = require('../models/FeeStructure');

        const school = await School.findById(req.user.schoolId);
        const oldStatus = school.penaltySettings.isActive;

        // --- AGAR BUTTON ON SE OFF HO RAHA HAI (SAVE PENALTY FOREVER) ---
        if (oldStatus === true && isActive === false) {
            console.log("System Signal: Freezing existing penalties...");

            // 1. Iss school ke saare students pakdo
            const students = await User.find({ schoolId: req.user.schoolId, role: 'student' });

            for (let student of students) {
                // 2. Is bache ka current balance nikalo (Logic strictly same as summary)
                const verifiedPayments = await Fee.find({ student: student._id, status: 'Verified' });

                // Class matching for structure
                const numericPart = student.grade?.match(/\d+/);
                const classMatch = numericPart ? `Class ${numericPart[0]}` : student.grade;
                const structure = await FeeStructure.findOne({ schoolId: req.user.schoolId, className: classMatch });

                let monthlyRate = 0;
                if (structure && structure.fees) {
                    Object.keys(structure.fees).forEach(k => {
                        if (structure.fees[k].billingCycle === 'monthly') monthlyRate += structure.fees[k].amount;
                    });
                }

                const monthsElapsed = (new Date().getFullYear() - new Date(student.createdAt).getFullYear()) * 12 + (new Date().getMonth() - new Date(student.createdAt).getMonth()) + 1;
                const totalExpected = monthlyRate * monthsElapsed;
                const totalPaid = verifiedPayments.filter(p => p.paymentMode !== 'Penalty-Fine').reduce((sum, p) => sum + p.amountPaid, 0);
                const balance = totalExpected - totalPaid;

                // 3. Agar udhaar hai, toh penalty calculate karke permanent save karo
                if (balance > 0 && school.penaltySettings.activatedAt) {
                    const start = new Date(school.penaltySettings.activatedAt);
                    const today = new Date();
                    const diffDays = Math.floor(Math.abs(today - new Date(start.getFullYear(), start.getMonth(), start.getDate())) / (1000 * 60 * 60 * 24)) + 1;

                    let daysToCharge = diffDays;
                    if (diffDays > 0 && today.getHours() < 11) daysToCharge -= 1;

                    const finalFine = daysToCharge * (school.penaltySettings.dailyRate || 0);

                    if (finalFine > 0) {
                        // Permanent Ledger Entry (₹0 Paid, but Fine Added)
                        await Fee.create({
                            schoolId: req.user.schoolId,
                            student: student._id,
                            amountPaid: 0, // Bache ne paisa nahi diya abhi
                            penaltyAmount: finalFine, // Fine database mein save ho gaya
                            month: new Date().toLocaleString('default', { month: 'long' }),
                            year: new Date().getFullYear(),
                            paymentMode: 'UPI', // Dummy mode for system entry
                            status: 'Verified',
                            remarks: 'SYSTEM_FREEZE: PENALTY SNAPSHOT'
                        });
                    }
                }
            }
        }

        // 4. Update School Settings
        school.penaltySettings.dailyRate = dailyRate;
        school.penaltySettings.isActive = isActive;
        if (isActive) school.penaltySettings.activatedAt = new Date(); // ON hone par clock shuru
        else school.penaltySettings.activatedAt = null; // OFF hone par clock khatam

        await school.save();
        res.json({ message: isActive ? 'Penalty Clock Started! ⚡' : 'Penalties Frozen & Saved! 🛡️' });

    } catch (error) {
        console.error("PENALTY_FREEZE_ERROR:", error);
        res.status(500).json({ message: 'Failed to freeze penalties' });
    }
});

// --- DAY 130: UPDATE GATEWAY (FINANCE ONLY) ---
router.post('/settings/gateway', protect, financeOnly, async (req, res) => {
    try {
        const School = require('../models/School');
        await School.findByIdAndUpdate(req.user.schoolId, {
            'paymentSettings.upiId': req.body.upiId,
            'paymentSettings.merchantName': req.body.merchantName,
            'paymentSettings.isActive': true
        });
        res.json({ message: 'Gateway Updated! ⚡' });
    } catch (error) { res.status(500).json({ message: 'Update failed' }); }
});

// --- DAY 194: DELETE UPI GATEWAY ---
router.delete('/settings/gateway', protect, financeOnly, async (req, res) => {
    try {
        const School = require('../models/School');
        await School.findByIdAndUpdate(req.user.schoolId, {
            'paymentSettings.upiId': '',
            'paymentSettings.merchantName': '',
            'paymentSettings.isActive': false // Reset kar diya
        });
        res.json({ success: true, message: 'Gateway reset successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// --- DAY 130 & 279: CAPTURE WITH SCREENSHOT (WITH STRICT SESSION TAGGING) ---
router.post('/capture-with-screenshot', protect, upload.single('screenshot'), async (req, res) => {
    try {
        const { amount } = req.body;
        const studentId = req.user._id;
        const schoolId = req.user.schoolId;

        if (!req.file) {
            return res.status(400).json({ message: 'Screenshot upload failed. Signal Lost! 🛡️' });
        }

        // 🔥 CURRENT SESSION NIKAL RAHE HAIN 🔥
        const School = require('../models/School');
        const schoolData = await School.findById(schoolId).select('activeSession');

        await Fee.create({
            schoolId,
            student: studentId,
            recordedGrade: req.user.grade,
            recordedEnrollmentNo: req.user.enrollmentNo,

            // 👇🔥 YE RHA TERA FIX 🔥👇
            session: schoolData.activeSession || '2027-2028', 
            // 👆👆👆👆👆👆👆👆👆👆👆👆👆

            amountPaid: Number(amount) || 0,
            paymentScreenshot: `/uploads/${req.file.filename}`,
            paymentMode: 'Online',
            date: new Date(), 
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear(),
            remarks: `ONLINE PAYMENT (INCLUDES PENALTY/LATE FEES)`,
            feeCategory: 'Monthly Fees + Penalty',
            status: 'Pending'
        });

        res.json({ success: true, message: "Neural Signal Captured! 📡" });

    } catch (error) {
        console.error("CAPTURE_ERROR:", error);
        res.status(500).json({ message: 'Signal Interrupted: ' + error.message });
    }
});

// --- DAY 132, 272 & 278: GET SEPARATED ACTIVITY LOGS ---
router.get('/audit/pending-verifications', protect, financeOnly, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const School = require('../models/School');
        const school = await School.findById(schoolId).select('activeSession');
        
        const requestedSession = req.query.session; 
        const targetSession = requestedSession || school?.activeSession || '2026-2027';
        
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const pending = await Fee.find({
            schoolId,
            paymentScreenshot: { $exists: true, $ne: null },
            status: 'Pending',
            ...sessionFilter
        }).populate('student', 'name enrollmentNo grade fatherName phone').sort({ createdAt: -1 });

        const resolved = await Fee.find({
            schoolId,
            paymentScreenshot: { $exists: true, $ne: null },
            status: { $in: ['Verified', 'Rejected'] },
            ...sessionFilter
        }).populate('student', 'name enrollmentNo grade fatherName phone').sort({ updatedAt: -1 });

        // 🔥 THE REAL FIX: Strict Snapshot Mapping Only 🔥
        const mapWithSnapshot = (records) => records.map(f => {
            const doc = f.toObject();
            if (doc.student) {
                if (doc.recordedGrade) doc.student.grade = doc.recordedGrade;
                if (doc.recordedEnrollmentNo) doc.student.enrollmentNo = doc.recordedEnrollmentNo;
            }
            return doc;
        });

        res.json({ 
            pending: mapWithSnapshot(pending), 
            resolved: mapWithSnapshot(resolved) 
        });
    } catch (error) {
        res.status(500).json({ message: 'Audit Feed Failure' });
    }
});
// --- DAY 182: VERIFY PAYMENT SIGNAL ---
router.post('/audit/verify-payment', protect, financeOnly, async (req, res) => {
    try {
        const { feeId } = req.body;
        const feeRecord = await Fee.findById(feeId);

        if (!feeRecord) return res.status(404).json({ message: 'Neural record missing! ❌' });

        // Status Verified update karo
        feeRecord.status = 'Verified';
        await feeRecord.save();

        res.json({ success: true, message: 'Signal Verified. Ledger Updated! ⚡' });
    } catch (error) {
        res.status(500).json({ message: 'Verification Failed' });
    }
});

// --- DAY 131: REJECT ONLINE SIGNAL ---
router.post('/audit/reject-payment', protect, financeOnly, async (req, res) => {
    try {
        const { feeId } = req.body;
        // Status Rejected karo - Ye entry database mein rahegi par balance calculation se bahar ho jayegi
        await Fee.findByIdAndUpdate(feeId, { status: 'Rejected' });
        res.json({ success: true, message: 'Signal Rejected. Security Maintained! 🛡️' });
    } catch (error) {
        res.status(500).json({ message: 'Rejection Failed' });
    }
});

// --- DAY 96, 272 & 278: TRIGGER MANUAL ALERT & STATS ---
router.get('/reports/summary', protect, financeOnly, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const School = require('../models/School');
        const school = await School.findById(schoolId).select('activeSession');
        
        const requestedSession = req.query.session;
        const targetSession = requestedSession || school?.activeSession || '2026-2027';
        
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const feeHistory = await Fee.find({
            schoolId,
            status: 'Verified',
            ...sessionFilter
        }).sort({ date: -1 }).populate('student', 'name grade enrollmentNo');

        // 🔥 THE REAL FIX: Strict Snapshot Mapping Only 🔥
        const mappedHistory = feeHistory.map(f => {
            const doc = f.toObject();
            if (doc.student) {
                if (doc.recordedGrade) doc.student.grade = doc.recordedGrade; 
                if (doc.recordedEnrollmentNo) doc.student.enrollmentNo = doc.recordedEnrollmentNo;
            }
            return doc;
        });

        const totalCollected = mappedHistory.reduce((sum, f) => sum + f.amountPaid, 0);

        const matchCondition = { schoolId: req.user.schoolId, status: 'Verified' };
        if (targetSession === '2026-2027') {
            matchCondition.$or = [{ session: targetSession }, { session: { $exists: false } }];
        } else {
            matchCondition.session = targetSession;
        }

        const classWiseRaw = await Fee.aggregate([
            { $match: matchCondition },
            {
                $lookup: {
                    from: 'users', 
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ['$recordedGrade', '$studentInfo.grade'] },
                    total: { $sum: '$amountPaid' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalCollected,
            transactionCount: mappedHistory.length,
            classWise: classWiseRaw.filter(item => item._id !== null), 
            history: mappedHistory,
            targetSession 
        });
    } catch (error) {
        console.error("REPORT_API_ERROR:", error);
        res.status(500).json({ message: 'Failed to generate simple report' });
    }
});

// --- DAY 268: STUDENT FEE SUMMARY (WITH TIME-FREEZE & SESSION TRAVEL) ---
router.get('/student-summary', protect, async (req, res) => {
    try {
        const studentId = req.user._id;
        const schoolId = req.user.schoolId;
        const requestedSession = req.query.session; // Frontend se aayega

        const User = require('../models/User');
        const School = require('../models/School');
        const student = await User.findById(studentId).populate('schoolId');
        if (!student) return res.status(404).json({ message: 'Identity missing' });

        const schoolData = await School.findById(schoolId);
        
        // 1. Session Filter Logic (Legacy Support)
        const targetSession = requestedSession || schoolData.activeSession;
        const isPastSession = targetSession !== schoolData.activeSession;
        
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const rawGrade = student.grade || "";
        const numericPart = rawGrade.match(/\d+/);
        const classMatch = numericPart ? `Class ${numericPart[0]}` : rawGrade;
        
        // 🔥 Naya session naya fee structure laayega, past wala past structure
        const structure = await FeeStructure.findOne({ schoolId, className: classMatch });

        const verifiedPayments = await Fee.find({
            student: studentId,
            schoolId: schoolId,
            status: 'Verified',
            ...sessionFilter // Sirf is session ki payments uthao
        }).sort({ date: -1 });

        let monthlyUnit = 0;
        let oneTimeFixed = 0;
        let structureDetails = { monthly: [], oneTime: [] };

        if (structure && structure.fees) {
            Object.keys(structure.fees).forEach(key => {
                const item = structure.fees[key];
                if (item && !item.isNone && item.amount > 0) {
                    const amount = Number(item.amount) || 0;
                    const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
                    if (item.billingCycle === 'monthly') {
                        monthlyUnit += amount;
                        structureDetails.monthly.push({ label, amount });
                    } else {
                        oneTimeFixed += amount;
                        structureDetails.oneTime.push({ label, amount });
                    }
                }
            });
        }

      // --- ⏳ TIME-FREEZE CALCULATION LOGIC ⏳ ---
        const joinDate = new Date(student.createdAt);
        let calculationEndDate = new Date(); 

        if (isPastSession && schoolData.sessionStartDate) {
            calculationEndDate = new Date(schoolData.sessionStartDate); 
        }

        let effectiveStartDate = joinDate;
        let isLegacyStudent = false; // 🔥 Naya jadoo: Bacha naya hai ya purana?

        if (!isPastSession && schoolData.sessionStartDate) {
            const sStart = new Date(schoolData.sessionStartDate);
            if (joinDate < sStart) {
                effectiveStartDate = sStart;
                isLegacyStudent = true; // Bacha pichle saal se aaya hai!
            }
        }

        let monthsElapsed = 0;
        if (calculationEndDate >= effectiveStartDate) {
            monthsElapsed = (calculationEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12 + (calculationEndDate.getMonth() - effectiveStartDate.getMonth());
            
            // 🔥 THE DOUBLE-BILLING FIX 🔥
            // Naye bache ko join karte hi 1st month ki fee lagni chahiye (+1).
            // Lekin purane bache ki is mahine (August) ki fee ALREADY pichle session (Legacy) mein calculate ho chuki hai!
            if (!isLegacyStudent) {
                monthsElapsed += 1; 
            }
        }
        if (monthsElapsed < 0) monthsElapsed = 0;
        if (monthsElapsed > 12) monthsElapsed = 12; 

        // 🔥 THE MASTERPLAN: CARRY FORWARD LOGIC 🔥
        let carryForwardDues = 0;
        let carryForwardAdvance = 0;

        if (!isPastSession && schoolData.activeSession !== '2026-2027') {
            const legacyPayments = await Fee.find({
                student: studentId, schoolId, status: 'Verified',
                $or: [{ session: '2026-2027' }, { session: { $exists: false } }]
            });
            const totalLegacyPaid = legacyPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
            
            let prevClassMatch = classMatch;
            let altPrevClassMatch = rawGrade;
            const numMatch = rawGrade.match(/\d+/);
            if (numMatch && parseInt(numMatch[0]) > 1) {
                const prevNum = parseInt(numMatch[0]) - 1;
                prevClassMatch = `Class ${prevNum}`;
                altPrevClassMatch = rawGrade.replace(numMatch[0], prevNum); 
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
                    
                    // 👇🔥 MASTER FIX: Agar baccha session start hone ke BAAD aaya hai, toh legacy zero kar do! 🔥👇
                    if (joinDate > legacyEndDate) {
                        carryForwardDues = 0;
                        carryForwardAdvance = 0;
                    } else {
                        // Purane baccho ke liye normal calculation
                        let legacyMonths = Math.max(1, (legacyEndDate.getFullYear() - joinDate.getFullYear()) * 12 + (legacyEndDate.getMonth() - joinDate.getMonth()) + 1);
                        if (legacyMonths > 12) legacyMonths = 12;
                        
                        const legacyExpected = (legacyMonthly * legacyMonths) + legacyOneTime;
                        const legacyNet = legacyExpected - totalLegacyPaid;

                        if (legacyNet > 0) {
                            carryForwardDues = legacyNet;
                        } else if (legacyNet < 0) {
                            carryForwardAdvance = Math.abs(legacyNet);
                        }
                    }
                }
        }

        // 🔥 CALCULATE NEW SESSION OUTSTANDING 🔥
        // Arjun ke liye: (3600 * 0) + 1200 dues = 1200 EXACT!
        const totalTargetMonthly = (monthlyUnit * monthsElapsed) + carryForwardDues;
        const totalPaidCurrentSession = verifiedPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

        // Bikram (VIP) ka extra paisa pehle One-Time fees ko kam karega
        const totalCombinedPayment = totalPaidCurrentSession + carryForwardAdvance;

        let remainingOneTime = Math.max(0, oneTimeFixed - totalCombinedPayment);
        let surplusAfterOneTime = Math.max(0, totalCombinedPayment - oneTimeFixed);
        
        // Bacha hua paisa Monthly ko kam karega
        let totalAvailableForMonthly = surplusAfterOneTime;

        let remainingMonthly = Math.max(0, totalTargetMonthly - totalAvailableForMonthly);
        let finalAdvance = Math.max(0, totalAvailableForMonthly - totalTargetMonthly);

        const pendingPayment = await Fee.findOne({ student: studentId, status: 'Pending', ...sessionFilter }).sort({ createdAt: -1 });

        const groupedHistory = verifiedPayments.reduce((acc, pay) => {
            const key = `${pay.month} ${pay.year}`;
            if (!acc[key]) acc[key] = [];
            let displayCategory = pay.feeCategory || "GENERAL FEE";
            if ((pay.remarks || "").toUpperCase().includes("PURPOSE:")) { displayCategory = pay.remarks.split(":")[1].trim(); }
            acc[key].push({
                id: pay._id, amount: pay.amountPaid, category: displayCategory.toUpperCase(), date: pay.date, mode: pay.paymentMode
            });
            return acc;
        }, {});

        res.json({
            studentName: student.name, enrollmentNo: student.enrollmentNo,
            fatherName: student.fatherName, mobile: student.phone, grade: student.grade,
            schoolName: student.schoolId?.schoolName || "N/A", schoolPhone: schoolData?.paymentSettings?.upiId || "N/A",
            currentMonth: calculationEndDate.toLocaleString('default', { month: 'long' }),
            totalPaidThisMonth: verifiedPayments.filter(p => p.month === calculationEndDate.toLocaleString('default', { month: 'long' }) && p.year === calculationEndDate.getFullYear()).reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0),
            lastActivity: verifiedPayments.length > 0 ? verifiedPayments[0].date : null,
            grandTotal: remainingMonthly + remainingOneTime,
            monthlyOutstanding: remainingMonthly,
            oneTimeOutstanding: remainingOneTime,
            advanceBalance: finalAdvance,
            totalFeesStructure: monthlyUnit,
            feeStructureDetails: structureDetails,
            paymentHistory: groupedHistory,
            targetSession, 
            isActiveSession: !isPastSession,
            pendingSignal: pendingPayment ? {
                id: pendingPayment._id, amount: pendingPayment.amountPaid, screenshot: pendingPayment.paymentScreenshot, date: pendingPayment.date, status: pendingPayment.status
            } : null
        });

    } catch (error) {
        console.error("SUMMARY_CRITICAL_ERROR:", error);
        res.status(500).json({ message: 'Neural Link Failure' });
    }
});

// --- DAY 273 & 278 FIX: STRICT IMMUTABLE RECEIPT (NO MATH GUESSWORK) ---
router.get('/receipt/:paymentId', protect, async (req, res) => {
    try {
        const School = require('../models/School');
        const payment = await Fee.findById(req.params.paymentId)
            .populate({
                path: 'student',
                select: 'name enrollmentNo grade fatherName phone address'
            })
            .populate('schoolId'); 

        if (!payment) {
            return res.status(404).json({ message: 'Receipt Identity Not Found! ❌' });
        }

        if (req.user.role === 'student' && payment.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Neural Access Denied: Unauthorized Identity! 🛡️' });
        }

        const paymentObj = payment.toObject();

        if (paymentObj.schoolId) {
            paymentObj.schoolId.schoolAddress = paymentObj.schoolId.schoolAddress || paymentObj.schoolId.address || "EduFlow Digital Campus";
            paymentObj.schoolId.schoolContact = paymentObj.schoolId.schoolContact || paymentObj.schoolId.phone || "Not Available";
        }

        // 🔥 THE REAL FIX: Sirf Exact Snapshot use hoga. Koi '-1' ka jugaad nahi! 🔥
        if (paymentObj.student) {
            if (paymentObj.recordedGrade) {
                paymentObj.student.grade = paymentObj.recordedGrade;
            }
            if (paymentObj.recordedEnrollmentNo) {
                paymentObj.student.enrollmentNo = paymentObj.recordedEnrollmentNo;
            }
        }

        res.json(paymentObj);
    } catch (error) {
        console.error("Receipt Fetch Error:", error);
        res.status(500).json({ message: 'Error generating receipt data' });
    }
});

// --- DAY 111 & 279: FINALIZE ONLINE PAYMENT (WITH STRICT SESSION TAGGING) ---
router.post('/finalize-online-payment', protect, async (req, res) => {
    try {
        const { amount, method, month, year } = req.body;
        const studentId = req.user._id;
        const schoolId = req.user.schoolId;

        // 🔥 CURRENT SESSION NIKAL RAHE HAIN 🔥
        const School = require('../models/School');
        const schoolData = await School.findById(schoolId).select('activeSession');

        // 1. Create Real Fee Record
        const newFee = await Fee.create({
            schoolId,
            student: studentId,
            amountPaid: amount,
            recordedGrade: req.user.grade,
            recordedEnrollmentNo: req.user.enrollmentNo,
            
            // 👇🔥 YE RHA TERA SABSE BADA FIX 🔥👇
            session: schoolData.activeSession || '2027-2028', 
            // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆

            month: month || new Date().toLocaleString('default', { month: 'long' }),
            year: year || new Date().getFullYear(),
            paymentMode: method || 'UPI',
            date: new Date()
        });

        res.status(201).json({
            message: 'Neural Payment Captured Successfully! ⚡',
            feeId: newFee._id
        });
    } catch (error) {
        console.error("Payment Finalize Error:", error);
        res.status(500).json({ message: 'Payment Synchronization Failed' });
    }
});

// --- DAY 111: AUTO-DETECTION STATUS CHECK (Point 9) ---
// Ye route check karega ki pichle 1 minute mein is bache ki koi payment aayi hai?
router.get('/check-payment-status', protect, async (req, res) => {
    try {
        const studentId = req.user._id;
        // Sirf pichle 60 seconds ki history check karenge taaki purani payments redirect na karein
        const oneMinuteAgo = new Date(Date.now() - 60000);

        const recentPayment = await Fee.findOne({
            student: studentId,
            date: { $gte: oneMinuteAgo }
        }).sort({ date: -1 });

        if (recentPayment) {
            return res.json({
                success: true,
                message: "Neural Signal Captured: Payment Detected! ⚡"
            });
        }

        res.json({ success: false });
    } catch (error) {
        console.error("Polling Error:", error);
        res.status(500).json({ success: false });
    }
});

// --- DAY 111: REAL-TIME PAYMENT CHECKER ---
router.get('/verify-online-status', protect, async (req, res) => {
    try {
        const studentId = req.user._id;
        // Sirf pichle 2 minute ki transactions check karenge
        const twoMinutesAgo = new Date(Date.now() - 120000);

        const latestPayment = await Fee.findOne({
            student: studentId,
            date: { $gte: twoMinutesAgo }
        }).sort({ date: -1 });

        if (latestPayment) {
            return res.json({
                success: true,
                message: "Neural Signal: Payment Received! ⚡"
            });
        }
        res.json({ success: false });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

/**
 * @DESC   Save or Update Master Fee Structure for a specific class
 * @ROUTE  POST /api/fees/structure/update
 * @ACCESS Private (Finance Only)
 */
router.post('/structure/update', protect, financeOnly, async (req, res) => {
    try {
        const { className, fees } = req.body;
        const schoolId = req.user.schoolId;

        if (!className) {
            return res.status(400).json({ message: 'Class Selection Required!' });
        }

        // findOneAndUpdate ka use karke hum Check + Create/Update ek saath kar rahe hain
        const structure = await FeeStructure.findOneAndUpdate(
            { schoolId, className },
            {
                fees,
                updatedBy: req.user._id
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({
            message: `Neural Link Established: ${className} Configuration Locked! ⚡`,
            structure
        });
    } catch (error) {
        console.error("STRUCTURE_UPDATE_ERROR:", error);
        res.status(500).json({ message: 'Internal Server Error: Could not sync structure' });
    }
});

/**
 * @DESC   Fetch Fee Structure for a specific class to populate the form
 * @ROUTE  GET /api/fees/structure/:className
 * @ACCESS Private (Finance Only)
 */
router.get('/structure/:className', protect, financeOnly, async (req, res) => {
    try {
        const { className } = req.params;
        const schoolId = req.user.schoolId;

        const structure = await FeeStructure.findOne({ schoolId, className });

        if (!structure) {
            // Agar data nahi hai, toh frontend ko signal bhejo taaki wo khali form dikhaye
            return res.json({ notFound: true, message: "No blueprint found for this sector." });
        }

        res.json(structure);
    } catch (error) {
        console.error("STRUCTURE_FETCH_ERROR:", error);
        res.status(500).json({ message: 'Error fetching class blueprint' });
    }
});

// feesRoutes.js mein ye naya route add karo
router.get('/structure/list/all', protect, financeOnly, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        // Sirf className aur updatedAt uthayenge list ke liye
        const list = await FeeStructure.find({ schoolId }).select('className updatedAt').sort({ className: 1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching list' });
    }
});

// --- DAY 116, 276 & 279: FETCH CLASSES (SMART HYBRID LOOKUP) ---
router.get('/tracker/classes', protect, financeOnly, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const School = require('../models/School');
        const school = await School.findById(schoolId).select('activeSession');
        
        const targetSession = req.query.session || school?.activeSession || '2026-2027';
        const isPastSession = targetSession !== school?.activeSession;

        let classList = [];

        if (!isPastSession) {
            // 🔥 CURRENT SESSION: Get real-time active classes from Users 🔥
            const User = require('../models/User');
            classList = await User.distinct('grade', { schoolId, role: 'student' });
        } else {
            // 🔥 PAST SESSION: Get classes from the Fee Ledger 🔥
            const sessionFilter = targetSession === '2026-2027' 
                ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
                : { session: targetSession };

            const distinctClasses = await Fee.aggregate([
                { $match: { schoolId: req.user.schoolId, ...sessionFilter } },
                {
                    $lookup: {
                        from: 'users', localField: 'student', foreignField: '_id', as: 'studentInfo'
                    }
                },
                { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: null,
                        classes: { $addToSet: { $ifNull: ['$recordedGrade', '$studentInfo.grade'] } }
                    }
                }
            ]);
            classList = distinctClasses.length > 0 ? distinctClasses[0].classes.filter(c => c != null) : [];
        }

        res.json(classList.sort());
    } catch (error) {
        res.status(500).json({ message: 'Error fetching classes' });
    }
});

// --- DAY 116, 276 & 279: FETCH STUDENTS BY CLASS (SMART HYBRID LOOKUP) ---
router.get('/tracker/students/:grade', protect, financeOnly, async (req, res) => {
    try {
        const { grade } = req.params;
        const schoolId = req.user.schoolId;
        const School = require('../models/School');
        const User = require('../models/User');
        const school = await School.findById(schoolId).select('activeSession');
        
        const targetSession = req.query.session || school?.activeSession || '2026-2027';
        const isPastSession = targetSession !== school?.activeSession;

        let mappedStudents = [];

        if (!isPastSession) {
            // 🔥 CURRENT SESSION: Fetch all students currently sitting in this class 🔥
            const students = await User.find({
                grade, schoolId, role: 'student', status: { $nin: ['Left', 'Alumni'] }
            }).select('name enrollmentNo grade admissionNo phone role status');
            mappedStudents = students.map(s => s.toObject());
        } else {
            // 🔥 PAST SESSION: Fetch students who paid fees in this class from Ledger 🔥
            const sessionFilter = targetSession === '2026-2027' 
                ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
                : { session: targetSession };

            const studentIdsWithPayments = await Fee.aggregate([
                { $match: { schoolId, ...sessionFilter } },
                {
                    $lookup: {
                        from: 'users', localField: 'student', foreignField: '_id', as: 'studentInfo'
                    }
                },
                { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
                {
                    $match: {
                        $expr: { $eq: [{ $ifNull: ['$recordedGrade', '$studentInfo.grade'] }, grade] }
                    }
                },
                { $group: { _id: '$student' } } 
            ]);

            const distinctStudentIds = studentIdsWithPayments.map(item => item._id);

            const students = await User.find({
                _id: { $in: distinctStudentIds },
                schoolId
            }).select('name enrollmentNo grade admissionNo phone role status');
            
            mappedStudents = students.map(s => {
                const doc = s.toObject();
                doc.grade = grade; // Override memory grade to matched past grade
                return doc;
            });
        }

        res.json(mappedStudents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students' });
    }
});

// --- DAY 268: FINANCE STUDENT LEDGER (WITH TIME-FREEZE & SESSION TRAVEL) ---
router.get('/audit/:studentId', protect, financeOnly, async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const schoolId = req.user.schoolId;
        const requestedSession = req.query.session; // Frontend se aayega
        
        const today = new Date();
        const currentYear = today.getFullYear();

        const User = require('../models/User');
        const School = require('../models/School');

        const student = await User.findOne({ _id: studentId, schoolId }).populate('schoolId');
        if (!student) {
            return res.status(404).json({ message: 'Identity missing' });
        }

        const schoolData = await School.findById(schoolId);

        // 1. Session Filter Logic
        const targetSession = requestedSession || schoolData.activeSession;
        const isPastSession = targetSession !== schoolData.activeSession;
        
        const sessionFilter = targetSession === '2026-2027' 
            ? { $or: [{ session: targetSession }, { session: { $exists: false } }] }
            : { session: targetSession };

        const rawGrade = student.grade || "";
        const numericPart = rawGrade.match(/\d+/);
        const classMatch = numericPart ? `Class ${numericPart[0]}` : rawGrade;

        const structure = await FeeStructure.findOne({
            schoolId,
            className: classMatch
        });

        const verifiedPayments = await Fee.find({
            student: studentId,
            schoolId,
            status: 'Verified',
            ...sessionFilter // Sirf is session ki payments uthao
        }).sort({ date: -1 });

        let monthlyUnit = 0;
        let oneTimeFixed = 0;
        const structureDetails = { monthly: [], oneTime: [] };

        if (structure && structure.fees) {
            Object.keys(structure.fees).forEach(key => {
                const item = structure.fees[key];
                if (item && !item.isNone && item.amount > 0) {
                    const amount = Number(item.amount) || 0;
                    const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();

                    if (item.billingCycle === 'monthly') {
                        monthlyUnit += amount;
                        structureDetails.monthly.push({ label, amount });
                    } else {
                        oneTimeFixed += amount;
                        structureDetails.oneTime.push({ label, amount });
                    }
                }
            });
        }

        // --- ⏳ TIME-FREEZE CALCULATION LOGIC ⏳ ---
        const joinDate = new Date(student.createdAt);
        let calculationEndDate = new Date(); // Normal

        if (isPastSession && schoolData.sessionStartDate) {
            calculationEndDate = new Date(schoolData.sessionStartDate); // Time Freeze!
        }

        const currentMonthName = calculationEndDate.toLocaleString('default', { month: 'long' });

        // 🔥 FIX 1: "Double Billing" roko (Arjun ka zero month gino agar wo pichle saal se hai) 🔥
        let effectiveStartDate = joinDate;
        let isLegacyStudent = false; 

        if (!isPastSession && schoolData.sessionStartDate) {
            const sStart = new Date(schoolData.sessionStartDate);
            if (joinDate < sStart) {
                effectiveStartDate = sStart;
                isLegacyStudent = true; // Bacha pichle saal se aaya hai!
            }
        }

        let monthsElapsed = 0;
        if (calculationEndDate >= effectiveStartDate) {
            monthsElapsed = (calculationEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12 + (calculationEndDate.getMonth() - effectiveStartDate.getMonth());
            
            // Naye bache ko join karte hi pehle mahine ki fee lagegi
            // Lekin purane bache ki overlap month fee pichle session mein lag chuki hai
            if (!isLegacyStudent) {
                monthsElapsed += 1; 
            }
        }
        if (monthsElapsed < 0) monthsElapsed = 0;
        if (monthsElapsed > 12) monthsElapsed = 12; // Cap at 12 months per session

        // 🔥 THE MASTERPLAN: CARRY FORWARD LOGIC FOR ADMIN 🔥
        let carryForwardDues = 0;
        let carryForwardAdvance = 0;

        if (!isPastSession && schoolData.activeSession !== '2026-2027') {
            const legacyPayments = await Fee.find({
                student: studentId, schoolId, status: 'Verified',
                $or: [{ session: '2026-2027' }, { session: { $exists: false } }]
            });
            const totalLegacyPaid = legacyPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
            
            let prevClassMatch = classMatch;
            let altPrevClassMatch = rawGrade;
            const numMatch = rawGrade.match(/\d+/);
            if (numMatch && parseInt(numMatch[0]) > 1) {
                const prevNum = parseInt(numMatch[0]) - 1;
                prevClassMatch = `Class ${prevNum}`;
                altPrevClassMatch = rawGrade.replace(numMatch[0], prevNum); 
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
                    // 🔥 FIX: 'unshift' wali line hata di taaki UI list mein fake item add na ho 🔥
                } else if (legacyNet < 0) {
                    carryForwardAdvance = Math.abs(legacyNet);
                }
            }
        }

        // 🔥 CALCULATE NEW SESSION OUTSTANDING 🔥
        
        // 1. Purana Dues monthly bill mein add hoga
        const totalTargetMonthly = (monthlyUnit * monthsElapsed) + carryForwardDues;
        const totalPaidCurrentSession = verifiedPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

        // 2. Purana Advance One-Time bill ko discount karega
        const totalCombinedPayment = totalPaidCurrentSession + carryForwardAdvance;

        let remainingOneTime = Math.max(0, oneTimeFixed - totalCombinedPayment);
        let surplusAfterOneTime = Math.max(0, totalCombinedPayment - oneTimeFixed);
        
        // Agar uske baad bhi advance bacha hai, tabhi monthly bill kam hoga
        let totalAvailableForMonthly = surplusAfterOneTime;

        let remainingMonthly = Math.max(0, totalTargetMonthly - totalAvailableForMonthly);
        let finalAdvance = Math.max(0, totalAvailableForMonthly - totalTargetMonthly);

        const groupedHistory = verifiedPayments.reduce((acc, pay) => {
            const key = `${pay.month} ${pay.year}`;
            if (!acc[key]) acc[key] = [];
            const rawRemarks = pay.remarks || "";
            let displayCategory = pay.feeCategory || "GENERAL FEE";
            if (rawRemarks.toUpperCase().includes("PURPOSE:")) {
                displayCategory = rawRemarks.split(":")[1].trim();
            }
            acc[key].push({
                id: pay._id, amount: pay.amountPaid, category: displayCategory.toUpperCase(), date: pay.date, mode: pay.paymentMode
            });
            return acc;
        }, {});

        res.json({
            student,
            schoolName: student.schoolId?.schoolName || "N/A",
            schoolPhone: schoolData?.paymentSettings?.upiId || "N/A",
            adminName: schoolData?.adminDetails?.fullName || "N/A",
            adminEmail: schoolData?.adminDetails?.email || "N/A",

            currentMonth: currentMonthName,
            totalPaidThisMonth: verifiedPayments.filter(p => p.month === currentMonthName && p.year === calculationEndDate.getFullYear()).reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0),
            lastActivity: verifiedPayments.length > 0 ? verifiedPayments[0].date : null,
            grandTotal: remainingMonthly + remainingOneTime,
            monthlyOutstanding: remainingMonthly,
            oneTimeOutstanding: remainingOneTime,
            advanceBalance: finalAdvance,
            totalFeesStructure: monthlyUnit,
            structureDetails,
            history: groupedHistory,
            targetSession, // Frontend ke liye
            isActiveSession: !isPastSession, // 🔥 YEH LINE ADD KAR DE 🔥
            status: (remainingMonthly + remainingOneTime) <= 0 ? 'COMPLETED' : 'PENDING'
        });

    } catch (error) {
        console.error("AUDIT_ERROR:", error);
        res.status(500).json({ message: 'Neural Ledger Reset Failed' });
    }
});

// 1. Get all classes
router.get('/setup/classes', protect, financeOnly, async (req, res) => {
    try {
        const User = require('../models/User');
        const classes = await User.distinct('grade', { schoolId: req.user.schoolId, role: 'student' });
        res.json(classes.sort());
    } catch (error) { res.status(500).json({ message: 'Error' }); }
});

// 2. Get students by class
router.get('/setup/students/:grade', protect, financeOnly, async (req, res) => {
    try {
        const User = require('../models/User');
        const students = await User.find({
            grade: req.params.grade,
            schoolId: req.user.schoolId,
            role: 'student'
        }).select('name enrollmentNo');
        res.json(students);
    } catch (error) { res.status(500).json({ message: 'Error' }); }
});

// --- DAY 120: GET ACTIVE FEE FIELDS (CLEAN LOGIC) ---
router.get('/setup/fields/:grade', protect, financeOnly, async (req, res) => {
    try {
        const rawGrade = req.params.grade;
        const numericPart = rawGrade.match(/\d+/);
        const classMatch = numericPart ? `Class ${numericPart[0]}` : rawGrade;

        const structure = await FeeStructure.findOne({
            schoolId: req.user.schoolId,
            className: classMatch
        });

        if (!structure) return res.json([]);

        // Filter: Sirf wahi components bhej rahe hain jo 'None' nahi hain aur jinki amount set hai
        const activeFields = Object.keys(structure.fees)
            .filter(key =>
                structure.fees[key] &&
                structure.fees[key].isNone === false &&
                structure.fees[key].amount > 0
            )
            .map(key => ({
                key,
                label: key.replace(/([A-Z])/g, ' $1').trim().toUpperCase(),
                amount: structure.fees[key].amount
            }));

        res.json(activeFields);
    } catch (error) {
        console.error("FIELDS_FETCH_ERROR:", error);
        res.status(500).json({ message: 'Fields Sync Error' });
    }
});

module.exports = router;
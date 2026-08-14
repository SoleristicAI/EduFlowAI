const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Fee = require('../models/Fee');
router.post('/add-teacher', protect, adminOnly, async (req, res) => {
    const {
        name, email, password, subjects,
        fatherName, motherName, dob, gender, religion,
        phone, address
    } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Step 1: Find the latest teacher in THIS school
        const lastTeacher = await User.findOne({
            schoolId: req.user.schoolId,
            role: 'teacher'
        }).sort({ createdAt: -1 });

        let nextEmpId;
        if (lastTeacher && lastTeacher.employeeId && lastTeacher.employeeId.startsWith('EMP')) {
            const lastNo = parseInt(lastTeacher.employeeId.replace('EMP', ''));
            const nextNo = lastNo + 1;
            nextEmpId = `EMP${nextNo.toString().padStart(3, '0')}`;
        } else {
            nextEmpId = 'EMP001';
        }

        const teacher = await User.create({
            schoolId: req.user.schoolId,
            name,
            email,
            password,
            role: 'teacher',
            employeeId: nextEmpId,
            subjects,
            fatherName,
            motherName,
            dob,
            gender,
            religion,
            phone,
            address // day 78 address object (pincode, district, state, etc)
        });
        res.status(201).json({ message: `Teacher assigned with ID: ${nextEmpId}`, teacher });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin adds a student (STRICT AUTO ENROLLMENT NO. + DOB LOGS)
router.post('/add-student', protect, adminOnly, async (req, res) => {
    const {
        name, email, password, grade,
        fatherName, motherName, dob, gender, religion, admissionNo,
        phone, address
    } = req.body;

    try {
        console.log("📥 INCOMING NEW STUDENT DATA:", { name, grade, dob, admissionNo });

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // 🔥 EXPECTED FORMAT CALCULATION (e.g., STU10A) 🔥
        const classCode = grade ? grade.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "GEN";
        const expectedPrefix = `STU${classCode}`;

        // 1. Class ke saare bacchon ke enrollment number nikaalo
        const activeStudents = await User.find({
            schoolId: req.user.schoolId,
            role: 'student',
            grade: grade,
            status: { $nin: ['Alumni', 'Left'] }
        }).select('enrollmentNo');

        console.log("🔍 EXISTING ENROLLMENT NUMBERS IN DB:", activeStudents.map(s => s.enrollmentNo));

        // 2. Strict Extraction: Sirf unko padho jo current class ke pattern (STU10A) se shuru hote hain!
        const usedNumbers = activeStudents
            .map(s => {
                if (s.enrollmentNo && s.enrollmentNo.startsWith(expectedPrefix)) {
                    const numStr = s.enrollmentNo.replace(expectedPrefix, ''); // Prefix hatao
                    return numStr ? parseInt(numStr, 10) : null; // Number nikaalo
                }
                return null;
            })
            .filter(n => n !== null && !isNaN(n)) // Kachra aur null hatao
            .sort((a, b) => a - b); // Ascending order mein sort karo

        console.log("📊 CLEANED & SORTED NUMBERS:", usedNumbers);

        // 3. Exact Gap Filler Logic
        let nextNo = 1;
        for (let num of usedNumbers) {
            if (num === nextNo) {
                nextNo++;
            }
        }
        
        // 4. Generate Solid Enrollment No
        const nextEnrollNo = `${expectedPrefix}${nextNo.toString().padStart(3, '0')}`;
        console.log("✅ FINALLY GENERATED ID:", nextEnrollNo);

        const student = await User.create({
            schoolId: req.user.schoolId,
            name,
            email,
            password,
            role: 'student',
            enrollmentNo: nextEnrollNo,
            grade,
            fatherName,
            motherName,
            dob, // 🔥 DOB SAVED HERE 🔥
            gender,
            religion,
            admissionNo, 
            phone,
            address 
        });
        
        res.status(201).json({ message: `Student enrolled in ${grade} with ID: ${nextEnrollNo}`, student });
    } catch (error) {
        console.error("❌ ADD_STUDENT_CRITICAL_ERROR:", error);
        res.status(500).json({ message: 'Server Error during student creation' });
    }
});

router.get('/students/:grade', protect, async (req, res) => {
    try {
        const students = await User.find({
            role: 'student',
            grade: req.params.grade,
            schoolId: req.user.schoolId,
            status: { $nin: ['Alumni', 'Left'] }
        }).select('name email enrollmentNo grade fatherName motherName dob gender religion admissionNo phone address avatar'); 
      

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin fetching all teachers
router.get('/teachers', protect, adminOnly, async (req, res) => {
    try {
        const teachers = await User.find({
            role: { $in: ['teacher', 'finance'] },
            schoolId: req.user.schoolId
        }).select('-password');
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin Update User (Fixed 500 Error & Immutable ID Bug)
router.put('/update/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 🔥 HACK: Remove immutable fields before Object.assign so Mongoose doesn't crash 🔥
        if (req.body._id) delete req.body._id;
        if (req.body.schoolId) delete req.body.schoolId;
        if (req.body.createdAt) delete req.body.createdAt;
        if (req.body.updatedAt) delete req.body.updatedAt;

        // --- CONFLICT CHECK FOR TEACHER ASSIGNMENT ---
        if (user.role === 'teacher' && req.body.assignedClass) {
            // String mein convert karke trim aur uppercase karenge taaki crash na ho
            const assignedClassStr = String(req.body.assignedClass).trim().toUpperCase();
            
            const classTaken = await User.findOne({
                role: 'teacher',
                assignedClass: assignedClassStr,
                schoolId: req.user.schoolId,
                _id: { $ne: req.params.id } // Khud ko chhod kar
            });
            
            if (classTaken) {
                return res.status(400).json({
                    message: `CONFLICT: Class ${assignedClassStr} is already assigned to EMP: ${classTaken.employeeId}!`
                });
            }
            
            // Backend update ke liye body ko clean karo
            req.body.assignedClass = assignedClassStr; 
        }

        // Update fields safely
        Object.assign(user, req.body);
        
        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error("Update User DB Error:", error);
        res.status(500).json({ message: 'Update failed: ' + error.message });
    }
});

// Admin Delete User (DAY 78)
router.delete('/delete/:id', protect, adminOnly, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User identity purged' });
    } catch (error) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

router.get('/grades/all', protect, async (req, res) => {
    try {
        const grades = await User.find({
            schoolId: req.user.schoolId,
            role: 'student'
        }).distinct('grade');
        res.json(grades.sort());
    } catch (error) {
        res.status(500).json({ message: 'Error fetching grades' });
    }
});

// --- DAY 112/118: ENHANCED FINANCE STATS (FIXED - NO INSTALLMENTS) ---
router.get('/finance/stats', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;

        const School = require('../models/School');
        const schoolDetails = await School.findById(schoolId).select('schoolName address');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Fetch Today's Payments
        const todayFees = await Fee.find({ 
            schoolId, 
            date: { $gte: today },
            status: 'Verified' 
        });
        const collectedToday = todayFees.reduce((sum, f) => sum + f.amountPaid, 0);

        // 2. Fetch Monthly Payments
        const monthFees = await Fee.find({ 
            schoolId, 
            date: { $gte: startOfMonth },
            status: 'Verified' 
        });
        const collectedMonth = monthFees.reduce((sum, f) => sum + f.amountPaid, 0);

        // 3. Separate Online Payments Today
        const onlineToday = todayFees
            .filter(f => ['Online', 'PhonePe', 'Google Pay', 'Paytm', 'UPI'].includes(f.paymentMode))
            .reduce((sum, f) => sum + f.amountPaid, 0);

        // 4. Recent Payments
        const recentPayments = await Fee.find({ 
            schoolId,
            status: 'Verified' 
        })
            .sort({ date: -1 })
            .limit(10)
            .populate('student', 'name grade enrollmentNo');

            // --- ADDED FOR NOTIFICATION BADGE START ---
        const pendingOnlineCount = await Fee.countDocuments({
            schoolId,
            status: 'Pending',
            paymentMode: 'Online'
        });

        res.json({
            schoolName: schoolDetails?.schoolName || "EduFlowAI School",
            schoolAddress: schoolDetails?.address || "Main Campus, India",
            collectedToday,
            collectedMonth,
            onlineToday,
            pendingCount: pendingOnlineCount,
            totalPending: 0, // Dashboard crash na ho isliye temporary 0 bhej rahe hain
            pendingStudentsCount: 0,
            recentPayments: recentPayments.map(p => ({
                _id: p._id,
                studentName: p.student?.name || 'Unknown',
                enrollmentNo: p.student?.enrollmentNo || 'N/A',
                grade: p.student?.grade || 'N/A',
                amount: p.amountPaid,
                paymentMode: p.paymentMode,
                date: p.date.toLocaleDateString(),
                time: p.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
        });
    } catch (error) {
        console.error("Finance Stats Error:", error);
        res.status(500).json({ message: 'Stats Sync Error: ' + error.message });
    }
});

// --- DAY 90: FETCH ALL STUDENTS WITH BASIC FEE INFO ---
router.get('/finance/students-ledger/:grade', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const students = await User.find({
            role: 'student',
            grade: req.params.grade,
            schoolId: schoolId
        }).select('name enrollmentNo grade phone avatar');

        // Note: Future mein yahan total_paid calculation bhi merge karenge
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Ledger Fetch Error' });
    }
});

// --- DAY 119 & 279: ADD PAYMENT BY ENROLLMENT NO (WITH STRICT SESSION TAGGING) ---
router.post('/finance/add-payment', protect, async (req, res) => {
    const { enrollmentNo, amountPaid, month, year, paymentMode, remarks, feeCategory } = req.body;

    try {
        const student = await User.findOne({
            enrollmentNo: enrollmentNo,
            schoolId: req.user.schoolId,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({ message: "Student Identity Not Found! Check Enrollment No. ❌" });
        }

        // 🔥 CURRENT SESSION NIKAL RAHE HAIN 🔥
        const School = require('../models/School');
        const schoolData = await School.findById(req.user.schoolId).select('activeSession');

        // 🔥 NAYI PAYMENT BANA RAHE HAIN (WITH SNAPSHOT & SESSION) 🔥
        const feeRecord = await Fee.create({
            schoolId: req.user.schoolId,
            student: student._id,
            amountPaid: Number(amountPaid),
            
            // 👇🔥 YE RAHA TERA MASTER FIX 🔥👇
            session: schoolData.activeSession || '2027-2028',
            recordedGrade: student.grade,
            recordedEnrollmentNo: student.enrollmentNo,
            // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆

            month,
            year: Number(year),
            paymentMode,
            remarks: `PURPOSE: ${feeCategory}`,
            feeCategory: feeCategory,
            date: new Date()
        });

        res.status(201).json({
            message: `Payment Linked to ${student.name} Successfully! ✅`,
            feeRecord
        });
    } catch (error) {
        console.error("Payment Process Error:", error);
        res.status(500).json({ message: 'Neural Payment Protocol Failed' });
    }
});

router.get('/finance/receipt/:feeId', protect, async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.feeId)
            .populate('student', 'name enrollmentNo grade phone fatherName')
            .populate({ 
                path: 'schoolId', 
                select: 'schoolName name address phone schoolContact logo' 
            });

        if (!fee) return res.status(404).json({ message: 'Receipt not found' });

        // --- DYNAMIC PURPOSE EXTRACTION (Flexible) ---
        const rawRemarks = fee.remarks || "";
        let cleanPurpose = "MONTHLY FEES";

        if (rawRemarks.toUpperCase().includes("PURPOSE:")) {
            // Case-insensitive split aur cleanup
            cleanPurpose = rawRemarks.split(/purpose:/i)[1].trim().toUpperCase();
        } else if (fee.feeCategory && fee.feeCategory !== 'General') {
            cleanPurpose = fee.feeCategory.toUpperCase();
        }

        // Date Format Fix
        const d = new Date(fee.date);
        const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

        const enhancedFee = fee.toObject();
        enhancedFee.displayPurpose = cleanPurpose;
        enhancedFee.formattedIssuedDate = formattedDate;
        enhancedFee.displaySchoolName = fee.schoolId?.schoolName || fee.schoolId?.name || "EDUFLOWAI INSTITUTION";
        
        // Contact Priority Logic: schoolContact -> phone -> fallback
        enhancedFee.displayContact = fee.schoolId?.schoolContact || fee.schoolId?.phone || "9874637875"; // Defaulting to your backend phone for now

        res.json(enhancedFee);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching receipt' });
    }
});

// --- userRoutes.js ---
// Check if finance teacher already exists in THIS school
router.get('/check-finance-exists', protect, adminOnly, async (req, res) => {
    try {
        const financeTeacher = await User.findOne({ 
            schoolId: req.user.schoolId, 
            role: 'finance' 
        });
        
        // Agar mil gaya toh true, warna false
        res.json({ exists: !!financeTeacher });
    } catch (error) {
        res.status(500).json({ message: 'Error checking finance record' });
    }
});

router.get('/available-classes', protect, adminOnly, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;

        // 1. School mein jitni total classes (grades) hain wo nikalo
        const totalClasses = await User.distinct('grade', { 
            schoolId, 
            role: 'student' 
        });

        // 2. Un classes ko nikalo jo already kisi teacher ko mil chuki hain
        const assignedClasses = await User.distinct('assignedClass', { 
            schoolId, 
            role: 'teacher',
            assignedClass: { $ne: null } 
        });

        // 3. Filter: Sirf wo classes jo assigned nahi hain
        const availableClasses = totalClasses.filter(c => !assignedClasses.includes(c));

        res.json(availableClasses.sort());
    } catch (error) {
        res.status(500).json({ message: 'Error fetching available classes' });
    }
});

// --- GET LIVE ADMIN DASHBOARD STATS ---
router.get('/admin/live-stats', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;

        // 1. Total Students counting
        const totalStudents = await User.countDocuments({ schoolId, role: 'student' });

        // 2. Total Teachers counting (Teacher + Finance dono ko jod kar)
        const totalTeachers = await User.countDocuments({ 
            schoolId, 
            role: { $in: ['teacher', 'finance'] } 
        });

        // 3. Total Fees Collected (Verified payments only)
        const Fee = require('../models/Fee');
        const feesData = await Fee.find({ schoolId, status: 'Verified' });
        const totalCollected = feesData.reduce((sum, f) => sum + (f.amountPaid || 0), 0);

        res.json({
            totalStudents,
            totalTeachers,
            totalFees: totalCollected
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching live stats' });
    }
});

// routes/userRoutes.js mein ye naya route add karo

router.get('/my-mentor', protect, async (req, res) => {
    try {
        const studentGrade = req.user.grade;
        const schoolId = req.user.schoolId;

        if (!studentGrade) {
            return res.status(400).json({ message: "No class assigned to you yet!" });
        }

        // Student ki class se match hone wala teacher dhoondo
        const mentor = await User.findOne({
            schoolId: schoolId,
            role: 'teacher',
            assignedClass: studentGrade.toUpperCase()
        }).select('name phone avatar subjects');

       if (!mentor) {
            return res.status(200).json({ noMentor: true, message: "Class Teacher not assigned to this grade yet." });
        }

        res.json(mentor);
    } catch (error) {
        res.status(500).json({ message: "Neural Link Error: Mentor data lost." });
    }
});


// 🔥 NAYI API: Har role (Student/Teacher/Admin) ko unki aukaat aur history ke hisaab se session dikhane ke liye 🔥
router.get('/general/session-info', protect, async (req, res) => {
    try {
        const school = await require('../models/School').findById(req.user.schoolId).select('activeSession sessionStartDate');
        const active = school?.activeSession || '2026-2027';
        
        let historySessions = [];
        
        // 1. Agar student hai, toh sirf uski khud ki pass hui classes ki history nikalo
        if (req.user.role === 'student') {
            const user = await require('../models/User').findById(req.user._id).select('academicHistory');
            if (user && user.academicHistory) {
                historySessions = user.academicHistory.map(h => h.session);
            }
        } 
        // 2. Admin, Finance aur Teacher ke liye poore school ki history uthao
        else {
            historySessions = await require('../models/User').distinct('academicHistory.session', { schoolId: req.user.schoolId });
        }
        
        // Pehle saare sessions ko mila kar ek list bana lo
        let allAvailableSessions = [...new Set([...historySessions, active])].sort().reverse();
        
        // 🔥 THE MASTER FIX: TEACHER TIMELINE FILTER 🔥
        // Agar role teacher hai, toh uske aane se pehle ke saare sessions array se uda do!
        if (req.user.role === 'teacher') {
            const teacherData = await require('../models/User').findById(req.user._id).select('createdAt');
            const joinDate = new Date(teacherData.createdAt);
            
            // Session kis mahine shuru hota hai (Default April = Month Index 3)
            const sessionStartMonth = school?.sessionStartDate ? new Date(school.sessionStartDate).getMonth() : 3;
            
            let joinSessionStartYear = joinDate.getFullYear();
            // Agar teacher session start hone se pehle (e.g. Jan-March) join hua tha, toh wo pichle session ka hissa hai
            if (joinDate.getMonth() < sessionStartMonth) {
                joinSessionStartYear -= 1; 
            }

            // Filter kardo: Wahi session dikhao jiska Starting Year teacher ke Joining Year ke barabar ya usse bada ho
            allAvailableSessions = allAvailableSessions.filter(session => {
                if (!session || !session.includes('-')) return true; 
                const sessionStartYear = parseInt(session.split('-')[0], 10);
                return sessionStartYear >= joinSessionStartYear;
            });
        }

        res.json({ activeSession: active, allAvailableSessions });
    } catch (error) {
        console.error("Session Info Error:", error);
        res.status(500).json({ message: "Failed to fetch session info" });
    }
});

// ==========================================================
// --- DAY 264: SESSION CONFIGURATION & LOCKING SYSTEM ---
// ==========================================================
router.get('/admin/session-config', protect, adminOnly, async (req, res) => {
    try {
        const grades = await User.find({ schoolId: req.user.schoolId, role: 'student' }).distinct('grade');
        const school = await require('../models/School').findById(req.user.schoolId).select('activeSession upgradedClasses');
        
        const active = school?.activeSession || '2026-2027';
        
        // 🔥 REAL MAGIC: Sirf is school ki asli history database se nikal rahe hain 🔥
        const historySessions = await User.distinct('academicHistory.session', { schoolId: req.user.schoolId });
        
        // Current session aur purani history ko mila kar ek clean array bana diya
        const allAvailableSessions = [...new Set([...historySessions, active])].sort().reverse();
        
        res.json({
            grades: grades.sort(),
            activeSession: active,
            upgradedClasses: school?.upgradedClasses || [],
            allAvailableSessions // NAYA: Frontend ko real session list bhej di
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch session config." });
    }
});

// ==========================================================
// --- SESSION CONFIGURATION & MASTER WIPEOUT SYSTEM ---
// ==========================================================
router.post('/admin/finalize-session', protect, adminOnly, async (req, res) => {
    try {
        const { nextSession } = req.body;
        const school = await require('../models/School').findById(req.user.schoolId);
        
        school.activeSession = nextSession; // Naya saal shuru!
        school.upgradedClasses = []; // Purane locks clear kardo naye saal ke liye
        school.sessionStartDate = new Date(); // Jis din lock hoga, us din se pichli dates block!
        
        await school.save();

        // 🔥 THE GLOBAL WIPEOUT PROTOCOL (Clean Slate for New Year) 🔥
        try {
            const Notice = require('../models/Notice');
            const FeeNotice = require('../models/FeeNotice');
            const Assignment = require('../models/Assignment'); 
            const Submission = require('../models/Submission'); 
            const FeedbackSession = require('../models/FeedbackSession'); 
            const FeedbackResponse = require('../models/FeedbackResponse'); 
            const Syllabus = require('../models/Syllabus'); // 🔥 NAYA: Syllabus Model

            // 1. Wipeout All Notices
            await Notice.deleteMany({ schoolId: req.user.schoolId });
            await FeeNotice.deleteMany({ schoolId: req.user.schoolId });

            // 2. Wipeout All Assignments & Submissions
            await Assignment.deleteMany({ schoolId: req.user.schoolId });
            await Submission.deleteMany({ schoolId: req.user.schoolId });

            // 3. Wipeout All Feedbacks
            await FeedbackSession.deleteMany({ schoolId: req.user.schoolId });
            await FeedbackResponse.deleteMany({ schoolId: req.user.schoolId });

            // 4. Wipeout All Syllabus Records
            await Syllabus.deleteMany({ schoolId: req.user.schoolId });

            console.log(`[MASTER RESET] Notices, Assignments, Submissions, Feedbacks & Syllabus CLEARED for school: ${req.user.schoolId} as session upgraded to ${nextSession}`);
        } catch (wipeErr) {
            console.log("Master Reset failed, but session upgraded.", wipeErr);
        }
        
        res.json({ message: `Session Locked! 🔒 Switched to ${nextSession}. All old tasks, notices, feedbacks & syllabus wiped! ✅` });
    } catch (error) {
        res.status(500).json({ message: "Failed to finalize session." });
    }
});

// ==========================================================
// --- DAY 264: THE MASS PROMOTION ENGINE (WITH SMART ENROLLMENT ID & CLASS LOCK) ---
// ==========================================================
router.post('/admin/promote-students', protect, adminOnly, async (req, res) => {
    try {
        const { currentSession, currentGrade, studentUpdates } = req.body;

        if (!studentUpdates || studentUpdates.length === 0) {
            return res.status(400).json({ message: "No students selected for promotion." });
        }

        for (let update of studentUpdates) {
            const student = await User.findById(update.studentId);
            if (!student) continue;

            if (!student.academicHistory) student.academicHistory = [];

            const oldGrade = student.grade;

            // 1. Archive Current Data
            student.academicHistory.push({
                session: currentSession, 
                gradePassed: oldGrade,
                promotedTo: update.action === 'PROMOTE' ? update.newGrade : oldGrade,
                isRepeater: update.action === 'REPEAT'
            });

            // 2. Process Status & Smart ID Generation
            if (update.action === 'ALUMNI') {
                student.status = 'Alumni';
            } 
            else if (update.action === 'PROMOTE') {
                student.grade = update.newGrade;
                
                const cleanGrade = update.newGrade.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                
                // Gap Filler Algorithm
                const activeStudentsInNewClass = await User.find({
                    schoolId: student.schoolId,
                    role: 'student',
                    grade: update.newGrade,
                    status: { $nin: ['Alumni', 'Left'] }
                }).select('enrollmentNo');

                const usedNumbers = activeStudentsInNewClass
                    .map(s => {
                        if (s.enrollmentNo) {
                            const match = s.enrollmentNo.match(/\d+$/);
                            return match ? parseInt(match[0], 10) : null;
                        }
                        return null;
                    })
                    .filter(n => n !== null)
                    .sort((a, b) => a - b);

                let nextNo = 1;
                for (let num of usedNumbers) {
                    if (num === nextNo) nextNo++;
                }
                
                student.enrollmentNo = `STU${cleanGrade}${nextNo.toString().padStart(3, '0')}`;
            } 

            await student.save();
        }

        // 🔥 LOCK THE CLASS AFTER PROMOTION 🔥
        if (currentGrade) {
            const school = await require('../models/School').findById(req.user.schoolId);
            if (!school.upgradedClasses.includes(currentGrade)) {
                school.upgradedClasses.push(currentGrade);
                await school.save();
            }
        }

        res.json({ message: `Success: ${currentGrade} locked! Students promoted safely.` });
    } catch (error) {
        console.error("Promotion Engine Error:", error);
        res.status(500).json({ message: "Critical Server Error: " + error.message });
    }
});

module.exports = router;
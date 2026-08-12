const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');

// 1. Send OTP Protocol
const sendResetOTP = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Network Identity Not Found!" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.otpExpires = Date.now() + 600000;
    await user.save();

    console.log(`
    ========================================
    NEURAL BYPASS SIGNAL DETECTED 📡
    ========================================
    User: ${user.name}
    Email: ${user.email}
    Phone: ${user.phone}
    ----------------------------------------
    ACCESS OTP: ${otp} ⚡
    ========================================
    `);

    res.json({
        message: `Bypass OTP transmitted to terminal. 🛡️ (Dev Mode)`,
        devMode: true
    });
};

// 2. Reset Password Protocol
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
        email,
        resetOTP: otp,
        otpExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or Expired OTP!" });

    user.password = newPassword;
    user.resetOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Access Cipher Re-encrypted! Login now. 🔐" });
};

// @desc    Register a new user (FIXED ID Generation Logic)
const registerUser = async (req, res) => {
    const {
        name, email, password, role, grade, subjects, schoolId,
        fatherName, motherName, dob, gender, religion, admissionNo,
        phone, address, assignedClass
    } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let generatedId = "";
        const currentSchoolId = schoolId || req.user?.schoolId;

        // --- DAY 85: TEACHER CLASS CONFLICT CHECK ---
        if (role === 'teacher' && assignedClass) {
            const classTaken = await User.findOne({
                role: 'teacher',
                assignedClass: assignedClass,
                schoolId: currentSchoolId
            });

            if (classTaken) {
                return res.status(400).json({
                    message: `CONFLICT: Class ${assignedClass} is already assigned to EMP: ${classTaken.employeeId}! ⚠️`
                });
            }
        }

        // authController.js ke registerUser logic mein:
        if (role === 'finance') {
            const existingFinance = await User.findOne({ schoolId, role: 'finance' });
            if (existingFinance) {
                return res.status(400).json({ message: "CRITICAL: Finance operator already exists!" });
            }
        }

        if (role === 'student') {
            const classCode = grade ? grade.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "GEN";
            const lastStudent = await User.findOne({
                role: 'student',
                schoolId: currentSchoolId,
                grade: grade,
                status: 'Active'
            }).sort({ createdAt: -1 });

            let lastNum = 0;
            if (lastStudent && lastStudent.enrollmentNo) {
                const parts = lastStudent.enrollmentNo.match(/\d+$/);
                lastNum = parts ? parseInt(parts[0]) : 0;
            }
            generatedId = `STU${classCode}${String(lastNum + 1).padStart(3, '0')}`;

        } else if (role === 'teacher' || role === 'finance') {
            // FIX 1: Using lastEmployee variable correctly
            const lastEmployee = await User.findOne({
                role: { $in: ['teacher', 'finance'] },
                schoolId: currentSchoolId
            }).sort({ createdAt: -1 });

            const lastNum = (lastEmployee && lastEmployee.employeeId)
                ? parseInt(lastEmployee.employeeId.replace('EMP', ''))
                : 0;

            generatedId = `EMP${String(lastNum + 1).padStart(3, '0')}`;
        }

        // FIX 2: Fixed the syntax error in object creation
        const user = await User.create({
            name,
            email,
            password,
            role,
            grade,
            enrollmentNo: role === 'student' ? generatedId : undefined,
            employeeId: (role === 'teacher' || role === 'finance') ? generatedId : undefined,
            assignedClass: role === 'teacher' ? assignedClass : undefined,
            subjects,
            schoolId: currentSchoolId,
            fatherName,
            motherName,
            dob,
            gender,
            religion,
            admissionNo,
            phone,
            address
        });

        if (user) {
            res.status(201).json({
                ...user._doc,
                generatedId: generatedId,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error in Registration' });
    }
};

const authUser = async (req, res) => {
    const { email, password } = req.body;
    // user ke sath schoolId ki details pehle se populate ho rahi hain
    const user = await User.findOne({ email }).populate('schoolId');

    if (user && (await require('bcryptjs').compare(password, user.password))) {
        
        // 👇🔥 THE IRON GATE: SCHOOL TERMINATION CHECK 🔥👇
        // Agar user superadmin nahi hai, aur uske school ka status 'Terminated' hai, toh Access Denied!
        if (user.role !== 'superadmin' && user.schoolId) {
            if (user.schoolId.subscription?.status === 'Terminated' || user.schoolId.isDeleted === true) {
                return res.status(403).json({ 
                    message: "Access Denied 🛑: Your institution's node is currently Terminated/Inactive. Contact administration." 
                });
            }
        }
        // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆

        if (user.status === 'Alumni' || user.status === 'Left') {
            return res.status(403).json({ 
                message: "Account Archived 🎓: Alumni or Ex-Students cannot access the portal." 
            });
        }
        
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            grade: user.grade,
            assignedClass: user.assignedClass,
            schoolData: user.schoolId,
            schoolId: user.schoolId?._id,
            avatar: user.avatar,
            fatherName: user.fatherName,
            motherName: user.motherName,
            dob: user.dob,
            gender: user.gender,
            religion: user.religion,
            admissionNo: user.admissionNo,
            phone: user.phone,
            address: user.address,
            enrollmentNo: user.enrollmentNo,
            employeeId: user.employeeId,
            subjects: user.subjects,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await require('bcryptjs').compare(oldPassword, user.password))) {
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password Encryption Updated! 🔐' });
    } else {
        res.status(401).json({ message: 'Your current password is incorrect ❌' });
    }
};

module.exports = { registerUser, authUser, changePassword, sendResetOTP, resetPassword };
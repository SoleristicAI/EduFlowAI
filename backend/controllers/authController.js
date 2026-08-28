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

const registerUser = async (req, res) => {
    const {
        name, email, password, role, grade, subjects, schoolId,
        fatherName, motherName, dob, gender, religion, admissionNo,
        phone, address, assignedClass, customId // 🔥 EXTRACT customId HERE
    } = req.body;

    try {
        // 🔥 Custom ID / Email Collision Check 🔥
        if (customId) {
            const customIdExists = await User.findOne({ customId });
            if (customIdExists) return res.status(400).json({ message: `The ID '${customId}' is already taken by another user!` });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User Email already exists' });

        let generatedId = "";
        const currentSchoolId = schoolId || req.user?.schoolId;

        // --- CONFLICT CHECKS ---
        if (role === 'finance') {
            const existingFinance = await User.findOne({ schoolId: currentSchoolId, role: 'finance' });
            if (existingFinance) return res.status(400).json({ message: "CRITICAL: Finance operator already exists!" });
        }

        // 🔥 TRANSPORT INCHARGE CONFLICT CHECK 🔥
        if (role === 'transport_incharge') {
            const existingTransport = await User.findOne({ schoolId: currentSchoolId, role: 'transport_incharge' });
            if (existingTransport) return res.status(400).json({ message: "CRITICAL: A Transport Incharge already exists for this school!" });
        }

        if (role === 'student') {
            // ... tera purana student id logic ...
        } else if (role === 'teacher' || role === 'finance') {
            // ... tera purana teacher id logic ...
        }

        const user = await User.create({
            name, email, password, role, grade,
            customId: role === 'transport_incharge' ? customId : undefined, // 🔥 Save Custom ID
            enrollmentNo: role === 'student' ? generatedId : undefined,
            employeeId: (role === 'teacher' || role === 'finance') ? generatedId : undefined,
            assignedClass: role === 'teacher' ? assignedClass : undefined,
            subjects, schoolId: currentSchoolId, fatherName, motherName, dob, gender, religion, admissionNo, phone, address
        });

        if (user) {
            res.status(201).json({
                ...user._doc,
                generatedId: customId || generatedId,
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
    
    // 🔥 THE MASTER LOGIN FIX: Email ya Custom ID dono se login hoga! 🔥
    const user = await User.findOne({ 
        $or: [
            { email: email }, 
            { customId: email } // Frontend se customId bhi email field mein hi aayegi
        ]
    }).populate('schoolId');

    if (user && (await require('bcryptjs').compare(password, user.password))) {
        
        if (user.role !== 'superadmin' && user.schoolId) {
            if (user.schoolId.subscription?.status === 'Terminated' || user.schoolId.isDeleted === true) {
                return res.status(403).json({ 
                    message: "Access Denied 🛑: Your institution's node is currently Terminated/Inactive. Contact administration." 
                });
            }
        }

        if (user.status === 'Alumni' || user.status === 'Left') {
            return res.status(403).json({ 
                message: "Account Archived 🎓: Alumni or Ex-Students cannot access the portal." 
            });
        }
        
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            customId: user.customId, // Extra detail
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
        res.status(401).json({ message: 'Invalid Credentials! Check your ID or Password.' });
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
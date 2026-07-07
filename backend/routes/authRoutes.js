const express = require('express');
const { registerUser, authUser, changePassword,sendResetOTP, resetPassword} = require('../controllers/authController');
const router = express.Router();
const User = require('../models/User'); 
const { protect } = require('../middleware/authMiddleware'); 
const multer = require('multer');
const path = require('path');
const csv = require('csvtojson');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Agar file CSV hai toh 'uploads/' mein dalo, warna 'avatars/' mein
        const folder = file.mimetype.includes('csv') ? 'uploads/' : 'uploads/avatars/';
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user?._id || 'bulk'}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5000000 }, // Limit badha kar 5MB kar di (Bulk file ke liye)
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|csv/; // 🔥 NAYA: 'csv' add kiya
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel';
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            // Error message ko dynamic kar diya
            cb(new Error('Neural Error: Only Images or CSV files are allowed! 🛡️'));
        }
    }
});

router.post('/register', registerUser);
router.post('/login', authUser);
router.put('/change-password', protect, changePassword);
router.post('/send-otp', sendResetOTP);
router.post('/reset-password', resetPassword);

router.put('/update-profile', protect, upload.single('avatar'), async (req, res) => {
    try {
        // 🔥 FIXED: Direct Update to bypass Mongoose strict validation on old records 🔥
        let updateFields = {};
        if (req.file) {
            updateFields.avatar = `/uploads/avatars/${req.file.filename}`;
        }
        if (req.body.phone) {
            updateFields.phone = req.body.phone;
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user._id, schoolId: req.user.schoolId }, // Find condition
            { $set: updateFields }, // Sirf wahi update karo jo bheja hai
            { new: true } // Update hone ke baad naya data return karo
        );

        if (updatedUser) {
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar,
                phone: updatedUser.phone,
                schoolId: updatedUser.schoolId, 
                token: req.headers.authorization.split(' ')[1]
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("MONGOOSE UPLOAD CRASH PREVENTED:", error);
        res.status(500).json({ message: 'Profile update failed' });
    }
});

router.get('/student-stats', protect, async (req, res) => {
    try {
        const count = await User.countDocuments({ 
            role: 'student',
            schoolId: req.user.schoolId // FIXED: My school only
        });
        res.json({ totalStudents: count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats from database' });
    }
});

// @desc    Bulk Register Students via CSV (Day 188)
router.post('/bulk-register-students', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Neural File Missing! 🛡️' });

        const schoolId = req.user.schoolId;
        const jsonArray = await csv().fromFile(req.file.path);
        const User = require('../models/User');

        let successCount = 0;
        let errors = [];

        for (const data of jsonArray) {
            try {
                // 1. Generate Class Code (e.g., "10-C" -> "10C")
                const gradeCode = data.grade.replace(/[-\s]/g, "").toUpperCase();
                
                // 2. Class-wise ID Logic
                const lastStudent = await User.findOne({ schoolId, role: 'student', grade: data.grade }).sort({ createdAt: -1 });
                let nextSerial = 1;
                if (lastStudent && lastStudent.enrollmentNo) {
                    const lastSerialStr = lastStudent.enrollmentNo.slice(-3);
                    nextSerial = parseInt(lastSerialStr) + 1;
                }
                const generatedID = `STU${gradeCode}${nextSerial.toString().padStart(3, '0')}`;

                // 3. AUTO-GENERATE EMAIL: bachename + id + @edu.in
                // Example: rahulstu10c001@edu.in
                const firstName = data.name.split(" ")[0].toLowerCase();
                const autoEmail = `${firstName}${generatedID.toLowerCase()}@edu.in`;

                // 4. AUTO-GENERATE PASSWORD: name + birthYear + id
                // Example: rahul2006stu10c001
                const birthYear = data.dob.split("-")[0]; // Expecting YYYY-MM-DD from CSV
                const autoPassword = `${firstName}${birthYear}${generatedID.toLowerCase()}`;

                // Check for duplicate email
                const emailExists = await User.findOne({ email: autoEmail });
                if (emailExists) {
                    errors.push(`${data.name}: System-generated email already exists`);
                    continue;
                }

                await User.create({
                    name: data.name,
                    email: autoEmail,
                    password: autoPassword,
                    role: 'student',
                    schoolId: schoolId,
                    enrollmentNo: generatedID,
                    grade: data.grade,
                    fatherName: data.fatherName,
                    motherName: data.motherName,
                    dob: data.dob,
                    gender: data.gender || 'Male',
                    religion: data.religion || 'General',
                    phone: data.phone,
                    admissionNo: data.admissionNo,
                    address: {
                        fullAddress: data.fullAddress,
                        district: data.district,
                        state: data.state,
                        pincode: data.pincode
                    }
                });

                successCount++;
            } catch (err) {
                errors.push(`${data.name}: ${err.message}`);
            }
        }
        fs.unlinkSync(req.file.path);
        res.status(201).json({
            message: `Neural Link Established! ${successCount} Students Synced. Emails & Passwords Auto-Generated! ⚡`,
            errors: errors.length > 0 ? errors : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Bulk transmission failed' });
    }
});

// @desc    Bulk Register Teachers via CSV (Day 189)
// @route   POST /api/auth/bulk-register-teachers
router.post('/bulk-register-teachers', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Neural Faculty File Missing! 🛡️' });

        const schoolId = req.user.schoolId;
        const jsonArray = await csv().fromFile(req.file.path);

        let successCount = 0;
        let errors = [];

        for (const data of jsonArray) {
            try {
                // 1. Duplicate Email Check
                const userExists = await User.findOne({ email: data.email });
                if (userExists) {
                    errors.push(`${data.name}: Email already exists`);
                    continue;
                }

                // 2. EMP ID Logic (EMP001 sequence)
                const lastTeacher = await User.findOne({ 
                    schoolId, 
                    role: { $in: ['teacher', 'finance'] } 
                }).sort({ createdAt: -1 });

                let nextSerial = 1;
                if (lastTeacher && lastTeacher.employeeId && lastTeacher.employeeId.startsWith('EMP')) {
                    const lastNo = parseInt(lastTeacher.employeeId.replace('EMP', ''));
                    nextSerial = lastNo + 1;
                }
                const generatedID = `EMP${nextSerial.toString().padStart(3, '0')}`;

                // 3. AUTO-GENERATE EMAIL: name + empid + @edu.in
                const firstName = data.name.split(" ")[0].toLowerCase();
                const autoEmail = `${firstName}${generatedID.toLowerCase()}@edu.in`;

                // 4. AUTO-GENERATE PASSWORD: name + fatherInitial + motherInitial + birthYear
                // Logic: Ravi + (D)eshwal + (N)eeta + 1997 = ravidn1997
                const fInitial = data.fatherName.trim().charAt(0).toLowerCase();
                const mInitial = data.motherName.trim().charAt(0).toLowerCase();
                const birthYear = data.dob.split("-")[data.dob.split("-").length - 1]; // Handles both YYYY-MM-DD and DD-MM-YYYY
                const autoPassword = `${firstName}${fInitial}${mInitial}${birthYear}`;

                await User.create({
                    name: data.name,
                    email: autoEmail,
                    password: autoPassword,
                    role: data.role === 'finance' ? 'finance' : 'teacher',
                    schoolId: schoolId,
                    employeeId: generatedID,
                    subjects: data.subjects ? data.subjects.split(',').map(s => s.trim()) : [],
                    assignedClass: data.assignedClass || null,
                    fatherName: data.fatherName,
                    motherName: data.motherName,
                    dob: data.dob,
                    gender: data.gender || 'Male',
                    religion: data.religion || 'General',
                    phone: data.phone,
                    address: {
                        fullAddress: data.fullAddress,
                        district: data.district,
                        state: data.state,
                        pincode: data.pincode
                    }
                });

                successCount++;
            } catch (err) {
                errors.push(`${data.name}: ${err.message}`);
            }
        }

        fs.unlinkSync(req.file.path);
        res.status(201).json({
            message: `Neural Faculty Linked! ${successCount} Teachers Synced. ⚡`,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        res.status(500).json({ message: 'Faculty bulk transmission failed' });
    }
});

module.exports = router;
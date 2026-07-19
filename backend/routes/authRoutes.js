const express = require('express');
const { registerUser, authUser, changePassword, sendResetOTP, resetPassword } = require('../controllers/authController');
const router = express.Router();
const User = require('../models/User'); 
const { protect } = require('../middleware/authMiddleware'); 
const multer = require('multer');
const path = require('path');
const csv = require('csvtojson');
const crypto = require('crypto');
const fs = require('fs');

// 🔥 1. CLOUDINARY SETUP 🔥
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'raupi6es',
  api_key: '178392556982554',
  api_secret: 'Gj9McbEYgGUJ3lTEH26QXVv7II8'
});

// 🔥 2. IMAGE UPLOADER (Goes to Cloudinary) 🔥
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eduflow_avatars', // Cloudinary ke andar folder ka naam
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
  },
});

const uploadCloudinary = multer({ 
    storage: cloudStorage,
    limits: { fileSize: 5000000 } // 5MB Limit
});

// 🔥 3. CSV UPLOADER (Goes to Local Disk temporarily, then gets deleted) 🔥
const localStorageSetup = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = 'uploads/bulk_csv/';
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        cb(null, `bulk-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadLocal = multer({ 
    storage: localStorageSetup,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('csv') || file.mimetype === 'application/vnd.ms-excel' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed for bulk upload!'));
        }
    }
});

// --- ROUTES ---

router.post('/register', registerUser);
router.post('/login', authUser);
router.put('/change-password', protect, changePassword);
router.post('/send-otp', sendResetOTP);
router.post('/reset-password', resetPassword);

// 🔥 UPDATE PROFILE ROUTE (Uses uploadCloudinary) 🔥
router.put('/update-profile', protect, (req, res, next) => {
    uploadCloudinary.single('avatar')(req, res, function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        let updateFields = {};
        
        if (req.file) {
            // 🔥 MAJOR FIX: Cloudinary seedha secure HTTPS url deta hai req.file.path mein!
            updateFields.avatar = req.file.path; 
        }
        if (req.body.phone) {
            updateFields.phone = req.body.phone;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id, 
            { $set: updateFields }, 
            { new: true }
        );

        if (updatedUser) {
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar, // Live Cloudinary Link
                phone: updatedUser.phone,
                schoolId: updatedUser.schoolId, 
                token: req.headers.authorization?.split(' ')[1]
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("PROFILE UPDATE CRASH:", error);
        res.status(500).json({ message: 'Profile update failed' });
    }
});

router.get('/student-stats', protect, async (req, res) => {
    try {
        const count = await User.countDocuments({ 
            role: 'student',
            schoolId: req.user.schoolId
        });
        res.json({ totalStudents: count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats from database' });
    }
});

// @desc    Bulk Register Students via CSV (Uses uploadLocal)
router.post('/bulk-register-students', protect, uploadLocal.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Neural File Missing! 🛡️' });

        const schoolId = req.user.schoolId;
        const schoolCode = schoolId.toString().slice(-4).toLowerCase(); 
        const jsonArray = await csv().fromFile(req.file.path);
        const User = require('../models/User');

        let successCount = 0;
        let errors = [];
        let gradeCounters = {};
        let generatedCredentials = []; 

        for (const data of jsonArray) {
            try {
                if (!data.name || data.name.trim() === '') continue;

                const gradeCode = data.grade.replace(/[-\s]/g, "").toUpperCase();
                
                if (!gradeCounters[gradeCode]) {
                    const lastStudent = await User.findOne({ schoolId, role: 'student', grade: data.grade }).sort({ enrollmentNo: -1 });
                    let startSerial = 1;
                    if (lastStudent && lastStudent.enrollmentNo) {
                        const parsed = parseInt(lastStudent.enrollmentNo.slice(-3));
                        if (!isNaN(parsed)) startSerial = parsed + 1;
                    }
                    gradeCounters[gradeCode] = startSerial; 
                }

                const currentSerial = gradeCounters[gradeCode];
                const generatedID = `STU${gradeCode}${currentSerial.toString().padStart(3, '0')}`;

                const firstName = data.name.trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                const autoEmail = `${firstName}${generatedID.toLowerCase()}@sch${schoolCode}.in`;
                const autoPassword = crypto.randomBytes(4).toString('hex'); 
                
                let isoDob = "1990-01-01";
                if (data.dob) {
                    const parts = data.dob.trim().split(/[-/]/); 
                    if (parts.length === 3) {
                        if (parts[2].length === 4) isoDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        else if (parts[0].length === 4) isoDob = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                }

                const emailExists = await User.findOne({ email: autoEmail });
                if (emailExists) {
                    errors.push(`${data.name}: Collision Avoided`);
                    gradeCounters[gradeCode]++;
                    continue;
                }

                await User.create({
                    name: data.name.trim(),
                    email: autoEmail,
                    password: autoPassword, 
                    role: 'student',
                    schoolId: schoolId,
                    enrollmentNo: generatedID,
                    grade: data.grade,
                    fatherName: data.fatherName ? data.fatherName.trim() : "Unknown",
                    motherName: data.motherName ? data.motherName.trim() : "Unknown",
                    dob: isoDob, 
                    gender: data.gender ? data.gender.trim() : 'Male',
                    religion: data.religion ? data.religion.trim() : 'General',
                    phone: data.phone ? data.phone.trim() : "",
                    admissionNo: data.admissionNo ? data.admissionNo.trim() : "",
                    address: {
                        fullAddress: data.fullAddress ? data.fullAddress.trim() : "",
                        district: data.district ? data.district.trim() : "",
                        state: data.state ? data.state.trim() : "",
                        pincode: data.pincode ? data.pincode.trim() : ""
                    }
                });

                generatedCredentials.push({
                    name: data.name.trim(),
                    grade: data.grade,
                    email: autoEmail,
                    password: autoPassword
                });

                gradeCounters[gradeCode]++;
                successCount++;
            } catch (err) {
                errors.push(`${data.name}: ${err.message}`);
            }
        }
        
        // Delete the temporary CSV file
        fs.unlinkSync(req.file.path);

        generatedCredentials.sort((a, b) => {
            const getWeight = (g) => {
                let gl = g.toLowerCase();
                if (gl.includes('play') || gl.includes('pre')) return -4;
                if (gl.includes('nur')) return -3;
                if (gl.includes('lkg') || gl.includes('kg1')) return -2;
                if (gl.includes('ukg') || gl.includes('kg2')) return -1;
                const match = gl.match(/\d+/);
                return match ? parseInt(match[0]) : 999;
            };
            const wA = getWeight(a.grade);
            const wB = getWeight(b.grade);
            if (wA !== wB) return wA - wB;
            return a.name.localeCompare(b.name);
        });

        res.status(201).json({
            message: `Neural Link Established! ${successCount} Students Synced. ⚡`,
            errors: errors.length > 0 ? errors : null,
            credentials: generatedCredentials 
        });
    } catch (error) {
        res.status(500).json({ message: 'Bulk transmission failed' });
    }
});


// @desc    Bulk Register Teachers via CSV (Uses uploadLocal)
router.post('/bulk-register-teachers', protect, uploadLocal.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Neural Faculty File Missing! 🛡️' });

        const schoolId = req.user.schoolId;
        const schoolCode = schoolId.toString().slice(-4).toLowerCase(); 
        const jsonArray = await csv().fromFile(req.file.path);
        const User = require('../models/User');

        let successCount = 0;
        let errors = [];
        let generatedCredentials = []; 

        const lastTeacher = await User.findOne({ 
            schoolId, role: { $in: ['teacher', 'finance'] }, employeeId: { $exists: true, $ne: null }
        }).sort({ employeeId: -1 }); 

        let nextSerial = 1;
        if (lastTeacher && lastTeacher.employeeId && lastTeacher.employeeId.startsWith('EMP')) {
            const lastNo = parseInt(lastTeacher.employeeId.replace('EMP', ''));
            if (!isNaN(lastNo)) nextSerial = lastNo + 1;
        }

        for (const data of jsonArray) {
            try {
                if (!data.name || data.name.trim() === '') continue;

                const tName = data.name.trim();
                const tRole = (data.role && data.role.toLowerCase() === 'finance') ? 'finance' : 'teacher';
                const generatedID = `EMP${nextSerial.toString().padStart(3, '0')}`;
                
                const firstName = tName.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                const autoEmail = `${firstName}${generatedID.toLowerCase()}@sch${schoolCode}.in`;
                const autoPassword = crypto.randomBytes(4).toString('hex');

                let isoDob = "1990-01-01"; 
                if (data.dob) {
                    const parts = data.dob.trim().split(/[-/]/); 
                    if (parts.length === 3) {
                        if (parts[2].length === 4) isoDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        else if (parts[0].length === 4) isoDob = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                }

                const emailExists = await User.findOne({ email: autoEmail });
                if (emailExists) {
                    errors.push(`${tName}: Email collision detected.`);
                    nextSerial++; 
                    continue;
                }

                await User.create({
                    name: tName,
                    email: autoEmail,
                    password: autoPassword,
                    role: tRole,
                    schoolId: schoolId,
                    employeeId: generatedID,
                    subjects: data.subjects ? data.subjects.split(',').map(s => s.trim()).filter(Boolean) : [],
                    assignedClass: data.assignedClass ? data.assignedClass.trim().toUpperCase() : null,
                    fatherName: data.fatherName ? data.fatherName.trim() : "F",
                    motherName: data.motherName ? data.motherName.trim() : "M",
                    dob: isoDob, 
                    gender: data.gender ? data.gender.trim() : 'Male',
                    religion: data.religion ? data.religion.trim() : 'General',
                    phone: data.phone ? data.phone.trim() : "",
                    address: {
                        fullAddress: data.fullAddress ? data.fullAddress.trim() : "",
                        district: data.district ? data.district.trim() : "",
                        state: data.state ? data.state.trim() : "",
                        pincode: data.pincode ? data.pincode.trim() : ""
                    }
                });

                generatedCredentials.push({
                    name: tName,
                    role: tRole.toUpperCase(),
                    email: autoEmail,
                    password: autoPassword
                });

                nextSerial++;
                successCount++;

            } catch (err) {
                errors.push(`${data.name}: ${err.message}`);
            }
        }
        
        // Delete the temporary CSV file
        fs.unlinkSync(req.file.path);
        
        res.status(201).json({
            message: `Neural Faculty Linked! ${successCount} Teachers Synced. ⚡`,
            errors: errors.length > 0 ? errors : null,
            credentials: generatedCredentials
        });

    } catch (error) {
        res.status(500).json({ message: 'Faculty bulk transmission failed' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // FIXED: ObjectId conversion ke liye
const School = require('../models/School');
const User = require('../models/User');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const generateToken = require('../utils/generateToken');
const TechnicalIssue = require('../models/TechnicalIssue'); // 🔥 YE LINE ADD KARO

// 1. Add New School & Create its Admin
// 1. Add New School & Create its Admin (FIXED MAP LOGIC)
router.post('/onboard-school', protect, superAdminOnly, upload.single('logo'), async (req, res) => {
    try {
        const schoolInfo = JSON.parse(req.body.schoolInfo);
        const adminInfo = JSON.parse(req.body.adminInfo);
        const subscription = JSON.parse(req.body.subscription);

        const logoPath = req.file ? `/${req.file.path.replace(/\\/g, "/")}` : '/uploads/default-school.png';

        // 1. School Document Create
        const newSchool = await School.create({
            ...schoolInfo,
            logo: logoPath,
            adminDetails: adminInfo,
            subscription,
            sessionYear: req.body.sessionYear
        });

        // 2. Admin User Document Create (FIXED MAPPING)
        // Yahan dhyan de: ab hum adminInfo aur schoolInfo ke andar se data nikaal rahe hain
        await User.create({
            name: adminInfo.fullName,
            email: adminInfo.email,
            password: req.body.tempPassword,
            role: 'admin',
            schoolId: newSchool._id,
            phone: adminInfo.mobile,
            
            // DAY 78 FIX: Mapping from the correct nested objects
            fatherName: adminInfo.fatherName || 'Master Root', // Agar frontend se adminInfo mein bhej rahe ho
            motherName: adminInfo.motherName || 'N/A',
            dob: adminInfo.dob || null,
            gender: adminInfo.gender || 'Other',
            religion: adminInfo.religion || 'Global',
            
            address: {
                fullAddress: schoolInfo.address, 
                state: schoolInfo.state || 'N/A',
                district: schoolInfo.district || 'N/A',
                pincode: schoolInfo.pincode || 'N/A',
                country: 'India'
            },
            grade: 'MASTER NODE'
        });

        res.status(201).json(newSchool);
    } catch (error) {
        console.error("Onboarding Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Update SuperAdmin Profile
// Update SuperAdmin Profile (FIXED ADDRESS MAPPING)
router.put('/update-profile', protect, superAdminOnly, upload.single('avatar'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Master Root not found' });

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.mobile || user.phone; // user.mobile ko user.phone kiya schema match karne ke liye

        // ADDRESS FIX: String ko Object ke fullAddress mein dalo
        if (req.body.address) {
            user.address = {
                ...user.address, // purana data rakho
                fullAddress: req.body.address // naya string yahan dalo
            };
        }

        if (req.file) {
            user.avatar = `/${req.file.path.replace(/\\/g, "/")}`;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            address: updatedUser.address?.fullAddress || "", // Frontend ko string wapas bhejo
            avatar: updatedUser.avatar,
            token: req.headers.authorization.split(' ')[1]
        });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: 'Master Sync Failed: ' + error.message });
    }
});

// DAY 68: FIXED Delete Protocol (Soft Delete to keep Revenue)
router.delete('/delete-school/:id', protect, superAdminOnly, async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: 'School not found' });

        await User.deleteMany({ schoolId: req.params.id });
        school.subscription.status = 'Terminated';
        school.isDeleted = true;
        await school.save();

        res.json({ message: 'Institution deactivated. Revenue records preserved. 🗑️' });
    } catch (error) {
        res.status(500).json({ message: 'Deletion failed' });
    }
});

// Ghost Login (FIXED: Improved ID matching)
router.get('/login-as-school/:id', protect, superAdminOnly, async (req, res) => {
    try {
        const targetId = req.params.id;
        const schoolAdmin = await User.findOne({ schoolId: targetId, role: 'admin' });

        if (!schoolAdmin) {
            console.log("No Admin found for schoolId:", targetId);
            return res.status(404).json({ message: 'Admin for this institution not found. Check if the school was created correctly.' });
        }

        res.json({
            _id: schoolAdmin._id,
            name: schoolAdmin.name,
            email: schoolAdmin.email,
            role: schoolAdmin.role,
            schoolId: schoolAdmin.schoolId,
            token: generateToken(schoolAdmin._id)
        });
    } catch (error) {
        console.error("Ghost Login Error:", error);
        res.status(500).json({ message: 'Ghost login authorization failed' });
    }
});

router.put('/update-school/:id', protect, superAdminOnly, async (req, res) => {
    try {
        const updatedSchool = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // 🔥 NAYA: School ke sath-sath Admin ke address fields ko bhi forcibly update karo
        const updatePayload = {};
        if (req.body.adminDetails) {
            updatePayload.name = req.body.adminDetails.fullName;
            updatePayload.email = req.body.adminDetails.email;
            updatePayload.phone = req.body.adminDetails.mobile;
        }
        
        // Address parameters push
        updatePayload['address.fullAddress'] = req.body.address;
        updatePayload['address.pincode'] = req.body.pincode;
        updatePayload['address.district'] = req.body.district;
        updatePayload['address.state'] = req.body.state;

        await User.findOneAndUpdate(
            { schoolId: req.params.id, role: 'admin' },
            { $set: updatePayload }
        );

        res.json(updatedSchool);
    } catch (error) {
        res.status(500).json({ message: 'Update failed' });
    }
});

// Stats Route 
router.get('/stats', protect, superAdminOnly, async (req, res) => {
    try {
        const allSchools = await School.find();
        const totalRevenue = allSchools.reduce((acc, curr) => acc + curr.subscription.totalPaid, 0);

        const visibleSchools = allSchools.filter(s => !s.isDeleted);
        const activeSchools = visibleSchools.filter(s => s.subscription.status === 'Active').length;

        const issueCount = await TechnicalIssue.countDocuments(); 
        // Sirf unka count jo abhi tak resolve nahi huye (Action Required)
        const pendingIssues = await TechnicalIssue.countDocuments({ status: 'Pending' });

        // Step 1: Aggregating analytics for each school
        const schoolsWithStats = await Promise.all(visibleSchools.map(async (school) => {
            const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
            const teacherCount = await User.countDocuments({ 
                schoolId: school._id, 
                role: { $in: ['teacher', 'finance'] } 
            });

            // 🔥 NAYA: Admin ki asli detailed address nikal kar bhej rahe hain
            const adminData = await User.findOne({ schoolId: school._id, role: 'admin' }).select('address');

            return {
                ...school._doc,
                studentCount,
                teacherCount,
                adminAddress: adminData ? adminData.address : {} // Frontend ko bhejo
            };
        }));

       res.json({
            totalSchools: visibleSchools.length,
            activeSchools,
            totalRevenue,
            issueCount,      // 🔥 Dashboard card par dikhega
            pendingIssues,   // 🔥 Red Alert Badge mein dikhega
            schools: schoolsWithStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Stats fetch failed' });
    }
});

module.exports = router;
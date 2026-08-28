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

// ==========================================================
// 🔥 OPTIMIZED STATS ROUTE (FAANG LEVEL SPEED) 🔥
// ==========================================================
router.get('/stats', protect, superAdminOnly, async (req, res) => {
    try {
        // Step 1: Get all schools
        const allSchools = await School.find();
        
        // Safety check add kiya '?.totalPaid' taaki undefined error na aaye
        const totalRevenue = allSchools.reduce((acc, curr) => acc + (curr.subscription?.totalPaid || 0), 0);

        const visibleSchools = allSchools.filter(s => !s.isDeleted);
        const activeSchools = visibleSchools.filter(s => s.subscription?.status === 'Active').length;

        // Step 2: Global Technical Issues count
        const issueCount = await TechnicalIssue.countDocuments(); 
        const pendingIssues = await TechnicalIssue.countDocuments({ status: 'Pending' });

        // Step 3: Extract all School IDs (Master Array)
        const schoolIds = visibleSchools.map(s => s._id);

        // 🔥 THE MAGIC: 100 queries ki jagah sirf 1 Aggregation query students ke liye 🔥
        const studentCounts = await User.aggregate([
            { $match: { schoolId: { $in: schoolIds }, role: 'student' } },
            { $group: { _id: '$schoolId', count: { $sum: 1 } } }
        ]);

        // 🔥 The MAGIC: Sirf 1 Aggregation query teachers ke liye 🔥
        const teacherCounts = await User.aggregate([
            { $match: { schoolId: { $in: schoolIds }, role: { $in: ['teacher', 'finance'] } } },
            { $group: { _id: '$schoolId', count: { $sum: 1 } } }
        ]);

        // 🔥 Sirf 1 query saare Admins ka address nikalne ke liye 🔥
        const admins = await User.find({ schoolId: { $in: schoolIds }, role: 'admin' }).select('schoolId address');

        // Step 4: Data ko memory mein map kar do (Super Fast execution)
        const schoolsWithStats = visibleSchools.map(school => {
            const sIdStr = school._id.toString();

            // Find matching data from our 3 quick queries
            const stdData = studentCounts.find(s => s._id && s._id.toString() === sIdStr);
            const tchData = teacherCounts.find(t => t._id && t._id.toString() === sIdStr);
            const adminData = admins.find(a => a.schoolId && a.schoolId.toString() === sIdStr);

            return {
                ...school._doc,
                studentCount: stdData ? stdData.count : 0,
                teacherCount: tchData ? tchData.count : 0,
                adminAddress: adminData ? adminData.address : {} 
            };
        });

        res.json({
            totalSchools: visibleSchools.length,
            activeSchools,
            totalRevenue,
            issueCount,      
            pendingIssues,   
            schools: schoolsWithStats
        });

    } catch (error) {
        console.error("🔥 STATS FETCH CRITICAL ERROR:", error);
        res.status(500).json({ message: 'Stats fetch failed due to server error' });
    }
});

// ==========================================================
// 🔥 PREMIUM FEATURE TOGGLE: TRANSPORT MODULE 🔥
// ==========================================================
router.put('/toggle-transport/:id', protect, superAdminOnly, async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: 'School not found' });

        // Status ko flip kar do (True hai toh False, False hai toh True)
        school.hasTransportFeature = !school.hasTransportFeature;
        await school.save();

        res.json({ 
            message: `Transport Feature is now ${school.hasTransportFeature ? 'ON' : 'OFF'} for ${school.schoolName}`, 
            hasTransportFeature: school.hasTransportFeature 
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle transport feature' });
    }
});

module.exports = router;
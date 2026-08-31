const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const User = require('../models/User');

// 🔥 CUSTOM SECURITY MIDDLEWARE
const transportAuth = (req, res, next) => {
    if (req.user && ['transport_incharge', 'admin', 'superadmin'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Access Denied: Transport Clearance Required! 🛑' });
    }
};

// ==========================================================
// 🔥 DRIVERS ENGINE (Custom ID & Password Included) 🔥
// ==========================================================

// @route   POST /api/transport/drivers
router.post('/drivers', protect, transportAuth, async (req, res) => {
    try {
        const { name, phone, address, dob, gender, email, customId, password } = req.body;

        // Phone, Email ya CustomID koi bhi duplicate nahi hona chahiye
        const exists = await User.findOne({
            schoolId: req.user.schoolId,
            $or: [{ phone }, { email: email.toLowerCase() }, { customId: customId.toLowerCase() }]
        });

        if (exists) return res.status(400).json({ message: 'Driver with this Phone, Email, or Custom ID already exists! ⚠️' });

        const driver = await User.create({
            schoolId: req.user.schoolId,
            name, phone, dob, gender,
            address: { fullAddress: address },
            role: 'driver',
            email: email.toLowerCase(), // Asli email save ho raha hai
            customId: customId.toLowerCase(),
            password: password 
        });

        res.status(201).json({ message: 'Driver added successfully! 👤', driver });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add driver: ' + error.message });
    }
});

// @route   PUT /api/transport/drivers/:id
router.put('/drivers/:id', protect, transportAuth, async (req, res) => {
    try {
        const { name, phone, address, dob, gender, email } = req.body;

        // Check karo ki naya phone ya email kisi aur ke paas to nahi
        const exists = await User.findOne({ 
            schoolId: req.user.schoolId, 
            _id: { $ne: req.params.id },
            $or: [{ phone }, { email: email.toLowerCase() }] 
        });
        
        if (exists) return res.status(400).json({ message: 'Phone or Email already in use by another user!' });

        const driver = await User.findByIdAndUpdate(req.params.id, {
            name, phone, dob, gender, email: email.toLowerCase(), 'address.fullAddress': address
        }, { new: true });

        res.json({ message: 'Driver details updated successfully! ✅', driver });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update driver.' });
    }
});

// @route   GET /api/transport/drivers
router.get('/drivers', protect, transportAuth, async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver', schoolId: req.user.schoolId }).sort({ createdAt: -1 });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch drivers.' });
    }
});

// @route   DELETE /api/transport/drivers/:id
router.delete('/drivers/:id', protect, transportAuth, async (req, res) => {
    try {
        const isAssigned = await Vehicle.findOne({ driver: req.params.id });
        if (isAssigned) return res.status(400).json({ message: `Cannot delete! Driver is assigned to Bus: ${isAssigned.vehicleNumber}` });

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Driver deleted successfully! 🗑️' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete driver.' });
    }
});

// ==========================================================
// 🔥 VEHICLE ENGINE (With Auto-Swap Logic) 🔥
// ==========================================================

// @route   POST /api/transport/vehicles
router.post('/vehicles', protect, transportAuth, async (req, res) => {
    try {
        const { vehicleNumber, seatingCapacity, driverId } = req.body;
        
        const exists = await Vehicle.findOne({ schoolId: req.user.schoolId, vehicleNumber: vehicleNumber.toUpperCase().trim() });
        if(exists) return res.status(400).json({ message: `Bus ${vehicleNumber} is already in the list! ⚠️` });

        // Nayi bus banate waqt agar kisi dusri bus ka driver assign kiya, toh us dusri bus ko khali (null) kar do
        if (driverId) {
            const otherBus = await Vehicle.findOne({ schoolId: req.user.schoolId, driver: driverId });
            if (otherBus) {
                otherBus.driver = null;
                await otherBus.save();
            }
        }

        const vehicle = await Vehicle.create({
            schoolId: req.user.schoolId,
            vehicleNumber: vehicleNumber.toUpperCase().trim(),
            seatingCapacity,
            driver: driverId || null
        });

        res.status(201).json({ message: 'Bus added successfully! 🚌', vehicle });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add bus: ' + error.message });
    }
});

// @route   PUT /api/transport/vehicles/:id
router.put('/vehicles/:id', protect, transportAuth, async (req, res) => {
    try {
        const { vehicleNumber, seatingCapacity, driverId } = req.body;

        const exists = await Vehicle.findOne({ schoolId: req.user.schoolId, vehicleNumber: vehicleNumber.toUpperCase().trim(), _id: { $ne: req.params.id } });
        if (exists) return res.status(400).json({ message: `Bus ${vehicleNumber} is already in the list! ⚠️` });

        // 🔥 SWAP DRIVER LOGIC 🔥
        const currentBus = await Vehicle.findById(req.params.id);
        const oldDriverId = currentBus.driver;
        const newDriverId = driverId || null;

        if (newDriverId && String(newDriverId) !== String(oldDriverId)) {
            const otherBus = await Vehicle.findOne({ schoolId: req.user.schoolId, driver: newDriverId });
            if (otherBus) {
                otherBus.driver = oldDriverId; 
                await otherBus.save();
            }
        }

        const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, {
            vehicleNumber: vehicleNumber.toUpperCase().trim(),
            seatingCapacity,
            driver: newDriverId
        }, { new: true });

        res.json({ message: 'Bus updated successfully! ✅', vehicle });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update bus.' });
    }
});

// @route   GET /api/transport/vehicles
router.get('/vehicles', protect, transportAuth, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ schoolId: req.user.schoolId }).populate('driver', 'name phone').sort({ createdAt: -1 });
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch buses.' });
    }
});

// @route   DELETE /api/transport/vehicles/:id
router.delete('/vehicles/:id', protect, transportAuth, async (req, res) => {
    try {
        const isAssigned = await Route.findOne({ vehicle: req.params.id });
        if (isAssigned) {
            return res.status(400).json({ message: `Cannot delete! This bus is assigned to route: ${isAssigned.routeName} ⚠️` });
        }

        await Vehicle.findByIdAndDelete(req.params.id);
        res.json({ message: 'Vehicle purged from the system! 🗑️' });
    } catch (error) {
        res.status(500).json({ message: 'Delete operation failed.' });
    }
});

// ==========================================================
// 🔥 ROUTES & STOPS ENGINE 🔥
// ==========================================================

// @route   POST /api/transport/routes
router.post('/routes', protect, transportAuth, async (req, res) => {
    try {
        const { routeName, vehicleId, stops } = req.body;

        const route = await Route.create({
            schoolId: req.user.schoolId,
            routeName: routeName.toUpperCase().trim(),
            vehicle: vehicleId || null,
            stops: stops || []
        });

        res.status(201).json({ message: 'Transport Route Activated Successfully! 🗺️', route });
    } catch (error) {
        res.status(500).json({ message: 'Route generation failed: ' + error.message });
    }
});

// @route   GET /api/transport/routes
router.get('/routes', protect, transportAuth, async (req, res) => {
    try {
        const routes = await Route.find({ schoolId: req.user.schoolId })
            .populate('vehicle', 'vehicleNumber seatingCapacity status')
            .sort({ createdAt: -1 });

        res.json(routes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch routes.' });
    }
});

// @route   PUT /api/transport/routes/:id
router.put('/routes/:id', protect, transportAuth, async (req, res) => {
    try {
        const { routeName, vehicleId, stops, status } = req.body;

        const route = await Route.findByIdAndUpdate(
            req.params.id,
            {
                routeName: routeName.toUpperCase().trim(),
                vehicle: vehicleId || null,
                stops,
                status
            },
            { new: true }
        ).populate('vehicle', 'vehicleNumber seatingCapacity status');

        res.json({ message: 'Route updated! ✅', route });
    } catch (error) {
        res.status(500).json({ message: 'Route modification failed.' });
    }
});

// @route   DELETE /api/transport/routes/:id
router.delete('/routes/:id', protect, transportAuth, async (req, res) => {
    try {
        await Route.findByIdAndDelete(req.params.id);
        res.json({ message: 'Route removed from tracking grid. 🗑️' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete route.' });
    }
});

module.exports = router;
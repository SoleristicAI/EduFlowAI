const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const User = require('../models/User');
const Trip = require('../models/Trip');

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

        // 🔥 AUTO-REMOVE BUS FROM OLD ROUTE 🔥
        if (vehicleId) {
            const oldRoute = await Route.findOne({ schoolId: req.user.schoolId, vehicle: vehicleId });
            if (oldRoute) {
                oldRoute.vehicle = null;
                await oldRoute.save();
            }
        }

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

        // 🔥 SWAP / AUTO-REMOVE BUS LOGIC 🔥
        if (vehicleId) {
            const oldRoute = await Route.findOne({ 
                schoolId: req.user.schoolId, 
                vehicle: vehicleId, 
                _id: { $ne: req.params.id } 
            });
            if (oldRoute) {
                oldRoute.vehicle = null;
                await oldRoute.save();
            }
        }

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


// ==========================================================
// 🔥 DRIVER PORTAL ENGINE (My Assignment & Trips) 🔥
// ==========================================================

// @route   GET /api/transport/driver/my-assignment
// @desc    Get currently assigned bus and route for the logged-in driver
router.get('/driver/my-assignment', protect, async (req, res) => {
    try {
        // 1. Check if the logged-in user is actually a driver (Ye guard ka kaam karega)
        if (req.user.role !== 'driver') {
            return res.status(403).json({ message: 'Access Denied: Only drivers can access this portal.' });
        }

        // 2. Find the bus assigned to this driver
        const vehicle = await Vehicle.findOne({ schoolId: req.user.schoolId, driver: req.user._id });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'No bus assigned to you currently. Contact Transport Manager.' });
        }

        // 3. Find the route where this bus is operating
        const route = await Route.findOne({ schoolId: req.user.schoolId, vehicle: vehicle._id });

        res.json({
            message: 'Assignment fetched successfully',
            vehicle: {
                _id: vehicle._id,
                vehicleNumber: vehicle.vehicleNumber,
                seatingCapacity: vehicle.seatingCapacity
            },
            route: route ? {
                _id: route._id,
                routeName: route.routeName,
                stops: route.stops
            } : null 
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assignment: ' + error.message });
    }
});

// ==========================================================
// 🔥 TRIP MANAGEMENT ENGINE (Start & End Trips) 🔥
// ==========================================================

// @route   POST /api/transport/trips/start
// @desc    Driver starts a morning or evening trip
router.post('/trips/start', protect, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ message: 'Access Denied: Only drivers can start trips.' });
        }

        const { vehicleId, routeId, tripType } = req.body;

        if (!vehicleId || !routeId || !tripType) {
            return res.status(400).json({ message: 'Vehicle, Route, and Trip Type are required! ⚠️' });
        }

        // Check karo ki kahin is bus ki koi purani trip already ACTIVE toh nahi hai
        const activeTrip = await Trip.findOne({ vehicle: vehicleId, status: 'ACTIVE' });
        if (activeTrip) {
            return res.status(400).json({ message: 'A trip is already active for this bus! ⚠️' });
        }

        // Nayi trip create karo
        const trip = await Trip.create({
            schoolId: req.user.schoolId,
            vehicle: vehicleId,
            route: routeId,
            driver: req.user._id,
            tripType,
            status: 'ACTIVE',
            startTime: new Date()
        });

        res.status(201).json({ 
            message: `${tripType} Trip Started Successfully! 🚌🚀`, 
            tripId: trip._id,
            trip 
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to start trip: ' + error.message });
    }
});

// @route   PUT /api/transport/trips/end/:tripId
// @desc    Driver ends the active trip
router.put('/trips/end/:tripId', protect, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ message: 'Access Denied: Only drivers can end trips.' });
        }

        const trip = await Trip.findOne({ _id: req.params.tripId, driver: req.user._id, status: 'ACTIVE' });
        
        if (!trip) {
            return res.status(404).json({ message: 'Active trip not found or already completed.' });
        }

        trip.status = 'COMPLETED';
        trip.endTime = new Date();
        await trip.save();

        res.json({ message: 'Trip Ended Successfully. Safe Parking! ✅', trip });

    } catch (error) {
        res.status(500).json({ message: 'Failed to end trip: ' + error.message });
    }
});

module.exports = router;
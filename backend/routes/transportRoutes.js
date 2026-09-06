const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const User = require('../models/User');
const Trip = require('../models/Trip');
const BusAttendance = require('../models/BusAttendance');

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
        if (exists) return res.status(400).json({ message: `Bus ${vehicleNumber} is already in the list! ⚠️` });

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

        // 🔥 4. Check if this bus already has an ACTIVE trip running
        const activeTrip = await Trip.findOne({ vehicle: vehicle._id, status: 'ACTIVE' });

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
            } : null,
            // 🔥 Agar trip active hai, toh uski details bhi bhej do
            activeTrip: activeTrip ? {
                _id: activeTrip._id,
                tripType: activeTrip.tripType
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

// ==========================================================
// 🔥 TRANSPORTER DASHBOARD API (Live Active Trips) 🔥
// ==========================================================

// @route   GET /api/transport/trips/active
// @desc    Get all currently active trips for the school dashboard
router.get('/trips/active', protect, async (req, res) => {
    try {
        // 🔥 1. Sabse pehle user check karo (transporter, admin ya superadmin)
        if (!['transport_incharge', 'transporter', 'admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access Denied: Not authorized for dashboard' });
        }

        // 🔥 2. Trips fetch karo aur vehicle, route ki details jodo taaki app crash na ho
        const activeTrips = await Trip.find({ schoolId: req.user.schoolId, status: 'ACTIVE' })
            .populate({ path: 'vehicle', select: 'vehicleNumber seatingCapacity' })
            .populate({ path: 'route', select: 'routeName stops' })
            .populate({ path: 'driver', select: 'name phone' });

        res.json({ trips: activeTrips });
    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        res.status(500).json({ message: 'Failed to fetch active trips', error: error.message });
    }
});

// ==========================================================
// 🔥 BULK STUDENT TRANSPORT ASSIGNMENT ENGINE 🔥
// ==========================================================

// @route   PUT /api/transport/assign-students
// @desc    Assign routes and stops to multiple students at once
router.put('/assign-students', protect, transportAuth, async (req, res) => {
    try {
        const { assignments, routeId } = req.body;
        // assignments will be an array: [{ studentId, stopName, stopPrice }]

        if (!assignments || assignments.length === 0) {
            return res.status(400).json({ message: "No students selected for assignment." });
        }

        // Saare selected bacchon ko DB mein update kar rahe hain
        for (let assign of assignments) {
            await User.findByIdAndUpdate(assign.studentId, {
                transportRoute: routeId,
                transportStop: {
                    stopName: assign.stopName,
                    price: assign.stopPrice
                }
            });
        }

        res.json({ message: `${assignments.length} Students successfully assigned to the route! ✅` });
    } catch (error) {
        console.error("Assignment Error:", error);
        res.status(500).json({ message: 'Failed to assign students', error: error.message });
    }
});

// ==========================================================
// 🔥 ROUTE-WISE STUDENT ROSTER ENGINE 🔥
// ==========================================================

// @route   GET /api/transport/routes/:routeId/students
// @desc    Get all active students assigned to a specific route
router.get('/routes/:routeId/students', protect, transportAuth, async (req, res) => {
    try {
        const students = await User.find({
            schoolId: req.user.schoolId,
            role: 'student',
            transportRoute: req.params.routeId,
            status: { $nin: ['Alumni', 'Left'] } // Sirf current bacche
        })
            .select('name grade enrollmentNo phone address transportStop avatar transportRoute')
            .populate('transportRoute', 'routeName');

        res.json(students);
    } catch (error) {
        console.error("Route Students Fetch Error:", error);
        res.status(500).json({ message: 'Failed to fetch students for this route.' });
    }
});

// ==========================================================
// 🔥 DRIVER BUS BOARDING / ATTENDANCE ENGINE 🔥
// ==========================================================

// 1. Fetch Students Grouped by Stops with TODAY'S SAVE STATUS
router.get('/driver/attendance-list/:routeId', protect, async (req, res) => {
    try {
        if (req.user.role !== 'driver') return res.status(403).json({ message: 'Access Denied' });

        const route = await Route.findById(req.params.routeId);
        if (!route) return res.status(404).json({ message: 'Route not found' });

        const { tripType } = req.query; // 'MORNING' ya 'EVENING' pass karenge
        const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

        // Aaj ke is route aur tripType ke saare saved attendance records nikaalo
        const todaySaved = await BusAttendance.find({
            routeId: req.params.routeId,
            tripType: tripType,
            dateStr: todayStr
        });

        const students = await User.find({
            schoolId: req.user.schoolId,
            role: 'student',
            transportRoute: req.params.routeId,
            status: { $nin: ['Alumni', 'Left'] }
        }).select('name enrollmentNo transportStop avatar');

        // Stops ke hisaab se grouping + Check if already saved today
        const groupedData = route.stops.map(stop => {
            const savedRecord = todaySaved.find(s => s.stopName === stop.stopName);
            return {
                stopName: stop.stopName,
                pickupTime: stop.pickupTime,
                dropTime: stop.dropTime,
                isSavedToday: !!savedRecord, // Agar aaj save hua hai toh true
                savedRecords: savedRecord ? savedRecord.records : [], // Pehle ki lagai hui P/A
                students: students.filter(s => s.transportStop && s.transportStop.stopName === stop.stopName)
            };
        });

        res.json({ date: todayStr, groupedData });
    } catch (error) {
        console.error("Attendance List Error:", error);
        res.status(500).json({ message: 'Failed to fetch boarding list' });
    }
});

// 2. Save Attendance Per Stop
router.post('/driver/save-attendance', protect, async (req, res) => {
    try {
        if (req.user.role !== 'driver') return res.status(403).json({ message: 'Access Denied' });

        const todayStr = new Date().toISOString().split('T')[0];
        const { tripId, routeId, tripType, stopName, records } = req.body;

        // Check karo ki is trip aur is stop ki attendance pehle lagi hai ya nahi
        let attendance = await BusAttendance.findOne({
            routeId,
            tripType,
            stopName,
            dateStr: todayStr
        });

        if (attendance) {
            attendance.records = records;
            await attendance.save();
        } else {
            await BusAttendance.create({
                schoolId: req.user.schoolId,
                tripId,
                routeId,
                tripType,
                dateStr: todayStr,
                stopName,
                records
            });
        }

        res.json({ message: `Attendance saved for ${stopName}! ✅` });
    } catch (error) {
        console.error("Save Attendance Error:", error);
        res.status(500).json({ message: 'Failed to save attendance' });
    }
});

// ==========================================================
// 🔥 STUDENT TRANSPORT PORTAL (MY BUS & ATTENDANCE) 🔥
// ==========================================================

// 1. Get Student's Assigned Bus & Driver Details
router.get('/student/my-bus', protect, async (req, res) => {
    try {
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can access this.' });

        const student = await User.findById(req.user._id).populate({
            path: 'transportRoute',
            populate: { path: 'vehicle', populate: { path: 'driver', select: 'name phone' } }
        });

        if (!student.transportRoute) {
            return res.status(400).json({ message: 'No transport assigned to you.' });
        }

        res.json({
            route: student.transportRoute.routeName,
            stop: student.transportStop,
            vehicle: student.transportRoute.vehicle,
            driver: student.transportRoute.vehicle?.driver
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bus details.' });
    }
});

// 2. Get Student's Transport Attendance (Month-wise)
router.get('/student/my-attendance', protect, async (req, res) => {
    try {
        const { month } = req.query; // format: "YYYY-MM"
        const studentId = req.user._id;

        // Find all attendance records for this month where this student exists
        const attendanceRecords = await BusAttendance.find({
            dateStr: { $regex: `^${month}` },
            "records.studentId": studentId
        });

        let presentCount = 0;
        let absentCount = 0;
        let history = [];

        attendanceRecords.forEach(record => {
            const studentRecord = record.records.find(r => r.studentId.toString() === studentId.toString());
            if (studentRecord) {
                if (studentRecord.status === 'Present') presentCount++;
                if (studentRecord.status === 'Absent') absentCount++;
                
                history.push({
                    date: record.dateStr,
                    tripType: record.tripType,
                    status: studentRecord.status
                });
            }
        });

        res.json({ presentDays: presentCount, absentDays: absentCount, history });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch transport attendance.' });
    }
});

// ==========================================================
// 🔥 TRANSPORTER DASHBOARD & ATTENDANCE VIEWER APIs 🔥
// ==========================================================

// 1. Get Dashboard Fleet Stats
router.get('/stats', protect, transportAuth, async (req, res) => {
    try {
        const totalDrivers = await User.countDocuments({ schoolId: req.user.schoolId, role: 'driver' });
        const totalVehicles = await Vehicle.countDocuments({ schoolId: req.user.schoolId });
        const totalRoutes = await Route.countDocuments({ schoolId: req.user.schoolId });
        // Bacche jinko transportRoute assign ho chuka hai
        const totalStudents = await User.countDocuments({ schoolId: req.user.schoolId, role: 'student', transportRoute: { $ne: null } });

        res.json({ totalDrivers, totalVehicles, totalRoutes, totalStudents });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch fleet stats' });
    }
});

// 2. Transporter Viewing Specific Student's Attendance
router.get('/student-attendance/:studentId', protect, transportAuth, async (req, res) => {
    try {
        const { month } = req.query; // "YYYY-MM"
        const studentId = req.params.studentId;

        const attendanceRecords = await require('../models/BusAttendance').find({
            dateStr: { $regex: `^${month}` },
            "records.studentId": studentId
        });

        let presentCount = 0;
        let absentCount = 0;
        let history = [];

        attendanceRecords.forEach(record => {
            const studentRecord = record.records.find(r => r.studentId.toString() === studentId);
            if (studentRecord) {
                if (studentRecord.status === 'Present') presentCount++;
                if (studentRecord.status === 'Absent') absentCount++;
                
                history.push({
                    date: record.dateStr,
                    tripType: record.tripType,
                    status: studentRecord.status
                });
            }
        });

        res.json({ presentDays: presentCount, absentDays: absentCount, history });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch student attendance.' });
    }
});

module.exports = router;
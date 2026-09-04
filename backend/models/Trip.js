const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'School'
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Vehicle'
    },
    route: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Route'
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    tripType: {
        type: String,
        enum: ['MORNING', 'EVENING'],
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED'],
        default: 'ACTIVE'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
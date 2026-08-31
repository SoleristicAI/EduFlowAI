const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    
    // Vehicle Basic Info
    vehicleNumber: { type: String, required: true, uppercase: true, trim: true }, // e.g., HR20AB1234
    seatingCapacity: { type: Number, required: true },
    
    // Driver Details (Driver ka User account banega, uski reference yahan aayegi)
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Compliance & Fleet Health (Premium Feature)
    insuranceExpiry: { type: Date },
    pollutionExpiry: { type: Date },
    fitnessExpiry: { type: Date },

    // Operational Status
    status: { 
        type: String, 
        enum: ['Active', 'Maintenance', 'Inactive'], 
        default: 'Active' 
    }
}, { timestamps: true });

// Ek school mein same number plate ki 2 bus nahi ho sakti
vehicleSchema.index({ schoolId: 1, vehicleNumber: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
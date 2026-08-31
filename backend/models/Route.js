const mongoose = require('mongoose');

// Sub-schema: Route ke andar aane wale stops
const stopSchema = new mongoose.Schema({
    stopName: { type: String, required: true, uppercase: true }, // e.g., NORTH SECTOR 15
    monthlyFee: { type: Number, required: true }, // Alag stop ki alag fees
    pickupTime: { type: String }, // e.g., "07:30 AM"
    dropTime: { type: String },   // e.g., "02:30 PM"
    
    // Future Geofencing ke liye coordinates
    location: {
        lat: { type: Number },
        lng: { type: Number }
    }
});

const routeSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    
    routeName: { type: String, required: true, uppercase: true }, // e.g., NORTH CITY ROUTE
    
    // Route par kaun si bus chal rahi hai
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }, 
    
    // Array of Stops (Sequence mein)
    stops: [stopSchema], 
    
    status: { 
        type: String, 
        enum: ['Active', 'Inactive'], 
        default: 'Active' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
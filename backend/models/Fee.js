const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountPaid: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    month: { type: String, required: true }, // e.g., "February"
    year: { type: Number, required: true },
    session: { type: String },
    paymentMode: {
        type: String, required: true, enum: ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'PhonePe', 'Google Pay', 'Paytm', 'UPI'],
        default: 'Cash'
    },
    paymentScreenshot: { type: String }, 
    status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Verified' }, 
    penaltyAmount: { type: Number, default: 0 }, 
    
    // 👇🔥 THE MASTER FIX: YE SAARI FIELDS MISSING THI! 🔥👇
    feeType: { type: String, enum: ['Academic', 'Transport'], default: 'Academic' }, // Ye define karega fee kahan jayegi
    feeCategory: { type: String },
    remarks: { type: String },
    
    // Immutable Snapshots (Taaki receipt humesha same dikhe)
    recordedGrade: { type: String },
    recordedEnrollmentNo: { type: String },
    recordedRoute: { type: String },
    recordedStop: { type: String }
    // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆

}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
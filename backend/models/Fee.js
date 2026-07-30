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
        type: String, required: true, enum: ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'PhonePe', 'Google Pay', 'Paytm', 'UPI'], // Inhe add karo
        default: 'Cash'},
    paymentScreenshot: { type: String }, 
    status: { type: String, enum: ['Pending', 'Verified'], default: 'Verified' }, 
    penaltyAmount: { type: Number, default: 0 }, // Ye field hum penalty save karne ke liye use karenge
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    schoolName: { type: String, required: true },
    address: { type: String, required: true },
    affiliationNo: { type: String, required: true, unique: true },
    logo: { type: String },
    adminDetails: {
        fullName: String,
        mobile: String,
        email: { type: String, unique: true },
        designation: String
    },
    subscription: {
        monthlyFee: { type: Number, default: 0 },
        totalPaid: { type: Number, default: 0 },
        status: { type: String, enum: ['Active', 'Terminated'], default: 'Active' },
        onboardingDate: { type: Date, default: Date.now },

        // --- DAY 73: AUTOMATED BILLING FIELDS ---
        lastPaymentDate: { type: Date, default: Date.now },
        nextPaymentDate: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default: 30 days from now
        },
        hasPaidAdvance: { type: Boolean, default: false }
    },
    activeSession: { type: String, default: '2026-2027' },
    upgradedClasses: { type: [String], default: [] },
    // --- DAY 95: PENALTY CONFIGURATION ---
    // School.js mein penaltySettings wala part update karo
    penaltySettings: {
       dailyRate: { type: Number, default: 0 },
       isActive: { type: Boolean, default: false },
       activatedAt: { type: Date },
       lastAutoOffMonth: { type: Number } // <--- YE NAYI FIELD ADD KARO (Month track karne ke liye)
   },

    // --- DAY 110: ONLINE PAYMENT GATEWAY CONFIG ---
    paymentSettings: {
        upiId: { type: String, default: "" }, 
        merchantName: { type: String, default: "" }, 
        isActive: { type: Boolean, default: false } 
    },

    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // 🔥 NAYA FIELD: Custom Login ID (For Transport Incharge)
    customId: { type: String, unique: true, sparse: true }, 

    role: { 
        type: String, 
        // 🔥 DAY 283: 'transport_incharge' role officially added
        enum: ['student', 'teacher', 'admin', 'superadmin', 'finance', 'transport_incharge', 'driver'], 
        default: 'student' 
    },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }, 
    
    fatherName: String,
    motherName: String,
    dob: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    religion: String,
    admissionNo: String, 
    
    phone: String,
    address: {
        pincode: String,
        district: String,
        state: String,
        country: { type: String, default: 'India' },
        fullAddress: String
    },
    
    avatar: { 
        type: String, 
        default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' 
    },
    
    enrollmentNo: String, 
    employeeId: String,   
    
    grade: String, 
    assignedClass: { type: String, default: null }, 
    subjects: [String],
    status: { 
        type: String, 
        enum: ['Active', 'Alumni', 'Left'], 
        default: 'Active' 
    },

    transportRoute: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Route', 
        default: null 
    },
    transportStop: {
        stopName: { type: String, default: null },
        price: { type: Number, default: 0 }
    },
    
    academicHistory: [{
        session: String,       
        gradePassed: String,   
        promotedTo: String,    
        isRepeater: Boolean    
    }],
    resetOTP: String,
    otpExpires: Date
}, { timestamps: true });

// 🔥 BUG FIX: Modern Mongoose Async Hook 🔥
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return; 
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
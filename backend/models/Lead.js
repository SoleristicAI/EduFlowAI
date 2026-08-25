const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    planType: { type: String, required: true }, // General, Starter, Professional, Enterprise
    fullName: { type: String, required: true },
    institutionName: { type: String, required: true },
    workEmail: { type: String, required: true },
    alternateEmail: { type: String },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    
    // Conditional Fields (Optional depending on the plan)
    role: { type: String },
    studentCount: { type: String },
    biggestChallenge: { type: String },
    jobTitle: { type: String },
    branches: { type: String },
    requirements: { type: String },
    
    // Status tracking for Superadmin Sales Team
    status: { 
        type: String, 
        default: 'New', 
        enum: ['New', 'Contacted', 'Demo Scheduled', 'Closed'] 
    }
}, { timestamps: true }); // timestamps: true automatically adds 'createdAt' and 'updatedAt'

module.exports = mongoose.model('Lead', leadSchema);
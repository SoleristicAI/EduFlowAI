const mongoose = require('mongoose');

const datesheetSchema = new mongoose.Schema({
    schoolId: { type: String, required: true },
    title: { type: String, required: true },
    classes: [{ type: String }],
    
    startDate: { 
        type: Date, 
        required: function() { return !this.isManual; } 
    },
    timing: { 
        type: String, 
        required: function() { return !this.isManual; } 
    },
    resultDate: { 
        type: Date, 
        required: function() { return !this.isManual; } 
    },

    gapDays: { type: Number, default: 0 },
    notes: { type: String },
    
    isManual: { type: Boolean, default: false },
    fileUrl: { type: String }, 
    
    schedule: [{
        date: String,
        day: String,
        timing: String,
        classExams: { type: Map, of: String } 
    }],
    signatures: {
        incharge: { type: String }, 
        principal: { type: String } 
    },
    // 🔥 NAYA: Session Tag zaroori hai 🔥
    session: { type: String } 
}, { timestamps: true });

module.exports = mongoose.model('Datesheet', datesheetSchema);
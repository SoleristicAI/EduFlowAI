const mongoose = require('mongoose');

const libraryTransactionSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Linked to Student
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: { 
        type: String, 
        enum: ['Issued', 'Returned', 'Overdue'], 
        default: 'Issued' 
    },
    renewalCount: { type: Number, default: 0 },
    fineAmount: { type: Number, default: 0 } // Configurable simple fine
}, { timestamps: true });

module.exports = mongoose.model('LibraryTransaction', libraryTransactionSchema);
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true }, // Book Code
    category: { type: String, required: true },
    publisher: { type: String },
    totalCopies: { type: Number, required: true, default: 1 },
    availableCopies: { type: Number, required: true, default: 1 },
    rackNumber: { type: String },
    isDeleted: { type: Boolean, default: false } // Soft delete
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
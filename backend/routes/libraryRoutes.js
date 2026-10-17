const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const LibraryTransaction = require('../models/LibraryTransaction');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ==========================================================
// 🔥 LIBRARIAN DASHBOARD STATS 🔥
// ==========================================================
router.get('/stats', protect, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;

        // 1. Total Books & Available Books Calculation
        const books = await Book.find({ schoolId, isDeleted: false });
        const totalBooks = books.reduce((sum, book) => sum + book.totalCopies, 0);
        const availableBooks = books.reduce((sum, book) => sum + book.availableCopies, 0);

        // 2. Issued & Overdue Calculation
        const activeTransactions = await LibraryTransaction.find({ 
            schoolId, 
            status: { $in: ['Issued', 'Overdue'] } 
        });
        
        let issuedBooks = 0;
        let overdueBooks = 0;
        const today = new Date();

        activeTransactions.forEach(tx => {
            issuedBooks++;
            // Auto calculate overdue on the fly for stats
            if (new Date(tx.dueDate) < today && tx.status !== 'Returned') {
                overdueBooks++;
            }
        });

        // 3. Total Members (For now, we count students who have a membership flag, assuming we'll add it to User model next)
        const libraryMembers = await User.countDocuments({ schoolId, role: 'student', isLibraryMember: true });

        res.json({
            totalBooks,
            availableBooks,
            issuedBooks,
            overdueBooks,
            libraryMembers
        });

    } catch (error) {
        console.error("Library Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch library stats" });
    }
});

module.exports = router;
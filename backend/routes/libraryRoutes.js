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

// ==========================================================
// 🔥 BOOK CATALOGUE & INVENTORY ENGINE 🔥
// ==========================================================

// 1. ADD NEW BOOK
router.post('/books', protect, async (req, res) => {
    try {
        const { title, author, isbn, category, publisher, totalCopies, rackNumber } = req.body;
        
        // ISBN Check (Taaki duplicate book entry na ho jaye)
        const existingBook = await Book.findOne({ schoolId: req.user.schoolId, isbn, isDeleted: false });
        if (existingBook) {
            return res.status(400).json({ message: "Book with this ISBN/Code already exists!" });
        }

        const newBook = await Book.create({
            schoolId: req.user.schoolId,
            title, author, isbn, category, publisher, rackNumber,
            totalCopies: Number(totalCopies),
            availableCopies: Number(totalCopies) // Shuru mein jitni copies hain, sab available hongi
        });

        res.status(201).json({ message: "Book added successfully! 📚", book: newBook });
    } catch (error) {
        console.error("Add Book Error:", error);
        res.status(500).json({ message: "Failed to add book." });
    }
});

// 2. GET ALL BOOKS (With Search & Filter)
router.get('/books', protect, async (req, res) => {
    try {
        // Sirf active books bhejni hain (isDeleted: false)
        const books = await Book.find({ schoolId: req.user.schoolId, isDeleted: false }).sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch books." });
    }
});

// 3. UPDATE BOOK DETAILS
router.put('/books/:id', protect, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
        if (!book) return res.status(404).json({ message: "Book not found!" });

        // Agar total copies change ho rahi hain, toh available copies adjust karni padengi
        if (req.body.totalCopies) {
            const difference = Number(req.body.totalCopies) - book.totalCopies;
            req.body.availableCopies = book.availableCopies + difference;
            
            // Available copies negative nahi ho sakti (Maan lo 5 issued hain, aur total 4 kar di)
            if (req.body.availableCopies < 0) {
                return res.status(400).json({ message: "Cannot reduce total copies below currently issued copies!" });
            }
        }

        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "Book updated successfully! ✏️", book: updatedBook });
    } catch (error) {
        res.status(500).json({ message: "Failed to update book." });
    }
});

// 4. DELETE BOOK (Soft Delete)
router.delete('/books/:id', protect, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
        if (!book) return res.status(404).json({ message: "Book not found!" });

        // Check if any copies are still issued
        if (book.availableCopies < book.totalCopies) {
            return res.status(400).json({ message: "Cannot delete! Some copies of this book are currently issued to students." });
        }

        book.isDeleted = true;
        await book.save();

        res.json({ message: "Book removed from catalogue! 🗑️" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete book." });
    }
});

// ==========================================================
// 🔥 ISSUE & RETURN ENGINE 🔥
// ==========================================================

// 1. SEARCH STUDENTS (From existing User model)
router.get('/search-students', protect, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        // Name, Enrollment No, ya Admission No se search karo
        const students = await User.find({
            schoolId: req.user.schoolId,
            role: 'student',
            status: 'Active',
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { enrollmentNo: { $regex: q, $options: 'i' } },
                { admissionNo: { $regex: q, $options: 'i' } }
            ]
        }).select('name enrollmentNo grade phone avatar');

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: "Failed to search students." });
    }
});

// 2. SEARCH AVAILABLE BOOKS
router.get('/search-books', protect, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const books = await Book.find({
            schoolId: req.user.schoolId,
            isDeleted: false,
            availableCopies: { $gt: 0 }, // Sirf wahi books jo available hain
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { isbn: { $regex: q, $options: 'i' } }
            ]
        }).select('title author isbn availableCopies category rackNumber');

        res.json(books);
    } catch (error) {
        res.status(500).json({ message: "Failed to search books." });
    }
});

// 3. ISSUE A BOOK
router.post('/issue', protect, async (req, res) => {
    try {
        const { studentId, bookId, dueDate } = req.body;

        // Verify book availability again
        const book = await Book.findOne({ _id: bookId, schoolId: req.user.schoolId });
        if (!book || book.availableCopies <= 0) {
            return res.status(400).json({ message: "Book is currently out of stock!" });
        }

        // Create Transaction
        const transaction = await LibraryTransaction.create({
            schoolId: req.user.schoolId,
            studentId,
            bookId,
            dueDate
        });

        // Decrease available copies
        book.availableCopies -= 1;
        await book.save();

        res.status(201).json({ message: "Book issued successfully! 📖", transaction });
    } catch (error) {
        res.status(500).json({ message: "Failed to issue book." });
    }
});

// 4. GET ACTIVE TRANSACTIONS (For Dashboard Right Panel)
router.get('/transactions/active', protect, async (req, res) => {
    try {
        const transactions = await LibraryTransaction.find({
            schoolId: req.user.schoolId,
            status: { $in: ['Issued', 'Overdue'] }
        })
        .populate('studentId', 'name enrollmentNo grade avatar')
        .populate('bookId', 'title isbn author')
        .sort({ issueDate: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch active transactions." });
    }
});

// 5. RETURN A BOOK
router.put('/return/:id', protect, async (req, res) => {
    try {
        const transaction = await LibraryTransaction.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
        if (!transaction || transaction.status === 'Returned') {
            return res.status(400).json({ message: "Invalid or already returned transaction!" });
        }

        // Update Transaction
        transaction.status = 'Returned';
        transaction.returnDate = new Date();
        await transaction.save();

        // Increase available copies in Book
        const book = await Book.findById(transaction.bookId);
        if (book) {
            book.availableCopies += 1;
            await book.save();
        }

        res.json({ message: "Book returned to inventory! ✅" });
    } catch (error) {
        res.status(500).json({ message: "Failed to return book." });
    }
});

module.exports = router;
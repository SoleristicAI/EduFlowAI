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
        today.setHours(0, 0, 0, 0);

        activeTransactions.forEach(tx => {
            issuedBooks++;

            const due = new Date(tx.dueDate);
            due.setHours(0, 0, 0, 0); // Compare date-to-date, ignore time

            if (due < today && tx.status !== 'Returned') {
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

// 🔥 BULK UPLOAD BOOKS (CSV) 🔥
router.post('/books/bulk', protect, async (req, res) => {
    try {
        const { books } = req.body;
        if (!books || !Array.isArray(books) || books.length === 0) {
            return res.status(400).json({ message: "No valid books data found!" });
        }

        let addedCount = 0;
        let duplicateCount = 0;

        for (let book of books) {
            // Check if book with same ISBN already exists
            const existingBook = await Book.findOne({ schoolId: req.user.schoolId, isbn: book.isbn, isDeleted: false });

            if (existingBook) {
                duplicateCount++;
                continue; // Skip duplicate
            }

            await Book.create({
                schoolId: req.user.schoolId,
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                category: book.category,
                publisher: book.publisher || 'Unknown',
                totalCopies: Number(book.totalCopies) || 1,
                availableCopies: Number(book.totalCopies) || 1,
                rackNumber: book.rackNumber || 'General'
            });
            addedCount++;
        }

        res.status(201).json({
            message: `Bulk upload complete! Added: ${addedCount}, Skipped (Duplicates): ${duplicateCount}`
        });
    } catch (error) {
        console.error("Bulk Upload Error:", error);
        res.status(500).json({ message: "Failed to process bulk upload." });
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

// ==========================================================
// 🔥 OVERDUE, MEMBERS & SETTINGS ENGINE 🔥
// ==========================================================

// 1. GET OVERDUE BOOKS
router.get('/overdue', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 🔥 FIX: Sirf aaj ke din shuru hone se purani dates aayengi

        const transactions = await LibraryTransaction.find({
            schoolId: req.user.schoolId,
            status: { $in: ['Issued', 'Overdue'] },
            dueDate: { $lt: today }
        })
        .populate('studentId', 'name enrollmentNo phone avatar grade')
        .populate('bookId', 'title isbn')
        .sort({ dueDate: 1 }); 

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch overdue books." });
    }
});

// 2. GET LIBRARY MEMBER CARD (History & Stats)
router.get('/member/:studentId', protect, async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.params.studentId, schoolId: req.user.schoolId })
            .select('name enrollmentNo grade phone avatar fatherName');

        const history = await LibraryTransaction.find({ studentId: req.params.studentId, schoolId: req.user.schoolId })
            .populate('bookId', 'title isbn category')
            .sort({ issueDate: -1 });

        res.json({ student, history });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch member details." });
    }
});

// 3. GET & UPDATE SETTINGS
router.get('/settings', protect, async (req, res) => {
    try {
        const school = await require('../models/School').findById(req.user.schoolId).select('librarySettings');
        res.json(school.librarySettings || { defaultDueDays: 7, finePerDay: 5 });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch settings." });
    }
});

router.put('/settings', protect, async (req, res) => {
    try {
        const school = await require('../models/School').findById(req.user.schoolId);
        school.librarySettings = req.body;
        await school.save();
        res.json({ message: "Library settings updated! ⚙️", settings: school.librarySettings });
    } catch (error) {
        res.status(500).json({ message: "Failed to update settings." });
    }
});

// ==========================================================
// 🔥 LIBRARY REPORTS ENGINE 🔥
// ==========================================================

router.get('/reports', protect, async (req, res) => {
    try {
        const { filter } = req.query; // 'all', '7days', '30days'
        let query = { schoolId: req.user.schoolId };

        // Date filtering logic
        if (filter === '7days') {
            const date = new Date();
            date.setDate(date.getDate() - 7);
            query.issueDate = { $gte: date };
        } else if (filter === '30days') {
            const date = new Date();
            date.setDate(date.getDate() - 30);
            query.issueDate = { $gte: date };
        }

        const transactions = await LibraryTransaction.find(query)
            .populate('studentId', 'name enrollmentNo grade')
            .populate('bookId', 'title isbn category')
            .sort({ issueDate: -1 });

        // Calculate dynamic metrics for the selected period
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = {
            totalTransactions: transactions.length,
            issued: transactions.filter(tx => tx.status === 'Issued').length,
            returned: transactions.filter(tx => tx.status === 'Returned').length,
            // 🔥 FIX: Strict midnight comparison
            overdue: transactions.filter(tx => {
                const due = new Date(tx.dueDate);
                due.setHours(0, 0, 0, 0);
                return tx.status === 'Overdue' || (tx.status === 'Issued' && due < today);
            }).length
        };

        res.json({ stats, transactions });
    } catch (error) {
        res.status(500).json({ message: "Failed to generate reports." });
    }
});

// ==========================================================
// 🔥 STUDENT PORTAL APIs 🔥
// ==========================================================

// 1. GET MY LIBRARY DATA (For Student)
router.get('/my-books', protect, async (req, res) => {
    try {
        const studentId = req.user._id;
        const schoolId = req.user.schoolId;

        // Fetch School Settings to calculate live fine
        const school = await require('../models/School').findById(schoolId).select('librarySettings');
        const finePerDay = school?.librarySettings?.finePerDay || 5;

        // Fetch all transactions for this student
        const transactions = await LibraryTransaction.find({ studentId, schoolId })
            .populate('bookId', 'title author isbn category')
            .sort({ issueDate: -1 });

        // Categorize data
        const active = [];
        const overdue = [];
        const history = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 🔥 FIX: Strict day mapping

        transactions.forEach(tx => {
            if (tx.status === 'Returned') {
                history.push(tx);
            } else {
                const due = new Date(tx.dueDate);
                due.setHours(0, 0, 0, 0);

                const isOverdue = tx.status === 'Overdue' || due < today;
                
                if (isOverdue) {
                    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
                    tx._doc.pendingFine = diffDays * finePerDay;
                    tx._doc.overdueDays = diffDays;
                    overdue.push(tx);
                } else {
                    active.push(tx);
                }
            }
        });

        res.json({ active, overdue, history });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch your library data." });
    }
});

// 2. RENEW BOOK (Student Request - MAX 3 TIMES, 15 DAYS)
router.put('/renew/:id', protect, async (req, res) => {
    try {
        const transaction = await LibraryTransaction.findOne({ _id: req.params.id, studentId: req.user._id });
        if (!transaction || transaction.status === 'Returned') {
            return res.status(400).json({ message: "Invalid transaction." });
        }

        // Rule 1: Max 3 Renewals Check
        if (transaction.renewalCount >= 3) {
            return res.status(400).json({ message: "Max renewal limit (3 times) reached." });
        }

        // Rule 2: Strict Due Date Check (Midnight comparison)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Aaj ki date (00:00:00)

        const dueDate = new Date(transaction.dueDate);
        dueDate.setHours(0, 0, 0, 0); // Due date (00:00:00)

        // Agar aaj ki date due date ke barabar ya usse badi hai, toh block kardo
        if (today >= dueDate) {
            return res.status(400).json({ message: "Cannot renew on or after the due date. Please return the book." });
        }

        // Rule 3: Add 15 days for renewal
        const newDueDate = new Date(transaction.dueDate);
        newDueDate.setDate(newDueDate.getDate() + 15);
        transaction.dueDate = newDueDate;

        // Increase renewal count
        transaction.renewalCount = (transaction.renewalCount || 0) + 1;

        await transaction.save();

        res.json({ message: `Book renewed for 15 more days! (${transaction.renewalCount}/3 used) 📅`, newDueDate });
    } catch (error) {
        res.status(500).json({ message: "Failed to renew book." });
    }
});

module.exports = router;
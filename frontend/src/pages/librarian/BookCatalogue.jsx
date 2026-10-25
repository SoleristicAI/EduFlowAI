import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, PlusCircle, BookOpen, Edit3, Trash2, X, Hash, Layers, AlertCircle, LibraryBig, UploadCloud, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';

const BookCatalogue = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [msg, setMsg] = useState('');

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Custom Delete Confirmation Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bookToDelete, setBookToDelete] = useState(null);

    const fileInputRef = useRef(null); // Reference for CSV input
    
    const [formData, setFormData] = useState({
        _id: '', title: '', author: '', isbn: '', category: '', publisher: '', totalCopies: 1, rackNumber: ''
    });

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/library/books');
            setBooks(data);
        } catch (error) {
            setMsg("Failed to fetch library catalogue.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (book = null) => {
        if (book) {
            setFormData({ ...book });
            setIsEditing(true);
        } else {
            setFormData({ _id: '', title: '', author: '', isbn: '', category: '', publisher: '', totalCopies: 1, rackNumber: '' });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing) {
                await API.put(`/library/books/${formData._id}`, formData);
                setMsg("Book updated successfully! ✅");
            } else {
                await API.post('/library/books', formData);
                setMsg("New book added to catalogue! 📚");
            }
            setShowModal(false);
            fetchBooks();
        } catch (error) {
            setMsg(error.response?.data?.message || "Operation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (book) => {
        setBookToDelete(book);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setIsSubmitting(true);
        try {
            await API.delete(`/library/books/${bookToDelete._id}`);
            setMsg("Book removed successfully! 🗑️");
            setShowDeleteModal(false);
            setBookToDelete(null);
            fetchBooks();
        } catch (error) {
            setMsg(error.response?.data?.message || "Failed to delete book.");
            setShowDeleteModal(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🔥 CSV FILE HANDLING LOGIC 🔥
    const downloadSampleCSV = () => {
        const csvContent = "title,author,isbn,category,publisher,totalCopies,rackNumber\nConcept of Physics,HC Verma,ISBN-101,Science,Bharti Bhawan,10,R-01\nHarry Potter,JK Rowling,ISBN-102,Fiction,Bloomsbury,5,R-02";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Library_Bulk_Sample.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            const csvText = event.target.result;
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            const parsedBooks = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue; // skip empty lines
                const currentLine = lines[i].split(',').map(val => val.trim());
                
                let bookObj = {};
                headers.forEach((header, index) => {
                    bookObj[header] = currentLine[index];
                });

                // Validate basic required fields
                if (bookObj.title && bookObj.author && bookObj.isbn && bookObj.category) {
                    parsedBooks.push(bookObj);
                }
            }

            if (parsedBooks.length === 0) {
                setMsg("No valid data found in CSV!");
                setLoading(false);
                return;
            }

            try {
                const { data } = await API.post('/library/books/bulk', { books: parsedBooks });
                setMsg(data.message);
                fetchBooks();
            } catch (error) {
                setMsg(error.response?.data?.message || "Failed to upload bulk books.");
            } finally {
                setLoading(false);
                fileInputRef.current.value = ""; // Reset input
            }
        };

        reader.readAsText(file);
    };

    // Filter books based on search
    const filteredBooks = books.filter(b => 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">
            
            {/* HEADER */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic flex items-center justify-center gap-3 px-16 leading-tight">
                    Book Catalogue
                </h1>
                <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Inventory Management</p>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-6xl mx-auto">
                
                {/* TOOLBAR */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search title, author, ISBN..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 outline-none focus:border-[#42A5F5] focus:bg-white font-bold text-[14px] transition-all"
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-center">
                        <button onClick={downloadSampleCSV} className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0">
                            <Download size={16} /> Sample CSV
                        </button>

                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current.click()} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0">
                            <UploadCloud size={16} /> Bulk Upload
                        </button>

                        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-[#42A5F5] hover:bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[13px] shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0">
                            <PlusCircle size={18} /> Add New
                        </button>
                    </div>
                </div>

                {/* BOOKS LIST */}
                {filteredBooks.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-16 border border-slate-100 text-center shadow-sm flex flex-col items-center">
                        <LibraryBig size={60} className="text-slate-300 mb-4" />
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">No Books Found</h3>
                        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                            Add a new book or try a different search term.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filteredBooks.map((book, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                key={book._id} 
                                className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow group"
                            >
                                <div className="w-20 h-24 bg-blue-50 rounded-[1.2rem] flex items-center justify-center text-[#42A5F5] shrink-0 border border-blue-100 shadow-inner">
                                    <BookOpen size={36} />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-[18px] font-black text-slate-800 tracking-tight leading-tight capitalize pr-2">{book.title}</h3>
                                            <p className="text-[13px] font-bold text-slate-500 capitalize mt-1">by {book.author}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => handleOpenModal(book)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-[#42A5F5] hover:bg-blue-50 rounded-xl transition-all">
                                                <Edit3 size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteClick(book)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <span className="bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Hash size={12}/> ISBN: {book.isbn}
                                        </span>
                                        <span className="bg-blue-50 border border-blue-100 text-[#42A5F5] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Layers size={12}/> {book.category}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available / Total</p>
                                            <p className="text-[16px] font-black text-slate-800">
                                                <span className={book.availableCopies > 0 ? "text-emerald-500" : "text-rose-500"}>{book.availableCopies}</span> 
                                                <span className="text-slate-300 mx-1">/</span> 
                                                {book.totalCopies}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rack No.</p>
                                            <p className="text-[14px] font-black text-slate-700 uppercase">{book.rackNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* ADD/EDIT MODAL */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] w-full max-w-2xl p-8 md:p-10 shadow-2xl z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                <X size={20} />
                            </button>

                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">
                                {isEditing ? "Update Book Details" : "Add New Book"}
                            </h2>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                                Enter precise book information for the catalogue.
                            </p>

                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Book Title *</label>
                                        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[14px] text-slate-800" placeholder="e.g. Concept of Physics" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Author Name *</label>
                                        <input type="text" required value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[14px] text-slate-800" placeholder="e.g. H.C. Verma" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">ISBN / Book Code *</label>
                                        <input type="text" required value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[14px] text-slate-800 tracking-wider" placeholder="ISBN-XXXXXX" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Category / Subject *</label>
                                        <input type="text" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[14px] text-slate-800 uppercase" placeholder="e.g. SCIENCE" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Publisher</label>
                                        <input type="text" value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[14px] text-slate-800" placeholder="Publisher Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Total Copies *</label>
                                        <input type="number" min="1" required value={formData.totalCopies} onChange={e => setFormData({...formData, totalCopies: e.target.value})} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] outline-none font-black text-[15px] text-slate-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Rack No.</label>
                                        <input type="text" value={formData.rackNumber} onChange={e => setFormData({...formData, rackNumber: e.target.value})} className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] outline-none font-black text-[14px] text-slate-800 uppercase" placeholder="R-12" />
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full mt-4 py-5 bg-[#42A5F5] hover:bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[14px] shadow-xl shadow-blue-200 active:scale-95 transition-all flex justify-center">
                                    {isSubmitting ? "Processing..." : (isEditing ? "Save Changes" : "Add to Catalogue")}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🔥 CUSTOM DELETE CONFIRMATION MODAL 🔥 */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowDeleteModal(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center z-10"
                        >
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Delete Book?</h3>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                                This will remove <span className="text-rose-500">{bookToDelete?.title}</span> from the catalogue.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={confirmDelete} disabled={isSubmitting} className="flex-1 py-4 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-rose-600 hover:shadow-rose-200 shadow-lg transition-all">
                                    {isSubmitting ? "Deleting..." : "Yes, Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default BookCatalogue;
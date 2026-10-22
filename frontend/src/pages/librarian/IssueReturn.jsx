import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, User, BookOpen, Calendar, CheckCircle, ArrowRightLeft, X, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';

const IssueReturn = () => {
    const navigate = useNavigate();
    const [msg, setMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Search States
    const [studentQuery, setStudentQuery] = useState('');
    const [bookQuery, setBookQuery] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [bookResults, setBookResults] = useState([]);
    
    // Selected Entities
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    
    // Auto Default Due Date (+7 days from today)
    const todayStr = new Date().toISOString().split('T')[0];
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    });

    // 🔥 Custom Calendar States 🔥
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    });
    const dateRef = useRef(null);

    // Active Transactions State
    const [transactions, setTransactions] = useState([]);

    // 🔥 Modal States 🔥
    const [showIssueConfirm, setShowIssueConfirm] = useState(false);
    const [showReturnConfirm, setShowReturnConfirm] = useState(false);
    const [transactionToReturn, setTransactionToReturn] = useState(null);

    useEffect(() => {
        fetchActiveTransactions();
    }, []);

    // Close calendar on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateRef.current && !dateRef.current.contains(event.target)) setIsDateOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        initializeDesk();
    }, []);

    // 🔥 FIX: Pehle Settings fetch karo, fir Calendar ki date set karo, aur fir list load karo
    const initializeDesk = async () => {
        try {
            // 1. Backend se Settings uthao
            const { data: settings } = await API.get('/library/settings');
            const defaultDays = settings.defaultDueDays || 7; // Agar backend se nahi aaya toh 7 din default
            
            // 2. Calendar ki dates update karo
            const d = new Date();
            d.setDate(d.getDate() + defaultDays);
            setDueDate(d.toISOString().split('T')[0]);
            setViewDate(d);

            // 3. Transactions ki list fetch karo
            fetchActiveTransactions();
        } catch (error) {
            console.error("Init Error:", error);
            fetchActiveTransactions(); // Agar error aaya toh bhi list toh load kardo
        }
    };

    const fetchActiveTransactions = async () => {
        try {
            const { data } = await API.get('/library/transactions/active');
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        }
    };

    // SEARCH STUDENTS
    const handleStudentSearch = async (val) => {
        setStudentQuery(val);
        if (val.length < 2) return setStudentResults([]);
        try {
            const { data } = await API.get(`/library/search-students?q=${val}`);
            setStudentResults(data);
        } catch (err) { console.error(err); }
    };

    // SEARCH BOOKS
    const handleBookSearch = async (val) => {
        setBookQuery(val);
        if (val.length < 2) return setBookResults([]);
        try {
            const { data } = await API.get(`/library/search-books?q=${val}`);
            setBookResults(data);
        } catch (err) { console.error(err); }
    };

    // 🔥 ISSUE BOOK (EXECUTE) 🔥
    const executeIssueBook = async () => {
        setIsSubmitting(true);
        try {
            await API.post('/library/issue', {
                studentId: selectedStudent._id,
                bookId: selectedBook._id,
                dueDate: dueDate
            });
            setMsg('Book issued successfully! 📖');
            setShowIssueConfirm(false);
            
            // Reset Form
            setSelectedStudent(null);
            setSelectedBook(null);
            setStudentQuery('');
            setBookQuery('');
            fetchActiveTransactions();
        } catch (error) {
            setMsg(error.response?.data?.message || 'Issue failed.');
            setShowIssueConfirm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🔥 RETURN BOOK (EXECUTE) 🔥
    const executeReturnBook = async () => {
        setIsSubmitting(true);
        try {
            await API.put(`/library/return/${transactionToReturn._id}`);
            setMsg('Book returned to inventory! ✅');
            setShowReturnConfirm(false);
            setTransactionToReturn(null);
            fetchActiveTransactions();
        } catch (error) {
            setMsg(error.response?.data?.message || 'Return failed.');
            setShowReturnConfirm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isOverdue = (date) => new Date(date) < new Date();

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">
            
            {/* HEADER */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic flex items-center justify-center gap-3 px-16 leading-tight">
                    Issue & Return
                </h1>
                <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Circulation Desk</p>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT PANEL: ISSUE FORM */}
                <div className="lg:col-span-5 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-blue-50 text-[#42A5F5] rounded-[1.2rem]"><ArrowRightLeft size={24}/></div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Issue New Book</h2>
                    </div>

                    <div className="space-y-6">
                        {/* 1. Student Selection */}
                        <div className="relative">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Find Student</label>
                            {selectedStudent ? (
                                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-[1.5rem]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-full overflow-hidden border-2 border-emerald-200">
                                            <img src={selectedStudent.avatar} alt="stu" className="w-full h-full object-cover"/>
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-black text-slate-800 uppercase">{selectedStudent.name}</p>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{selectedStudent.enrollmentNo} | {selectedStudent.grade}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedStudent(null)} className="p-2 bg-white text-rose-500 rounded-full shadow-sm active:scale-90"><X size={16}/></button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={studentQuery}
                                        onChange={(e) => handleStudentSearch(e.target.value)}
                                        placeholder="Search by Name or ID..." 
                                        className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[14px] text-slate-800" 
                                    />
                                    {studentResults.length > 0 && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-xl overflow-hidden max-h-48 custom-scrollbar overflow-y-auto">
                                            {studentResults.map(stu => (
                                                <div key={stu._id} onClick={() => { setSelectedStudent(stu); setStudentResults([]); setStudentQuery(''); }} className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-0">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden"><img src={stu.avatar} className="w-full h-full object-cover"/></div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-700 capitalize leading-tight">{stu.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stu.enrollmentNo}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. Book Selection */}
                        <div className="relative z-40">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Find Book</label>
                            {selectedBook ? (
                                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-[1.5rem]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#42A5F5] shadow-sm"><BookOpen size={20}/></div>
                                        <div>
                                            <p className="text-[14px] font-black text-slate-800 uppercase">{selectedBook.title}</p>
                                            <p className="text-[10px] font-black text-[#42A5F5] uppercase tracking-widest">ISBN: {selectedBook.isbn}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedBook(null)} className="p-2 bg-white text-rose-500 rounded-full shadow-sm active:scale-90"><X size={16}/></button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={bookQuery}
                                        onChange={(e) => handleBookSearch(e.target.value)}
                                        placeholder="Search Title or ISBN..." 
                                        className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[14px] text-slate-800" 
                                    />
                                    {bookResults.length > 0 && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-xl overflow-hidden max-h-48 custom-scrollbar overflow-y-auto">
                                            {bookResults.map(book => (
                                                <div key={book._id} onClick={() => { setSelectedBook(book); setBookResults([]); setBookQuery(''); }} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0">
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-700 capitalize leading-tight pr-2">{book.title}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ISBN: {book.isbn}</p>
                                                    </div>
                                                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-500 px-2 py-1 rounded-md shrink-0 border border-emerald-100">{book.availableCopies} Left</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 3. Due Date (CUSTOM CALENDAR) */}
                        <div className="relative z-30" ref={dateRef}>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Expected Return Date</label>
                            
                            <button 
                                type="button"
                                onClick={() => setIsDateOpen(!isDateOpen)}
                                className={`w-full flex items-center gap-3 p-4 rounded-[1.5rem] border transition-all bg-slate-50 hover:bg-white outline-none font-black text-[14px] text-slate-800 uppercase tracking-widest ${isDateOpen ? "border-[#42A5F5] bg-white ring-4 ring-blue-50" : "border-slate-200"}`}
                            >
                                <Calendar size={20} className={dueDate ? "text-[#42A5F5]" : "text-slate-400"} />
                                <span className={dueDate ? "text-slate-800" : "text-slate-400"}>
                                    {dueDate ? new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "SELECT DUE DATE"}
                                </span>
                            </button>

                            <AnimatePresence>
                                {isDateOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute left-0 right-0 top-[105%] z-[100] bg-white border border-blue-100 rounded-[2.5rem] shadow-2xl p-6"
                                    >
                                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="text-[#42A5F5] font-black bg-white w-8 h-8 rounded-full shadow-sm hover:bg-[#42A5F5] hover:text-white transition-colors">‹</button>
                                                <span className="font-black text-[#42A5F5] uppercase tracking-widest text-[13px]">
                                                    {viewDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                                </span>
                                                <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="text-[#42A5F5] font-black bg-white w-8 h-8 rounded-full shadow-sm hover:bg-[#42A5F5] hover:text-white transition-colors">›</button>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                                                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                            </div>

                                            {(() => {
                                                const year = viewDate.getFullYear();
                                                const month = viewDate.getMonth();
                                                const firstDay = new Date(year, month, 1);
                                                const lastDate = new Date(year, month + 1, 0).getDate();
                                                let startDay = firstDay.getDay();
                                                startDay = startDay === 0 ? 6 : startDay - 1;

                                                const days = [];
                                                for (let i = 0; i < startDay; i++) { days.push(<div key={"empty-" + i}></div>); }

                                                for (let day = 1; day <= lastDate; day++) {
                                                    const tempDate = new Date(year, month, day);
                                                    tempDate.setMinutes(tempDate.getMinutes() - tempDate.getTimezoneOffset());
                                                    const formatted = tempDate.toISOString().split('T')[0];
                                                    
                                                    const isSelected = formatted === dueDate;
                                                    const isPast = formatted < todayStr; // Cannot issue in the past

                                                    days.push(
                                                        <button
                                                            type="button"
                                                            key={day}
                                                            disabled={isPast}
                                                            onClick={() => {
                                                                setDueDate(formatted);
                                                                setIsDateOpen(false);
                                                            }}
                                                            className={`p-2 rounded-xl text-[13px] font-black transition-colors ${isSelected ? 'bg-[#42A5F5] text-white shadow-md' : 'text-slate-600'} ${isPast ? 'opacity-20 cursor-not-allowed bg-slate-200' : 'hover:bg-white'}`}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                }
                                                return <div className="grid grid-cols-7 gap-1">{days}</div>;
                                            })()}
                                        </div>
                                        <button type="button" onClick={() => setIsDateOpen(false)} className="w-full mt-4 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest italic active:scale-95 transition-all hover:bg-slate-700">Close Calendar</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button 
                            onClick={() => setShowIssueConfirm(true)}
                            disabled={!selectedStudent || !selectedBook} 
                            className={`w-full mt-6 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[14px] transition-all flex justify-center items-center gap-3 shadow-lg 
                                ${(!selectedStudent || !selectedBook) ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-[#42A5F5] hover:bg-blue-600 text-white shadow-blue-200 active:scale-95'}`}
                        >
                            Review & Issue Book <CheckCircle size={20}/>
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: ACTIVE ISSUES LIST */}
                <div className="lg:col-span-7 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col h-full max-h-[800px]">
                    <div className="flex justify-between items-center mb-6 px-2 shrink-0">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Active Issues</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Returns & Defaulters</p>
                        </div>
                        <div className="bg-blue-50 text-[#42A5F5] px-4 py-2 rounded-xl text-[12px] font-black border border-blue-100">
                            {transactions.length} Active
                        </div>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-4">
                        {transactions.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <BookOpen size={60} className="mx-auto text-slate-300 mb-4" />
                                <p className="font-black text-slate-400 uppercase tracking-widest">No active book loans</p>
                            </div>
                        ) : (
                            transactions.map(tx => {
                                const overdue = isOverdue(tx.dueDate);
                                return (
                                    <div key={tx._id} className={`p-5 rounded-[2rem] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md ${overdue ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                                                <img src={tx.studentId?.avatar} className="w-full h-full object-cover" alt=""/>
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-black text-slate-800 uppercase leading-tight">{tx.studentId?.name}</p>
                                                <p className="text-[11px] font-bold text-slate-500 capitalize italic mb-1 flex items-center gap-1">
                                                    <BookOpen size={12}/> {tx.bookId?.title}
                                                </p>
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] font-black bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-400 tracking-widest uppercase">ID: {tx.studentId?.enrollmentNo}</span>
                                                    {overdue && <span className="text-[9px] font-black bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 text-rose-600 tracking-widest uppercase flex items-center gap-1"><AlertCircle size={10}/> Overdue</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-200 mt-2 sm:mt-0">
                                            <div className="text-left sm:text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
                                                <p className={`text-[12px] font-black uppercase tracking-wider ${overdue ? 'text-rose-500' : 'text-slate-700'}`}>
                                                    {new Date(tx.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => { setTransactionToReturn(tx); setShowReturnConfirm(true); }}
                                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                            >
                                                Return
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* 🔥 ISSUE CONFIRMATION MODAL 🔥 */}
            <AnimatePresence>
                {showIssueConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowIssueConfirm(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center z-10">
                            <div className="w-20 h-20 bg-blue-50 text-[#42A5F5] rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Confirm Issue?</h3>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-6 leading-relaxed">
                                Issue <span className="text-[#42A5F5]">{selectedBook?.title}</span> to <span className="text-[#42A5F5]">{selectedStudent?.name}</span>?
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowIssueConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={executeIssueBook} disabled={isSubmitting} className="flex-1 py-4 bg-[#42A5F5] text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg transition-all">
                                    {isSubmitting ? "Issuing..." : "Yes, Issue"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🔥 RETURN CONFIRMATION MODAL 🔥 */}
            <AnimatePresence>
                {showReturnConfirm && transactionToReturn && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReturnConfirm(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center z-10">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Confirm Return?</h3>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-6 leading-relaxed">
                                Mark <span className="text-emerald-500">{transactionToReturn?.bookId?.title}</span> as returned by <span className="text-emerald-500">{transactionToReturn?.studentId?.name}</span>?
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowReturnConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={executeReturnBook} disabled={isSubmitting} className="flex-1 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg transition-all">
                                    {isSubmitting ? "Returning..." : "Yes, Return"}
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
export default IssueReturn;
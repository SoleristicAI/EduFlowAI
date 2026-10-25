import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, BookOpen, User, IndianRupee, CheckCircle, Clock, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';

const OverdueBooks = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [settings, setSettings] = useState({ finePerDay: 5 });
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [txRes, setRes] = await Promise.all([
                API.get('/library/overdue'),
                API.get('/library/settings')
            ]);
            setTransactions(txRes.data);
            setSettings(setRes.data);
        } catch (error) {
            setMsg("Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async () => {
        try {
            await API.put(`/library/return/${selectedTx._id}`);
            setMsg('Book returned and fine cleared! ✅');
            setShowConfirm(false);
            fetchData();
        } catch (error) {
            setMsg("Return failed.");
            setShowConfirm(false);
        }
    };

    const calculateDaysAndFine = (dueDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today - due);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { days: diffDays, fine: diffDays * settings.finePerDay };
    };

    const filtered = transactions.filter(tx => 
        tx.studentId?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tx.studentId?.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">
            
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic flex items-center justify-center gap-3 px-16 leading-tight">
                    Overdue Defaulters
                </h1>
                <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Fines & Recovery</p>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-6xl mx-auto">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" placeholder="Search Student Name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 outline-none focus:border-[#42A5F5] font-bold text-[14px]"
                        />
                    </div>
                    <div className="bg-rose-50 text-rose-500 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[13px] flex items-center gap-2 border border-rose-100">
                        <AlertCircle size={18}/> {transactions.length} Defaulters
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-16 text-center shadow-sm">
                        <CheckCircle size={60} className="text-emerald-300 mb-4 mx-auto" />
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">All Clear!</h3>
                        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mt-2">No overdue books right now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5">
                        {filtered.map((tx, i) => {
                            const { days, fine } = calculateDaysAndFine(tx.dueDate);
                            return (
                                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={tx._id} className="bg-white rounded-[2rem] p-6 border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-400"></div>
                                    <div className="flex items-center gap-5">
                                        <img src={tx.studentId?.avatar} className="w-16 h-16 rounded-full border-2 border-slate-100 object-cover" alt="stu"/>
                                        <div>
                                            <h3 className="text-[18px] font-black text-slate-800 uppercase">{tx.studentId?.name}</h3>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{tx.studentId?.enrollmentNo} | {tx.studentId?.grade}</p>
                                            <p className="text-[13px] font-black text-[#42A5F5] flex items-center gap-1"><BookOpen size={14}/> {tx.bookId?.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center bg-rose-50 p-3 rounded-2xl border border-rose-100 min-w-[100px]">
                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Late By</p>
                                            <p className="text-[18px] font-black text-rose-600 flex items-center justify-center gap-1"><Clock size={16}/> {days} Days</p>
                                        </div>
                                        <div className="text-center bg-amber-50 p-3 rounded-2xl border border-amber-100 min-w-[100px]">
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pending Fine</p>
                                            <p className="text-[18px] font-black text-amber-600 flex items-center justify-center gap-1"><IndianRupee size={16}/> {fine}</p>
                                        </div>
                                        <button onClick={() => { setSelectedTx(tx); setShowConfirm(true); }} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[12px] shadow-lg transition-all active:scale-95 shrink-0">
                                            Clear & Return
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Custom Modal */}
            <AnimatePresence>
                {showConfirm && selectedTx && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center z-10">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg"><CheckCircle size={40} /></div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Collect & Return?</h3>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-6 leading-relaxed">
                                Collect fine of <span className="text-emerald-500 font-black flex items-center justify-center inline-flex">₹{calculateDaysAndFine(selectedTx.dueDate).fine}</span> and mark book as returned?
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={handleReturn} className="flex-1 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg transition-all">Yes, Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};
export default OverdueBooks;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, AlertCircle, CheckCircle, IndianRupee, RefreshCw, Layers, Hash, History, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const Library = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [libraryData, setLibraryData] = useState({ active: [], overdue: [], history: [] });
    const [currentView, setCurrentView] = useState('menu'); 

    // Modal States
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [isRenewing, setIsRenewing] = useState(false);

    useEffect(() => {
        fetchMyLibraryData();
    }, []);

    const fetchMyLibraryData = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/library/my-books');
            setLibraryData(data);
        } catch (err) {
            setMsg("Failed to sync library portal.");
        } finally {
            setLoading(false);
        }
    };

    const handleRenewRequest = async () => {
        setIsRenewing(true);
        try {
            const { data } = await API.put(`/library/renew/${selectedTx._id}`);
            setMsg(data.message);
            setShowRenewModal(false);
            fetchMyLibraryData(); 
        } catch (error) {
            setMsg(error.response?.data?.message || 'Failed to renew.');
            setShowRenewModal(false);
        } finally {
            setIsRenewing(false);
        }
    };

    const handleBack = () => {
        if (currentView === 'menu') navigate(-1);
        else setCurrentView('menu');
    };

    // 🔥 HELPER: Check if today is Due Date or passed 🔥
    const checkIsTooLate = (dDate) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(dDate);
        due.setHours(0,0,0,0);
        return today >= due;
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">
            
            {/* TOP HEADER */}
            <div className={`text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative text-center transition-colors duration-500 ${
                currentView === 'overdue' ? 'bg-rose-500' : 
                currentView === 'history' ? 'bg-emerald-500' : 
                'bg-[#42A5F5]'
            }`}>
                <button onClick={handleBack} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic flex items-center justify-center gap-3 px-16 leading-tight">
                    {currentView === 'menu' ? 'My Library' : 
                     currentView === 'active' ? 'Active Loans' : 
                     currentView === 'overdue' ? 'Defaulters' : 'Past History'}
                </h1>
                <p className="text-[14px] font-black text-white/80 uppercase tracking-[0.2em] mt-2 italic">
                    {currentView === 'menu' ? 'Digital Reading Portal' : 'Viewing Details'}
                </p>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-5xl mx-auto">
                <AnimatePresence mode="wait">
                    
                    {/* 1. MENU VIEW */}
                    {currentView === 'menu' && (
                        <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div onClick={() => setCurrentView('active')} className="bg-white rounded-[3rem] p-8 shadow-sm hover:shadow-xl border border-blue-100 cursor-pointer transition-all active:scale-95 group flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-blue-50 text-[#42A5F5] rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><BookOpen size={36} /></div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Active Loans</h2>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">Currently issued books</p>
                                <div className="w-full py-4 bg-blue-50 rounded-[1.5rem] font-black text-[#42A5F5] uppercase tracking-widest text-[14px]">{libraryData.active.length} Books</div>
                            </div>
                            <div onClick={() => setCurrentView('overdue')} className="bg-white rounded-[3rem] p-8 shadow-sm hover:shadow-xl border border-rose-100 cursor-pointer transition-all active:scale-95 group flex flex-col items-center text-center relative overflow-hidden">
                                {libraryData.overdue.length > 0 && <div className="absolute top-0 left-0 w-full h-2 bg-rose-500 animate-pulse"></div>}
                                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><AlertCircle size={36} /></div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Defaulters</h2>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">Overdue & Fines</p>
                                <div className={`w-full py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[14px] ${libraryData.overdue.length > 0 ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-rose-50 text-rose-500'}`}>{libraryData.overdue.length} Action Needed</div>
                            </div>
                            <div onClick={() => setCurrentView('history')} className="bg-white rounded-[3rem] p-8 shadow-sm hover:shadow-xl border border-emerald-100 cursor-pointer transition-all active:scale-95 group flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><History size={36} /></div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Past History</h2>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">Returned books</p>
                                <div className="w-full py-4 bg-emerald-50 rounded-[1.5rem] font-black text-emerald-500 uppercase tracking-widest text-[14px]">{libraryData.history.length} Records</div>
                            </div>
                        </motion.div>
                    )}

                    {/* 2. ACTIVE LOANS VIEW */}
                    {currentView === 'active' && (
                        <motion.div key="active" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            {libraryData.active.length === 0 ? (
                                <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 opacity-60">
                                    <BookOpen size={60} className="mx-auto text-slate-300 mb-4"/>
                                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-tighter">No Active Books</h3>
                                </div>
                            ) : (
                                libraryData.active.map(tx => (
                                    <div key={tx._id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="w-16 h-20 bg-blue-50 text-[#42A5F5] rounded-xl flex items-center justify-center border border-blue-100 shrink-0"><BookOpen size={28}/></div>
                                            <div>
                                                <h3 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">{tx.bookId?.title}</h3>
                                                <p className="text-[12px] font-bold text-slate-500 capitalize italic mb-3">by {tx.bookId?.author}</p>
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] font-black bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1"><Hash size={12}/> {tx.bookId?.isbn}</span>
                                                    <span className="text-[10px] font-black bg-blue-50 border border-blue-100 text-[#42A5F5] px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1"><RefreshCw size={12}/> Renewals: {tx.renewalCount || 0}/3</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                            <div className="text-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-center items-center gap-1"><Clock size={12}/> Return By</p>
                                                <p className="text-[16px] font-black text-[#42A5F5] uppercase tracking-wider">{new Date(tx.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                            
                                            {/* 🔥 HIDE RENEW BUTTON IF LIMIT REACHED 🔥 */}
                                            {tx.renewalCount >= 3 ? (
                                                <div className="bg-rose-50 px-6 py-4 rounded-[1.5rem] border border-rose-100 flex items-center justify-center">
                                                    <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Max Limit Reached</span>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setSelectedTx(tx); setShowRenewModal(true); }} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[12px] shadow-lg transition-all active:scale-95 flex items-center gap-2">
                                                    <RefreshCw size={16}/> Renew
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* OVERDUE & HISTORY (Same as previous code, keeping it clean) */}
                    {currentView === 'overdue' && (
                        <motion.div key="overdue" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            {libraryData.overdue.length === 0 ? (
                                <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100">
                                    <CheckCircle size={60} className="mx-auto text-emerald-400 mb-4"/>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">All Clear!</h3>
                                </div>
                            ) : (
                                libraryData.overdue.map(tx => (
                                    <div key={tx._id} className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-rose-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="w-16 h-20 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100 shrink-0"><AlertCircle size={28}/></div>
                                            <div>
                                                <h3 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">{tx.bookId?.title}</h3>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-2">Was due on: {new Date(tx.dueDate).toLocaleDateString('en-GB')}</p>
                                                <span className="text-[10px] font-black bg-rose-100 border border-rose-200 text-rose-600 px-3 py-1 rounded-lg uppercase tracking-widest">Return to Library Immediately</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full md:w-auto gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                            <div className="text-center bg-rose-50 px-5 py-3 rounded-2xl border border-rose-100">
                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Late By</p>
                                                <p className="text-[18px] font-black text-rose-600">{tx.overdueDays} Days</p>
                                            </div>
                                            <div className="text-center bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100">
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending Fine</p>
                                                <p className="text-[18px] font-black text-amber-600 flex items-center justify-center"><IndianRupee size={16}/>{tx.pendingFine}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {currentView === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
                                {libraryData.history.length === 0 ? (
                                    <p className="text-center text-slate-400 font-bold py-10 uppercase tracking-widest text-[12px]">No reading history found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {libraryData.history.map(tx => (
                                            <div key={tx._id} className="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex justify-between items-center hover:bg-slate-100 transition-colors">
                                                <div>
                                                    <h3 className="text-[15px] font-black text-slate-800 uppercase">{tx.bookId?.title}</h3>
                                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Returned: {new Date(tx.returnDate).toLocaleDateString('en-GB')}</p>
                                                </div>
                                                <span className="text-[10px] font-black bg-emerald-50 text-emerald-500 px-4 py-2 rounded-xl uppercase tracking-widest border border-emerald-100">Returned</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* 🔥 SMART DYNAMIC RENEW MODAL 🔥 */}
            <AnimatePresence>
                {showRenewModal && selectedTx && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRenewModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center z-10">
                            
                            {checkIsTooLate(selectedTx.dueDate) ? (
                                // ❌ BLOCKED MODAL (Clicked on or after Due Date)
                                <>
                                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                                        <XCircle size={36} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Renewal Blocked!</h3>
                                    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-6 leading-relaxed">
                                        Today is your due date. You must renew at least <span className="text-rose-500 font-black">1 day before</span>. Please return the book today.
                                    </p>
                                    <button onClick={() => setShowRenewModal(false)} className="w-full py-4 bg-slate-800 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-700 shadow-lg transition-all">
                                        Understood
                                    </button>
                                </>
                            ) : (
                                // ✅ SUCCESS MODAL (Clicked before Due Date)
                                <>
                                    <div className="w-20 h-20 bg-blue-50 text-[#42A5F5] rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                                        <RefreshCw size={36} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Renew Book?</h3>
                                    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-6 leading-relaxed">
                                        Extend the due date for <span className="text-[#42A5F5] font-black">{selectedTx.bookId?.title}</span> by <span className="text-[#42A5F5] font-black">15 more days</span>?
                                    </p>
                                    <div className="flex gap-4">
                                        <button onClick={() => setShowRenewModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                                        <button onClick={handleRenewRequest} disabled={isRenewing} className="flex-1 py-4 bg-[#42A5F5] text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg transition-all flex justify-center items-center gap-2">
                                            {isRenewing ? "Processing..." : <><CheckCircle size={18}/> Confirm</>}
                                        </button>
                                    </div>
                                </>
                            )}

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default Library;
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, Trash2, Lock, Plus, Calendar, ArrowLeft, ChevronDown, CheckCircle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; 

const TransportExemptions = () => {
    const navigate = useNavigate();
    const [exemptions, setExemptions] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [showConfirm, setShowConfirm] = useState(false);

    const currentYear = new Date().getFullYear();
    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    const fetchExemptions = async () => {
        try {
            const { data } = await api.get('/fees/settings/transport-exempt');
            setExemptions(data);
        } catch (error) { console.error("Error fetching exemptions"); }
    };

    useEffect(() => { fetchExemptions(); }, []);

    const handleAddExemption = async () => {
        setIsLoading(true);
        try {
            await api.post('/fees/settings/transport-exempt', {
                monthIndex: selectedMonth,
                year: currentYear
            });
            showToast("Transport fees disabled for selected month! 🛑", "success");
            setShowConfirm(false);
            setSelectedMonth(null);
            fetchExemptions();
        } catch (error) {
            showToast(error.response?.data?.message || "Operation failed", "error");
        } finally { setIsLoading(false); }
    };

    const handleRemoveExemption = async (id) => {
        try {
            await api.delete(`/fees/settings/transport-exempt/${id}`);
            showToast("Exemption reverted! Fees active again. ✅", "success");
            fetchExemptions();
        } catch (error) {
            showToast(error.response?.data?.message || "24-Hour window expired! 🔒", "error");
        }
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-40 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">
            
            {/* 🔥 PREMIUM HEADER 🔥 */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-32 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all hover:bg-white/30 active:scale-90 shadow-sm backdrop-blur-md">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black tracking-wide italic px-16">Fee Controller</h1>
                <p className="text-[13px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Transport Exemptions Panel</p>
            </div>

            <div className="px-5 -mt-20 relative z-20 max-w-4xl mx-auto space-y-6">
                
                {/* 🔥 INFO BOX 🔥 */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-start md:items-center gap-5">
                    <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl shrink-0">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h2 className="text-[20px] font-extrabold text-slate-800 tracking-wide capitalize leading-tight mb-1">
                            Exempt specific months
                        </h2>
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Turn off bus fees for specific months (e.g. Summer Vacation). You have a 24-hour window to undo this action.
                        </p>
                    </div>
                </div>

                {/* 🔥 CUSTOM DROPDOWN & ACTION AREA 🔥 */}
                <div className="flex flex-col md:flex-row gap-4 relative z-30">
                    
                    {/* DROPDOWN WRAPPER */}
                    <div className="flex-1 relative">
                        {/* Selected Box */}
                        <div 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full flex items-center justify-between pl-6 pr-4 py-4 bg-white border-2 rounded-[1.5rem] font-bold text-[14px] transition-all cursor-pointer shadow-sm ${isDropdownOpen ? 'border-[#42A5F5] ring-4 ring-blue-500/10' : 'border-slate-200 hover:border-blue-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Calendar className="text-slate-400" size={18} />
                                <span className={selectedMonth !== null ? 'text-slate-700' : 'text-slate-400'}>
                                    {selectedMonth !== null ? `${months[selectedMonth]} ${currentYear}` : 'Select Month to Exempt...'}
                                </span>
                            </div>
                            <div className={`p-1.5 bg-slate-50 rounded-xl transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-[#42A5F5]' : 'text-slate-400'}`}>
                                <ChevronDown size={16} />
                            </div>
                        </div>

                        {/* Dropdown Options List */}
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <>
                                    {/* Invisible Overlay to catch outside clicks */}
                                    <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)}></div>
                                    
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-slate-100 rounded-[1.5rem] shadow-2xl z-40 overflow-hidden"
                                    >
                                        {/* Scrollable Area - Restricts height to approx 3.5 items */}
                                        <div className="max-h-[180px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                                            {months.map((m, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => { setSelectedMonth(i); setIsDropdownOpen(false); }}
                                                    className={`px-4 py-3 rounded-xl cursor-pointer font-black text-[13px] tracking-wide transition-all flex justify-between items-center ${selectedMonth === i ? 'bg-[#42A5F5] text-white shadow-md' : 'text-slate-600 hover:bg-blue-50 hover:text-[#42A5F5]'}`}
                                                >
                                                    {m} {currentYear}
                                                    {selectedMonth === i && <CheckCircle size={14} />}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <button 
                        onClick={() => { if(selectedMonth !== null) setShowConfirm(true); else showToast("Please select a month first! ⚠️", "error") }}
                        className="px-8 py-4 bg-slate-800 text-white font-black uppercase tracking-widest text-[12px] rounded-[1.5rem] hover:bg-slate-900 active:scale-95 transition-all flex items-center gap-2 justify-center shadow-xl shadow-slate-900/20 shrink-0 z-20"
                    >
                        <Plus size={16} /> Disable Fees
                    </button>
                </div>

                {/* 🔥 ACTIVE EXEMPTIONS LIST 🔥 */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm relative z-20 mt-8">
                    <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[#42A5F5]" /> Active Exemptions Log
                    </h3>
                    
                    <div className="space-y-4">
                        {exemptions.length === 0 ? (
                            <div className="py-12 text-center flex flex-col items-center opacity-40">
                                <ShieldCheck size={48} className="text-slate-300 mb-4" />
                                <p className="text-slate-500 font-bold text-[14px] uppercase tracking-widest">No active exemptions found.</p>
                            </div>
                        ) : (
                            exemptions.map((ex, i) => {
                                const isExpired = (new Date() - new Date(ex.createdAt)) / (1000 * 60 * 60) > 24;
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        key={ex._id} 
                                        className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-5 border-2 border-slate-100 rounded-[1.5rem] bg-slate-50/30 hover:border-slate-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[1rem] bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{ex.year}</span>
                                                <span className="text-[14px] font-black text-[#42A5F5] uppercase tracking-wide">{months[ex.monthIndex].slice(0,3)}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-[18px] capitalize text-slate-800 tracking-wide">{months[ex.monthIndex]} {ex.year}</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    Applied: {new Date(ex.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        {isExpired ? (
                                            <div className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-black text-[11px] uppercase tracking-widest">
                                                <Lock size={14} /> Fixed (24h+ Passed)
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleRemoveExemption(ex._id)}
                                                className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-sm"
                                            >
                                                <Trash2 size={14} /> Revert Action
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

            {/* ================= MODAL: CONFIRM EXEMPTION ================= */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] w-full max-w-sm p-8 shadow-2xl z-10 text-center">
                            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }} className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                                <AlertCircle size={40} />
                            </motion.div>
                            
                            <h2 className="text-2xl font-black tracking-wide mb-2 text-slate-800">Disable Fees?</h2>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                                Turn off transport fees for <span className="font-black text-rose-500">{months[selectedMonth]} {currentYear}</span>? You can undo this within 24 hours.
                            </p>
                            
                            <div className="flex gap-4">
                                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest text-[12px] hover:bg-slate-200 transition-colors active:scale-95">Cancel</button>
                                <button onClick={handleAddExemption} disabled={isLoading} className="flex-1 py-4 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[12px] shadow-lg shadow-rose-500/30 active:scale-95 transition-all">
                                    {isLoading ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ================= TOAST NOTIFICATIONS ================= */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }} animate={{ y: 40, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
                        className={`fixed top-0 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-full font-black text-[13px] italic shadow-2xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                    >
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TransportExemptions;
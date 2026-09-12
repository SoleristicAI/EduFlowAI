import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, History, Bus, MapPin, Calendar, CheckCircle, ChevronDown } from 'lucide-react';
import API from '../../api';
import Loader from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const TransportLedger = () => {
    const { id } = useParams(); // URL se student ka ID aayega
    const navigate = useNavigate();
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState(null);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                if (!activeSession) {
                    setLoading(true);
                    const sessionRes = await API.get('/users/general/session-info');
                    setActiveSession(sessionRes.data.activeSession);
                    setAvailableSessions(sessionRes.data.allAvailableSessions);
                    
                    // Nayi Transport Audit API ko call kar raha hai
                    const { data } = await API.get(`/fees/audit-transport/${id}?session=${sessionRes.data.activeSession}`);
                    setAudit(data);
                } else {
                    setLoading(true);
                    const { data } = await API.get(`/fees/audit-transport/${id}?session=${activeSession}`);
                    setAudit(data);
                }
            } catch (err) {
                console.error("Ledger decrypt error");
            } finally {
                setLoading(false); 
            }
        };
        fetchAudit();
    }, [id, activeSession]);

    if (loading) return <Loader />;

    if (!audit) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
            <AlertCircle size={50} className="text-rose-400 mb-4 animate-bounce" />
            <p className="text-[15px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Ledger Data Not Found</p>
            <button onClick={() => navigate(-1)} className="mt-6 px-6 py-3 bg-[#42A5F5] text-white rounded-full font-bold italic tracking-wider active:scale-95">Go Back</button>
        </div>
    );

    const isFeesDone = (audit?.grandTotal ?? 0) <= 0;
    const statusText = isFeesDone ? "Clear" : "Dues Pending";

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 font-sans italic pb-24 text-[15px]">
            
            {/* Header & Session Dropdown */}
            <div className="flex justify-between items-center mb-8 border-l-4 border-amber-500 pl-4">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl border border-[#DDE3EA] shadow-md hover:bg-amber-50 transition-all active:scale-90 group"
                    >
                        <ArrowLeft size={24} className="text-amber-500" />
                    </button>
                    <h1 className="text-3xl font-black italic tracking-tight capitalize">Transport Ledger</h1>
                </div>

                {/* 🔥 PREMIUM GLASS DROPDOWN 🔥 */}
                <div className="relative mr-4 z-50">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-[#DDE3EA] shadow-sm rounded-2xl active:scale-95 transition-all"
                    >
                        <History size={16} className="text-amber-500" />
                        <span className="text-[14px] font-black tracking-widest text-slate-700">{activeSession || 'Loading...'}</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0" onClick={() => setIsDropdownOpen(false)}></div>
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full mt-2 w-full min-w-[150px] right-0 bg-white rounded-2xl shadow-xl border border-amber-50 overflow-hidden"
                                >
                                    <div className="max-h-[180px] overflow-y-auto custom-scrollbar p-1">
                                        {availableSessions.map((session) => (
                                            <div
                                                key={session}
                                                onClick={() => { setActiveSession(session); setIsDropdownOpen(false); }}
                                                className={`px-4 py-3 m-1 rounded-xl text-center cursor-pointer text-[13px] font-black italic transition-all ${activeSession === session ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-amber-50'}`}
                                            >
                                                {session}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* TOP STATUS BAR */}
            <div className={`p-8 rounded-[3rem] border shadow-sm mb-8 relative overflow-hidden ${isFeesDone ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex justify-between items-start relative z-10 text-left">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tight text-slate-800 capitalize mb-1">{audit?.student?.name || 'Unknown Student'}</h2>
                        <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            Adm No: {audit?.student?.admissionNo || 'N/A'} • Class: {audit?.student?.grade || 'N/A'}
                        </p>
                        
                        {/* 🔥 ROUTE & STOP DETAILS 🔥 */}
                        <div className="mt-4 flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-white/40 w-max backdrop-blur-sm">
                            <div className="p-2 bg-amber-500 text-white rounded-xl"><Bus size={18} /></div>
                            <div>
                                <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 leading-none">Assigned Route</p>
                                <p className="text-[15px] font-black text-slate-800 capitalize">{audit?.routeName} <span className="text-slate-400 px-1">•</span> {audit?.stopName}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${isFeesDone ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                        {isFeesDone ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {statusText}
                    </div>
                </div>

                {/* --- LEDGER STATUS SECTION --- */}
                <div className="space-y-4 mb-2 mt-8">
                    {/* Box 1: Monthly Dues */}
                    <div className="bg-white p-8 rounded-[3rem] border border-[#DDE3EA] shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[18px] font-black text-slate-400 uppercase tracking-widest italic">
                                    Pending Transport Dues
                                </p>
                                <h2 className={`text-5xl font-black tracking-tighter mt-1 ${(audit?.grandTotal ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    ₹{(audit?.grandTotal ?? 0).toLocaleString()}
                                </h2>
                            </div>
                            <div className={`p-4 rounded-2xl ${(audit?.grandTotal ?? 0) > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                <Calendar size={28} />
                            </div>
                        </div>
                        <p className="text-[14px] font-bold text-slate-600 italic">
                            {(audit?.grandTotal ?? 0) > 0
                                ? "Includes current month + unpaid backlog + exemptions logic."
                                : "Transport fees are fully up to date."}
                        </p>
                    </div>

                    {/* Box 2: Advance Credit (Only shows if there is surplus) */}
                    {(audit?.advanceBalance ?? 0) > 0 && (
                        <div className="bg-emerald-500 p-8 rounded-[3rem] text-white shadow-xl flex justify-between items-center">
                            <div>
                                <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-80">Surplus Credit</p>
                                <p className="text-3xl font-black italic">₹{(audit?.advanceBalance ?? 0).toLocaleString()}</p>
                            </div>
                            <CheckCircle size={32} className="opacity-50" />
                        </div>
                    )}
                </div>
            </div>

            {/* LEDGER HISTORY ENTRIES */}
            <div className="space-y-6 mt-12">
                <div className="flex items-center gap-3 ml-4 mb-6">
                    <History size={18} className="text-amber-500" />
                    <h3 className="text-[13px] font-black text-slate-400 capitalize tracking-widest">Verified Transactions</h3>
                </div>

                {audit.paymentHistory && Object.keys(audit.paymentHistory).length > 0 ? (
                    Object.entries(audit.paymentHistory).map(([monthYear, records]) => (
                        <div key={monthYear} className="space-y-5 mb-10">
                            <div className="flex items-center gap-4 px-4">
                                <div className="h-[1px] flex-1 bg-slate-100"></div>
                                <span className="text-[15px] font-black uppercase tracking-[0.3em] text-amber-500">{monthYear}</span>
                                <div className="h-[1px] flex-1 bg-slate-100"></div>
                            </div>

                            <div className="space-y-4">
                                {records.map((h, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:border-amber-400 transition-all shadow-sm">
                                        <div className="flex items-center gap-5">
                                            <div className="bg-amber-50 p-4 rounded-2xl text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                <Bus size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[16px] font-black text-slate-700 capitalize italic group-hover:text-amber-500 transition-colors">
                                                    {h.category?.toLowerCase() || 'transport fee'}
                                                </p>
                                                <p className="text-[12px] font-bold text-slate-400 capitalize mt-1">
                                                    {new Date(h.date).toLocaleDateString('en-GB')} • {h.mode}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[18px] font-black text-emerald-500 italic">+ ₹{h.amount.toLocaleString()}</p>
                                            <div className="flex items-center justify-end gap-1 opacity-40">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Captured</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 mx-4 shadow-sm">
                        <AlertCircle size={40} className="mx-auto mb-4 text-slate-200" />
                        <p className="text-[12px] font-black uppercase tracking-widest text-slate-300 italic">No transactional data logged</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransportLedger;
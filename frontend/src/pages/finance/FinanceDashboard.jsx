import React, { useState, useEffect } from 'react';
import { Wallet, Users, AlertCircle, Clock, IndianRupee, TrendingUp, Plus, ArrowRight, Bell, Zap, CheckCircle, Layers, ShieldCheck , Megaphone, History, ChevronDown} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const FinanceDashboard = ({ searchQuery }) => {
    const [stats, setStats] = useState({
        collectedToday: 0, collectedMonth: 0, recentPayments: [], pendingCount: 0
    });
    const [showAllSlips, setShowAllSlips] = useState(false);
    const [newPaymentAlert, setNewPaymentAlert] = useState(null);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    // 🔥 NAYE SESSION STATES 🔥
    const [activeSession, setActiveSession] = useState(null);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);

    useEffect(() => {
        const initSession = async () => {
            try {
                const sessionRes = await API.get('/users/general/session-info');
                setActiveSession(sessionRes.data.activeSession);
                setAvailableSessions(sessionRes.data.allAvailableSessions);
                fetchStats(sessionRes.data.activeSession);
            } catch (e) { console.log(e); }
        };
        initSession();
    }, []);

    const fetchStats = async (sessionParam = activeSession) => {
        if (!sessionParam) return;
        try {
            // Hum backend se `stats` API ko future mein update kar sakte hain if needed, par abhi summary API use karenge recent payments filter karne ke liye
            const { data } = await API.get('/users/finance/stats');
            
            // 🔥 NAYA LOGIC: Recent payments ko filter karne ke liye specific API bula lo jisme session hai
            const { data: summaryData } = await API.get(`/fees/reports/summary?session=${sessionParam}`);

            if (stats.recentPayments.length > 0 && summaryData.history.length > 0) {
                const latestNewId = summaryData.history[0]._id;
                const latestOldId = stats.recentPayments[0]._id;

                if (latestNewId !== latestOldId) {
                    setNewPaymentAlert({
                        studentName: summaryData.history[0].student?.name,
                        grade: summaryData.history[0].student?.grade,
                        amount: summaryData.history[0].amountPaid
                    });
                    setTimeout(() => setNewPaymentAlert(null), 7000);
                }
            }

            // Stats update - Replacing recent payments with session filtered history
            setStats({
                ...data,
                recentPayments: summaryData.history.map(p => ({
                    _id: p._id,
                    studentName: p.student?.name || 'Unknown',
                    grade: p.student?.grade || 'N/A',
                    amount: p.amountPaid,
                    paymentMode: p.paymentMode,
                    date: new Date(p.date).toLocaleDateString(),
                    time: new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }))
            }); 
        } catch (err) { console.error("Stats sync error:", err); }
    };

    useEffect(() => {
        if(!activeSession) return;
        const interval = setInterval(() => fetchStats(activeSession), 10000);
        return () => clearInterval(interval);
    }, [stats.recentPayments, activeSession]);

    const statCards = [
        { label: "Today's collection", value: stats.collectedToday, icon: <Wallet className="text-[#42A5F5]" />, color: "border-[#DDE3EA]", path: '/finance/add-payment' },
        { label: "Monthly collection", value: stats.collectedMonth, icon: <TrendingUp className="text-emerald-500" />, color: "border-[#DDE3EA]", path: '/finance/reports' },
        { label: "Students fees", value: "Track records", icon: <Users className="text-orange-400" />, color: "border-[#DDE3EA]", path: '/finance/fees-tracker' },
        { label: "Fees details", value: "Class setup", icon: <Layers className="text-blue-500" />, color: "border-[#DDE3EA]", path: '/finance/fee-setup' },
        {
            label: "Payments",
            value: "Configure UPI/QR",
            icon: <ShieldCheck className="text-emerald-400" />,
            color: "border-[#DDE3EA]",
            path: '/finance/gateway'
        },
        { label: "Fees Notice Hub", value: "Publish Notices", icon: <Megaphone className="text-rose-500" />, color: "border-[#DDE3EA]", path: '/finance/fees-notice' }, // 👈 NEW MODULE CONNECTED
    ];

    return (
        <div className="px-5 -mt-25 space-y-5 relative z-10 pb-24 font-sans bg-[#F8FAFC]">

            {/* FLOATING NOTIFICATION UI */}
            <AnimatePresence>
                {newPaymentAlert && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md bg-white border-2 border-[#42A5F5] p-5 rounded-[2.5rem] shadow-2xl backdrop-blur-xl flex items-center gap-4"
                    >
                        <div className="p-3 bg-[#42A5F5] rounded-2xl text-white animate-pulse">
                            <Zap size={20} fill="white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#42A5F5] mb-1">Incoming online payment</h4>
                            <p className="text-[14px] font-black text-slate-700 truncate capitalize">{newPaymentAlert.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-bold capitalize">{newPaymentAlert.grade} • Received now</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[16px] font-black text-slate-800 italic">₹{newPaymentAlert.amount.toLocaleString()}</p>
                            <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-500 font-black uppercase">
                                <CheckCircle size={10} /> Verified
                            </div>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>

            {/* HEADER SECTION */}
            <div className="p-8 pb-20 bg-[#42A5F5] text-white flex justify-between items-center relative overflow-hidden rounded-b-[3.5rem] shadow-lg">
                <div className="absolute top-0 right-0 p-10 opacity-10 -rotate-12"><IndianRupee size={120} /></div>

                <div className="relative z-10">
                    {/* <h1 className="text-2xl font-black italic tracking-tight capitalize">Finance dashboard</h1> */}
                    <p className="text-[19px] font-bold text-white/80 mt-1 capitalize tracking-wide">
                        Accountant: <br /> {user?.name}
                    </p>
                </div>

                <div className="flex items-center gap-3 relative z-30">
                    {/* <div className="flex flex-col items-end mr-2">
                        <span className={`text-[15px] font-black uppercase tracking-widest ${stats.penaltySettings?.isActive ? 'text-rose-200' : 'text-white/40'}`}>
                            {stats.penaltySettings?.isActive ? 'Penalty' : 'Penalty'}
                        </span>
                        <button
                            onClick={async () => {
                                const newStatus = !stats.penaltySettings?.isActive;
                                await API.post('/fees/settings/penalty', {
                                    dailyRate: stats.penaltySettings?.dailyRate || 10,
                                    isActive: newStatus
                                });
                                fetchStats();
                            }}
                            className={`w-12 h-6 rounded-full p-1 mt-1 transition-all flex items-center shadow-inner ${stats.penaltySettings?.isActive ? 'bg-rose-500' : 'bg-white/20'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all transform ${stats.penaltySettings?.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div> */}

                    <button
                        onClick={() => navigate('/finance/add-payment')}
                        className="p-3.5 bg-white text-[#42A5F5] rounded-2xl shadow-lg active:scale-90 transition-all border border-white"
                    >
                        <Plus size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>

            <div className="px-5 -mt-10 space-y-6 relative z-20">
                {/* Analytics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {statCards
                        .filter(card => card.label.toLowerCase().includes(searchQuery?.toLowerCase() || ''))
                        .map((card, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(card.path)}
                                className={`p-6 bg-white rounded-[2.5rem] border border-[#DDE3EA] shadow-md active:scale-95 transition-all cursor-pointer relative overflow-hidden group`}
                            >
                                {/* --- RED NOTIFICATION BADGE --- */}
                                {card.label === "Payments" && stats.pendingCount > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-5 right-5 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg border-2 border-white z-20"
                                    >
                                        {stats.pendingCount}
                                    </motion.div>
                                )}
                                <div className="mb-3 opacity-80 group-hover:scale-110 transition-transform">{card.icon}</div>
                                <h3 className="text-[18px] font-black text-slate-700">
                                    {typeof card.value === 'number' ? `₹${card.value.toLocaleString()}` : card.value}
                                </h3>
                                <p className="text-[15px] font-bold capitalize text-slate-400 tracking-wide mt-1">{card.label}</p>
                                <ArrowRight size={14} className="absolute bottom-6 right-6 text-slate-200 group-hover:text-[#42A5F5] transition-colors" />
                            </div>
                        ))}
                </div>

                {/* PENALTY INFO ACTION BAR */}
                {/* {stats.penaltySettings?.isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rose-50 border border-rose-100 rounded-3xl flex justify-between items-center px-6"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                            <span className="text-[11px] font-black text-rose-500 uppercase">Live Penalty: Daily fine</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-white p-1.5 px-3 rounded-xl border border-rose-100 shadow-sm">
                                <span className="text-[12px] font-black italic text-rose-400">₹</span>
                                <input
                                    id="penaltyRateInput"
                                    type="number"
                                    className="bg-transparent w-12 text-[13px] font-black text-slate-700 outline-none text-center"
                                    defaultValue={stats.penaltySettings?.dailyRate}
                                />
                            </div>

                            <button
                                onClick={async () => {
                                    const val = Number(document.getElementById('penaltyRateInput').value);
                                    try {
                                        await API.post('/fees/settings/penalty', {
                                            dailyRate: val,
                                            isActive: true
                                        });
                                        fetchStats();
                                        setPenaltyUpdateMsg(true);
                                        setTimeout(() => setPenaltyUpdateMsg(null), 4000);
                                    } catch (err) {
                                        console.error("Failed to update rate");
                                    }
                                }}
                                className="bg-rose-500 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl shadow-md active:scale-90 transition-all"
                            >
                                Update
                            </button>
                        </div>
                    </motion.div>
                )} */}

                {/* Recent Payments Section */}
                <div className="bg-white rounded-[3rem] border border-[#DDE3EA] p-8 shadow-md relative overflow-visible z-30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Clock size={18} className="text-[#42A5F5]" />
                            <h3 className="text-[15px] font-black text-slate-700 capitalize tracking-widest">
                                Recent Transactions
                            </h3>
                        </div>

                        {/* 🔥 SESSION GLASS DROPDOWN 🔥 */}
                        <div className="relative z-50">
                            <button
                                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 shadow-sm rounded-full active:scale-95 transition-all"
                            >
                                <History size={14} className="text-[#42A5F5]" />
                                <span className="text-[12px] font-black tracking-widest text-[#42A5F5] uppercase">{activeSession || 'Loading...'}</span>
                                <ChevronDown size={14} className={`text-[#42A5F5] transition-transform ${isSessionDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isSessionDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full mt-2 w-full min-w-[140px] right-0 bg-white rounded-2xl shadow-2xl border border-blue-50 overflow-hidden z-[100]"
                                    >
                                        {availableSessions.map((session) => (
                                            <div
                                                key={session}
                                                onClick={() => {
                                                    setActiveSession(session);
                                                    setIsSessionDropdownOpen(false);
                                                    fetchStats(session); // Naye session ka data laao
                                                }}
                                                className={`px-4 py-3 cursor-pointer text-center text-[13px] font-black italic transition-all ${activeSession === session ? 'bg-[#42A5F5] text-white' : 'text-slate-600 hover:bg-blue-50'}`}
                                            >
                                                {session}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {stats.recentPayments.length > 0 ? (
                            <>
                                {(showAllSlips
                                    ? stats.recentPayments
                                    : stats.recentPayments.slice(0, 3)
                                ).map((p, i) => (
                                    <div
                                        key={i}
                                        onClick={() => navigate(`/finance/receipt/${p._id}`)}
                                        className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex justify-between items-center group hover:border-[#42A5F5]/30 hover:bg-white transition-all cursor-pointer shadow-sm active:scale-98"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-[16px] font-black text-slate-700 truncate capitalize italic">
                                                    {p.studentName}
                                                </p>

                                                <span className="text-[10px] bg-[#42A5F5]/10 px-2 py-0.5 rounded-full text-[#42A5F5] font-black uppercase">
                                                    {p.paymentMode || 'CASH'}
                                                </span>
                                            </div>

                                            <p className="text-[13px] text-slate-400 font-bold capitalize">
                                                {p.grade} • {p.date} <br />
                                                {p.time ? ` at ${p.time}` : ''}
                                            </p>
                                        </div>

                                        <span className="text-[16px] font-black text-[#42A5F5] italic ml-4">
                                            ₹{p.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}

                                {stats.recentPayments.length > 3 && (
                                    <button
                                        onClick={() => setShowAllSlips(!showAllSlips)}
                                        className="w-full mt-4 bg-[#42A5F5]/10 text-[#42A5F5] py-3 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    >
                                        {showAllSlips ? "Show Less ▲" : "Show More ▼"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="py-12 text-center opacity-30 flex flex-col items-center">
                                <IndianRupee size={40} className="mb-3 text-slate-400" />
                                <p className="text-[12px] font-bold text-slate-400 capitalize">
                                    No recent inflow detected
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;
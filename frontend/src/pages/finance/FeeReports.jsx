import React, { useState, useEffect } from 'react';
import { Download, Printer, Layers, Calendar, ArrowLeft, IndianRupee, History, ChevronDown } from 'lucide-react';
import API from '../../api';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const FeeReports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); 
    const [report, setReport] = useState({
        totalCollected: 0, transactionCount: 0, classWise: [], history: [], schoolName: "", schoolAddress: ""
    });

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
                fetchReport(sessionRes.data.activeSession);
            } catch (e) { console.log(e); }
        };
        initSession();
    }, []);

    const fetchReport = async (sessionParam = activeSession) => {
        if (!sessionParam) return;
        try {
            setLoading(true);
            const { data: statsData } = await API.get('/users/finance/stats');
            const { data: reportData } = await API.get(`/fees/reports/summary?session=${sessionParam}`);

            setReport({
                ...reportData,
                schoolName: statsData.schoolName,
                schoolAddress: statsData.schoolAddress
            });
        } catch (err) { console.error("Report fetch error"); } 
        finally { setLoading(false); }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-5 pb-24 italic print:bg-white print:text-black print:p-0 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">

            {/* CSS TO REMOVE BROWSER HEADERS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; }
                    header, footer, .no-print { display: none !important; }
                }
            `}} />

            {/* --- AUTO GENERATED OFFICIAL HEADER (PRINT ONLY) --- */}
            <div className="hidden print:flex flex-col items-center border-b-4 border-slate-800 pb-8 mb-10 text-center">
                <h1 className="text-5xl font-black uppercase tracking-tighter leading-tight">{report.schoolName}</h1>
                <p className="text-sm uppercase font-bold text-slate-600 mt-2">{report.schoolAddress}</p>
                <div className="mt-8 bg-slate-800 text-white px-10 py-2 font-black uppercase italic text-xs tracking-widest">
                    Fees collection report
                </div>
            </div>

            {/* --- SCREEN HEADER (VISIBLE ONLY) --- */}
            <div className="flex justify-between items-center mb-10 border-l-4 border-[#42A5F5] pl-4 print:hidden relative z-50">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl border border-[#DDE3EA] shadow-md hover:bg-blue-50 transition-all active:scale-90 group"
                    >
                        <ArrowLeft className="text-[#42A5F5]" size={24} />
                    </button>

                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black italic tracking-tight capitalize">Fee records</h1>
                            
                            {/* 🔥 SESSION GLASS DROPDOWN 🔥 */}
                            <div className="relative">
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
                                            className="absolute top-full mt-2 w-full min-w-[140px] left-0 bg-white rounded-2xl shadow-2xl border border-blue-50 overflow-hidden z-[100]"
                                        >
                                            {availableSessions.map((session) => (
                                                <div
                                                    key={session}
                                                    onClick={() => {
                                                        setActiveSession(session);
                                                        setIsSessionDropdownOpen(false);
                                                        fetchReport(session); // Naye session ka data laao
                                                    }}
                                                    className={`px-4 py-3 cursor-pointer text-[13px] font-black italic transition-all ${activeSession === session ? 'bg-[#42A5F5] text-white' : 'text-slate-600 hover:bg-blue-50'}`}
                                                >
                                                    {session}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-1">School Account</p>
                    </div>
                </div>

                <button onClick={() => window.print()} className="p-4 bg-white rounded-2xl text-[#42A5F5] border border-[#DDE3EA] hover:bg-blue-50 transition-all shadow-lg active:scale-90">
                    <Printer size={24} />
                </button>
            </div>

            {/* --- TOTAL SUMMARY --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 print:grid-cols-2 print:gap-10">
                <div className="bg-white p-10 rounded-[3rem] border border-[#DDE3EA] text-center shadow-md print:border-2 print:border-black print:rounded-none">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3">Total fees received</p>
                    <h2 className="text-6xl font-black tracking-tighter text-[#42A5F5] print:text-black">₹{report.totalCollected.toLocaleString()}</h2>
                    <p className="text-[11px] font-bold text-slate-400 mt-4 uppercase italic">Total {report.transactionCount} successful payments</p>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-[#DDE3EA] p-8 shadow-sm print:border-2 print:border-black print:rounded-none">
                    <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-6">Class-wise summary</h3>
                    <div className="space-y-4">
                        {report.classWise.map((item, i) => (
                            <div key={i} className="flex justify-between text-[14px] border-b border-slate-50 pb-3 print:border-black">
                                <span className="font-bold text-slate-600 uppercase italic">Class {item._id}</span>
                                <span className="font-black text-[#42A5F5] print:text-black">₹{item.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- STUDENT LIST TABLE --- */}
            <div className="bg-white rounded-[2.5rem] border border-[#DDE3EA] overflow-hidden shadow-md print:border-2 print:border-black print:rounded-none">
                <div className="p-6 border-b border-slate-100 bg-slate-50 print:bg-gray-100 print:border-black">
                    <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400">All payments list</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-slate-50 uppercase font-black text-slate-400 border-b border-slate-100 print:text-black print:border-black">
                            <tr>
                                <th className="p-6">Date</th>
                                <th className="p-6">Student name</th>
                                <th className="p-6">Grade</th>
                                <th className="p-6 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 print:divide-black">
                            {report.history?.map((fee, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors print:text-black">
                                    <td className="p-6 font-bold text-slate-500">{new Date(fee.date).toLocaleDateString()}</td>
                                    <td className="p-6 font-black text-slate-700 uppercase italic">{fee.student?.name || '---'}</td>
                                    <td className="p-6 font-bold text-slate-500 uppercase">Class {fee.student?.grade}</td>
                                    <td className="p-6 text-right font-black text-slate-800 text-[16px]">₹{fee.amountPaid.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- SIGNATURES --- */}
            <div className="hidden print:flex justify-between mt-32 px-10">
                <div className="text-center">
                    <div className="w-56 border-b-2 border-black mb-3"></div>
                    <p className="text-[11px] font-black uppercase italic">Finance teacher</p>
                </div>
                <div className="text-center">
                    <div className="w-56 border-b-2 border-black mb-3"></div>
                    <p className="text-[11px] font-black uppercase italic">Principal stamp</p>
                </div>
            </div>
        </div>
    );
};

export default FeeReports;
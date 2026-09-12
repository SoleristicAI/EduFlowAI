import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Clock, CheckCircle, AlertCircle, MapPin, Bus, ArrowLeft, Download, X, Zap, ChevronRight, History, ChevronDown } from 'lucide-react';
import API from '../../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '../../components/Loader';

const TransportFees = () => {
    const [summary, setSummary] = useState(null);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const navigate = useNavigate();

    const [activeSession, setActiveSession] = useState(null);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                if (!activeSession) {
                    const sessionRes = await API.get('/users/general/session-info');
                    setActiveSession(sessionRes.data.activeSession);
                    setAvailableSessions(sessionRes.data.allAvailableSessions);

                    const { data } = await API.get(`/fees/transport-summary?session=${sessionRes.data.activeSession}`);
                    setSummary(data);
                } else {
                    const { data } = await API.get(`/fees/transport-summary?session=${activeSession}`);
                    setSummary(data);
                }
            } catch (err) { console.error("Transport Summary Load Error"); }
        };
        fetchSummary();
    }, [activeSession]);

    if (!summary) return <Loader />;

    const finalOutstanding = summary?.grandTotal || 0;
    const isFeesDone = finalOutstanding <= 0;
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const deadlineStr = nextMonth.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const advanceMoney = summary?.advanceBalance || 0;

    const downloadReceipt = async (paymentId) => {
        try {
            const { data: p } = await API.get(`/fees/receipt/${paymentId}`);
            const doc = new jsPDF();

            // --- HEADER DESIGN ---
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 45, 'F');
            doc.setTextColor(245, 158, 11); // Amber Color for Transport
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text(p.schoolId?.schoolName?.toUpperCase() || "EDUFLOWAI INSTITUTION", 105, 20, { align: "center" });

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("OFFICIAL TRANSPORT FEE RECEIPT", 105, 30, { align: "center" });
            doc.text(`${p.schoolId?.address || 'Digital Campus'}`, 105, 36, { align: "center" });

            // --- RECEIPT METADATA ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Receipt ID: #REC-${p._id.slice(-6).toUpperCase()}`, 15, 60);
            doc.text(`Date: ${new Date(p.date).toLocaleDateString('en-GB')}`, 160, 60);

            // --- DATA TABLE ---
            autoTable(doc, {
                startY: 70,
                head: [['FIELD', 'STUDENT INFORMATION']],
                body: [
                    ['STUDENT NAME', p.student?.name || 'N/A'],
                    ['ENROLLMENT NO', p.student?.enrollmentNo || 'N/A'],
                    ['GRADE/CLASS', p.student?.grade || 'N/A'],
                    ['FEE COMPONENT', p.displayPurpose || p.feeCategory || 'Transport Fees'],
                    ['TRANSPORT ROUTE', p.remarks || 'N/A'],
                    ['PAYMENT MODE', p.paymentMode || 'N/A'],
                    ['BILLING MONTH', `${p.month} ${p.year}`]
                ],
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 5 },
            });

            // --- FINAL TOTAL ---
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setDrawColor(245, 158, 11);
            doc.setLineWidth(1);
            doc.line(15, finalY, 195, finalY);

            doc.setFontSize(16);
            doc.text(`TOTAL PAID: INR ${p.amountPaid.toLocaleString()}/-`, 15, finalY + 15);

            // --- FOOTER ---
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.setFont("helvetica", "italic");
            doc.text("This is a system-generated secure document. No physical signature is required.", 105, 280, { align: "center" });
            doc.text("© EduFlowAI Transport Network", 105, 285, { align: "center" });

            doc.save(`Transport_Receipt_${p._id.slice(-6)}.pdf`);
        } catch (err) {
            console.error("PDF Download Error:", err);
            alert("System could not generate PDF. Please check network.");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {/* Header: Amber/Yellow Theme for Transport */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-32 rounded-b-[3.5rem] shadow-lg relative">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50 rounded-b-[3.5rem] z-0"></div>

                <div className="flex justify-between items-center relative z-30">
                    <button onClick={() => navigate(-1)} className="bg-white/20 p-2.5 rounded-2xl active:scale-90 border border-white/10 text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex flex-col items-center z-50">
                        <h1 className="text-4xl font-black italic tracking-tight capitalize">Transport Fees</h1>

                        {/* 🔥 PREMIUM GLASS DROPDOWN 🔥 */}
                        <div className="relative mt-2">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 border border-white/30 rounded-2xl backdrop-blur-sm active:scale-95 transition-all shadow-md"
                            >
                                <History size={14} className="text-white" />
                                <span className="text-[13px] font-black tracking-widest text-white">{activeSession || 'Loading...'}</span>
                                <ChevronDown size={14} className={`text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <>
                                        {/* Invisible overlay taaki bahaar click pe close ho jaye */}
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>

                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full mt-2 w-full min-w-[140px] left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-blue-50 overflow-hidden z-50"
                                        >
                                            <div className="max-h-[150px] overflow-y-auto custom-scrollbar p-1">
                                                {availableSessions.map((session) => (
                                                    <div
                                                        key={session}
                                                        onClick={() => {
                                                            setActiveSession(session);
                                                            setIsDropdownOpen(false);
                                                            setSummary(null); // Pura reload feel aayega
                                                        }}
                                                        className={`px-4 py-3 m-1 rounded-xl text-center cursor-pointer text-[13px] font-black italic transition-all ${activeSession === session ? 'bg-[#42A5F5] text-white shadow-md' : 'text-slate-600 hover:bg-blue-50'}`}
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
                    <div className="bg-white/20 p-2.5 rounded-2xl border border-white/10 text-white">
                        <Bus size={24} />
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-16 relative z-20 space-y-6">

                {/* --- ROUTE & STOP DETAILS BOX --- */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-lg flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Pick/Drop Location</p>
                            <p className="text-[18px] font-black text-slate-800 capitalize leading-tight">{summary.stopName}</p>
                            <p className="text-[13px] font-bold text-slate-500 mt-1">{summary.routeName}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Monthly</p>
                        <p className="text-[20px] font-black text-[#42A5F5]">₹{summary.monthlyRate}</p>
                    </div>
                </div>

                {/* --- BALANCE BOX --- */}
                <div className="bg-white p-8 rounded-[3rem] border border-[#DDE3EA] shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[18px] font-black text-slate-400 uppercase tracking-widest italic">
                                Total Pending Dues
                            </p>
                            <h2 className={`text-5xl font-black tracking-tighter mt-1 ${finalOutstanding > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                ₹{finalOutstanding.toLocaleString()}
                            </h2>
                        </div>
                        <div className={`p-4 rounded-2xl ${finalOutstanding > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            <Calendar size={28} />
                        </div>
                    </div>
                    <p className="text-[14px] font-bold text-slate-600 italic">
                        {finalOutstanding > 0 ? "Includes 15th-day rule auto calculation." : "Transport account is fully settled."}
                    </p>
                </div>

                {/* --- ADVANCE BALANCE BOX --- */}
                {advanceMoney > 0 && (
                    <div className="mt-4 bg-emerald-500 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl">
                        <div>
                            <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-80">Surplus Advance</p>
                            <p className="text-2xl font-black italic">₹{advanceMoney.toLocaleString()}</p>
                        </div>
                        <CheckCircle size={30} className="opacity-50" />
                    </div>
                )}

                {/* --- PAY NOW ACTION --- */}
                {finalOutstanding > 0 && (
                    <div className="mt-4">
                        {summary.pendingSignal ? (
                            <button className="w-full py-5 bg-[#42A5F5] text-white rounded-[2rem] text-[15px] font-black flex items-center justify-center gap-3 shadow-lg cursor-not-allowed">
                                <Zap size={18} className="animate-pulse" />
                                Payment in Verification 📡
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/student/checkout', { state: { feeType: 'Transport' } })}
                                className="w-full py-5 bg-rose-600 text-white rounded-[2rem] text-[15px] font-black shadow-xl hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Pay Transport Fees: ₹{finalOutstanding.toLocaleString()} <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* --- LEDGER HISTORY --- */}
                <div className="bg-white rounded-[3rem] border border-[#DDE3EA] overflow-hidden shadow-lg mt-8 mb-10">
                    <div className="flex justify-center mb-4 pt-6">
                        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-md rounded-2xl border border-slate-200">
                            <h3 className="text-[18px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                Transport Receipts
                            </h3>
                        </div>
                    </div>
                    <div className="p-6">
                        {summary.paymentHistory && Object.keys(summary.paymentHistory).length > 0 ? (
                            Object.entries(summary.paymentHistory).map(([monthYear, records]) => (
                                <div key={monthYear} className="space-y-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[14px] font-black text-[#42A5F5] uppercase tracking-widest">{monthYear}</span>
                                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                                    </div>
                                    {records.map((pay, idx) => (
                                        <div key={idx} className="bg-white p-5 rounded-[2.5rem] border border-[#DDE3EA] flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-[#42A5F5]  rounded-2xl">
                                                    <Bus size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[16px] font-black text-slate-800 capitalize leading-tight">{pay.category.toLowerCase()}</p>
                                                    <p className="text-[13px] font-bold text-slate-400">{new Date(pay.date).toLocaleDateString('en-GB')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <p className="text-[16px] font-black text-emerald-600">₹{pay.amount.toLocaleString()}</p>
                                                <button
                                                    onClick={() => downloadReceipt(pay.id)}
                                                    className="flex items-center gap-1.5 text-[14px] font-black text-[#42A5F5] uppercase tracking-tighter opacity-60 hover:opacity-100 transition-opacity"
                                                >
                                                    <Download size={15} /> Get slip
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        ) : (
                            <div className="py-16 text-center flex flex-col items-center opacity-40">
                                <Bus size={48} className="text-slate-300 mb-4" />
                                <p className="text-[15px] font-bold text-slate-400 italic">No transport payments yet</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TransportFees;
import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Clock, CheckCircle, AlertCircle, TrendingUp, ArrowLeft, Download, ChevronDown, X, Zap } from 'lucide-react';
import API from '../../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Direct function import karein
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../../components/Loader';

const StudentFees = () => {
    const [summary, setSummary] = useState(null);
    const [showPendingModal, setShowPendingModal] = useState(false); // Modal control ke liye
    const navigate = useNavigate();
    // STATE add karo top pe
    const [showAllFees, setShowAllFees] = useState(false);
    const [selectedYear, setSelectedYear] = useState('All');

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await API.get('/fees/student-summary');
                // console.log("🔥 API Response Data:", data); // <--- YAHAN LAGA!
                setSummary(data);
            } catch (err) { console.error("Summary Load Error"); }
        };
        fetchSummary();
    }, []);
    const downloadReceipt = async (paymentId) => {
        try {
            const { data: p } = await API.get(`/fees/receipt/${paymentId}`);
            const doc = new jsPDF();

            // --- HEADER DESIGN ---
            doc.setFillColor(15, 23, 42); // Void Dark Theme Color
            doc.rect(0, 0, 210, 45, 'F');

            doc.setTextColor(34, 211, 238); // Neon Cyan
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text(p.schoolId?.schoolName?.toUpperCase() || "EDUFLOWAI INSTITUTION", 105, 20, { align: "center" });

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("OFFICIAL DIGITAL FEE RECEIPT", 105, 30, { align: "center" });
            doc.text(`${p.schoolId?.address || 'Digital Campus, Cloud Network'}`, 105, 36, { align: "center" });

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
                    ['FEE COMPONENT', p.feeCategory || 'General Fees'], // Ye naya add kiya
                    ['FATHER NAME', p.student?.fatherName || 'N/A'],
                    ['PAYMENT MODE', p.paymentMode || 'N/A'],
                    ['BILLING MONTH', `${p.month} ${p.year}`]
                ],
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], textColor: [34, 211, 238], fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 5 },
            });

            // --- FINAL TOTAL ---
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setDrawColor(34, 211, 238);
            doc.setLineWidth(1);
            doc.line(15, finalY, 195, finalY);

            doc.setFontSize(16);
            doc.text(`TOTAL PAID: INR ${p.amountPaid.toLocaleString()}/-`, 15, finalY + 15);

            // --- FOOTER ---
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.setFont("helvetica", "italic");
            doc.text("This is a system-generated secure document. No physical signature is required.", 105, 280, { align: "center" });
            doc.text("© EduFlowAI Finance Neural Network", 105, 285, { align: "center" });

            doc.save(`Receipt_${p._id.slice(-6)}.pdf`);
        } catch (err) {
            console.error("PDF Download Error:", err);
            alert("Bypass Error: System could not generate PDF. Please check network.");
        }
    };
    // --- StudentFees.jsx variables fix ---
    if (!summary) return <Loader />;

    const currentMonthPaid = summary?.totalPaidThisMonth || 0;
    const finalOutstanding = summary?.grandTotal || 0; // Backend (26000) seedha yahan aayega
    const advanceMoney = summary?.advanceBalance || 0;
    // const totalPenalty = summary?.totalPenalty || 0;
    const totalExpectedAll = summary?.totalFeesStructure || 0;
    const structureTotal = summary?.totalFeesStructure || 0;

    const isFeesDone = finalOutstanding <= 0;
    const statusText = isFeesDone ? "FEES COMPLETED" : "PAYMENT REQUIRED";
    const lastDate = summary?.lastActivity ? new Date(summary.lastActivity).toLocaleDateString('en-GB') : "NO ACTIVITY";
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const deadlineStr = nextMonth.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        // ... tera UI code
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">

            {/* --- DAY 132: MODAL FOR PENDING SCREENSHOT PREVIEW --- */}
            <AnimatePresence>
                {showPendingModal && summary.pendingSignal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-md rounded-[3rem] border border-[#DDE3EA] overflow-hidden shadow-2xl relative">
                            <button onClick={() => setShowPendingModal(false)} className="absolute top-6 right-6 z-10 p-2 bg-slate-100 rounded-full hover:bg-rose-500 hover:text-white transition-all"><X size={18} /></button>
                            <div className="p-8 space-y-6">
                                <h3 className="text-[18px] font-black text-amber-600 flex items-center gap-2 capitalize"><Clock size={20} /> Verification pending</h3>
                                <div className="aspect-[3/4] w-full bg-slate-100 rounded-3xl overflow-hidden border border-[#DDE3EA]">
                                    <img src={`http://localhost:5000${summary.pendingSignal.screenshot}`} className="w-full h-full object-contain" alt="Evidence" />
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl space-y-2 border border-[#DDE3EA]">
                                    <div className="flex justify-between text-[13px] font-bold capitalize"><span className="opacity-50">Amount sent:</span><span className="text-[#42A5F5]">₹{summary.pendingSignal.amount.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-[13px] font-bold capitalize"><span className="opacity-50">Status:</span><span className="text-amber-600">Awaiting approval</span></div>
                                </div>
                                {/* <p className="text-[8px] text-white/20 text-center uppercase font-black tracking-widest">Payment Submitted • Waiting for Approval</p> */}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Header: Blue Theme */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-32 rounded-b-[3.5rem] shadow-lg relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

                {/* Header Row */}
                <div className="flex justify-between items-center relative z-10">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white/20 p-2.5 rounded-2xl active:scale-90 border border-white/10 text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Center Title */}
                    <div className="flex flex-col items-center">
                        <h1 className="text-5xl font-black italic tracking-tight capitalize">
                            My Fees
                        </h1>
                        <p className="text-[17px] font-bold text-white/80 tracking-widest mt-1 capitalize">
                            Payment Details
                        </p>
                    </div>

                    {/* Right Icon */}
                    <div className="bg-white/20 p-2.5 rounded-2xl border border-white/10 text-white">
                        <CreditCard size={24} />
                    </div>
                </div>

            </div>

            <div className="px-5 -mt-16 relative z-20 space-y-6">
                {/* Main Balance Card */}
                {/* Main Balance Card */}
                {/* --- UPGRADED BALANCE CARDS (SAFE VERSION) --- */}
                <div className="space-y-4">
                    {/* Monthly Fees Status Box */}
                    <div className="bg-white p-8 rounded-[3rem] border border-[#DDE3EA] shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[18px] font-black text-slate-400 uppercase tracking-widest italic">
                                    {summary?.currentMonth || 'Current Month'} & Backlog Dues
                                </p>
                                <h2 className={`text-5xl font-black tracking-tighter mt-1 ${(summary?.monthlyOutstanding ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    ₹{(summary?.monthlyOutstanding ?? 0).toLocaleString()}
                                </h2>
                            </div>
                            <div className={`p-4 rounded-2xl ${(summary?.monthlyOutstanding ?? 0) > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                <Calendar size={28} />
                            </div>
                        </div>
                        <p className="text-[14px] font-bold text-slate-600 italic">
                            {(summary?.monthlyOutstanding ?? 0) > 0
                                ? "Includes current month + any unpaid previous months."
                                : "Monthly fees is fully up to date."}
                        </p>
                    </div>

                    {/* One-Time Fees Status Box */}
                    <div className="bg-white p-8 rounded-[3rem] border border-[#DDE3EA] shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[18px] font-black text-slate-400 uppercase tracking-widest italic">
                                    One-Time Yearly Charges
                                </p>
                                <h2 className={`text-5xl font-black tracking-tighter mt-1 ${(summary?.oneTimeOutstanding ?? 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    ₹{(summary?.oneTimeOutstanding ?? 0).toLocaleString()}
                                </h2>
                            </div>
                            <div className={`p-4 rounded-2xl ${(summary?.oneTimeOutstanding ?? 0) > 0 ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                <Zap size={28} />
                            </div>
                        </div>
                        <p className="text-[14px] font-bold text-slate-600 italic">
                            {(summary?.oneTimeOutstanding ?? 0) > 0
                                ? "Fixed annual charges pending for this academic year."
                                : "One-time charges cleared/Zero balance."}
                        </p>
                    </div>

                    {/* Advance Credit (Only shows if balance is negative) */}
                    {(summary?.advanceBalance ?? 0) > 0 && (
                        <div className="bg-emerald-500 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl">
                            <div>
                                <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-80">Surplus Credit</p>
                                <p className="text-2xl font-black italic">₹{(summary?.advanceBalance ?? 0).toLocaleString()}</p>
                            </div>
                            <CheckCircle size={30} className="opacity-50" />
                        </div>
                    )}
                </div>
                {/* --- STATS GRID: MONTHLY FOCUS --- */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] text-center shadow-sm">
                        <TrendingUp size={24} className="text-[#42A5F5] mx-auto mb-2 opacity-50" />
                        <p className="text-[15px] font-bold text-slate-400 capitalize">Paid for {summary?.currentMonth}</p>
                        <p className="text-[15px] font-black text-slate-700">₹{currentMonthPaid.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] text-center shadow-sm">
                        <Calendar size={24} className="text-slate-400 mx-auto mb-2 opacity-50" />
                        <p className="text-[15px] font-bold text-slate-400 capitalize">Fee Structure</p>
                        <p className="text-[15px] font-black text-slate-700">₹{structureTotal.toLocaleString()}</p>
                    </div>
                </div>

                {/* --- TIMELINE INFO: DYNAMIC DEADLINE --- */}
                <div className="bg-[#42A5F5] p-6 rounded-[2.5rem] text-white flex justify-between shadow-lg">
                    <div>
                        <p className="text-[15px] font-bold opacity-60 uppercase tracking-widest mb-1">Next Deadline</p>
                        <p className="text-[14px] font-black capitalize">
                            {isFeesDone ? 'NEXT CYCLE: ' : ''} {deadlineStr}
                        </p>
                    </div>
                    <div className="text-right border-l border-white/20 pl-6">
                        <p className="text-[15px] font-bold opacity-60 uppercase tracking-widest mb-1">Last activity</p>
                        <p className="text-[14px] font-black">{lastDate}</p>
                    </div>
                </div>
                {finalOutstanding > 0 && (
                    <div className="bg-white border-2 border-rose-100 p-8 rounded-[3rem] shadow-lg space-y-6 relative overflow-hidden group mt-6">
                        <div className="flex items-start gap-4">
                            <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                <CreditCard size={120} />
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="text-[17px] font-black text-slate-800 capitalize italic mb-1">
                                    Balance Adjustment Required
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-[15px] font-bold text-slate-500 leading-relaxed italic">
                                        Current monthly fees: <span className="text-slate-800 font-black">₹{(summary?.monthlyOutstanding ?? 0).toLocaleString()}</span>
                                    </p>
                                    {/* {totalPenalty > 0 && (
                                        <p className="text-[15px] font-bold text-rose-400 italic">
                                            Late fee penalty: <span className="font-black">₹{totalPenalty.toLocaleString()}</span>
                                        </p>
                                    )} */}
                                </div>
                            </div>
                        </div>

                        {/* --- SMART BUTTON LOGIC --- */}
                        <div className="relative z-10 pt-2">
                            {summary.pendingSignal ? (
                                /* PENDING BUTTON (Jab screenshot bhej diya ho) */
                                <button
                                    onClick={() => setShowPendingModal(true)}
                                    className="w-full py-5 bg-amber-500 text-white rounded-[2rem] text-[15px] font-black flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
                                >
                                    <Zap size={18} fill="white" className="animate-pulse" />
                                    Verification pending: ₹{summary.pendingSignal.amount.toLocaleString()} 📡
                                </button>
                            ) : (
                                /* RESOLVE BUTTON (Pay karne ke liye) */
                                <button
                                    onClick={() => navigate('/student/checkout')}
                                    className="w-full py-5 bg-rose-600 text-white rounded-[2rem] text-[15px] font-black shadow-xl hover:bg-rose-700 active:scale-95 transition-all capitalize"
                                >
                                    Resolve Total Balance Now⚡: ₹{finalOutstanding.toLocaleString()} ⚡
                                </button>
                            )}
                        </div>
                        <p className="text-center text-[12px] font-bold text-slate-300 uppercase tracking-[0.2em] relative z-10">
                            Secure Connection⚡
                        </p>
                    </div>
                )}

                {/* --- UPGRADED: SPLIT FEE STRUCTURE CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* Monthly Recurring Fees Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#42A5F5]/10 rounded-2xl text-[#42A5F5]"><Clock size={20} /></div>
                            <h3 className="text-[19px] font-black text-slate-700 uppercase italic">Monthly Fees</h3>
                        </div>
                        {summary.feeStructureDetails?.monthly.length > 0 ? summary.feeStructureDetails.monthly.map((item, index) => (
                            <div key={index} className="flex justify-between py-4 border-b border-slate-50 last:border-none">
                                <span className="text-[16px] font-bold text-slate-600 capitalize">{item.label}</span>
                                <span className="text-[16px] font-black text-slate-800">₹{item.amount.toLocaleString()}</span>
                            </div>
                        )) : <p className="text-slate-400 font-bold italic">No monthly fees</p>}
                    </div>

                    {/* One-Time Charges Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Zap size={20} /></div>
                            <h3 className="text-[19px] font-black text-slate-700 uppercase italic">One-Time Charges</h3>
                        </div>
                        {summary.feeStructureDetails?.oneTime.length > 0 ? summary.feeStructureDetails.oneTime.map((item, index) => (
                            <div key={index} className="flex justify-between py-4 border-b border-slate-50 last:border-none">
                                <span className="text-[16px] font-bold text-slate-600 capitalize">{item.label}</span>
                                <span className="text-[16px] font-black text-slate-800">₹{item.amount.toLocaleString()}</span>
                            </div>
                        )) : <p className="text-slate-400 font-bold italic">No one-time charges</p>}
                    </div>
                </div>

                {/* Spacer for better layout */}
                {/* <div className="h-10"></div> */}

                {/* --- UPGRADED MONTHLY GROUPED HISTORY --- */}
                <div className="bg-white rounded-[3rem] border border-[#DDE3EA] overflow-hidden shadow-lg mt-8 mb-10">
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-md rounded-2xl border border-slate-200">

                            {/* <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                                <CheckCircle size={18} />
                            </div> */}

                            <h3 className="text-[20px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                All transactions
                            </h3>
                        </div>
                    </div>

                    <div className="p-6 space-y-12">
                        {summary.paymentHistory && Object.keys(summary.paymentHistory).length > 0 ? (
                            Object.entries(summary.paymentHistory).map(([monthYear, records]) => (
                                <div key={monthYear} className="space-y-5">
                                    {/* Month Divider Label */}
                                    <div className="flex items-center gap-4 px-2">
                                        <span className="text-[15px] font-black text-[#42A5F5] uppercase tracking-widest whitespace-nowrap">
                                            {monthYear}
                                        </span>
                                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                                    </div>

                                    {/* Inside each month box */}
                                    <div className="grid gap-4">
                                        {records.map((pay, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-[2.5rem] border border-[#DDE3EA] flex justify-between items-center group active:scale-[0.98] transition-all shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    {/* Icon Sync with blue theme */}
                                                    <div className="p-3 bg-blue-50 text-[#42A5F5] rounded-2xl group-hover:bg-[#42A5F5] group-hover:text-white transition-colors">
                                                        <TrendingUp size={20} />
                                                    </div>
                                                    {/* StudentFees.jsx mein mapping ke andar */}
                                                    <div>
                                                        {/* Category: Sentence Case & 15px */}
                                                        <p className="text-[16px] font-black text-slate-800 capitalize leading-tight mb-0.5">
                                                            {pay.category?.toLowerCase() || "General fee payment"}
                                                        </p>
                                                        {/* Date & Mode: 12px light */}
                                                        <p className="text-[14px] font-medium text-slate-400 capitalize">
                                                            {new Date(pay.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {pay.mode?.toLowerCase()} mode
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <p className="text-[16px] font-black text-emerald-600 italic">
                                                        ₹{pay.amount.toLocaleString()}
                                                    </p>
                                                    <button
                                                        onClick={() => downloadReceipt(pay.id)}
                                                        className="flex items-center gap-1.5 text-[15px] font-black text-[#42A5F5] uppercase tracking-tighter opacity-60 hover:opacity-100 transition-opacity"
                                                    >
                                                        <Download size={15} /> Get slip
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center flex flex-col items-center opacity-40">
                                <Clock size={48} className="text-slate-200 mb-4" />
                                <p className="text-[15px] font-bold text-slate-400 italic capitalize">
                                    No payment records found in ledger
                                </p>
                            </div>
                        )}
                        <div className="mt-12 p-10 bg-gradient-to-br from-[#42A5F5] to-blue-600 rounded-[3rem] shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                <CreditCard size={120} color="white" />
                            </div>
                            <div className="relative z-10 text-white">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1">Security assured</p>
                                <h4 className="text-[18px] font-black italic capitalize">End-to-end encrypted billing</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

const Layers = ({ size, className }) => <div className={className}><CreditCard size={size} /></div>;

export default StudentFees;
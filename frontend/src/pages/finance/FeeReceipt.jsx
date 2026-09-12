import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Phone, MapPin, CheckCircle, Bus, FileText, CheckCircle2,User } from 'lucide-react';
import API from '../../api';
import Loader from '../../components/Loader';

const FeeReceipt = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [receipt, setReceipt] = useState(null);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const { data } = await API.get(`/fees/receipt/${id}`);
                setReceipt(data);
            } catch (err) {
                console.error("Receipt load error");
            }
        };
        fetchReceipt();
    }, [id]);

    const handlePrint = () => { window.print(); };

    if (!receipt) return <Loader />;

    const isTransport = receipt.feeType === 'Transport' || (receipt.remarks && receipt.remarks.includes('TRANSPORT'));

    // 🔥 THE FIX: Contact Number Logic (From LocalStorage just like BottomNav) 🔥
    const localUser = JSON.parse(localStorage.getItem('user')) || {};
    const fallbackContact = localUser.schoolData?.adminDetails?.mobile || "+91 98765-43210";
    const finalContact = receipt.schoolId?.adminDetails?.mobile || receipt.schoolId?.schoolContact || receipt.displayContact || fallbackContact;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">

            {/* Header Actions - Hidden during Print */}
            <div className="flex justify-between items-center mb-8 print:hidden max-w-2xl mx-auto mt-4 px-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white rounded-2xl border border-slate-300 shadow-md active:scale-90 transition-all text-slate-800 hover:bg-slate-50"
                >
                    <ArrowLeft size={24} />
                </button>
                <button
                    onClick={handlePrint}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[14px] uppercase flex items-center gap-3 hover:bg-black transition-all active:scale-95 shadow-lg"
                >
                    <Printer size={18} /> Print official receipt
                </button>
            </div>

            {/* 🔥 BLACK & WHITE RECEIPT PAPER DESIGN 🔥 */}
            <div className="bg-white p-10 md:p-12 rounded-[2rem] shadow-2xl max-w-2xl mx-auto border border-slate-300 relative overflow-hidden print:shadow-none print:border-none print:p-8 print:rounded-none">
                
                {/* WATERMARK */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] print:opacity-[0.04] text-black">
                    {isTransport ? <Bus size={400} /> : <FileText size={400} />}
                </div>

                {/* TOP BORDER ACCENT (Grayscale) */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-slate-900 print:bg-black"></div>

                {/* --- 1. SCHOOL HEADER --- */}
                <div className="text-center border-b-2 border-dashed border-slate-300 pb-8 mb-8 relative z-10 mt-2">
                    <h1 className="text-3xl font-black text-black tracking-tight leading-tight uppercase mb-3">
                        {receipt.schoolId?.schoolName || "EDUFLOWAI INSTITUTION"}
                    </h1>
                    <div className="flex flex-col items-center gap-1.5 text-[12px] font-bold text-slate-600 tracking-widest uppercase">
                        <span className="flex items-center gap-2">
                            <MapPin size={14} className="text-black" /> {receipt.schoolId?.schoolAddress || "Digital Campus"}
                        </span>
                        <span className="flex items-center gap-2">
                            {/* 🔥 FIXED CONTACT NUMBER 🔥 */}
                            <Phone size={14} className="text-black" /> Contact: {finalContact}
                        </span>
                    </div>
                </div>

                {/* --- 2. RECEIPT META DATA --- */}
                <div className="flex justify-between items-end mb-10 relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Receipt No.</p>
                        <p className="text-[16px] font-black font-mono uppercase tracking-wider text-black">
                            #REC-{receipt._id.slice(-8)}
                        </p>
                    </div>
                    
                    {/* 🔥 B&W PAID STAMP 🔥 */}
                    <div className="border-[3px] border-slate-800 text-slate-800 rounded-xl px-6 py-2 rotate-12 opacity-80 print:opacity-100 shadow-sm print:border-black print:text-black">
                        <p className="text-3xl font-black uppercase tracking-[0.2em] italic">Paid</p>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Date Issued</p>
                        <p className="text-[16px] font-black text-black font-mono">
                            {new Date(receipt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* --- 3. STUDENT INFO --- */}
                <div className="bg-slate-50 p-6 rounded-[1.5rem] mb-10 border border-slate-200 relative z-10 print:border-black/20">
                    <h3 className="text-[12px] font-black uppercase mb-4 tracking-widest text-black flex items-center gap-2">
                        <User size={14} /> Student Details
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</p>
                            <p className="text-[16px] font-black text-black mt-0.5 uppercase">{receipt.student?.name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Class / Grade</p>
                            <p className="text-[16px] font-black text-black mt-0.5 uppercase">{receipt.student?.grade}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enrollment No.</p>
                            <p className="text-[14px] font-black text-black mt-0.5 uppercase tracking-wider font-mono">{receipt.student?.enrollmentNo || "N/A"}</p>
                        </div>
                    </div>
                </div>

                {/* --- 4. FEE DETAILS TABLE --- */}
                <div className="mb-10 relative z-10 border border-slate-300 rounded-[1.5rem] overflow-hidden print:border-black/30">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b border-slate-300 print:bg-slate-50 print:border-black/30">
                            <tr>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Description</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-6 px-6">
                                    <p className="text-[15px] font-black text-black uppercase italic flex items-center gap-2">
                                        {isTransport && <Bus size={16} className="text-black" />}
                                        {receipt.displayPurpose || receipt.feeCategory || "General Fees"}
                                    </p>

                                    {/* TRANSPORT ROUTE BADGE (Grayscale) */}
                                    {isTransport && receipt.remarks && (
                                        <div className="mt-2 mb-1 inline-block bg-slate-100 border border-slate-300 text-slate-800 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest print:border-black/40">
                                            {receipt.remarks}
                                        </div>
                                    )}

                                    <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                                        Cycle: {receipt.month} {receipt.year}
                                    </p>
                                </td>
                                <td className="py-6 px-6 text-right font-black text-2xl text-black tracking-tight align-top">
                                    ₹{receipt.amountPaid.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* --- 5. TOTAL & SUMMARY (B&W) --- */}
                <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2rem] text-white shadow-lg relative z-10 print:bg-black print:shadow-none">
                    <div className="space-y-2">
                        <div className="bg-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-fit text-black">
                            <CheckCircle2 size={12} /> Verified
                        </div>
                        <p className="text-[11px] font-bold text-white/90 uppercase tracking-widest italic pt-1">
                            Mode: {receipt.paymentMode}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Paid</p>
                        <p className="text-4xl font-black tracking-tight italic text-white">₹{receipt.amountPaid.toLocaleString()}</p>
                    </div>
                </div>

                {/* --- 6. FOOTER --- */}
                <div className="mt-12 text-center relative z-10 border-t-2 border-dashed border-slate-300 pt-8 print:border-black/30">
                    <p className="text-[11px] font-bold text-slate-500 uppercase italic tracking-widest leading-relaxed print:text-black/70">
                        This is a system generated secure digital receipt.<br />
                        © EduFlowAI Finance Network • No physical signature required.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FeeReceipt;
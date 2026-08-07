import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Phone, MapPin, CheckCircle } from 'lucide-react';
import API from '../../api';
import Loader from '../../components/Loader';

const FeeReceipt = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [receipt, setReceipt] = useState(null);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                // 🔥 FIX 1: API Route '/fees/receipt/' hota hai, '/users/finance/' nahi 🔥
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">

            {/* Header Actions - Hidden during Print */}
            <div className="flex justify-between items-center mb-8 print:hidden max-w-2xl mx-auto mt-4 px-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white rounded-2xl border border-[#DDE3EA] text-[#42A5F5] shadow-md active:scale-90 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <button
                    onClick={handlePrint}
                    className="bg-[#42A5F5] text-white px-8 py-3 rounded-2xl font-black text-[14px] uppercase flex items-center gap-3 hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-100"
                >
                    <Printer size={18} /> Print official receipt
                </button>
            </div>

            {/* Receipt Paper Design */}
            <div className="bg-white p-10 rounded-[3rem] shadow-xl max-w-2xl mx-auto border-t-[12px] border-[#42A5F5] print:shadow-none print:border-none print:p-8">

                {/* --- 1. SCHOOL HEADER --- */}
                <div className="text-center border-b border-slate-100 pb-10 mb-10">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight uppercase mb-4">
                        {/* 🔥 FIX 2: Backend ke real fields map kiye hain 🔥 */}
                        {receipt.schoolId?.schoolName || "EDUFLOWAI INSTITUTION"}
                    </h1>
                    <div className="flex flex-col items-center gap-2 text-[13px] font-bold text-slate-900 tracking-wide">
                        <span className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#42A5F5]" /> {receipt.schoolId?.schoolAddress || "Digital Campus"}
                        </span>
                        <span className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-800" /> Contact: {receipt.schoolId?.schoolContact || "N/A"}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between mb-12 px-2">
                    <div>
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Receipt number</p>
                        <div className="inline-block bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl mt-1">
                            <p className="text-[16px] font-bold font-mono text-slate-700">
                                #REC-{receipt._id.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Date issued</p>
                        <div className="inline-block bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl mt-1">
                            <p className="text-[16px] font-bold font-mono text-slate-700">
                                {/* 🔥 FIX 3: Real date formatting 🔥 */}
                                {new Date(receipt.date).toLocaleDateString('en-GB')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Student Details Section */}
                <div className="bg-slate-50 p-8 rounded-[2.5rem] mb-12 border border-slate-100">
                    <h3 className="text-[15px] font-black text-[#42A5F5] uppercase mb-6 tracking-widest">Student Information :</h3>
                    <div className="grid grid-cols-2 gap-10">
                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Student name</p>
                            <p className="text-[18px] font-black text-slate-800 mt-1 uppercase">{receipt.student?.name}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Class / Grade</p>
                            {/* 🔥 Backend apne aap yahan 9-A bhejega agar pichle saal ka receipt hai 🔥 */}
                            <p className="text-[18px] font-black text-slate-800 mt-1 uppercase">{receipt.student?.grade}</p>
                        </div>
                        {receipt.student?.enrollmentNo && (
                            <div className="col-span-2 border-t border-slate-200/50 pt-6">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Enrollment no.</p>
                                <p className="text-[16px] font-bold text-slate-600 mt-1 uppercase tracking-wider">{receipt.student?.enrollmentNo}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fee Table */}
                <div className="px-2 mb-12">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-50 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="text-left py-6">Description</th>
                                <th className="text-right py-6">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-8">
                                    <p className="text-[16px] font-black text-slate-800 uppercase italic">
                                        {/* 🔥 FIX 4: Real purpose mapping 🔥 */}
                                        {receipt.feeCategory || "General Fees"}
                                    </p>
                                    <p className="text-[13px] font-bold text-slate-400 mt-2">
                                        Billing cycle: {receipt.month} {receipt.year}
                                    </p>
                                </td>
                                <td className="py-8 text-right font-black text-2xl text-slate-800 tracking-tight">
                                    ₹{receipt.amountPaid.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Total Section */}
                <div className="flex justify-between items-center bg-[#42A5F5] p-10 rounded-[3rem] text-white shadow-lg shadow-blue-100">
                    <div className="space-y-3">
                        <div className="bg-white text-[#42A5F5] px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 w-fit">
                            <CheckCircle size={12} /> Verified transaction
                        </div>
                        <p className="text-[12px] font-bold text-white/80 uppercase tracking-widest italic pt-1">
                            Mode: {receipt.paymentMode}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-black text-white/60 uppercase tracking-widest mb-1">Total amount paid</p>
                        <p className="text-5xl font-black tracking-tight italic">₹{receipt.amountPaid.toLocaleString()}</p>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-16 text-center">
                    <div className="h-[2px] w-24 bg-slate-100 mx-auto mb-8 rounded-full"></div>
                    <p className="text-[13px] font-bold text-slate-700 uppercase italic tracking-widest leading-relaxed">
                        This is a system generated secure digital receipt.<br />
                        © EduFlowAI Finance Neural Network • No physical signature required.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FeeReceipt;
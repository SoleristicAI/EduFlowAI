import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, School, User, Hash, BookOpen, CreditCard, ChevronRight, Phone, Mail } from 'lucide-react';
import API from '../../api';
import Loader from '../../components/Loader';

const StudentCheckout = () => {
    const [summary, setSummary] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await API.get('/fees/student-summary');
                setSummary(data);
            } catch (err) { console.error("Checkout Load Error"); }
        };
        fetchSummary();
    }, []);

    if (!summary) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[3.5rem] shadow-lg relative z-10 overflow-hidden">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

                {/* Header Row */}
                <div className="flex justify-between items-center mb-6 relative z-10">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white/20 p-2.5 rounded-2xl active:scale-90 border border-white/10 text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Center Title */}
                    <div className="flex flex-col items-center">
                        <h1 className="text-4xl font-black italic tracking-tight capitalize text-center">
                            Online Payment
                        </h1>

                        <p className="text-[15px] font-bold text-white/80 tracking-widest mt-1 capitalize">
                            Secure Fee Transactions
                        </p>
                    </div>

                    {/* Right Icon */}
                    <div className="bg-white/20 p-2.5 rounded-2xl border border-white/10 text-white">
                        <CreditCard size={24} />
                    </div>
                </div>

            </div>

            <div className="px-5 -mt-10 space-y-6 max-w-2xl mx-auto relative z-20">
                {/* --- STUDENT IDENTITY CARD --- */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.09]"><User size={100} /></div>
                    <h2 className="text-[18px] font-bold text-slate-400 uppercase tracking-widest mb-6">Student identification</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-[#42A5F5]">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">Student name</p>
                                <p className="text-[15px] font-black text-slate-800 capitalize">{summary.studentName?.toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-[#42A5F5]">
                                <Hash size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">Enrollment</p>
                                <p className="text-[15px] font-black text-slate-800 uppercase">{summary.enrollmentNo}</p>
                            </div>
                        </div>
                        {/* NAYA: Father Name */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-[#42A5F5]">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">Father's name</p>
                                <p className="text-[15px] font-black text-slate-800 capitalize">{summary.fatherName?.toLowerCase() || 'not assigned'}</p>
                            </div>
                        </div>
                        {/* NAYA: Mobile Number */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-[#42A5F5]">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">Mobile number</p>
                                <p className="text-[15px] font-black text-slate-800">{summary.mobile || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- DAY 128: SCHOOL IDENTIFICATION CARD --- */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.09] text-[#42A5F5]"><School size={100} /></div>
                    <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <School size={16} /> School identification
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 border border-slate-100">
                                <School size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">School Name</p>
                                <p className="text-[15px] font-black text-slate-800 capitalize leading-tight">{summary.schoolName?.toLowerCase()}</p>
                            </div>
                        </div>

                        {/* Payment QR Number */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-[#42A5F5] border border-blue-100 animate-pulse">
                                <Hash size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">Online payment number</p>
                                <p className="text-[15px] font-black text-[#42A5F5] tracking-widest">{summary.schoolPhone}</p>
                            </div>
                        </div>

                        {/* Admin Name */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 border border-slate-100">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">Admin personnel</p>
                                <p className="text-[15px] font-black text-slate-800 capitalize">{summary.adminName?.toLowerCase()}</p>
                            </div>
                        </div>

                        {/* Admin Email */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 border border-slate-100">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">Admin email</p>
                                <p className="text-[15px] font-black text-slate-500 lowercase">{summary.adminEmail}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BILLING SUMMARY --- */}
                {/* --- BILLING SUMMARY --- */}
                <div className="bg-slate-800 p-8 rounded-[3rem] shadow-2xl border border-slate-700">
                    <h2 className="text-[18px] font-bold text-[#42A5F5] uppercase tracking-widest mb-6">Settlement summary</h2>

                    <div className="space-y-4">

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[16px] font-black text-white capitalize italic">Net payable amount</span>
                            <span className="text-3xl font-black text-[#42A5F5] tracking-tighter animate-pulse">
                                ₹{summary.grandTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- PAY NOW ACTION --- */}
                <button
                    onClick={() => navigate('/student/payment-methods')}
                    className="w-full py-6 bg-[#42A5F5] text-white rounded-[2.5rem] font-black uppercase tracking-widest text-[18px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-200 mb-10"
                >
                    <CreditCard size={20} />
                    Proceed to pay
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default StudentCheckout;
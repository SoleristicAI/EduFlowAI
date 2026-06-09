import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, History, Wallet, User as UserIcon, Calendar, Layers, Zap, CheckCircle } from 'lucide-react';
import API from '../../api';
import Loader from '../../components/Loader';

const StudentLedger = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                setLoading(true); // Fetch shuru hote hi loading ON
                const { data } = await API.get(`/fees/audit/${id}`);
                setAudit(data);
            } catch (err) {
                console.error("Ledger decrypt error");
            } finally {
                setLoading(false); // Data mil jaye ya error aaye, loading OFF
            }
        };
        fetchAudit();
    }, [id]);

    if (loading) return <Loader />;

    // StudentLedger.jsx mein ye variables update kar
    const finalRemaining = (audit?.monthlyOutstanding ?? 0) + (audit?.oneTimeOutstanding ?? 0);
    const isFeesDone = finalRemaining <= 0;
    const statusText = isFeesDone ? "Completed" : "Payment required";
    const structureTotal = audit?.totalExpected || 0;
    const advanceMoney = audit?.advance || 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 font-sans italic pb-24 text-[15px]">
            {/* Header */}
            <div className="flex items-center gap-5 mb-8 border-l-4 border-[#42A5F5] pl-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white rounded-2xl border border-[#DDE3EA] shadow-md hover:bg-blue-50 transition-all active:scale-90 group"
                >
                    <ArrowLeft size={24} className="text-[#42A5F5]" />
                </button>
                <h1 className="text-3xl font-black italic tracking-tight capitalize">Student fees records</h1>
            </div>

            {/* TOP STATUS BAR */}
            <div className={`p-8 rounded-[3rem] border shadow-sm mb-8 relative overflow-hidden ${isFeesDone ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex justify-between items-start relative z-10 text-left">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tight text-slate-800 capitalize mb-1">{audit.student.name}</h2>
                        <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">
                            Adm No: {audit.student.admissionNo || 'N/A'} Class: {audit.student.grade}
                        </p>
                    </div>
                    <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${isFeesDone ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                        {isFeesDone ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {statusText}
                    </div>
                </div>

                {/* --- UPDATED LEDGER STATUS SECTION --- */}
                <div className="space-y-4 mb-8">
                    {/* Box 1: Monthly Dues (Rose/Red) */}
                    <div className="bg-white p-8 rounded-[3rem] border border-[#DDE3EA] shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[18px] font-black text-slate-400 uppercase tracking-widest italic">
                                    Monthly Dues
                                </p>
                                <h2 className={`text-5xl font-black tracking-tighter mt-1 ${(audit?.monthlyOutstanding ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    ₹{(audit?.monthlyOutstanding ?? 0).toLocaleString()}
                                </h2>
                            </div>
                            <div className={`p-4 rounded-2xl ${(audit?.monthlyOutstanding ?? 0) > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                <Calendar size={28} />
                            </div>
                        </div>
                        <p className="text-[14px] font-bold text-slate-600 italic">
                            {(audit?.monthlyOutstanding ?? 0) > 0
                                ? "Includes current month + any unpaid previous months."
                                : "Monthly fees is fully up to date."}
                        </p>
                    </div>

                    {/* Box 2: One-Time Charges (Amber/Yellow) */}
                    <div className="bg-white p-8 rounded-[3rem] border border-[#DDE3EA] shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[18px] font-black text-slate-400 uppercase tracking-widest italic">
                                    One-Time Yearly Charges
                                </p>
                                <h2 className={`text-5xl font-black tracking-tighter mt-1 ${(audit?.oneTimeOutstanding ?? 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    ₹{(audit?.oneTimeOutstanding ?? 0).toLocaleString()}
                                </h2>
                            </div>
                            <div className={`p-4 rounded-2xl ${(audit?.oneTimeOutstanding ?? 0) > 0 ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                <Zap size={28} />
                            </div>
                        </div>
                        <p className="text-[14px] font-bold text-slate-600 italic">
                            {(audit?.oneTimeOutstanding ?? 0) > 0
                                ? "Fixed annual charges pending for this academic year."
                                : "One-time charges cleared/Zero balance."}
                        </p>
                    </div>

                    {/* Advance Credit (Only shows if there is surplus) */}
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


            {/* --- SPLIT REVIEW COMPONENTS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Monthly */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                    <h3 className="text-[16px] font-black text-[#42A5F5] uppercase italic mb-6">Monthly Recurring</h3>
                    {audit?.structureDetails?.monthly.map((item, i) => (
                        <div key={i} className="flex justify-between py-4 border-b border-slate-50 last:border-none">
                            <span className="text-[15px] font-bold text-slate-700 capitalize">{item.label}</span>
                            <span className="text-[15px] font-black text-slate-800">₹{item.amount.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                {/* One-Time */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                    <h3 className="text-[16px] font-black text-amber-500 uppercase italic mb-6">One-Time Charges</h3>
                    {audit?.structureDetails?.oneTime.map((item, i) => (
                        <div key={i} className="flex justify-between py-4 border-b border-slate-50 last:border-none">
                            <span className="text-[15px] font-bold text-slate-700 capitalize">{item.label}</span>
                            <span className="text-[15px] font-black text-slate-800">₹{item.amount.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
            {/* LEDGER ENTRIES */}
            <div className="space-y-6 mt-12">
                <div className="flex items-center gap-3 ml-4 mb-6">
                    <History size={18} className="text-[#42A5F5]" />
                    <h3 className="text-[13px] font-black text-slate-400 capitalize tracking-widest">Verified Transactions</h3>
                </div>

                {audit.history && Object.keys(audit.history).length > 0 ? (
                    Object.entries(audit.history).map(([monthYear, records]) => (
                        <div key={monthYear} className="space-y-5 mb-10">
                            <div className="flex items-center gap-4 px-4">
                                <div className="h-[1px] flex-1 bg-slate-100"></div>
                                <span className="text-[15px] font-black uppercase tracking-[0.3em] text-[#42A5F5]">{monthYear}</span>
                                <div className="h-[1px] flex-1 bg-slate-100"></div>
                            </div>

                            <div className="space-y-4">
                                {records.map((h, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:border-[#42A5F5] transition-all shadow-sm">
                                        <div className="flex items-center gap-5">
                                            <div className="bg-slate-50 p-4 rounded-2xl text-[#42A5F5] group-hover:bg-[#42A5F5] group-hover:text-white transition-all">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[16px] font-black text-slate-700 capitalize italic group-hover:text-[#42A5F5] transition-colors">
                                                    {h.category?.toLowerCase() || 'general fee'}
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

export default StudentLedger;
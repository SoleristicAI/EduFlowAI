import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Send, User, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const TeacherSupport = () => {
    const navigate = useNavigate();
    const [msg, setMsg] = useState('');
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState({});

    const fetchQueries = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/support/all-queries');
            setQueries(data);
        } catch (err) {
            console.error("Neural fetch error:", err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchQueries();
    }, []);

    const handleResolve = async (id) => {
        const currentReply = reply[id];
        if (!currentReply?.trim()) {
            setMsg("Error: Enter resolution protocol! 🛡️");
            return;
        }

        try {
            await API.put(`/support/resolve/${id}`, { answer: currentReply });

            setMsg("Solution sent! Query closed. ✅");

            setQueries(prev =>
                prev.map(q =>
                    q._id === id
                        ? {
                            ...q,
                            status: 'Resolved',
                            answer: currentReply
                        }
                        : q
                )
            );

            setReply(prev => ({
                ...prev,
                [id]: ''
            }));
        } catch (err) {
            setMsg("Transmission failed: Neural link unstable.");
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header Section */}
            <div className="bg-[#42A5F5] px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible">
                <div className="flex justify-between items-center relative z-10">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-md active:scale-95 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Center Title */}
                    <div className="text-center">
                        <h1 className="text-4xl font-black italic tracking-tight text-white capitalize">
                            Class Support
                        </h1>

                        <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-80 mt-1">
                            Assigned Class Queries Only
                        </p>
                    </div>

                    {/* Right Icon */}
                    <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm">
                        <HelpCircle size={24} />
                    </div>

                </div>
            </div>

            <div className="px-5 -mt-10 space-y-8 relative z-20">
                {queries.length > 0 ? queries.map((q) => (
                    <div key={q._id} className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-[#DDE3EA] relative overflow-hidden group hover:border-[#42A5F5] transition-all italic">

                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 p-4 rounded-2xl text-[#42A5F5] border border-blue-100 shadow-sm transition-all group-hover:bg-[#42A5F5] group-hover:text-white">
                                    <User size={28} />
                                </div>
                                <div>
                                    <span className="text-[15px] font-black bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">
                                        Assigned student
                                    </span>
                                    <h4 className="font-black text-slate-800 text-[19px] capitalize italic tracking-tight group-hover:text-[#42A5F5] transition-all leading-none">{q.student?.name}</h4>
                                    <p className="text-[14px] font-bold text-slate-700 uppercase tracking-widest mt-2 italic">Class {q.student?.grade} </p>
                                </div>
                            </div>
                            {q.isUrgent && (
                                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] inline-block"></span>
                            )}
                        </div>

                        {/* Query Text Box */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] mb-8 border border-slate-100 shadow-inner group-hover:bg-blue-50 transition-colors">
                            <p className="text-[19px] font-bold text-slate-900 uppercase tracking-widest mt-2 italic">{q.subject}</p>
                            <p className="text-[15px] text-slate-500 font-bold leading-relaxed italic group-hover:text-slate-700 transition-colors">
                                "{q.query}"
                            </p>
                        </div>

                        {/* Resolution Logic */}
                        {q.status === 'Pending' ? (
                            <div className="space-y-5">
                                <div className="relative">
                                    <textarea
                                        placeholder="Type your solution here..."
                                        className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-400 text-[16px] font-bold text-slate-700 outline-none focus:border-[#42A5F5] focus:bg-white h-32 italic placeholder:text-slate-300 transition-all shadow-inner"
                                        value={reply[q._id] || ''}
                                        onChange={(e) =>
                                            setReply({
                                                ...reply,
                                                [q._id]: e.target.value
                                            })
                                        }
                                    />
                                    <ShieldCheck className="absolute bottom-6 right-6 text-[#42A5F5] opacity-20" size={24} />
                                </div>
                                <button
                                    onClick={() => handleResolve(q._id)}
                                    className="w-full bg-[#42A5F5] text-white py-6 rounded-[2.5rem] font-black uppercase text-[14px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-100 italic group-hover:scale-[1.02] border-b-4 border-blue-700"
                                >
                                    <Send size={20} /> Send solution
                                </button>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 border-dashed italic relative overflow-hidden">
                                <CheckCircle2 className="absolute top-4 right-4 text-emerald-500 opacity-10" size={50} />
                                <p className="text-[15px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Archived solution sent
                                </p>
                                <p className="text-[16px] text-slate-700 font-black italic">"{q.answer}"</p>
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="text-center py-24 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-sm mx-2">
                        <MessageCircle className="mx-auto text-slate-200 mb-6 animate-pulse" size={80} />
                        <p className="text-slate-300 font-black text-[14px] uppercase tracking-widest italic text-center px-10">System equilibrium reached • No sector interrupts found</p>
                    </div>
                )}
            </div>
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default TeacherSupport;
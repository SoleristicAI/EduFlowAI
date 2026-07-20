import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquarePlus, LifeBuoy, Clock, CheckCircle2, AlertCircle, Send, ShieldCheck, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const Support = () => {
    const navigate = useNavigate();
    const [msg, setMsg] = useState(''); // Alert ki jagah ye use hoga
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        subject: '',
        query: '',
        isUrgent: false
    });
    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/support/my-queries');
            setTickets(data);
        } catch (err) {
            console.error("Error fetching tickets:", err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTickets();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await API.post('/support/ask', {
                subject: formData.subject,
                query: formData.query,
                isUrgent: formData.isUrgent
            });

            setMsg("Query! Send to your Class Teacher. 🛰️");
            setIsFormOpen(false);

            setFormData({
                subject: '',
                query: '',
                isUrgent: false
            });

            fetchTickets();

        } catch (err) {
            setMsg("Protocol Failure: Link interrupted. ⚠️");
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header Section */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-20 rounded-b-[3.5rem] shadow-lg relative z-10 overflow-hidden">

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
                        <h1 className="text-3xl font-black italic tracking-tight capitalize">
                            Student Support
                        </h1>
                        <p className="text-[15px] font-bold text-white/80 tracking-widest mt-1 capitalize">
                            Ask & Connect
                        </p>
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className={`p-2.5 rounded-2xl border transition-all active:scale-90 ${isFormOpen
                                ? "bg-white text-[#42A5F5] border-white"
                                : "bg-white/20 border-white/10 text-white"
                            }`}
                    >
                        <MessageSquarePlus size={24} />
                    </button>
                </div>

                {/* Support Status Card */}
                <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 relative z-10">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Cpu className="text-white animate-pulse" size={25} />
                    </div>

                    <p className="text-[15px] font-bold leading-relaxed capitalize tracking-wide text-white/90">
                        Connected to class teacher
                    </p>
                </div>

            </div>

            <div className="px-5 -mt-8 relative z-20 space-y-6">
                {/* New Query Form */}
                {isFormOpen && (
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#DDE3EA] animate-in fade-in slide-in-from-top-4 duration-500">
                        <h3 className="text-[16px] font-bold text-[#42A5F5] uppercase tracking-widest mb-6 italic flex items-center gap-2">
                            <Send size={20} /> Raise a new query
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[15px] font-black text-black uppercase tracking-widest ml-4 italic">• Query subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Class doubt, Leave request"
                                    rows="4"
                                    className="w-full bg-slate-50 border border-slate-100 py-5 px-6 rounded-3xl text-[19px] font-bold outline-none focus:border-[#42A5F5] focus:bg-white text-slate-700 italic transition-all"
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[15px] font-black text-black uppercase tracking-widest ml-4 italic">• Detailed description</label>
                                <textarea
                                    placeholder="Brief your teacher about the issue..."
                                    rows="4"
                                    className="w-full bg-slate-50 border border-slate-100 py-5 px-6 rounded-3xl text-[19px] font-bold outline-none focus:border-[#42A5F5] focus:bg-white text-slate-700 italic transition-all"
                                    onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                                <input
                                    type="checkbox"
                                    id="urgent"
                                    className="w-5 h-5 accent-rose-500 rounded-md"
                                    onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                                />
                                <label htmlFor="urgent" className="text-[15px] font-black text-rose-500 capitalize italic">Request urgent solution</label>
                            </div>
                            <button type="submit" className="w-full bg-[#42A5F5] text-white py-5 rounded-[2rem] font-black text-[16px] shadow-lg shadow-blue-100 active:scale-95 transition-all italic capitalize">
                                Send query now
                            </button>
                        </form>
                    </div>
                )}

                {/* Tickets List */}
                <div className="space-y-5">
                    <p className="text-[15px] font-bold text-black/40 uppercase tracking-[0.3em] ml-4 italic">Active Support </p>

                    {tickets.length > 0 ? tickets.map((t, i) => (
                        <div key={i} className="bg-white rounded-[2.5rem] p-6 shadow-md border border-[#DDE3EA] group hover:border-[#42A5F5]/30 transition-all italic">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-4 flex justify-between items-center">

                                <span className="text-[15px] font-black text-slate-600 uppercase tracking-widest">
                                    Query ID: #{t._id.slice(-6).toUpperCase()}
                                </span>

                                <span className={`px-4 py-1.5 rounded-full text-[15px] font-black capitalize border italic ${t.status === 'Resolved'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                    {t.status.toLowerCase()}
                                </span>

                            </div>
                            <h4 className="font-black text-slate-800 text-[17px] leading-tight mt-1 capitalize group-hover:text-[#42A5F5] transition-colors">
                                • {t.subject.toLowerCase()}
                            </h4>

                            <p className="text-[17px] text-slate-900 mb-5 px-1 leading-relaxed opacity-90">"{t.query}"</p>

                            {/* Faculty Resolution UI */}
                            {t.answer && (
                                <div className="mb-5 p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100 shadow-inner relative overflow-hidden group-hover:bg-blue-50 transition-all">
                                    <div className="absolute top-0 right-0 p-3 opacity-5">
                                        <CheckCircle2 size={50} className="text-[#42A5F5]" />
                                    </div>
                                    <p className="text-[15px] font-black text-[#42A5F5] uppercase mb-2 tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={14} /> Faculty solution:
                                    </p>
                                    <p className="text-[15px] font-bold text-slate-700 italic leading-relaxed relative z-10">
                                        "{t.answer}"
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-between items-center border-t border-slate-50 pt-4 px-1">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Clock size={14} />
                                    <span className="text-[15px] font-bold italic">{new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={14} className={t.isUrgent ? 'text-rose-500 animate-pulse' : 'text-yellow-500'} />
                                    <span className={`text-[15px] font-bold capitalize ${t.isUrgent ? 'text-rose-500' : 'text-yellow-500'}`}>
                                        {t.isUrgent ? 'Urgent query' : 'Standard priority'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-24 bg-white rounded-[3.5rem] border border-dashed border-[#DDE3EA] mx-1">
                            <LifeBuoy className="mx-auto text-slate-200 mb-4" size={60} />
                            <p className="text-slate-400 font-bold text-[16px] italic text-center capitalize">No support signals found</p>
                        </div>
                    )}
                </div>
            </div>
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default Support;
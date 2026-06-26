import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, User, GraduationCap, ShieldCheck, MessageCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import { motion } from 'framer-motion';

const Mentorship = () => {
    const navigate = useNavigate();
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMentor = async () => {
            try {
                const { data } = await API.get('/users/my-mentor');
                setMentor(data);
            } catch (err) {
                setError(err.response?.data?.message || "Mentor connection failed");
            } finally {
                setLoading(false);
            }
        };
        fetchMentor();
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {/* Header */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

                {/* Top Row */}
                <div className="relative z-10 flex justify-between items-center">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Right Icon */}
                    <div className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                        <Users size={24} />
                    </div>
                </div>

                {/* Center Heading */}
                <div className="relative z-10 text-center mt-4">
                    <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                        Mentorship
                    </h1>

                    <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-2 whitespace-nowrap">
                        Guidance & Student Support
                    </p>
                </div>

            </div>

            <div className="px-6 -mt-10 relative z-20">
                {error ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[3rem] p-12 text-center shadow-xl border border-slate-100">
                        <ShieldCheck size={60} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold italic uppercase tracking-widest">{error}</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 flex flex-col items-center text-center"
                    >
                        {/* Avatar Node */}
                        <div className="relative mb-6">
                            <div className="w-40 h-40 bg-blue-50 rounded-[4rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl shadow-blue-100">
                                {mentor?.avatar ? (
                                    <img src={`http://localhost:5000${mentor.avatar}`} alt="Mentor" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={80} className="text-[#42A5F5]" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2.5 rounded-2xl border-4 border-white shadow-lg animate-pulse">
                                <ShieldCheck size={20} />
                            </div>
                        </div>

                        {/* Mentor Details */}
                        <h2 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter leading-none mb-2">
                            {mentor?.name?.toLowerCase()}
                        </h2>
                        <span className="bg-blue-50 text-[#42A5F5] px-6 py-1.5 rounded-full text-[15px] font-black uppercase tracking-[0.2em] italic mb-8 inline-block border border-blue-100">
                            Class Teacher
                        </span>

                        <div className="w-full space-y-4">
                            {/* Number Box with Call Button */}
                            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm group-hover:scale-110 transition-transform">
                                        <Phone size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[13px] font-black uppercase text-slate-400 tracking-widest italic">Contact No.</p>
                                        <p className="text-[16px] font-black text-slate-700 tracking-widest">{mentor?.phone}</p>
                                    </div>
                                </div>

                                {/* CALL BUTTON */}
                                <a
                                    href={`tel:${mentor?.phone}`}
                                    className="bg-emerald-500 text-white p-4 rounded-3xl shadow-lg shadow-emerald-200 active:scale-90 transition-all"
                                >
                                    <Phone size={24} fill="currentColor" />
                                </a>
                            </div>

                            {/* Assigned Subjects Node */}
                            <div className="flex items-start gap-4 text-left bg-blue-50/40 p-6 rounded-[2.5rem] border border-blue-100/50">
                                <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm"><GraduationCap size={20} /></div>
                                <div>
                                    <p className="text-[13px] font-black uppercase text-slate-400 tracking-widest italic">Teaching Expertise</p>
                                    <p className="text-[14px] font-bold text-slate-600 leading-relaxed italic capitalize">
                                        {mentor?.subjects?.join(', ') || "Expert Faculty"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col items-center gap-2 opacity-20">
                            <div className="w-10 h-1 rounded-full bg-slate-400" />
                            <p className="text-[9px] font-black uppercase tracking-[0.4em]">Official Neural Node Verified</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Mentorship;
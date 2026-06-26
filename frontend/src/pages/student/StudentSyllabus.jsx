import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Layers, ShieldCheck, GraduationCap, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api'; // Path check kar lena apne hisaab se
import Loader from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const StudentSyllabus = () => {
    const navigate = useNavigate();
    const [syllabuses, setSyllabuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSyllabus = async () => {
            try {
                const { data } = await API.get('/exam-syllabus/my-syllabus');
                setSyllabuses(data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load syllabus neural link.");
            } finally {
                setLoading(false);
            }
        };
        fetchSyllabus();
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
            <BookOpen size={24} />
        </div>
    </div>

    {/* Heading + Subtitle BELOW */}
    <div className="relative z-10 text-center mt-4">
        <h1 className="text-4xl font-black italic tracking-tight whitespace-nowrap">
            Exam Syllabus
        </h1>

        <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-80 mt-2 whitespace-nowrap">
            Academic Curriculum
        </p>
    </div>

</div>

            <div className="px-5 -mt-10 relative z-20">
                {error ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[3.5rem] p-12 text-center shadow-xl border border-slate-100">
                        <ShieldCheck size={60} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold italic uppercase tracking-widest">{error}</p>
                    </motion.div>
                ) : syllabuses.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] p-12 text-center shadow-xl border border-slate-100">
                        <FileText size={60} className="mx-auto text-blue-100 mb-4" />
                        <h2 className="text-2xl font-black text-slate-700 uppercase tracking-tighter mb-2">No Syllabus Yet</h2>
                        <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[12px]">Your class teachers haven't published any exam syllabus yet.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        <AnimatePresence>
                            {syllabuses.map((syllabus, index) => (
                                <motion.div
                                    key={syllabus._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-[3.5rem] p-8 shadow-2xl border border-[#DDE3EA] overflow-hidden relative"
                                >
                                    {/* Decorative BG element */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-60 pointer-events-none"></div>

                                    <div className="mb-8 text-center relative z-10">
                                        <div className="w-16 h-16 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-blue-100 shadow-inner">
                                            <Layers className="text-[#42A5F5]" size={32} />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-800 italic capitalize tracking-tight mb-2">
                                            {syllabus.title}
                                        </h2>
                                        <span className="bg-emerald-50 text-emerald-500 px-6 py-1.5 rounded-full text-[13px] font-black uppercase tracking-[0.2em] italic inline-block border border-emerald-100">
                                            Published & Official
                                        </span>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        {syllabus.subjects.map((sub, idx) => (
                                            sub.content && sub.content !== "Not Applicable" && (
                                                <div key={idx} className="bg-slate-50/80 p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                                                    <div className="flex items-center gap-3 mb-3 border-b border-slate-200 pb-3">
                                                        <div className="flex items-center gap-2 bg-[#F0F9FF] border border-[#BAE6FD] px-5 py-3 rounded-[1.5rem] shrink-0 min-w-[150px] shadow-sm">
                                                            <GraduationCap size={20} className="text-[#38BDF8]" />
                                                            <h3 className="text-[17px] font-black text-[#0369A1] capitalize tracking-tight leading-tight">
                                                                {sub.subjectName}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                    <p className="text-[16px] font-bold text-slate-500 leading-relaxed italic whitespace-pre-wrap pl-2 border-l-2 border-[#42A5F5]">
                                                        {sub.content}
                                                    </p>
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    <div className="mt-8 flex flex-col items-center gap-2 opacity-30">
                                        <div className="w-10 h-1 rounded-full bg-slate-400" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.4em]">EduFlowAI Verified</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentSyllabus;
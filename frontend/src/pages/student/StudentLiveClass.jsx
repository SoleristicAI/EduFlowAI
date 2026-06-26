import React, { useState, useEffect } from 'react';
import { ArrowLeft, Video, Calendar, Clock, User, Link as LinkIcon, MonitorPlay } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import { motion } from 'framer-motion';

const StudentLiveClass = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [liveClasses, setLiveClasses] = useState([]);
    const [studentProfile, setStudentProfile] = useState(null);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        loadData();
    }, []);

    const triggerToast = (message, type = "success") => {
        setShowToast({ show: true, message, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);
            setStudentProfile(user);

            // ===============================
            // SMART ID-LOCKED CACHE SYSTEM
            // ===============================
            const cacheKey = `studentLiveClasses_${user._id}`;
            const cachedClasses = localStorage.getItem(cacheKey);

            if (cachedClasses) {
                setLiveClasses(JSON.parse(cachedClasses));
            }

            // Silent Background Fetch
            const { data } = await API.get("/liveclass/student-classes");
            const oldString = cachedClasses || "[]";
            const newString = JSON.stringify(data);

            if (oldString !== newString) {
                localStorage.setItem(cacheKey, newString);
                setLiveClasses(data);
            }
        } catch (err) {
            triggerToast("Failed to load live classes.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* HEADER */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent opacity-50 pointer-events-none"></div>

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
                        <Video size={24} />
                    </div>
                </div>

                {/* Heading + Subtitle */}
                <div className="relative z-10 text-center mt-4">
                    <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                        Live Classes
                    </h1>

                    <p className="text-[13px] uppercase tracking-[0.25em] font-bold opacity-90 mt-2 whitespace-nowrap">
                        Digital Classrooms
                    </p>
                </div>

            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                    {/* Identity Badge */}
                    <div className="bg-white p-5 rounded-[2rem] border border-blue-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                                <MonitorPlay size={24} className="text-[#42A5F5]" />
                            </div>
                            <div>
                                <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em]">Enrolled Class</p>
                                <span className="font-black text-blue-900 uppercase tracking-widest text-[17px]">{studentProfile?.grade || 'Loading...'}</span>
                            </div>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                            <span className="text-[14px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                        </div>
                    </div>

                    {/* Classes Grid */}
                    {liveClasses.length === 0 ? (
                        <div className="bg-white p-10 rounded-[3.5rem] border border-dashed border-slate-300 text-center shadow-sm mt-8">
                            <Video size={48} className="text-blue-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold text-lg">No live classes scheduled currently.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {liveClasses.map((cls) => (
                                <div key={cls._id} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-[#DDE3EA] relative overflow-hidden group hover:border-[#42A5F5] transition-all">

                                    {/* Subject and Teacher */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase">{cls.subjectName}</h3>
                                            <p className="text-sm font-bold text-slate-500 flex items-center gap-1 mt-1">
                                                <User size={14} className="text-[#42A5F5]" /> By {cls.proposerName}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 bg-blue-50 text-[#42A5F5] rounded-full flex items-center justify-center font-black text-xs border border-blue-100">
                                            {cls.platform === 'Zoom' ? 'Z' : 'GM'}
                                        </div>
                                    </div>

                                    {/* Timing Details */}
                                    <div className="bg-blue-50/50 p-4 rounded-2xl space-y-2 mb-6 border border-blue-100">
                                        <p className="text-[13px] font-black text-slate-700 flex items-center gap-2 tracking-wide uppercase">
                                            <Calendar size={16} className="text-[#42A5F5]" /> {cls.date}
                                        </p>
                                        <p className="text-[13px] font-black text-slate-700 flex items-center gap-2 tracking-wide uppercase">
                                            <Clock size={16} className="text-[#42A5F5]" /> {cls.startTime} - {cls.endTime}
                                        </p>
                                    </div>

                                    {/* Join Button (Student Link) */}
                                    <a
                                        href={cls.studentLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#42A5F5] text-white py-4 rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-[13px] flex justify-center items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all border-b-4 border-blue-700"
                                    >
                                        <LinkIcon size={16} /> Join Class ({cls.platform})
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default StudentLiveClass;
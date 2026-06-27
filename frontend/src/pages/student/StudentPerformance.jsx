import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, TrendingUp, Target, Zap,
    BrainCircuit, Star, AlertCircle,
    Activity, Sparkles, BookOpen, AlertOctagon, UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import Loader from '../../components/Loader';
import { AnimatePresence, motion } from 'framer-motion';

// ==========================================
// 1. CUSTOM UI COMPONENTS (CIRCULAR CHARTS)
// ==========================================

const MainRadialGauge = ({ percentage }) => {
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Status colors
    let colorClass = "text-emerald-500";
    let glowClass = "drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]";
    if (percentage < 40) { colorClass = "text-rose-500"; glowClass = "drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]"; }
    else if (percentage < 70) { colorClass = "text-amber-500"; glowClass = "drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"; }
    else if (percentage < 85) { colorClass = "text-[#42A5F5]"; glowClass = "drop-shadow-[0_0_15px_rgba(66,165,245,0.3)]"; }

    return (
        <div className="relative flex items-center justify-center w-64 h-64">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-blue-50" />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className={`${colorClass} ${glowClass}`}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="text-5xl font-black text-slate-800 tracking-tighter">
                    {percentage.toFixed(1)}<span className="text-2xl text-slate-400">%</span>
                </motion.span>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#42A5F5] mt-1">Total Score</span>
            </div>
        </div>
    );
};

const MiniProgressRing = ({ percentage, subject }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let colorClass = "text-emerald-500";
    let bgClass = "bg-emerald-50";
    if (percentage < 40) { colorClass = "text-rose-500"; bgClass = "bg-rose-50"; }
    else if (percentage < 70) { colorClass = "text-amber-500"; bgClass = "bg-amber-50"; }
    else if (percentage < 85) { colorClass = "text-[#42A5F5]"; bgClass = "bg-blue-50"; }

    return (
        <div className="flex flex-col items-center p-5 bg-white rounded-[2rem] border border-[#E2E8F0] shadow-md hover:border-[#42A5F5] hover:-translate-y-1 transition-all">
            <div className="relative flex items-center justify-center w-24 h-24 mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        whileInView={{ strokeDashoffset }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className={colorClass}
                    />
                </svg>
                <div className="absolute text-lg font-black text-slate-700">
                    {percentage.toFixed(0)}%
                </div>
            </div>
            <div className={`px-3 py-1 rounded-full ${bgClass} ${colorClass} text-[10px] font-black uppercase tracking-widest mb-1 text-center truncate w-full`}>
                {subject}
            </div>
        </div>
    );
};


// ==========================================
// 2. MAIN DASHBOARD COMPONENT
// ==========================================
const StudentPerformance = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    const [analytics, setAnalytics] = useState(null);
    const [studentProfile, setStudentProfile] = useState(null);

    useEffect(() => {
        // Retrieve student profile from local storage
        const userStr = localStorage.getItem('user');
        if (userStr) setStudentProfile(JSON.parse(userStr));
        fetchAndCalculatePerformance();
    }, []);

    const triggerToast = (message, type = "success") => {
        setShowToast({ show: true, message, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const fetchAndCalculatePerformance = async () => {
        try {
            const response = await API.get('/exam-results/my-performance');
            const rawData = response.data;

            if (!rawData || rawData.length === 0) {
                setAnalytics(null);
                setLoading(false);
                return;
            }

            let totalMarksObtained = 0;
            let totalMaxMarks = 0;
            const subjectMap = {};

            rawData.forEach(exam => {
                exam.subjects.forEach(sub => {
                    totalMarksObtained += Number(sub.marksObtained);
                    totalMaxMarks += Number(sub.maxMarks);

                    if (!subjectMap[sub.subjectName]) {
                        subjectMap[sub.subjectName] = { obtained: 0, max: 0 };
                    }
                    subjectMap[sub.subjectName].obtained += Number(sub.marksObtained);
                    subjectMap[sub.subjectName].max += Number(sub.maxMarks);
                });
            });

            const overallPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

            const subjectAverages = Object.keys(subjectMap).map(key => {
                const sub = subjectMap[key];
                return {
                    subject: key,
                    avg: (sub.obtained / sub.max) * 100
                };
            }).sort((a, b) => b.avg - a.avg);

            setAnalytics({
                overallPercentage,
                totalExams: rawData.length,
                subjectAverages,
                strongestSubject: subjectAverages[0] || null,
                weakestSubject: subjectAverages[subjectAverages.length - 1] || null,
                recentExams: rawData
            });

        } catch (error) {
            triggerToast("Failed to fetch real performance data.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* --- EDUFLOW AI SIGNATURE HEADER --- */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent opacity-40 pointer-events-none"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <button onClick={() => navigate(-1)} className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white border border-white/30 hover:bg-white/30 transition-all shadow-sm">
                            <ArrowLeft size={24} />
                        </button>
                        <div className="relative z-10 text-center mt-12">
                            <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">My Progress</h1>
                            <p className="text-[13px] uppercase tracking-[0.25em] font-bold opacity-90 mt-2 whitespace-nowrap">Academic Performance</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                            <BookOpen size={24} />
                        </div>
                    </div>

                    {/* Student Identity Badge */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-md">
                            <UserCircle size={20} className="text-white" />
                            <span className="text-white font-black text-sm uppercase tracking-widest">{studentProfile?.name || 'Student'}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-50"></span>
                            <span className="text-white font-black text-sm uppercase tracking-widest">Class {studentProfile?.grade || 'N/A'}</span>
                        </div>
                    </div>

                    {/* HERO METRICS GRID (Only show if data exists) */}
                    {analytics ? (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 bg-white p-8 md:p-10 rounded-[3.5rem] shadow-2xl border border-[#E2E8F0] mt-8 w-full max-w-4xl mx-auto relative -bottom-16">
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative">
                                <MainRadialGauge percentage={analytics.overallPercentage} />
                            </motion.div>

                            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4 w-full md:w-auto">
                                <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] text-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#42A5F5] mx-auto mb-3"><BookOpen size={24} /></div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Total Exams</p>
                                    <p className="text-2xl font-black text-[#42A5F5]">{analytics.totalExams}</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mx-auto mb-3"><Target size={24} /></div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                    <p className="text-xl font-black text-emerald-600 uppercase mt-1">
                                        {analytics.overallPercentage >= 85 ? 'Excellent' : analytics.overallPercentage >= 70 ? 'Good' : analytics.overallPercentage >= 40 ? 'Average' : 'Needs Help'}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white p-10 rounded-[3.5rem] shadow-2xl mt-8 max-w-2xl mx-auto border border-[#E2E8F0]">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <AlertOctagon size={40} className="text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-700 uppercase tracking-widest">No Results Yet</h2>
                            <p className="text-slate-400 mt-2 font-bold">Waiting for your teachers to publish exam results.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN CONTENT AREA (Only render if we have data) --- */}
            {analytics && (
                <div className="px-5 mt-17 md:mt-28 relative z-20 space-y-8 max-w-6xl mx-auto">

                    {/* 1. SMART ADVICE CARD */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 md:p-8 rounded-[3rem] shadow-xl border border-[#E2E8F0] flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center justify-center shrink-0">
                            <BrainCircuit size={36} className="text-[#42A5F5]" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-700 mb-3 flex items-center gap-2">
                                Teacher's Insight
                            </h2>
                            <div className="space-y-3">
                                {analytics.strongestSubject && (
                                    <p className="text-sm font-bold text-slate-600 flex items-start gap-3 bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                                        <Star size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                        You are doing great in <span className="text-emerald-600 font-black px-1 uppercase">{analytics.strongestSubject.subject}</span> with {analytics.strongestSubject.avg.toFixed(1)}%. Keep up the good work!
                                    </p>
                                )}
                                {analytics.weakestSubject && analytics.weakestSubject.avg < 70 && (
                                    <p className="text-sm font-bold text-slate-600 flex items-start gap-3 bg-rose-50/50 border border-rose-100 p-4 rounded-2xl">
                                        <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                                        Your marks in <span className="text-rose-600 font-black px-1 uppercase">{analytics.weakestSubject.subject}</span> are a bit low. You should focus more on this subject.
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. SUBJECT PERFORMANCE */}
                    <div>
                        <div className="flex items-center gap-3 mb-6 ml-2">
                            <div className="p-2 bg-blue-100 text-[#42A5F5] rounded-xl"><Activity size={18} /></div>
                            <h2 className="text-xl font-black uppercase tracking-widest text-slate-700">Subject Performance</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {analytics.subjectAverages.map((sub, idx) => (
                                <motion.div key={sub.subject} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }}>
                                    <MiniProgressRing percentage={sub.avg} subject={sub.subject} />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* 3. EXAM RESULTS LIST */}
                    <div>
                        <div className="flex items-center gap-3 mb-6 ml-2 mt-10">
                            <div className="p-2 bg-indigo-100 text-indigo-500 rounded-xl"><Zap size={18} /></div>
                            <h2 className="text-xl font-black uppercase tracking-widest text-slate-700">All Exam Results</h2>
                        </div>

                        <div className="space-y-6">
                            {analytics.recentExams.map((exam, idx) => {
                                let obt = 0; let max = 0;
                                exam.subjects.forEach(s => { obt += Number(s.marksObtained); max += Number(s.maxMarks); });
                                const examAvg = max > 0 ? (obt / max) * 100 : 0;

                                return (
                                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + (0.1 * idx) }} className="bg-white p-6 md:p-8 rounded-[3rem] shadow-xl border border-[#E2E8F0] group hover:border-[#42A5F5] transition-all">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-slate-100 pb-6">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide">{exam.examTitle}</h3>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Date: {exam.date}</p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-slate-50 py-3 px-6 rounded-[2rem] border border-slate-200">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Score</p>
                                                    <p className="text-xl font-black text-[#42A5F5]">{examAvg.toFixed(1)}%</p>
                                                </div>
                                                <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                                                    <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200" />
                                                    <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="100" strokeDashoffset={100 - examAvg} className="text-[#42A5F5]" />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {exam.subjects.map((sub, sIdx) => {
                                                const subPct = (Number(sub.marksObtained) / Number(sub.maxMarks)) * 100;
                                                return (
                                                    <div key={sIdx} className="flex justify-between items-center p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-100 transition-colors">
                                                        <span className="text-sm font-black text-slate-600 uppercase">{sub.subjectName}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-black text-slate-800">{sub.marksObtained} <span className="text-slate-400 text-xs">/ {sub.maxMarks}</span></span>
                                                            <div className={`w-2 h-2 rounded-full ${subPct >= 80 ? 'bg-emerald-400' : subPct >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentPerformance;
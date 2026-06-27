import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Phone, MapPin, Mail, Shield,
    Clock, XCircle, CheckCircle, TrendingUp, Target,
    Zap, BrainCircuit, Star, AlertCircle, Activity,
    BookOpen, AlertOctagon
} from 'lucide-react';
import API from '../api';
import Loader from '../components/Loader';
import { AnimatePresence, motion } from 'framer-motion';

// ==========================================
// CUSTOM UI COMPONENTS (CIRCULAR CHARTS)
// ==========================================
const MainRadialGauge = ({ percentage }) => {
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let colorClass = "text-emerald-500";
    let glowClass = "drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]";
    if (percentage < 40) { colorClass = "text-rose-500"; glowClass = "drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]"; }
    else if (percentage < 70) { colorClass = "text-amber-500"; glowClass = "drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"; }
    else if (percentage < 85) { colorClass = "text-[#42A5F5]"; glowClass = "drop-shadow-[0_0_15px_rgba(66,165,245,0.3)]"; }

    return (
        <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-blue-50" />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className={`${colorClass} ${glowClass}`}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="text-3xl font-black text-slate-800 tracking-tighter">
                    {percentage.toFixed(1)}<span className="text-lg text-slate-400">%</span>
                </motion.span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#42A5F5] mt-1">Score</span>
            </div>
        </div>
    );
};

const MiniProgressRing = ({ percentage, subject }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let colorClass = "text-emerald-500";
    let bgClass = "bg-emerald-50";
    if (percentage < 40) { colorClass = "text-rose-500"; bgClass = "bg-rose-50"; }
    else if (percentage < 70) { colorClass = "text-amber-500"; bgClass = "bg-amber-50"; }
    else if (percentage < 85) { colorClass = "text-[#42A5F5]"; bgClass = "bg-blue-50"; }

    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-[2rem] border border-slate-100 shadow-md ring-1 ring-slate-50 hover:border-[#42A5F5] hover:-translate-y-1 transition-all">
            <div className="relative flex items-center justify-center w-20 h-20 mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        whileInView={{ strokeDashoffset }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className={colorClass}
                    />
                </svg>
                <div className="absolute text-sm font-black text-slate-700">
                    {percentage.toFixed(0)}%
                </div>
            </div>
            <div className={`px-2 py-1 rounded-full ${bgClass} ${colorClass} text-[9px] font-black uppercase tracking-widest mb-1 text-center truncate w-full`}>
                {subject}
            </div>
        </div>
    );
};

const StudentDetail = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeepStats = async () => {
            try {
                // Fetch Attendance & Profile
                const attRes = await API.get(`/attendance/student-report/${studentId}`);
                setData(attRes.data);

                // Fetch Performance parallelly
                try {
                    const perfRes = await API.get(`/exam-results/student-performance/${studentId}`);
                    processPerformanceData(perfRes.data);
                } catch (perfErr) {
                    console.log("Performance not available yet or error.", perfErr);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDeepStats();
    }, [studentId]);

    // Crunching logic for Performance
    const processPerformanceData = (rawData) => {
        if (!rawData || rawData.length === 0) return;

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
            return { subject: key, avg: (sub.obtained / sub.max) * 100 };
        }).sort((a, b) => b.avg - a.avg);

        setPerformance({
            overallPercentage,
            totalExams: rawData.length,
            subjectAverages,
            strongestSubject: subjectAverages[0] || null,
            weakestSubject: subjectAverages[subjectAverages.length - 1] || null,
            recentExams: rawData
        });
    };

    if (loading) return <Loader />;

    const { profile, stats } = data;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            {/* Top Profile Header Area */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-32 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all hover:bg-white/30 active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="relative inline-block mt-4">
                    <div className="w-32 h-32 rounded-[3rem] bg-white border-4 border-blue-100 flex items-center justify-center text-5xl font-black text-[#42A5F5] shadow-2xl">
                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                </div>

                <h2 className="mt-6 text-4xl font-black tracking-tighter italic px-10 text-white">
                    {profile.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                </h2>
                <p className="text-[17px] font-black text-blue-100 uppercase tracking-[0.3em] italic mt-2">
                    {profile.enrollmentNo}
                </p>
            </div>

            {/* FULL WIDTH WRAPPER (Removed max-w-5xl mx-auto to spread full screen) */}
            <div className="px-5 -mt-16 space-y-6 relative z-20">

                {/* 1. Stats Matrix (Attendance) */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Attendance', value: `${stats.percentage}%`, color: 'text-[#42A5F5]' },
                        { label: 'Present', value: stats.presentDays, color: 'text-emerald-500' },
                        { label: 'Absent', value: stats.absentDays, color: 'text-rose-500' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 text-center shadow-xl ring-1 ring-slate-50">
                            <p className={`text-2xl md:text-3xl font-black leading-none mb-2 ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* 2. Details Box */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl ring-1 ring-slate-50">
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <h3 className="text-[20px] font-black text-blue-800 uppercase tracking-[0.2em] italic">
                            Student profile details
                        </h3>
                        <Shield size={20} className="text-[#42A5F5]" />
                    </div>

                    <div className="space-y-6">
                        {[
                            { icon: <Shield size={18} />, label: 'Class', value: profile.grade },
                            { icon: <User size={18} />, label: 'Father name', value: profile.fatherName },
                            { icon: <Phone size={18} />, label: 'Mobile number', value: profile.phone },
                            { icon: <Mail size={18} />, label: 'Institutional email', value: profile.email },
                            { icon: <Shield size={18} />, label: 'Admission number', value: profile.admissionNo },
                            { icon: <MapPin size={18} />, label: 'Permanent address', value: profile.address?.fullAddress || 'N/A' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-start border-b border-slate-50 pb-4 last:border-0 transition-all">

                                {/* LEFT SIDE → DETAILS */}
                                <div className="text-left flex-1 mr-6">
                                    <p className="text-[18px] md:text-[20px] font-black text-slate-400 uppercase tracking-widest">
                                        {item.label}
                                    </p>
                                    <p className="text-[13px] md:text-[18px] font-black text-slate-700 italic mt-1 leading-tight">
                                        {item.value}
                                    </p>
                                </div>

                                {/* RIGHT SIDE → ICON */}
                                <div className="flex items-center gap-4 text-[#42A5F5] opacity-70">
                                    {item.icon}
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* ========================================== */}
                {/* 3. PERFORMANCE ENGINE (INTEGRATED VIEW)    */}
                {/* ========================================== */}
                {performance ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex items-center gap-3 ml-2 mt-6">
                            <TrendingUp size={24} className="text-[#42A5F5]" />
                            <h3 className="text-lg md:text-xl font-black text-slate-700 uppercase tracking-[0.2em]">Academic Overview</h3>
                        </div>

                        {/* Performance Header Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Radial Gauge */}
                            <div className="md:col-span-1 bg-white rounded-[3rem] p-6 shadow-2xl border border-slate-100 ring-1 ring-slate-50 flex items-center justify-center">
                                <MainRadialGauge percentage={performance.overallPercentage} />
                            </div>

                            {/* Quick Stats & AI Insights */}
                            <div className="md:col-span-2 space-y-6 flex flex-col justify-between">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex flex-col justify-center items-center">
                                        <BookOpen size={24} className="text-[#42A5F5] mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Exams</p>
                                        <p className="text-2xl font-black text-[#42A5F5]">{performance.totalExams}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col justify-center items-center">
                                        <Target size={24} className="text-emerald-500 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                        <p className="text-xl font-black text-emerald-600 uppercase">
                                            {performance.overallPercentage >= 85 ? 'Excellent' : performance.overallPercentage >= 70 ? 'Good' : performance.overallPercentage >= 40 ? 'Average' : 'Critical'}
                                        </p>
                                    </div>
                                </div>

                                {/* AI Insight Box */}
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl ring-1 ring-slate-50 flex-1 flex flex-col justify-center">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                        <BrainCircuit size={16} className="text-[#42A5F5]" /> AI System Insight
                                    </h2>
                                    {performance.strongestSubject && (
                                        <p className="text-xs font-bold text-slate-600 flex items-center gap-2 mb-2">
                                            <Star size={14} className="text-emerald-500" />
                                            Strongest domain is <span className="text-emerald-600 font-black uppercase">{performance.strongestSubject.subject}</span> ({performance.strongestSubject.avg.toFixed(1)}%).
                                        </p>
                                    )}
                                    {performance.weakestSubject && performance.weakestSubject.avg < 70 && (
                                        <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                            <AlertCircle size={14} className="text-rose-500" />
                                            Requires attention in <span className="text-rose-600 font-black uppercase">{performance.weakestSubject.subject}</span>.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Subject Mastery Grid */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl ring-1 ring-slate-50">
                            <div className="flex items-center gap-3 mb-6 ml-2">
                                <Activity size={20} className="text-[#42A5F5]" />
                                <h3 className="text-[15px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Subject Mastery</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {performance.subjectAverages.map((sub, idx) => (
                                    <MiniProgressRing key={idx} percentage={sub.avg} subject={sub.subject} />
                                ))}
                            </div>
                        </div>

                        {/* 4. ALL EXAM RESULTS (Specific Exam Data) */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl ring-1 ring-slate-50">
                            <div className="flex items-center gap-3 mb-8 ml-2">
                                <Zap size={20} className="text-[#42A5F5]" />
                                <h3 className="text-[15px] font-black text-slate-400 uppercase tracking-[0.2em] italic">All Exam Results</h3>
                            </div>

                            <div className="space-y-6">
                                {performance.recentExams.map((exam, idx) => {
                                    let obt = 0; let max = 0;
                                    exam.subjects.forEach(s => { obt += Number(s.marksObtained); max += Number(s.maxMarks); });
                                    const examAvg = max > 0 ? (obt / max) * 100 : 0;

                                    return (
                                        <div key={idx} className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:border-[#42A5F5]">
                                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-slate-200 pb-6">
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide">{exam.examTitle}</h3>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Date: {exam.date}</p>
                                                </div>
                                                <div className="flex items-center gap-4 bg-white py-3 px-6 rounded-[2rem] border border-slate-200 shadow-sm">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Score</p>
                                                        <p className="text-xl font-black text-[#42A5F5]">{examAvg.toFixed(1)}%</p>
                                                    </div>
                                                    <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                                                        <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                                        <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="100" strokeDashoffset={100 - examAvg} className="text-[#42A5F5]" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Subject marks mapping */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {exam.subjects.map((sub, sIdx) => {
                                                    const subPct = (Number(sub.marksObtained) / Number(sub.maxMarks)) * 100;
                                                    return (
                                                        <div key={sIdx} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                            <span className="text-sm font-black text-slate-600 uppercase">{sub.subjectName}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-black text-slate-800">{sub.marksObtained} <span className="text-slate-400 text-xs">/ {sub.maxMarks}</span></span>
                                                                <div className={`w-2 h-2 rounded-full ${subPct >= 80 ? 'bg-emerald-400' : subPct >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </motion.div>
                ) : (
                    // Empty State for Performance
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl ring-1 ring-slate-50 text-center mt-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <AlertOctagon size={32} className="text-slate-400" />
                        </div>
                        <h2 className="text-xl font-black text-slate-700 uppercase tracking-widest">No Exam Records</h2>
                        <p className="text-slate-400 mt-2 font-bold text-sm">No published exam results found for this student yet.</p>
                    </div>
                )}
            </div>

            {/* Sovereign Session Badge */}
            <div className="px-5 mt-8">
                <div className="bg-slate-800 rounded-[2.5rem] p-6 text-white shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Secure protocol</p>
                        <h4 className="text-[13px] md:text-[14px] font-black italic uppercase mt-1">Personnel detail link active</h4>
                    </div>
                    <CheckCircle className="text-emerald-400 animate-pulse" size={24} />
                </div>
            </div>
        </div>
    );
};

export default StudentDetail;
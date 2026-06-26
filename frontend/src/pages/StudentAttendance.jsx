import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, Calendar, AlertCircle, CheckCircle, XCircle, Cpu, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';

const StudentAttendance = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // e.g. "2026-02"

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                // Backend ko current month bhej rahe hain
                const { data } = await API.get(`/attendance/student-stats?month=${currentMonth}`);
                setStats(data);
            } catch (err) { console.error("History Sync Failed", err); }
            finally { setLoading(false); }
        };
        fetchStats();
    }, [currentMonth]); // Jab month badlega, data refresh hoga

    const changeMonth = (offset) => {
        const date = new Date(currentMonth + "-01");
        date.setMonth(date.getMonth() + offset);
        setCurrentMonth(date.toISOString().slice(0, 7));
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header Section */}
            <div className="bg-[#42A5F5] text-white px-6 pt-8 pb-16 rounded-b-[3.5rem] shadow-lg relative overflow-hidden text-center">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-8 left-6 z-50 bg-white/20 p-2.5 rounded-2xl border border-white/20 text-white active:scale-90 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>

                {/* Right Icon */}
                <div className="absolute top-8 right-6 z-50 bg-white/20 p-2.5 rounded-2xl border border-white/20 text-white">
                    <Cpu size={24} />
                </div>

                {/* Attendance Circle */}
                <div className="relative inline-block mt-6 z-10">
                    <div className="w-32 h-32 rounded-full border-[6px] border-white/20 flex items-center justify-center relative bg-white/10 backdrop-blur-sm">
                        <div className="text-3xl font-black text-white tracking-tighter">
                            {stats?.percentage}%
                        </div>

                        <div className="absolute inset-0 rounded-full border-[6px] border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
                    </div>
                </div>

                {/* Heading */}
                <h2 className="mt-4 text-[20px] font-black italic text-white/90 relative z-10 capitalize">
                    Attendance Percentage %
                </h2>

            </div>

            <div className="px-5 -mt-8 relative z-20 space-y-6">
                {/* 1. Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total days', value: stats?.totalDays, bg: 'bg-white', color: 'text-slate-600', icon: <Calendar size={18} className="text-blue-500" /> },
                        { label: 'Present Days', value: stats?.presentDays, bg: 'bg-[#E0F2F1]', color: 'text-emerald-600', icon: <CheckCircle size={18} className="text-emerald-500" /> },
                        { label: 'Absent Days', value: stats?.absentDays, bg: 'bg-[#FFEBEE]', color: 'text-rose-600', icon: <XCircle size={18} className="text-rose-500" /> }
                    ].map((item, i) => (
                        <div key={i} className={`${item.bg} p-4 rounded-[2rem] border border-[#DDE3EA] shadow-sm flex flex-col items-center justify-center group active:scale-95 transition-all h-28`}>
                            <div className="mb-1 group-hover:scale-110 transition-transform">{item.icon}</div>
                            <span className="text-[20px] font-black">{item.value}</span>
                            <p className="text-[13px] font-medium opacity-70 italic capitalize">{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* 2. Month Navigation */}
                <div className="bg-white p-5 rounded-[2rem] border border-[#DDE3EA] flex items-center justify-between shadow-sm mx-1">
                    <button onClick={() => changeMonth(-1)} className="p-2 text-slate-400 hover:text-[#42A5F5] transition-colors">
                        <ChevronLeft size={28} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-[#42A5F5]" />
                        <span className="text-[16px] font-bold text-slate-700 italic capitalize">
                            {new Date(currentMonth + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2 text-slate-400 hover:text-[#42A5F5] transition-colors">
                        <ChevronRight size={28} />
                    </button>
                </div>

                {/* 3. History List */}
                <div className="space-y-3 pb-10">
                    <h3 className="text-[20px] font-bold text-slate-500 mb-2 ml-4  capitalize"> 🗓️ Per Day Attendance</h3>

                    {stats?.history && stats.history.length > 0 ? (
                        stats.history.map((log, i) => (
                            <div key={i} className="bg-white p-5 rounded-[2.5rem] border border-[#DDE3EA] flex items-center justify-between group active:scale-95 transition-all italic shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${log.status === 'Present' ? 'bg-[#E0F2F1] text-emerald-600' : 'bg-[#FFEBEE] text-rose-600'}`}>
                                        {log.status === 'Present' ? <CheckCircle size={22} /> : <XCircle size={22} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-[18px] italic tracking-tight capitalize">
                                            {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'long' })}
                                        </h4>
                                        <p className="text-[15px] font-medium text-slate-400 italic">Verified by EduFlowAI</p>
                                    </div>
                                </div>
                                <span className={`text-[13px] font-bold px-5 py-2 rounded-full ${log.status === 'Present' ? 'bg-[#42A5F5] text-white shadow-md' : 'bg-slate-100 text-slate-400 border border-[#DDE3EA]'} capitalize`}>
                                    {log.status}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-[#DDE3EA] mx-2">
                            <p className="text-slate-400 font-bold text-[20px] italic tracking-wide">No Data Found ✅</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
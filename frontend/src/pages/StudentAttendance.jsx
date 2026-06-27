import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, Calendar, AlertCircle, CheckCircle, XCircle, Cpu, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import API from '../api';
import Loader from '../components/Loader';

const StudentAttendance = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedDateLog, setSelectedDateLog] = useState(null);

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
    // 2. Apni file mein is helper function ko add kar le (Render function se theek upar):
    const getLogForDate = (day) => {
        if (!stats?.history) return null;

        // Convert 'day' into matching YYYY-MM-DD format (Assuming stats.history has 'date' in YYYY-MM-DD format from DB)
        const [year, month] = currentMonth.split('-');
        const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;

        // Find if the student was marked Present/Absent on this exact date
        return stats.history.find(log => {
            // Safe check to match dates
            const logDateStr = new Date(log.date).toISOString().split('T')[0];
            return logDateStr === dateStr;
        });
    };

    const handleDateClick = (day) => {
        const log = getLogForDate(day);
        const [year, month] = currentMonth.split('-');

        if (log) {
            setSelectedDateLog({
                ...log,
                formattedDate: new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })
            });
        } else {
            setSelectedDateLog({
                status: 'Not Taken',
                formattedDate: new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })
            });
        }
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

                {/* MONTH NAVIGATOR */}
                <div className="bg-white p-5 rounded-[2rem] border border-[#DDE3EA] flex items-center justify-between shadow-sm mx-1 mb-6">
                    <button onClick={() => { changeMonth(-1); setSelectedDateLog(null); }} className="p-2 text-slate-400 hover:text-[#42A5F5] transition-colors">
                        <ChevronLeft size={28} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-[#42A5F5]" />
                        <span className="text-[16px] font-bold text-slate-700 italic capitalize">
                            {new Date(currentMonth + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <button onClick={() => { changeMonth(1); setSelectedDateLog(null); }} className="p-2 text-slate-400 hover:text-[#42A5F5] transition-colors">
                        <ChevronRight size={28} />
                    </button>
                </div>

                {/* CALENDAR BOARD */}
                <div className="bg-white rounded-[3.5rem] p-6 md:p-8 shadow-xl border border-[#E2E8F0] mb-8">

                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-black text-slate-400 mb-4 uppercase tracking-widest">
                        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-7 gap-2 md:gap-3">
                        {(() => {
                            const [year, month] = currentMonth.split('-');
                            // Note: JavaScript months are 0-indexed (0 = Jan, 11 = Dec)
                            const firstDay = new Date(year, parseInt(month) - 1, 1);
                            const lastDate = new Date(year, parseInt(month), 0).getDate();

                            let startDay = firstDay.getDay();
                            startDay = startDay === 0 ? 6 : startDay - 1; // Adjust so Monday is column 0

                            const days = [];

                            // Empty cells for alignment
                            for (let i = 0; i < startDay; i++) {
                                days.push(<div key={`empty-${i}`} className="p-4"></div>);
                            }

                            // Actual dates
                            for (let d = 1; d <= lastDate; d++) {
                                const log = getLogForDate(d);

                                let cellStyle = "text-slate-600 bg-slate-50 border border-slate-100 hover:border-[#42A5F5]";
                                let dotColor = "";

                                if (log) {
                                    if (log.status === 'Present') {
                                        cellStyle = "bg-emerald-50 text-emerald-600 border-emerald-200 font-black relative";
                                        dotColor = "bg-emerald-500";
                                    } else if (log.status === 'Absent') {
                                        cellStyle = "bg-rose-50 text-rose-600 border-rose-200 font-black relative";
                                        dotColor = "bg-rose-500";
                                    }
                                }

                                const isSelected = selectedDateLog && parseInt(selectedDateLog.formattedDate.split(' ')[0]) === d;
                                if (isSelected) {
                                    cellStyle += " ring-4 ring-offset-2 ring-blue-300 transform scale-105 z-10 shadow-md";
                                }

                                days.push(
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => handleDateClick(d)}
                                        className={`p-3 md:p-4 rounded-2xl text-sm md:text-base font-black transition-all flex justify-center items-center ${cellStyle}`}
                                    >
                                        {d}
                                        {log && (
                                            <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                                        )}
                                    </button>
                                );
                            }
                            return days;
                        })()}
                    </div>
                </div>

                {/* SELECTED DATE DETAILS CARD */}
                <AnimatePresence>
                    {selectedDateLog && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-6 md:p-8 shadow-2xl border-4 border-blue-50 relative overflow-hidden"
                        >
                            <div className="relative z-10 text-center">
                                <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1">
                                    {selectedDateLog.formattedDate}
                                </p>

                                {selectedDateLog.status === 'Not Taken' ? (
                                    <>
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 mt-4">
                                            <Calendar size={32} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-600 uppercase tracking-wide mb-2">No Record</h2>
                                        <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-2xl inline-block">
                                            Attendance was not registered for this day.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 mt-4 shadow-inner ${selectedDateLog.status === 'Present' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
                                            {selectedDateLog.status === 'Present' ? <CheckCircle size={40} /> : <XCircle size={40} />}
                                        </div>
                                        <h2 className={`text-3xl font-black uppercase tracking-wide mb-2 ${selectedDateLog.status === 'Present' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {selectedDateLog.status}
                                        </h2>
                                        <p className="text-sm font-medium text-slate-400 italic">Verified by EduFlowAI System</p>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StudentAttendance;
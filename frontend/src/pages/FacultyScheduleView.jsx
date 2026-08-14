import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, GraduationCap, CalendarDays } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const FacultyScheduleView = () => {
    const navigate = useNavigate();
    const { empId } = useParams();
    const [scheduleData, setScheduleData] = useState([]);
    const [day, setDay] = useState('Monday');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const { data } = await API.get(`/timetable/admin/teacher-schedule/${empId}`);
                setScheduleData(data.schedule);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [empId]);

    const getDaySchedule = () => {
        const dayData = scheduleData.find(d => d.day === day);
        return dayData ? dayData.periods : [];
    };

    if (loading) return <Loader />;

    const periods = getDaySchedule();
    
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header Area */}
            <div className="bg-[#42A5F5] text-white px-4 md:px-8 pt-10 pb-28 rounded-b-[3rem] shadow-lg relative overflow-visible flex flex-col items-center text-center">
                <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-10 left-4 md:left-8 bg-white/20 p-2.5 rounded-xl border border-white/30 text-white active:scale-90 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                
                {/* <h1 className="text-3xl font-black uppercase tracking-tight italic mt-2">Faculty Timeline</h1> */}
                <p className="text-3xl font-black text-blue-100 uppercase tracking-widest mt-1 italic">EMP ID: {empId}</p>
                {/* Day Scroller */}
                <div className="mt-8 w-full overflow-x-auto scrollbar-hide px-2">
                    <div className="flex gap-2 justify-center min-w-max mx-auto">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                            <button
                                key={d}
                                onClick={() => setDay(d)}
                                className={`px-6 py-3 rounded-[1.5rem] text-[13px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-md ${day === d ? 'bg-white text-[#42A5F5] scale-105' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline Content */}
            <div className="px-5 md:px-8 -mt-12 relative z-20 max-w-3xl mx-auto space-y-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={day}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                    >
                        {periods.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-[3rem] shadow-xl border border-slate-100">
                                <CalendarDays className="mx-auto text-slate-200 mb-4" size={64} />
                                <p className="text-slate-400 font-bold text-[18px] uppercase tracking-widest italic">No classes scheduled for {day}</p>
                            </div>
                        ) : (
                            periods.map((p, index) => (
                                <div key={index} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group hover:border-[#42A5F5] transition-all">
                                    
                                    {/* Accent Line */}
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#42A5F5] rounded-l-[2.5rem]" />

                                    <div className="flex items-center gap-5 ml-2">
                                        <div className="p-4 bg-blue-50 rounded-2xl text-[#42A5F5] shadow-inner text-center min-w-[100px]">
                                            <Clock size={20} className="mx-auto mb-1" />
                                            <div className="text-[12px] font-black uppercase tracking-widest">{p.startTime}</div>
                                            <div className="text-[10px] font-bold text-slate-400">TO</div>
                                            <div className="text-[12px] font-black uppercase tracking-widest">{p.endTime}</div>
                                        </div>
                                        
                                        <div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Teaching</p>
                                            <h3 className="text-[22px] font-black text-slate-800 uppercase italic leading-none">{p.subject}</h3>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col gap-3 md:gap-2 ml-2 md:ml-0 md:text-right">
                                        <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex items-center justify-center gap-2">
                                            <GraduationCap size={16} className="text-[#42A5F5]" />
                                            <span className="text-[14px] font-black uppercase tracking-widest text-slate-700">Class {p.grade}</span>
                                        </div>
                                        <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                                            <MapPin size={16} className="text-emerald-500" />
                                            <span className="text-[14px] font-black uppercase tracking-widest text-emerald-600">Room: {p.room || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FacultyScheduleView;
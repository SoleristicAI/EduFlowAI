import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Map, Users, ArrowLeft, SearchX, CalendarDays, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader';
import api from '../../api';

const RouteAttendanceViewer = () => {
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Calendar States
    const [attendanceData, setAttendanceData] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        fetchRoutes();
    }, []);

    useEffect(() => {
        if (selectedStudent) fetchAttendance();
    }, [selectedStudent, currentMonth]);

    const fetchRoutes = async () => {
        try {
            const res = await api.get('/transport/routes');
            setRoutes(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchStudentsForRoute = async (route) => {
        setSelectedRoute(route);
        setSearchQuery('');
        setIsLoading(true);
        try {
            const res = await api.get(`/transport/routes/${route._id}/students`);
            setStudents(res.data);
        } catch (error) { console.error(error); } 
        finally { setIsLoading(false); }
    };

    const fetchAttendance = async () => {
        try {
            const res = await api.get(`/transport/student-attendance/${selectedStudent._id}?month=${currentMonth}`);
            setAttendanceData(res.data);
        } catch (error) { console.error("Failed to fetch attendance", error); }
    };

    const changeMonth = (offset) => {
        const date = new Date(currentMonth + "-01");
        date.setMonth(date.getMonth() + offset);
        setCurrentMonth(date.toISOString().slice(0, 7));
    };

    const getStatusForDate = (day) => {
        if (!attendanceData?.history) return null;
        const [year, month] = currentMonth.split('-');
        const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
        const logs = attendanceData.history.filter(log => log.date === dateStr);
        if (logs.length === 0) return null;
        const morningLog = logs.find(l => l.tripType === 'MORNING');
        return morningLog ? morningLog.status : logs[0].status; // Priority morning ko
    };

    const handleBack = () => {
        if (selectedStudent) {
            setSelectedStudent(null);
            setAttendanceData(null);
        } else if (selectedRoute) {
            setSelectedRoute(null);
            setSearchQuery('');
        } else {
            navigate(-1);
        }
    };

    const filteredRoutes = routes.filter(r => r.routeName.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const EmptyState = ({ message }) => (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6 shadow-inner"><SearchX size={40} /></div>
            <h3 className="text-xl font-black tracking-wide text-slate-800">Nothing Found</h3>
            <p className="text-[12px] font-bold text-slate-400 tracking-widest mt-2 uppercase">{message}</p>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-40 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-32 rounded-b-[4rem] shadow-xl relative overflow-visible text-center z-20">
                <button onClick={handleBack} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all hover:bg-white/30 active:scale-90 shadow-sm backdrop-blur-md">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black tracking-wide italic px-16">
                    {selectedStudent ? 'Attendance' : 'Checker'}
                </h1>
                <p className="text-[13px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">
                    {selectedStudent ? selectedStudent.name : 'Verify Student Boarding'}
                </p>
            </div>

            <div className="px-5 -mt-20 relative z-30 max-w-5xl mx-auto space-y-6">
                
                {/* View 1 & 2 Header/Search (Hide when viewing calendar) */}
                {!selectedStudent && (
                    <>
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <h2 className="text-[22px] font-extrabold text-slate-800 tracking-wide capitalize">
                                {!selectedRoute ? 'Select a Route' : `Students in ${selectedRoute.routeName}`}
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1.5">
                                {!selectedRoute ? 'Browse all active lines' : 'Select a student to view calendar'}
                            </p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text" 
                                placeholder={!selectedRoute ? "Search routes..." : "Search students..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-14 pr-6 font-bold text-[14px] outline-none focus:border-[#42A5F5]"
                            />
                        </div>
                    </>
                )}

                <AnimatePresence mode="wait">
                    {/* VIEW 1: ROUTES */}
                    {!selectedRoute && !selectedStudent && (
                        <motion.div key="routes" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {filteredRoutes.length === 0 ? <EmptyState message="No route found" /> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredRoutes.map((route) => (
                                        <div key={route._id} onClick={() => fetchStudentsForRoute(route)} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between cursor-pointer hover:border-[#42A5F5] hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-[1.5rem] group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Map size={24} /></div>
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-800">{route.routeName}</h3>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">View Attendance</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* VIEW 2: STUDENTS */}
                    {selectedRoute && !selectedStudent && (
                        <motion.div key="students" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {isLoading ? <div className="text-center py-10"><Loader /></div> : 
                             filteredStudents.length === 0 ? <EmptyState message="No students here" /> : (
                                <div className="space-y-4">
                                    {filteredStudents.map((student) => (
                                        <div key={student._id} onClick={() => setSelectedStudent(student)} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between cursor-pointer hover:border-[#42A5F5] hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <img src={student.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="avatar" className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                                                <div>
                                                    <h3 className="font-black text-[16px] text-slate-800">{student.name}</h3>
                                                    <p className="text-[11px] font-bold text-[#42A5F5] uppercase tracking-widest mt-1">Class: {student.grade}</p>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 bg-slate-50 rounded-full flex justify-center items-center text-slate-400"><CalendarDays size={18} /></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* VIEW 3: STUDENT CALENDAR */}
                    {selectedStudent && (
                        <motion.div key="calendar" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-lg mx-auto">
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[2rem] flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center"><CheckCircle size={24} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Boarded</p>
                                        <p className="text-2xl font-black text-emerald-700">{attendanceData?.presentDays || 0}</p>
                                    </div>
                                </div>
                                <div className="bg-rose-50 border border-rose-100 p-5 rounded-[2rem] flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center"><XCircle size={24} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Missed</p>
                                        <p className="text-2xl font-black text-rose-700">{attendanceData?.absentDays || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[3rem] p-6 shadow-xl border border-[#E2E8F0]">
                                <div className="flex items-center justify-between mb-8 px-2">
                                    <button onClick={() => changeMonth(-1)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-[#42A5F5] hover:text-white"><ChevronLeft size={20} /></button>
                                    <span className="text-[16px] font-black text-slate-800 uppercase tracking-widest">
                                        {new Date(currentMonth + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button onClick={() => changeMonth(1)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-[#42A5F5] hover:text-white"><ChevronRight size={20} /></button>
                                </div>

                                <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">
                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                </div>

                                <div className="grid grid-cols-7 gap-3">
                                    {(() => {
                                        const [year, month] = currentMonth.split('-');
                                        const firstDay = new Date(year, parseInt(month) - 1, 1);
                                        const lastDate = new Date(year, parseInt(month), 0).getDate();

                                        let startDay = firstDay.getDay();
                                        startDay = startDay === 0 ? 6 : startDay - 1; 

                                        const days = [];
                                        for (let i = 0; i < startDay; i++) {
                                            days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                                        }

                                        for (let d = 1; d <= lastDate; d++) {
                                            const status = getStatusForDate(d);
                                            let bgClass = "bg-slate-50 text-slate-400 border border-slate-100";
                                            if (status === 'Present') bgClass = "bg-emerald-50 text-emerald-600 border border-emerald-200 font-black relative";
                                            if (status === 'Absent') bgClass = "bg-rose-50 text-rose-600 border border-rose-200 font-black relative";

                                            days.push(
                                                <div key={d} className={`aspect-square rounded-[1rem] flex justify-center items-center text-[14px] font-bold transition-all ${bgClass}`}>
                                                    {d}
                                                    {status === 'Present' && <div className="absolute bottom-1 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                                                    {status === 'Absent' && <div className="absolute bottom-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></div>}
                                                </div>
                                            );
                                        }
                                        return days;
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RouteAttendanceViewer;
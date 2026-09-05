import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Map, Users, X, ArrowLeft, MapPin, IndianRupee, SearchX, Bus, Phone, GraduationCap, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const RouteStudents = () => {
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchRoutes();
    }, []);

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
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRoutes = routes.filter(r => r.routeName.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const EmptyState = ({ message }) => (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <SearchX size={40} />
            </div>
            <h3 className="text-xl font-black tracking-wide text-slate-800">Nothing Found</h3>
            <p className="text-[12px] font-bold text-slate-400 tracking-widest mt-2 uppercase">{message}</p>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-40 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">

            {/* 🔥 PREMIUM HEADER 🔥 */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-32 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button onClick={() => selectedRoute ? setSelectedRoute(null) : navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all hover:bg-white/30 active:scale-90 shadow-sm backdrop-blur-md">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black tracking-wide italic px-16">Route Directory</h1>
                <p className="text-[13px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Student Boarding Details</p>
            </div>

            <div className="px-5 -mt-20 relative z-20 max-w-5xl mx-auto space-y-6">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
                    <div>
                        <h2 className="text-[22px] font-extrabold text-slate-800 tracking-wide capitalize">
                            {!selectedRoute ? 'All Active Routes' : `${selectedRoute.routeName} Students`}
                        </h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1.5">
                            {!selectedRoute ? 'Select a route to view details' : `${students.length} Students Assigned`}
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder={!selectedRoute ? "Search routes..." : "Search students in this route..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-14 pr-6 font-bold text-[14px] text-slate-700 outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    />
                </div>

                {/* ================= VIEW 1: ROUTE LIST ================= */}
                {!selectedRoute && (
                    filteredRoutes.length === 0 ? <EmptyState message={`No route matching "${searchQuery}"`} /> :
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredRoutes.map((route, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                                    key={route._id} onClick={() => fetchStudentsForRoute(route)}
                                    className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between cursor-pointer hover:border-[#42A5F5] hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 bg-blue-50 text-[#42A5F5] rounded-[1.5rem] group-hover:bg-[#42A5F5] group-hover:text-white transition-colors">
                                            <Map size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg tracking-wide text-slate-800 capitalize">{route.routeName}</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Stops: {route.stops?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-[#42A5F5] transition-colors">
                                        <Users size={18} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                )}

                {/* ================= VIEW 2: STUDENTS IN ROUTE ================= */}
                {selectedRoute && (
                    isLoading ? (
                        <div className="text-center py-20"><div className="w-10 h-10 border-4 border-[#42A5F5] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                    ) : filteredStudents.length === 0 ? (
                        <EmptyState message={searchQuery ? `No student named "${searchQuery}"` : "No students assigned to this route yet."} />
                    ) : (
                        <div className="space-y-4">
                            {filteredStudents.map((student, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                                    key={student._id} onClick={() => setSelectedStudent(student)}
                                    className="p-5 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between cursor-pointer hover:border-[#42A5F5] hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <img src={student.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="avatar" className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                                        <div>
                                            <h3 className="font-black text-[16px] tracking-wide text-slate-800">{student.name}</h3>
                                            <p className="text-[11px] font-bold text-[#42A5F5] uppercase tracking-widest mt-1">Class: {student.grade}</p>
                                        </div>
                                    </div>
                                    <div className="text-right hidden md:block">
                                        <span className="bg-emerald-50 text-emerald-600 font-black text-[10px] px-3 py-1.5 rounded-md uppercase tracking-widest border border-emerald-100">
                                            {student.transportStop?.stopName}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* ================= MODAL: STUDENT DETAILED INFO ================= */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedStudent(null)} />

                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] w-full max-w-md p-8 shadow-2xl z-10">
                            <button onClick={() => setSelectedStudent(null)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={24} /></button>

                            <div className="flex flex-col items-center mb-8">
                                <img src={selectedStudent.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-lg mb-4" />
                                <h2 className="text-2xl font-black tracking-wide text-slate-800 capitalize text-center">{selectedStudent.name}</h2>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {selectedStudent.enrollmentNo}</p>
                            </div>

                            <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#42A5F5] flex items-center justify-center shrink-0"><GraduationCap size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Class</p>
                                        <p className="font-bold text-[14px] text-slate-700">{selectedStudent.grade}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0"><MapPin size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Stop</p>
                                        <p className="font-bold text-[14px] text-slate-700">{selectedStudent.transportStop?.stopName || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center shrink-0"><IndianRupee size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Transport Fee</p>
                                        <p className="font-bold text-[14px] text-slate-700">{selectedStudent.transportStop?.price || 0} / month</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center shrink-0 mt-1"><Compass size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Address</p>
                                        <p className="font-bold text-[13px] text-slate-700 leading-snug">{selectedStudent.address?.fullAddress || 'Address not registered'}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RouteStudents;
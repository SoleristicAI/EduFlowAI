import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, GraduationCap, ChevronRight, Users, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";

const AdminAttendance = () => {
    const navigate = useNavigate();
    const [grades, setGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchGradesWithCounts = async () => {
            try {
                // 🔥 NAYA API CALL JO COUNTS BHI LATA HAI 🔥
                const { data } = await API.get('/users/grades/with-counts');
                setGrades(data);
            } catch (err) { console.error("Grade fetch error"); }
        };
        fetchGradesWithCounts();
    }, []);

    const fetchStudents = async (grade) => {
        if (!grade) return;
        // setLoading(true) hata diya taaki loader na aaye
        try {
            const { data } = await API.get(`/users/students/${grade}`);
            setStudents(data);
        } catch (err) { console.error("Fetch error"); }
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            {/* --- PREMIUM HEADER --- */}
            <div className="bg-gradient-to-br from-[#42A5F5] to-[#1E88E5] text-white px-6 pt-12 pb-32 rounded-b-[4rem] shadow-2xl relative overflow-visible text-center">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-12 left-6 z-[110] bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90 shadow-sm"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="relative z-[100] mt-2">
                    <div className="flex justify-center mb-3">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
                            <GraduationCap size={28} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                        Student Records
                    </h1>
                    <p className="text-[12px] font-black text-blue-100 uppercase tracking-widest mt-2">Select a class to view registry</p>
                </div>
            </div>

            {/* --- HORIZONTAL CLASS CARDS SCROLLER (Replaced Dropdown) --- */}
            <div className="px-2 -mt-16 relative z-20">
                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide px-4">
                    {grades.length > 0 ? grades.map((g, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileTap={{ scale: 0.95 }}
                            key={g.grade}
                            onClick={() => {
                                setSelectedGrade(g.grade);
                                fetchStudents(g.grade);
                            }}
                            className={`min-w-[140px] p-5 rounded-[2rem] border transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                                selectedGrade === g.grade 
                                ? 'bg-[#42A5F5] text-white border-blue-400 shadow-[0_15px_30px_rgba(66,165,245,0.3)]' 
                                : 'bg-white text-slate-700 border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200'
                            }`}
                        >
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">{g.grade}</h3>
                            <div className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                                selectedGrade === g.grade ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#42A5F5]'
                            }`}>
                                <Users size={12} />
                                {g.count} <span className="opacity-70">Enrolled</span>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="w-full text-center py-6 bg-white/50 backdrop-blur-md rounded-3xl border border-white/20 text-white font-bold italic tracking-widest uppercase shadow-sm">
                            Loading classes...
                        </div>
                    )}
                </div>
            </div>

            {/* --- STUDENTS LIST SECTION --- */}
            <div className="px-5 mt-2 space-y-4 relative z-20 max-w-3xl mx-auto">
                {selectedGrade && !loading && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-white p-2 rounded-[2rem] flex items-center border border-slate-200 shadow-inner mb-6"
                    >
                        <Search className="text-slate-400 ml-4" size={20} />
                        <input 
                            type="text" 
                            placeholder={`Search in ${selectedGrade}...`}
                            className="bg-transparent text-slate-700 placeholder-slate-400 outline-none w-full px-4 py-2 font-bold tracking-wider text-[14px] uppercase italic"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </motion.div>
                )}

                {loading ? <Loader /> : (
                    selectedGrade ? (
                        filteredStudents.length > 0 ? (
                            <AnimatePresence>
                                {filteredStudents.map((stu, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={stu._id}
                                        onClick={() => navigate(`/admin/student-report/${stu._id}`)}
                                        className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group shadow-sm hover:shadow-xl ring-1 ring-slate-50 hover:border-[#42A5F5] transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-5">
                                            {stu.avatar ? (
                                                <img
                                                    src={stu.avatar.startsWith('http') ? stu.avatar : `${BASE_URL}${stu.avatar}`}
                                                    alt={stu.name}
                                                    className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-100"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 bg-blue-50 text-[#42A5F5] border border-blue-100 rounded-2xl flex items-center justify-center font-black text-[18px] shadow-sm group-hover:bg-[#42A5F5] group-hover:text-white transition-all duration-300 uppercase italic">
                                                    {stu.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-black text-slate-800 text-[18px] uppercase tracking-tight italic leading-tight group-hover:text-[#42A5F5] transition-colors">{stu.name}</h4>
                                                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic mt-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                    {stu.enrollmentNo}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl text-slate-300 group-hover:text-white group-hover:bg-[#42A5F5] transition-all border border-slate-100 shadow-inner group-hover:shadow-md">
                                            <ChevronRight size={20} />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="text-center py-20 opacity-40">
                                <Search className="mx-auto text-slate-400 mb-4" size={48} />
                                <p className="italic font-black text-[14px] uppercase tracking-[0.2em] text-slate-800">
                                    No records matched
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-24 opacity-30">
                            <LayoutGrid className="mx-auto text-slate-400 mb-6" size={64} />
                            <p className="italic font-black text-[15px] uppercase tracking-[0.3em] text-slate-900">
                                Select a class block above
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default AdminAttendance;
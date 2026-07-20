import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, GraduationCap, ChevronRight, Filter } from 'lucide-react';
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const { data } = await API.get('/users/grades/all');
                setGrades(data);
            } catch (err) { console.error("Grade fetch error"); }
        };
        fetchGrades();
    }, []);

    const fetchStudents = async (grade) => {
        if (!grade) return;
        setLoading(true);
        try {
            const { data } = await API.get(`/users/students/${grade}`);
            setStudents(data);
        } catch (err) { console.error("Fetch error"); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800  overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header Area */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-12 left-6 z-[110] bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>

                <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-8 px-16 relative z-[100]">
                    Student records
                </h1>

                {/* Custom Manual Dropdown in Center */}
                <div className="relative max-w-xs mx-auto z-[110]">
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full bg-white border border-blue-100 p-5 rounded-3xl shadow-lg flex items-center justify-between cursor-pointer active:scale-95 transition-all"
                    >
                        <span className="font-black text-[16px] text-[#42A5F5] uppercase italic">
                            {selectedGrade || "Select class to view students"}
                        </span>
                        <Filter size={18} className="text-[#42A5F5]" />
                    </div>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute left-0 right-0 mt-3 bg-white border border-blue-50 rounded-[2rem] shadow-2xl overflow-hidden z-20"
                                >
                                    {grades.map(g => (
                                        <div
                                            key={g}
                                            onClick={() => {
                                                setSelectedGrade(g);
                                                fetchStudents(g);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="p-5 text-[16px] font-black text-slate-600 uppercase italic hover:bg-blue-50 hover:text-[#42A5F5] transition-all border-b border-slate-50 last:border-none cursor-pointer"
                                        >
                                            {g}
                                        </div>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Students List Container */}
            <div className="px-5 -mt-10 space-y-4 relative z-20">
                {loading ? <Loader /> : (
                    students.length > 0 ? (
                        students.map((stu) => (
                            <div
                                key={stu._id}
                                onClick={() => navigate(`/admin/student-report/${stu._id}`)}
                                className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group shadow-lg ring-1 ring-slate-50 hover:border-blue-200 transition-all active:scale-95 cursor-pointer"
                            >
                                <div className="flex items-center gap-5">
                                    {stu.avatar ? (
                                        <img
                                            src={stu.avatar.startsWith('http') ? stu.avatar : `${BASE_URL}${stu.avatar}`}
                                            alt={stu.name}
                                            className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-100"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 bg-blue-50 text-[#42A5F5] border border-blue-100 rounded-2xl flex items-center justify-center font-black text-[16px] shadow-sm group-hover:bg-[#42A5F5] group-hover:text-white transition-all duration-300">
                                            {stu.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-black text-slate-800 text-[19px] uppercase tracking-tighter italic">{stu.name}</h4>
                                        <p className="text-[15px] font-black text-slate-400 uppercase tracking-widest italic">{stu.enrollmentNo}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-slate-300 group-hover:text-[#42A5F5] transition-all border border-slate-100">
                                    <ChevronRight size={22} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 opacity-30 italic font-black text-[15px] uppercase tracking-[0.3em] text-slate-900">
                            Initialize class selection
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default AdminAttendance;
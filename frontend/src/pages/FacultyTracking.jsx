import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, BookOpen, ChevronRight, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import { motion } from 'framer-motion';

const FacultyTracking = () => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                // Existing route jo sirf teachers laata hai (no finance)
                const { data } = await API.get('/timetable/teachers-list');
                setTeachers(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic px-16">Faculty schedule</h1>
                {/* <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">God's Eye View</p> */}

                {/* Search Bar */}
                <div className="mt-8 px-4 max-w-md mx-auto relative z-10">
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-[2rem] flex items-center border border-white/30 shadow-inner">
                        <Search className="text-white ml-3" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search by Name or EMP ID..." 
                            className="bg-transparent text-white placeholder-blue-100 outline-none w-full px-4 font-bold tracking-widest text-[14px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTeachers.map((teacher, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            key={teacher.employeeId} 
                            onClick={() => navigate(`/admin/faculty-schedule/${teacher.employeeId}`)}
                            className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex items-center justify-between cursor-pointer group hover:border-[#42A5F5] transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-50 rounded-[1.5rem] text-[#42A5F5] group-hover:bg-[#42A5F5] group-hover:text-white transition-colors">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-[20px] font-black text-slate-800 uppercase italic tracking-tight">{teacher.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center text-[15px] font-bold text-slate-600 tracking-widest uppercase">
                                            <Hash size={15} className="mr-0.5"/> {teacher.employeeId}
                                        </span>
                                        {/* <span className="flex items-center text-[11px] font-bold text-[#42A5F5] tracking-widest uppercase bg-blue-50 px-2 py-0.5 rounded-md">
                                            <BookOpen size={12} className="mr-1"/> {teacher.subjects[0] || 'General'}
                                        </span> */}
                                    </div>
                                </div>
                            </div>
                            <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:text-[#42A5F5] transition-colors">
                                <ChevronRight size={20} />
                            </div>
                        </motion.div>
                    ))}
                    {filteredTeachers.length === 0 && (
                        <div className="col-span-full text-center py-10">
                            <p className="text-slate-400 font-bold uppercase tracking-widest">No faculty found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FacultyTracking;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    BookOpen, Users, BookMarked, AlertCircle, 
    ArrowRightLeft, Search, Settings, BarChart3, PlusCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const LibrarianDashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    
    const [stats, setStats] = useState({ 
        totalBooks: 0, 
        availableBooks: 0, 
        issuedBooks: 0, 
        overdueBooks: 0,
        libraryMembers: 0
    });

    const user = JSON.parse(localStorage.getItem('user')) || {};

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchStats();
        return () => clearInterval(timer);
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await API.get('/library/stats');
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch library stats", error);
        } finally {
            setLoading(false);
        }
    };

    const libraryStats = [
        { label: 'Total Books', value: stats.totalBooks.toString(), icon: <BookOpen size={24} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: 'Available Books', value: stats.availableBooks.toString(), icon: <BookMarked size={24} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Active Issues', value: stats.issuedBooks.toString(), icon: <ArrowRightLeft size={24} />, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Overdue Returns', value: stats.overdueBooks.toString(), icon: <AlertCircle size={24} />, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    // 🔥 LIBRARY MODULES GRID 🔥
    const libraryModules = [
        { id: 'issue-return', title: 'Issue & Return', btnText: 'Transact Now', icon: <ArrowRightLeft size={24} />, desc: 'Issue or collect books', iconBg: 'bg-indigo-50 text-indigo-500', btnColor: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200' },
        { id: 'catalogue', title: 'Book Catalogue', btnText: 'Manage Books', icon: <BookOpen size={24} />, desc: 'Add, edit, or search books', iconBg: 'bg-blue-50 text-blue-500', btnColor: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200' },
        { id: 'members', title: 'Library Members', btnText: 'View Members', icon: <Users size={24} />, desc: 'Manage student memberships', iconBg: 'bg-emerald-50 text-emerald-500', btnColor: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' },
        { id: 'overdue', title: 'Overdue Books', btnText: 'Check Defaulters', icon: <AlertCircle size={24} />, desc: 'Track pending returns & fines', iconBg: 'bg-rose-50 text-rose-500', btnColor: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' },
        { id: 'reports', title: 'Library Reports', btnText: 'View Analytics', icon: <BarChart3 size={24} />, desc: 'Transaction history & stats', iconBg: 'bg-cyan-50 text-cyan-500', btnColor: 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-200' },
        { id: 'settings', title: 'Library Settings', btnText: 'Configure', icon: <Settings size={24} />, desc: 'Set fines & loan duration', iconBg: 'bg-slate-100 text-slate-500', btnColor: 'bg-slate-700 hover:bg-slate-800 shadow-slate-200' },
    ];

    return (
        <div className="bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 px-5 pt-6 relative z-10 max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800">Library Engine</h1>
                    <p className="text-[12px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 mt-1">
                        <BookOpen size={16} /> Digital Catalogue Active
                    </p>
                    
                    {/* 🔥 QUICK ACTIONS 🔥 */}
                    <div className="flex flex-wrap items-center gap-3 mt-5">
                        <button onClick={() => navigate('/library/issue')} className="bg-indigo-500 text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all active:scale-95 shrink-0">
                            <PlusCircle size={16} /> Issue Book
                        </button>
                        <button onClick={() => navigate('/library/catalogue')} className="bg-slate-800 text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-slate-700 shadow-md transition-all active:scale-95 shrink-0">
                            <Search size={16} /> Search Catalogue
                        </button>
                    </div>
                </div>
                
                {/* Time Card */}
                <div className="text-left md:text-right bg-white px-6 py-4 rounded-[1.5rem] shadow-sm border border-slate-100">
                    <p className="text-2xl font-black tracking-widest text-slate-800">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                
                {/* 🔥 STATS GRID 🔥 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {libraryStats.map((stat, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} 
                            key={i} 
                            className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner ${stat.bg} ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tighter">
                                {loading ? '...' : stat.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* 🔥 LIBRARY MODULES GRID 🔥 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 mt-8">
                    {libraryModules.map((m, i) => (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                            key={i} 
                            onClick={() => navigate(`/library/${m.id}`)} 
                            className="bg-white rounded-[2rem] p-5 border border-slate-100 flex flex-col items-center text-center cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${m.iconBg}`}>
                                {m.icon}
                            </div>
                            <h4 className="font-black text-slate-800 text-[14px] leading-tight italic tracking-tight mb-2">
                                {m.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-bold italic tracking-tighter leading-snug flex-grow mb-5">
                                {m.desc}
                            </p>
                            <div className={`w-full py-3 rounded-xl text-white font-black text-[11px] uppercase tracking-widest shadow-md transition-all ${m.btnColor}`}>
                                {m.btnText}
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default LibrarianDashboard;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, BookMarked, BookDashed, Search, ScanLine, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LibrarianDashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Placeholder stats (Inko aage chal kar API se connect karenge)
    const [stats, setStats] = useState({ 
        totalBooks: 1250, 
        activeLoans: 342, 
        overdueBooks: 18, 
        registeredMembers: 850 
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const libraryStats = [
        { label: 'Total Books', value: stats.totalBooks.toString(), icon: <BookOpen size={24} />, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Active Loans', value: stats.activeLoans.toString(), icon: <BookMarked size={24} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Overdue Returns', value: stats.overdueBooks.toString(), icon: <BookDashed size={24} />, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'Library Members', value: stats.registeredMembers.toString(), icon: <Users size={24} />, color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    return (
        <div className="bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 px-5 pt-6 relative z-10 max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800">Library Control</h1>
                    <p className="text-[12px] font-black text-[#42A5F5] uppercase tracking-widest flex items-center gap-2 mt-1">
                        <ScanLine size={16} className="animate-pulse" /> Digital Inventory Active
                    </p>
                    
                    {/* 🔥 BUTTONS GROUP 🔥 */}
                    <div className="flex flex-wrap items-center gap-3 mt-5">
                        <button onClick={() => console.log('Issue Book')} className="bg-[#42A5F5] text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all active:scale-95 shrink-0">
                            <BookOpen size={16} /> Issue Book
                        </button>
                        <button onClick={() => console.log('Return Book')} className="bg-emerald-500 text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all active:scale-95 shrink-0">
                            <BookMarked size={16} /> Return Book
                        </button>
                        <button onClick={() => console.log('Inventory')} className="bg-slate-800 text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-slate-700 shadow-md transition-all active:scale-95 shrink-0">
                            <Search size={16} /> Search Inventory
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
                
                {/* 🔥 4 STATS GRID 🔥 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {libraryStats.map((stat, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: i * 0.1 }} 
                            key={i} 
                            className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner ${stat.bg} ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Action / Recent Activity Placeholder */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.4 }} 
                    className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100"
                >
                    <div className="flex justify-between items-center mb-8 px-2">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Recent Transactions</h2>
                        <button className="text-[12px] font-black text-[#42A5F5] uppercase tracking-widest hover:underline flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-full">
                            View All <ArrowRight size={14}/>
                        </button>
                    </div>

                    <div className="py-12 flex flex-col items-center justify-center opacity-40">
                        <BookOpen size={48} className="text-slate-300 mb-4" />
                        <p className="text-slate-500 font-bold text-[14px] uppercase tracking-widest">
                            No recent transactions found.
                        </p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default LibrarianDashboard;
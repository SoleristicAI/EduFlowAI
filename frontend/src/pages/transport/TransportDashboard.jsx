import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Bus, Users, MapPin, Navigation, Clock, ShieldCheck, 
    Activity, AlertTriangle, ArrowRight, RadioReceiver, ScanEye, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TransportDashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // ⚠️ FAKE DATA: This will be replaced by real live data later
    const fleetStats = [
        { label: 'Active Buses', value: '08', icon: <Bus size={28} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Students on Board', value: '342', icon: <Users size={28} />, color: 'text-[#42A5F5]', bg: 'bg-blue-50' },
        { label: 'Emergencies / Alerts', value: '00', icon: <AlertTriangle size={28} />, color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    const activeRoutes = [
        { id: 'BUS-01', route: 'North Sector A', driver: 'Ramesh Singh', eta: '10 mins', status: 'On the Way', passengers: 45, progress: 75 },
        { id: 'BUS-04', route: 'West Sector B', driver: 'Suresh Kumar', eta: 'Arrived', status: 'Journey Finished', passengers: 52, progress: 100 },
        { id: 'BUS-07', route: 'South City Core', driver: 'Vikram Das', eta: '5 mins', status: 'On the Way', passengers: 38, progress: 85 },
    ];

    return (
        <div className="bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 px-5 pt-6 relative z-10 max-w-6xl mx-auto">
            
            {/* 🔥 EASY SUB-HEADER WITH SETTINGS BUTTON 🔥 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800">Live Dashboard</h1>
                    <p className="text-[12px] font-black text-[#42A5F5] uppercase tracking-widest flex items-center gap-2 mt-1">
                        <RadioReceiver size={16} className="animate-pulse" /> Live Bus Tracking
                    </p>
                    
                    {/* 👇🔥 NAYA MANAGE ROUTES BUTTON 🔥👇 */}
                    <button 
                        onClick={() => navigate('/transport/manage')} 
                        className="mt-5 bg-slate-800 text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-slate-700 shadow-md transition-all active:scale-95"
                    >
                        <Settings size={16} /> Manage Buses & Routes
                    </button>
                </div>
                
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {fleetStats.map((stat, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            key={i} 
                            className="bg-white rounded-[2.5rem] p-6 shadow-sm hover:shadow-md border border-slate-100 flex items-center gap-6 transition-shadow"
                        >
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner ${stat.bg} ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-4xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 🔥 LIVE MAP OVERVIEW 🔥 */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                    className="bg-slate-900 rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    
                    <div className="relative z-10 flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-blue-500/20 text-[#42A5F5] rounded-[1.5rem] border border-blue-500/30">
                                <ScanEye size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Map Overview</h2>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Map System (Standby)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full backdrop-blur-md">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">GPS Connected</span>
                        </div>
                    </div>

                    <div className="h-72 md:h-96 w-full bg-slate-800/50 rounded-[2rem] border border-slate-700 relative overflow-hidden flex items-center justify-center shadow-inner">
                        <div className="absolute w-full h-full flex items-center justify-center opacity-30">
                            <div className="w-32 h-32 border border-[#42A5F5] rounded-full animate-ping"></div>
                            <div className="absolute w-64 h-64 border border-[#42A5F5] rounded-full opacity-50"></div>
                            <div className="absolute w-96 h-96 border border-[#42A5F5] rounded-full opacity-20"></div>
                        </div>
                        
                        <motion.div 
                            animate={{ x: [-120, 120, -120], y: [-30, 30, -30] }} 
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className="absolute flex flex-col items-center gap-2 z-20"
                        >
                            <div className="bg-white p-3 rounded-full shadow-lg shadow-[#42A5F5]/30 border-2 border-[#42A5F5]">
                                <Bus size={18} className="text-[#42A5F5]" />
                            </div>
                            <span className="bg-slate-800 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-md border border-slate-600">Bus-01</span>
                        </motion.div>
                        
                        <div className="absolute bottom-6 left-0 right-0 text-center">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] bg-slate-900/80 inline-block px-4 py-2 rounded-full backdrop-blur-md">
                                Waiting for live bus location...
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* 🔥 ACTIVE BUSES LIST 🔥 */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100"
                >
                    <div className="flex justify-between items-center mb-8 px-2">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Active Buses</h2>
                        <button className="text-[12px] font-black text-[#42A5F5] uppercase tracking-widest hover:underline flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-full">
                            View All <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {activeRoutes.map((bus, i) => (
                            <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#42A5F5] transition-colors group">
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-[1.5rem] shadow-sm ${bus.status === 'Journey Finished' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-[#42A5F5]'}`}>
                                        <Bus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 uppercase text-[17px] tracking-tight flex items-center gap-3">
                                            {bus.id} 
                                            <span className={`text-[9px] px-3 py-1 rounded-full tracking-widest ${bus.status === 'Journey Finished' ? 'bg-emerald-50 text-emerald-500 border border-emerald-200' : 'bg-amber-50 text-amber-500 border border-amber-200'}`}>
                                                {bus.status}
                                            </span>
                                        </h3>
                                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                            <Navigation size={12}/> Route: {bus.route}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 md:gap-12 bg-white px-6 py-4 rounded-[1.5rem] shadow-sm border border-slate-100">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Arrival Time</p>
                                        <p className="text-[15px] font-black text-slate-700 uppercase flex items-center justify-center gap-1.5"><Clock size={16} className="text-[#42A5F5]"/> {bus.eta}</p>
                                    </div>
                                    <div className="text-center hidden sm:block">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Students</p>
                                        <p className="text-[15px] font-black text-slate-700 uppercase flex items-center justify-center gap-1.5"><Users size={16} className="text-[#42A5F5]"/> {bus.passengers}</p>
                                    </div>
                                    
                                    {/* Circular Progress Bar */}
                                    <div className="w-14 h-14 rounded-full border-4 border-slate-100 relative flex items-center justify-center bg-slate-50">
                                        <div className="absolute inset-0 rounded-full border-4 border-[#42A5F5]" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${bus.progress}%, 0 ${bus.progress}%)` }}></div>
                                        <span className="text-[11px] font-black text-slate-700">{bus.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default TransportDashboard;
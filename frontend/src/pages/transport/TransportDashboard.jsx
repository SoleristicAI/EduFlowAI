import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bus, Users, Navigation, Clock, AlertTriangle, ArrowRight,MapPin, RadioReceiver, ScanEye, Settings, LocateFixed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const TransportDashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTrips, setActiveTrips] = useState([]); // 🔥 Real Data State
    const [loading, setLoading] = useState(true);

    // Live Clock & API Fetch
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchLiveTrips();
        return () => clearInterval(timer);
    }, []);

   const fetchLiveTrips = async () => {
        try {
            // 🔥 Ab ye theek se backend ko hit karega
            const res = await api.get('/transport/trips/active');
            setActiveTrips(res.data.trips || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch live trips", error);
            // 🔥 Agar api fail hui toh pop-up aayega, silent nahi baithega
            alert("API Error: " + (error.response?.data?.message || error.message)); 
            setLoading(false);
        }
    };

    const fleetStats = [
        { label: 'Active Buses', value: activeTrips.length.toString().padStart(2, '0'), icon: <Bus size={28} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Students on Board', value: '--', icon: <Users size={28} />, color: 'text-[#42A5F5]', bg: 'bg-blue-50' },
        { label: 'Emergencies / Alerts', value: '00', icon: <AlertTriangle size={28} />, color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    return (
        <div className="bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 px-5 pt-6 relative z-10 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800">Live Dashboard</h1>
                    <p className="text-[12px] font-black text-[#42A5F5] uppercase tracking-widest flex items-center gap-2 mt-1">
                        <RadioReceiver size={16} className="animate-pulse" /> Live Bus Tracking
                    </p>
                    
                  {/* 🔥 BUTTONS GROUP 🔥 */}
                    <div className="flex flex-wrap items-center gap-3 mt-5">
                        <button 
                            onClick={() => navigate('/transport/manage')} 
                            className="bg-slate-800 text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-slate-700 shadow-md transition-all active:scale-95 shrink-0"
                        >
                            <Settings size={16} /> Manage Routes
                        </button>

                        <button 
                            onClick={() => navigate('/transport/assign')} 
                            className="bg-[#42A5F5] text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all active:scale-95 shrink-0"
                        >
                            <Users size={16} /> Assign Students
                        </button>

                        {/* 👇 NAYA ROUTE DIRECTORY BUTTON 👇 */}
                        <button 
                            onClick={() => navigate('/transport/route-students')} 
                            className="bg-purple-500 text-white px-5 py-3 rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-purple-600 shadow-md shadow-purple-500/20 transition-all active:scale-95 shrink-0"
                        >
                            <MapPin size={16} /> Route Directory
                        </button>
                    </div>
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
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {fleetStats.map((stat, i) => (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-4xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Map Overview Hero */}
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-slate-900 rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
                   {/* ... (Tera pura map animation wala design exactly waisa hi rahega) ... */}
                   <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    <div className="relative z-10 flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-blue-500/20 text-[#42A5F5] rounded-[1.5rem] border border-blue-500/30"><ScanEye size={28} /></div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Map Overview</h2>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Global Fleet Radar</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 🔥 REAL ACTIVE BUSES LIST 🔥 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8 px-2">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Active Routes</h2>
                        <button onClick={fetchLiveTrips} className="text-[12px] font-black text-[#42A5F5] uppercase tracking-widest hover:underline flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-full">
                            Refresh Data
                        </button>
                    </div>

                    <div className="space-y-4">
                        {loading ? <p className="text-center font-bold text-slate-400">Loading Active Trips...</p> : 
                         activeTrips.length === 0 ? <p className="text-center font-bold text-slate-400">No buses currently active.</p> :
                         activeTrips.map((trip, i) => (
                            <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#42A5F5] transition-colors group cursor-pointer"
                                 onClick={() => navigate('/transport/live-tracking', { 
                                     state: { vehicleId: trip.vehicle?._id, vehicleNumber: trip.vehicle?.vehicleNumber } 
                                 })}>
                                <div className="flex items-center gap-6">
                                    <div className="p-4 rounded-[1.5rem] shadow-sm bg-blue-100 text-[#42A5F5]">
                                        <Bus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 uppercase text-[17px] tracking-tight flex items-center gap-3">
                                            {trip.vehicle?.vehicleNumber || 'Unknown'}
                                            <span className="text-[9px] px-3 py-1 rounded-full tracking-widest bg-emerald-50 text-emerald-500 border border-emerald-200">
                                                LIVE TRACKING
                                            </span>
                                        </h3>
                                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                            <Navigation size={12}/> Route: {trip.route?.routeName || 'Unknown'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 bg-[#42A5F5] text-white px-6 py-4 rounded-[1.5rem] shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform">
                                   <LocateFixed size={18} className="animate-pulse" />
                                    <span className="text-[12px] font-black uppercase tracking-widest">View Map</span>
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
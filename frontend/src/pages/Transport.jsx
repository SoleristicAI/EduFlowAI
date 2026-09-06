import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CalendarDays, Bus, MapPin, User, Phone, CheckCircle, XCircle, ChevronLeft, ChevronRight, Navigation, Maximize2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import API from '../api';
import socketService from '../services/socketService';
import Loader from '../components/Loader';

// Fix Leaflet Icon Issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Bus Icon for Live Tracking
const busIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: 'bus-smooth-glide' // 🔥 YEH NAYI LINE ADD KI HAI
});

const Transport = () => {
    const navigate = useNavigate();
    // 🔥 Naya State Logic: Pehle HOME dikhega 🔥
    const [activeTab, setActiveTab] = useState('HOME'); // 'HOME' | 'ATTENDANCE' | 'BUS'
    const [loading, setLoading] = useState(true);
    const [isMapFullscreen, setIsMapFullscreen] = useState(false); // Map Fullscreen toggle
    
    // Data States
    const [busData, setBusData] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [liveLocation, setLiveLocation] = useState(null);

    useEffect(() => {
        fetchBusDetails();
    }, []);

    useEffect(() => {
        if (activeTab === 'ATTENDANCE') {
            fetchAttendance();
        } else if (activeTab === 'BUS' && busData?.vehicle?._id) {
            startLiveTracking();
        }

        // Cleanup
        if (activeTab !== 'BUS') {
            socketService.offReceiveLocation();
            socketService.disconnect();
        }
        
        return () => {
            socketService.offReceiveLocation();
            socketService.disconnect();
        };
    }, [activeTab, currentMonth, busData]);

    const fetchBusDetails = async () => {
        try {
            const res = await API.get('/transport/student/my-bus');
            setBusData(res.data);
            setLoading(false);
        } catch (error) {
            console.error("No bus assigned", error);
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const res = await API.get(`/transport/student/my-attendance?month=${currentMonth}`);
            setAttendanceData(res.data);
        } catch (error) {
            console.error("Failed to fetch attendance", error);
        }
    };

    const startLiveTracking = () => {
        socketService.connect();
        socketService.joinBusRoom(busData.vehicle._id);
        socketService.onReceiveLocation((data) => {
            setLiveLocation({ lat: data.latitude, lng: data.longitude, speed: data.speed });
        });
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
        return morningLog ? morningLog.status : logs[0].status;
    };

    // 🔥 SMART BACK BUTTON LOGIC 🔥
    const handleBack = () => {
        if (isMapFullscreen) {
            setIsMapFullscreen(false); // Map se wapas chhote page par
        } else if (activeTab !== 'HOME') {
            setActiveTab('HOME'); // Module se wapas buttons par
        } else {
            navigate(-1); // Dashboard par
        }
    };

    if (loading) return <Loader />;

  return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">
            
            {/* 🔥 YE STYLE BUS KO SMOOTHLY GLIDE KARWAYEGA 🔥 */}
            <style>{`
                .bus-smooth-glide {
                    transition: transform 5s linear !important; /* 5 second (location update time) mein smoothly move karegi */
                }
            `}</style>
            
            {/* 🔥 PREMIUM HEADER 🔥 */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative overflow-visible text-center z-20">
                <button onClick={handleBack} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all hover:bg-white/30 active:scale-90 shadow-sm backdrop-blur-md">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black tracking-wide italic px-16">
                    {activeTab === 'HOME' ? 'Transport' : activeTab === 'ATTENDANCE' ? 'Attendance' : 'My Bus'}
                </h1>
                <p className="text-[13px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">
                    {activeTab === 'HOME' ? 'Student Portal' : activeTab === 'ATTENDANCE' ? 'Monthly Record' : 'Live Tracking'}
                </p>
            </div>

            <div className="px-5 -mt-10 relative z-30 max-w-lg mx-auto">
                <AnimatePresence mode="wait">
                    
                    {/* ==================== HOME TAB: 2 FULL-WIDTH BUTTONS ==================== */}
                    {activeTab === 'HOME' && (
                        <motion.div 
                            key="home" 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} 
                            className="flex flex-col justify-center w-full pt-10 pb-10 px-2 gap-6"
                        >
                            <button 
                                onClick={() => setActiveTab('ATTENDANCE')}
                                className="w-full py-10 bg-blue-50 border-2 border-blue-200 rounded-[3rem] shadow-lg flex flex-col items-center justify-center gap-4 hover:bg-blue-100 hover:border-blue-300 hover:-translate-y-1 active:scale-95 transition-all"
                            >
                                <div className="bg-white p-5 rounded-full shadow-md text-[#42A5F5]">
                                    <CalendarDays size={40} />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[14px] text-[#42A5F5]">Bus Attendance Record</span>
                            </button>
                            
                            <button 
                                onClick={() => setActiveTab('BUS')}
                                className="w-full py-10 bg-emerald-50 border-2 border-emerald-200 rounded-[3rem] shadow-lg flex flex-col items-center justify-center gap-4 hover:bg-emerald-100 hover:border-emerald-300 hover:-translate-y-1 active:scale-95 transition-all"
                            >
                                <div className="bg-white p-5 rounded-full shadow-md text-emerald-500">
                                    <Bus size={40} />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[14px] text-emerald-500">Track My Bus</span>
                            </button>
                        </motion.div>
                    )}

                    {/* ==================== TAB 1: ATTENDANCE CALENDAR ==================== */}
                    {activeTab === 'ATTENDANCE' && (
                        <motion.div key="attendance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                            
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border-2 border-emerald-100 p-5 rounded-[2rem] flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0"><CheckCircle size={24} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Present Days</p>
                                        <p className="text-2xl font-black text-emerald-600">{attendanceData?.presentDays || 0}</p>
                                    </div>
                                </div>
                                <div className="bg-white border-2 border-rose-100 p-5 rounded-[2rem] flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shrink-0"><XCircle size={24} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absent Days</p>
                                        <p className="text-2xl font-black text-rose-600">{attendanceData?.absentDays || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Calendar */}
                            <div className="bg-white rounded-[3rem] p-6 shadow-xl border border-[#E2E8F0]">
                                <div className="flex items-center justify-between mb-8 px-2">
                                    <button onClick={() => changeMonth(-1)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-[#42A5F5] hover:text-white transition-colors"><ChevronLeft size={20} /></button>
                                    <span className="text-[16px] font-black text-slate-800 uppercase tracking-widest">
                                        {new Date(currentMonth + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button onClick={() => changeMonth(1)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-[#42A5F5] hover:text-white transition-colors"><ChevronRight size={20} /></button>
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

                    {/* ==================== TAB 2: MY BUS DETAILS & LIVE MAP ==================== */}
                    {activeTab === 'BUS' && (
                        <motion.div key="bus" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            
                            {!busData ? (
                                <div className="bg-white rounded-[3rem] p-10 text-center shadow-xl border border-slate-100 mt-10">
                                    <div className="w-24 h-24 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <XCircle size={40} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-wide uppercase">No Bus Assigned</h2>
                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-2">Please contact administration.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Bus & Driver Details Card */}
                                    <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 bg-blue-50 text-[#42A5F5] rounded-full flex items-center justify-center shadow-inner shrink-0 border-2 border-white"><Bus size={32} /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Vehicle</p>
                                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide">{busData.vehicle?.vehicleNumber}</h2>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                                            <div className="flex items-center gap-4 bg-white p-3 rounded-[1rem] shadow-sm">
                                                <div className="w-10 h-10 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center shrink-0"><User size={18} /></div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Driver Name</p>
                                                    <p className="text-[14px] font-black text-slate-700 capitalize">{busData.driver?.name || 'Unknown'}</p>
                                                </div>
                                                <a href={`tel:${busData.driver?.phone}`} className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all"><Phone size={16} /></a>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 bg-white p-3 rounded-[1rem] shadow-sm">
                                                <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0"><MapPin size={18} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Stop</p>
                                                    <p className="text-[14px] font-black text-slate-700 uppercase">{busData.stop?.stopName || 'Not Assigned'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SMALL MAP PREVIEW (Click to Fullscreen) */}
                                    <div 
                                        className="bg-white rounded-[2.5rem] p-4 shadow-xl border border-slate-100 h-80 relative overflow-hidden flex flex-col group cursor-pointer"
                                        onClick={() => liveLocation && setIsMapFullscreen(true)}
                                    >
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-[13px] flex items-center gap-2">
                                                <Navigation size={16} className="text-[#42A5F5]" /> Live Map
                                            </h3>
                                            {liveLocation ? (
                                                <span className="bg-emerald-50 text-emerald-500 text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live</span>
                                            ) : (
                                                <span className="bg-slate-50 text-slate-400 text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-slate-100">Waiting for GPS...</span>
                                            )}
                                        </div>

                                        <div className="flex-1 rounded-[1.5rem] overflow-hidden border border-slate-100 bg-slate-50 relative pointer-events-none">
                                            {/* OVERLAY FOR CLICK TO FULLSCREEN */}
                                            {liveLocation && (
                                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-white text-slate-800 p-4 rounded-full shadow-2xl flex items-center gap-2">
                                                        <Maximize2 size={20} className="text-[#42A5F5]" />
                                                        <span className="font-black uppercase text-[11px] tracking-widest">Tap for Fullscreen</span>
                                                    </div>
                                                </div>
                                            )}

                                            {liveLocation ? (
                                                <MapContainer center={[liveLocation.lat, liveLocation.lng]} zoom={18} maxZoom={22} scrollWheelZoom={false} zoomControl={false} dragging={false} className="h-full w-full z-0">
                                                {/* 🔥 GOOGLE SATELLITE HYBRID LAYER (Map + Labels) 🔥 */}
                                                <TileLayer 
                                                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
                                                    attribution='&copy; Google Maps Satellite' 
                                                    maxZoom={22}
                                                    maxNativeZoom={20} 
                                                />
                                                <Marker position={[liveLocation.lat, liveLocation.lng]} icon={busIcon} />
                                            </MapContainer>
                                            ) : (
                                                <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-slate-100/50">
                                                    <MapPin size={40} className="text-slate-300 mb-4 animate-bounce" />
                                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Bus GPS Offline</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Tracking will start when driver begins the trip.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ==================== FULLSCREEN MAP MODAL ==================== */}
            <AnimatePresence>
                {isMapFullscreen && liveLocation && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} 
                        className="fixed inset-0 z-[999] bg-white flex flex-col"
                    >
                        <div className="absolute top-10 left-6 z-[1000]">
                            <button onClick={() => setIsMapFullscreen(false)} className="bg-white p-4 rounded-2xl shadow-xl text-slate-800 active:scale-90 transition-all border border-slate-100">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="absolute top-12 left-0 right-0 z-[900] pointer-events-none flex justify-center">
                            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-slate-100 pointer-events-auto">
                                <span className="font-black text-slate-800 uppercase tracking-widest text-[12px] flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> Live Tracking
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 w-full h-full">
                          <MapContainer center={[liveLocation.lat, liveLocation.lng]} zoom={18} maxZoom={22} scrollWheelZoom={true} className="h-full w-full z-0">
                                {/* 🔥 GOOGLE SATELLITE HYBRID LAYER (Map + Labels) 🔥 */}
                                <TileLayer 
                                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
                                    attribution='&copy; Google Maps Satellite' 
                                    maxZoom={22}
                                    maxNativeZoom={20}
                                />
                                <Marker position={[liveLocation.lat, liveLocation.lng]} icon={busIcon}>
                                    <Popup>
                                        <div className="text-center font-sans italic">
                                            <p className="font-black text-slate-800 text-[14px] uppercase">{busData?.vehicle?.vehicleNumber}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Speed: {(liveLocation.speed * 3.6).toFixed(1)} km/h</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Transport;
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import socketService from '../../services/socketService';
import { ArrowLeft, Activity, Navigation, RadioReceiver } from 'lucide-react';

// 🔥 Auto-Center Map Logic
const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.setView([lat, lng], 16);
    }, [lat, lng, map]);
    return null;
};

const busIcon = new L.DivIcon({
    html: `<div style="background-color: #10B981; padding: 10px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19 6 17.8 6H6c-1.2 0-2.3.8-2.6 1.8L2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
           </div>`,
    className: 'bus-smooth-glide', // 🔥 YEH LINE ADD KAR
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const LiveTracking = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { vehicleId, vehicleNumber } = location.state || {};

    const [busLocation, setBusLocation] = useState(null); // { lat, lng }
    const [speed, setSpeed] = useState(0);

    useEffect(() => {
        if (!vehicleId) {
            navigate('/transport'); // Agar direct URL khola toh wapas bhej do
            return;
        }

        // 1. Socket Connect & Join Room
        socketService.connect();
        socketService.joinBusRoom(vehicleId);

        // 2. Listen for Location Updates
        socketService.onReceiveLocation((data) => {
            setBusLocation({ lat: data.latitude, lng: data.longitude });
            setSpeed(data.speed ? (data.speed * 3.6).toFixed(1) : 0); // m/s to km/h
        });

        return () => {
            socketService.offReceiveLocation();
            socketService.disconnect();
        };
    }, [vehicleId, navigate]);

    return (
        <div className="bg-[#F8FAFC] min-h-screen font-sans italic text-slate-800 p-6 relative">
            
            {/* 🔥 CSS FOR SMOOTH BUS GLIDING 🔥 */}
            <style>{`
                .bus-smooth-glide { transition: transform 5s linear !important; }
            `}</style>
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm mb-6 border border-slate-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Live Map</h1>
                        <p className="text-[11px] font-black text-[#42A5F5] uppercase tracking-widest flex items-center gap-2">
                            Bus: {vehicleNumber || 'Unknown'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                    <RadioReceiver size={14} className="text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                        {busLocation ? 'Signal Active' : 'Connecting...'}
                    </span>
                </div>
            </div>

           {/* Map Container */}
            <div className="h-[70vh] bg-slate-200 rounded-[3rem] overflow-hidden border-4 border-white shadow-xl relative">
                {!busLocation ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/5 backdrop-blur-sm z-[400]">
                        <div className="w-16 h-16 border-4 border-[#42A5F5] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="text-slate-500 font-bold uppercase tracking-widest text-[12px]">Connecting to Satellite...</h3>
                    </div>
                ) : (
                    <MapContainer center={[busLocation.lat, busLocation.lng]} zoom={18} maxZoom={22} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        {/* 🔥 GOOGLE SATELLITE HYBRID LAYER 🔥 */}
                        <TileLayer 
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
                            attribution='&copy; Google Maps Satellite'
                            maxZoom={22}
                            maxNativeZoom={20}
                        />
                        <Marker position={[busLocation.lat, busLocation.lng]} icon={busIcon} />
                        <RecenterMap lat={busLocation.lat} lng={busLocation.lng} />
                    </MapContainer>
                )}

                {/* Speed Overlay Floating Card */}
                {busLocation && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur-md px-8 py-4 rounded-[2rem] shadow-2xl border border-slate-100 flex items-center gap-6">
                        <div className="p-3 bg-emerald-100 rounded-full text-emerald-500">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Speed</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tighter">{speed} <span className="text-sm font-bold text-slate-500">km/h</span></p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveTracking;
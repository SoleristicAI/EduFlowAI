import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Bus, Map, Plus, Trash2, X, Edit3, Save, Navigation,
    Users, Calendar, Clock, MapPin, IndianRupee, AlertCircle, ChevronDown, Check, User, Phone, Search, Eye, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';

// --- CUSTOM ANIMATED DROPDOWN ---
const CustomDropdown = ({ options, value, onChange, placeholder, icon: Icon, className = "", direction = "down" }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`relative z-20 ${className}`}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] border transition-all cursor-pointer bg-white ${isOpen ? "border-[#42A5F5] ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-300"
                    }`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {Icon && <Icon size={20} className={value ? "text-[#42A5F5] shrink-0" : "text-slate-400 shrink-0"} />}
                    <span className={`text-[14px] font-bold uppercase tracking-widest truncate ${value ? "text-slate-800" : "text-slate-400"}`}>
                        {value || placeholder}
                    </span>
                </div>
                <ChevronDown size={20} className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#42A5F5]" : ""}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            // 🔥 Yahan animation direction update hui hai
                            initial={{ opacity: 0, y: direction === 'up' ? 10 : -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: direction === 'up' ? 10 : -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            // 🔥 Yahan Check lagaya ki Upar kholna hai ya Neeche
                            className={`absolute left-0 right-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden ${direction === 'up' ? 'bottom-[105%]' : 'top-[105%]'}`}
                        >
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {options.map((option) => (
                                    <div
                                        key={option}
                                        onClick={() => { onChange(option); setIsOpen(false); }}
                                        className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-all hover:bg-blue-50 ${value === option ? "bg-blue-50 text-[#42A5F5]" : "text-slate-700"
                                            }`}
                                    >
                                        <span className="font-bold text-[14px] uppercase tracking-widest">{option}</span>
                                        {value === option && <Check size={18} />}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const ManageFleet = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('DRIVERS'); // Tabs: 'DRIVERS', 'VEHICLES', 'ROUTES'
    const [msg, setMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data States
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [busSearch, setBusSearch] = useState('');

    // Modal States
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [showBusModal, setShowBusModal] = useState(false);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: '', name: '' });

    // Forms
    const [driverForm, setDriverForm] = useState({
        name: '', phone: '', address: '', dob: '', gender: '',
        email: '', customId: '', password: '', confirmPassword: ''
    });

    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [busForm, setBusForm] = useState({ vehicleNumber: '', seatingCapacity: '', driverId: '' });
    const [routeForm, setRouteForm] = useState({ routeName: '', vehicleId: '', stops: [{ stopName: '', monthlyFee: '', pickupHour: '08', pickupMin: '00', pickupMeridiem: 'AM', dropHour: '02', dropMin: '00', dropMeridiem: 'PM' }] });

    // Edit States
    const [editDriverId, setEditDriverId] = useState(null);
    const [editBusId, setEditBusId] = useState(null);
    const [editRouteId, setEditRouteId] = useState(null);

    const [driverSearch, setDriverSearch] = useState('');
    const [routeSearch, setRouteSearch] = useState('');

    // Calendar States for DOB
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(1990, 0, 1));
    const dateRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateRef.current && !dateRef.current.contains(event.target)) setIsDateOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDateStr = (dateStr) => {
        if (!dateStr) return "Select Date";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const diff = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [driverRes, vehRes, routeRes] = await Promise.all([
                API.get('/transport/drivers'),
                API.get('/transport/vehicles'),
                API.get('/transport/routes')
            ]);
            setDrivers(driverRes.data);
            setVehicles(vehRes.data);
            setRoutes(routeRes.data);
        } catch (error) {
            setMsg("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 🔥 DRIVER HANDLERS 🔥
    // ==========================================
   const openEditDriverModal = (drv) => {
        setDriverForm({
            name: drv.name, 
            phone: drv.phone, 
            address: drv.address?.fullAddress || '', 
            dob: drv.dob || '', 
            gender: drv.gender || '',
            email: drv.email || '', // 👈 NAYI LINE
            customId: drv.customId || ''
        });
        if(drv.dob) setViewDate(new Date(drv.dob));
        setEditDriverId(drv._id);
        setShowDriverModal(true);
    };

   const handleSaveDriver = async (e) => {
        e.preventDefault();
        if (!driverForm.dob) return setMsg("Please select Date of Birth! ⚠️");

        // 👇🔥 NAYA PASSWORD MATCH CHECK 🔥👇
        if (!editDriverId && driverForm.password !== driverForm.confirmPassword) {
            return setMsg("Passwords do not match! ⚠️");
        }

        setIsSubmitting(true);
        try {
            if (editDriverId) {
                await API.put(`/transport/drivers/${editDriverId}`, driverForm);
                setMsg("Driver updated successfully! ✅");
            } else {
                await API.post('/transport/drivers', driverForm);
                setMsg("Driver added successfully! 👤");
            }
            setShowDriverModal(false);
            setEditDriverId(null);
            
            // 👇🔥 NAYI LINE: YAHAN SAARE NAYE FIELDS BHI KHALI (RESET) KARNE HAIN 🔥👇
            setDriverForm({ 
                name: '', phone: '', address: '', dob: '', gender: '', 
                email: '', customId: '', password: '', confirmPassword: '' 
            });
            
            fetchData();
        } catch (error) {
            setMsg(error.response?.data?.message || "Failed to save driver.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // 🔥 BUS HANDLERS
    // ==========================================
    const openEditBusModal = (bus) => {
        setBusForm({
            vehicleNumber: bus.vehicleNumber,
            seatingCapacity: bus.seatingCapacity,
            driverId: bus.driver ? bus.driver._id : ''
        });
        setEditBusId(bus._id);
        setShowBusModal(true);
    };

    const handleSaveBus = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editBusId) {
                await API.put(`/transport/vehicles/${editBusId}`, busForm);
                setMsg("Bus updated successfully! ✅");
            } else {
                await API.post('/transport/vehicles', busForm);
                setMsg("Bus added successfully! 🚌");
            }
            setShowBusModal(false);
            setEditBusId(null);
            setBusForm({ vehicleNumber: '', seatingCapacity: '', driverId: '' });
            fetchData();
        } catch (error) {
            setMsg(error.response?.data?.message || "Failed to save bus.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // 🔥 ROUTE HANDLERS
    // ==========================================
    const openEditRouteModal = (route) => {
        const parsedStops = route.stops.map(s => {
            let pHour = '08', pMin = '00', pMer = 'AM';
            if (s.pickupTime) {
                const parts = s.pickupTime.split(' ');
                const timeParts = parts[0].split(':');
                pHour = timeParts[0] || '08';
                pMin = timeParts[1] || '00';
                pMer = parts[1] || 'AM';
            }
            let dHour = '02', dMin = '00', dMer = 'PM';
            if (s.dropTime) {
                const parts = s.dropTime.split(' ');
                const timeParts = parts[0].split(':');
                dHour = timeParts[0] || '02';
                dMin = timeParts[1] || '00';
                dMer = parts[1] || 'PM';
            }
            return {
                stopName: s.stopName, monthlyFee: s.monthlyFee,
                pickupHour: pHour, pickupMin: pMin, pickupMeridiem: pMer,
                dropHour: dHour, dropMin: dMin, dropMeridiem: dMer
            };
        });

        setRouteForm({ routeName: route.routeName, vehicleId: route.vehicle ? route.vehicle._id : '', stops: parsedStops });
        setEditRouteId(route._id);
        setShowRouteModal(true);
    };

    const timeToMinutes = (hour, min, meridiem) => {
        let h = parseInt(hour, 10);
        const m = parseInt(min, 10);
        if (meridiem === 'PM' && h !== 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    };

    const handleAddStop = () => setRouteForm({ ...routeForm, stops: [...routeForm.stops, { stopName: '', monthlyFee: '', pickupHour: '08', pickupMin: '00', pickupMeridiem: 'AM', dropHour: '02', dropMin: '00', dropMeridiem: 'PM' }] });
    const handleRemoveStop = (index) => setRouteForm({ ...routeForm, stops: routeForm.stops.filter((_, i) => i !== index) });
    const handleStopChange = (index, field, value) => {
        const newStops = [...routeForm.stops];
        newStops[index][field] = value;
        setRouteForm({ ...routeForm, stops: newStops });
    };

    const handleCreateRoute = async (e) => {
        e.preventDefault();
        if (routeForm.stops.length === 0) return setMsg("Please add at least one stop! ⚠️");

        const formattedStops = routeForm.stops.map(s => ({
            stopName: s.stopName, monthlyFee: s.monthlyFee,
            pickupTime: `${s.pickupHour}:${s.pickupMin} ${s.pickupMeridiem}`,
            dropTime: `${s.dropHour}:${s.dropMin} ${s.dropMeridiem}`,
            sortVal: timeToMinutes(s.pickupHour, s.pickupMin, s.pickupMeridiem)
        })).sort((a, b) => a.sortVal - b.sortVal);

        const payload = { routeName: routeForm.routeName, vehicleId: routeForm.vehicleId, stops: formattedStops };

        setIsSubmitting(true);
        try {
            if (editRouteId) {
                await API.put(`/transport/routes/${editRouteId}`, payload);
                setMsg("Route updated successfully! ✅");
            } else {
                await API.post('/transport/routes', payload);
                setMsg("New route created successfully! ✅");
            }
            setShowRouteModal(false);
            setEditRouteId(null);
            setRouteForm({ routeName: '', vehicleId: '', stops: [{ stopName: '', monthlyFee: '', pickupHour: '08', pickupMin: '00', pickupMeridiem: 'AM', dropHour: '02', dropMin: '00', dropMeridiem: 'PM' }] });
            fetchData();
        } catch (error) {
            setMsg(error.response?.data?.message || "Failed to save route.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        setIsSubmitting(true);
        try {
            if (deleteConfirm.type === 'DRIVER') await API.delete(`/transport/drivers/${deleteConfirm.id}`);
            else if (deleteConfirm.type === 'VEHICLE') await API.delete(`/transport/vehicles/${deleteConfirm.id}`);
            else await API.delete(`/transport/routes/${deleteConfirm.id}`);

            setMsg(`${deleteConfirm.type} deleted successfully! 🗑️`);
            setDeleteConfirm({ show: false, type: '', id: '', name: '' });
            fetchData();
        } catch (error) {
            setMsg(error.response?.data?.message || "Cannot delete! It is assigned somewhere.");
            setDeleteConfirm({ show: false, type: '', id: '', name: '' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter Logic for Dropdowns (Don't hide currently assigned driver/bus while editing)
    const assignedDriverIds = vehicles.filter(v => !editBusId || v._id !== editBusId).map(v => v.driver?._id).filter(Boolean);
    const availableDrivers = drivers.filter(d => !assignedDriverIds.includes(d._id));

    const assignedVehicleIds = routes.filter(r => !editRouteId || r._id !== editRouteId).map(r => r.vehicle?._id).filter(Boolean);
    const availableVehicles = vehicles.filter(v => !assignedVehicleIds.includes(v._id));

    const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
    const meridiemList = ['AM', 'PM'];

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">

            {/* Header */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-32 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic px-16">Setup Manager</h1>
                <p className="text-[13px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Drivers, Buses & Routes</p>
            </div>

            <div className="px-5 -mt-20 relative z-20 max-w-5xl mx-auto space-y-6">

                {/* 3 TABS */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-2 rounded-full shadow-lg border border-slate-100 flex gap-2 w-full max-w-2xl relative">
                        <button onClick={() => setActiveTab('DRIVERS')} className={`flex-1 py-4 rounded-full font-black uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-2 z-10 ${activeTab === 'DRIVERS' ? 'text-white' : 'text-slate-400 hover:text-[#42A5F5]'}`}>
                            <Users size={18} /> Drivers
                        </button>
                        <button onClick={() => setActiveTab('VEHICLES')} className={`flex-1 py-4 rounded-full font-black uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-2 z-10 ${activeTab === 'VEHICLES' ? 'text-white' : 'text-slate-400 hover:text-[#42A5F5]'}`}>
                            <Bus size={18} /> Buses
                        </button>
                        <button onClick={() => setActiveTab('ROUTES')} className={`flex-1 py-4 rounded-full font-black uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-2 z-10 ${activeTab === 'ROUTES' ? 'text-white' : 'text-slate-400 hover:text-[#42A5F5]'}`}>
                            <Map size={18} /> Routes
                        </button>
                        <div className={`absolute top-2 bottom-2 w-[calc(33.33%-8px)] bg-[#42A5F5] rounded-full shadow-md transition-all duration-300 ease-out z-0 ${activeTab === 'DRIVERS' ? 'left-2' : activeTab === 'VEHICLES' ? 'left-[33.33%]' : 'left-[calc(66.66%-2px)]'}`}></div>
                    </div>
                </div>

                {/* TAB 1: DRIVERS */}
                {activeTab === 'DRIVERS' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Drivers List</h2>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Drivers: {drivers.length}</p>
                            </div>
                            <button onClick={() => { setEditDriverId(null); setDriverForm({ name: '', phone: '', address: '', dob: '', gender: '' }); setShowDriverModal(true); }} className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-5 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-[13px] flex items-center gap-2 hover:bg-indigo-500 hover:text-white transition-all shadow-sm">
                                <Plus size={18} /> Add Driver
                            </button>
                        </div>

                        <div className="relative">
                            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search driver by name or phone number..."
                                value={driverSearch}
                                onChange={(e) => setDriverSearch(e.target.value)}
                                className="w-full bg-white border border-slate-200 py-4 pl-14 pr-6 rounded-[2rem] outline-none text-slate-700 font-bold text-[14px] focus:border-[#42A5F5] transition-all shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {drivers.filter(drv => drv.name.toLowerCase().includes(driverSearch.toLowerCase()) || drv.phone.includes(driverSearch)).map((drv) => (
                                <div key={drv._id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between items-start gap-4">
                                    <div className="flex w-full justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">{drv.name}</h3>
                                                <p className="text-[12px] font-bold text-slate-500 uppercase flex items-center gap-2 mt-1">
                                                    <span>{drv.phone}</span> • <span className="text-emerald-500">Age: {calculateAge(drv.dob)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEditDriverModal(drv)} className="p-3 text-[#42A5F5] bg-blue-50 rounded-2xl hover:bg-[#42A5F5] hover:text-white transition-colors border border-blue-100">
                                                <Edit3 size={20} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm({ show: true, type: 'DRIVER', id: drv._id, name: drv.name })} className="p-3 text-rose-500 bg-rose-50 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-100">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* TAB 2: BUSES */}
                {activeTab === 'VEHICLES' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">School Buses</h2>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Buses: {vehicles.length}</p>
                            </div>
                            <button onClick={() => { setEditBusId(null); setBusForm({ vehicleNumber: '', seatingCapacity: '', driverId: '' }); setShowBusModal(true); }} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-5 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-[13px] flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                <Plus size={18} /> Add New Bus
                            </button>
                        </div>

                        <div className="relative">
                            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by bus number or driver name..."
                                value={busSearch}
                                onChange={(e) => setBusSearch(e.target.value)}
                                className="w-full bg-white border border-slate-200 py-4 pl-14 pr-6 rounded-[2rem] outline-none text-slate-700 font-bold text-[14px] focus:border-[#42A5F5] transition-all shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {vehicles.filter(bus =>
                                bus.vehicleNumber.toLowerCase().includes(busSearch.toLowerCase()) ||
                                (bus.driver && bus.driver.name.toLowerCase().includes(busSearch.toLowerCase()))
                            ).map((bus) => (
                                <div key={bus._id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between items-start gap-4 hover:border-[#42A5F5] transition-colors group">
                                    <div className="flex w-full justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-blue-50 text-[#42A5F5] rounded-[1.5rem] group-hover:bg-[#42A5F5] group-hover:text-white transition-colors">
                                                <Bus size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">{bus.vehicleNumber}</h3>
                                                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-emerald-50 rounded-md inline-block mt-1 border border-emerald-100">Capacity: {bus.seatingCapacity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEditBusModal(bus)} className="p-3 text-[#42A5F5] bg-blue-50 rounded-2xl hover:bg-[#42A5F5] hover:text-white transition-colors border border-blue-100">
                                                <Edit3 size={20} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm({ show: true, type: 'VEHICLE', id: bus._id, name: bus.vehicleNumber })} className="p-3 text-rose-500 bg-rose-50 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-100">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[12px] font-bold text-slate-500 flex items-center gap-1 border-t border-slate-100 pt-3 w-full">
                                        <User size={14} /> Driver: <span className="text-slate-800 ml-1">{bus.driver ? bus.driver.name : 'No Driver Assigned'}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* TAB 3: ROUTES */}
                {activeTab === 'ROUTES' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Bus Routes</h2>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Routes: {routes.length}</p>
                            </div>
                            <button onClick={() => { setEditRouteId(null); setRouteForm({ routeName: '', vehicleId: '', stops: [{ stopName: '', monthlyFee: '', pickupHour: '08', pickupMin: '00', pickupMeridiem: 'AM', dropHour: '02', dropMin: '00', dropMeridiem: 'PM' }] }); setShowRouteModal(true); }} className="bg-[#42A5F5] text-white px-5 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-[13px] flex items-center gap-2 hover:bg-blue-600 shadow-lg transition-all">
                                <Plus size={18} /> Create New Route
                            </button>
                        </div><div className="relative">
                            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search route by name..."
                                value={routeSearch}
                                onChange={(e) => setRouteSearch(e.target.value)}
                                className="w-full bg-white border border-slate-200 py-4 pl-14 pr-6 rounded-[2rem] outline-none text-slate-700 font-bold text-[14px] focus:border-[#42A5F5] transition-all shadow-sm"
                            />
                        </div>



                        <div className="grid grid-cols-1 gap-5">
                            {routes.filter(route => route.routeName.toLowerCase().includes(routeSearch.toLowerCase())).map((route) => (
                                <div key={route._id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-indigo-50 text-indigo-500 rounded-[1.5rem]">
                                                <Navigation size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">{route.routeName}</h3>

                                                {/* 🔥 Bus & Driver Details Logic 🔥 */}
                                                {(() => {
                                                    // Route se bus match karwa ke uska driver nikala
                                                    const fullBus = vehicles.find(v => v._id === (route.vehicle?._id || route.vehicle));
                                                    const driver = fullBus?.driver;

                                                    return (
                                                        <div className="flex flex-col gap-1.5 mt-1">
                                                            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                                <Bus size={14} className="text-[#42A5F5]" />
                                                                Assigned Bus: <span className="text-slate-800">{route.vehicle ? route.vehicle.vehicleNumber : 'Not Assigned'}</span>
                                                            </p>

                                                            {/* Agar is bus ka driver hai, toh uska naam aur Call button dikhao */}
                                                            {driver && (
                                                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                                    <User size={14} className="text-emerald-500" />
                                                                    Driver: <span className="text-slate-800">{driver.name}</span>
                                                                    <span className="mx-1">•</span>
                                                                    <a href={`tel:${driver.phone}`} className="text-[#42A5F5] hover:text-blue-600 hover:underline flex items-center gap-1 transition-all">
                                                                        <Phone size={12} className="animate-pulse" /> {driver.phone}
                                                                    </a>
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEditRouteModal(route)} className="p-3 text-[#42A5F5] bg-blue-50 rounded-2xl hover:bg-[#42A5F5] hover:text-white transition-colors border border-blue-100 flex items-center justify-center">
                                                <Edit3 size={20} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm({ show: true, type: 'ROUTE', id: route._id, name: route.routeName })} className="p-3 text-rose-500 bg-rose-50 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-100 flex items-center justify-center">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pl-6 border-l-2 border-slate-200 ml-6 space-y-4">
                                        {route.stops.map((stop, idx) => (
                                            <div key={idx} className="relative bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                <div className="absolute w-4 h-4 bg-white border-4 border-[#42A5F5] rounded-full -left-[1.6rem] top-1/2 -translate-y-1/2"></div>
                                                <div>
                                                    <p className="font-black text-slate-700 uppercase tracking-widest text-[14px]">{stop.stopName}</p>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1 text-emerald-500"><IndianRupee size={12} /> {stop.monthlyFee}/month</span>
                                                        <span className="flex items-center gap-1"><Clock size={12} /> Pickup: {stop.pickupTime}</span>
                                                        <span className="flex items-center gap-1"><Clock size={12} /> Drop: {stop.dropTime}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* 🔥 ADD / EDIT DRIVER MODAL WITH CUSTOM CALENDAR 🔥 */}
            <AnimatePresence>
                {showDriverModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDriverModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl z-10">
                            <button onClick={() => setShowDriverModal(false)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={24} /></button>

                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-1">
                                {editDriverId ? 'Edit Driver Details' : 'Add New Driver'}
                            </h2>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-8">Enter driver personal details</p>

                            <form onSubmit={handleSaveDriver} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name *</label>
                                    <input type="text" required value={driverForm.name} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} className="w-full px-5 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800 uppercase tracking-widest" placeholder="Driver Name" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone Number *</label>
                                        <input type="number" required value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} className="w-full px-5 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800" placeholder="10 Digit Number" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Gender *</label>
                                        <CustomDropdown
                                            options={['Male', 'Female', 'Other']}
                                            value={driverForm.gender}
                                            onChange={(val) => setDriverForm({ ...driverForm, gender: val })}
                                            placeholder="Select Gender"
                                        />
                                    </div>
                                </div>


                                {/* 🔥 NAYA LOGIN DETAILS BLOCK (NO EMAIL, EYE ICON ADDED) 🔥 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100">
                                    <div className="space-y-2 md:col-span-2">
                                        <p className="text-[12px] font-black text-[#42A5F5] uppercase tracking-widest border-b border-blue-200 pb-2 mb-2">Driver Login Credentials</p>
                                    </div>
                                    
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Custom Login ID *</label>
                                        <input type="text" required={!editDriverId} disabled={!!editDriverId} value={driverForm.customId} onChange={e => setDriverForm({ ...driverForm, customId: e.target.value.replace(/\s/g, '').toLowerCase() })} className="w-full px-5 py-3.5 rounded-[1.5rem] bg-white border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[13px] text-slate-800 lowercase disabled:opacity-50" placeholder="e.g. driver_ramesh" />
                                    </div>
                                    
                                    {/* Naya Driver Add karte time Password mangenge */}
                                    {!editDriverId && (
                                        <>
                                            <div className="space-y-2 relative">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password *</label>
                                                <div className="relative">
                                                    <input type={showPass ? "text" : "password"} required value={driverForm.password} onChange={e => setDriverForm({ ...driverForm, password: e.target.value })} className="w-full pl-5 pr-12 py-3.5 rounded-[1.5rem] bg-white border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[13px] text-slate-800" placeholder="••••••••" />
                                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#42A5F5]">
                                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2 relative">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirm Password *</label>
                                                <div className="relative">
                                                    <input type={showConfirmPass ? "text" : "password"} required value={driverForm.confirmPassword} onChange={e => setDriverForm({ ...driverForm, confirmPassword: e.target.value })} className="w-full pl-5 pr-12 py-3.5 rounded-[1.5rem] bg-white border border-slate-200 focus:border-[#42A5F5] outline-none font-bold text-[13px] text-slate-800" placeholder="••••••••" />
                                                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#42A5F5]">
                                                        {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* 🔴 CUSTOM CALENDAR IMPLEMENTATION 🔴 */}
                                <div ref={dateRef} className="relative space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Date of Birth *</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsDateOpen(!isDateOpen)}
                                        className="w-full bg-slate-50 p-4 rounded-[1.5rem] border border-slate-200 flex justify-between items-center font-bold text-[14px] text-slate-800"
                                    >
                                        <span className="flex items-center gap-2"><Calendar size={18} className="text-slate-400" /> {formatDateStr(driverForm.dob)}</span>
                                        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isDateOpen ? "rotate-180" : "rotate-0"}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isDateOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-50 w-full mt-2 bg-white border border-[#DDE3EA] rounded-[2.5rem] shadow-2xl p-5"
                                            >
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1))} className="text-[#42A5F5] font-black w-8 h-8 rounded-full bg-slate-50 hover:bg-[#42A5F5] hover:text-white transition-all">«</button>
                                                        <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="text-[#42A5F5] font-black w-8 h-8 rounded-full bg-slate-50 hover:bg-[#42A5F5] hover:text-white transition-all">‹</button>
                                                    </div>
                                                    <span className="font-black text-[#42A5F5] uppercase tracking-widest text-[13px]">
                                                        {viewDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="text-[#42A5F5] font-black w-8 h-8 rounded-full bg-slate-50 hover:bg-[#42A5F5] hover:text-white transition-all">›</button>
                                                        <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1))} className="text-[#42A5F5] font-black w-8 h-8 rounded-full bg-slate-50 hover:bg-[#42A5F5] hover:text-white transition-all">»</button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-bold text-slate-400 mb-2">
                                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                                </div>

                                                {(() => {
                                                    const year = viewDate.getFullYear();
                                                    const month = viewDate.getMonth();
                                                    const firstDay = new Date(year, month, 1);
                                                    const lastDate = new Date(year, month + 1, 0).getDate();
                                                    let startDay = firstDay.getDay();
                                                    startDay = startDay === 0 ? 6 : startDay - 1;

                                                    const days = [];
                                                    for (let i = 0; i < startDay; i++) days.push(<div key={`e-${i}`}></div>);

                                                    for (let day = 1; day <= lastDate; day++) {
                                                        const tempDate = new Date(year, month, day);
                                                        tempDate.setMinutes(tempDate.getMinutes() - tempDate.getTimezoneOffset());
                                                        const formatted = tempDate.toISOString().split('T')[0];

                                                        const current = new Date();
                                                        current.setHours(0, 0, 0, 0);
                                                        const isFuture = tempDate > current;
                                                        const isSelected = formatted === driverForm.dob;

                                                        days.push(
                                                            <button
                                                                type="button"
                                                                key={`${year}-${month}-${day}`}
                                                                disabled={isFuture}
                                                                onClick={() => {
                                                                    setDriverForm({ ...driverForm, dob: formatted });
                                                                    setIsDateOpen(false);
                                                                }}
                                                                className={`p-2 rounded-xl text-[13px] font-black transition-colors ${isSelected ? 'bg-[#42A5F5] text-white shadow-md' : 'text-slate-600'} ${isFuture ? 'opacity-20 cursor-not-allowed bg-red-50' : 'hover:bg-blue-100'}`}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    }
                                                    return <div className="grid grid-cols-7 gap-1">{days}</div>;
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address *</label>
                                    <input type="email" required value={driverForm.email} onChange={e => setDriverForm({ ...driverForm, email: e.target.value.toLowerCase() })} className="w-full px-5 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800 lowercase" placeholder="abc123@gmail.com" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Home Address *</label>
                                    <textarea required value={driverForm.address} onChange={e => setDriverForm({ ...driverForm, address: e.target.value })} className="w-full px-5 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800" rows="2" placeholder="Full Address"></textarea>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-indigo-500 text-white py-4 rounded-[1.5rem] font-black text-[15px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-600 active:scale-95 transition-all flex justify-center gap-2">
                                    {isSubmitting ? "Processing..." : <><Save size={20} /> Confirm & Save Driver</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🔥 ADD / EDIT BUS MODAL 🔥 */}
            <AnimatePresence>
                {showBusModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBusModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] p-8 max-w-lg w-full shadow-2xl z-10">
                            <button onClick={() => setShowBusModal(false)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={24} /></button>

                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-1">
                                {editBusId ? 'Edit Bus Details' : 'Add New Bus'}
                            </h2>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-8">Enter bus details below</p>

                            <form onSubmit={handleSaveBus} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Bus Number Plate *</label>
                                    <div className="relative flex items-center">
                                        <Bus size={20} className="absolute left-4 text-[#42A5F5]" />
                                        <input type="text" required value={busForm.vehicleNumber} onChange={e => setBusForm({ ...busForm, vehicleNumber: e.target.value.replace(/\s/g, '').toUpperCase() })} className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-black text-[15px] text-slate-800 uppercase tracking-widest transition-colors" placeholder="e.g. DL10AB1234" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Total Seats *</label>
                                    <div className="relative flex items-center">
                                        <Users size={20} className="absolute left-4 text-[#42A5F5]" />
                                        <input type="number" required value={busForm.seatingCapacity} onChange={e => setBusForm({ ...busForm, seatingCapacity: e.target.value })} className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800 transition-colors" placeholder="e.g. 50" />
                                    </div>
                                </div>

                                {/* 🔥 DRIVER DROPDOWN (Filters busy drivers) 🔥 */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Assign Driver (Optional)</label>
                                    <CustomDropdown
                                        // 1. Saare drivers dikhao, jo assigned hain unke aage Swap likh do
                                        options={drivers.map(d => {
                                            const otherBus = vehicles.find(v => v.driver?._id === d._id && v._id !== editBusId);
                                            if (otherBus) return `${d.name} - Swap with: ${otherBus.vehicleNumber}`;
                                            return `${d.name} - Available`;
                                        })}

                                        // 2. Pehle se selected driver ka naam set karo
                                        value={busForm.driverId ? (() => {
                                            const d = drivers.find(item => item._id === busForm.driverId);
                                            if (!d) return '';
                                            const otherBus = vehicles.find(v => v.driver?._id === d._id && v._id !== editBusId);
                                            if (otherBus) return `${d.name} - Swap with: ${otherBus.vehicleNumber}`;
                                            return `${d.name} - Available`;
                                        })() : ''}

                                        // 3. User select kare toh siraf "Naam" nikal kar match karo
                                        onChange={(selectedStr) => {
                                            const dName = selectedStr.split(' - ')[0]; // Split se exact naam nikal liya
                                            const dObj = drivers.find(item => item.name === dName);
                                            setBusForm({ ...busForm, driverId: dObj ? dObj._id : '' });
                                        }}
                                        placeholder=" SELECT DRIVER "
                                        icon={User}
                                        direction="up"
                                    />
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-emerald-500 text-white py-4 rounded-[1.5rem] font-black text-[15px] uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex justify-center gap-2">
                                    {isSubmitting ? "Saving..." : <><Save size={20} /> Confirm & Save Bus</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CREATE / EDIT ROUTE MODAL */}
            <AnimatePresence>
                {showRouteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRouteModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[3rem] p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl z-10">
                            <button onClick={() => setShowRouteModal(false)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={24} /></button>

                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-1">
                                {editRouteId ? 'Edit Bus Route' : 'Create New Route'}
                            </h2>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-8">Set route name, assign unassigned bus, and stops</p>

                            <form onSubmit={handleCreateRoute} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 z-30 relative">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Route Name *</label>
                                        <div className="relative flex items-center">
                                            <Map size={20} className="absolute left-4 text-[#42A5F5]" />
                                            <input type="text" required value={routeForm.routeName} onChange={e => setRouteForm({ ...routeForm, routeName: e.target.value.toUpperCase() })} className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-black text-[14px] text-slate-800 uppercase tracking-widest transition-colors" placeholder="e.g. abc to xyz" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Assign Bus *</label>
                                        <CustomDropdown
                                            options={availableVehicles.map(v => `${v.vehicleNumber} (Seats: ${v.seatingCapacity})`)}
                                            value={routeForm.vehicleId ? (() => {
                                                const v = vehicles.find(item => item._id === routeForm.vehicleId);
                                                return v ? `${v.vehicleNumber} (Seats: ${v.seatingCapacity})` : '';
                                            })() : ''}
                                            onChange={(selectedStr) => {
                                                const vNum = selectedStr.split(' ')[0];
                                                const vObj = vehicles.find(item => item.vehicleNumber === vNum);
                                                setRouteForm({ ...routeForm, vehicleId: vObj ? vObj._id : '' });
                                            }}
                                            placeholder=" SELECT AVAILABLE BUS "
                                            icon={Bus}
                                        />
                                    </div>
                                </div>

                                {/* Stops Configuration */}
                                <div className="mt-8 z-10 relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                            <MapPin size={18} className="text-[#42A5F5]" /> Bus Stops
                                        </h3>
                                        <button type="button" onClick={handleAddStop} className="bg-blue-50 text-[#42A5F5] px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#42A5F5] hover:text-white transition-colors flex items-center gap-1">
                                            <Plus size={14} /> Add Stop
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {routeForm.stops.map((stop, index) => (
                                            <div key={index} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200 relative group">
                                                <button type="button" onClick={() => handleRemoveStop(index)} className="absolute -top-3 -right-3 bg-white text-rose-500 p-2 rounded-full shadow-md border border-slate-100 hover:bg-rose-500 hover:text-white transition-all">
                                                    <Trash2 size={16} />
                                                </button>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Stop Name *</label>
                                                        <input type="text" required value={stop.stopName} onChange={e => handleStopChange(index, 'stopName', e.target.value.toUpperCase())} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 outline-none font-bold text-[13px] uppercase bg-white focus:border-[#42A5F5]" placeholder="e.g. SECTOR 15 MARKET" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Monthly Fee (₹) *</label>
                                                        <input type="number" required value={stop.monthlyFee} onChange={e => handleStopChange(index, 'monthlyFee', e.target.value)} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 outline-none font-bold text-[13px] bg-white focus:border-[#42A5F5]" placeholder="e.g. 1500" />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pickup Time</label>
                                                        <div className="flex gap-2">
                                                            <CustomDropdown options={hoursList} value={stop.pickupHour} onChange={(val) => handleStopChange(index, 'pickupHour', val)} placeholder="HH" className="w-1/3" />
                                                            <CustomDropdown options={minutesList} value={stop.pickupMin} onChange={(val) => handleStopChange(index, 'pickupMin', val)} placeholder="MM" className="w-1/3" />
                                                            <CustomDropdown options={meridiemList} value={stop.pickupMeridiem} onChange={(val) => handleStopChange(index, 'pickupMeridiem', val)} placeholder="AM/PM" className="w-1/3" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Drop Time</label>
                                                        <div className="flex gap-2">
                                                            <CustomDropdown options={hoursList} value={stop.dropHour} onChange={(val) => handleStopChange(index, 'dropHour', val)} placeholder="HH" className="w-1/3" />
                                                            <CustomDropdown options={minutesList} value={stop.dropMin} onChange={(val) => handleStopChange(index, 'dropMin', val)} placeholder="MM" className="w-1/3" />
                                                            <CustomDropdown options={meridiemList} value={stop.dropMeridiem} onChange={(val) => handleStopChange(index, 'dropMeridiem', val)} placeholder="AM/PM" className="w-1/3" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-[#42A5F5] text-white py-5 rounded-[2rem] font-black text-[15px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all flex justify-center gap-2">
                                    {isSubmitting ? "Saving..." : <><Save size={20} /> Confirm & Save Route</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {deleteConfirm.show && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm({ show: false, type: '', id: '', name: '' })} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center z-10">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Delete {deleteConfirm.type}?</h3>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                                Are you sure you want to delete <span className="text-rose-500 font-black">{deleteConfirm.name}</span>?
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteConfirm({ show: false, type: '', id: '', name: '' })} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={executeDelete} disabled={isSubmitting} className="flex-1 py-4 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-rose-600 shadow-lg transition-all">{isSubmitting ? "Deleting..." : "Yes, Confirm Delete"}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default ManageFleet;
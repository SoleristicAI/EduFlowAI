import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, User, Mail, Phone, MapPin, Calendar, Lock, 
    ChevronDown, Check, Camera, IdCard, ShieldCheck, PhoneCall, Trash2, Edit3, X, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

// --- CUSTOM PREMIUM DROPDOWN (Blue Theme) ---
const CustomDropdown = ({ options, value, onChange, placeholder, icon: Icon, className="" }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`relative z-20 ${className}`}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] border transition-all cursor-pointer bg-white ${
                    isOpen ? "border-[#42A5F5] ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-300"
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
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 right-0 top-[105%] z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {options.map((option) => (
                                    <div
                                        key={option}
                                        onClick={() => { onChange(option); setIsOpen(false); }}
                                        className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-all hover:bg-blue-50 ${
                                            value === option ? "bg-blue-50 text-[#42A5F5]" : "text-slate-700"
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

const TransportSetup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [inchargeExists, setInchargeExists] = useState(false);
    const [inchargeData, setInchargeData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // 🔥 CUSTOM CALENDAR STATES 🔥
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(new Date().getFullYear() - 25, 0, 1)); // Default starts 25 years ago
    const dateRef = useRef(null);
    const today = new Date().toISOString().split('T')[0];

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '', email: '', customId: '', password: '', confirmPassword: '',
        phone: '', gender: '', dob: '', // Single DOB state now
        fullAddress: '', district: '', state: '', pincode: ''
    });

    useEffect(() => {
        checkIncharge();
    }, []);

    // Calendar outside click listener
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateRef.current && !dateRef.current.contains(event.target)) {
                setIsDateOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const checkIncharge = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/users/check-transport-incharge');
            if (data.exists) {
                setInchargeExists(true);
                setInchargeData(data.incharge);
            } else {
                setInchargeExists(false);
                setInchargeData(null);
            }
        } catch (error) {
            console.error("Error checking incharge:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file)); 
        }
    };

    const openEditMode = () => {
        let dobStr = '';
        if (inchargeData.dob) {
            dobStr = new Date(inchargeData.dob).toISOString().split('T')[0];
            setViewDate(new Date(inchargeData.dob)); // Set calendar view to their actual DOB
        }

        setFormData({
            name: inchargeData.name || '',
            email: inchargeData.email || '',
            phone: inchargeData.phone || '',
            gender: inchargeData.gender || '',
            fullAddress: inchargeData.address?.fullAddress || '',
            district: inchargeData.address?.district || '',
            state: inchargeData.address?.state || '',
            pincode: inchargeData.address?.pincode || '',
            dob: dobStr,
            customId: '', password: '', confirmPassword: ''
        });
        setAvatarPreview(inchargeData.avatar || null);
        setAvatarFile(null);
        setIsEditing(true);
    };

    const handleCreateIncharge = async () => {
        if (formData.password !== formData.confirmPassword) {
            setMsg('Passwords do not match! Please check again. ⚠️'); return;
        }
        if (formData.customId.length < 6) {
            setMsg('Custom Login ID must be at least 6 characters long! ⚠️'); return;
        }
        const idParts = formData.customId.split('@');
        if (idParts.length !== 2 || !idParts[0] || !idParts[1]) {
            setMsg("Custom ID must include '@' and an identity (e.g., varunsir@bus) ⚠️"); return;
        }

        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('email', formData.email.toLowerCase());
            payload.append('customId', formData.customId.toLowerCase());
            payload.append('password', formData.password);
            payload.append('phone', formData.phone);
            payload.append('gender', formData.gender);
            if(formData.dob) payload.append('dob', formData.dob);
            payload.append('fullAddress', formData.fullAddress);
            if (avatarFile) payload.append('avatar', avatarFile);

            const { data } = await API.post('/users/add-transport-incharge', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setInchargeData(data);
            setInchargeExists(true);
            setMsg(`TRANSPORT ADMIN ${data.name} IS NOW ACTIVE. ⚡`);
        } catch (error) {
            setMsg(error.response?.data?.message || 'Failed to create Transport Incharge.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateIncharge = async () => {
        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('email', formData.email.toLowerCase());
            payload.append('phone', formData.phone);
            payload.append('gender', formData.gender);
            if(formData.dob) payload.append('dob', formData.dob);
            payload.append('fullAddress', formData.fullAddress);
            if (avatarFile) payload.append('avatar', avatarFile);

            const { data } = await API.put(`/users/update/${inchargeData._id}`, payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setInchargeData(data.user);
            setIsEditing(false);
            setMsg(`Profile Updated Successfully! ✅`);
        } catch (error) {
            setMsg(error.response?.data?.message || 'Failed to update Profile.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        setIsSubmitting(true);
        try {
            await API.delete(`/users/delete/${inchargeData._id}`);
            setInchargeData(null);
            setInchargeExists(false);
            setIsEditing(false);
            setShowDeleteModal(false); 
            setMsg("Transport Operator Identity Purged! 🗑️");
        } catch (error) {
            setMsg("Failed to delete user.");
            setShowDeleteModal(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (isEditing) handleUpdateIncharge(); else handleCreateIncharge();
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic px-16">Transport Fleet</h1>
                <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Command Center</p>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-4xl mx-auto">
                
                {/* PROFILE CARD */}
                {inchargeExists && !isEditing ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-slate-100">
                        <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                            <div className="relative shrink-0">
                                <div className="w-40 h-40 rounded-full bg-blue-50 border-8 border-white shadow-2xl overflow-hidden p-1">
                                    <img src={inchargeData.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="Incharge" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#42A5F5] text-white px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                                    <ShieldCheck size={14} /> Active
                                </div>
                            </div>
                            <div className="flex-grow text-center md:text-left">
                                <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-2">{inchargeData.name}</h2>
                                <p className="text-[#42A5F5] font-bold text-[15px] uppercase tracking-widest mb-4">Head of Transport</p>
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-3">
                                        <IdCard size={20} className="text-slate-400" />
                                        <span className="font-bold text-slate-700 tracking-wider lowercase">{inchargeData.customId}</span>
                                    </div>
                                    <a href={`tel:${inchargeData.phone}`} className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-emerald-500 hover:text-white transition-colors group cursor-pointer shadow-sm">
                                        <PhoneCall size={20} className="group-hover:animate-bounce" />
                                        <span className="font-black tracking-widest uppercase text-[14px]">{inchargeData.phone || 'N/A'}</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-100">
                            <button onClick={openEditMode} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-[1.5rem] font-black text-[15px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg">
                                <Edit3 size={20} /> Edit Operator Details
                            </button>
                            <button onClick={() => setShowDeleteModal(true)} className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 py-4 rounded-[1.5rem] font-black text-[15px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-sm">
                                <Trash2 size={20} /> Terminate Protocol
                            </button>
                        </div>
                    </motion.div>
                ) : (

                /* CREATION & EDIT FORM */
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-slate-100 relative">
                        {isEditing && (
                            <button onClick={() => setIsEditing(false)} className="absolute top-8 right-8 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                <X size={24} />
                            </button>
                        )}
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                                {isEditing ? "Update Operator" : "Assign Incharge"}
                            </h2>
                            <p className="text-slate-400 font-bold text-[13px] uppercase tracking-widest mt-2 max-w-sm mx-auto">
                                {isEditing ? "Modify profile details below." : "Create an encrypted profile for the transport operator."}
                            </p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            
                            {/* Photo Upload */}
                            <div className="flex flex-col items-center mb-8">
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                <div onClick={() => fileInputRef.current.click()} className="w-28 h-28 bg-blue-50 border-2 border-dashed border-[#42A5F5] rounded-full flex items-center justify-center text-[#42A5F5] cursor-pointer hover:bg-[#42A5F5] hover:text-white transition-all shadow-inner relative overflow-hidden group p-1">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="w-full h-full rounded-full object-cover" />
                                    ) : <Camera size={32} className="group-hover:scale-110 transition-transform" />}
                                    {avatarPreview && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                            <Camera size={24} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] font-black text-[#42A5F5] mt-3 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-md">
                                    {isEditing ? "Update Photo" : "Upload Photo"}
                                </p>
                            </div>

                            {/* HIDDEN IN EDIT MODE */}
                            {!isEditing && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Custom Login ID *</label>
                                            <div className="relative flex items-center">
                                                <IdCard size={20} className="absolute left-4 text-[#42A5F5]" />
                                                <input 
                                                    type="text" required value={formData.customId} 
                                                    onChange={e => setFormData({...formData, customId: e.target.value.replace(/\s/g, '').toLowerCase()})} 
                                                    className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-[#42A5F5] lowercase tracking-widest transition-colors" 
                                                    placeholder="e.g. abc@bus" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2"> Email ID *</label>
                                            <div className="relative flex items-center">
                                                <Mail size={20} className="absolute left-4 text-slate-400" />
                                                <input 
                                                    type="email" required value={formData.email} 
                                                    onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} 
                                                    className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800 transition-colors" 
                                                    placeholder="abc@gmail.com" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Custom Id Password *</label>
                                            <div className="relative flex items-center">
                                                <Lock size={20} className="absolute left-4 text-[#42A5F5]" />
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    required value={formData.password} 
                                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                                    className="w-full pl-12 pr-12 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800 transition-colors" 
                                                    placeholder="••••••" 
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-slate-400 hover:text-[#42A5F5]">
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirm Password *</label>
                                            <div className="relative flex items-center">
                                                <ShieldCheck size={20} className={`absolute left-4 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'text-rose-500' : 'text-[#42A5F5]'}`} />
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    required value={formData.confirmPassword} 
                                                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                                                    className={`w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border outline-none font-bold text-[14px] text-slate-800 transition-colors ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-[#42A5F5] focus:bg-white'}`} 
                                                    placeholder="••••••" 
                                                />
                                            </div>
                                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                                <p className="text-[10px] font-bold text-rose-500 ml-2 flex items-center gap-1"><AlertCircle size={10}/> Passwords do not match!</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {isEditing && (
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Recovery Email *</label>
                                    <div className="relative flex items-center">
                                        <Mail size={20} className="absolute left-4 text-slate-400" />
                                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800 transition-colors" placeholder="mail@domain.com" />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 z-20 relative">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name *</label>
                                    <div className="relative flex items-center">
                                        <User size={20} className="absolute left-4 text-slate-400" />
                                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800 uppercase tracking-widest transition-colors" placeholder="FULL NAME" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Mobile Number *</label>
                                    <div className="relative flex items-center">
                                        <Phone size={20} className="absolute left-4 text-slate-400" />
                                        <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800 uppercase tracking-widest transition-colors" placeholder="10-DIGIT MOBILE" />
                                    </div>
                                </div>
                            </div>

                            {/* 🔥 GENDER & THE NEW CUSTOM CALENDAR ENGINE 🔥 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 z-30 relative">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Gender *</label>
                                    <CustomDropdown options={['Male', 'Female', 'Other']} value={formData.gender} onChange={(val) => setFormData({...formData, gender: val})} placeholder="SELECT GENDER" icon={User} className="w-full" />
                                </div>
                                
                                {/* 🔴 CUSTOM CALENDAR MOUNTED HERE 🔴 */}
                                <div className="space-y-2 relative" ref={dateRef}>
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Date of Birth</label>
                                    
                                    {/* Trigger Button */}
                                    <button 
                                        type="button"
                                        onClick={() => setIsDateOpen(!isDateOpen)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-[1.5rem] border transition-all bg-slate-50 hover:bg-white outline-none font-bold text-[14px] text-slate-800 uppercase tracking-widest ${isDateOpen ? "border-[#42A5F5] bg-white ring-4 ring-blue-50" : "border-slate-200"}`}
                                    >
                                        <Calendar size={20} className={formData.dob ? "text-[#42A5F5]" : "text-slate-400"} />
                                        <span className={formData.dob ? "text-slate-800" : "text-slate-400"}>
                                            {formData.dob ? new Date(formData.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "SELECT DOB"}
                                        </span>
                                    </button>

                                    {/* Calendar Modal */}
                                    <AnimatePresence>
                                        {isDateOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-[105%] z-[100] bg-white border border-blue-100 rounded-[2.5rem] shadow-2xl p-6 w-80"
                                            >
                                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                                    
                                                    {/* Header Controls */}
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex gap-2">
                                                            {/* 🔥 Jump Year Back */}
                                                            <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1))} className="text-[#42A5F5] font-black bg-white w-8 h-8 rounded-full shadow-sm hover:bg-[#42A5F5] hover:text-white transition-colors">«</button>
                                                            {/* Jump Month Back */}
                                                            <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="text-[#42A5F5] font-black bg-white w-8 h-8 rounded-full shadow-sm hover:bg-[#42A5F5] hover:text-white transition-colors">‹</button>
                                                        </div>
                                                        
                                                        <span className="font-black text-[#42A5F5] uppercase tracking-widest text-[13px]">
                                                            {viewDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                                        </span>
                                                        
                                                        <div className="flex gap-2">
                                                            {/* Jump Month Forward */}
                                                            <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="text-[#42A5F5] font-black bg-white w-8 h-8 rounded-full shadow-sm hover:bg-[#42A5F5] hover:text-white transition-colors">›</button>
                                                            {/* 🔥 Jump Year Forward */}
                                                            <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1))} className="text-[#42A5F5] font-black bg-white w-8 h-8 rounded-full shadow-sm hover:bg-[#42A5F5] hover:text-white transition-colors">»</button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">
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
                                                        for (let i = 0; i < startDay; i++) { days.push(<div key={"empty-" + i}></div>); }

                                                        for (let day = 1; day <= lastDate; day++) {
                                                            const tempDate = new Date(year, month, day);
                                                            // Adjust timezone shift logic to match exactly YYYY-MM-DD
                                                            tempDate.setMinutes(tempDate.getMinutes() - tempDate.getTimezoneOffset());
                                                            const formatted = tempDate.toISOString().split('T')[0];
                                                            
                                                            const isSelected = formatted === formData.dob;
                                                            // Disable Future Dates for DOB
                                                            const isFuture = formatted > today;

                                                            days.push(
                                                                <button
                                                                    type="button"
                                                                    key={day}
                                                                    disabled={isFuture}
                                                                    onClick={() => {
                                                                        setFormData({...formData, dob: formatted});
                                                                        setIsDateOpen(false);
                                                                    }}
                                                                    className={`p-2 rounded-xl text-[13px] font-black transition-colors ${isSelected ? 'bg-[#42A5F5] text-white shadow-md' : 'text-slate-600'} ${isFuture ? 'opacity-20 cursor-not-allowed bg-red-50' : 'hover:bg-white'}`}
                                                                >
                                                                    {day}
                                                                </button>
                                                            );
                                                        }
                                                        return <div className="grid grid-cols-7 gap-1">{days}</div>;
                                                    })()}
                                                </div>
                                                <button type="button" onClick={() => setIsDateOpen(false)} className="w-full mt-4 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest italic active:scale-95 transition-all hover:bg-slate-700">Close Calendar</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 z-10 relative">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Home Address</label>
                                    <div className="relative flex items-center">
                                        <MapPin size={20} className="absolute left-4 text-slate-400" />
                                        <input type="text" value={formData.fullAddress} onChange={e => setFormData({...formData, fullAddress: e.target.value})} className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-200 focus:border-[#42A5F5] focus:bg-white outline-none font-bold text-[14px] text-slate-800 uppercase tracking-widest transition-colors" placeholder="COMPLETE ADDRESS" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button type="submit" disabled={isSubmitting} className={`w-full text-white py-5 rounded-[2rem] font-black text-[16px] uppercase tracking-widest shadow-xl transition-all flex justify-center items-center gap-3 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#42A5F5] hover:bg-blue-600 hover:shadow-blue-200 hover:-translate-y-1 active:scale-95'}`}>
                                    {isSubmitting ? <span className="animate-pulse">Processing...</span> : (
                                        isEditing ? <>Save Updates <Edit3 size={24} /></> : <>Create Operator <ShieldCheck size={24} /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </div>

            {/* 🔥 CUSTOM DELETE CONFIRMATION MODAL 🔥 */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowDeleteModal(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center z-10"
                        >
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Terminate Protocol?</h3>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                                This will permanently delete <span className="text-rose-500">{inchargeData?.name}'s</span> access. This action cannot be reversed.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={executeDelete} disabled={isSubmitting} className="flex-1 py-4 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-rose-600 hover:shadow-rose-200 shadow-lg transition-all">
                                    {isSubmitting ? "Deleting..." : "Yes, Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default TransportSetup;
import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Mail, Phone, Camera, MapPin, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";

const SuperAdminAccount = ({ user }) => {
    const navigate = useNavigate();
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [editData, setEditData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        mobile: user?.mobile || '',
        address: user?.address || ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('name', editData.name);
        data.append('email', editData.email);
        data.append('mobile', editData.mobile);
        data.append('address', editData.address);
        if (avatarFile) data.append('avatar', avatarFile);

        try {
            const res = await API.put('/superadmin/update-profile', data);
            localStorage.setItem('user', JSON.stringify(res.data));
            setMsg("Master Profile Synchronized! ⚡");
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            console.error("Sync Error Detail:", err.response?.data);
            alert(err.response?.data?.message || "Sync Failed!");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-void p-6 font-sans italic text-white">
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
            <button onClick={() => navigate(-1)} className="bg-white/5 p-3 rounded-2xl shadow-lg mb-8 active:scale-90 border border-white/10 text-neon transition-all"><ArrowLeft size={20} /></button>
            <h1 className="text-3xl font-black text-white mb-10 tracking-tighter italic uppercase">Master Control Profile</h1>

            <form onSubmit={handleUpdate} className="bg-white/5 backdrop-blur-xl rounded-[3.5rem] p-10 shadow-2xl border border-white/10 space-y-8">
                <div className="flex items-center gap-6 pb-8 border-b border-white/5">
                    <div className="relative">
                        <div className="w-24 h-24 bg-void text-neon rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(61,242,224,0.3)] overflow-hidden border-4 border-slate-900">
                            {preview ? (
                                <img src={preview} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Preview" />
                            ) : user?.avatar ? (
                                <img
                                    src={user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`}
                                    className="w-full h-full object-cover grayscale"
                                    alt="Root"
                                />
                            ) : ("SA")}
                        </div>
                        <label className="absolute -bottom-2 -right-2 bg-neon p-2 rounded-xl text-void cursor-pointer shadow-lg hover:scale-110 transition-all border-2 border-void">
                            <Camera size={14} />
                            <input type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editData.name}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <ShieldCheck size={14} className="text-neon animate-pulse" />
                            <span className="bg-neon/10 text-neon border border-neon/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">System Root</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neon/40 uppercase ml-2 italic tracking-widest">Full Personnel Name</label>
                        <div className="bg-void p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                            <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="bg-transparent font-black outline-none w-full text-white italic" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neon/40 uppercase ml-2 italic tracking-widest">Global Access Email</label>
                        <div className="bg-void p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                            <Mail className="text-neon/40" size={20} />
                            <input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="bg-transparent font-black outline-none w-full text-white italic" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neon/40 uppercase ml-2 italic tracking-widest">Mobile Endpoint</label>
                        <div className="bg-void p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                            <Phone className="text-neon/40" size={20} />
                            <input type="text" value={editData.mobile} placeholder="Enter Mobile" onChange={(e) => setEditData({ ...editData, mobile: e.target.value })} className="bg-transparent font-black outline-none w-full text-white italic" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neon/40 uppercase ml-2 italic tracking-widest">Root HQ Address</label>
                        <div className="bg-void p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                            <MapPin className="text-neon/40" size={20} />
                            <input type="text" value={editData.address} placeholder="System Location" onChange={(e) => setEditData({ ...editData, address: e.target.value })} className="bg-transparent font-black outline-none w-full text-white italic uppercase" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-neon text-void py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-[0_0_30px_rgba(61,242,224,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3 italic">
                    {loading ? "Transmitting..." : <><Save size={18} /> Synchronize Master Uplink</>}
                </button>
            </form>
        </div>
    );
};

export default SuperAdminAccount;
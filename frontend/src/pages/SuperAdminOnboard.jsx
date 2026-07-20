import React, { useState } from 'react';
import { ArrowLeft, School, UserCheck, CreditCard, Upload, ShieldCheck, MapPin, Hash, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';

const SuperAdminOnboard = () => {
    const navigate = useNavigate();
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        schoolInfo: { schoolName: '', address: '', affiliationNo: '', logo: '' },
        adminInfo: { fullName: '', mobile: '', email: '', designation: 'Principal', fatherName: 'Institutional Root', motherName: 'System Core', gender: 'Other', religion: 'Global' },
        subscription: { monthlyFee: 0, totalPaid: 0 },
        tempPassword: '',
        sessionYear: '2026-27'
    });

    const handleOnboard = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('schoolInfo', JSON.stringify(formData.schoolInfo));
        data.append('adminInfo', JSON.stringify(formData.adminInfo));
        data.append('subscription', JSON.stringify(formData.subscription));
        data.append('tempPassword', formData.tempPassword);
        data.append('sessionYear', formData.sessionYear);
        if (logoFile) data.append('logo', logoFile);

        try {
            await API.post('/superadmin/onboard-school', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMsg("Institution integrated successfully! 🚀");
            setTimeout(() => navigate('/superadmin/dashboard'), 2000);
        } catch (err) {
            alert(err.response?.data?.message || "Onboarding failed");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] pb-24 font-sans italic text-slate-800 overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header Section */}
            <div className="bg-indigo-600 text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                <button onClick={() => navigate(-1)} className="bg-white/20 p-3 rounded-2xl mb-8 border border-white/30 text-white hover:bg-white/30 transition-all relative z-10">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-extrabold tracking-tight relative z-10">School onboarding</h1>
                <p className="text-[16px] font-medium opacity-80 mt-2 relative z-10 italic">Deploying a new school</p>
            </div>

            <form onSubmit={handleOnboard} className="px-6 -mt-12 space-y-8 max-w-3xl mx-auto relative z-20">

                {/* Logo Upload Section */}
                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <Upload size={20} />
                        </div>
                        <h3 className="text-[18px] font-bold uppercase tracking-widest text-slate-600">School identity</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 bg-slate-50 group hover:border-indigo-400 transition-all cursor-pointer relative">
                        <input type="file" accept="image/*" id="logoUpload" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setLogoFile(e.target.files[0])} />
                        <div className="flex flex-col items-center gap-3">
                            {logoFile ? (
                                <div className="flex flex-col items-center animate-fadeIn">
                                    {/* 🔥 LIVE PREVIEW DIKHEGA YAHAN 🔥 */}
                                    <img
                                        src={URL.createObjectURL(logoFile)}
                                        alt="Logo Preview"
                                        className="w-24 h-24 object-contain rounded-2xl shadow-sm border border-slate-200 mb-3 bg-white p-1"
                                    />
                                    <span className="text-[14px] font-black italic text-indigo-600 uppercase tracking-widest">
                                        {logoFile.name} Ready!
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white p-4 rounded-full shadow-md text-slate-400 group-hover:text-indigo-600 transition-all">
                                        <Upload size={28} />
                                    </div>
                                    <p className="text-base font-medium text-slate-500 text-center">Click or drag to upload school logo</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Entity Credentials */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                            <School size={20} />
                        </div>
                        <h3 className="text-[18px] font-bold uppercase tracking-widest text-slate-600">Details</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-5 focus-within:border-indigo-400 transition-all">
                            <School size={20} className="text-slate-300 mr-4" />
                            <input type="text" placeholder="School full name" className="bg-transparent font-bold text-lg text-slate-700 outline-none w-full"
                                onChange={(e) => setFormData({ ...formData, schoolInfo: { ...formData.schoolInfo, schoolName: e.target.value } })} required />
                        </div>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-5 focus-within:border-indigo-400 transition-all">
                            <MapPin size={20} className="text-slate-300 mr-4" />
                            <input type="text" placeholder="Address(City, State, Pincode)" className="bg-transparent font-bold text-lg text-slate-700 outline-none w-full"
                                onChange={(e) => setFormData({ ...formData, schoolInfo: { ...formData.schoolInfo, address: e.target.value } })} required />
                        </div>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-5 focus-within:border-indigo-400 transition-all">
                            <Hash size={20} className="text-slate-300 mr-4" />
                            <input type="text" placeholder="Affiliation or registration number" className="bg-transparent font-bold text-lg text-slate-700 outline-none w-full"
                                onChange={(e) => setFormData({ ...formData, schoolInfo: { ...formData.schoolInfo, affiliationNo: e.target.value } })} required />
                        </div>
                    </div>
                </div>

                {/* Primary Operator Credentials */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <UserCheck size={20} />
                        </div>
                        <h3 className="text-[18px] font-bold uppercase tracking-widest text-slate-600">Admin details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Administrator name" className="p-5 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-lg text-slate-700 outline-none focus:border-indigo-400"
                            onChange={(e) => setFormData({ ...formData, adminInfo: { ...formData.adminInfo, fullName: e.target.value } })} required />
                        <input type="text" placeholder="Contact No." className="p-5 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-lg text-slate-700 outline-none focus:border-indigo-400"
                            onChange={(e) => setFormData({ ...formData, adminInfo: { ...formData.adminInfo, mobile: e.target.value } })} required />
                    </div>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-5 focus-within:border-indigo-400 transition-all">
                        <Mail size={20} className="text-slate-300 mr-4" />
                        <input type="email" placeholder="Administration email" className="bg-transparent font-bold text-lg text-slate-700 outline-none w-full"
                            onChange={(e) => setFormData({ ...formData, adminInfo: { ...formData.adminInfo, email: e.target.value } })} required />
                    </div>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-5 focus-within:border-indigo-400 transition-all">

                        <Lock size={20} className="text-slate-300 mr-4" />

                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Access password"
                            className="bg-transparent font-bold text-lg text-slate-700 outline-none w-full"
                            onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                            required
                        />

                        {/* 👁 Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="ml-3 text-slate-400 hover:text-indigo-500 transition"
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>

                    </div>
                </div>

                {/* Subscription Details */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="text-[18px] font-bold uppercase tracking-widest text-slate-600">Credit agreement</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[15px] font-bold text-slate-500 ml-2">Monthly charges(₹)</label>
                            <input type="number" placeholder="0.00" className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-200 font-black text-xl text-indigo-600 outline-none"
                                onChange={(e) => setFormData({ ...formData, subscription: { ...formData.subscription, monthlyFee: Number(e.target.value) } })} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[15px] font-bold text-slate-500 ml-2">Initial charges(₹)</label>
                            <input type="number" placeholder="0.00" className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-200 font-black text-xl text-slate-700 outline-none"
                                onChange={(e) => setFormData({ ...formData, subscription: { ...formData.subscription, totalPaid: Number(e.target.value) } })} required />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-[2.5rem] font-extrabold text-xl shadow-xl shadow-indigo-100 active:scale-95 transition-all mt-6 uppercase tracking-tight">
                    {loading ? "Initializing core..." : "Activate school hub"}
                </button>
            </form>
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default SuperAdminOnboard;
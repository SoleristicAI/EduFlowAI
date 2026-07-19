import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserCircle, Mail, Phone, MapPin, Fingerprint, Camera, User, Users, Calendar, ShieldCheck, Heart, Hash, UserCheck, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const MyAccount = ({ user }) => {
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [schoolData, setSchoolData] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Vercel par automatically tera live URL uthayega, localhost par local!
    const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";
    const [preview, setPreview] = useState(
        user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`) : null
    );
    const isEditable = user?.role === 'superadmin';

    useEffect(() => {
        if (user?.role === 'admin') {
            const fetchSchoolInfo = async () => {
                try {
                    const { data } = await API.get('/school/subscription-status');
                    // FIXED: Backend se data.school ke andar nested adminDetails aur subscription aa raha hai
                    setSchoolData(data.school);
                } catch (err) { console.error("Institutional Data fetch failed"); }
            };
            fetchSchoolInfo();
        }
    }, [user]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 🔥 1. FRONTEND GUARD: Check if it's actually an image
        if (!file.type.startsWith('image/')) {
            setToast({ show: true, message: "Please upload an image file only! 🚫", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
            e.target.value = null; // Input reset
            return;
        }

        // 🔥 2. SIZE GUARD: Stop images larger than 5MB
        if (file.size > 5000000) {
            setToast({ show: true, message: "Image is too large! Max 5MB allowed. ⚠️", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
            e.target.value = null;
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setUploading(true);
        try {
            const { data } = await API.put('/auth/update-profile', formData);

            const currentUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...currentUser, avatar: data.avatar };

            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Check karega ki Cloudinary ka link hai ya local disk ka
            setPreview(data.avatar.startsWith('http') ? data.avatar : `${BASE_URL}${data.avatar}`);
            setToast({ show: true, message: "Profile Photo Updated! 🧬", type: 'success' });
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            // 🔥 3. DYNAMIC ERROR: Backend se aane wala asli error dikhao
            const errorMsg = err.response?.data?.message || err.message || "Upload Failed! Network issue.";
            setToast({ show: true, message: errorMsg, type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
        } finally {
            setUploading(false);
        }
    };
    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* Top Header: Blue Theme */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[3.5rem] shadow-lg relative overflow-hidden">

                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white/20 p-2.5 rounded-xl active:scale-90 border border-white/30 text-white transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <h1 className="text-3xl font-black italic tracking-tight capitalize">
                        {user?.role === 'admin' ? 'Institutional information' : 'Personal information'}
                    </h1>
                </div>
            </div>
            <br />

            <div className="px-6 -mt-16 relative z-20">
                <div className="bg-white rounded-[3rem] shadow-xl p-8 border border-[#DDE3EA]">

                    {/* --- PROFILE PIC & PRIMARY INFO --- */}
                    <div className="flex flex-col items-center -mt-20 mb-8">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-white rounded-full border-[6px] border-white shadow-2xl flex items-center justify-center overflow-hidden">
                                {preview ? (
                                    <img src={preview} alt="profile" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                        <UserCircle size={80} />
                                    </div>
                                )}
                            </div>

                            <label className="absolute bottom-1 right-1 bg-[#42A5F5] text-white p-2.5 rounded-2xl cursor-pointer shadow-lg active:scale-90 transition-all border-4 border-white">
                                <Camera size={18} />
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>

                            {uploading && (
                                <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <div className="w-8 h-8 border-4 border-[#42A5F5] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        <h2 className="text-2xl font-black text-slate-800 mt-5 italic tracking-tight text-center capitalize">
                            {user?.role === 'admin' ? (schoolData?.schoolName?.toLowerCase() || user?.name?.toLowerCase()) : user?.name?.toLowerCase()}
                        </h2>

                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                            <span className="bg-blue-50 text-[#42A5F5] border border-blue-100 px-4 py-1.5 rounded-full text-[15px] font-black italic capitalize tracking-wide">
                                {user?.role === 'admin' ? 'Master node authorized' : user?.role === 'student' ? `Class: ${user.grade}` : 'Faculty member'}
                            </span>
                            {user?.role !== 'admin' && (
                                <span className="bg-blue-50 text-[#42A5F5] border border-blue-100 px-5 py-2 rounded-full text-[15px] font-black italic tracking-widest uppercase shadow-sm">
                                    {user?.role === 'student' ? user.enrollmentNo : user.employeeId}
                                </span>
                            )}

                            {user?.role === 'teacher' && (
                                <div className="bg-emerald-50 text-emerald-500 border border-emerald-100 px-6 py-2 rounded-2xl text-[15px] font-black italic shadow-sm ">
                                    {user?.assignedClass ? (
                                        <span>Assigned class: {user.assignedClass}</span>
                                    ) : (
                                        <span className="text-rose-400">Not assigned any class</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- DETAILS GRID --- */}
                    <div className="space-y-8">
                        <p className="text-[15px] font-bold text-black uppercase tracking-[0.3em] border-b border-slate-50 pb-3 italic ml-2">
                            {user?.role === 'admin' ? 'Account credentials' : 'Profile details'}
                        </p>

                        <div className="grid grid-cols-1 gap-7">
                            {user?.role === 'admin' ? (
                                <>
                                    <div className="flex items-center gap-5 group">
                                        <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 text-[#42A5F5]"><Hash size={22} /></div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Affiliation cipher</p>
                                            <p className="text-[16px] font-black text-slate-700 uppercase">{schoolData?.affiliationNo || user?.schoolData?.affiliationNo || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 group">
                                        <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 text-[#42A5F5]"><UserCheck size={22} /></div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Primary operator</p>
                                            <p className="text-[16px] font-black text-slate-700 capitalize">{schoolData?.adminDetails?.fullName?.toLowerCase() || user?.name?.toLowerCase()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 group">
                                        <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 text-[#42A5F5]"><Phone size={22} /></div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Contact No.</p>
                                            <p className="text-[16px] font-black text-slate-700">{schoolData?.adminDetails?.mobile || user?.phone || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 group">
                                        <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 text-[#42A5F5]"><Mail size={22} /></div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                                            <p className="text-[16px] font-black text-slate-700 lowercase">{schoolData?.adminDetails?.email || user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-5 bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-inner">
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-[#42A5F5] mt-1"><MapPin size={22} /></div>
                                        <div>
                                            <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address</p>
                                            <p className="text-[15px] font-bold text-slate-600 capitalize leading-relaxed">
                                                {user?.address?.fullAddress?.toLowerCase()}<br />
                                                {user?.address?.district?.toLowerCase()}, {user?.address?.state?.toLowerCase()} - {user?.address?.pincode}
                                            </p>
                                        </div>
                                    </div>
                                    {/* <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="bg-[#42A5F5] p-5 rounded-[2rem] shadow-lg shadow-blue-100">
                                            <p className="text-[10px] font-black text-white/70 uppercase mb-1 italic tracking-widest">Monthly quota</p>
                                            <p className="text-xl font-black text-white tracking-tighter">₹{schoolData?.subscription?.monthlyFee || 0}</p>
                                        </div>
                                        <div className="bg-slate-800 p-5 rounded-[2rem] shadow-lg">
                                            <p className="text-[10px] font-black text-white/50 uppercase mb-1 italic tracking-widest">Session cycle</p>
                                            <p className="text-xl font-black text-white italic tracking-tighter">{schoolData?.sessionYear || "2026-27"}</p>
                                        </div>
                                    </div> */}
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {user?.role === 'student' && (
                                            <div className="col-span-1 md:col-span-2 flex items-center gap-4 bg-blue-50 p-5 rounded-[2rem] border border-blue-100">
                                                <div className="bg-white p-3 rounded-xl text-[#42A5F5] shadow-sm"><Hash size={20} /></div>
                                                <div>
                                                    <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Admission number</p>
                                                    <p className="text-[15px] font-black text-[#42A5F5] uppercase tracking-widest">{user?.admissionNo || "not_logged"}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-5">
                                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-400"><User size={22} /></div>
                                            <div>
                                                <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Father's name</p>
                                                <p className="text-[15px] font-black text-slate-700 capitalize">{user?.fatherName?.toLowerCase() || "unspecified"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-400"><Heart size={22} /></div>
                                            <div>
                                                <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Mother's name</p>
                                                <p className="text-[15px] font-black text-slate-700 capitalize">{user?.motherName?.toLowerCase() || "unspecified"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-400"><Calendar size={22} /></div>
                                            <div>
                                                <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Date of birth</p>
                                                <p className="text-[15px] font-black text-slate-700 uppercase">{formatDate(user?.dob)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-400"><Users size={22} /></div>
                                            <div>
                                                <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Gender</p>
                                                <p className="text-[15px] font-black text-slate-700 capitalize">{user?.gender?.toLowerCase() || "n/a"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-400"><Phone size={22} /></div>
                                            <div>
                                                <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Contact No.</p>
                                                <p className="text-[15px] font-black text-slate-700">{user?.phone || "n/a"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-400"><ShieldCheck size={22} /></div>
                                            <div>
                                                <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Religion</p>
                                                <p className="text-[15px] font-black text-slate-700 capitalize">{user?.religion?.toLowerCase() || "n/a"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- SUBJECTS & EMAIL NODE --- */}
                                    <div className="flex items-center gap-5 bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100">
                                        <div className="bg-white p-3 rounded-xl text-[#42A5F5] shadow-sm">
                                            {user?.role === 'teacher' ? <Fingerprint size={22} /> : <Mail size={22} />}
                                        </div>
                                        <div className="flex-1">
                                            {/* Agar teacher hai toh subjects dikhao */}
                                            {user?.role === 'teacher' ? (
                                                <>
                                                    <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                                                        Assigned subjects
                                                    </p>
                                                    <p className="text-[15px] font-black text-slate-700 capitalize italic mb-3">
                                                        {user.subjects?.length > 0 ? user.subjects.join(', ') : 'No subjects assigned'}
                                                    </p>

                                                    {/* Teacher ke liye email yahan niche add kar di */}
                                                    <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                                                        Registered email
                                                    </p>
                                                    <p className="text-[15px] font-black text-[#42A5F5] lowercase italic">
                                                        {user?.email}
                                                    </p>
                                                </>
                                            ) : (
                                                /* Student ke liye sirf email */
                                                <>
                                                    <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                                                        Registered email
                                                    </p>
                                                    <p className="text-[15px] font-black text-slate-700 lowercase italic">
                                                        {user?.email}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-5 bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-400 mt-1"><MapPin size={22} /></div>
                                        <div className="flex-1">
                                            <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest mb-2">Home Address</p>
                                            <p className="text-[15px] font-bold text-slate-600 capitalize leading-relaxed">
                                                {user?.address?.fullAddress?.toLowerCase()}<br />
                                                {user?.address?.district?.toLowerCase()}, {user?.address?.state?.toLowerCase()} - {user?.address?.pincode}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Neural Toast */}
            {toast.show && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[9999] px-8 py-4 rounded-[2rem] font-black italic text-[13px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-bounce flex items-center gap-3 border ${toast.type === 'success'
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-rose-500 text-white border-rose-400'
                    }`}>
                    {toast.type === 'success' ? <Check size={18} /> : <ShieldCheck size={18} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default MyAccount;
import React, { useState, useEffect } from 'react';
import { Globe, Plus, IndianRupee, TrendingUp, Trash2, Edit3, X, Save, RotateCcw, Users, Bot, Loader2,School, Hash, MapPin, ArrowRight, Phone, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingSchool, setEditingSchool] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const backupUser = JSON.parse(localStorage.getItem('superadmin_backup'));

        if (currentUser?.role !== 'superadmin' && backupUser) {
            localStorage.setItem('user', JSON.stringify(backupUser));
            window.location.reload();
        } else {
            fetchStats();
        }
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            // Backend se stats mangwao
            const { data } = await API.get('/superadmin/stats');

            // Agar bache ne issue dala hai, toh backend se stats.pendingIssues aur stats.issueCount aana chahiye
            setStats(data);
        } catch (err) {
            console.error("Stats Fetch Error:", err);
            // Auth error check...
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            await API.put(`/superadmin/update-school/${editingSchool._id}`, editData);
            setEditingSchool(null);
            fetchStats();
        } catch (err) {
            alert("Update failed");
        }
    };

    const handleGhostLogin = async (schoolId) => {
        try {
            if (!schoolId) return alert("Invalid school reference");
            const currentUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('superadmin_backup', JSON.stringify(currentUser));
            const { data } = await API.get(`/superadmin/login-as-school/${schoolId}`);
            if (data.token) {
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = '/dashboard';
            }
        } catch (err) {
            alert(err.response?.data?.message || "Access failed!");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Caution: Deactivate this institution? Revenue data will be preserved.")) {
            try {
                await API.delete(`/superadmin/delete-school/${id}`);
                fetchStats();
            } catch (err) {
                alert("Deletion failed");
            }
        }
    };

    useEffect(() => {
        if (editingSchool) {
            document.body.style.overflow = 'hidden'; // Background pause (Scroll disable)
        } else {
            document.body.style.overflow = 'unset'; // Background normal
        }
        return () => { document.body.style.overflow = 'unset'; }; // Cleanup
    }, [editingSchool]);

   if (loading) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
      <Loader2 className="w-12 h-12 animate-spin text-[#42A5F5]" />
      <p className="text-slate-500 font-bold italic">Loading...</p>
    </div>
  );
}

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-8 font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Executive Hub</h1>
                    <p className="text-lg font-medium text-slate-500 italic mt-1">Global system monitoring & asset management</p>
                </div>
                <button
                    onClick={() => navigate('/superadmin/onboard')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-95 text-lg"
                >
                    <Plus size={24} /> Onboard New School
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                    { label: 'Active institutions', value: stats?.activeSchools || 0, icon: <Globe />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Total network revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, icon: <IndianRupee />, color: 'text-violet-600', bg: 'bg-violet-50' },
                    // 🔥 YAHAN ISSUE COUNT: Agar backend se issueCount aa raha hai toh wo dikhega
                    { label: 'Technical Issues', value: stats?.issueCount || 0, icon: <ShieldAlert />, color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-md transition-shadow">
                        <div className={`${s.bg} ${s.color} p-5 rounded-3xl shadow-inner`}>{s.icon}</div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>
            // 3. Technical Support Terminal Card (Action required badge fix)
            <div
                onClick={() => navigate('/superadmin/technical')}
                className="mb-10 p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex flex-col md:flex-row items-center justify-between cursor-pointer hover:shadow-md transition-all group border-l-8 border-l-rose-500"
            >
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-rose-50 rounded-3xl text-rose-500 group-hover:scale-110 transition-transform shadow-inner">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Technical support terminal</h3>
                        {/* 🔥 YAHAN DYNAMIC COUNT: stats?.pendingIssues backend se aana chahiye */}
                        <p className="text-lg font-medium text-slate-500 italic">
                            {stats?.pendingIssues > 0
                                ? `Detecting ${stats.pendingIssues} unresolved anomalies in the network`
                                : `No critical issues reported across ${stats?.activeSchools || 0} nodes`}
                        </p>
                    </div>
                </div>

                <div className="mt-6 md:mt-0 flex items-center gap-4">
                    {/* 🔥 ACTION REQUIRED BADGE: Jab tak backend se data 0 se bada nahi hoga, ye nahi dikhega */}
                    {stats?.pendingIssues > 0 && (
                        <span className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-black animate-pulse shadow-lg shadow-rose-200 uppercase">
                            {stats.pendingIssues} Action required
                        </span>
                    )}
                    <div className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center gap-2 group-hover:bg-rose-600 transition-colors">
                        View Logs <ArrowRight size={18} />
                    </div>
                </div>
            </div>
            {/* Main Inventory Table */}
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-10">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <ShieldCheck size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Institution Node Inventory</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead>
                            <tr className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-6 pb-4">Sector details</th>
                                <th className="px-6 pb-4">Admin node</th>
                                <th className="px-6 pb-4">Active strength</th>
                                <th className="px-6 pb-4">Revenue log</th>
                                <th className="px-6 pb-4">Protocol status</th>
                                <th className="px-6 pb-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.schools.map((school, i) => (
                                <tr key={i} className="group hover:bg-slate-50 transition-all rounded-3xl shadow-sm cursor-pointer">
                                    <td className="py-6 px-6 bg-white border-y border-l border-slate-100 first:rounded-l-[2rem]" onClick={() => handleGhostLogin(school._id)}>
                                        <div className="flex items-center gap-5">
                                            <img
                                                src={school.logo ? `http://localhost:5000${school.logo}` : 'https://via.placeholder.com/60'}
                                                className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm"
                                                alt="logo"
                                            />
                                            <div>
                                                <p className="font-extrabold text-slate-700 text-lg group-hover:text-indigo-600 transition-colors">{school.schoolName}</p>
                                                <p className="text-xs font-bold text-slate-400 tracking-wider">Ref: {school.affiliationNo}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-6 bg-white border-y border-slate-100" onClick={() => handleGhostLogin(school._id)}>
                                        <p className="text-sm font-bold text-slate-600">{school.adminDetails?.fullName}</p>
                                        <p className="text-xs text-slate-400">{school.adminDetails?.email}</p>
                                    </td>
                                    <td className="py-6 px-6 bg-white border-y border-slate-100" onClick={() => handleGhostLogin(school._id)}>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-indigo-500">{school.studentCount || 0} Students</span>
                                            <span className="text-xs text-slate-400">{school.teacherCount || 0} Faculty</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-6 bg-white border-y border-slate-100 font-extrabold text-lg text-slate-700">
                                        ₹{school.subscription?.totalPaid?.toLocaleString()}
                                    </td>
                                    <td className="py-6 px-6 bg-white border-y border-slate-100">
                                        <span className={`text-xs font-black px-5 py-2 rounded-full tracking-wide ${school.subscription?.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                            {school.subscription?.status}
                                        </span>
                                    </td>
                                    <td className="py-6 px-6 bg-white border-y border-r border-slate-100 last:rounded-r-[2rem]">
                                        <div className="flex gap-3 justify-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingSchool(school); setEditData(school); }}
                                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                            >
                                                <Edit3 size={20} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(school._id); }}
                                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingSchool && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    {/* 1. Backdrop (Piche ka kala hissa jo click karne par band nahi hoga, logic fix) */}
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />

                    {/* 2. Modal Container (Center mein lock) */}
                    <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 italic max-h-[90vh] overflow-y-auto custom-scrollbar">

                        {/* Header */}
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                            <div>
                                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">Re-configure node</h3>
                                <p className="text-slate-500 font-medium">Update institutional protocols & settings</p>
                            </div>
                            <button
                                onClick={() => setEditingSchool(null)}
                                className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 ml-2">School name</label>
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-4 focus-within:border-indigo-400 transition-colors">
                                        <School size={20} className="text-slate-300 mr-3" />
                                        <input className="bg-transparent font-bold text-slate-700 outline-none w-full uppercase" value={editData.schoolName} onChange={(e) => setEditData({ ...editData, schoolName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 ml-2">Affiliation number</label>
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-4 focus-within:border-indigo-400 transition-colors">
                                        <Hash size={20} className="text-slate-300 mr-3" />
                                        <input className="bg-transparent font-bold text-slate-700 outline-none w-full uppercase" value={editData.affiliationNo} onChange={(e) => setEditData({ ...editData, affiliationNo: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 ml-2">Deployment address</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-4 focus-within:border-indigo-400 transition-colors">
                                    <MapPin size={20} className="text-slate-300 mr-3" />
                                    <input className="bg-transparent font-bold text-slate-700 outline-none w-full uppercase" value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 ml-2">Admin full name</label>
                                    <input className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-indigo-400 uppercase" value={editData.adminDetails?.fullName} onChange={(e) => setEditData({ ...editData, adminDetails: { ...editData.adminDetails, fullName: e.target.value } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 ml-2">Contact number</label>
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-4 focus-within:border-indigo-400 transition-colors">
                                        <Phone size={18} className="text-slate-300 mr-3" />
                                        <input className="bg-transparent font-bold text-slate-700 outline-none w-full" value={editData.adminDetails?.mobile} onChange={(e) => setEditData({ ...editData, adminDetails: { ...editData.adminDetails, mobile: e.target.value } })} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 ml-2">Total paid</label>
                                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-slate-700 outline-none" value={editData.subscription?.totalPaid} onChange={(e) => setEditData({ ...editData, subscription: { ...editData.subscription, totalPaid: Number(e.target.value) } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 ml-2">Monthly fee</label>
                                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-slate-700 outline-none" value={editData.subscription?.monthlyFee} onChange={(e) => setEditData({ ...editData, subscription: { ...editData.subscription, monthlyFee: Number(e.target.value) } })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500 ml-2">Status</label>
                                    <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-slate-700 outline-none" value={editData.subscription?.status} onChange={(e) => setEditData({ ...editData, subscription: { ...editData.subscription, status: e.target.value } })}>
                                        <option value="Active">Active</option>
                                        <option value="Terminated">Terminated</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdate}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mt-6 transition-all active:scale-[0.98]"
                            >
                                <Save size={24} /> Save changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, CheckCircle2, User, School, ExternalLink, ArrowLeft, AlertCircle } from 'lucide-react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";

const SuperAdminTechnical = () => {
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, msg: '' });
    const [zoomImg, setZoomImg] = useState(null);

    const loadIssues = async () => {
        try {
            const { data } = await API.get('/technical/all-reports');
            setIssues(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadIssues(); }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await API.put(`/technical/update-status/${id}`, { status: newStatus });
            setToast({ show: true, msg: `Issue marked as ${newStatus}!` });
            setTimeout(() => setToast({ show: false, msg: '' }), 3000);
            loadIssues();
        } catch (err) {
            alert("Update failed");
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-8 font-sans italic text-slate-800 overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header Section */}
            <div className="flex items-center gap-5 mb-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-4 bg-white rounded-3xl border border-slate-200 text-indigo-600 shadow-sm hover:bg-indigo-50 transition-all active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3 uppercase">
                        <ShieldAlert className="text-rose-500" size={32} /> Technical Problems
                    </h1>
                    <p className="text-slate-500 font-medium italic">Monitor system anomalies and user reports across nodes</p>
                </div>
            </div>

            {/* Issues Feed */}
            <div className="grid gap-8 max-w-6xl mx-auto">
                {issues.length > 0 ? issues.map((issue) => (
                    <div key={issue._id} className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">

                        {/* Status & Actions Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div className="space-y-2">
                                <span className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${issue.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                    {issue.status}
                                </span>
                                <h3 className="text-2xl font-black text-slate-700 uppercase tracking-tighter">{issue.issueType}</h3>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => updateStatus(issue._id, 'Received')}
                                    className="bg-slate-50 hover:bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200 text-xs font-black uppercase text-slate-500 transition-all"
                                >
                                    Mark Received
                                </button>
                                <button
                                    onClick={() => updateStatus(issue._id, 'Resolved')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase shadow-lg shadow-indigo-100 transition-all"
                                >
                                    Mark Resolved
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Personnel & Report Data */}
                            <div className="space-y-4">
                                <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-500">
                                            <User size={18} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 uppercase">
                                            Reported By: <span className="text-slate-700 font-black italic">{issue.userId?.name} ({issue.userId?.role})</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-500">
                                            <School size={18} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 uppercase">
                                            School Name: <span className="text-slate-700 font-black italic">{issue.schoolId?.schoolName}</span>
                                        </p>
                                    </div>

                                    <div className="mt-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-inner">
                                        <p className="text-base font-bold text-slate-600 italic leading-relaxed">
                                            "{issue.description || 'No description provided.'}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Screenshot Evidence Box */}
                            <div className="relative">
                                {issue.screenshot ? (
                                    <div
                                        className="relative group cursor-zoom-in rounded-[2rem] overflow-hidden border-2 border-slate-100 h-64"
                                        onClick={() => setZoomImg(issue.screenshot.startsWith('http') ? issue.screenshot : `${BASE_URL}${issue.screenshot}`)}
                                    >
                                        <img
                                            src={issue.screenshot.startsWith('http') ? issue.screenshot : `${BASE_URL}${issue.screenshot}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            alt="Evidence"
                                        />
                                        <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <div className="bg-white p-4 rounded-full shadow-2xl text-indigo-600 animate-bounce">
                                                <ExternalLink size={24} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-300">
                                        <AlertCircle size={48} className="mb-2 opacity-20" />
                                        <p className="text-xs font-black uppercase tracking-widest italic opacity-40">No visual evidence provided</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-40 bg-white rounded-[4rem] border border-dashed border-slate-200">
                        <CheckCircle2 size={64} className="mx-auto text-emerald-400 mb-6 opacity-30" />
                        <h3 className="text-2xl font-black text-slate-300 uppercase italic">System Integrity: 100%</h3>
                        <p className="text-slate-400 font-medium italic mt-2">No pending technical anomalies detected in the network.</p>
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black uppercase text-sm shadow-2xl shadow-indigo-200 animate-bounce">
                    {toast.msg}
                </div>
            )}

            {/* Zoom Image Modal */}
            {zoomImg && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setZoomImg(null)}></div>
                    <div className="relative z-10 max-w-5xl w-full h-full flex flex-col items-center justify-center">
                        <button
                            onClick={() => setZoomImg(null)}
                            className="absolute top-0 right-0 m-4 bg-white text-indigo-600 p-4 rounded-full font-black shadow-2xl active:scale-90 transition-all z-20"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <img src={zoomImg} className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20 object-contain" alt="Zoomed" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminTechnical;
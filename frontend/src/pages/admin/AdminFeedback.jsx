import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Plus, Trash2, Power, PowerOff, Sparkles, Layers, Star, UserCircle, ChevronDown, ChevronUp, BarChart3, ChevronRight  } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

const AdminFeedback = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [title, setTitle] = useState('');
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);

    // --- NEW STATES FOR RESULTS VIEW ---
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'results'
    const [activeSession, setActiveSession] = useState(null);
    const [sessionResults, setSessionResults] = useState([]);
    const [expandedTeacher, setExpandedTeacher] = useState(null); // For comments dropdown

    useEffect(() => {
        fetchSessions();
    }, []);

    const triggerToast = (message, type = "success") => {
        setShowToast({ show: true, message, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const fetchSessions = async () => {
        try {
            const { data } = await API.get('/feedback/sessions');
            setSessions(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!title.trim()) return triggerToast("Please enter a feedback title!", "error");

        setLoading(true);
        try {
            await API.post('/feedback/create-session', { title });
            triggerToast("Feedback Request Broadcasted to all Students! 📡", "success");
            setTitle('');
            fetchSessions();
        } catch (err) {
            triggerToast("Failed to broadcast request.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (e, id) => {
        e.stopPropagation(); // Prevents opening the card
        try {
            await API.put(`/feedback/toggle-session/${id}`);
            fetchSessions();
        } catch (err) {
            triggerToast("Failed to update status.", "error");
        }
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation(); // Prevents opening the card
        setSessionToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!sessionToDelete) return;
        try {
            await API.delete(`/feedback/session/${sessionToDelete}`);
            triggerToast("Session deleted permanently 🗑️", "success");
            fetchSessions();
        } catch (err) {
            triggerToast("Failed to delete.", "error");
        } finally {
            setShowConfirmModal(false);
            setSessionToDelete(null);
            if (viewMode === 'results' && activeSession?._id === sessionToDelete) {
                setViewMode('list');
            }
        }
    };

    // --- FETCH RESULTS FOR SPECIFIC SESSION ---
    const handleViewResults = async (session) => {
        setActiveSession(session);
        setViewMode('results');
        setLoading(true);
        try {
            const { data } = await API.get(`/feedback/session-results/${session._id}`);
            setSessionResults(data);
            setExpandedTeacher(null); // Reset open comments
        } catch (error) {
            triggerToast("Failed to load results", "error");
            setViewMode('list');
        } finally {
            setLoading(false);
        }
    };

    // Smart Header Back Button Logic
    const handleBack = () => {
        if (viewMode === 'results') {
            setViewMode('list');
            setActiveSession(null);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* HEADER */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

                <div className="flex justify-between items-center gap-2 relative z-10">
                    <button
                        onClick={handleBack}
                        className="p-2 md:p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <div className="text-center absolute left-1/2 -translate-x-1/2">
                        <h1 className="text-3xl md:text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                            {viewMode === 'results' ? 'Feedback Results' : 'Feedback'}
                        </h1>
                        <p className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-1 whitespace-nowrap">
                            {viewMode === 'results' ? activeSession?.title : 'Manage Evaluations'}
                        </p>
                    </div>

                    <div className="p-2 md:p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                        {viewMode === 'results' ? <BarChart3 size={24} /> : <MessageSquare size={24} />}
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-5xl mx-auto space-y-6">
                
                {/* ==================================================== */}
                {/* VIEW 1: LIST MODE (Default)                          */}
                {/* ==================================================== */}
                {viewMode === 'list' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* BROADCAST FORM */}
                        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl border border-slate-100 ring-1 ring-slate-50 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <MessageSquare size={24} className="text-[#42A5F5]" />
                                <h2 className="text-xl font-black text-slate-700 uppercase tracking-[0.2em]">Initiate New Request</h2>
                            </div>

                            <form onSubmit={handleBroadcast} className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 flex items-center bg-slate-50 border-2 border-slate-200 focus-within:border-[#42A5F5] rounded-3xl p-4 gap-4 transition-all">
                                    <Layers size={20} className="text-[#42A5F5]" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Mid-Term Teacher Evaluation"
                                        className="bg-transparent w-full font-bold text-lg outline-none text-slate-700"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="bg-[#42A5F5] text-white px-10 py-4 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-600 active:scale-95 transition-all border-b-4 border-blue-700 flex justify-center items-center shrink-0">
                                    {loading ? <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span> : <><Plus size={18} className="mr-2" /> Send</>}
                                </button>
                            </form>
                        </div>

                        {/* LOGS / HISTORY */}
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-400 ml-4 mb-4">Active & Past Broadcasts</h2>

                            {sessions.length === 0 ? (
                                <div className="bg-white p-12 rounded-[3.5rem] border border-dashed border-slate-300 text-center shadow-sm">
                                    <MessageSquare size={48} className="text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold text-lg">No feedback requests initiated yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sessions.map((session) => (
                                        <motion.div 
                                            key={session._id} 
                                            initial={{ opacity: 0, scale: 0.95 }} 
                                            animate={{ opacity: 1, scale: 1 }} 
                                            onClick={() => handleViewResults(session)}
                                            className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col justify-between group hover:border-[#42A5F5] transition-all cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="mb-4 relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${session.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                        {session.isActive ? 'Receiving Responses' : 'Closed'}
                                                    </span>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {new Date(session.createdAt).toLocaleDateString('en-GB')}
                                                    </p>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide leading-tight mt-3">{session.title}</h3>
                                                <p className="text-xs font-bold text-[#42A5F5] mt-1 flex items-center gap-1">Click to view results <ChevronRight size={14}/></p>
                                            </div>

                                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 relative z-10">
                                                <button onClick={(e) => handleToggle(e, session._id)} className={`flex-1 flex justify-center items-center gap-2 p-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${session.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                                    {session.isActive ? <><PowerOff size={14} /> Close Form</> : <><Power size={14} /> Re-Open</>}
                                                </button>
                                                <button onClick={(e) => handleDeleteClick(e, session._id)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ==================================================== */}
                {/* VIEW 2: RESULTS MODE (Dynamic View)                  */}
                {/* ==================================================== */}
                {viewMode === 'results' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="w-12 h-12 border-4 border-blue-200 border-t-[#42A5F5] rounded-full animate-spin"></div>
                            </div>
                        ) : sessionResults.length === 0 ? (
                            <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 text-center">
                                <BarChart3 size={48} className="text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold text-lg">No ratings submitted by students yet.</p>
                            </div>
                        ) : (
                            sessionResults.map((t, idx) => (
                                <motion.div key={t.teacherEmpId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl border border-slate-100 ring-1 ring-slate-50">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                        
                                        {/* Teacher Info */}
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#42A5F5] shrink-0">
                                                <UserCircle size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide">{t.teacherName}</h3>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1 bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-100">
                                                    Total Reviews: {t.totalReviews}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Ratings Display */}
                                        <div className="flex flex-col items-center md:items-end w-full md:w-auto bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-2xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star size={28} className="text-amber-400" fill="#fbbf24" />
                                                <span className="text-3xl font-black text-slate-800">{t.averageRating}</span>
                                                <span className="text-sm font-black text-slate-400 mt-2">/ 5</span>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Score</p>
                                        </div>
                                    </div>

                                    {/* Comments Accordion / Dropdown */}
                                    {t.comments && t.comments.length > 0 && (
                                        <div className="mt-6 border-t border-slate-100 pt-4">
                                            <button 
                                                onClick={() => setExpandedTeacher(expandedTeacher === t.teacherEmpId ? null : t.teacherEmpId)} 
                                                className="w-full flex items-center justify-between bg-slate-50 p-4 rounded-2xl hover:bg-blue-50 transition-colors border border-slate-100 text-[#42A5F5] font-black uppercase tracking-widest text-xs"
                                            >
                                                <span>View Comments ({t.comments.length})</span>
                                                {expandedTeacher === t.teacherEmpId ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            
                                            <AnimatePresence>
                                                {expandedTeacher === t.teacherEmpId && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                        <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100 max-h-60 overflow-y-auto">
                                                            {t.comments.map((comment, cIdx) => (
                                                                <div key={cIdx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3">
                                                                    <MessageSquare size={16} className="text-slate-300 shrink-0 mt-0.5" />
                                                                    <p className="text-sm font-bold text-slate-600 italic">"{comment}"</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}

            </div>

            {/* --- ANIMATED DELETE CONFIRMATION MODAL --- */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 20 }} 
                            className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl text-center border-4 border-rose-50"
                        >
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
                                <Trash2 size={32} className="text-rose-500" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">Delete Session?</h2>
                            <p className="text-slate-500 font-medium mb-8 text-sm">
                                This will permanently delete the feedback request and all student ratings associated with it.
                            </p>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowConfirmModal(false)} 
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDelete} 
                                    className="flex-1 bg-rose-500 text-white py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-rose-600 shadow-xl transition-all border-b-4 border-rose-700 active:scale-95"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminFeedback;
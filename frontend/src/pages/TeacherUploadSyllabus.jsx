import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Send, CheckCircle, Clock, X, AlertTriangle, BookOpen, ChevronDown, Users, Layers, LayoutDashboard, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

const TeacherUploadSyllabus = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // Views & Lists
    const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'monitor'
    const [pendingRequests, setPendingRequests] = useState([]);
    const [managedSyllabuses, setManagedSyllabuses] = useState([]); // For monitor hub
    const [classes, setClasses] = useState([]);
    const [isClassOpen, setIsClassOpen] = useState(false);

    // Naya State: Track karne ke liye ki konsa syllabus edit mode mein hai
    const [editModes, setEditModes] = useState({});

    // Modals State
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // Action Modal State (Delete & Publish ke liye)
    const [actionConfirmModal, setActionConfirmModal] = useState({ show: false, action: '', id: '' });

    // Editor Modals State
    const [showEditorModal, setShowEditorModal] = useState(false);
    const [showEditorConfirmModal, setShowEditorConfirmModal] = useState(false);
    const [editorData, setEditorData] = useState({ syllabusId: '', subjectName: '', title: '', grade: '', content: '', mode: 'submit' });

    // Form State
    const [formData, setFormData] = useState({ title: '', targetGrade: '' });

    useEffect(() => {
        fetchPendingRequests();
        fetchClasses();
        if (user?.assignedClass) {
            fetchManagedSyllabuses();
        }
    }, [viewMode]);

    const fetchPendingRequests = async () => {
        try {
            const { data } = await API.get('/exam-syllabus/pending');
            setPendingRequests(data);
        } catch (err) { console.error("Error fetching pending:", err); }
    };

    const fetchManagedSyllabuses = async () => {
        try {
            const { data } = await API.get(`/exam-syllabus/monitor/${user.assignedClass}`);
            setManagedSyllabuses(data);
        } catch (err) { console.error("Error fetching managed:", err); }
    };

    const fetchClasses = async () => {
        try {
            const { data } = await API.get('/notices/meta/classes');
            setClasses(data);
        } catch (err) { console.error("Error classes:", err); }
    };

    const triggerToast = (msg, type = "success") => {
        setShowToast({ show: true, message: msg, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    // --- INITIATE LOGIC ---
    const handlePreSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.targetGrade) return triggerToast("Please fill all details! ⚠️", "error");
        setShowInitiateModal(false);
        setTimeout(() => setShowConfirmModal(true), 300);
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            await API.post('/exam-syllabus/initiate', { grade: formData.targetGrade, title: formData.title });
            setShowConfirmModal(false);
            setFormData({ title: '', targetGrade: '' });
            triggerToast("Request Broadcasted Successfully! 📡", "success");
            fetchPendingRequests();
            fetchManagedSyllabuses();
        } catch (err) {
            setShowConfirmModal(false);
            triggerToast(err.response?.data?.message || "Failed to initiate.", "error");
        } finally { setLoading(false); }
    };

    // --- EDITOR LOGIC (Subject Teacher & Class Teacher Edit) ---
    const openEditor = (syllabusId, title, grade, subjectName, currentContent = '', mode = 'submit') => {
        setEditorData({ syllabusId, title, grade, subjectName, content: currentContent, mode });
        setShowEditorModal(true);
    };

    const handleEditorContinue = (e) => {
        e.preventDefault();
        if (!editorData.content.trim()) return triggerToast("Content cannot be empty! ⚠️", "error");
        setShowEditorModal(false);
        setTimeout(() => setShowEditorConfirmModal(true), 300);
    };

    const handleEditorFinalSubmit = async () => {
        setLoading(true);
        try {
            if (editorData.mode === 'submit') {
                await API.post(`/exam-syllabus/submit/${editorData.syllabusId}`, {
                    subjectName: editorData.subjectName,
                    content: editorData.content,
                    action: 'submit'
                });
            } else {
                await API.put(`/exam-syllabus/edit-subject/${editorData.syllabusId}`, {
                    subjectName: editorData.subjectName,
                    content: editorData.content
                });
            }
            setShowEditorConfirmModal(false);
            triggerToast("Syllabus Saved Successfully! 📝", "success");
            fetchPendingRequests();
            if (viewMode === 'monitor') fetchManagedSyllabuses();
        } catch (err) {
            setShowEditorConfirmModal(false);
            triggerToast("Failed to save syllabus.", "error");
        } finally { setLoading(false); }
    };

    // --- MANAGE HUB LOGIC ---
    const handleDeleteSyllabus = (id) => {
        setActionConfirmModal({ show: true, action: 'delete', id });
    };

    const handlePublish = (id) => {
        setActionConfirmModal({ show: true, action: 'publish', id });
    };

    const executeActionConfirm = async () => {
        setLoading(true);
        try {
            if (actionConfirmModal.action === 'delete') {
                await API.delete(`/exam-syllabus/${actionConfirmModal.id}`);
                triggerToast("Syllabus Request Deleted! 🗑️", "success");
                fetchManagedSyllabuses();
                fetchPendingRequests();
            } else if (actionConfirmModal.action === 'publish') {
                await API.put(`/exam-syllabus/publish/${actionConfirmModal.id}`);
                triggerToast("Published to Students! 🚀", "success");
                fetchManagedSyllabuses();
            }
            setActionConfirmModal({ show: false, action: '', id: '' });
        } catch (err) {
            triggerToast(`${actionConfirmModal.action === 'delete' ? 'Deletion' : 'Publish'} failed.`, "error");
        } finally {
            setLoading(false);
        }
    };

    // Naya Logic: Global Update for a syllabus
    const toggleEditMode = (id) => {
        setEditModes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleGlobalUpdate = (id) => {
        setEditModes(prev => ({ ...prev, [id]: false })); // Edit mode off
        triggerToast("Updated Syllabus Successfully! ✨", "success");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">

            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* HEADER SECTION */}
            <div className="bg-[#42A5F5] px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible">
                <div className="flex justify-between items-center relative z-10">
                    <button onClick={() => {
                        if (viewMode === 'monitor') setViewMode('pending');
                        else navigate(-1);
                    }} className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-md active:scale-95 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-4xl font-black italic tracking-tight text-white capitalize">
                            {viewMode === 'monitor' ? 'Monitor Hub' : 'Class Syllabus'}
                        </h1>
                        <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-80 mt-1">
                            {viewMode === 'monitor'
                                ? `Class ${user?.assignedClass}`
                                : (user?.assignedClass ? 'Manage & Submit' : 'Submissions')}
                        </p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm">
                        {viewMode === 'monitor' ? <LayoutDashboard size={24} /> : <BookOpen size={24} />}
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20 space-y-6">

                {/* --- DEFAULT PENDING VIEW --- */}
                {viewMode === 'pending' && (
                    <>
                        {/* --- CLASS TEACHER CONTROLS --- */}
                        {user?.assignedClass && (
                            <div className="mb-8 flex flex-col gap-4">

                                {/* Monitor Hub Button (Top Right) */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setViewMode('monitor')}
                                        className="py-4 px-6 bg-white text-slate-700 rounded-[2rem] font-black uppercase tracking-widest shadow-md border border-[#DDE3EA] active:scale-95 transition-all hover:bg-blue-50 hover:text-[#42A5F5] text-[13px] flex items-center gap-3"
                                    >
                                        <LayoutDashboard size={20} className="text-[#42A5F5]" />
                                        Monitor Hub
                                    </button>
                                </div>

                                {/* Manage Syllabus Card (Below Monitor Hub) */}
                                <div className="bg-white p-6 rounded-[3.5rem] shadow-xl border border-[#DDE3EA] flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 capitalize">Manage Syllabus</h2>
                                        <p className="text-[#42A5F5] font-bold text-[13px] uppercase tracking-widest mt-1">
                                            Incharge: Class {user.assignedClass}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFormData({ ...formData, targetGrade: user.assignedClass });
                                            setShowInitiateModal(true);
                                        }}
                                        className="p-5 bg-[#42A5F5] text-white rounded-full shadow-lg shadow-blue-200 active:scale-90 transition-all hover:bg-blue-600"
                                    >
                                        <Plus size={28} />
                                    </button>
                                </div>

                            </div>
                        )}

                        <div className={`transition-all duration-300 ${!user?.assignedClass ? 'mt-16' : 'mt-8'}`}>
                            <h2 className="text-xl font-black text-slate-700 mb-6 flex items-center gap-2 px-2 uppercase tracking-widest">
                                <Clock className="text-amber-500" /> Pending Submissions
                            </h2>

                            {pendingRequests.length === 0 ? (
                                <div className="bg-white p-10 rounded-[3.5rem] border border-dashed border-slate-300 text-center shadow-sm">
                                    <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold text-lg">No pending requests. You are all caught up!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pendingRequests.map((req) => (
                                        req.subjects.filter(s => s.assignedTeachers.includes(user?.employeeId) && !s.isSubmitted).map((subject, idx) => (
                                            <motion.div key={`${req._id}-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-[#DDE3EA] relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-slate-800 capitalize">{req.title}</h3>
                                                        <p className="text-slate-500 font-bold text-[15px] mt-1">Class: {req.grade}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                                    <BookOpen className="text-[#42A5F5]" size={24} />
                                                    <span className="font-black text-blue-900 text-lg">{subject.subjectName}</span>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        openEditor(
                                                            req._id,
                                                            req.title,
                                                            req.grade,
                                                            subject.subjectName,
                                                            "",
                                                            "submit"
                                                        )
                                                    }
                                                    className="
        w-full 
        bg-white 
        text-[#42A5F5] 
        py-5 
        rounded-[2.5rem] 
        font-black 
        uppercase 
        tracking-widest 
        border border-[#DDE3EA]
        shadow-lg
        hover:shadow-[0_10px_30px_rgba(66,165,245,0.25)]
        hover:border-[#42A5F5]
        hover:bg-blue-50
        hover:scale-[1.02]
        active:scale-[0.97]
        transition-all duration-300
        flex justify-center items-center gap-3
        relative overflow-hidden group
    "
                                                >
                                                    {/* Shine Effect */}
                                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>

                                                    <Send
                                                        size={20}
                                                        className="relative z-10 group-hover:rotate-12 transition-transform duration-300"
                                                    />

                                                    <span className="relative z-10">
                                                        Open Editor
                                                    </span>
                                                </button>
                                            </motion.div>
                                        ))
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* --- MONITOR HUB VIEW (Class Teacher Power) --- */}
                {viewMode === 'monitor' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 mt-8">
                        {managedSyllabuses.length === 0 ? (
                            <div className="bg-white p-10 rounded-[3.5rem] border border-dashed border-slate-300 text-center shadow-sm">
                                <AlertTriangle size={48} className="text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold text-lg">No syllabus requests initiated yet.</p>
                            </div>
                        ) : (
                            managedSyllabuses.map(syllabus => {
                                const allSubmitted = syllabus.subjects.every(s => s.isSubmitted);
                                const isPublished = syllabus.status === 'published';
                                const isEditMode = editModes[syllabus._id];

                                return (
                                    <div key={syllabus._id} className={`bg-white p-8 rounded-[3.5rem] shadow-xl border relative overflow-hidden transition-all ${isEditMode ? 'border-[#42A5F5] shadow-blue-100' : 'border-[#DDE3EA]'}`}>
                                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-800 capitalize">{syllabus.title}</h3>
                                                <span className={`inline-block mt-2 px-4 py-1 rounded-full text-[12px] font-black uppercase tracking-widest ${isPublished ? 'bg-blue-100 text-[#42A5F5]' : 'bg-amber-100 text-amber-700'}`}>
                                                    Status: {syllabus.status}
                                                </span>
                                            </div>

                                            {/* Action Buttons: Delete aur Edit dono ek sath */}
                                            <div className="flex gap-3">
                                                {isPublished && (
                                                    <button onClick={() => toggleEditMode(syllabus._id)} className={`p-4 rounded-2xl transition-all shadow-sm ${isEditMode ? 'bg-slate-900 text-white' : 'bg-blue-50 text-[#42A5F5] hover:bg-blue-500 hover:text-white'}`}>
                                                        {isEditMode ? <X size={16} /> : <Edit3 size={16} />}
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteSyllabus(syllabus._id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            {syllabus.subjects.map((sub, idx) => {
                                                // Edit button tabhi dikhega jab (publish na hua ho) YA (publish ho gaya ho + edit mode on ho)
                                                const showSubjectEdit = sub.isSubmitted && (!isPublished || isEditMode);

                                                return (
                                                    <div key={idx} className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${sub.isSubmitted ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                                                        <div className="flex-1">
                                                            <h4 className="font-black text-lg text-slate-800">{sub.subjectName}</h4>
                                                            {sub.isSubmitted ? (
                                                                <p className="text-[16px] font-bold text-slate-500 mt-1 line-clamp-1 border-l-2 border-[#42A5F5] pl-2">{sub.content}</p>
                                                            ) : (
                                                                <p className="text-[16px] font-bold text-amber-600 mt-1 flex items-center gap-1"><Clock size={14} /> Pending submission</p>
                                                            )}
                                                        </div>

                                                        {showSubjectEdit && (
                                                            <button
                                                                onClick={() =>
                                                                    openEditor(
                                                                        syllabus._id,
                                                                        syllabus.title,
                                                                        syllabus.grade,
                                                                        sub.subjectName,
                                                                        sub.content,
                                                                        "edit"
                                                                    )
                                                                }
                                                                className="px-6 py-3 bg-white border-2 border-blue-200 text-[#42A5F5] rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-blue-500 hover:text-white transition-all shadow-md whitespace-nowrap"
                                                            >
                                                                <Edit3 size={20} /> Edit
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Bottom Action Controls */}
                                        {!isPublished && allSubmitted && (
                                            <button onClick={() => handlePublish(syllabus._id)} className="w-full py-5 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 hover:scale-[0.98] transition-all">
                                                <CheckCircle2 size={22} /> Publish to Students
                                            </button>
                                        )}

                                        {isPublished && !isEditMode && (
                                            <div className="w-full py-5 bg-blue-50/50 text-[#42A5F5] border-2 border-blue-100 rounded-[2.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                                <CheckCircle2 size={22} /> Published
                                            </div>
                                        )}

                                        {isPublished && isEditMode && (
                                            <button onClick={() => handleGlobalUpdate(syllabus._id)} className="w-full py-5 bg-[#42A5F5] text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:scale-[0.98] transition-all">
                                                <CheckCircle2 size={22} /> Update
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </motion.div>
                )}
            </div>

            {/* --- ALL MODALS DOWN HERE --- */}

            {/* MODAL: INITIATE SYLLABUS REQUEST */}
            <AnimatePresence>
                {showInitiateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInitiateModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white w-full max-w-md rounded-[3.5rem] p-8 shadow-2xl relative z-10 border border-[#DDE3EA]">
                            <button onClick={() => setShowInitiateModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-all">
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-black text-slate-800 mb-6 capitalize flex items-center gap-2">
                                <Layers className="text-[#42A5F5]" /> New Request
                            </h2>
                            <form onSubmit={handlePreSubmit} className="space-y-6">
                                <div>
                                    <div className="w-full flex items-center justify-between bg-blue-50 p-5 rounded-2xl border border-blue-200 cursor-not-allowed">
                                        <div className="flex items-center gap-3">
                                            <Users size={20} className="text-[#42A5F5]" />
                                            <span className="font-black text-blue-900 uppercase tracking-widest">Class {user?.assignedClass}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Locked</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Syllabus Title</label>
                                    <input type="text" placeholder="e.g. Half Yearly Exams" className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-300 text-[18px] font-bold text-slate-700 outline-none focus:border-[#42A5F5] focus:bg-white transition-all capitalize" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full bg-[#42A5F5] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all flex justify-center items-center gap-2 border-b-4 border-blue-700">
                                    Continue <ArrowLeft className="rotate-180" size={18} />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: EDITOR FORM */}
            <AnimatePresence>
                {showEditorModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditorModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[3.5rem] p-8 shadow-2xl relative z-10 border border-[#DDE3EA]">
                            <button onClick={() => setShowEditorModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-all">
                                <X size={20} />
                            </button>

                            <h2 className="text-3xl font-black text-slate-800 capitalize leading-tight mb-2">
                                {editorData.title}
                            </h2>
                            <div className="flex gap-2 mb-6">
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Class {editorData.grade}</span>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{editorData.subjectName}</span>
                            </div>

                            <form onSubmit={handleEditorContinue} className="space-y-6">
                                <div>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Syllabus Content</label>
                                    <textarea
                                        placeholder="Type chapters, topics, or detailed syllabus here..."
                                        className="w-full h-40 bg-slate-50 p-5 rounded-3xl border border-slate-300 text-[16px] font-bold text-slate-700 outline-none focus:border-[#42A5F5] focus:bg-white transition-all resize-none custom-scrollbar"
                                        value={editorData.content}
                                        onChange={(e) => setEditorData({ ...editorData, content: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2">
                                    Continue <ArrowLeft className="rotate-180" size={18} />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: CONFIRMATION (REUSABLE FOR INITIATE & EDIT) */}
            <AnimatePresence>
                {(showConfirmModal || showEditorConfirmModal) && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowConfirmModal(false); setShowEditorConfirmModal(false) }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl relative z-10 text-center border border-[#DDE3EA]">
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="text-amber-500" size={36} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Confirm Action</h2>
                            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                                {showConfirmModal
                                    ? `Request '${formData.title}' syllabus from all Class ${formData.targetGrade} teachers?`
                                    : `Save syllabus content for ${editorData.subjectName}?`}
                            </p>

                            <div className="flex gap-4">
                                <button disabled={loading} onClick={showConfirmModal ? handleFinalSubmit : handleEditorFinalSubmit} className="flex-1 bg-[#42A5F5] text-white py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex justify-center items-center">
                                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Yes, Confirm"}
                                </button>
                                <button onClick={() => { setShowConfirmModal(false); setShowEditorConfirmModal(false) }} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-200">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 3: DELETE / PUBLISH CONFIRMATION */}
            <AnimatePresence>
                {actionConfirmModal.show && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionConfirmModal({ show: false, action: '', id: '' })} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl relative z-10 text-center border border-[#DDE3EA]">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${actionConfirmModal.action === 'delete' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                {actionConfirmModal.action === 'delete' ? <Trash2 className="text-red-500" size={36} /> : <CheckCircle2 className="text-emerald-500" size={36} />}
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Are you sure?</h2>
                            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                                {actionConfirmModal.action === 'delete'
                                    ? "Delete this entire syllabus request? It will be removed from all teachers and students!"
                                    : "Publish to students? They will now see this in their dashboard."}
                            </p>

                            <div className="flex gap-4">
                                <button disabled={loading} onClick={executeActionConfirm} className={`flex-1 text-white py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex justify-center items-center ${actionConfirmModal.action === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Yes, Confirm"}
                                </button>
                                <button onClick={() => setActionConfirmModal({ show: false, action: '', id: '' })} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-200">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default TeacherUploadSyllabus;
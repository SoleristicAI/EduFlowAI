import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Send, CheckCircle, Clock, X, AlertTriangle, BarChart3, ChevronDown, Users, LayoutDashboard, CheckCircle2, Save, Trash2, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";

const TeacherUploadResult = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // Views & Lists
    const [viewMode, setViewMode] = useState('pending'); // 'pending' (Subject Teacher) or 'monitor' (Class Teacher)
    const [pendingRequests, setPendingRequests] = useState([]);
    const [managedResults, setManagedResults] = useState([]);

    // Dropdown Data
    const [examTitles, setExamTitles] = useState([]); // Fetched from datesheets
    const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
    const [returnViewMode, setReturnViewMode] = useState('pending');

    // Modals State
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Editor State (The Student Grid)
    const [showEditorModal, setShowEditorModal] = useState(false);
    const [showEditorConfirmModal, setShowEditorConfirmModal] = useState(false);
    const [openStatus, setOpenStatus] = useState(null);

    // Editor Data Context
    const [editorData, setEditorData] = useState({
        resultId: '', subjectName: '', examTitle: '', maxMarks: 0, students: []
    });

    // Initiate Form State (Class Teacher)
    const [formData, setFormData] = useState({ title: '', maxMarks: '' });

    // Naya State: Track karne ke liye ki konsa result edit mode mein hai
    const [editModes, setEditModes] = useState({});
    // Action Modal State (Delete & Publish ke liye)
    const [actionConfirmModal, setActionConfirmModal] = useState({ show: false, action: '', id: '' });

    // --- MANAGE HUB LOGIC ---
    const handleDeleteResult = (id) => setActionConfirmModal({ show: true, action: 'delete', id });
    const handlePublish = (id) => setActionConfirmModal({ show: true, action: 'publish', id });

    const executeActionConfirm = async () => {
        setLoading(true);
        try {
            if (actionConfirmModal.action === 'delete') {
                await API.delete(`/exam-results/${actionConfirmModal.id}`);
                triggerToast("Result Record Deleted! 🗑️", "success");
            } else if (actionConfirmModal.action === 'publish') {
                await API.put(`/exam-results/publish/${actionConfirmModal.id}`);
                triggerToast("Published to Students! 🚀", "success");
            }
            fetchManagedResults();
            setActionConfirmModal({ show: false, action: '', id: '' });
        } catch (err) {
            triggerToast("Action failed.", "error");
        } finally { setLoading(false); }
    };

    const toggleEditMode = (id) => setEditModes(prev => ({ ...prev, [id]: !prev[id] }));
    const handleGlobalUpdate = (id) => {
        setEditModes(prev => ({ ...prev, [id]: false }));
        triggerToast("Results Updated Successfully! ✨", "success");
    };

    // FAST LOAD EFFECT
    useEffect(() => {
        fetchPendingRequests();
        if (user?.assignedClass) {
            fetchManagedResults();
            fetchDatesheetTitles(); // Load titles IMMEDIATELY on page load
        }
    }, [viewMode]);

    const fetchPendingRequests = async () => {
        try {
            const { data } = await API.get('/exam-results/pending');
            setPendingRequests(data);
        } catch (err) { console.error("Error fetching pending:", err); }
    };

    const fetchManagedResults = async () => {
        try {
            const { data } = await API.get(`/exam-results/monitor/${user.assignedClass}`);
            setManagedResults(data);
        } catch (err) { console.error("Error fetching managed:", err); }
    };

    const fetchDatesheetTitles = async () => {
        // --- SMART FIX: Agar pehle se load ho chuke hain, toh wapas API call mat maro ---
        if (examTitles.length > 0) return;

        try {
            const { data } = await API.get('/datesheet/teacher-datesheets');
            const uniqueTitles = [...new Set(data.map(ds => ds.title))];
            setExamTitles(uniqueTitles);
        } catch (err) { console.error("Error fetching titles:", err); }
    };

    const triggerToast = (msg, type = "success") => {
        setShowToast({ show: true, message: msg, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    // --- CLASS TEACHER: INITIATE LOGIC ---
    const handlePreSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.maxMarks) return triggerToast("Please select Title and enter Max Marks! ⚠️", "error");
        setShowInitiateModal(false);
        setTimeout(() => setShowConfirmModal(true), 300);
    };

    const handleFinalInitiate = async () => {
        setLoading(true);
        try {
            const exactGrade = user.assignedClass.trim(); // "9-A" poora jayega
            await API.post('/exam-results/initiate', {
                grade: exactGrade,
                examTitle: formData.title,
                maxMarks: Number(formData.maxMarks)
            });
            setShowConfirmModal(false);
            setFormData({ title: '', maxMarks: '' });
            triggerToast("Result Collection Broadcasted Successfully! 📡", "success");
            fetchManagedResults();
            fetchPendingRequests();
        } catch (err) {
            setShowConfirmModal(false);
            triggerToast(err.response?.data?.message || "Failed to initiate.", "error");
        } finally { setLoading(false); }
    };

    const openEditor = (req, subjectName, fromView = 'pending') => {
        const preppedStudents = req.studentMarks.map(st => {
            const existingMark = st.marks.find(m => m.subjectName === subjectName);
            return {
                studentId: st.studentId,
                name: st.name,
                enrollmentNo: st.enrollmentNo,
                status: existingMark?.status || 'Present',
                marksObtained: existingMark?.marksObtained || ''
            };
        });

        setEditorData({
            resultId: req._id,
            examTitle: req.examTitle,
            subjectName: subjectName,
            maxMarks: req.maxMarks,
            students: preppedStudents
        });
        setReturnViewMode(fromView); // <--- SMART FIX: Origin screen yaad rakho
        setViewMode('editor');
    };
    // Live Grid Input Handler
    const handleStudentGridChange = (studentId, field, value) => {
        // --- REAL-TIME SMART VALIDATION ---
        if (field === 'marksObtained') {
            const numValue = Number(value);
            // Agar value Max Marks se zyada hai, toh function wahi ruk jayega
            if (numValue > editorData.maxMarks) {
                triggerToast(`Maximum marks is ${editorData.maxMarks}!`, "error");
                return; // Value update nahi hogi
            }
        }

        setEditorData(prev => ({
            ...prev,
            students: prev.students.map(st => {
                if (st.studentId === studentId) {
                    const updatedSt = { ...st, [field]: value };
                    if (field === 'status' && value === 'Absent') {
                        updatedSt.marksObtained = 0;
                    }
                    return updatedSt;
                }
                return st;
            })
        }));
    };

    const handleEditorContinue = (e) => {
        e.preventDefault();

        // Validation: Ensure all present students have marks
        const isInvalid = editorData.students.some(st => st.status === 'Present' && st.marksObtained === '');
        if (isInvalid) return triggerToast("Please enter marks for all Present students! ⚠️", "error");

        // Validation: Marks cannot exceed max marks
        const hasExceeded = editorData.students.some(st => Number(st.marksObtained) > editorData.maxMarks);
        if (hasExceeded) return triggerToast(`Marks cannot exceed the Max Marks (${editorData.maxMarks})! ⚠️`, "error");

        // setShowEditorModal(false);
        setTimeout(() => setShowEditorConfirmModal(true), 300);
    };

    const handleEditorFinalSubmit = async () => {
        setLoading(true);
        try {
            // Send exact format backend expects
            const payload = {
                subjectName: editorData.subjectName,
                studentMarks: editorData.students.map(st => ({
                    studentId: st.studentId,
                    status: st.status,
                    marksObtained: Number(st.marksObtained) || 0
                }))
            };

            await API.put(`/exam-results/submit-marks/${editorData.resultId}`, payload);

            setShowEditorConfirmModal(false);
            setViewMode(returnViewMode);
            triggerToast("Marks Locked Successfully! 📝", "success");
            fetchPendingRequests();
        } catch (err) {
            setShowEditorConfirmModal(false);
            triggerToast("Failed to lock marks.", "error");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">

            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* HEADER SECTION */}
            <div className="bg-[#42A5F5] px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible">
                <div className="flex justify-between items-center relative z-10">
                    <button onClick={() => {
                        if (viewMode === 'monitor' || viewMode === 'editor') setViewMode('pending');
                        else navigate(-1);
                    }} className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-md active:scale-95 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-4xl font-black italic tracking-tight text-white capitalize">
                            {viewMode === 'monitor' ? 'Result Hub' : 'Enter Marks'}
                        </h1>
                        <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-80 mt-1">
                            {viewMode === 'monitor'
                                ? `Class ${user?.assignedClass}`
                                : (user?.assignedClass ? 'Manage & Evaluate' : 'Subject Evaluations')}
                        </p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm">
                        {viewMode === 'monitor' ? <LayoutDashboard size={24} /> : <BarChart3 size={24} />}
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20 space-y-6 max-w-4xl mx-auto">

                {/* --- DEFAULT PENDING VIEW (SUBJECT TEACHERS) --- */}
                {viewMode === 'pending' && (
                    <>
                        {/* --- CLASS TEACHER CONTROLS --- */}
                        {user?.assignedClass && (
                            <div className="mb-8 flex flex-col gap-4">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setViewMode('monitor')}
                                        className="py-4 px-6 bg-white text-slate-700 rounded-[2rem] font-black uppercase tracking-widest shadow-md border border-[#DDE3EA] active:scale-95 transition-all hover:bg-emerald-50 hover:text-[#43A047] text-[13px] flex items-center gap-3"
                                    >
                                        <LayoutDashboard size={20} className="text-[#43A047]" />
                                        Monitor Hub
                                    </button>
                                </div>

                                {/* Manage Collection Card */}
                                <div className="bg-white p-6 rounded-[3.5rem] shadow-xl border border-[#DDE3EA] flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 capitalize">Initiate Result Collection</h2>
                                        <p className="text-[#42A5F5] font-bold text-[13px] uppercase tracking-widest mt-1">
                                            Class Teacher: {user.assignedClass}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowInitiateModal(true)}
                                        className="p-5 bg-[#42A5F5] text-white rounded-full shadow-lg shadow-blue-200 active:scale-90 transition-all hover:bg-blue-600"
                                    >
                                        <Plus size={28} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className={`transition-all duration-300 ${!user?.assignedClass ? 'mt-16' : 'mt-8'}`}>
                            <h2 className="text-xl font-black text-slate-700 mb-6 flex items-center gap-2 px-2 uppercase tracking-widest">
                                <Clock className="text-amber-500" /> Pending Evaluations
                            </h2>

                            {pendingRequests.length === 0 ? (
                                <div className="bg-white p-10 rounded-[3.5rem] border border-dashed border-slate-300 text-center shadow-sm">
                                    <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold text-lg">No pending marks to upload. You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pendingRequests.map((req) => (
                                        // SMART FIX: Frontend par bhi _id aur employeeId dono match karo
                                        req.subjects.filter(s => (s.assignedTeachers.includes(user?.employeeId) || s.assignedTeachers.includes(user?._id)) && !s.isSubmitted).map((subject, idx) => (
                                            <motion.div key={`${req._id}-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-[#DDE3EA] relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-slate-800 capitalize">{req.examTitle}</h3>
                                                        <p className="text-slate-500 font-bold text-[15px] mt-1">Class: {req.grade}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                    <BarChart3 className="text-[#43A047]" size={24} />
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-emerald-900 text-lg">{subject.subjectName}</span>
                                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Max Marks: {req.maxMarks}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    // Is click handler ko isse update kar:
                                                    onClick={() => openEditor(req, subject.subjectName, 'pending')}
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
                                                    {/* Shine effect */}
                                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>

                                                    <Send size={20} className="relative z-10 group-hover:rotate-12 transition-transform duration-300" />

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

                {/* --- MONITOR HUB VIEW (CLASS TEACHER ONLY) --- */}
                {viewMode === 'monitor' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 mt-8">
                        {managedResults.length === 0 ? (
                            <div className="bg-white p-10 rounded-[3.5rem] border border-dashed border-slate-300 text-center shadow-sm">
                                <AlertTriangle size={48} className="text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold text-lg">No result collections initiated yet.</p>
                            </div>
                        ) : (
                            managedResults.map(resObj => {
                                const allSubmitted = resObj.subjects.every(s => s.isSubmitted);
                                const isPublished = resObj.status === 'published';
                                const isEditMode = editModes[resObj._id];

                                return (
                                    <div key={resObj._id} className={`bg-white p-8 rounded-[3.5rem] shadow-xl border relative overflow-hidden transition-all ${isEditMode ? 'border-[#42A5F5] shadow-blue-100' : 'border-[#DDE3EA]'}`}>
                                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-800 capitalize">{resObj.examTitle}</h3>
                                                <span className={`inline-block mt-2 px-4 py-1 rounded-full text-[12px] font-black uppercase tracking-widest ${isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    Status: {resObj.status}
                                                </span>
                                            </div>

                                            {/* Action Buttons: Edit and Delete */}
                                            <div className="flex gap-3">
                                                {isPublished && (
                                                    <button onClick={() => toggleEditMode(resObj._id)} className={`p-4 rounded-2xl transition-all shadow-sm ${isEditMode ? 'bg-slate-900 text-white' : 'bg-blue-50 text-[#42A5F5] hover:bg-blue-500 hover:text-white'}`}>
                                                        {isEditMode ? <X size={16} /> : <Edit3 size={16} />}
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteResult(resObj._id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            {resObj.subjects.map((sub, idx) => {
                                                // Class teacher can edit if it's not published, OR if it is published and edit mode is ON
                                                const showSubjectEdit = sub.isSubmitted && (!isPublished || isEditMode);

                                                return (
                                                    <div key={idx} className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${sub.isSubmitted ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                                                        <div className="flex-1">
                                                            <h4 className="font-black text-lg text-slate-800">{sub.subjectName}</h4>
                                                            {sub.isSubmitted ? (
                                                                <p className="text-[14px] font-bold text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 size={16} /> Marks Compiled Successfully</p>
                                                            ) : (
                                                                <p className="text-[14px] font-bold text-amber-600 mt-1 flex items-center gap-1"><Clock size={14} /> Pending submission by subject teacher</p>
                                                            )}
                                                        </div>

                                                        {/* Reusing openEditor to open the same Grid for the Class Teacher */}
                                                        {showSubjectEdit && (
                                                            <button // Is click handler ko isse update kar:
                                                                onClick={() => openEditor(resObj, sub.subjectName, 'monitor')} className="px-6 py-3 bg-white border-2 border-emerald-200 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all shadow-md whitespace-nowrap">
                                                                <Edit3 size={20} /> Edit Marks
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Bottom Action Controls */}
                                        {!isPublished && allSubmitted && (
                                            <button onClick={() => handlePublish(resObj._id)} className="w-full py-5 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 hover:scale-[0.98] transition-all">
                                                <CheckCircle2 size={22} /> Publish Report Cards
                                            </button>
                                        )}

                                        {isPublished && !isEditMode && (
                                            <div className="w-full py-5 bg-emerald-50/50 text-emerald-600 border-2 border-emerald-100 rounded-[2.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                                <CheckCircle2 size={22} /> Results Declared 
                                            </div>
                                        )}

                                        {isPublished && isEditMode && (
                                            <button onClick={() => handleGlobalUpdate(resObj._id)} className="w-full py-5 bg-[#42A5F5] text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:scale-[0.98] transition-all">
                                                <CheckCircle2 size={22} /> Update Result Changes
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </motion.div>
                )}

                {/* --- EDITOR VIEW (FULL PAGE FEEL - NO POPUP) --- */}
                {viewMode === 'editor' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 mt-8">

                        {/* Editor Header Card */}
                        <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl border border-[#DDE3EA] flex justify-between items-center relative overflow-hidden">

                            {/* Soft blue glow */}
                            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-blue-300/30 to-transparent rounded-bl-full pointer-events-none"></div>

                            {/* Bottom accent line */}
                            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-300 via-[#42A5F5] to-blue-500 opacity-70"></div>

                            <div className="relative z-10">
                                <h2 className="text-3xl font-black uppercase tracking-widest text-[#42A5F5] mb-2">
                                    {editorData.subjectName} Evaluation
                                </h2>

                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    {editorData.examTitle} • Max Marks: {editorData.maxMarks}
                                </p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setViewMode(returnViewMode)}
                                className="bg-blue-50 hover:bg-blue-100 text-[#42A5F5] p-4 rounded-full transition-all shadow-md active:scale-95 relative z-10"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Live Data Grid Body */}
                        <div className="bg-white p-6 md:p-8 rounded-[3.5rem] shadow-xl border border-[#DDE3EA]">
                            <div className="space-y-4">
                                {/* Grid Header (Hidden on Mobile) */}
                                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-100 rounded-2xl text-[12px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="col-span-5">Student Identity</div>
                                    <div className="col-span-4 text-center">Status</div>
                                    <div className="col-span-3 text-right">Marks Obtained</div>
                                </div>

                                {/* Student Rows */}
                                {editorData.students.map((st, i) => (
                                    <div key={st.studentId} className="bg-white p-5 rounded-3xl border-2 border-slate-100 flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center hover:border-blue-200 transition-colors shadow-sm">

                                        {/* Identity */}
                                        <div className="col-span-5 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-black text-[#42A5F5] text-sm shrink-0">{i + 1}</div>
                                            <div>
                                                <p className="font-black text-slate-800 text-[16px] uppercase">{st.name}</p>
                                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">{st.enrollmentNo}</p>
                                            </div>
                                        </div>

                                        {/* Status Dropdown */}
                                        <div className="col-span-4 md:text-center order-first md:order-none relative">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenStatus(openStatus === st.studentId ? null : st.studentId)
                                                }
                                                className={`w-full md:w-auto min-w-[150px] px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest border-2 transition-all flex items-center justify-between gap-3
        ${st.status === "Absent"
                                                        ? "bg-red-50 text-red-600 border-red-200"
                                                        : "bg-blue-50 text-[#42A5F5] border-blue-200"
                                                    }`}
                                            >
                                                {st.status}
                                                <ChevronDown
                                                    size={18}
                                                    className={`transition-transform duration-300 ${openStatus === st.studentId ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>

                                            <AnimatePresence>
                                                {openStatus === st.studentId && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
                                                    >
                                                        {["Present", "Absent"].map((status) => (
                                                            <button
                                                                key={status}
                                                                type="button"
                                                                onClick={() => {
                                                                    handleStudentGridChange(
                                                                        st.studentId,
                                                                        "status",
                                                                        status
                                                                    );
                                                                    setOpenStatus(null);
                                                                }}
                                                                className={`w-full px-5 py-3 text-left font-black text-[13px] uppercase tracking-widest transition-all
                        ${status === "Present"
                                                                        ? "hover:bg-blue-50 text-[#42A5F5]"
                                                                        : "hover:bg-red-50 text-red-600"
                                                                    }`}
                                                            >
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Marks Input */}
                                        <div className="col-span-3 flex md:justify-end items-center gap-3">
                                            <input
                                                type="number"
                                                min="0"
                                                max={editorData.maxMarks}
                                                disabled={st.status === 'Absent'}
                                                value={st.marksObtained}
                                                onChange={(e) => handleStudentGridChange(st.studentId, 'marksObtained', e.target.value)}
                                                // Ye line add kar:
                                                onInput={(e) => {
                                                    if (Number(e.target.value) > editorData.maxMarks) e.target.value = editorData.maxMarks;
                                                }}
                                                placeholder="--"
                                                className={`w-24 md:w-28 text-center py-4 rounded-2xl border-2 font-black text-xl outline-none transition-all ${st.status === 'Absent' ? 'bg-slate-50 border-slate-200 text-slate-300' : 'bg-blue-50/50 border-blue-200 text-blue-900 focus:border-[#42A5F5] focus:bg-white shadow-inner'}`}
                                            />
                                            <span className="font-black text-slate-300 text-lg">/ {editorData.maxMarks}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Editor Footer Button */}
                        <div className="pt-2">
                            <button
                                onClick={handleEditorContinue}
                                className="w-full bg-[#42A5F5] text-white py-6 rounded-[3rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex justify-center items-center gap-3 border-b-4 border-blue-700"
                            >
                                <Save size={24} />
                                {/* Logic: Agar subject teacher edit kar raha hai toh 'Update' dikhao */}
                                {editorData.students.some(st => st.marksObtained !== '') ? 'Review & Update Marks' : 'Review & Submit Marks'}
                            </button>
                        </div>

                    </motion.div>
                )}
            </div>

            {/* --- ALL MODALS DOWN HERE --- */}

            {/* MODAL 1: INITIATE COLLECTION (Class Teacher) */}
            <AnimatePresence>
                {showInitiateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInitiateModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-[3.5rem] p-8 shadow-2xl relative z-10 border border-[#DDE3EA]"
                        >
                            <button
                                onClick={() => setShowInitiateModal(false)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-2xl font-black text-slate-800 mb-6 capitalize flex items-center gap-2">
                                <BarChart3 className="text-[#42A5F5]" /> New Collection
                            </h2>

                            <form onSubmit={handlePreSubmit} className="space-y-6">

                                {/* Locked Class Box */}
                                <div>
                                    <div className="w-full flex items-center justify-between bg-blue-50 p-5 rounded-2xl border border-blue-200 cursor-not-allowed">
                                        <div className="flex items-center gap-3">
                                            <Users size={20} className="text-[#42A5F5]" />
                                            <span className="font-black text-blue-900 uppercase tracking-widest">
                                                Class {user?.assignedClass}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                            Locked Target
                                        </span>
                                    </div>
                                </div>

                                {/* Exam Dropdown */}
                                <div className="relative">
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">
                                        Exam Title (From Datesheets)
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                                        className="w-full flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-300 font-bold text-slate-700 outline-none transition-all uppercase"
                                    >
                                        <span className="truncate">
                                            {formData.title || 'Select Exam Title'}
                                        </span>

                                        <ChevronDown
                                            size={20}
                                            className={`text-[#42A5F5] transition-transform ${isExamDropdownOpen ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isExamDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 max-h-48 overflow-y-auto"
                                            >
                                                <div className="flex flex-col gap-2">
                                                    {examTitles.map((title, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, title });
                                                                setIsExamDropdownOpen(false);
                                                            }}
                                                            className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all uppercase ${formData.title === title
                                                                ? 'bg-[#42A5F5] text-white'
                                                                : 'hover:bg-slate-50 text-slate-700'
                                                                }`}
                                                        >
                                                            {title}
                                                        </button>
                                                    ))}

                                                    {examTitles.length === 0 && (
                                                        <p className="text-xs text-center text-slate-400 p-2">
                                                            No active exams found
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Max Marks */}
                                <div>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">
                                        Maximum Marks
                                    </label>

                                    <input
                                        type="number"
                                        placeholder="e.g. 40 or 100"
                                        className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-300 text-[18px] font-bold text-slate-700 outline-none focus:border-[#42A5F5] focus:bg-white transition-all"
                                        value={formData.maxMarks}
                                        onChange={(e) =>
                                            setFormData({ ...formData, maxMarks: e.target.value })
                                        }
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full bg-[#42A5F5] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2 border-b-4 border-blue-700"
                                >
                                    Continue <ArrowLeft className="rotate-180" size={18} />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 3: CONFIRMATION (REUSABLE) */}
            <AnimatePresence>
                {(showConfirmModal || showEditorConfirmModal) && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">

                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setShowConfirmModal(false);
                                setShowEditorConfirmModal(false);
                            }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl relative z-10 text-center border border-[#DDE3EA]"
                        >

                            {/* Icon */}
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-100">
                                <AlertTriangle className="text-[#42A5F5]" size={36} />
                            </div>

                            {/* Heading */}
                            <h2 className="text-2xl font-black text-slate-800 mb-2">
                                Final Confirmation
                            </h2>

                            {/* Text */}
                            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                                {showConfirmModal
                                    ? `Request ${formData.title} marks collection from all Class ${user?.assignedClass} subject teachers?`
                                    : `Lock marks for ${editorData.subjectName}? This cannot be edited once submitted.`}
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    disabled={loading}
                                    onClick={
                                        showConfirmModal
                                            ? handleFinalInitiate
                                            : handleEditorFinalSubmit
                                    }
                                    className="flex-1 bg-[#42A5F5] text-white py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center border-b-4 border-blue-700"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        "Confirm"
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setShowEditorConfirmModal(false);
                                    }}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* MODAL 4: DELETE / PUBLISH CONFIRMATION */}
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
                                    ? "Delete these results? It will be completely removed from students' report cards!"
                                    : "Publish report cards? All students in this class will be able to see their marks."}
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

export default TeacherUploadResult;
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, CheckCircle, CheckCircle2, FileText, Calendar, Target, Download, Edit3, Trash2, ChevronDown, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';
const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TeacherAssignments = ({ user }) => {
    const navigate = useNavigate();
    const teacherSubjects = user?.subjects || [];
    const [view, setView] = useState('create'); // 'create' or 'submissions'
    const [grades, setGrades] = useState([]);
    const [isSubjectOpen, setIsSubjectOpen] = useState(false);
    const [formData, setFormData] = useState({
        grade: '', subject: '', title: '', description: '', dueDate: '', totalMarks: '', fileUrl: ''
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null);
    const [isGradeOpen, setIsGradeOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, id: null });
    const [assignments, setAssignments] = useState([]); // Saare assignments ki list
    const [selectedAsgn, setSelectedAsgn] = useState(null); // Jis assignment ke submission dekhne hain
    // const [submissions, setSubmissions] = useState([]); // Bache huye submissions

    // Submission states
    const [activeAssignmentId, setActiveAssignmentId] = useState(null);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        const fetchGrades = async () => {
            const { data } = await API.get('/users/grades/all');
            setGrades(data);
        };
        fetchGrades();
    }, []);

    useEffect(() => {
        const today = new Date();
        setFormData(prev => ({
            ...prev,
            dueDate: formatLocalDate(today)
        }));
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data } = await API.get('/assignments/teacher/my-assignments'); // Ye route teacher ke apne assignments layega
            setAssignments(data);
        };
        fetchHistory();
    }, [view]); // Jab bhi view badle data refresh ho

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        try {
            const { data } = await API.post('/upload', uploadData);
            setFormData({ ...formData, fileUrl: data });
            setFile(selectedFile);
        } catch (err) { alert("Upload Failed"); }
        finally { setUploading(false); }
    };
    // Step A: Modal open karne ke liye
    const triggerDelete = (id) => {
        setConfirmModal({ show: true, id: id });
    };

    // Step B: Actual delete confirm hone par
    const confirmDelete = async () => {
        const id = confirmModal.id;
        try {
            await API.delete(`/assignments/${id}`);
            setAssignments(assignments.filter(a => a._id !== id));

            setToast("Assignment deleted! 🗑️");

            setConfirmModal({ show: false, id: null });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            setToast("Purge Failed! 🛡️");
            setTimeout(() => setToast(null), 3000);
        }
    };
    const removeFile = () => { setFile(null); setFormData({ ...formData, fileUrl: '' }); };

    const handleSubmit = async () => {
        // Check if subject is also selected
        if (!formData.grade || !formData.dueDate || !formData.title || !formData.subject) {
            return alert("Class, Subject, Title and Date are mandatory! 🛡️");
        }

        try {
            // Ab subject dynamic jayega formData ke andar se
            await API.post('/assignments/create', formData);

            setToast("Assignment Deployed Successfully! 🚀");
            // Reset form
            setFormData({
                grade: '',
                subject: '',
                title: '',
                description: '',
                dueDate: formatLocalDate(new Date()),
                totalMarks: '',
                fileUrl: ''
            });
            setFile(null);
            setTimeout(() => setToast(null), 3000);
        } catch (err) { alert("Deployment Failed"); }
    };

    const fetchSubmissions = async (id) => {
        try {
            setActiveAssignmentId(id);
            // Data fetch karte waqt ensure karo ki hum assignment ID bhej rahe hain
            const { data } = await API.get(`/assignments/submissions/${id}`);
            setSubmissions(data); // Ye line submissions state ko refresh karegi
            setView('submissions');
        } catch (err) {
            console.error("Submissions load error");
        }
    };

    const handleGrade = async (subId, marks) => {
        try {
            const numericMarks = Number(marks);
            // 1. Database mein update bhejo
            await API.put(`/assignments/grade/${subId}`, { marksObtained: numericMarks });

            // 2. 🔥 Sabse Zaruri: submissions state ko update karo taaki UI sync ho jaye
            setSubmissions(prev => prev.map(s =>
                s._id === subId ? { ...s, marksObtained: numericMarks, status: 'Graded' } : s
            ));

            return true;
        } catch (err) {
            console.error("Database Uplink Failed");
            alert("Grading Failed! Check Network.");
            return false;
        }
    };
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-20 rounded-b-[4rem] shadow-lg relative">

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 active:scale-90"
                >
                    <ArrowLeft />
                </button>

                <div className="text-center mt-4">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                        Class <br /> Assignments
                    </h1>
                </div>

                {/* ✅ NEW POSITION */}
                <div className="flex justify-end mt-2">
                    <button
                        onClick={() => setView(view === 'create' ? 'history' : 'create')}
                        className="bg-white text-[#42A5F5] px-4 py-2 rounded-2xl font-black text-[15px] uppercase tracking-widest shadow-lg flex items-center gap-2"
                    >
                        {view === 'create' ? "View History" : "Create New"}
                    </button>
                </div>

            </div>

            <div className="px-6 -mt-10 relative z-10 space-y-6">
                {view === 'create' ? (
                    <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 space-y-5">
                        {/* --- NEURAL CUSTOM DROPDOWN --- */}
                        <div className="relative space-y-2 text-left">
                            <label className="text-[16px] font-black uppercase text-slate-400 ml-4 tracking-[0.1em] italic">
                                Select Class
                            </label>

                            {/* Display Box */}
                            <div
                                onClick={() => setIsGradeOpen(!isGradeOpen)}
                                className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all shadow-sm group"
                            >
                                <span className={`font-black text-[15px] italic ${formData.grade ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {formData.grade ? `Class: ${formData.grade}` : "Select..."}
                                </span>
                                <motion.div
                                    animate={{ rotate: isGradeOpen ? 180 : 0 }}
                                    className="text-[#42A5F5]"
                                >
                                    <ChevronDown size={20} />
                                </motion.div>
                            </div>

                            {/* Options List Container */}
                            <AnimatePresence>
                                {isGradeOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 5, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute top-full left-0 right-0 z-[100] bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-3 max-h-60 overflow-y-auto no-scrollbar backdrop-blur-3xl"
                                    >
                                        {grades.length > 0 ? (
                                            grades.map((g) => (
                                                <motion.div
                                                    key={g}
                                                    whileHover={{ x: 5 }}
                                                    onClick={() => {
                                                        setFormData({ ...formData, grade: g });
                                                        setIsGradeOpen(false);
                                                    }}
                                                    className={`p-4 rounded-2xl mb-1 cursor-pointer font-black italic text-[14px] flex justify-between items-center transition-all ${formData.grade === g
                                                        ? 'bg-blue-50 text-[#42A5F5]'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                                        }`}
                                                >
                                                    {g}
                                                    {formData.grade === g && <CheckCircle2 size={16} className="text-[#42A5F5]" />}
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-slate-400 font-bold italic text-xs">No active sectors found</div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* --- SUBJECT CUSTOM DROPDOWN --- */}
                        <div className="relative space-y-2 text-left">
                            <label className="text-[16px] font-black uppercase text-slate-400 ml-4 tracking-[0.1em] italic">
                                Select Subject
                            </label>

                            {/* Display Box */}
                            <div
                                onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                                className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all shadow-sm group"
                            >
                                <span className={`font-black text-[15px] italic ${formData.subject ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {formData.subject ? `Subject: ${formData.subject}` : "Select Subject..."}
                                </span>
                                <motion.div animate={{ rotate: isSubjectOpen ? 180 : 0 }} className="text-[#42A5F5]">
                                    <ChevronDown size={20} />
                                </motion.div>
                            </div>

                            {/* Options List */}
                            <AnimatePresence>
                                {isSubjectOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 5, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute top-full left-0 right-0 z-[110] bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-3 max-h-48 overflow-y-auto no-scrollbar backdrop-blur-3xl"
                                    >
                                        {teacherSubjects.length > 0 ? (
                                            teacherSubjects.map((sub) => (
                                                <motion.div
                                                    key={sub}
                                                    whileHover={{ x: 5 }}
                                                    onClick={() => {
                                                        setFormData({ ...formData, subject: sub });
                                                        setIsSubjectOpen(false);
                                                    }}
                                                    className={`p-4 rounded-2xl mb-1 cursor-pointer font-black italic text-[14px] flex justify-between items-center transition-all ${formData.subject === sub ? 'bg-blue-50 text-[#42A5F5]' : 'text-slate-500'
                                                        }`}
                                                >
                                                    {sub}
                                                    {formData.subject === sub && <CheckCircle size={16} className="text-[#42A5F5]" />}
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-slate-400 font-bold italic text-xs">No subjects assigned to you</div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Date & Marks */}
                        {/* --- DEADLINE & MARKS SECTION (VERTICAL STACK) --- */}
                        <div className="flex flex-col gap-5 text-left">

                            {/* 1. DEADLINE BLOCK */}
                            <div className="space-y-2 relative">
                                <label className="text-[16px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">
                                    Submission Deadline
                                </label>

                                {/* Display Box */}
                                <div
                                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                    className="w-full bg-slate-50 p-5 rounded-2xl font-bold flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all border border-slate-100 shadow-sm"
                                >
                                    <span className="text-slate-700 italic">
                                        {formData.dueDate
                                            ? new Date(formData.dueDate).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })
                                            : "Select Submission Date"}
                                    </span>
                                    <Calendar size={18} className="text-[#42A5F5]" />
                                </div>

                                <AnimatePresence>
                                    {isCalendarOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full left-0 mt-2 w-full bg-white border border-blue-100 rounded-[2rem] shadow-2xl p-6 z-[200] backdrop-blur-3xl"
                                        >
                                            {/* Month Control */}
                                            <div className="flex justify-between items-center mb-4">
                                                <button
                                                    onClick={() => {
                                                        const d = new Date(formData.dueDate || new Date());
                                                        d.setMonth(d.getMonth() - 1);
                                                        setFormData({ ...formData, dueDate: formatLocalDate(d) });
                                                    }}
                                                    className="p-2 bg-blue-50 rounded-xl text-[#42A5F5] font-black"
                                                >
                                                    ←
                                                </button>

                                                <span className="font-black text-[#42A5F5] uppercase tracking-tighter italic">
                                                    {new Date(formData.dueDate || new Date()).toLocaleDateString('en-GB', {
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>

                                                <button
                                                    onClick={() => {
                                                        const d = new Date(formData.dueDate || new Date());
                                                        d.setMonth(d.getMonth() + 1);
                                                        setFormData({ ...formData, dueDate: formatLocalDate(d) });
                                                    }}
                                                    className="p-2 bg-blue-50 rounded-xl text-[#42A5F5] font-black"
                                                >
                                                    →
                                                </button>
                                            </div>

                                            {/* Days Header */}
                                            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase text-slate-300 mb-3 tracking-widest">
                                                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                                                    <span key={d}>{d}</span>
                                                ))}
                                            </div>

                                            {/* Days Grid (Neural Layout) */}
                                            <div className="grid grid-cols-7 gap-2">
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                                    const current = new Date(formData.dueDate || new Date());
                                                    const tempDate = new Date(current.getFullYear(), current.getMonth(), day, 12);
                                                    const formatted = formatLocalDate(tempDate);
                                                    const isSelected = formatted === formData.dueDate;

                                                    return (
                                                        <button
                                                            key={day}
                                                            onClick={() => {
                                                                setFormData({ ...formData, dueDate: formatted });
                                                                setIsCalendarOpen(false);
                                                            }}
                                                            className={`p-2.5 rounded-xl text-[12px] font-black transition-all ${isSelected
                                                                ? 'bg-[#42A5F5] text-white shadow-lg shadow-blue-100'
                                                                : 'text-slate-500 hover:bg-blue-50'
                                                                }`}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 2. TOTAL MARKS BLOCK */}
                            <div className="space-y-2">
                                <label className="text-[16px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">
                                    Total Marks
                                </label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        placeholder="Max Marks (e.g. 100)"
                                        onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                                        className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-blue-100 border border-slate-100 transition-all italic"
                                    />
                                    <Target size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#42A5F5] transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Title & Description */}
                        <input type="text" placeholder="Assignment Title..." value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 p-5 rounded-2xl font-black italic text-lg outline-none" />
                        <textarea placeholder="Instructions..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 p-5 rounded-[2rem] h-32 italic text-lg  font-bold resize-none" />

                        {/* File Upload */}
                        {!file ? (
                            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 cursor-pointer hover:bg-blue-50 transition-all">
                                <Upload className="text-[#42A5F5] mb-2" />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Attach Resource (PDF/PPT/IMG)</span>
                                <input type="file" className="hidden" onChange={handleFileChange} />
                            </label>
                        ) : (
                            <div className="flex items-center justify-between bg-blue-50 p-5 rounded-2xl border border-blue-100 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-[#42A5F5]" />
                                    <span className="font-black text-sm text-[#42A5F5]">{file.name}</span>
                                </div>
                                <button onClick={removeFile} className="bg-white p-2 rounded-xl text-rose-500 shadow-sm"><X size={18} /></button>
                            </div>
                        )}

                        <button onClick={handleSubmit} className="w-full py-5 bg-[#42A5F5] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 active:scale-95 transition-all">Publish Assignment</button>
                    </div>
                ) : view === 'history' ? (
                    /* --- VIEW: HISTORY LIST --- */
                    <div className="space-y-4">
                        <button onClick={() => setView('create')} className="text-[10px] font-black text-[#42A5F5] uppercase mb-2 bg-white px-6 py-2 rounded-full">Back to Create</button>

                        {/* MAP SHURU */}
                        {assignments.map(asgn => (
                            <div key={asgn._id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 flex justify-between items-center group">
                                <div className="flex-1 text-left">
                                    <span className="text-[16px] font-black uppercase text-[#42A5F5] tracking-widest">{asgn.grade}</span>
                                    <h3 className="text-[20px] font-black text-slate-800 italic uppercase">{asgn.title}</h3>
                                    <p className="text-[16px] font-bold text-slate-400 mt-1 italic">
                                        Due: {new Date(asgn.dueDate).toLocaleDateString('en-GB')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchSubmissions(asgn._id)} className="p-3 bg-blue-50 text-[#42A5F5] rounded-xl"><Users size={22} /></button>
                                    <button onClick={() => triggerDelete(asgn._id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl active:scale-90 transition-all">
                                        <Trash2 size={22} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {/* MAP KHATAM */}

                        {/* ✅ CONFIRM MODAL YAHAN HONA CHAHIYE (MAP KE BAHAR) */}
                        <AnimatePresence>
                            {confirmModal.show && (
                                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 text-slate-800">
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => setConfirmModal({ show: false, id: null })}
                                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                                    />
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                        className="relative bg-white w-full max-w-[320px] rounded-[3rem] p-8 shadow-2xl border border-slate-100 text-center"
                                    >
                                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                            <Trash2 size={32} />
                                        </div>
                                        <h3 className="text-[25px] font-black italic uppercase leading-tight mb-2">Confirm Delete?</h3>
                                        <p className="text-[16px] font-bold text-slate-400 italic mb-8">This action will permanently delete this assignment and all submissions.</p>
                                        <div className="flex flex-col gap-3">
                                            <button onClick={confirmDelete} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest">Yes, Delete</button>
                                            <button onClick={() => setConfirmModal({ show: false, id: null })} className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest">No, Keep It</button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* --- VIEW: SUBMISSIONS LIST --- */
                    <div className="space-y-6">
                        <button onClick={() => setView('history')} className="text-[10px] font-black text-[#42A5F5] uppercase tracking-widest bg-white px-6 py-2 rounded-full shadow-sm">Back to History</button>
                        <div className="bg-blue-50 text-[#42A5F5] px-5 py-2 rounded-2xl font-black text-[14px] uppercase tracking-widest border border-blue-100">
                            {submissions.length} Submitted
                        </div>
                        <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100">
                            <h2 className="text-[25px] font-black italic text-slate-800 mb-6 uppercase">All Submissions</h2>

                            {submissions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {submissions.map((sub) => (
                                        <SubmissionCard
                                            key={sub._id}
                                            sub={sub}
                                            handleGrade={handleGrade}
                                            setToast={setToast}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center font-black text-slate-300 py-10 uppercase italic tracking-widest">
                                    No Submissions Detected Yet ❄️
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Neural Toast */}
            {/* --- PREMIUM TOP-FLOATING TOAST --- */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -100, opacity: 0, x: "-50%" }} // Upar se shuru
                        animate={{ y: 50, opacity: 1, x: "-50%" }}    // 50px niche tak slide hoga
                        exit={{ y: -100, opacity: 0, x: "-50%" }}     // Wapas upar exit
                        className="fixed left-1/2 top-0 z-[9999] bg-emerald-500 text-white px-8 py-4 rounded-[2rem] font-black shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-3 border border-emerald-400 whitespace-nowrap italic text-[14px]"
                    >
                        <CheckCircle size={20} />
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
// --- EK ALAG COMPONENT HAR BACHE KE CARD KE LIYE ---
const SubmissionCard = ({ sub, handleGrade, setToast }) => {
    // sub.grade agar undefined ya null hai toh use "0" ya "" rakho
    const [tempMarks, setTempMarks] = useState(sub.marksObtained ?? "");
    const [isEditing, setIsEditing] = useState(sub.status !== 'Graded');

    // ⚡ CRITICAL FIX: Jab bhi 'sub' prop change ho (bahar se aane par), state sync karo
    useEffect(() => {
        setTempMarks(sub.marksObtained ?? "");
        setIsEditing(sub.status !== 'Graded');
    }, [sub.marksObtained, sub.status, sub._id]);

    const onUpdate = async () => {
        if (tempMarks === "" || tempMarks === null) return alert("Enter marks first! 🔢");

        // handleGrade call ho raha hai jo main state update karega
        const success = await handleGrade(sub._id, tempMarks);

        if (success) {
            setIsEditing(false); // Mode change karo
            setToast("Marks Secured! ✅");
            setTimeout(() => setToast(null), 3000);
        }
    };

    return (
        <div className="bg-slate-50 rounded-[2.5rem] p-7 mb-6 border border-slate-100 shadow-inner group">
            <div className="flex justify-between items-start mb-6 border-b border-slate-200/50 pb-4">
                <div className="flex flex-col text-left">
                    <span className="text-[25px] font-black text-slate-800 italic uppercase tracking-tighter leading-none">{sub.student?.name}</span>
                    <span className="text-[16px] font-bold text-[#42A5F5] mt-1 italic tracking-widest uppercase">ENR: {sub.student?.enrollmentNo || "N/A"}</span>
                </div>
                {!isEditing && <CheckCircle className="text-emerald-500" size={20} />}
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 text-left">
                    <label className="text-[17px] font-black uppercase text-slate-400 ml-2 italic tracking-widest">
                        Solution File
                    </label>
                    <a
                        href={`http://localhost:5000${sub.fileUrl}`}
                        target="_blank"            // Sabse important: Naye tab mein khulega
                        rel="noopener noreferrer"  // Security ke liye zaroori
                        className="flex items-center justify-center gap-2 py-4 bg-white rounded-2xl text-blue-500 shadow-sm border border-blue-50 font-black text-xs uppercase active:scale-95 transition-all"
                    >
                        <Download size={18} /> View PDF/IMG
                    </a>
                </div>

                <div className="flex flex-col gap-2 text-left">
                    <div className="flex justify-between px-2">
                        <label className="text-[17px] font-black uppercase text-slate-400 italic tracking-widest">Marks ({sub.assignment?.totalMarks ?? "N/A"})</label>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="text-[#42A5F5] font-black text-[17px] uppercase flex items-center gap-1"><Edit3 size={12} /> Edit</button>
                        )}
                    </div>

                    <div className="relative">
                        <input
                            type="number"
                            disabled={!isEditing}
                            className={`w-full py-4 rounded-2xl font-black text-center outline-none transition-all text-lg ${isEditing ? 'bg-white border-2 border-blue-100 shadow-lg text-slate-700' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'}`}
                            value={tempMarks}
                            onChange={(e) => setTempMarks(e.target.value)}
                            placeholder="00"
                        />
                        <Target size={16} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20" />
                    </div>

                    <AnimatePresence>
                        {isEditing && (
                            <motion.button
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                onClick={onUpdate}
                                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 mt-2 transition-all"
                            >
                                Update Score
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default TeacherAssignments;
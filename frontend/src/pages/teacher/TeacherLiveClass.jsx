import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Video, CheckCircle, Clock, X, AlertTriangle, Plus, Send, MonitorPlay, ChevronDown, Calendar, Layers, Link as LinkIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

const TeacherLiveClass = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // UI State
    const [viewMode, setViewMode] = useState('requests'); // 'requests', 'new', or 'monitor'
    const [setupData, setSetupData] = useState([]); // [{grade: "9-A", subjects: ["Math", "Science"]}]
    const [myRequests, setMyRequests] = useState([]);
    const [monitorData, setMonitorData] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionConfirmModal, setActionConfirmModal] = useState({ show: false, action: '', id: '' });
    const [clashError, setClashError] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        grade: '', subject: '', platform: 'Zoom', date: '', fromTime: '', fromAmPm: 'AM', toTime: '', toAmPm: 'PM'
    });

    // Custom Dropdown & Calendar Refs
    const [isGradeOpen, setIsGradeOpen] = useState(false);
    const [isSubjectOpen, setIsSubjectOpen] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isFromAmPmOpen, setIsFromAmPmOpen] = useState(false);
    const [isToAmPmOpen, setIsToAmPmOpen] = useState(false);

    const [viewDate, setViewDate] = useState(new Date());

    const gradeRef = useRef(null);
    const subjectRef = useRef(null);
    const dateRef = useRef(null);
    const fromRef = useRef(null);
    const toRef = useRef(null);

    // Derived Subject List based on selected Grade
    const availableSubjects = setupData.find(d => d.grade === formData.grade)?.subjects || [];

    useEffect(() => {
        fetchSetupData();
        fetchMyRequests();
        if (user?.assignedClass) {
            fetchMonitorData();
        }

        const handleClickOutside = (e) => {
            if (gradeRef.current && !gradeRef.current.contains(e.target)) setIsGradeOpen(false);
            if (subjectRef.current && !subjectRef.current.contains(e.target)) setIsSubjectOpen(false);
            if (dateRef.current && !dateRef.current.contains(e.target)) setIsDateOpen(false);
            if (fromRef.current && !fromRef.current.contains(e.target)) setIsFromAmPmOpen(false);
            if (toRef.current && !toRef.current.contains(e.target)) setIsToAmPmOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [viewMode]);

    const triggerToast = (msg, type = "success") => {
        setShowToast({ show: true, message: msg, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 4000);
    };

    const fetchSetupData = async () => {
        try { const { data } = await API.get('/liveclass/setup-data'); setSetupData(data); } catch (err) { }
    };

    const fetchMyRequests = async () => {
        try { const { data } = await API.get('/liveclass/my-requests'); setMyRequests(data); } catch (err) { }
    };

    const fetchMonitorData = async () => {
        try { const { data } = await API.get(`/liveclass/monitor/${user.assignedClass}`); setMonitorData(data); } catch (err) { }
    };

    // Form Submit (With Overlap Validation Check inside Backend)
    // Function 1: Check karo aur Modal dikhao
    const handlePreSubmit = (e) => {
        e.preventDefault();
        if (!formData.grade || !formData.subject || !formData.platform || !formData.date || !formData.fromTime || !formData.toTime) {
            return triggerToast("Please fill all details! ⚠️", "error");
        }
        setShowConfirmModal(true); // Modal dikha do
    };

    // Function 2: Actual API Call (Pehle wala handleSubmitRequest ab ye hai)
    const confirmAndSubmit = async () => {
        setLoading(true);
        setShowConfirmModal(false); // Modal hata do
        try {
            const payload = {
                grade: formData.grade,
                subjectName: formData.subject,
                platform: formData.platform,
                date: formData.date,
                startTime: `${formData.fromTime} ${formData.fromAmPm}`,
                endTime: `${formData.toTime} ${formData.toAmPm}`
            };

            await API.post('/liveclass/request', payload);
            triggerToast("Live Class Requested Successfully! 🎥", "success");
            setViewMode('requests');
            setFormData({ grade: '', subject: '', platform: '', date: '', fromTime: '', fromAmPm: 'AM', toTime: '', toAmPm: 'PM' });
        } catch (err) {
        const errorMessage = err.response?.data?.message || "Failed to schedule class.";
        // Agar backend se Clash ka error aaya hai, toh Modal state set karo
        if (errorMessage.toLowerCase().includes("clash")) {
            setClashError(errorMessage);
        } else {
            triggerToast(errorMessage, "error"); // Baaki normal errors ke liye toast chalega
        }
    } finally { setLoading(false); }
    };

    // Monitor Hub Action Trigger
    const confirmMonitorAction = (id, action) => {
        setActionConfirmModal({ show: true, action, id });
    };

    // Actual API call jo modal ke 'Confirm' karne par chalegi
    const executeMonitorAction = async () => {
        setLoading(true);
        try {
            const { id, action } = actionConfirmModal;
            if (action === 'approve') {
                await API.put(`/liveclass/approve/${id}`);
                triggerToast("Class Approved! Links Generated.", "success");
            } else {
                await API.delete(`/liveclass/${id}`);
                triggerToast("Request Removed.", "success");
            }
            fetchMonitorData();
        } catch (err) {
            triggerToast("Action failed.", "error");
        } finally {
            setLoading(false);
            setActionConfirmModal({ show: false, action: '', id: '' });
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* HEADER SECTION */}
            <div className="bg-[#42A5F5] px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible">
                <div className="flex justify-between items-center relative z-10">

                    {/* Back Button */}
                    <button
                        onClick={() => {
                            if (viewMode === 'new' || viewMode === 'monitor') {
                                setViewMode('requests');
                            } else {
                                navigate(-1);
                            }
                        }}
                        className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-md active:scale-95 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Center Title */}
                    <div className="text-center">
                        <h1 className="text-4xl font-black italic tracking-tight text-white capitalize">
                            Live Classes
                        </h1>

                        <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-80 mt-1">
                            {viewMode === 'monitor'
                                ? `Class ${user?.assignedClass} Monitor`
                                : 'Digital Broadcasts'}
                        </p>
                    </div>

                    {/* Right Icon */}
                    <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm">
                        <Video size={24} />
                    </div>

                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20 space-y-6 max-w-4xl mx-auto">

                {/* --- NAVIGATION TOGGLES --- */}
                {viewMode !== 'new' && (
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[2rem] shadow-md border border-[#DDE3EA]">

                        {/* Schedule New Class */}
                        <button
                            onClick={() => setViewMode('new')}
                            className="w-full md:w-auto bg-[#42A5F5] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-md"
                        >
                            <Plus size={18} />
                            Schedule New Class
                        </button>

                        {/* Monitor Button */}
                        {user?.assignedClass && (
                            <button
                                onClick={() =>
                                    setViewMode(viewMode === 'monitor' ? 'requests' : 'monitor')
                                }
                                className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md
                    ${viewMode === 'monitor'
                                        ? 'bg-[#0F172A] text-white'
                                        : 'bg-[#EFF6FF] text-[#42A5F5] hover:bg-[#DBEAFE]'
                                    }`}
                            >
                                <MonitorPlay size={18} />
                                {viewMode === 'monitor'
                                    ? 'My Schedules'
                                    : 'Class Monitor Hub'}
                            </button>
                        )}
                    </div>
                )}

                {/* --- MY REQUESTS LIST --- */}
                {viewMode === 'requests' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {myRequests.length === 0 ? (
                            <div className="bg-white p-10 rounded-[3.5rem] border border-dashed border-slate-300 text-center shadow-sm mt-8">
                                <Video size={48} className="text-blue-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold text-lg">No live classes scheduled yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {myRequests.map((req) => (
                                    <div key={req._id} className={`bg-white p-6 rounded-[2.5rem] shadow-lg border relative overflow-hidden transition-all ${req.status === 'approved' ? 'border-emerald-200' : 'border-slate-200'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800">{req.subjectName}</h3>
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Class {req.grade}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {req.status}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 mb-4">
                                            <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Calendar size={14} className="text-violet-500" /> {req.date}</p>
                                            <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Clock size={14} className="text-violet-500" /> {req.startTime} - {req.endTime}</p>
                                        </div>

                                        {req.status === 'approved' ? (
                                            <a href={req.hostLink} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 shadow-md hover:bg-[#8B5CF6] transition-all">
                                                <LinkIcon size={16} /> Start Hosting on {req.platform}
                                            </a>
                                        ) : (
                                            <div className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 border border-slate-200">
                                                <Clock size={16} /> Awaiting Approval
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* --- SCHEDULE NEW CLASS FORM --- */}
                {viewMode === 'new' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] p-8 shadow-2xl border border-blue-100">
                        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                            <MonitorPlay className="text-blue-500" /> Schedule Class
                        </h2>

                        <form onSubmit={handlePreSubmit} className="space-y-6">

                            {/* Grade & Subject Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Custom Grade Dropdown */}
                                <div className="relative" ref={gradeRef}>
                                    <label className="text-[14px] font-black text-[#64748B] uppercase ml-2 mb-2 block tracking-widest">
                                        Select Class
                                    </label>

                                    {/* Select Button */}
                                    <button
                                        type="button"
                                        onClick={() => setIsGradeOpen(!isGradeOpen)}
                                        className="w-full flex items-center justify-between bg-[#F8FAFC] border-2 border-[#E2E8F0] p-5 rounded-2xl shadow-sm transition-all hover:border-[#42A5F5] hover:bg-white"
                                    >
                                        <span className="font-black text-[#0F172A] uppercase tracking-wide">
                                            {formData.grade ? `Class ${formData.grade}` : "Select Class"}
                                        </span>

                                        <ChevronDown
                                            size={20}
                                            className={`text-[#42A5F5] transition-transform duration-300 ${isGradeOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {isGradeOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute z-50 w-full mt-3 bg-white border-2 border-[#E2E8F0] rounded-2xl shadow-2xl p-3 max-h-48 overflow-y-auto"
                                            >
                                                {setupData.length > 0 ? (
                                                    setupData.map((d, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    grade: d.grade,
                                                                    subject: ""
                                                                });
                                                                setIsGradeOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3 rounded-xl font-black uppercase transition-all
                                ${formData.grade === d.grade
                                                                    ? "bg-[#42A5F5] text-white"
                                                                    : "bg-white text-[#0F172A] hover:bg-[#EFF6FF]"
                                                                }`}
                                                        >
                                                            Class {d.grade}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-sm font-bold text-[#94A3B8] py-3">
                                                        No classes assigned to you.
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Custom Subject Dropdown */}
                                <div className="relative" ref={subjectRef}>
                                    <label className="text-[14px] font-black text-[#64748B] uppercase ml-2 mb-2 block tracking-widest">
                                        Select Subject
                                    </label>

                                    {/* Select Button */}
                                    <button
                                        type="button"
                                        disabled={!formData.grade}
                                        onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                                        className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 font-black outline-none transition-all uppercase shadow-sm
            ${!formData.grade
                                                ? "bg-[#F1F5F9] border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                                                : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:border-[#42A5F5] hover:bg-white"
                                            }`}
                                    >
                                        <span className="tracking-wide">
                                            {formData.subject || "Select Subject"}
                                        </span>

                                        <ChevronDown
                                            size={20}
                                            className={`transition-transform duration-300 ${isSubjectOpen ? "rotate-180" : ""
                                                } ${!formData.grade ? "text-[#94A3B8]" : "text-[#42A5F5]"
                                                }`}
                                        />
                                    </button>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {isSubjectOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute z-50 w-full mt-3 bg-white border-2 border-[#E2E8F0] rounded-2xl shadow-2xl p-3 max-h-48 overflow-y-auto"
                                            >
                                                {availableSubjects.map((sub, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                subject: sub
                                                            });
                                                            setIsSubjectOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-3 rounded-xl font-black uppercase transition-all
                            ${formData.subject === sub
                                                                ? "bg-[#42A5F5] text-white"
                                                                : "bg-white text-[#0F172A] hover:bg-[#EFF6FF]"
                                                            }`}
                                                    >
                                                        {sub}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Platform Cards
                            <div>
                                <label className="text-[14px] font-black text-slate-400 uppercase ml-2 mb-3 block tracking-widest">Select Platform</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div onClick={() => setFormData({ ...formData, platform: 'Zoom' })} className={`cursor-pointer p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${formData.platform === 'Zoom' ? 'border-[#3B82F6] bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                                        <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-black">Z</div>
                                        <span className="font-black text-sm uppercase tracking-widest text-slate-700">Zoom</span>
                                    </div>
                                    <div onClick={() => setFormData({ ...formData, platform: 'Google Meet' })} className={`cursor-pointer p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${formData.platform === 'Google Meet' ? 'border-[#10B981] bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                                        <div className="w-12 h-12 bg-white border border-[#10B981] rounded-full flex items-center justify-center font-black text-[#10B981]">GM</div>
                                        <span className="font-black text-sm uppercase tracking-widest text-slate-700">Google Meet</span>
                                    </div>
                                </div>
                            </div> */}

                            {/* Custom Date Calendar */}
                            <div className="relative" ref={dateRef}>
                                <label className="text-[14px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">Date of class</label>
                                <button type="button" onClick={() => setIsDateOpen(!isDateOpen)} className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 font-black text-slate-700 text-left uppercase flex items-center justify-between">
                                    {formData.date || "Select Date"} <Calendar size={20} className="text-blue-500" />
                                </button>
                                <AnimatePresence>
                                    {isDateOpen && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 right-0 min-w-[280px] mt-2 bg-white border border-[#DDE3EA] rounded-3xl shadow-2xl p-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="font-black text-slate-700 px-2">←</button>
                                                <span className="font-black text-blue-500 text-sm uppercase tracking-widest">{viewDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                                                <button type="button" onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="font-black text-slate-700 px-2">→</button>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                                                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                            </div>
                                            {(() => {
                                                const year = viewDate.getFullYear(); const month = viewDate.getMonth(); const firstDay = new Date(year, month, 1); const lastDate = new Date(year, month + 1, 0).getDate();
                                                let startDay = firstDay.getDay(); startDay = startDay === 0 ? 6 : startDay - 1;
                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                const days = [];
                                                for (let i = 0; i < startDay; i++) { days.push(<div key={`empty-${i}`}></div>); }
                                                for (let day = 1; day <= lastDate; day++) {
                                                    const tempDate = new Date(year, month, day); tempDate.setHours(0, 0, 0, 0);
                                                    const isPast = tempDate < today;
                                                    const isSunday = tempDate.getDay() === 0;
                                                    const isLocked = isPast || isSunday;
                                                    const formattedValue = tempDate.toLocaleDateString('en-GB').replace(/\//g, '-');

                                                    days.push(
                                                        <button type="button" key={day} disabled={isLocked} onClick={() => { if (!isLocked) { setFormData({ ...formData, date: formattedValue }); setIsDateOpen(false); } }} className={`p-2 rounded-xl text-[13px] font-black transition-all ${isLocked ? "opacity-20 cursor-not-allowed bg-slate-50" : "text-slate-700 hover:bg-violet-100 hover:text-violet-700"}`}>
                                                            {day}
                                                        </button>
                                                    );
                                                }
                                                return <div className="grid grid-cols-7 gap-1">{days}</div>;
                                            })()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Timing Selectors */}
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <label className="text-[14px] font-black text-slate-400 uppercase mb-4 block tracking-widest flex items-center gap-2"><Clock size={16} className="text-blue-500" /> Duration (Strict Overlap Check)</label>
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="flex-1 w-full flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                                        <span className="font-bold text-slate-800 pl-3 text-xs uppercase tracking-widest">Start</span>
                                        <input type="text" placeholder="09:00" className="w-full text-center font-black outline-none bg-transparent text-lg text-slate-700" value={formData.fromTime} onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })} maxLength="5" />
                                        <div className="relative" ref={fromRef}>
                                            <button
                                                type="button"
                                                onClick={() => setIsFromAmPmOpen(!isFromAmPmOpen)}
                                                className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] text-[#42A5F5] font-black rounded-xl px-4 py-3 outline-none shadow-sm transition-all hover:border-[#42A5F5] hover:bg-white"
                                            >
                                                {formData.fromAmPm}
                                            </button>

                                            {isFromAmPmOpen && (
                                                <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-[#E2E8F0] overflow-hidden z-50 min-w-[100px]">
                                                    {["AM", "PM"].map((period) => (
                                                        <button
                                                            key={period}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    fromAmPm: period
                                                                });
                                                                setIsFromAmPmOpen(false);
                                                            }}
                                                            className={`w-full text-left px-5 py-3 font-black uppercase transition-all
                        ${formData.fromAmPm === period
                                                                    ? "bg-[#42A5F5] text-white"
                                                                    : "text-[#0F172A] hover:bg-[#EFF6FF]"
                                                                }`}
                                                        >
                                                            {period}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-black text-slate-800">TO</span>
                                    <div className="flex-1 w-full flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                                        <span className="font-bold text-slate-800 pl-3 text-xs uppercase tracking-widest">End</span>
                                        <input type="text" placeholder="10:00" className="w-full text-center font-black outline-none bg-transparent text-lg text-slate-700" value={formData.toTime} onChange={(e) => setFormData({ ...formData, toTime: e.target.value })} maxLength="5" />
                                        <div className="relative" ref={toRef}>
                                            <button
                                                type="button"
                                                onClick={() => setIsToAmPmOpen(!isToAmPmOpen)}
                                                className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] text-[#42A5F5] font-black rounded-xl px-4 py-3 outline-none shadow-sm transition-all hover:border-[#42A5F5] hover:bg-white"
                                            >
                                                {formData.toAmPm}
                                            </button>

                                            {isToAmPmOpen && (
                                                <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-[#E2E8F0] overflow-hidden z-50 min-w-[100px]">
                                                    {["AM", "PM"].map((period) => (
                                                        <button
                                                            key={period}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    toAmPm: period
                                                                });
                                                                setIsToAmPmOpen(false);
                                                            }}
                                                            className={`w-full text-left px-5 py-3 font-black uppercase transition-all
                        ${formData.toAmPm === period
                                                                    ? "bg-[#42A5F5] text-white"
                                                                    : "text-[#0F172A] hover:bg-[#EFF6FF]"
                                                                }`}
                                                        >
                                                            {period}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#8B5CF6] transition-all flex justify-center items-center gap-3 border-b-4 border-slate-950">
                                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><Send size={20} /> Request Class</>}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* --- MONITOR HUB (CLASS TEACHER ONLY) --- */}
                {viewMode === 'monitor' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        {monitorData.length === 0 ? (
                            <div className="bg-white p-10 rounded-[3.5rem] border border-dashed border-slate-300 text-center shadow-sm">
                                <MonitorPlay size={48} className="text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold text-[15px]">No pending requests for Class {user.assignedClass}.</p>
                            </div>
                        ) : (
                            monitorData.map(req => (
                                <div key={req._id} className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-[#DDE3EA] relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 capitalize">{req.subjectName}</h3>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Requested by: <span className="text-slate-700">{req.proposerName}</span></p>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            Status: {req.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Platform</p>
                                            <p className="font-black text-slate-700 text-sm mt-1">{req.platform}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Schedule</p>
                                            <p className="font-black text-slate-700 text-sm mt-1">{req.date} | {req.startTime}-{req.endTime}</p>
                                        </div>
                                    </div>

                                    {req.status === 'pending' ? (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => confirmMonitorAction(req._id, 'approve')}
                                                className="flex-1 py-4 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={18} /> Approve
                                            </button>
                                            <button
                                                onClick={() => confirmMonitorAction(req._id, 'reject')}
                                                className="flex-1 py-4 bg-red-50 text-red-500 rounded-[2rem] font-black uppercase tracking-widest shadow-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4">
                                            <a href={req.hostLink} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                                <LinkIcon size={18} /> Review Host Link
                                            </a>
                                            {/* FIX: handleAction ki jagah confirmMonitorAction lagaya hai */}
                                            <button onClick={() => confirmMonitorAction(req._id, 'reject')} className="py-4 px-6 bg-red-50 text-red-500 rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </motion.div>
                )}

            </div>
            {/* MODAL 1: CONFIRM REQUEST */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setShowConfirmModal(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative z-10 text-center">
                            <div className="w-16 h-16 bg-blue-50 text-[#42A5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Video size={32} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 mb-2">Confirm Request</h2>
                            <p className="text-slate-500 font-bold text-sm mb-8">Send live class request for {formData.subject} to class teacher?</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={confirmAndSubmit} 
                                    disabled={loading}
                                    className="flex-1 bg-[#42A5F5] text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-[48px]"
                                >
                                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Confirm"}
                                </button>
                                <button 
                                    onClick={() => setShowConfirmModal(false)} 
                                    disabled={loading}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed h-[48px]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 2: MONITOR HUB ACTION (APPROVE / REJECT) */}
            <AnimatePresence>
                {actionConfirmModal.show && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setActionConfirmModal({ show: false, action: '', id: '' })} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative z-10 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${actionConfirmModal.action === 'approve' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                {actionConfirmModal.action === 'approve' ? <CheckCircle2 size={32} className="text-emerald-500" /> : <Trash2 size={32} className="text-red-500" />}
                            </div>
                            <h2 className="text-xl font-black text-slate-800 mb-2">Are you sure?</h2>
                            <p className="text-slate-500 font-bold text-sm mb-8">
                                {actionConfirmModal.action === 'approve'
                                    ? "Approve this live class? Links will be generated for teacher and students."
                                    : "Reject/Delete this live class request? This cannot be undone."}
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={executeMonitorAction} 
                                    disabled={loading}
                                    className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs text-white disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-[48px] ${actionConfirmModal.action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
                                >
                                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Confirm"}
                                </button>
                                <button 
                                    onClick={() => setActionConfirmModal({ show: false, action: '', id: '' })} 
                                    disabled={loading}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed h-[48px]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 3: STRICT TIME CLASH ALERT */}
            <AnimatePresence>
                {clashError && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" 
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.8, y: 20, opacity: 0 }} 
                            animate={{ scale: 1, y: 0, opacity: 1 }} 
                            exit={{ scale: 0.8, y: 20, opacity: 0 }} 
                            className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative z-10 text-center border-4 border-red-50"
                        >
                            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <AlertTriangle size={36} />
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-widest">
                                Schedule Overlap
                            </h2>
                            
                            <p className="text-slate-600 font-bold text-[15px] mb-8 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                {clashError}
                            </p>
                            
                            <button 
                                onClick={() => setClashError(null)} 
                                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95 border-b-4 border-slate-950"
                            >
                                Okay, I Understand
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherLiveClass;
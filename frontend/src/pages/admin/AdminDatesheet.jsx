import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckSquare, Upload, Zap, Printer, ChevronDown, Check, FileUp, AlertTriangle, FileCheck, List, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

const AdminDatesheet = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // UI States
    const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'manual'
    const [publishConfirmModal, setPublishConfirmModal] = useState({ show: false, type: '' });

    // Dropdown & Calendar States
    const [availableClasses, setAvailableClasses] = useState([]);
    const [isClassOpen, setIsClassOpen] = useState(false);

    // AI Form States
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isResultDateOpen, setIsResultDateOpen] = useState(false);
    const [isAmPmOpen, setIsAmPmOpen] = useState(false);
    const [isToAmPmOpen, setIsToAmPmOpen] = useState(false);
    const [isFromAmPmOpen, setIsFromAmPmOpen] = useState(false);
    const [startViewDate, setStartViewDate] = useState(new Date());
    const [resultViewDate, setResultViewDate] = useState(new Date());
    const [publishedList, setPublishedList] = useState([]);

    const startCalendarRef = useRef(null);
    const resultCalendarRef = useRef(null);
    const fromAmPmRef = useRef(null);
    const toAmPmRef = useRef(null);

    // NEW REFS FOR CUSTOM MANUAL DROPDOWNS
    const manualDateCalendarRef = useRef(null);
    const manualClassSelectRef = useRef(null);
    const manualSubjectSelectRef = useRef(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // AI Form Data
    const [formData, setFormData] = useState({
        title: '', classes: [], startDate: '', gapDays: '',
        fromTime: '', fromAmPm: 'AM', toTime: '', toAmPm: 'PM',
        resultDate: '', notes: '', signatures: { incharge: '', principal: '' }
    });

    // --- MANUAL WIZARD DATA & CUSTOM STATES ---
    const [manualData, setManualData] = useState({ title: '', fileData: '', signatures: { incharge: '' } });
    const [manualWizard, setManualWizard] = useState({
        timing: '',
        selectedClass: '',
        selectedSubject: '',
        examDate: '',
        classSubjects: ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Computer'],
        completedClasses: [],
        masterSchedule: [] // Tracks matrix for Admit Card Engine
    });

    // Custom UI States for Manual Wizard
    const [isManualClassSelectOpen, setIsManualClassSelectOpen] = useState(false);
    const [isManualSubjectOpen, setIsManualSubjectOpen] = useState(false);
    const [isManualDateOpen, setIsManualDateOpen] = useState(false);
    const [manualViewDate, setManualViewDate] = useState(new Date());

    const [generatedSchedule, setGeneratedSchedule] = useState(null);
    const [currentSchoolName, setCurrentSchoolName] = useState("EduFlowAI Public School");

    useEffect(() => {
        fetchClasses();
        fetchSchoolProfile();
    }, []);

    const fetchSchoolProfile = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj.schoolId && userObj.schoolId.name) {
                    setCurrentSchoolName(userObj.schoolId.name);
                }
            }
        } catch (error) { console.log("Using default school name"); }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (startCalendarRef.current && !startCalendarRef.current.contains(e.target)) setIsStartDateOpen(false);
            if (resultCalendarRef.current && !resultCalendarRef.current.contains(e.target)) setIsResultDateOpen(false);
            if (fromAmPmRef.current && !fromAmPmRef.current.contains(e.target)) setIsFromAmPmOpen(false);
            if (toAmPmRef.current && !toAmPmRef.current.contains(e.target)) setIsToAmPmOpen(false);

            // Ref checks for Custom Manual Wizard
            if (manualDateCalendarRef.current && !manualDateCalendarRef.current.contains(e.target)) setIsManualDateOpen(false);
            if (manualClassSelectRef.current && !manualClassSelectRef.current.contains(e.target)) setIsManualClassSelectOpen(false);
            if (manualSubjectSelectRef.current && !manualSubjectSelectRef.current.contains(e.target)) setIsManualSubjectOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchClasses = async () => {
        try {
            const { data } = await API.get('/notices/meta/classes');

            // Remove sections and duplicates
            const baseClassesOnly = [...new Set(data.map(cls => String(cls).split('-')[0].trim()))];
            const sorted = baseClassesOnly.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

            setAvailableClasses(sorted);
        } catch (err) {
            triggerToast("Failed to fetch classes", "error");
        }
    };

    // Fetches Real Subjects when Manual Class is selected
    const handleManualClassSelect = async (cls) => {
        setManualWizard(prev => ({ ...prev, selectedClass: cls, selectedSubject: '', examDate: '', classSubjects: [] }));
        if (!cls) return;

        try {
            const { data } = await API.get(`/datesheet/class-subjects/${cls}`);
            setManualWizard(prev => ({ ...prev, classSubjects: data }));
        } catch (err) {
            setManualWizard(prev => ({ ...prev, classSubjects: ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi'] }));
        }
    };

    const triggerToast = (msg, type = "success") => {
        setShowToast({ show: true, message: msg, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const toggleClassAI = (cls) => {
        setFormData(prev => ({
            ...prev, classes: prev.classes.includes(cls) ? prev.classes.filter(c => c !== cls) : [...prev.classes, cls]
        }));
    };
    const handleSelectAllAI = () => {
        setFormData(prev => ({ ...prev, classes: prev.classes.length === availableClasses.length ? [] : [...availableClasses] }));
    };

    const handleSignatureUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, signatures: { ...prev.signatures, [type]: reader.result } }));
            reader.readAsDataURL(file);
        }
    };

    const handleManualFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setManualData(prev => ({ ...prev, fileData: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    // Handle Manual Incharge Signature
    const handleManualSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setManualData(prev => ({ ...prev, signatures: { incharge: reader.result } }));
            reader.readAsDataURL(file);
        }
    };

    // --- MANUAL WIZARD FUNCTIONS ---
    // Computed array of BASE CLASSES ONLY (e.g. 9-A -> 9) excluding already completed classes AND the currently selected class
    const baseClassesForManual = [...new Set(availableClasses.map(c => c.split('-')[0].trim()))]
        .filter(c => !manualWizard.completedClasses.includes(c) && c !== manualWizard.selectedClass);

    const handleManualAddSubject = () => {
        if (!manualWizard.selectedClass || !manualWizard.selectedSubject || !manualWizard.examDate) {
            return triggerToast("Please select Subject and Exam Date first!", "error");
        }

        const dateObj = new Date(manualWizard.examDate);
        const formattedDate = dateObj.toLocaleDateString('en-GB').replace(/\//g, '-');
        const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });

        setManualWizard(prev => {
            const updatedSchedule = [...prev.masterSchedule];
            let dateRow = updatedSchedule.find(r => r.date === formattedDate);
            if (!dateRow) {
                dateRow = { date: formattedDate, day: dayName, classExams: {} };
                updatedSchedule.push(dateRow);
            }
            dateRow.classExams[prev.selectedClass] = prev.selectedSubject;

            return {
                ...prev,
                masterSchedule: updatedSchedule,
                classSubjects: prev.classSubjects.filter(s => s !== prev.selectedSubject),
                selectedSubject: '',
                examDate: ''
            };
        });
        triggerToast("Subject scheduled!", "success");
    };

    const handleManualClassDone = () => {
        setManualWizard(prev => ({
            ...prev,
            completedClasses: [...prev.completedClasses, prev.selectedClass],
            selectedClass: '',
            classSubjects: ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Computer']
        }));
        triggerToast("Class schedule locked!", "success");
    };

    // --- NEW: EDIT COMPLETED CLASS LOGIC (SMART SUBJECT FILTERING) ---
    const handleEditCompletedClass = async (cls) => {
        try {
            // 1. Asli subjects fetch karo backend se
            const { data } = await API.get(`/datesheet/class-subjects/${cls}`);

            setManualWizard(prev => {
                // 2. Check karo ki is class ke kitne subjects ALREADY schedule ho chuke hain datesheet mein
                const scheduledSubjects = prev.masterSchedule
                    .filter(row => row.classExams[cls])
                    .map(row => row.classExams[cls]);

                // 3. Jo schedule ho chuke hain, unko total subjects mein se hata do (Filter)
                const remainingSubjects = data.filter(s => !scheduledSubjects.includes(s));

                return {
                    ...prev,
                    selectedClass: cls,
                    selectedSubject: '',
                    examDate: '',
                    classSubjects: remainingSubjects, // Ab dropdown mein SIRF BACHE HUE subjects aayenge!
                    completedClasses: prev.completedClasses.filter(c => c !== cls)
                };
            });
        } catch (err) {
            // Agar API fail ho jaye toh default subjects par same logic lagao
            setManualWizard(prev => {
                const fallbackSubjects = ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Computer'];
                const scheduledSubjects = prev.masterSchedule
                    .filter(row => row.classExams[cls])
                    .map(row => row.classExams[cls]);

                const remainingSubjects = fallbackSubjects.filter(s => !scheduledSubjects.includes(s));

                return {
                    ...prev,
                    selectedClass: cls,
                    selectedSubject: '',
                    examDate: '',
                    classSubjects: remainingSubjects,
                    completedClasses: prev.completedClasses.filter(c => c !== cls)
                };
            });
        }
    };

    // AI Generation
    const handleGenerate = async (e) => {
        e.preventDefault();
        if (formData.classes.length === 0) return triggerToast("Please select classes! ⚠️", "error");
        if (!formData.startDate || !formData.resultDate) return triggerToast("Please select dates! ⚠️", "error");
        if (!formData.fromTime || !formData.toTime) return triggerToast("Please set timings! ⚠️", "error");

        setLoading(true);
        try {
            const combinedTiming = `${formData.fromTime} ${formData.fromAmPm} - ${formData.toTime} ${formData.toAmPm}`;
            const payload = { ...formData, timing: combinedTiming };
            const { data } = await API.post('/datesheet/generate-preview', payload);

            setGeneratedSchedule(data.schedule);
            if (data.schoolName) setCurrentSchoolName(data.schoolName);
            triggerToast("Datesheet Generated Successfully! ✨", "success");
        } catch (err) { triggerToast(err.response?.data?.message || "Generation failed.", "error"); }
        finally { setLoading(false); }
    };

    // PUBLISH LOGIC
    const executePublish = async () => {
        setLoading(true);
        try {
            if (publishConfirmModal.type === 'ai') {
                const combinedTiming = `${formData.fromTime} ${formData.fromAmPm} - ${formData.toTime} ${formData.toAmPm}`;
                await API.post('/datesheet/save', { ...formData, timing: combinedTiming, schedule: generatedSchedule });

                setFormData({
                    title: '', classes: [], startDate: '', gapDays: '',
                    fromTime: '', fromAmPm: 'AM', toTime: '', toAmPm: 'PM',
                    resultDate: '', notes: '', signatures: { incharge: '', principal: '' }
                });
                setGeneratedSchedule(null);

            } else {
                const payload = {
                    title: manualData.title,
                    fileData: manualData.fileData,
                    classes: manualWizard.completedClasses,
                    timing: manualWizard.timing,
                    schedule: manualWizard.masterSchedule,
                    signatures: manualData.signatures
                };
                await API.post('/datesheet/save-manual', payload);

                setManualData({ title: '', fileData: '', signatures: { incharge: '' } });
                setManualWizard({
                    timing: '', selectedClass: '', selectedSubject: '', examDate: '',
                    classSubjects: ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Computer'],
                    completedClasses: [], masterSchedule: []
                });
            }

            setPublishConfirmModal({ show: false, type: '' });
            triggerToast("Published Officially to Students! 🚀", "success");
        } catch (err) {
            setPublishConfirmModal({ show: false, type: '' });
            triggerToast("Publish failed.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* Header */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-center gap-2 relative z-10">
                    <button onClick={() => navigate(-1)} className="p-2 md:p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-4xl md:text-4xl font-black italic tracking-tight capitalize">Datesheet Engine</h1>
                    </div>
                    <div className="p-2 md:p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                        <Zap size={24} />
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20 space-y-8 max-w-6xl mx-auto">

                {/* Manage Button */}
                {!generatedSchedule && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => navigate('/admin/manage-datesheets')}
                            className="bg-white border border-slate-200 text-[#42A5F5] px-6 py-3 rounded-[2rem] font-black uppercase tracking-widest text-[12px] shadow-sm hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-2"
                        >
                            Manage Uploaded
                        </button>
                    </div>
                )}

                {/* Toggle Tabs */}
                {!generatedSchedule && (
                    <div className="flex gap-2 md:gap-4 mb-6 bg-white p-2 rounded-[2.5rem] shadow-md w-full max-w-md mx-auto border border-[#DDE3EA]">
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 px-2 md:px-8 py-3 rounded-[2rem] text-[10px] md:text-sm font-black uppercase tracking-widest transition-all text-center ${activeTab === 'ai' ? 'bg-[#42A5F5] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            AI Generator
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 px-2 md:px-8 py-3 rounded-[2rem] text-[10px] md:text-sm font-black uppercase tracking-widest transition-all text-center ${activeTab === 'manual' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Manual Generate
                        </button>
                    </div>
                )}

                {/* --- TAB 1: AI GENERATOR --- */}
                {activeTab === 'ai' && !generatedSchedule && (
                    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleGenerate} className="bg-white rounded-[3.5rem] p-8 shadow-2xl border border-[#DDE3EA]">
                        <div className="space-y-6">
                            {/* Exam Title */}
                            <div>
                                <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Exam Datesheet Heading</label>
                                <input type="text" placeholder="e.g. MID TERM EXAMINATION" className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 text-[16px] font-bold outline-none focus:border-[#42A5F5] uppercase"
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                            </div>

                            {/* Animated Class Dropdown AI */}
                            <div>
                                <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Classes</label>
                                <div className="relative">
                                    <button type="button" onClick={() => setIsClassOpen(!isClassOpen)} className="w-full flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-200 font-bold text-slate-700 outline-none transition-all">
                                        <span>{formData.classes.length === availableClasses.length && availableClasses.length > 0 ? 'ALL CLASSES SELECTED' : formData.classes.length > 0 ? `${formData.classes.length} Classes Selected` : 'Select Classes from Dropdown'}</span>
                                        <ChevronDown size={20} className={`text-[#42A5F5] transition-transform ${isClassOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isClassOpen && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 max-h-72 overflow-y-auto">
                                                <button type="button" onClick={handleSelectAllAI} className="w-full mb-3 bg-blue-50 text-[#42A5F5] py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
                                                    {formData.classes.length === availableClasses.length ? 'Deselect All' : 'Select All Classes'}
                                                </button>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {availableClasses.map(cls => (
                                                        <button key={cls} type="button" onClick={() => toggleClassAI(cls)} className={`flex justify-between items-center px-4 py-3 rounded-xl font-bold transition-all ${formData.classes.includes(cls) ? 'bg-[#42A5F5] text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                                            Class {cls} {formData.classes.includes(cls) && <Check size={16} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Calendars & Gaps */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="relative" ref={startCalendarRef}>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Exam Starting Date</label>
                                    <button type="button" onClick={() => { setIsStartDateOpen(!isStartDateOpen); setIsResultDateOpen(false); }} className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 font-bold text-left">{formData.startDate || "Select Date"}</button>
                                    <AnimatePresence>
                                        {isStartDateOpen && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-3 bg-white border border-[#DDE3EA] rounded-[2.5rem] shadow-2xl p-5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <button type="button" onClick={() => setStartViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="font-black text-slate-700">←</button>
                                                    <span className="font-black text-[#42A5F5]">{startViewDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                                                    <button type="button" onClick={() => setStartViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="font-black text-slate-700">→</button>
                                                </div>
                                                <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-bold text-slate-400 mb-2">
                                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                                </div>
                                                {(() => {
                                                    const year = startViewDate.getFullYear(); const month = startViewDate.getMonth(); const firstDay = new Date(year, month, 1); const lastDate = new Date(year, month + 1, 0).getDate();
                                                    let startDay = firstDay.getDay(); startDay = startDay === 0 ? 6 : startDay - 1;
                                                    const days = [];
                                                    for (let i = 0; i < startDay; i++) { days.push(<div key={i}></div>); }
                                                    for (let day = 1; day <= lastDate; day++) {
                                                        const tempDate = new Date(year, month, day); tempDate.setHours(0, 0, 0, 0);
                                                        const isPast = tempDate < today;
                                                        const formatted = tempDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
                                                        days.push(
                                                            <button type="button" key={day} disabled={isPast} onClick={() => { if (isPast) return; setFormData({ ...formData, startDate: formatted }); setIsStartDateOpen(false); }} className={`p-2 rounded-xl text-[13px] font-black ${isPast ? "opacity-20 cursor-not-allowed" : "text-slate-600 hover:bg-blue-100"}`}>{day}</button>
                                                        );
                                                    }
                                                    return <div className="grid grid-cols-7 gap-2">{days}</div>;
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="relative" ref={resultCalendarRef}>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Result Declaration</label>
                                    <button type="button" onClick={() => { setIsResultDateOpen(!isResultDateOpen); setIsStartDateOpen(false); }} className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 font-bold text-left">{formData.resultDate || "Select Date"}</button>
                                    <AnimatePresence>
                                        {isResultDateOpen && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-3 bg-white border border-[#DDE3EA] rounded-[2.5rem) shadow-2xl p-5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <button type="button" onClick={() => setResultViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="font-black text-slate-700">←</button>
                                                    <span className="font-black text-[#42A5F5]">{resultViewDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                                                    <button type="button" onClick={() => setResultViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="font-black text-slate-700">→</button>
                                                </div>
                                                <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-bold text-slate-400 mb-2">
                                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                                </div>
                                                {(() => {
                                                    const year = resultViewDate.getFullYear(); const month = resultViewDate.getMonth(); const firstDay = new Date(year, month, 1); const lastDate = new Date(year, month + 1, 0).getDate();
                                                    let startDay = firstDay.getDay(); startDay = startDay === 0 ? 6 : startDay - 1;
                                                    const days = [];
                                                    for (let i = 0; i < startDay; i++) { days.push(<div key={i}></div>); }
                                                    for (let day = 1; day <= lastDate; day++) {
                                                        const tempDate = new Date(year, month, day); tempDate.setHours(0, 0, 0, 0);
                                                        const isPast = tempDate < today;
                                                        const formatted = tempDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
                                                        days.push(
                                                            <button type="button" key={day} disabled={isPast} onClick={() => { if (isPast) return; setFormData({ ...formData, resultDate: formatted }); setIsResultDateOpen(false); }} className={`p-2 rounded-xl text-[13px] font-black ${isPast ? "opacity-20 cursor-not-allowed" : "text-slate-600 hover:bg-blue-100"}`}>{day}</button>
                                                        );
                                                    }
                                                    return <div className="grid grid-cols-7 gap-2">{days}</div>;
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Gap Days (Excl. Sunday)</label>
                                    <input type="number" min="0" placeholder="e.g. 1" className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 font-bold outline-none focus:border-[#42A5F5]" value={formData.gapDays} onChange={(e) => setFormData({ ...formData, gapDays: e.target.value })} required />
                                </div>
                            </div>

                            {/* Timing */}
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <label className="text-[13px] font-black text-slate-500 uppercase mb-4 block tracking-widest flex items-center gap-2"><Clock size={16} className="text-[#42A5F5]" /> School Timing</label>
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="flex-1 w-full flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                        <span className="font-bold text-slate-400 pl-2">From</span>
                                        <input type="text" placeholder="09:00" className="w-full text-center font-black outline-none bg-transparent text-lg" value={formData.fromTime} onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })} required />
                                        <div className="relative" ref={fromAmPmRef}>
                                            <button type="button" onClick={() => setIsFromAmPmOpen(!isFromAmPmOpen)} className="w-full bg-blue-50 text-[#42A5F5] font-black rounded-xl p-3 outline-none flex justify-between items-center">{formData.fromAmPm}</button>
                                            <AnimatePresence>
                                                {isFromAmPmOpen && (
                                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                                                        {["AM", "PM"].map((period) => (
                                                            <button key={period} type="button" onClick={() => { setFormData({ ...formData, fromAmPm: period }); setIsFromAmPmOpen(false); }} className={`w-full text-left px-4 py-3 font-black transition-all ${formData.fromAmPm === period ? "bg-blue-100 text-[#42A5F5]" : "hover:bg-slate-50 text-slate-700"}`}>{period}</button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <span className="font-black text-slate-300">TO</span>
                                    <div className="flex-1 w-full flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                        <input type="text" placeholder="12:30" className="w-full text-center font-black outline-none bg-transparent text-lg" value={formData.toTime} onChange={(e) => setFormData({ ...formData, toTime: e.target.value })} required />
                                        <div className="relative" ref={toAmPmRef}>
                                            <button type="button" onClick={() => setIsToAmPmOpen(!isToAmPmOpen)} className="w-full bg-blue-50 text-[#42A5F5] font-black rounded-xl p-3 outline-none flex justify-between items-center">{formData.toAmPm}</button>
                                            <AnimatePresence>
                                                {isToAmPmOpen && (
                                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                                                        {["AM", "PM"].map((period) => (
                                                            <button key={period} type="button" onClick={() => { setFormData({ ...formData, toAmPm: period }); setIsToAmPmOpen(false); }} className={`w-full text-left px-4 py-3 font-black transition-all ${formData.toAmPm === period ? "bg-blue-100 text-[#42A5F5]" : "hover:bg-slate-50 text-slate-700"}`}>{period}</button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions Box & Sigs */}
                            <div>
                                <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Instructions / Kindly Note</label>
                                <textarea rows="3" placeholder="Write exam instructions here..." className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 font-bold outline-none focus:border-[#42A5F5] resize-none" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <div>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Examination Incharge Sign</label>
                                    <input type="file" accept="image/*" onChange={(e) => handleSignatureUpload(e, 'incharge')} required className="w-full text-sm font-bold file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-[#42A5F5] file:text-white hover:file:bg-blue-600" />
                                </div>
                                <div>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Principal Sign</label>
                                    <input type="file" accept="image/*" onChange={(e) => handleSignatureUpload(e, 'principal')} required className="w-full text-sm font-bold file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-[#42A5F5] file:text-white hover:file:bg-blue-600" />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#42A5F5] transition-all flex items-center justify-center gap-2">
                                {loading ? <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span> : <><Zap size={24} /> Generate AI Datesheet</>}
                            </button>
                        </div>
                    </motion.form>
                )}

                {/* --- TAB 2: MANUAL UPLOAD & WIZARD --- */}
                {activeTab === 'manual' && !generatedSchedule && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] p-8 shadow-2xl border border-indigo-100">
                        <h2 className="text-2xl font-black text-indigo-900 mb-6 flex items-center gap-2">
                            <FileUp className="text-indigo-500" /> Upload & Setup Admit Card Matrix
                        </h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Datesheet Title</label>
                                    <input type="text" placeholder="e.g. HALF YEARLY EXAM" className="w-full bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 text-[16px] font-bold outline-none focus:border-indigo-400 uppercase"
                                        value={manualData.title} onChange={(e) => setManualData({ ...manualData, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Timing</label>
                                    <input type="text" placeholder="e.g. 09:00 AM - 12:30 PM" className="w-full bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 text-[16px] font-bold outline-none focus:border-indigo-400 uppercase"
                                        value={manualWizard.timing} onChange={(e) => setManualWizard({ ...manualWizard, timing: e.target.value })} />
                                </div>
                            </div>

                            {/* THE NEW SMART WIZARD FOR ADMIT CARDS WITH CUSTOM DROPDOWNS */}
                            <div className="bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                                <h3 className="font-black uppercase tracking-widest text-indigo-400 text-sm mb-2 border-b border-indigo-100 pb-2">Subject Mapping Wizard</h3>

                                {/* --- NEW: INTERACTIVE COMPLETED CLASSES LIST --- */}
                                {manualWizard.completedClasses.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Locked Classes (Click to Edit)</p>
                                        <div className="flex flex-wrap gap-3">
                                            {manualWizard.completedClasses.map(cls => (
                                                <button key={cls} type="button" onClick={() => handleEditCompletedClass(cls)} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-bold text-xs shadow-sm hover:bg-emerald-100 transition-all">
                                                    Class {cls} <List size={14} />
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    {/* Custom Manual Class Dropdown */}
                                    <div className="relative" ref={manualClassSelectRef}>
                                        <button type="button" onClick={() => setIsManualClassSelectOpen(!isManualClassSelectOpen)} className="w-full flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 font-bold outline-none uppercase text-sm text-slate-700">
                                            <span>{manualWizard.selectedClass ? `Class ${manualWizard.selectedClass}` : 'Select Class'}</span>
                                            <ChevronDown size={18} className={`text-indigo-500 transition-transform ${isManualClassSelectOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {isManualClassSelectOpen && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 max-h-60 overflow-y-auto">
                                                    <div className="flex flex-col gap-2">
                                                        {baseClassesForManual.map(c => (
                                                            <button key={c} type="button" onClick={() => { handleManualClassSelect(c); setIsManualClassSelectOpen(false); }} className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${manualWizard.selectedClass === c ? 'bg-indigo-500 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                                                                Class {c}
                                                            </button>
                                                        ))}
                                                        {baseClassesForManual.length === 0 && manualWizard.completedClasses.length > 0 && <p className="text-xs text-center text-slate-400 p-2">All classes mapped. Edit locked classes if needed.</p>}
                                                        {baseClassesForManual.length === 0 && manualWizard.completedClasses.length === 0 && <p className="text-xs text-center text-slate-400 p-2">No classes found</p>}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Custom Manual Subject Dropdown */}
                                    <div className="relative" ref={manualSubjectSelectRef}>
                                        <button type="button" disabled={!manualWizard.selectedClass} onClick={() => setIsManualSubjectOpen(!isManualSubjectOpen)} className={`w-full flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 font-bold outline-none uppercase text-sm ${!manualWizard.selectedClass ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-700'}`}>
                                            <span className="truncate">{manualWizard.selectedSubject || 'Select Subject'}</span>
                                            <ChevronDown size={18} className={`text-indigo-500 transition-transform ${isManualSubjectOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {isManualSubjectOpen && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 max-h-60 overflow-y-auto">
                                                    <div className="flex flex-col gap-2">
                                                        {manualWizard.classSubjects.map(s => (
                                                            <button key={s} type="button" onClick={() => { setManualWizard({ ...manualWizard, selectedSubject: s }); setIsManualSubjectOpen(false); }} className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${manualWizard.selectedSubject === s ? 'bg-indigo-500 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                                                                {s}
                                                            </button>
                                                        ))}
                                                        {manualWizard.classSubjects.length === 0 && <p className="text-xs text-center text-slate-400 p-2">No subjects left</p>}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Custom Manual Exam Date Calendar */}
                                    <div className="relative" ref={manualDateCalendarRef}>
                                        <button type="button" disabled={!manualWizard.selectedSubject} onClick={() => setIsManualDateOpen(!isManualDateOpen)} className={`w-full bg-white p-4 rounded-xl border border-slate-200 font-bold text-left text-sm ${!manualWizard.selectedSubject ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-700'}`}>
                                            {manualWizard.examDate || "Select Exam Date"}
                                        </button>
                                        <AnimatePresence>
                                            {isManualDateOpen && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 right-0 min-w-[280px] mt-2 bg-white border border-[#DDE3EA] rounded-2xl shadow-2xl p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <button type="button" onClick={() => setManualViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="font-black text-slate-700 px-2 py-1">←</button>
                                                        <span className="font-black text-indigo-500 text-sm">{manualViewDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                                                        <button type="button" onClick={() => setManualViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="font-black text-slate-700 px-2 py-1">→</button>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                                                        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                                    </div>
                                                    {(() => {
                                                        const year = manualViewDate.getFullYear(); const month = manualViewDate.getMonth(); const firstDay = new Date(year, month, 1); const lastDate = new Date(year, month + 1, 0).getDate();
                                                        let startDay = firstDay.getDay(); startDay = startDay === 0 ? 6 : startDay - 1;

                                                        // --- SMART DATE BLOCKER LOGIC (RESET FOR NEW CLASS) ---
                                                        let minAllowedDate = new Date();
                                                        minAllowedDate.setHours(0, 0, 0, 0); // Default constraint: Today
                                                        
                                                        if (manualWizard.selectedClass) {
                                                            // Find ONLY the dates already scheduled for the CURRENTLY selected class
                                                            const scheduledDatesForCurrentClass = manualWizard.masterSchedule
                                                                .filter(row => row.classExams[manualWizard.selectedClass])
                                                                .map(row => {
                                                                    const [d, m, y] = row.date.split('-');
                                                                    return new Date(y, m - 1, d).getTime();
                                                                });
                                                            
                                                            // Apply the blocking logic ONLY IF the current class has scheduled subjects
                                                            if (scheduledDatesForCurrentClass.length > 0) {
                                                                const latestExamTime = Math.max(...scheduledDatesForCurrentClass);
                                                                minAllowedDate = new Date(latestExamTime);
                                                                minAllowedDate.setDate(minAllowedDate.getDate() + 1); // Force next day
                                                                minAllowedDate.setHours(0,0,0,0);
                                                            }
                                                        }

                                                        const days = [];
                                                        for (let i = 0; i < startDay; i++) { days.push(<div key={`empty-${i}`}></div>); }
                                                        
                                                        for (let day = 1; day <= lastDate; day++) {
                                                            const tempDate = new Date(year, month, day); tempDate.setHours(0, 0, 0, 0);
                                                            
                                                            // 1. Block past dates AND dates before the minimum allowed date for THIS class
                                                            const isPastOrBlocked = tempDate < minAllowedDate;
                                                            
                                                            // 2. Block ALL Sundays permanently
                                                            const isSunday = tempDate.getDay() === 0;
                                                            
                                                            // 3. Highlight dates occupied by OTHER classes (just a visual dot, NOT blocked)
                                                            const formattedTemp = tempDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                                                            const isDateOccupiedByOtherClass = manualWizard.masterSchedule.some(row => row.date === formattedTemp && !row.classExams[manualWizard.selectedClass]);

                                                            // The date is locked IF it's past/blocked OR if it's a Sunday
                                                            const isLocked = isPastOrBlocked || isSunday;
                                                            const formattedDateValue = tempDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
                                                            
                                                            days.push(
                                                                <button type="button" key={day} disabled={isLocked} onClick={() => { if (isLocked) return; setManualWizard({ ...manualWizard, examDate: formattedDateValue }); setIsManualDateOpen(false); }} className={`p-1.5 rounded-lg text-[13px] font-black transition-all relative ${isLocked ? "opacity-20 cursor-not-allowed bg-slate-100 text-slate-400" : "text-slate-600 hover:bg-indigo-100"}`}>
                                                                    {/* Shows a tiny dot if another class has an exam on this date, so admin knows it's a busy day */}
                                                                    {isDateOccupiedByOtherClass && !isLocked && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-300 rounded-full"></span>}
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

                                </div>

                                {/* --- LIVE SCHEDULED SUBJECTS LIST --- */}
                                {manualWizard.selectedClass && manualWizard.masterSchedule.filter(row => row.classExams[manualWizard.selectedClass]).length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-[1rem] border border-indigo-100 shadow-sm mt-4 space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                                            Scheduled for Class {manualWizard.selectedClass}
                                        </p>
                                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {manualWizard.masterSchedule
                                                .filter(row => row.classExams[manualWizard.selectedClass])
                                                .map((row, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                        key={idx}
                                                        className="flex justify-between items-center bg-indigo-50/50 px-4 py-3 rounded-xl border border-indigo-50/80"
                                                    >
                                                        <span className="font-bold text-[14px] text-indigo-900 capitalize">
                                                            {row.classExams[manualWizard.selectedClass]}
                                                        </span>
                                                        <div className="text-right flex items-center gap-2">
                                                            <div>
                                                                <span className="block text-[12px] font-black text-indigo-500">{row.date}</span>
                                                                <span className="block text-[10px] font-bold text-slate-400 uppercase">{row.day}</span>
                                                            </div>
                                                            {/* BONUS: Delete function for subject */}
                                                            <button type="button" onClick={() => {
                                                                const subToDelete = row.classExams[manualWizard.selectedClass];
                                                                setManualWizard(prev => ({
                                                                    ...prev,
                                                                    masterSchedule: prev.masterSchedule.map(r => r.date === row.date ? { ...r, classExams: Object.fromEntries(Object.entries(r.classExams).filter(([k]) => k !== manualWizard.selectedClass)) } : r).filter(r => Object.keys(r.classExams).length > 0),
                                                                    classSubjects: [subToDelete, ...prev.classSubjects].sort()
                                                                }));
                                                            }} className="p-1.5 text-red-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={handleManualAddSubject} className="flex-1 py-3 bg-slate-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#42A5F5] transition-all text-xs shadow-md">
                                        + Add Subject
                                    </button>
                                    {manualWizard.selectedClass && (
                                        <button type="button" onClick={handleManualClassDone} className="flex-1 py-3 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl shadow-md text-xs hover:bg-emerald-600">
                                            Done for Class {manualWizard.selectedClass}
                                        </button>
                                    )}
                                </div>

                            </div>

                            {/* --- MANUAL EXAM CONTROLLER SIGNATURE --- */}
                            <div className="bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100">
                                <label className="text-[13px] font-black text-slate-500 uppercase ml-2 mb-2 block tracking-widest">
                                    Exam Controller Signature (For Admit Card)
                                </label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleManualSignatureUpload} 
                                    className="w-full text-sm font-bold file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-indigo-500 file:text-white hover:file:bg-indigo-600" 
                                />
                                {/* Preview chota sa */}
                                {manualData.signatures?.incharge && (
                                    <div className="mt-3 bg-white p-2 rounded-xl inline-block border border-slate-200">
                                        <img src={manualData.signatures.incharge} alt="Sign" className="h-10 object-contain" />
                                    </div>
                                )}
                            </div>

                            {/* Premium File Upload Box */}
                            <div className="border-2 border-dashed border-indigo-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center bg-white transition-all hover:bg-indigo-50/20">
                                {manualData.fileData ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3 shadow-inner">
                                            <FileCheck size={32} className="text-emerald-500" />
                                        </div>
                                        <p className="font-black text-slate-700 uppercase tracking-widest">Document Ready</p>
                                        <button onClick={() => setManualData({ ...manualData, fileData: '' })} className="mt-4 px-4 py-2 bg-red-50 text-red-500 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Remove</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <FileUp size={40} className="text-indigo-300 mb-3" />
                                        <label className="cursor-pointer bg-indigo-500 text-white px-8 py-3 rounded-[1.5rem] font-black uppercase tracking-widest shadow-md hover:bg-indigo-600 transition-all text-xs">
                                            Attach PDF/Image
                                            <input type="file" accept="image/*,application/pdf" onChange={handleManualFileUpload} className="hidden" />
                                        </label>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!(manualData.title.trim() !== '' && manualWizard.timing.trim() !== '' && manualWizard.completedClasses.length > 0 && manualData.fileData !== '')}
                                onClick={() => setPublishConfirmModal({ show: true, type: 'manual' })}
                                className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${(manualData.title.trim() !== '' && manualWizard.timing.trim() !== '' && manualWizard.completedClasses.length > 0 && manualData.fileData !== '')
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70 shadow-none'
                                    }`}
                            >
                                <Upload size={24} /> Publish Students
                            </button>
                        </div>
                    </motion.div>
                )}


                {/* --- GENERATED AI PREVIEW SECTION --- */}
                {generatedSchedule && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[1rem] p-8 shadow-2xl border border-slate-800 print:shadow-none print:border-none print:p-0">
                        {/* Same UI as existing preview */}
                        <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
                            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-wider mb-2">
                                {currentSchoolName || "EDULFLOWAI PUBLIC SCHOOL"}
                            </h1>
                            <h2 className="text-xl font-bold uppercase text-slate-800 mb-1">{formData.title}</h2>
                            <h3 className="text-lg font-bold uppercase text-slate-700">
                                Date Sheet - {formData.classes.length === availableClasses.length ? 'ALL CLASSES' : `Class ${formData.classes.join(', ')}`}
                            </h3>
                        </div>

                        <div className="overflow-x-auto mb-8">
                            <table className="w-full border-collapse border-2 border-slate-800 text-center text-sm font-bold text-slate-800">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="border-2 border-slate-800 p-3 uppercase tracking-wider bg-slate-200">Class \ Date</th>
                                        {generatedSchedule.map((col, idx) => (
                                            <th key={idx} className="border-2 border-slate-800 p-3">
                                                <div className="font-black whitespace-nowrap">{col.date}</div>
                                                <div className="text-slate-600 font-semibold">{col.day}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.classes.map(cls => (
                                        <tr key={cls}>
                                            <td className="border-2 border-slate-800 p-3 font-black uppercase whitespace-nowrap bg-slate-50 text-lg">Class {cls}</td>
                                            {generatedSchedule.map((col, idx) => (
                                                <td key={idx} className="border-2 border-slate-800 p-3 capitalize">{col.classExams[cls]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-24">
                            <h4 className="font-black text-slate-800 mb-4 underline">Kindly Note:</h4>
                            <ul className="list-disc pl-5 font-bold text-sm text-slate-700 space-y-2">
                                <li className="text-slate-900">
                                    <strong>Examination Timing:</strong> The examination will be conducted strictly from <span className="underline">{formData.fromTime} {formData.fromAmPm}</span> to <span className="underline">{formData.toTime} {formData.toAmPm}</span>.
                                </li>
                                <li className="text-slate-900">
                                    <strong>Result Declaration:</strong> The results for the above classes will be declared on <span className="underline">{formData.resultDate}</span>.
                                </li>
                                {formData.notes.split('\n').map((note, i) => (
                                    note.trim() && <li key={i}>{note}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-between items-end px-10">
                            <div className="text-left w-48">
                                {formData.signatures.incharge && <img src={formData.signatures.incharge} alt="Incharge Sign" className="h-16 mb-2 object-contain" />}
                                <p className="font-black border-t-2 border-slate-800 pt-2 uppercase">Examination Incharge</p>
                            </div>
                            <div className="text-right w-48">
                                {formData.signatures.principal && <img src={formData.signatures.principal} alt="Principal Sign" className="h-16 mb-2 object-contain ml-auto" />}
                                <p className="font-black border-t-2 border-slate-800 pt-2 uppercase">Principal</p>
                            </div>
                        </div>

                        <div className="mt-16 flex gap-4 print:hidden">
                            <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-100 text-slate-700 border border-slate-300 rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex justify-center items-center gap-2">
                                <Printer size={20} /> Print Document
                            </button>
                            <button onClick={() => setPublishConfirmModal({ show: true, type: 'ai' })} className="flex-1 py-4 bg-[#42A5F5] text-white rounded-[2rem] font-black uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all flex justify-center items-center gap-2">
                                <Upload size={20} /> Publish Publicly
                            </button>
                            <button onClick={() => setGeneratedSchedule(null)} className="py-4 px-8 bg-red-50 text-red-500 rounded-[2rem] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                Discard
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* --- CONFIRMATION MODAL --- */}
                <AnimatePresence>
                    {publishConfirmModal.show && (
                        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPublishConfirmModal({ show: false, type: '' })} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl relative z-10 text-center border border-[#DDE3EA]">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertTriangle className="text-[#42A5F5]" size={36} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Publish Datesheet</h2>
                                <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                                    Are you sure you want to publish this {publishConfirmModal.type === 'ai' ? 'Generated' : 'Manual'} Datesheet to students?
                                </p>
                                <div className="flex gap-4">
                                    <button disabled={loading} onClick={executePublish} className="flex-1 bg-[#42A5F5] text-white py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex justify-center items-center">
                                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Yes, Publish"}
                                    </button>
                                    <button onClick={() => setPublishConfirmModal({ show: false, type: '' })} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-200">
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default AdminDatesheet;
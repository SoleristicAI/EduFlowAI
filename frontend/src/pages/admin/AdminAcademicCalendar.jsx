import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, Plus, Trash2, ChevronDown, RefreshCw, AlertTriangle, Layers, Text } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

const AdminAcademicCalendar = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [eventsList, setEventsClasses] = useState([]);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // --- VIEW STATE ENGINE ---
    const [viewMode, setViewMode] = useState('list');
    const [durationMode, setDurationMode] = useState('single');

    // Modals & Custom Picker States
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

    // Separate calendar open states
    const [isCalendarOpen, setIsDateCalendarOpen] = useState(false);
    const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false);
    const [isToCalendarOpen, setIsToCalendarOpen] = useState(false);

    const [viewDate, setViewDate] = useState(new Date());

    // Form Context
    const [formData, setFormData] = useState({ title: '', description: '', eventType: '', date: '', fromDate: '', toDate: '' });

    const typeRef = useRef(null);
    const dateRef = useRef(null);
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    const eventColorMap = {
        'Holiday': { badge: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-500' },
        'Exam': { badge: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' },
        'PTM': { badge: 'bg-indigo-50 text-indigo-600 border-indigo-100', dot: 'bg-indigo-500' },
        'Event': { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' }
    };

    useEffect(() => {
        fetchCalendarEvents();

        const handleOutsideClick = (e) => {
            if (typeRef.current && !typeRef.current.contains(e.target)) setIsTypeDropdownOpen(false);
            if (dateRef.current && !dateRef.current.contains(e.target)) setIsDateCalendarOpen(false);
            if (fromDateRef.current && !fromDateRef.current.contains(e.target)) setIsFromCalendarOpen(false);
            if (toDateRef.current && !toDateRef.current.contains(e.target)) setIsToCalendarOpen(false);
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [viewMode]);

    const triggerToast = (message, type = "success") => {
        setShowToast({ show: true, message, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const fetchCalendarEvents = async () => {
        try {
            const { data } = await API.get('/academic-calendar/all-events');
            setEventsClasses(data);
        } catch (err) { console.error(err); }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (durationMode === 'single') {
            if (!formData.title || !formData.eventType || !formData.date) {
                return triggerToast("Please fill all compulsory fields! ⚠️", "error");
            }
        } else {
            if (!formData.title || !formData.eventType || !formData.fromDate || !formData.toDate) {
                return triggerToast("Please select both From and To dates! ⚠️", "error");
            }
        }

        setLoading(true);
        try {
            const finalPayload = {
                title: formData.title,
                eventType: formData.eventType,
                description: durationMode === 'single'
                    ? formData.description
                    : `${formData.description ? formData.description + ' | ' : ''}Duration: From ${formData.fromDate} To ${formData.toDate}`,
                date: durationMode === 'single' ? formData.date : formData.fromDate
            };

            await API.post('/academic-calendar/declare', finalPayload);
            triggerToast("Academic Schedule Broadcasted! 📡", "success");
            setViewMode('list');
            setFormData({ title: '', description: '', eventType: '', date: '', fromDate: '', toDate: '' });
            setDurationMode('single');
            fetchCalendarEvents();
        } catch (err) {
            triggerToast(err.response?.data?.message || "Failed to save event.", "error");
        } finally { setLoading(false); }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("Are you sure you want to remove this schedule event?")) return;
        try {
            await API.delete(`/academic-calendar/${id}`);
            triggerToast("Event Deleted 🗑️", "success");
            fetchCalendarEvents();
        } catch (err) { triggerToast("Deletion failed.", "error"); }
    };

    const executeGlobalReset = async () => {
        setLoading(true);
        try {
            await API.delete('/academic-calendar/actions/reset-year');
            triggerToast("Academic Year Calendar Wiped out! 🧹", "success");
            setShowResetConfirm(false);
            fetchCalendarEvents();
        } catch (err) { triggerToast("Reset failed.", "error"); }
        finally { setLoading(false); }
    };

    // Helper to compare dates strictly
    const parseDateStr = (dateStr) => {
        if (!dateStr) return null;
        const [d, m, y] = dateStr.split('-');
        const dt = new Date(y, m - 1, d);
        dt.setHours(0, 0, 0, 0);
        return dt;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* BASE HEADER */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

                <div className="flex justify-between items-center gap-2 relative z-10">

                    {/* Back Button */}
                    <button
                        onClick={() => {
                            if (viewMode === 'declare') setViewMode('list');
                            else navigate(-1);
                        }}
                        className="p-2 md:p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Center Content */}
                    <div className="text-center absolute left-1/2 -translate-x-1/2">
                        <h1 className="text-4xl md:text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                            {viewMode === 'declare' ? 'New Schedule' : 'Calendar Hub'}
                        </h1>

                        <p className="text-[13px] md:text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-1 whitespace-nowrap">
                            {viewMode === 'declare'
                                ? 'Declare Event Date'
                                : 'Manage Institutional Dates'}
                        </p>
                    </div>

                    {/* Right Icon */}
                    <div className="p-2 md:p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                        <Calendar size={24} />
                    </div>

                </div>
            </div>

            {/* MAIN PORTAL AREA */}
            <div className="px-5 -mt-10 relative z-20 space-y-6 max-w-7xl mx-auto">

                {/* VIEW 1: LIST & TIMELINE LOGS */}
                {viewMode === 'list' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-[2.5rem] shadow-lg border border-[#E2E8F0]">
                            <button onClick={() => setViewMode('declare')} className="w-full sm:w-auto bg-[#42A5F5] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-md">
                                <Plus size={20} /> Declare New Date
                            </button>
                            <button onClick={() => setShowResetConfirm(true)} className="w-full sm:w-auto bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                                <RefreshCw size={18} /> Reset Academic Year
                            </button>
                        </div>

                        <div>
                            <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-slate-500 ml-2 mb-4">Calendar Timeline Logs</h2>

                            {eventsList.length === 0 ? (
                                <div className="bg-white p-12 md:p-20 rounded-[3.5rem] border border-dashed border-slate-300 text-center shadow-sm">
                                    <Calendar size={64} className="text-blue-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold text-[16px] md:text-lg">No calendar schedules declared for this cycle.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {eventsList.map((item) => (
                                        <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2.5rem] shadow-md border border-[#E2E8F0] flex flex-col justify-between hover:shadow-xl transition-all">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className={`w-2 h-full min-h-[4rem] rounded-full ${eventColorMap[item.eventType]?.dot || 'bg-slate-400'} shrink-0`} />
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide leading-tight">{item.title}</h3>
                                                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${eventColorMap[item.eventType]?.badge}`}>
                                                            {item.eventType}
                                                        </span>
                                                    </div>
                                                    <p className="text-[#42A5F5] font-black text-sm mt-2 uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar size={14} /> {item.date}
                                                    </p>
                                                </div>
                                            </div>
                                            {item.description && <p className="text-slate-500 text-sm font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4">{item.description}</p>}
                                            <button onClick={() => handleDeleteEvent(item._id)} className="w-full p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm font-black uppercase text-xs tracking-widest flex justify-center items-center gap-2 mt-auto">
                                                <Trash2 size={16} /> Remove Schedule
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* VIEW 2: FULL PAGE FORM MODAL-FREE VIEW */}
                {viewMode === 'declare' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-[#E2E8F0] relative z-10">
                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                            <div className="p-4 bg-blue-50 rounded-full text-[#42A5F5]">
                                <Calendar size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-wide">Schedule Holidays</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Publish to All Dashboards</p>
                            </div>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-6 md:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                {/* Title Input */}
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-3 block tracking-widest">Event Header Title *</label>
                                    <div className="flex items-center bg-slate-50 border-2 border-slate-200 focus-within:border-[#42A5F5] rounded-3xl p-5 gap-4 transition-all">
                                        <Layers size={20} className="text-[#42A5F5]" />
                                        <input type="text" placeholder="e.g. Winter Vacation" className="bg-transparent w-full font-bold text-lg outline-none text-slate-700" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                </div>

                                {/* Event Category Classification */}
                                <div className="relative" ref={typeRef}>
                                    <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-3 block tracking-widest">Classification Category *</label>
                                    <button type="button" onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} className="w-full flex items-center justify-between bg-slate-50 p-5 border-2 border-slate-200 rounded-3xl font-black text-slate-700 outline-none uppercase text-lg hover:border-[#42A5F5] transition-all">
                                        <span>{formData.eventType || "Select Classification"}</span>
                                        <ChevronDown size={20} className="text-[#42A5F5]" />
                                    </button>
                                    <AnimatePresence>
                                        {isTypeDropdownOpen && (
                                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-50 w-full mt-2 bg-white border-2 border-[#42A5F5] rounded-3xl shadow-2xl p-2">
                                                {['Holiday', 'Exam', 'PTM', 'Event'].map((type) => (
                                                    <button key={type} type="button" onClick={() => { setFormData({ ...formData, eventType: type }); setIsTypeDropdownOpen(false); }} className="w-full text-left px-5 py-4 rounded-2xl font-black text-sm uppercase tracking-wide text-slate-700 hover:bg-blue-50 hover:text-[#42A5F5] transition-all">
                                                        {type}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* DURATION SELECTOR */}
                                <div className="md:col-span-2">
                                    <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-3 block tracking-widest">Duration Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div onClick={() => setDurationMode('single')} className={`cursor-pointer p-4 rounded-2xl border-2 text-center transition-all ${durationMode === 'single' ? 'border-[#42A5F5] bg-blue-50/50 text-[#42A5F5] font-black' : 'border-slate-200 bg-slate-50 text-slate-500 font-bold'}`}>
                                            <span className="text-sm uppercase tracking-widest">Single Day</span>
                                        </div>
                                        <div onClick={() => setDurationMode('multiple')} className={`cursor-pointer p-4 rounded-2xl border-2 text-center transition-all ${durationMode === 'multiple' ? 'border-[#42A5F5] bg-blue-50/50 text-[#42A5F5] font-black' : 'border-slate-200 bg-slate-50 text-slate-500 font-bold'}`}>
                                            <span className="text-sm uppercase tracking-widest">Multiple Days</span>
                                        </div>
                                    </div>
                                </div>

                                {/* TIMELINES RENDERING */}
                                {durationMode === 'single' ? (
                                    /* --- SINGLE CALENDAR INPUT --- */
                                    <div className="relative md:col-span-2 lg:col-span-1" ref={dateRef}>
                                        <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-3 block tracking-widest">Calendar Target Date *</label>
                                        <button type="button" onClick={() => setIsDateCalendarOpen(!isCalendarOpen)} className="w-full bg-slate-50 p-5 rounded-3xl border-2 border-slate-200 hover:border-[#42A5F5] font-black text-slate-700 text-left uppercase text-lg flex items-center justify-between transition-all">
                                            {formData.date || "Choose Date"} <Calendar size={20} className="text-[#42A5F5]" />
                                        </button>
                                        <AnimatePresence>
                                            {isCalendarOpen && (
                                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-50 right-0 min-w-[320px] mt-2 bg-white border-2 border-[#42A5F5] rounded-[2rem] shadow-2xl p-5">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="font-black text-slate-700 p-2 bg-slate-100 rounded-full hover:bg-[#42A5F5] hover:text-white transition-all">←</button>
                                                        <span className="font-black text-[#42A5F5] text-sm uppercase tracking-widest">{viewDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                                                        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="font-black text-slate-700 p-2 bg-slate-100 rounded-full hover:bg-[#42A5F5] hover:text-white transition-all">→</button>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-400 mb-3 uppercase">
                                                        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-2">
                                                        {(() => {
                                                            const year = viewDate.getFullYear(); const month = viewDate.getMonth(); const firstDay = new Date(year, month, 1); const lastDate = new Date(year, month + 1, 0).getDate();
                                                            let startDay = firstDay.getDay(); startDay = startDay === 0 ? 6 : startDay - 1;
                                                            const today = new Date(); today.setHours(0, 0, 0, 0);
                                                            const days = [];
                                                            for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`}></div>);
                                                            for (let d = 1; d <= lastDate; d++) {
                                                                const tempDate = new Date(year, month, d); tempDate.setHours(0, 0, 0, 0);
                                                                const isPast = tempDate < today;
                                                                const formattedVal = tempDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                                                                days.push(
                                                                    <button type="button" key={d} disabled={isPast} onClick={() => { if (!isPast) { setFormData({ ...formData, date: formattedVal }); setIsDateCalendarOpen(false); } }} className={`p-3 rounded-2xl text-sm font-black transition-all ${isPast ? "opacity-20 cursor-not-allowed bg-slate-50 text-slate-300" : "text-slate-700 hover:bg-[#42A5F5] hover:text-white shadow-sm"}`}>
                                                                        {d}
                                                                    </button>
                                                                );
                                                            }
                                                            return days;
                                                        })()}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    /* --- MULTIPLE CALENDARS (WITH SMART EXCLUSION LOGIC) --- */
                                    <>
                                        {/* From Date Calendar (Blocks dates >= To Date) */}
                                        <div className="relative" ref={fromDateRef}>
                                            <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-3 block tracking-widest">From Date *</label>
                                            <button type="button" onClick={() => setIsFromCalendarOpen(!isFromCalendarOpen)} className="w-full bg-slate-50 p-5 rounded-3xl border-2 border-slate-200 hover:border-[#42A5F5] font-black text-slate-700 text-left uppercase text-lg flex items-center justify-between transition-all">
                                                {formData.fromDate || "Start Date"} <Calendar size={20} className="text-[#42A5F5]" />
                                            </button>
                                            <AnimatePresence>
                                                {isFromCalendarOpen && (
                                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-50 right-0 min-w-[320px] mt-2 bg-white border-2 border-[#42A5F5] rounded-[2rem] shadow-2xl p-5">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="font-black text-slate-700 p-2 bg-slate-100 rounded-full hover:bg-[#42A5F5] hover:text-white transition-all">←</button>
                                                            <span className="font-black text-[#42A5F5] text-sm uppercase tracking-widest">{viewDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                                                            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="font-black text-slate-700 p-2 bg-slate-100 rounded-full hover:bg-[#42A5F5] hover:text-white transition-all">→</button>
                                                        </div>
                                                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-400 mb-3 uppercase">
                                                            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                                        </div>
                                                        <div className="grid grid-cols-7 gap-2">
                                                            {(() => {
                                                                const year = viewDate.getFullYear(); const month = viewDate.getMonth(); const firstDay = new Date(year, month, 1); const lastDate = new Date(year, month + 1, 0).getDate();
                                                                let startDay = firstDay.getDay(); startDay = startDay === 0 ? 6 : startDay - 1;
                                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                                const toD = parseDateStr(formData.toDate);

                                                                const days = [];
                                                                for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`}></div>);
                                                                for (let d = 1; d <= lastDate; d++) {
                                                                    const tempDate = new Date(year, month, d); tempDate.setHours(0, 0, 0, 0);
                                                                    // Validation: Block past dates OR dates that are on/after To Date
                                                                    const isDisabled = tempDate < today || (toD && tempDate >= toD);
                                                                    const formattedVal = tempDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                                                                    days.push(
                                                                        <button type="button" key={d} disabled={isDisabled} onClick={() => { if (!isDisabled) { setFormData({ ...formData, fromDate: formattedVal }); setIsFromCalendarOpen(false); } }} className={`p-3 rounded-2xl text-sm font-black transition-all ${isDisabled ? "opacity-20 cursor-not-allowed bg-slate-50 text-slate-300" : "text-slate-700 hover:bg-[#42A5F5] hover:text-white shadow-sm"}`}>
                                                                            {d}
                                                                        </button>
                                                                    );
                                                                }
                                                                return days;
                                                            })()}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* To Date Calendar (Blocks dates <= From Date) */}
                                        <div className="relative" ref={toDateRef}>
                                            <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-3 block tracking-widest">To Date *</label>
                                            <button type="button" onClick={() => setIsToCalendarOpen(!isToCalendarOpen)} className="w-full bg-slate-50 p-5 rounded-3xl border-2 border-slate-200 hover:border-[#42A5F5] font-black text-slate-700 text-left uppercase text-lg flex items-center justify-between transition-all">
                                                {formData.toDate || "End Date"} <Calendar size={20} className="text-[#42A5F5]" />
                                            </button>
                                            <AnimatePresence>
                                                {isToCalendarOpen && (
                                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-50 right-0 min-w-[320px] mt-2 bg-white border-2 border-[#42A5F5] rounded-[2rem] shadow-2xl p-5">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="font-black text-slate-700 p-2 bg-slate-100 rounded-full hover:bg-[#42A5F5] hover:text-white transition-all">←</button>
                                                            <span className="font-black text-[#42A5F5] text-sm uppercase tracking-widest">{viewDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                                                            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="font-black text-slate-700 p-2 bg-slate-100 rounded-full hover:bg-[#42A5F5] hover:text-white transition-all">→</button>
                                                        </div>
                                                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-400 mb-3 uppercase">
                                                            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                                                        </div>
                                                        <div className="grid grid-cols-7 gap-2">
                                                            {(() => {
                                                                const year = viewDate.getFullYear(); const month = viewDate.getMonth(); const firstDay = new Date(year, month, 1); const lastDate = new Date(year, month + 1, 0).getDate();
                                                                let startDay = firstDay.getDay(); startDay = startDay === 0 ? 6 : startDay - 1;
                                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                                const fromD = parseDateStr(formData.fromDate);

                                                                const days = [];
                                                                for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`}></div>);
                                                                for (let d = 1; d <= lastDate; d++) {
                                                                    const tempDate = new Date(year, month, d); tempDate.setHours(0, 0, 0, 0);
                                                                    // Validation: Block past dates OR dates that are on/before From Date
                                                                    const isDisabled = tempDate < today || (fromD && tempDate <= fromD);
                                                                    const formattedVal = tempDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                                                                    days.push(
                                                                        <button type="button" key={d} disabled={isDisabled} onClick={() => { if (!isDisabled) { setFormData({ ...formData, toDate: formattedVal }); setIsToCalendarOpen(false); } }} className={`p-3 rounded-2xl text-sm font-black transition-all ${isDisabled ? "opacity-20 cursor-not-allowed bg-slate-50 text-slate-300" : "text-slate-700 hover:bg-[#42A5F5] hover:text-white shadow-sm"}`}>
                                                                            {d}
                                                                        </button>
                                                                    );
                                                                }
                                                                return days;
                                                            })()}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-3 block tracking-widest">Context Description (Optional)</label>
                                <div className="flex items-start bg-slate-50 border-2 border-slate-200 focus-within:border-[#42A5F5] rounded-3xl p-5 gap-4 transition-all">
                                    <Text size={20} className="text-[#42A5F5] mt-1" />
                                    <textarea rows="4" placeholder="Add detailed schedule instructions, timings, or prerequisites here..." className="bg-transparent w-full font-bold outline-none text-slate-700 resize-none text-lg leading-relaxed" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full md:w-auto md:min-w-[300px] ml-auto bg-[#42A5F5] text-white py-5 px-10 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-600 active:scale-95 transition-all border-b-4 border-blue-700 flex justify-center items-center mt-4">
                                {loading ? <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span> : "Broadcast Event"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </div>

            {/* --- GLOBAL RESET CONFIRMATION MODAL --- */}
            <AnimatePresence>
                {showResetConfirm && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResetConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-10 shadow-2xl relative z-10 text-center border-4 border-red-50">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <AlertTriangle size={36} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-3 uppercase tracking-wide">Danger Zone</h2>
                            <p className="text-slate-500 font-bold text-[15px] mb-8 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                Wipe out the entire institutional academic calendar? All holidays, exams, and matching logs will be permanently deleted!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={executeGlobalReset} disabled={loading} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 shadow-lg border-b-4 border-red-700 flex justify-center items-center transition-all">
                                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Wipe All"}
                                </button>
                                <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminAcademicCalendar;
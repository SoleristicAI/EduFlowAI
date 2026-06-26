import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, FileText, Upload, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';

const LeaveRequest = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        leaveType: 'One Day',
        fromDate: new Date().toISOString().split('T')[0],
        toDate: '',
        reason: '',
        document: null
    });
    const [docType, setDocType] = useState('Leave Application');
    const today = new Date().toISOString().split('T')[0];
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState(null);
    const dateRef = useRef(null);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [isFromDateOpen, setIsFromDateOpen] = useState(false);
    const [isToDateOpen, setIsToDateOpen] = useState(false);
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);
    const [isReasonOpen, setIsReasonOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const reasonRef = useRef(null);

    const getLocalDate = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const displayDate = (date) => {
        const [year, month, day] = date.split("-");
        const d = new Date(year, month - 1, day);

        return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };
    // --- Reason-based Document Type Logic ---
    useEffect(() => {
        // Sick Leave ya Medical Leave dono ke liye Lab Report dikha
        if (formData.reason === 'Sick Leave' || formData.reason === 'Medical Leave' || formData.reason === 'Medical Checkup') {
            setDocType('Lab Report');
        } else {
            setDocType('Leave Application');
        }
    }, [formData.reason]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateRef.current && !dateRef.current.contains(event.target)) {
                setIsDateOpen(false);
            }

            if (reasonRef.current && !reasonRef.current.contains(event.target)) {
                setIsReasonOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateRef.current && !dateRef.current.contains(event.target)) {
                setIsDateOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.reason) {
            alert("Please select a reason!");
            return;
        }
        if (!formData.document) {
            alert("Please upload document!");
            return;
        }

        setIsProcessing(true);

        const data = new FormData();
        data.append("leaveType", formData.leaveType);
        data.append("fromDate", formData.fromDate);
        // Yahan check kar: Multiple days hai toh toDate bhej
        data.append("toDate", formData.leaveType === "Multiple Days" ? formData.toDate : formData.fromDate);
        data.append("reason", formData.reason); // Yeh ab confirm empty nahi jayega
        data.append("documentType", docType);
        data.append("document", formData.document); // File yahan append hogi

        try {
            await API.post("/leaves/apply", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setToast({ show: true, message: "Request Submitted Successfully! 🛡️", type: 'success' });
            setFormData({ leaveType: 'One Day', fromDate: new Date().toISOString().split('T')[0], toDate: '', reason: '', document: null });
            setPreview(null);

        } catch (err) {
            setToast({ show: true, message: "Submission failed! Try again.", type: 'error' });
        } finally {
            setIsProcessing(false);
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {/* Header - Wahi blue theme */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden mb-8">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

                {/* Top Row */}
                <div className="relative z-10 flex justify-between items-center">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Right Icon */}
                    <div className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                        <FileText size={24} />
                    </div>
                </div>

                {/* Heading + Subtitle */}
                <div className="relative z-10 text-center mt-4">
                    <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                        Leave Request
                    </h1>

                    <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-2 whitespace-nowrap">
                        Submit Official Application
                    </p>
                </div>

                {/* History Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/student/leave-history');
                    }}
                    className="relative z-10 w-full mt-6 py-5 bg-white text-[#42A5F5] font-black text-[14px] uppercase tracking-widest rounded-[2.5rem] shadow-lg transition-all active:scale-95"
                >
                    View My Leave History
                </button>

            </div>
            <motion.form
                layout
                onSubmit={handleSubmit}
                className="relative z-20 px-8 -mt-24 space-y-8 max-w-lg mx-auto"
            >
                {/* Leave Type Toggle */}
                <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-[2.5rem] shadow-sm border border-[#DDE3EA]">
                    {['One Day', 'Multiple Days'].map(type => (
                        <button key={type} type="button"
                            onClick={() => setFormData({ ...formData, leaveType: type })}
                            className={`p-5 rounded-[2rem] font-black uppercase text-[14px] tracking-widest transition-all ${formData.leaveType === type ? 'bg-[#42A5F5] text-white shadow-lg' : 'text-slate-400'}`}>
                            {type}
                        </button>
                    ))}
                </div>

                <div className="bg-white p-8 rounded-[3.5rem] border border-[#DDE3EA] shadow-sm space-y-6">

                    {/* ONE DAY */}
                    <AnimatePresence mode="wait">
                        {formData.leaveType === "One Day" ? (
                            <motion.div
                                key="one-day"
                                initial={{ opacity: 0, x: -25 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 25 }}
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                            >
                                <div ref={dateRef} className="relative">
                                    <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-3 block">
                                        Date
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => setIsDateOpen(!isDateOpen)}
                                        className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center font-black text-[16px]"
                                    >
                                        {displayDate(formData.fromDate)}
                                        <ChevronDown
                                            size={18}
                                            className={`transition-transform duration-300 ${isDateOpen ? "rotate-180" : "rotate-0"
                                                }`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isDateOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-50 w-full mt-3 bg-white border border-[#DDE3EA] rounded-[2.5rem] shadow-2xl p-5"
                                            >
                                                <div className="flex justify-between items-center mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                                                        }
                                                    >
                                                        ←
                                                    </button>

                                                    <span className="font-black text-[#42A5F5]">
                                                        {viewDate.toLocaleDateString("en-GB", {
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                                                        }
                                                    >
                                                        →
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-bold text-slate-400 mb-2">
                                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                                                        <span key={d}>{d}</span>
                                                    ))}
                                                </div>

                                                {(() => {
                                                    const year = viewDate.getFullYear();
                                                    const month = viewDate.getMonth();
                                                    const firstDay = new Date(year, month, 1);
                                                    const lastDate = new Date(year, month + 1, 0).getDate();

                                                    let startDay = firstDay.getDay();
                                                    startDay = startDay === 0 ? 6 : startDay - 1;

                                                    const days = [];

                                                    for (let i = 0; i < startDay; i++) {
                                                        days.push(<div key={i}></div>);
                                                    }

                                                    for (let day = 1; day <= lastDate; day++) {
                                                        const tempDate = new Date(year, month, day);
                                                        const formatted = formatDate(tempDate);

                                                        const current = new Date();
                                                        current.setHours(0, 0, 0, 0);

                                                        const temp = new Date(year, month, day);
                                                        temp.setHours(0, 0, 0, 0);

                                                        const isPast = temp < current;
                                                        const isSelected = formatted === formData.fromDate;

                                                        days.push(
                                                            <button
                                                                type="button"
                                                                key={`${year}-${month}-${day}`}
                                                                disabled={isPast}
                                                                onClick={() => {
                                                                    if (isPast) return;

                                                                    setFormData({
                                                                        ...formData,
                                                                        fromDate: formatted
                                                                    });
                                                                    setIsDateOpen(false);
                                                                }}
                                                                className={`p-2 rounded-xl text-[13px] font-black
        ${isSelected ? 'bg-blue-500 text-white' : 'text-slate-600'}
        ${isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-blue-100'}
    `}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    }

                                                    return <div className="grid grid-cols-7 gap-2">{days}</div>;
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                            </motion.div>
                        ) : (
                            <motion.div
                                key="multiple-days"
                                initial={{ opacity: 0, x: 25 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -25 }}
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                                className="space-y-6"
                            >
                                <div ref={fromDateRef} className="relative">
                                    <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-3 block">
                                        From Date
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsFromDateOpen(!isFromDateOpen);
                                            setIsToDateOpen(false);
                                        }}
                                        className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center font-black text-[16px]"
                                    >
                                        {displayDate(formData.fromDate)}
                                        <ChevronDown
                                            size={18}
                                            className={`transition-transform duration-300 ${isFromDateOpen ? "rotate-180" : "rotate-0"
                                                }`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isFromDateOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-50 w-full mt-3 bg-white border border-[#DDE3EA] rounded-[2.5rem] shadow-2xl p-5"
                                            >
                                                <div className="flex justify-between items-center mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                                                        }
                                                    >
                                                        ←
                                                    </button>

                                                    <span className="font-black text-[#42A5F5]">
                                                        {viewDate.toLocaleDateString("en-GB", {
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                                                        }
                                                    >
                                                        →
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-bold text-slate-400 mb-2">
                                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                                                        <span key={d}>{d}</span>
                                                    ))}
                                                </div>
                                                {(() => {
                                                    const year = viewDate.getFullYear();
                                                    const month = viewDate.getMonth();
                                                    const firstDay = new Date(year, month, 1);
                                                    const lastDate = new Date(year, month + 1, 0).getDate();

                                                    let startDay = firstDay.getDay();
                                                    startDay = startDay === 0 ? 6 : startDay - 1;

                                                    const days = [];

                                                    for (let i = 0; i < startDay; i++) {
                                                        days.push(<div key={`from-empty-${i}`}></div>);
                                                    }

                                                    for (let day = 1; day <= lastDate; day++) {
                                                        const tempDate = new Date(year, month, day);
                                                        const formatted = formatDate(tempDate);

                                                        const current = new Date();
                                                        current.setHours(0, 0, 0, 0);

                                                        const temp = new Date(year, month, day);
                                                        temp.setHours(0, 0, 0, 0);

                                                        const isPast = temp < current;
                                                        const isSelected = formatted === formData.fromDate;

                                                        days.push(
                                                            <button
                                                                type="button"
                                                                key={`from-${year}-${month}-${day}`}
                                                                disabled={isPast}
                                                                onClick={() => {
                                                                    if (isPast) return;

                                                                    setFormData({
                                                                        ...formData,
                                                                        fromDate: formatted
                                                                    });
                                                                    setIsFromDateOpen(false);
                                                                }}
                                                                className={`p-2 rounded-xl text-[13px] font-black
        ${isSelected ? "bg-blue-500 text-white" : "text-slate-600"}
        ${isPast ? "opacity-20 cursor-not-allowed" : "hover:bg-blue-100"}
    `}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    }

                                                    return <div className="grid grid-cols-7 gap-2">{days}</div>;
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div ref={toDateRef} className="relative">
                                    <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-3 block">
                                        To Date
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsToDateOpen(!isToDateOpen);
                                            setIsFromDateOpen(false);
                                        }}
                                        className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center font-black text-[16px]"
                                    >
                                        {formData.toDate ? displayDate(formData.toDate) : "Select Date"}
                                        <ChevronDown
                                            size={18}
                                            className={`transition-transform duration-300 ${isToDateOpen ? "rotate-180" : "rotate-0"
                                                }`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isToDateOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-50 w-full mt-3 bg-white border border-[#DDE3EA] rounded-[2.5rem] shadow-2xl p-5"
                                            >

                                                <div className="flex justify-between items-center mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                                                        }
                                                    >
                                                        ←
                                                    </button>

                                                    <span className="font-black text-[#42A5F5]">
                                                        {viewDate.toLocaleDateString("en-GB", {
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                                                        }
                                                    >
                                                        →
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-bold text-slate-400 mb-2">
                                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                                                        <span key={d}>{d}</span>
                                                    ))}
                                                </div>
                                                {(() => {
                                                    const year = viewDate.getFullYear();
                                                    const month = viewDate.getMonth();
                                                    const firstDay = new Date(year, month, 1);
                                                    const lastDate = new Date(year, month + 1, 0).getDate();

                                                    let startDay = firstDay.getDay();
                                                    startDay = startDay === 0 ? 6 : startDay - 1;

                                                    const days = [];

                                                    for (let i = 0; i < startDay; i++) {
                                                        days.push(<div key={`to-empty-${i}`}></div>);
                                                    }

                                                    for (let day = 1; day <= lastDate; day++) {
                                                        const tempDate = new Date(year, month, day);
                                                        const formatted = formatDate(tempDate);
                                                        const isSelected = formatted === formData.toDate;
                                                        const isPast = formatted < today;
                                                        const isBeforeFrom = formatted < formData.fromDate;

                                                        days.push(
                                                            <button
                                                                type="button"
                                                                key={`to-${year}-${month}-${day}`}
                                                                disabled={isPast || isBeforeFrom}
                                                                onClick={() => {
                                                                    if (isPast || isBeforeFrom) return;

                                                                    setFormData({
                                                                        ...formData,
                                                                        toDate: formatted
                                                                    });
                                                                    setIsToDateOpen(false);
                                                                }}
                                                                className={`p-2 rounded-xl text-[13px] font-black
        ${isSelected ? "bg-blue-500 text-white" : "text-slate-600"}
        ${(isPast || isBeforeFrom)
                                                                        ? "opacity-20 cursor-not-allowed"
                                                                        : "hover:bg-blue-100"}
    `}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    }

                                                    return <div className="grid grid-cols-7 gap-2">{days}</div>;
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}


                    </AnimatePresence>
                </div>

                {/* Reason Dropdown */}
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    ref={reasonRef}
                    className="bg-white p-8 rounded-[3.5rem] border border-[#DDE3EA] shadow-sm relative"
                >
                    <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-3 block">
                        Select Reason
                    </label>

                    <button
                        type="button"
                        onClick={() => setIsReasonOpen(!isReasonOpen)}
                        className="w-full p-6 rounded-[2rem] bg-slate-50 border border-slate-100 font-black text-[16px] flex justify-between items-center italic"
                    >
                        {formData.reason || "Choose"}
                        <ChevronDown
                            size={18}
                            className={`transition-transform duration-300 ${isReasonOpen ? "rotate-180" : "rotate-0"
                                }`}
                        />
                    </button>

                    <AnimatePresence>
                        {isReasonOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 w-full mt-3 left-0 bg-white border border-[#DDE3EA] rounded-[2.5rem] shadow-2xl p-3 max-h-[250px] overflow-y-auto scrollbar-hide"
                            >
                                {[
                                    "Sick Leave",
                                    "Medical Leave",
                                    "Family Function",
                                    "Personal Work",
                                    "Emergency Leave",
                                    "Exam Preparation",
                                    "Other"
                                ].map((reason) => (
                                    <button
                                        key={reason}
                                        type="button"
                                        onClick={() => {
                                            // Yahan `setFormData` mein ...formData use karna zaroori hai
                                            setFormData(prev => ({
                                                ...prev,
                                                reason: reason // Yahan 'reason' wo variable hai jo map mein mil raha hai
                                            }));
                                            setIsReasonOpen(false);
                                        }}
                                        className={`w-full text-left p-4 rounded-2xl font-black text-[16px] transition-all
                            ${formData.reason === reason
                                                ? "bg-blue-500 text-white"
                                                : "hover:bg-blue-50 text-slate-700"
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Upload Section */}
                <div className="bg-white p-8 rounded-[3.5rem] border border-[#DDE3EA] shadow-sm text-center">
                    <p className="font-black text-[#42A5F5] uppercase tracking-widest text-[15px] mb-6">{docType}</p>
                    {!preview ? (
                        <label className="flex flex-col items-center justify-center w-full p-10 border-2 border-dashed border-blue-100 rounded-[2.5rem] bg-blue-50/30 cursor-pointer">
                            <Upload className="text-[#42A5F5] mb-3" size={32} />
                            <span className="text-[16px] font-black text-[#42A5F5]">Upload Document</span>
                            <input type="file" hidden onChange={e => { setFormData({ ...formData, document: e.target.files[0] }); setPreview(URL.createObjectURL(e.target.files[0])) }} />
                        </label>
                    ) : (
                        <div className="relative">
                            <FileText size={40} className="mx-auto text-[#42A5F5] mb-2" />
                            <p className="font-black text-emerald-500 text-[16px]">Document Attached</p>
                            <button type="button" onClick={() => { setPreview(null); setFormData({ ...formData, document: null }) }} className="absolute -top-4 -right-4 p-2 bg-rose-500 text-white rounded-full"><X size={16} /></button>
                        </div>
                    )}
                </div>

                <button
                    disabled={isProcessing || !formData.reason || !formData.document}
                    className={`w-full py-7 font-black text-[16px] uppercase tracking-widest rounded-[2.5rem] shadow-xl transition-all 
    ${(!formData.reason || !formData.document) ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#42A5F5] text-white shadow-blue-200 active:scale-95'}`}
                >
                    {isProcessing ? 'Uploading...' : 'Submit Request'}
                </button>
            </motion.form>

            {/* --- NEURAL TOAST OVERLAY --- */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 40, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className={`fixed top-0 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl font-black text-[13px] shadow-2xl flex items-center gap-3 italic ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeaveRequest;
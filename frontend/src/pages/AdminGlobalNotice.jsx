import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Users, GraduationCap, Globe, Check, Plus, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

const AdminGlobalNotice = () => {
    const navigate = useNavigate();
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Naya state: Confirmation Modal ke liye
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Meta Data States
    const [availableClasses, setAvailableClasses] = useState([]);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        audience: 'all',
        targetGrade: [],
        targetTeachers: []
    });

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [classRes, teacherRes] = await Promise.all([
                    API.get('/notices/meta/classes'),
                    API.get('/notices/meta/teachers')
                ]);
                setAvailableClasses(classRes.data);
                setAvailableTeachers(teacherRes.data);
            } catch (err) { console.error("Meta Sync Error"); }
        };
        fetchMeta();
    }, []);

    const toggleGrade = (grade) => {
        setFormData(prev => ({
            ...prev,
            targetGrade: prev.targetGrade.includes(grade)
                ? prev.targetGrade.filter(g => g !== grade)
                : [...prev.targetGrade, grade]
        }));
    };

    // Step 1: Form Validation & Trigger Modal
    const handleInitialSubmit = (e) => {
        e.preventDefault();
        if (formData.audience === 'specific_grade' && formData.targetGrade.length === 0) {
            return alert("Neural Link Error: Please select at least one class.");
        }
        setShowConfirmation(true); // Direct submit ki jagah modal open hoga
    };

    // Step 2: Final Broadcast after confirmation
    const confirmBroadcast = async () => {
        setShowConfirmation(false);
        setLoading(true);
        try {
            let finalTargetGrade = formData.targetGrade;
            
            if (formData.audience === 'specific_grade') {
                if (formData.targetGrade.length === availableClasses.length) {
                    finalTargetGrade = "All"; 
                }
            } else {
                finalTargetGrade = "All"; 
            }

            await API.post('/notices/create', {
                ...formData,
                targetGrade: finalTargetGrade
            });

            setShowToast(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            alert(err.response?.data?.message || "Notice Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            {showToast && <Toast message="Notice deployed successfully! 🚀" type="success" onClose={() => setShowToast(false)} />}

            {/* --- CONFIRMATION MODAL (GLASSMORPHISM) --- */}
            <AnimatePresence>
                {showConfirmation && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center px-5 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 max-w-sm w-full text-center relative"
                        >
                            <button 
                                onClick={() => setShowConfirmation(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
                                <AlertTriangle size={36} className="text-amber-500 animate-pulse" />
                            </div>
                            
                            <h3 className="text-2xl font-black uppercase text-slate-800 italic tracking-tight mb-2">Confirm Broadcast</h3>
                            <p className="text-[15px] font-bold text-slate-500 mb-8 px-2">
                                You are about to send this notice to <span className="text-[#42A5F5] uppercase">
                                    {formData.audience === 'all' ? 'Everyone' : formData.audience === 'teachers' ? 'All Staff' : 'Selected Classes'}
                                </span>. This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowConfirmation(false)}
                                    className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-[14px] hover:bg-slate-100 transition-colors"
                                >
                                    Review
                                </button>
                                <button 
                                    onClick={confirmBroadcast}
                                    className="flex-1 py-4 bg-[#42A5F5] text-white rounded-2xl font-black uppercase text-[14px] shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    Deploy <Send size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative overflow-visible text-center">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic flex items-center justify-center gap-3 px-16 leading-tight">
                    School Notice
                </h1>
                <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Communication center</p>
            </div>

            <div className="px-5 -mt-12 relative z-20">
                <form onSubmit={handleInitialSubmit} className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8 ring-1 ring-slate-50">
                    
                    {/* LayoutGroup helps animate height changes smoothly */}
                    <LayoutGroup>
                        {/* Audience Selector */}
                        <motion.div layout className="space-y-4">
                            <label className="text-[17px] font-black text-slate-800 uppercase ml-2 tracking-widest italic flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#42A5F5]"></div>
                                Target Audience
                            </label>
                            
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'all', label: 'All', icon: <Globe size={24} /> },
                                    { id: 'teachers', label: 'Staff', icon: <Users size={24} /> },
                                    { id: 'specific_grade', label: 'Class', icon: <GraduationCap size={24} /> }
                                ].map((opt) => (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, audience: opt.id });
                                            setIsClassMenuOpen(false); // Close dropdown if open
                                        }}
                                        className={`py-5 rounded-3xl flex flex-col items-center gap-2 border transition-all duration-300 ${formData.audience === opt.id ? 'bg-[#42A5F5] text-white border-[#42A5F5] shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-slate-600'}`}
                                    >
                                        {opt.icon}
                                        <span className="text-[15px] font-black uppercase">{opt.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Multi-Class Selection UI (Smooth Reveal) */}
                        <AnimatePresence mode="popLayout">
                            {formData.audience === 'specific_grade' && (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                    transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
                                    className="space-y-3 relative bg-blue-50/30 p-5 rounded-[2.5rem] border border-blue-50"
                                >
                                    <label className="text-[15px] font-black text-[#42A5F5] uppercase ml-2 tracking-widest italic">
                                        Select Target Classes
                                    </label>

                                    {/* Dropdown Trigger */}
                                    <div
                                        onClick={() => setIsClassMenuOpen(!isClassMenuOpen)}
                                        className="w-full p-5 bg-white rounded-[2rem] border border-blue-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all shadow-sm hover:border-[#42A5F5]"
                                    >
                                        <div className="flex flex-wrap gap-2 overflow-hidden max-h-8">
                                            {formData.targetGrade.length === 0 ? (
                                                <span className="text-[17px] font-bold text-slate-400 italic uppercase">Choose Classes...</span>
                                            ) : (
                                                <span className="text-[17px] font-black text-[#42A5F5] italic uppercase">
                                                    {formData.targetGrade.length === availableClasses.length
                                                        ? "All classes selected"
                                                        : `${formData.targetGrade.length} classes selected`}
                                                </span>
                                            )}
                                        </div>
                                        <Plus size={20} className={`text-[#42A5F5] transition-transform duration-300 ${isClassMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
                                    </div>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {isClassMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-[130]" onClick={() => setIsClassMenuOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute left-0 right-0 top-[105%] z-[140] bg-white border border-blue-100 rounded-[2.5rem] shadow-2xl overflow-hidden ring-4 ring-blue-50"
                                                >
                                                    <div
                                                        onClick={() => {
                                                            if (formData.targetGrade.length === availableClasses.length) {
                                                                setFormData({ ...formData, targetGrade: [] });
                                                            } else {
                                                                setFormData({ ...formData, targetGrade: availableClasses });
                                                            }
                                                        }}
                                                        className="p-5 bg-blue-50/50 flex items-center justify-between border-b border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                                                    >
                                                        <span className="text-[16px] font-black text-[#42A5F5] uppercase italic">Select all Classes</span>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.targetGrade.length === availableClasses.length ? 'bg-[#42A5F5] border-[#42A5F5]' : 'border-slate-300'}`}>
                                                            {formData.targetGrade.length === availableClasses.length && <Check size={14} className="text-white" />}
                                                        </div>
                                                    </div>

                                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                        {availableClasses.map((cls) => (
                                                            <div
                                                                key={cls}
                                                                onClick={() => toggleGrade(cls)}
                                                                className="p-5 flex items-center justify-between border-b border-slate-50 last:border-none cursor-pointer hover:bg-slate-50 transition-all"
                                                            >
                                                                <span className={`text-[16px] font-bold uppercase italic ${formData.targetGrade.includes(cls) ? 'text-[#42A5F5]' : 'text-slate-600'}`}>
                                                                    {cls}
                                                                </span>
                                                                {formData.targetGrade.includes(cls) && <Check size={18} className="text-[#42A5F5]" />}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div
                                                        onClick={() => setIsClassMenuOpen(false)}
                                                        className="p-5 bg-slate-800 text-white text-center text-[13px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-700 transition-colors"
                                                    >
                                                        Confirm Selection
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Broadcast Inputs */}
                        <motion.div layout className="space-y-6 pt-2">
                            <div className="space-y-3">
                                <label className="text-[17px] font-black text-slate-800 uppercase ml-2 tracking-widest italic flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                    Notice Details
                                </label>
                                <input
                                    type="text"
                                    placeholder="Notice Title (e.g. URGENT: HOLIDAY)"
                                    className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-200 outline-none text-[18px] font-bold text-slate-700 focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 focus:bg-white italic transition-all shadow-inner"
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <textarea
                                    rows="5"
                                    placeholder="Type the full announcement message here..."
                                    className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-200 outline-none text-[18px] font-bold text-slate-700 focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 focus:bg-white italic leading-relaxed transition-all shadow-inner resize-none"
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.button
                            layout
                            disabled={loading}
                            className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-[16px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 italic ${loading ? 'bg-slate-300 text-slate-500 shadow-none' : 'bg-[#42A5F5] text-white shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-1 active:translate-y-0'}`}
                        >
                            {loading ? "Processing..." : "Review & Publish"}
                        </motion.button>
                    </LayoutGroup>
                </form>
            </div>
        </div>
    );
};

export default AdminGlobalNotice;
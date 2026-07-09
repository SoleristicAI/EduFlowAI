import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Users, ChevronDown, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

const TeacherNotices = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [classes, setClasses] = useState([]);
    const [isClassOpen, setIsClassOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        audience: 'specific_grade',
        targetGrade: ''
    });

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const { data } = await API.get('/notices/meta/classes');
                setClasses(data);
            } catch (err) {
                console.error("Meta Fetch Error:", err);
            }
        };
        fetchClasses();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.targetGrade) return alert("Please select a target class!");

        setLoading(true);
        try {
            await API.post('/notices/create', {
                ...formData,
                targetGrade: formData.targetGrade
            });
            setShowToast(true);
            setTimeout(() => navigate('/teacher/dashboard'), 2000);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to post notice.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {showToast && <Toast message="Class broadcast successful! 📡" type="success" onClose={() => setShowToast(false)} />}

            {/* Header Section */}
            <div className="bg-[#42A5F5] px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible">
                <div className="flex justify-between items-center relative z-10">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-md active:scale-95 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Center Title */}
                    <div className="text-center">
                        <h1 className="text-4xl font-black italic tracking-tight text-white capitalize">
                            Class Updates
                        </h1>

                        <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-80 mt-1">
                            Send Messages To Students
                        </p>
                    </div>

                    {/* Right Icon */}
                    <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm">
                        <Megaphone size={24} />
                    </div>

                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-[#DDE3EA] space-y-8">

                    {/* Target Sector Dropdown */}
                    {/* --- PREMIUM CLASS SELECTOR NODE --- */}
                    <div>
                        <label className="text-[15px] font-black text-slate-600 uppercase ml-2 mb-3 block tracking-widest italic">Class :</label>
                        <div className="relative">

                            {/* Dropdown Trigger Button */}
                            <button
                                type="button"
                                onClick={() => setIsClassOpen(!isClassOpen)}
                                className={`w-full flex items-center justify-between bg-slate-50 p-5 rounded-2xl border transition-all active:scale-[0.98] ${isClassOpen ? 'border-[#42A5F5] bg-white shadow-lg shadow-blue-50' : 'border-slate-600'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <Users size={24} className={formData.targetGrade ? "text-[#42A5F5]" : "text-slate-600"} />
                                    <span className={`text-[18px] font-bold italic ${formData.targetGrade ? 'text-slate-700' : 'text-slate-600'}`}>
                                        {formData.targetGrade || "Select class"}
                                    </span>
                                </div>
                                <ChevronDown size={20} className={`text-slate-600 transition-transform duration-300 ${isClassOpen ? 'rotate-180 text-[#42A5F5]' : ''}`} />
                            </button>

                            {/* Smooth Animated List */}
                            <AnimatePresence>
                                {isClassOpen && (
                                    <>
                                        {/* Backdrop to close on outside click */}
                                        <div className="fixed inset-0 z-[40]" onClick={() => setIsClassOpen(false)} />

                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute w-full mt-3 z-[50] bg-white border border-blue-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden"
                                        >
                                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-3">
                                                {classes.length > 0 ? (
                                                    classes.map((cls, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, targetGrade: cls });
                                                                setIsClassOpen(false);
                                                            }}
                                                            className={`w-full text-left p-5 rounded-2xl text-[16px] font-black italic transition-all mb-1 last:mb-0 flex items-center justify-between group ${formData.targetGrade === cls ? 'bg-blue-50 text-[#42A5F5]' : 'text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            <span>Class {cls}</span>
                                                            {formData.targetGrade === cls && (
                                                                <div className="w-2 h-2 bg-[#42A5F5] rounded-full shadow-[0_0_10px_rgba(66,165,245,0.5)]" />
                                                            )}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-10 text-center text-slate-300 italic font-bold">
                                                        No active sectors found
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Signal Subject Input */}
                    <div>
                        <label className="text-[15px] font-black text-slate-600 uppercase ml-2 mb-3 block tracking-widest italic">Subject :</label>
                        <input
                            type="text"
                            placeholder="e.g. Updates"
                            className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-900 text-[20px] font-bold text-slate-700 outline-none focus:border-[#42A5F5] focus:bg-white transition-all italic capitalize"
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    {/* Neural Payload Textarea */}
                    <div>
                        <label className="text-[15px] font-black text-slate-600 uppercase ml-2 mb-3 block tracking-widest italic">Details of the notice :</label>
                        <textarea
                            placeholder="Write your details here..."
                            className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-900 text-[20px] font-bold text-slate-800 h-40 outline-none focus:border-[#42A5F5] focus:bg-white transition-all italic placeholder:text-slate-300"
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#42A5F5] text-white py-6 rounded-[2.5rem] font-black uppercase text-[14px] tracking-[0.2em] shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all italic border-b-4 border-blue-700"
                    >
                        {loading ? "Transmitting..." : <><Send size={22} /> Notify Students</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TeacherNotices;
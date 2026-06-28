import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Star, UserCircle, CheckCircle, ChevronDown, Lock, ShieldCheck, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

const StudentFeedback = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });
    const [studentProfile, setStudentProfile] = useState(null);

    const [activeSessions, setActiveSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const [teachers, setTeachers] = useState([]);
    // format: { "EMP123": { rating: 4, comment: "Good teacher" } }
    const [evaluations, setEvaluations] = useState({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setStudentProfile(JSON.parse(userStr));
        fetchActiveSessions();
    }, []);

    const triggerToast = (message, type = "success") => {
        setShowToast({ show: true, message, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const fetchActiveSessions = async () => {
        try {
            const { data } = await API.get('/feedback/active-sessions');
            setActiveSessions(data);
        } catch (err) { console.error(err); }
    };

    // When session is selected, check if already submitted
    useEffect(() => {
        if (!selectedSessionId) return;

        const checkStatusAndFetchTeachers = async () => {
            setLoading(true);
            try {
                // Check Status
                const statusRes = await API.get(`/feedback/check-status/${selectedSessionId}`);
                if (statusRes.data.submitted) {
                    setHasSubmitted(true);
                } else {
                    setHasSubmitted(false);
                    // Fetch Teachers if not submitted
                    const teacherRes = await API.get('/feedback/my-teachers');
                    setTeachers(teacherRes.data);

                    // Initialize empty evaluations
                    const initialEvals = {};
                    teacherRes.data.forEach(t => {
                        initialEvals[t.teacherEmpId] = { rating: 0, comment: '' };
                    });
                    setEvaluations(initialEvals);
                }
            } catch (err) {
                triggerToast("Failed to load details.", "error");
            } finally {
                setLoading(false);
            }
        };
        checkStatusAndFetchTeachers();
    }, [selectedSessionId]);

    const handleRating = (empId, starValue) => {
        setEvaluations(prev => ({
            ...prev,
            [empId]: { ...prev[empId], rating: starValue }
        }));
    };

    const handleComment = (empId, text) => {
        setEvaluations(prev => ({
            ...prev,
            [empId]: { ...prev[empId], comment: text }
        }));
    };

    // 1. Ye sirf check karega ki rating di hai ya nahi, aur modal kholega
    const handlePreSubmit = () => {
        const missingRatings = teachers.some(t => evaluations[t.teacherEmpId]?.rating === 0);
        if (missingRatings) {
            return triggerToast("Please give a star rating to all your teachers! ⚠️", "error");
        }
        setShowConfirmModal(true); // Open premium modal
    };

    // 2. Ye actual backend pe data bhejega jab bachha 'Yes' dabayega
    const confirmSubmit = async () => {
        setShowConfirmModal(false); // Modal close karo
        setLoading(true);
        try {
            const evaluationArray = teachers.map(t => ({
                teacherEmpId: t.teacherEmpId,
                teacherName: t.teacherName,
                // subject hata diya hai yahan se bhi
                rating: evaluations[t.teacherEmpId].rating,
                comment: evaluations[t.teacherEmpId].comment
            }));

            await API.post('/feedback/submit', {
                sessionId: selectedSessionId,
                evaluations: evaluationArray
            });

            triggerToast("Feedback Submitted Successfully! 🎉", "success");
            setHasSubmitted(true);
        } catch (err) {
            triggerToast(err.response?.data?.message || "Submission failed.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* HEADER */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">

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
                        <MessageSquare size={24} />
                    </div>
                </div>

                {/* Heading + Subtitle */}
                <div className="relative z-10 text-center mt-4">
                    <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                        Feedback 
                    </h1>

                    <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-2 whitespace-nowrap">
                        Share Your Experience
                    </p>
                </div>

                {/* Locked Identity Badge */}
                <div className="relative z-10 flex justify-center mt-6">
                    <div className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-md">
                        <UserCircle size={20} className="text-white" />

                        <span className="text-white font-black text-sm uppercase tracking-widest">
                            {studentProfile?.name || "Student"}
                        </span>

                        <span className="w-1.5 h-1.5 rounded-full bg-white opacity-50"></span>

                        <Lock size={14} className="text-white/80" />

                        <span className="text-white font-black text-sm uppercase tracking-widest">
                            Class {studentProfile?.grade || "Locked"}
                        </span>
                    </div>
                </div>

            </div>

            {/* MAIN CONTENT AREA */}
            <div className="px-5 -mt-12 relative z-20 space-y-8 max-w-4xl mx-auto">

                {/* SESSION SELECTOR DROPDOWN */}
                <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 ring-1 ring-slate-50 relative">
                    <div className="flex items-center gap-3 mb-4">
                        <MessageSquare size={20} className="text-[#42A5F5]" />
                        <h2 className="text-[15px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Select Form to Fill</h2>
                    </div>

                    <div className="relative">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-slate-50 p-5 border-2 border-slate-200 focus-within:border-[#42A5F5] rounded-[2rem] font-black text-slate-700 outline-none uppercase text-lg hover:border-[#42A5F5] transition-all">
                            <span>
                                {selectedSessionId
                                    ? activeSessions.find(s => s._id === selectedSessionId)?.title
                                    : (activeSessions.length === 0 ? "No active forms available" : "Choose")}
                            </span>
                            <ChevronDown size={20} className="text-[#42A5F5]" />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && activeSessions.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-50 w-full mt-2 bg-white border-2 border-[#42A5F5] rounded-[2rem] shadow-2xl p-2">
                                    {activeSessions.map((session) => (
                                        <button key={session._id} onClick={() => { setSelectedSessionId(session._id); setIsDropdownOpen(false); }} className="w-full text-left px-5 py-4 rounded-2xl font-black text-sm uppercase tracking-wide text-slate-700 hover:bg-blue-50 hover:text-[#42A5F5] transition-all">
                                            {session.title}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* DYNAMIC CONTENT AREA */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#42A5F5] rounded-full animate-spin"></div>
                    </div>
                ) : (
                    selectedSessionId && (
                        <AnimatePresence mode="wait">
                            {hasSubmitted ? (
                                /* SUBMITTED / SUCCESS CARD */
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-emerald-50 text-center relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400 blur-[80px] opacity-20 rounded-full"></div>
                                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-inner">
                                        <CheckCircle size={48} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest mb-3">Feedback Received</h2>
                                    <p className="text-slate-500 font-bold max-w-sm mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        Thank you for your response! Your ratings have been submitted successfully and securely recorded.
                                    </p>
                                </motion.div>
                            ) : (
                                /* FEEDBACK FORM LIST */
                                <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-[2rem] flex items-start gap-4">
                                        <ShieldCheck size={24} className="text-[#42A5F5] shrink-0" />
                                        <p className="text-sm font-bold text-blue-800">
                                            Please rate your teachers honestly. Your feedback helps the school improve your learning experience. Responses are secure.
                                        </p>
                                    </div>

                                    {teachers.length === 0 ? (
                                        <div className="text-center bg-white p-10 rounded-[3rem] border border-slate-200">
                                            <p className="text-slate-400 font-bold">No teachers assigned to your class timetable yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            {teachers.map((t) => (
                                                <div key={t.teacherEmpId} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 ring-1 ring-slate-50 flex flex-col md:flex-row gap-6">

                                                    {/* Teacher Info */}
                                                    <div className="md:w-1/3 flex items-start gap-4 md:border-r border-slate-100 md:pr-6">
                                                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                                            <UserCircle size={27} />
                                                        </div>
                                                        <div className="flex items-center h-12">
                                                            {/* Sirf Teacher ka naam aayega, Subject hata diya */}
                                                            <h3 className="text-[23px] font-black text-slate-800 uppercase tracking-wide leading-tight">
                                                                {t.teacherName}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    {/* Rating & Comment Action */}
                                                    <div className="md:w-2/3 space-y-4">
                                                        <div>
                                                            <p className="text-[15px] font-black uppercase tracking-widest text-slate-700 mb-2">Give Rating (1 to 5 Stars)</p>
                                                            <div className="flex gap-2">
                                                                {[1, 2, 3, 4, 5].map((star) => {
                                                                    const currentRating = evaluations[t.teacherEmpId]?.rating || 0;
                                                                    return (
                                                                        <Star
                                                                            key={star}
                                                                            size={32}
                                                                            className={`cursor-pointer transition-all active:scale-75 ${currentRating >= star ? 'text-amber-400 drop-shadow-md' : 'text-slate-200 hover:text-amber-200'}`}
                                                                            fill={currentRating >= star ? '#fbbf24' : 'transparent'}
                                                                            onClick={() => handleRating(t.teacherEmpId, star)}
                                                                        />
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 focus-within:border-[#42A5F5] rounded-3xl p-4 transition-all">
                                                            <PenTool size={16} className="text-slate-400 mt-1" />
                                                            <textarea
                                                                rows="4"
                                                                placeholder="Any suggestions or comments? (Optional)"
                                                                className="bg-transparent w-full font-bold outline-none text-blue-300 resize-none text-[15px] placeholder:text-slate-400"
                                                                value={evaluations[t.teacherEmpId]?.comment || ''}
                                                                onChange={(e) => handleComment(t.teacherEmpId, e.target.value)}
                                                            ></textarea>
                                                        </div>
                                                    </div>

                                                </div>
                                            ))}

                                            {/* Final Submit Button */}
                                            <div className="pt-6">
                                                <button onClick={handlePreSubmit} className="w-full bg-[#42A5F5] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-600 active:scale-95 transition-all border-b-4 border-blue-700 flex justify-center items-center">
                                                    Submit Evaluation Securely
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )
                )}
            </div>
            {/* --- ANIMATED SUBMIT CONFIRMATION MODAL --- */}
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
                            className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl text-center border-4 border-blue-50"
                        >
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
                                <ShieldCheck size={32} className="text-[#42A5F5]" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">Submit Feedback?</h2>
                            <p className="text-slate-500 font-medium mb-8 text-sm">
                                Are you sure you want to submit? You cannot change your ratings once submitted.
                            </p>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowConfirmModal(false)} 
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmSubmit} 
                                    className="flex-1 bg-[#42A5F5] text-white py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-blue-600 shadow-xl transition-all border-b-4 border-blue-700 active:scale-95"
                                >
                                    Yes, Submit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentFeedback;
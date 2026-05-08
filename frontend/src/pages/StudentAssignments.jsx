import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Upload, CheckCircle, Clock, X, FileText, Lock, Target, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader'; // Cat Loader Import
import { motion, AnimatePresence } from 'framer-motion';

const StudentAssignments = ({ user }) => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitFile, setSubmitFile] = useState(null);
    const [submitUrl, setSubmitUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null);
    const [view, setView] = useState('pending'); // 'pending' ya 'history'
    const [mySubmissions, setMySubmissions] = useState([]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                // 1. Saare assignments laao
                const { data: allAsgn } = await API.get(`/assignments/${user.grade}`);
                // 2. Bache ki submissions laao
                const { data: subs } = await API.get('/assignments/student/my-submissions');

                setMySubmissions(subs);

                // 3. Filter: Sirf wo dikhao jinki ID submissions mein nahi hai
                const submittedIds = subs.map(s => s.assignment?._id?.toString());
                const pending = allAsgn.filter(a => !submittedIds.includes(a._id.toString()));

                setAssignments(pending);
            } catch (err) { console.error("Sync Error"); }
            finally { setLoading(false); }
        };
        fetchAllData();
    }, [user.grade, view]); // Jab view badle tab bhi refresh ho

    const isExpired = (date) => new Date(date) < new Date();

    const handleSubmission = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
            const { data } = await API.post('/upload', formData);
            setSubmitUrl(data);
            setSubmitFile(selectedFile);
        } catch (err) { alert("Uplink Failed"); }
        finally { setUploading(false); }
    };

    const confirmSubmit = async (id) => {
        try {
            await API.post('/assignments/submit', {
                assignmentId: id,
                fileUrl: submitUrl
            });

            setAssignments(prev => prev.filter(item => item._id !== id));

            setToast("Task Synchronized Successfully! ✅");

            setSubmitFile(null);
            setSubmitUrl('');

            setTimeout(() => setToast(null), 3000);

        } catch (err) {
            alert("Submission Failed");
        }
    };

    if (loading) return <Loader />; // Tera Cat Loader yahan chalega

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#F8FAFC] pb-24 italic overscroll-none fixed inset-0 overflow-y-auto font-sans"
        >
            {/* Blue Header Section */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">

                {/* Top Row */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white/20 p-3 rounded-2xl border border-white/30 active:scale-90 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <div className="w-10" /> {/* spacing balance */}
                </div>

                {/* Heading */}
                <h1 className="text-4xl font-black italic tracking-tighter text-center uppercase mt-2">
                    Assignments
                </h1>

                {/* Button BELOW heading (right aligned) */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => setView(view === 'pending' ? 'history' : 'pending')}
                        className="bg-white text-[#42A5F5] px-5 py-3 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-90 transition-all"
                    >
                        {view === 'pending' ? "My Assignments " : "Pending Assignments"}
                    </button>
                </div>
            </div>

            <div className="px-5 -mt-12 space-y-6 relative z-10">
                {assignments.length > 0 ? (
                    assignments.map((asgn, index) => {
                        const expired = isExpired(asgn.dueDate);
                        return (
                            <motion.div
                                key={asgn._id}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 flex flex-col gap-4"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="bg-blue-50 text-[#42A5F5] px-4 py-1.5 rounded-full text-[16px] font-black uppercase tracking-widest border border-blue-100">
                                        {asgn.subject || "General"}
                                    </span>
                                    {expired && (
                                        <span className="bg-rose-50 text-rose-500 px-4 py-1.5 rounded-full text-[16px] font-black uppercase border border-rose-100">
                                            Submission Closed
                                        </span>
                                    )}
                                </div>
                                {/* --- Teacher Identity Badge --- */}
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                        <User size={12} className="text-[#42A5F5]" />
                                    </div>
                                    <span className="text-[17px] font-black uppercase text-[#42A5F5] tracking-widest italic">
                                        Prof. {asgn.teacher?.name || "Faculty Node"}
                                    </span>
                                </div>

                                {/* Title (Ab title teacher ke naam ke niche aayega) */}
                                <h2 className="text-[24px] font-black text-slate-800 leading-tight italic uppercase tracking-tighter mb-1">
                                    {asgn.title}
                                </h2>

                                <p className="text-slate-400 font-bold text-[19px] leading-relaxed italic capitalize">
                                    {asgn.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                                    {/* Deadline Block */}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[13px] font-black uppercase text-[#42A5F5] tracking-[0.1em] ml-1 italic">
                                            Deadline
                                        </span>
                                        <div className="flex items-center gap-2 text-slate-400 font-black italic bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                                            <Clock size={14} className="text-[#42A5F5]" />
                                            <span className="text-[13px] uppercase">
                                                {new Date(asgn.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Marks Block */}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[13px] font-black uppercase text-[#42A5F5] tracking-[0.1em] ml-1 italic">
                                            Total Marks
                                        </span>
                                        <div className="flex items-center gap-2 text-slate-400 font-black italic bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                                            <Target size={14} className="text-[#42A5F5]" />
                                            <span className="text-[13px] uppercase">
                                                {asgn.totalMarks ?? "—"} Marks
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Resource Download */}
                                {asgn.fileUrl && (
                                    <a
                                        href={`http://localhost:5000${asgn.fileUrl}`}
                                        download={asgn.title || "assignment-file"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 py-4 bg-slate-50 rounded-2xl font-black text-[#42A5F5] border border-blue-100 active:scale-95 transition-all uppercase text-[15px] tracking-widest"
                                    >
                                        <Download size={18} /> Download Resource
                                    </a>
                                )}

                                {/* Submission Area */}
                                {!expired ? (
                                    <div className="space-y-4">
                                        {!submitFile ? (
                                            <label className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center cursor-pointer hover:bg-slate-50 transition-all group">
                                                <Upload className="text-slate-300 group-hover:text-[#42A5F5] transition-colors mb-2" size={24} />
                                                <span className="text-[15px] font-black text-slate-400 uppercase tracking-widest">Upload Assignment Sol.</span>
                                                <input type="file" className="hidden" onChange={(e) => handleSubmission(e)} />
                                            </label>
                                        ) : (
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="space-y-4"
                                            >
                                                <div className="flex justify-between bg-emerald-50 p-5 rounded-2xl items-center border border-emerald-100 shadow-sm shadow-emerald-50">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={20} className="text-emerald-500" />
                                                        <span className="text-xs font-black text-emerald-600 truncate max-w-[150px] uppercase">
                                                            {submitFile.name}
                                                        </span>
                                                    </div>
                                                    <button onClick={() => setSubmitFile(null)} className="text-rose-500 bg-white p-2 rounded-xl shadow-sm">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => confirmSubmit(asgn._id)}
                                                    className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black uppercase shadow-xl shadow-emerald-100 active:scale-95 transition-all text-sm tracking-widest"
                                                >
                                                    Upload
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-slate-50 rounded-[2.5rem] flex flex-col items-center opacity-40 border border-slate-100">
                                        <Lock size={20} className="text-slate-300 mb-2" />
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic text-center leading-relaxed">
                                            Temporal Submission Window <br /> Has Been Severed
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })
                ) : (

                    <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 mx-2">
                        <CheckCircle className="mx-auto text-emerald-500/20 mb-4" size={60} />
                        <p className="text-slate-300 font-black uppercase tracking-widest italic text-sm">No assignments active</p>
                    </div>
                )}
            </div>
            {/* --- VIEW 2: HISTORY (SUBMITTED TASKS) --- */}
            {view === 'history' && (
                <div className="space-y-6">
                    {mySubmissions.length > 0 ? mySubmissions.map((sub, index) => (
                        <motion.div
                            key={sub._id}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 flex flex-col gap-5"
                        >
                            {/* Status Bar */}
                            <div className="flex flex-col gap-2">

                                {/* Top Row → Date Right Side */}
                                <div className="flex justify-start">
                                    <span className="text-[16px] font-bold text-slate-400 italic uppercase">
                                        Sent: {new Date(sub.submittedAt).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                {/* Bottom Row → Status Left Side */}
                                <div className="flex justify-start">
                                    <span className={`px-4 py-1.5 rounded-full text-[16px] font-black uppercase border ${sub.status === 'Graded'
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-500'
                                        : 'bg-blue-50 border-blue-100 text-[#42A5F5]'
                                        }`}>
                                        {sub.status === 'Graded' ? 'Evaluation Complete' : 'Under Review'}
                                    </span>
                                </div>

                            </div>

                            <div>
                                <h3 className="text-[22px] font-black text-slate-800 italic leading-tight uppercase">{sub.assignment?.title}</h3>
                                <p className="text-[14px] text-slate-400 font-bold italic mt-1 uppercase tracking-tighter">Prof: {sub.assignment?.teacher?.name}</p>
                            </div>

                            {/* MARKS DISPLAY SECTION */}
                            <div className={`p-6 rounded-[2.5rem] border flex items-center justify-between ${sub.status === 'Graded' ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <div className="flex items-center gap-3">
                                    <Target size={24} />
                                    <div>
                                        {/* <p className="text-[14px] font-black text-slate-800 uppercase opacity-80 italic">Performance</p> */}
                                        <p className="text-[16px] font-black italic tracking-widest leading-none mt-1">
                                            {sub.status === 'Graded' ? `${sub.marksObtained} Marks` : 'Pending Score'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {/* <p className="text-[14px] font-black text-slate-800 opacity-60 uppercase italic leading-none">Weightage</p> */}
                                    <p className="text-[16px] font-black italic"> Out of {sub.assignment?.totalMarks ?? "—"}</p>
                                </div>
                            </div>

                            {/* Feedback if any */}
                            {sub.feedback && (
                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-50 italic text-[13px] text-slate-600 font-bold">
                                    " {sub.feedback} "
                                </div>
                            )}
                        </motion.div>
                    )) : (
                        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 mx-2">
                            <FileText className="mx-auto text-slate-200 mb-4" size={60} />
                            <p className="text-slate-300 font-black uppercase tracking-widest italic text-sm">No History Found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Premium Top-Floating Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -100, opacity: 0, x: "-50%" }}
                        animate={{ y: 50, opacity: 1, x: "-50%" }}
                        exit={{ y: -100, opacity: 0, x: "-50%" }}
                        className="fixed left-1/2 top-0 z-[9999] bg-emerald-500 text-white px-10 py-4 rounded-[2rem] font-black shadow-2xl flex items-center gap-3 border border-emerald-400 italic text-sm whitespace-nowrap"
                    >
                        <CheckCircle size={20} /> {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default StudentAssignments;
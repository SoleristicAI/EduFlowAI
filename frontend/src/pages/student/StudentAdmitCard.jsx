import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserCheck, FileDown, CheckCircle, Download, Check, ClipboardCheck, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';

const StudentAdmitCard = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // BACKEND URL FOR PHOTO FETCHING
    // BACKEND URL FOR PHOTO FETCHING
    const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";
    // (Apna asli render link daal dena)
    const studentPhoto = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`) : null;
    const [admitCards, setAdmitCards] = useState([]);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // UI View Controller: 'list', 'vault', 'success', 'download'
    const [currentView, setCurrentView] = useState('list');
    const [selectedAdmitCard, setSelectedAdmitCard] = useState(null);

    // Form State
    const [authData, setAuthData] = useState({
        name: '',
        phone: '',
        enrollmentNo: ''
    });

    useEffect(() => {
        fetchMyAdmitCards();
    }, []);

    const fetchMyAdmitCards = async () => {
        try {
            const { data } = await API.get('/admitcard/my-admitcards');
            setAdmitCards(data);
        } catch (err) {
            triggerToast("Failed to load admit cards.", "error");
        } finally {
            setLoading(false);
        }
    };

    const triggerToast = (msg, type = "success") => {
        setShowToast({ show: true, message: msg, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const handleSelectCard = (ac) => {
        // console.log("MY CLASS IS:", user.grade);
        // console.log("DATESHEET SCHEDULE IS:", ac.datesheetId?.schedule);
        setSelectedAdmitCard(ac);
        // Check local storage for previously verified status
        const isVerified = localStorage.getItem(`admitcard_verified_${user?.enrollmentNo}_${ac._id}`) === 'true';

        if (isVerified) {
            setCurrentView('download');
        } else {
            setAuthData({ name: '', phone: '', enrollmentNo: '' });
            setCurrentView('vault');
        }
    };

    // Strict Security Validation
    const handleValidationSubmit = (e) => {
        e.preventDefault();
        const nameMatch = authData.name.trim().toLowerCase() === user.name.trim().toLowerCase();
        const phoneMatch = authData.phone.trim() === user.phone.trim();
        const enrollMatch = authData.enrollmentNo.trim().toLowerCase() === user.enrollmentNo.trim().toLowerCase();

        if (nameMatch && phoneMatch && enrollMatch) {
            localStorage.setItem(`admitcard_verified_${user.enrollmentNo}_${selectedAdmitCard._id}`, 'true');
            setCurrentView('success');
            setTimeout(() => {
                setCurrentView('download');
            }, 2000);
        } else {
            triggerToast("Access Denied! Incorrect Credentials. ⚠️", "error");
        }
    };

    // Direct PDF Print Logic
    const handleDownload = () => {
        triggerToast("Generating your Admit Card PDF... ⏳", "success");
        const element = document.getElementById('admitcard-pdf-content');
        const opt = {
            margin: 0.5,
            filename: `${user.name}_AdmitCard_${selectedAdmitCard.examType}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: 1000 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            triggerToast("Admit Card Downloaded Successfully! ✅", "success");
        });
    };

    const handleBack = () => {
        if (currentView !== 'list') {
            setCurrentView('list');
            setSelectedAdmitCard(null);
        } else {
            navigate(-1);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* Header */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden print:hidden">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

                {/* Top Row */}
                <div className="relative z-10 flex justify-between items-center">

                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Right Icon */}
                    <div className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                        <BadgeCheck size={24} />
                    </div>
                </div>

                {/* Heading + Subtitle */}
                <div className="relative z-10 text-center mt-4">
                    <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                        Admit Card
                    </h1>

                    <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-2 whitespace-nowrap">
                        Examination Pass
                    </p>
                </div>

            </div>

            <div className="px-5 -mt-10 relative z-20 space-y-6 max-w-lg mx-auto print:hidden">
                <AnimatePresence mode="wait">

                    {/* --- VIEW 1: ADMIT CARD LIST --- */}
                    {currentView === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {admitCards.length === 0 ? (
                                <div className="bg-white rounded-[3.5rem] p-12 text-center shadow-xl border border-slate-100">
                                    <ClipboardCheck size={60} className="mx-auto text-blue-200 mb-4" />
                                    <h2 className="text-2xl font-black text-slate-700 uppercase tracking-tighter mb-2">
                                        No Admit Cards
                                    </h2>
                                    <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[12px]">
                                        Your hall ticket has not been issued yet.
                                    </p>
                                </div>
                            ) : (
                                admitCards.map((ac, index) => (
                                    <motion.div
                                        key={ac._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleSelectCard(ac)}
                                        className="mb-8 cursor-pointer group text-center"
                                    >
                                        <motion.div
                                            whileHover={{
                                                scale: 1.03,
                                                y: -6,
                                                rotateX: 3
                                            }}
                                            whileTap={{ scale: 0.97 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 250,
                                                damping: 18
                                            }}
                                            className="relative bg-gradient-to-br from-[#ECFDF5] via-white to-[#D1FAE5] 
                        py-6 px-6 rounded-[2rem] border border-white/70 
                        shadow-[0_15px_40px_rgba(16,185,129,0.18)] 
                        overflow-hidden group backdrop-blur-xl cursor-pointer"
                                        >
                                            {/* Top sweep beam */}
                                            <motion.div
                                                initial={{ x: "-100%" }}
                                                whileHover={{ x: "150%" }}
                                                transition={{ duration: 1 }}
                                                className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r 
                            from-transparent via-white/40 to-transparent skew-x-12"
                                            />

                                            {/* Floating glow */}
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.25, 0.4, 0.25]
                                                }}
                                                transition={{
                                                    duration: 4,
                                                    repeat: Infinity
                                                }}
                                                className="absolute -top-8 -right-8 w-28 h-28 bg-emerald-300 rounded-full blur-3xl"
                                            />

                                            {/* Bottom glow strip */}
                                            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 opacity-60"></div>

                                            {/* Border shine */}
                                            <div className="absolute inset-0 rounded-[2rem] border border-white/40 group-hover:border-emerald-300 transition-all duration-500"></div>

                                            {/* Content */}
                                            <div className="flex items-center gap-5 relative z-10">
                                                {/* Icon */}
                                                <motion.div
                                                    whileHover={{
                                                        rotate: [0, -10, 10, 0],
                                                        scale: 1.12
                                                    }}
                                                    transition={{ duration: 0.5 }}
                                                    className="relative p-4 bg-white rounded-[1.3rem] text-[#43A047] 
                                shadow-[0_8px_25px_rgba(67,160,71,0.25)]"
                                                >
                                                    {/* Pulse ring */}
                                                    <motion.div
                                                        animate={{
                                                            scale: [1, 1.6],
                                                            opacity: [0.4, 0]
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity
                                                        }}
                                                        className="absolute inset-0 rounded-[1.3rem] border-2 border-emerald-400"
                                                    />

                                                    <ClipboardCheck size={25} />
                                                </motion.div>

                                                {/* Content */}
                                                <div className="text-left">
                                                    <motion.h2
                                                        whileHover={{ x: 6 }}
                                                        className="text-[18px] font-black text-emerald-950 uppercase tracking-wider"
                                                    >
                                                        {ac.examType}
                                                    </motion.h2>

                                                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest mt-1">
                                                        Batch: {ac.batch}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Floating dots */}
                                            <div className="absolute top-4 right-5 w-2 h-2 bg-emerald-400 rounded-full opacity-70 animate-ping"></div>
                                            <div className="absolute bottom-5 right-10 w-1.5 h-1.5 bg-green-500 rounded-full opacity-60 animate-pulse"></div>
                                        </motion.div>

                                        {/* Bottom text */}
                                        <motion.p
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="text-emerald-600 font-black text-[12px] uppercase tracking-[0.2em] mt-3"
                                        >
                                            Click to Authenticate & Download
                                        </motion.p>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* --- VIEW 2: VAULT VERIFICATION FORM --- */}
                    {currentView === 'vault' && (
                        <motion.div key="vault" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4 }} className="relative bg-white rounded-[3.5rem] p-8 shadow-[0_20px_50px_rgba(66,165,245,0.18)] border border-blue-100 overflow-hidden">
                            <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-[#42A5F5] to-[#64B5F6] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                                <UserCheck className="text-white" size={34} />
                            </div>
                            <h2 className="text-2xl font-black text-center text-slate-800 mb-2 uppercase">Verify Identity</h2>
                            <p className="text-slate-500 font-bold text-center mb-8 text-[13px] uppercase tracking-widest leading-relaxed">
                                Enter details to unlock <span className="block text-[#42A5F5] mt-1">{selectedAdmitCard?.examType}</span>
                            </p>
                            <form onSubmit={handleValidationSubmit} className="space-y-5 relative z-10">
                                <input type="text" placeholder="Full Name" className="w-full bg-slate-50 p-5 rounded-2xl border border-blue-100 text-[16px] font-bold outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-100 transition-all uppercase shadow-sm" value={authData.name} onChange={(e) => setAuthData({ ...authData, name: e.target.value })} required />
                                <input type="tel" placeholder="Registered Phone" className="w-full bg-slate-50 p-5 rounded-2xl border border-blue-100 text-[16px] font-bold outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-100 transition-all uppercase shadow-sm" value={authData.phone} onChange={(e) => setAuthData({ ...authData, phone: e.target.value })} required />
                                <input type="text" placeholder="Enrollment Number" className="w-full bg-slate-50 p-5 rounded-2xl border border-blue-100 text-[16px] font-bold outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-100 transition-all uppercase shadow-sm" value={authData.enrollmentNo} onChange={(e) => setAuthData({ ...authData, enrollmentNo: e.target.value })} required />
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full py-5 bg-gradient-to-r from-[#42A5F5] to-[#1E88E5] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-blue-300 transition-all mt-4">
                                    Authenticate
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {/* --- VIEW 3: LIVE SUCCESS ANIMATION --- */}
                    {currentView === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5, type: "spring" }} className="w-40 h-40 bg-emerald-100 rounded-full flex items-center justify-center relative shadow-[0_0_80px_rgba(52,211,153,0.5)] border-8 border-emerald-50">
                                <div className="absolute inset-0 bg-emerald-400 opacity-30 blur-2xl rounded-full animate-pulse"></div>
                                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                                    <Check size={80} className="text-emerald-500 relative z-10" strokeWidth={3} />
                                </motion.div>
                            </motion.div>
                            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl font-black text-emerald-600 mt-8 uppercase tracking-[0.2em]">Identity Verified</motion.h2>
                        </motion.div>
                    )}

                    {/* --- VIEW 4: DOWNLOAD ACTION --- */}
                    {currentView === 'download' && (
                        <motion.div key="download" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-[#DDE3EA] text-center mt-8">
                            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 relative border border-blue-100 shadow-inner">
                                <FileDown className="text-[#42A5F5]" size={48} />
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white">
                                    <CheckCircle size={16} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase">Admit Card Ready</h2>
                            <p className="text-slate-500 font-bold mb-10 text-[13px] uppercase tracking-widest">{selectedAdmitCard?.examType}</p>
                            <button onClick={handleDownload} className="w-full py-6 bg-gradient-to-r from-[#42A5F5] to-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 flex items-center justify-center gap-3 hover:scale-[0.98] transition-all">
                                <Download size={24} /> Download PDF
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- HIDDEN PDF RENDERER WITH REAL STUDENT DATA --- */}
            {selectedAdmitCard && (currentView === 'download' || currentView === 'success') && (
                <div className="h-0 w-0 overflow-hidden">
                    <div id="admitcard-pdf-content" className="w-[680px] bg-[#ffffff] p-8 m-0 box-border mx-auto not-italic text-[#000000]">
                        <div className="border-[3px] border-[#2B7A9F] p-1 w-full relative z-0">

                            {/* Header */}
                            <div className="flex justify-between items-center border-b-[3px] border-[#2B7A9F] pb-4 px-4 pt-2">
                                <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden border-2 border-[#e2e8f0]">
                                    {selectedAdmitCard.schoolLogo ? (
                                        <img src={selectedAdmitCard.schoolLogo.startsWith('http') ? selectedAdmitCard.schoolLogo : `${BASE_URL}${selectedAdmitCard.schoolLogo}`} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-[#f1f5f9] flex items-center justify-center text-[10px] font-bold text-[#94a3b8]">LOGO</div>
                                    )}
                                </div>
                                <div className="text-center flex-1 px-4">
                                    <h1 className="text-3xl font-black text-[#E31E24] uppercase tracking-wider">{selectedAdmitCard.schoolName}</h1>
                                </div>
                                {/* FIXED PHOTO IMPORT */}
                                <div className="w-20 h-24 border-2 border-[#cbd5e1] bg-[#f1f5f9] flex items-center justify-center text-[10px] font-bold text-[#94a3b8] text-center overflow-hidden">
                                    {studentPhoto ? <img src={studentPhoto} className="w-full h-full object-cover" alt="Student" /> : <>STUDENT<br />PHOTO</>}
                                </div>
                            </div>

                            {/* Titles */}
                            <div className="text-center py-3 border-b-[3px] border-[#2B7A9F] bg-[#f8fafc]">
                                <h2 className="font-black text-[#000000] uppercase tracking-[0.2em] text-lg">Hall Ticket</h2>
                                <h3 className="font-extrabold text-[#000000] uppercase tracking-widest mt-1 text-xs">{selectedAdmitCard.batch}</h3>
                            </div>

                            {/* Student Data Table - FIXED BORDERS ON EVERY CELL */}
                            <div className="w-full">
                                <table className="w-full text-left text-[12px] font-semibold text-[#000000] border-collapse border border-[#2B7A9F]">
                                    <tbody>
                                        <tr>
                                            <td className="p-2 border border-[#2B7A9F] font-extrabold w-1/4 bg-[#f8fafc]">Admission No.:</td>
                                            <td className="p-2 border border-[#2B7A9F] w-1/4 uppercase">{user.admissionNo || "N/A"}</td>
                                            <td className="p-2 border border-[#2B7A9F] font-extrabold w-1/4 bg-[#f8fafc]">Enrollment No.:</td>
                                            <td className="p-2 border border-[#2B7A9F] w-1/4 uppercase">{user.enrollmentNo}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border border-[#2B7A9F] font-extrabold bg-[#f8fafc]">Name of the Student:</td>
                                            <td colSpan="3" className="p-2 border border-[#2B7A9F] uppercase font-black">{user.name}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border border-[#2B7A9F] font-extrabold bg-[#f8fafc]">Father's Name:</td>
                                            <td className="p-2 border border-[#2B7A9F] uppercase">{user.fatherName || "-"}</td>
                                            <td className="p-2 border border-[#2B7A9F] font-extrabold bg-[#f8fafc]">Mother's Name:</td>
                                            <td className="p-2 border border-[#2B7A9F] uppercase">{user.motherName || "-"}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border border-[#2B7A9F] font-extrabold bg-[#f8fafc]">Class:</td>
                                            <td className="p-2 border border-[#2B7A9F] font-black text-[#E31E24] text-sm normal-case">
                                                {user.grade
                                                    ? (() => {
                                                        const grade = parseInt(String(user.grade).split('-')[0].trim());

                                                        const getOrdinal = (n) => {
                                                            if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
                                                            switch (n % 10) {
                                                                case 1:
                                                                    return `${n}st`;
                                                                case 2:
                                                                    return `${n}nd`;
                                                                case 3:
                                                                    return `${n}rd`;
                                                                default:
                                                                    return `${n}th`;
                                                            }
                                                        };

                                                        return getOrdinal(grade);
                                                    })()
                                                    : "N/A"}
                                            </td>
                                            <td className="p-2 border border-[#2B7A9F] font-extrabold bg-[#f8fafc]">DOB:</td>
                                            <td className="p-2 border border-[#2B7A9F]">{user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : "-"}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border border-[#2B7A9F] font-extrabold bg-[#f8fafc]">Exam Type:</td>
                                            <td className="p-2 border border-[#2B7A9F] font-bold uppercase">{selectedAdmitCard.examType}</td>
                                            <td className="p-2 border border-[#2B7A9F] font-extrabold bg-[#f8fafc]">Date of Issue:</td>
                                            <td className="p-2 border border-[#2B7A9F]">{new Date().toLocaleDateString('en-GB')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Subjects Table - STRICT MATCH & SKIP LOGIC (No 'No Exam' Text) */}
                            <div className="w-full mt-2">
                                <table className="w-full text-center text-[12px] font-semibold text-[#000000] border-collapse border border-[#2B7A9F]">
                                    <thead className="bg-[#f1f5f9]">
                                        <tr>
                                            <th className="p-2 border border-[#2B7A9F] font-extrabold uppercase tracking-wider">Exam Code</th>
                                            <th className="p-2 border border-[#2B7A9F] font-extrabold text-left uppercase tracking-wider">Subject Name</th>
                                            <th className="p-2 border border-[#2B7A9F] font-extrabold uppercase tracking-wider">Session</th>
                                            <th className="p-2 border border-[#2B7A9F] font-extrabold uppercase tracking-wider">Date & Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedAdmitCard.datesheetId?.schedule?.map((row, idx) => {

                                            // THE SMART FIX: Handle both "9-A" and "9"
                                            const baseGrade = String(user.grade).split('-')[0].trim().toUpperCase();
                                            let subject = null;

                                            if (row.classExams) {
                                                // Pehle exact match try karega (e.g., "9-A"), agar nahi mila toh base match try karega (e.g., "9")
                                                subject = row.classExams[user.grade] || row.classExams[baseGrade];
                                            }

                                            // STEP 2: SKIP LOGIC - As per user request.
                                            // Agar subject nahi mila, ya backend se '-' aaya hai, toh ye row hide kar do (Return null)
                                            if (!subject || subject === '-' || String(subject).trim() === '') {
                                                return null;
                                            }

                                            // Exam Code Generator (removes spaces from subject name)
                                            const examCodeSubject = String(subject).replace(/\s+/g, '');
                                            const examCode = `EXM${examCodeSubject.substring(0, 3).toUpperCase()}${idx + 1}`;

                                            return (
                                                <tr key={idx}>
                                                    <td className="p-2 border border-[#2B7A9F] font-bold">{examCode}</td>
                                                    <td className="p-2 border border-[#2B7A9F] text-left uppercase font-bold text-sm">
                                                        {subject}
                                                    </td>
                                                    <td className="p-2 border border-[#2B7A9F] uppercase">{selectedAdmitCard.batch}</td>
                                                    <td className="p-2 border border-[#2B7A9F]">
                                                        <div className="font-bold">{row.date}</div>
                                                        <div className="text-[10px] text-[#475569] mt-0.5 font-black uppercase">{selectedAdmitCard.datesheetId.timing}</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Pure Statement aur instructions */}
                                        <tr className="bg-[#f8fafc]">
                                            <td colSpan="4" className="p-2 border border-[#2B7A9F] font-extrabold text-[10px] tracking-widest text-center text-[#000000]">
                                                --- END OF STATEMENT ---
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Signatures & Footer - FIXED CLIPPING AND COLORS */}
                            <div className="relative pt-20 pb-4 border-b-[3px] border-[#2B7A9F] px-8 flex justify-between items-end">
                                <div className="text-center font-extrabold text-[12px] text-[#000000]">
                                    <div className="border-t-2 border-[#000000] pt-1 w-32 md:w-48 uppercase">Candidate Signature</div>
                                </div>
                                <div className="text-center font-extrabold text-[12px] text-[#000000] relative">
                                    {selectedAdmitCard.datesheetId?.signatures?.incharge && <img src={selectedAdmitCard.datesheetId.signatures.incharge.startsWith('http') ? selectedAdmitCard.datesheetId.signatures.incharge : `${BASE_URL}${selectedAdmitCard.datesheetId.signatures.incharge}`} alt="sign" className="h-10 mx-auto absolute bottom-8 left-1/2 -translate-x-1/2" />}
                                    <div className="border-t-2 border-[#000000] pt-1 w-32 md:w-48 uppercase">Controller of Exams</div>
                                </div>
                            </div>

                            {/* FIXED INVISIBLE TEXT ERROR */}
                            <div className="text-center p-3 font-black text-[11px] uppercase tracking-widest bg-[#f8fafc] text-[#000000] border-b-[3px] border-[#2B7A9F]">
                                Student must bring the School ID Card along with this Hall Ticket.
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-6 px-4">
                            <div className="border-[3px] border-[#2B7A9F] bg-[#ffffff] rounded-md overflow-hidden">

                                {/* Heading */}
                                <div className="bg-[#f8fafc] border-b-[3px] border-[#2B7A9F] py-3 text-center">
                                    <h4 className="font-extrabold text-[14px] text-[#000000] uppercase tracking-widest">
                                        Instructions to Candidates
                                    </h4>
                                </div>

                                {/* List */}
                                <div className="p-4">
                                    <ol className="list-decimal pl-5 text-[11px] font-bold space-y-2 text-[#000000]">
                                        {selectedAdmitCard.instructions.map((note, i) => (
                                            <li
                                                key={i}
                                                className="leading-relaxed border-b border-[#cbd5e1] pb-2 last:border-b-0"
                                            >
                                                {note}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentAdmitCard;
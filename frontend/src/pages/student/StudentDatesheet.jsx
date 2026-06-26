import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, ShieldCheck, Lock, FileDown, CalendarDays, CheckCircle, Download, UserCheck, FileText, Printer, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api'; // Path apne hisaab se adjust kar lena
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';

const StudentDatesheet = ({ user }) => {
    const navigate = useNavigate();
    const [datesheets, setDatesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // UI View Controller: 'list', 'vault', 'success', 'download'
    const [currentView, setCurrentView] = useState('list');
    const [selectedDatesheet, setSelectedDatesheet] = useState(null);
    const [isValidated, setIsValidated] = useState(false);
    const [currentSchoolName, setCurrentSchoolName] = useState("EduFlowAI Public School");

    // Form State
    const [authData, setAuthData] = useState({
        name: '',
        phone: '',
        enrollmentNo: ''
    });

    useEffect(() => {
        fetchMyDatesheets();
    }, []);

    useEffect(() => {
        fetchMyDatesheets();

        // NAYA LOGIC: Local storage se school name nikalne ke liye
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj.schoolId && userObj.schoolId.name) {
                    setCurrentSchoolName(userObj.schoolId.name);
                }
            }
        } catch (error) { console.log("Default school name applied"); }
    }, []);

    const fetchMyDatesheets = async () => {
        try {
            const { data } = await API.get('/datesheet/my-datesheet');
            setDatesheets(data);
        } catch (err) {
            triggerToast("Failed to load datesheet.", "error");
        } finally {
            setLoading(false);
        }
    };

    const triggerToast = (msg, type = "success") => {
        setShowToast({ show: true, message: msg, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const handleSelectDatesheet = (ds) => {
        setSelectedDatesheet(ds);

        // Check karo ki KYA YE WALI DATESHEET pehle verify hui hai (ID ke through)
        const isThisDsVerified = localStorage.getItem(`datesheet_verified_${user?.enrollmentNo}_${ds._id}`) === 'true';

        if (isThisDsVerified) {
            setIsValidated(true);
            setCurrentView('download');
        } else {
            setIsValidated(false);
            setAuthData({ name: '', phone: '', enrollmentNo: '' });
            setCurrentView('vault');
        }
    };

    // Strict Security Validation Logic
    const handleValidationSubmit = (e) => {
        e.preventDefault();

        // Exact matching logic (case insensitive for text)
        const nameMatch = authData.name.trim().toLowerCase() === user.name.trim().toLowerCase();
        const phoneMatch = authData.phone.trim() === user.phone.trim();
        const enrollMatch = authData.enrollmentNo.trim().toLowerCase() === user.enrollmentNo.trim().toLowerCase();

        if (nameMatch && phoneMatch && enrollMatch) {
            setIsValidated(true);
            // Verified status us SPECIFIC DATESHEET ke liye save karo (ds._id use karke)
            localStorage.setItem(`datesheet_verified_${user.enrollmentNo}_${selectedDatesheet._id}`, 'true');

            setCurrentView('success');
            setTimeout(() => {
                setCurrentView('download');
            }, 2000);
        } else {
            triggerToast("Access Denied! Incorrect Credentials. ⚠️", "error");
        }
    };

    // Auto-Download / Direct PDF Print Logic
    const handleDownload = () => {
        if (selectedDatesheet.isManual) {
            // Manual upload wali datesheet direct URL se download
            const link = document.createElement('a');
            link.href = selectedDatesheet.fileUrl;
            link.download = `${selectedDatesheet.title}_Datesheet.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            triggerToast("Download Started! ⬇️", "success");
        } else {
            // AI Generated Datesheet direct PDF ban ke download hogi!
            triggerToast("Generating PDF File... ⏳", "success");

            const element = document.getElementById('ai-pdf-content');
            const opt = {
                margin: 0.5,
                filename: `${selectedDatesheet.title}_Schedule.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                // YAHAN windowWidth ADD KIYA HAI
                html2canvas: { scale: 2, useCORS: true, windowWidth: 1000 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            // Convert and Download directly
            html2pdf().set(opt).from(element).save().then(() => {
                triggerToast("PDF Downloaded Successfully! ✅", "success");
            });
        }
    };

    // Smart Back Button Handler
    const handleBack = () => {
        if (currentView !== 'list') {
            setCurrentView('list');
            setSelectedDatesheet(null);
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
                        <CalendarDays size={24} />
                    </div>
                </div>

                {/* Heading + Subtitle */}
                <div className="relative z-10 text-center mt-4">
                    <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                        Date Sheet
                    </h1>

                    <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-2 whitespace-nowrap">
                        Examination Schedule
                    </p>
                </div>

            </div>

            <div className="px-5 -mt-10 relative z-20 space-y-6 max-w-lg mx-auto print:hidden">

                <AnimatePresence mode="wait">

                    {/* --- VIEW 1: DATESHEET LIST --- */}
                    {currentView === 'list' && (
                        <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {datesheets.length === 0 ? (
                                <div className="bg-white rounded-[3.5rem] p-12 text-center shadow-xl border border-slate-100">
                                    <Calendar size={60} className="mx-auto text-blue-200 mb-4" />
                                    <h2 className="text-2xl font-black text-slate-700 uppercase tracking-tighter mb-2">No Exams Scheduled</h2>
                                    <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[12px]">Your datesheet has not been published yet.</p>
                                </div>
                            ) : (
                                datesheets.map((ds, index) => (
                                    <motion.div
                                        key={ds._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleSelectDatesheet(ds)}
                                        className="mb-8 cursor-pointer group text-center"
                                    >
                                        {/* Horizontal Light Green Box */}
                                        <motion.div
                                            whileHover={{
                                                scale: 1.03,
                                                y: -6,
                                                rotateX: 3
                                            }}
                                            whileTap={{ scale: 0.97 }}
                                            transition={{ type: "spring", stiffness: 250, damping: 18 }}
                                            className="relative bg-gradient-to-br from-[#ECFDF5] via-white to-[#D1FAE5] 
    py-6 px-6 rounded-[2rem] border border-white/70 shadow-[0_15px_40px_rgba(16,185,129,0.18)] 
    overflow-hidden group backdrop-blur-xl cursor-pointer"
                                        >
                                            {/* Animated top beam */}
                                            <motion.div
                                                initial={{ x: "-100%" }}
                                                whileHover={{ x: "150%" }}
                                                transition={{ duration: 1 }}
                                                className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r 
        from-transparent via-white/40 to-transparent skew-x-12"
                                            />

                                            {/* Floating glow blob */}
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

                                            {/* Bottom glow */}
                                            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 opacity-60"></div>

                                            {/* Border shine */}
                                            <div className="absolute inset-0 rounded-[2rem] border border-white/40 group-hover:border-emerald-300 transition-all duration-500"></div>

                                            {/* Content */}
                                            <div className="flex items-center gap-5 relative z-10">

                                                {/* Icon Box */}
                                                <motion.div
                                                    whileHover={{
                                                        rotate: [0, -10, 10, 0],
                                                        scale: 1.12
                                                    }}
                                                    transition={{ duration: 0.5 }}
                                                    className="relative p-4 bg-white rounded-[1.3rem] text-[#43A047] 
            shadow-[0_8px_25px_rgba(67,160,71,0.25)]"
                                                >
                                                    {/* Icon pulse ring */}
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

                                                    <FileText size={25} />
                                                </motion.div>

                                                {/* Title */}
                                                <motion.h2
                                                    initial={{ x: 0 }}
                                                    whileHover={{ x: 6 }}
                                                    className="text-[19px] font-black text-emerald-950 uppercase tracking-wider"
                                                >
                                                    {ds.title}
                                                </motion.h2>
                                            </div>

                                            {/* Tiny floating dots */}
                                            <div className="absolute top-4 right-5 w-2 h-2 bg-emerald-400 rounded-full opacity-70 animate-ping"></div>
                                            <div className="absolute bottom-5 right-10 w-1.5 h-1.5 bg-green-500 rounded-full opacity-60 animate-pulse"></div>
                                        </motion.div>

                                        {/* Text Below the Box */}
                                        <motion.p
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="text-emerald-600 font-black text-[12px] uppercase tracking-[0.2em] mt-3"
                                        >
                                            Available For Download
                                        </motion.p>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* --- VIEW 2: DETAILS VERIFICATION FORM --- */}
                    {currentView === 'vault' && (
                        <motion.div
                            key="vault"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.4 }}
                            className="relative bg-gradient-to-br from-white via-blue-50 to-sky-100 rounded-[3.5rem] p-8 shadow-[0_20px_50px_rgba(66,165,245,0.18)] border border-blue-100 overflow-hidden"
                        >
                            {/* Soft Background Glow */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-40"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-200 rounded-full blur-3xl opacity-30"></div>

                            {/* Top Icon */}
                            <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-[#42A5F5] to-[#64B5F6] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                                <UserCheck className="text-white" size={34} />
                            </div>

                            {/* Heading */}
                            <h2 className="text-2xl font-black text-center text-slate-800 mb-2 uppercase">
                                Verify Your Details
                            </h2>

                            <p className="text-slate-500 font-bold text-center mb-8 text-[13px] uppercase tracking-widest leading-relaxed">
                                Please verify your details to continue and access
                                <span className="block text-[#42A5F5] mt-2 text-[14px]">
                                    {selectedDatesheet?.title}
                                </span>
                            </p>

                            {/* Form */}
                            <form onSubmit={handleValidationSubmit} className="space-y-5 relative z-10">

                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full bg-white p-5 rounded-2xl border border-blue-100 text-[16px] font-bold outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-100 transition-all uppercase shadow-sm"
                                    value={authData.name}
                                    onChange={(e) =>
                                        setAuthData({ ...authData, name: e.target.value })
                                    }
                                    required
                                />

                                <input
                                    type="tel"
                                    placeholder="Registered Phone Number"
                                    className="w-full bg-white p-5 rounded-2xl border border-blue-100 text-[16px] font-bold outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-100 transition-all uppercase shadow-sm"
                                    value={authData.phone}
                                    onChange={(e) =>
                                        setAuthData({ ...authData, phone: e.target.value })
                                    }
                                    required
                                />

                                <input
                                    type="text"
                                    placeholder="Enrollment Number (e.g. STU001)"
                                    className="w-full bg-white p-5 rounded-2xl border border-blue-100 text-[16px] font-bold outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-100 transition-all uppercase shadow-sm"
                                    value={authData.enrollmentNo}
                                    onChange={(e) =>
                                        setAuthData({
                                            ...authData,
                                            enrollmentNo: e.target.value
                                        })
                                    }
                                    required
                                />

                                {/* Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full py-5 bg-gradient-to-r from-[#42A5F5] to-[#1E88E5] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-blue-300 transition-all mt-4"
                                >
                                    Continue
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {/* --- VIEW 3: LIVE SUCCESS ANIMATION --- */}
                    {currentView === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.2, 1] }}
                                transition={{ duration: 0.5, type: "spring" }}
                                className="w-40 h-40 bg-emerald-100 rounded-full flex items-center justify-center relative shadow-[0_0_80px_rgba(52,211,153,0.5)] border-8 border-emerald-50"
                            >
                                {/* Glowing Background Effect */}
                                <div className="absolute inset-0 bg-emerald-400 opacity-30 blur-2xl rounded-full animate-pulse"></div>

                                {/* Big Animated Tick/Arrow */}
                                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                                    <Check size={80} className="text-emerald-500 relative z-10" strokeWidth={3} />
                                </motion.div>
                            </motion.div>
                            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl font-black text-emerald-600 mt-8 uppercase tracking-[0.2em]">
                                Details Matched
                            </motion.h2>
                        </motion.div>
                    )}

                    {/* --- VIEW 4: DOWNLOAD / ACTION STATE --- */}
                    {currentView === 'download' && (
                        <motion.div key="download" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-[#DDE3EA] text-center mt-8">
                            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 relative border border-blue-100 shadow-inner">
                                <FileDown className="text-[#42A5F5]" size={48} />
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white">
                                    <CheckCircle size={16} />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase">Access Granted</h2>
                            <p className="text-slate-500 font-bold mb-10 text-[13px] uppercase tracking-widest">{selectedDatesheet?.title}</p>

                            {/* DONO KE LIYE SAME BUTTON - NO "PRINT" WORD */}
                            <button onClick={handleDownload} className="w-full py-6 bg-gradient-to-r from-[#42A5F5] to-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 flex items-center justify-center gap-3 hover:scale-[0.98] transition-all">
                                <Download size={24} /> Download Document
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- HIDDEN AI DATESHEET RENDERER (ONLY FOR PDF GENERATION) --- */}
            {selectedDatesheet && !selectedDatesheet.isManual && (currentView === 'download' || currentView === 'success') && (
                <div className="h-0 w-0 overflow-hidden">

                    {/* WIDTH EXACTLY SET TO 680px (A4 SAFE PRINTABLE AREA) */}
                    <div id="ai-pdf-content" className="w-[680px] bg-[#ffffff] p-8 m-0 box-border mx-auto">

                        <div className="text-center mb-8 border-b-2 border-[#1e293b] pb-6">
                            <h1 className="text-3xl font-black uppercase text-[#0f172a] tracking-wider mb-2">
                                {selectedDatesheet.schoolName}
                            </h1>
                            <h2 className="text-xl font-bold uppercase text-[#1e293b] mb-1">{selectedDatesheet.title}</h2>
                            <h3 className="text-lg font-bold uppercase text-[#334155]">
                                Date Sheet For Class - {user.grade ? String(user.grade).split('-')[0].trim() : "N/A"}
                            </h3>
                        </div>

                        {/* TABLE WRAPPER WITH PADDING TO PROTECT BORDER PIXELS */}
                        <div className="w-full mb-8 px-1">
                            <table className="w-full border-collapse border-2 border-[#1e293b] text-center text-sm font-bold text-[#1e293b] box-border">
                                <thead className="bg-[#f1f5f9]">
                                    <tr>
                                        <th className="border-2 border-[#1e293b] p-3 uppercase tracking-wider bg-[#e2e8f0]">Date</th>
                                        <th className="border-2 border-[#1e293b] p-3 uppercase tracking-wider bg-[#e2e8f0]">Subject</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDatesheet.schedule.map((col, idx) => {
                                        // --- THE SMART SUBJECT MATCHER ---
                                        const baseGrade = String(user.grade).split('-')[0].trim().toUpperCase();
                                        let subject = "-";

                                        if (col.classExams) {
                                            // Pehle exact match (e.g., 9-A) check karega, phir base match (e.g., 9) check karega
                                            subject = col.classExams[user.grade] || col.classExams[baseGrade] || "-";
                                        }

                                        // Skip missing or 'No Exam' cases perfectly for datesheet
                                        if (!subject || subject === '-' || String(subject).toLowerCase() === 'no exam') {
                                            subject = "NO EXAM";
                                        }

                                        return (
                                            <tr key={idx} className="break-inside-avoid">
                                                <td className="border-2 border-[#1e293b] p-3">
                                                    <div className="font-black whitespace-nowrap">{col.date}</div>
                                                    <div className="text-[#475569] font-semibold">{col.day}</div>
                                                </td>
                                                <td className="border-2 border-[#1e293b] p-3 capitalize text-lg font-black">
                                                    {/* YAHAN FIX KIYA HAI: text-slate-400 ki jagah text-[#94a3b8] lagaya */}
                                                    {subject === "NO EXAM" ? <span className="text-[#94a3b8] italic font-bold">No Exam</span> : subject}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="break-inside-avoid px-1">
                            <div className="mb-12">
                                <h4 className="font-black text-[#1e293b] mb-4 underline">Kindly Note:</h4>
                                <ul className="list-disc pl-5 font-bold text-sm text-[#334155] space-y-2">
                                    <li className="text-[#0f172a]">
                                        <strong>Examination Timing:</strong> {selectedDatesheet.timing}
                                    </li>
                                    <li className="text-[#0f172a]">
                                        <strong>Result Declaration:</strong> {new Date(selectedDatesheet.resultDate).toLocaleDateString('en-GB')}
                                    </li>
                                    {selectedDatesheet.notes.split('\n').map((note, i) => (
                                        note.trim() && <li key={i}>{note}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* SIGNATURE BLOCK: WIDTH ADJUSTED TO PREVENT OVERFLOW */}
                            <div className="flex justify-between items-end mt-16 pb-4">

                                <div className="text-left w-48 flex flex-col justify-end">
                                    {selectedDatesheet.signatures?.incharge && (
                                        <img src={selectedDatesheet.signatures.incharge} alt="Incharge" className="h-16 mb-3 object-contain object-left" />
                                    )}
                                    <div className="border-t-2 border-solid border-[#1e293b] pt-2 w-full">
                                        <p className="font-black text-[#1e293b] uppercase text-sm">Examination Incharge</p>
                                    </div>
                                </div>

                                <div className="text-right w-48 flex flex-col justify-end">
                                    {selectedDatesheet.signatures?.principal && (
                                        <img src={selectedDatesheet.signatures.principal} alt="Principal" className="h-16 mb-3 object-contain object-right" />
                                    )}
                                    <div className="border-t-2 border-solid border-[#1e293b] pt-2 w-full">
                                        <p className="font-black text-[#1e293b] uppercase text-sm">Principal</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDatesheet;
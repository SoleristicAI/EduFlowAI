import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, FileDown, CheckCircle, Download, FileText,CalendarDays, Printer, Check, ArrowRight, LayoutDashboard, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";

const TeacherDatesheet = () => {
    const navigate = useNavigate();
    const [datesheets, setDatesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // View States: 'list' or 'download'
    const [currentView, setCurrentView] = useState('list');
    const [selectedDatesheet, setSelectedDatesheet] = useState(null);
    const [availableClasses, setAvailableClasses] = useState([]);

    useEffect(() => {
        fetchTeacherDatesheets();
        fetchClasses(); // Ye call add karni hai
    }, []);

    const fetchClasses = async () => {
        try {
            const { data } = await API.get('/notices/meta/classes');
            setAvailableClasses(data);
        } catch (err) {
            console.log("Failed to fetch classes");
        }
    };

    const fetchTeacherDatesheets = async () => {
        try {
            const { data } = await API.get('/datesheet/teacher-datesheets');
            setDatesheets(data);
        } catch (err) {
            triggerToast("Failed to load institutional schedules.", "error");
        } finally {
            setLoading(false);
        }
    };

    const triggerToast = (msg, type = "success") => {
        setShowToast({ show: true, message: msg, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    // Form verification bypass logic for teachers
    const handleSelectDatesheet = (ds) => {
        setSelectedDatesheet(ds);
        setCurrentView('download');
    };

    const handleDownload = () => {
        if (selectedDatesheet.isManual) {
            const link = document.createElement('a');
            link.href = selectedDatesheet.fileUrl.startsWith('http') ? selectedDatesheet.fileUrl : `${BASE_URL}${selectedDatesheet.fileUrl}`;
            link.download = `${selectedDatesheet.title}_Datesheet.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            triggerToast("Download Started! ⬇️", "success");
        } else {
            triggerToast("Generating PDF File... ⏳", "success");
            const element = document.getElementById('ai-pdf-content');
            const opt = {
                margin: 0.5,
                filename: `${selectedDatesheet.title}_Schedule.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, windowWidth: 1000 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                triggerToast("PDF Downloaded Successfully! ✅", "success");
            });
        }
    };

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

            {/* Custom Adapted Header */}
            <div className="bg-[#42A5F5] px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible print:hidden">
    <div className="flex justify-between items-center relative z-10">

        {/* Back Button */}
        <button
            onClick={handleBack}
            className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-md active:scale-95 transition-all"
        >
            <ArrowLeft size={24} />
        </button>

        {/* Center Title */}
        <div className="text-center">
            <h1 className="text-4xl font-black italic tracking-tight text-white capitalize">
                Date Sheet
            </h1>

            <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-80 mt-1">
                Examination Schedule
            </p>
        </div>

        {/* Right Icon */}
        <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm">
            <CalendarDays size={24} />
        </div>

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
                                    <h2 className="text-2xl font-black text-slate-700 uppercase tracking-tighter mb-2">No Schedules Found</h2>
                                    <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[12px]">The administration has not published any schedules.</p>
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
                                        <motion.div
                                            whileHover={{ scale: 1.03, y: -6, rotateX: 3 }}
                                            whileTap={{ scale: 0.97 }}
                                            transition={{ type: "spring", stiffness: 250, damping: 18 }}
                                            className="relative bg-gradient-to-br from-[#ECFDF5] via-white to-[#D1FAE5] py-6 px-6 rounded-[2rem] border border-white/70 shadow-[0_15px_40px_rgba(16,185,129,0.18)] overflow-hidden group backdrop-blur-xl"
                                        >
                                            <motion.div initial={{ x: "-100%" }} whileHover={{ x: "150%" }} transition={{ duration: 1 }} className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
                                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.4, 0.25] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-8 -right-8 w-28 h-28 bg-emerald-300 rounded-full blur-3xl" />
                                            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 opacity-60"></div>
                                            <div className="absolute inset-0 rounded-[2rem] border border-white/40 group-hover:border-emerald-300 transition-all duration-500"></div>

                                            <div className="flex items-center gap-5 relative z-10">
                                                <motion.div className="relative p-4 bg-white rounded-[1.3rem] text-[#43A047] shadow-[0_8px_25px_rgba(67,160,71,0.25)]">
                                                    <motion.div animate={{ scale: [1, 1.6], opacity: [0.4, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-[1.3rem] border-2 border-emerald-400" />
                                                    <FileText size={25} />
                                                </motion.div>
                                                <div className="text-left">
                                                    <h2 className="text-[19px] font-black text-emerald-950 uppercase tracking-wider">{ds.title}</h2>
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                        {ds.classes.length === availableClasses.length && availableClasses.length > 0
                                                            ? 'Classes: ALL CLASSES'
                                                            : `Classes: ${ds.classes.join(', ')}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                        <p className="text-emerald-600 font-black text-[12px] uppercase tracking-[0.2em] mt-3">Click to Access File</p>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* --- VIEW 2: DOWNLOAD VIEW --- */}
                    {currentView === 'download' && (
                        <motion.div key="download" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-[#DDE3EA] text-center mt-8">
                            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 relative border border-blue-100 shadow-inner">
                                <FileDown className="text-[#42A5F5]" size={48} />
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white">
                                    <CheckCircle size={16} />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase">File Unlocked</h2>
                            <p className="text-slate-500 font-bold mb-10 text-[13px] uppercase tracking-widest">{selectedDatesheet?.title}</p>

                            <button onClick={handleDownload} className="w-full py-6 bg-gradient-to-r from-[#42A5F5] to-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 flex items-center justify-center gap-3 hover:scale-[0.98] transition-all">
                                <Download size={24} /> Download Document
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- HIDDEN REPORT GENERATOR FOR LIBRARIES --- */}
            {selectedDatesheet && !selectedDatesheet.isManual && currentView === 'download' && (
                <div className="h-0 w-0 overflow-hidden">
                    <div id="ai-pdf-content" className="w-[680px] bg-[#ffffff] p-8 m-0 box-border mx-auto">
                        <div className="text-center mb-8 border-b-2 border-[#1e293b] pb-6">
                            <h1 className="text-3xl font-black uppercase text-[#0f172a] tracking-wider mb-2">{selectedDatesheet.schoolName}</h1>
                            <h2 className="text-xl font-bold uppercase text-[#1e293b] mb-1">{selectedDatesheet.title}</h2>
                            <h3 className="text-lg font-bold uppercase text-[#334155]">Master Schedule Matrix</h3>
                        </div>

                        <div className="w-full mb-8 px-1">
                            <table className="w-full border-collapse border-2 border-[#1e293b] text-center text-sm font-bold text-[#1e293b] box-border">
                                <thead className="bg-[#f1f5f9]">
                                    <tr>
                                        <th className="border-2 border-[#1e293b] p-3 uppercase tracking-wider bg-[#e2e8f0]">Date</th>
                                        {selectedDatesheet.classes.map(cls => (
                                            <th key={cls} className="border-2 border-[#1e293b] p-3 uppercase tracking-wider bg-[#e2e8f0]">Class {cls}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDatesheet.schedule.map((col, idx) => (
                                        <tr key={idx} className="break-inside-avoid">
                                            <td className="border-2 border-[#1e293b] p-3">
                                                <div className="font-black whitespace-nowrap">{col.date}</div>
                                                <div className="text-[#475569] font-semibold">{col.day}</div>
                                            </td>
                                            {selectedDatesheet.classes.map(cls => (
                                                <td key={cls} className="border-2 border-[#1e293b] p-3 capitalize">
                                                    {col.classExams[cls]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="break-inside-avoid px-1">
                            <div className="mb-12">
                                <h4 className="font-black text-[#1e293b] mb-4 underline">Kindly Note:</h4>
                                <ul className="list-disc pl-5 font-bold text-sm text-[#334155] space-y-2">
                                    <li className="text-[#0f172a]"><strong>Examination Timing:</strong> {selectedDatesheet.timing}</li>
                                    <li className="text-[#0f172a]"><strong>Result Declaration:</strong> {new Date(selectedDatesheet.resultDate).toLocaleDateString('en-GB')}</li>
                                    {selectedDatesheet.notes.split('\n').map((note, i) => (
                                        note.trim() && <li key={i}>{note}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex justify-between items-end mt-16 pb-4">
                                <div className="text-left w-48 flex flex-col justify-end">
                                    {selectedDatesheet.signatures?.incharge && <img src={selectedDatesheet.signatures.incharge.startsWith('http') ? selectedDatesheet.signatures.incharge : `${BASE_URL}${selectedDatesheet.signatures.incharge}`} alt="Incharge" className="h-16 mb-3 object-contain object-left" />}
                                    <div className="border-t-2 border-solid border-[#1e293b] pt-2 w-full"><p className="font-black text-[#1e293b] uppercase text-sm">Examination Incharge</p></div>
                                </div>
                                <div className="text-right w-48 flex flex-col justify-end">
                                    {selectedDatesheet.signatures?.principal && <img src={selectedDatesheet.signatures.principal.startsWith('http') ? selectedDatesheet.signatures.principal : `${BASE_URL}${selectedDatesheet.signatures.principal}`} alt="Principal" className="h-16 mb-3 object-contain object-right" />}
                                    <div className="border-t-2 border-solid border-[#1e293b] pt-2 w-full"><p className="font-black text-[#1e293b] uppercase text-sm">Principal</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDatesheet;
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, GraduationCap, CheckCircle, AlertTriangle, Layers, ChevronDown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api'; 
import Toast from '../../components/Toast';
import Loader from '../../components/Loader';
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// 🚀 THE CUSTOM PREMIUM DROPDOWN COMPONENT 
// ==========================================
const CustomDropdown = ({ options, value, onChange, placeholder, disabled, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={dropdownRef} className={`relative w-full ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full p-4 border-2 rounded-2xl font-black transition-all cursor-pointer ${
                    isOpen ? 'border-[#42A5F5] bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-[#42A5F5]'
                } ${value ? 'text-slate-700' : 'text-slate-400'}`}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={20} className="text-slate-400" /></motion.div>
            </div>
            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-[100] w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden"
                    >
                        <div className="max-h-56 overflow-y-auto overscroll-contain custom-scrollbar p-2">
                            {options.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 font-bold text-sm">No options available</div>
                            ) : (
                                options.map((opt) => (
                                    <div 
                                        key={opt.value}
                                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                        className={`p-3 rounded-xl font-bold cursor-pointer transition-colors mb-1 ${
                                            value === opt.value ? 'bg-[#42A5F5] text-white' : 'hover:bg-slate-50 text-slate-600'
                                        }`}
                                    >
                                        {opt.label}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==========================================
// 🚀 MAIN COMPONENT
// ==========================================
const SessionPromotion = () => {
    const navigate = useNavigate();
    
    // Core Data States
    const [allGrades, setAllGrades] = useState([]);
    const [upgradedClasses, setUpgradedClasses] = useState([]);
    const [activeSession, setActiveSession] = useState('2025-2026');
    
    const [selectedGrade, setSelectedGrade] = useState('');
    const [students, setStudents] = useState([]);
    const [studentData, setStudentData] = useState({}); 
    
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkData, setBulkData] = useState({ action: '', targetClass: '' });

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // 🔥 NEW: CUSTOM CONFIRMATION MODAL STATE
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        fetchSessionConfig();
    }, []);

    const triggerToast = (msg, type = "success") => {
        setShowToast({ show: true, message: msg, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const fetchSessionConfig = async () => {
        try {
            const { data } = await API.get('/users/admin/session-config');
            setAllGrades(data.grades);
            setActiveSession(data.activeSession);
            setUpgradedClasses(data.upgradedClasses);
        } catch (err) {
            triggerToast("Failed to fetch config", "error");
        }
    };

    const fetchStudents = async (grade) => {
        if (!grade) {
            setStudents([]);
            return;
        }
        setLoading(true);
        try {
            const { data } = await API.get(`/users/students/${grade}`);
            setStudents(data);
            setIsBulkMode(false);
            setBulkData({ action: '', targetClass: '' });
            const initialData = {};
            data.forEach(s => { initialData[s._id] = { action: '', targetClass: '' }; });
            setStudentData(initialData);
        } catch (err) {
            triggerToast("Failed to load students", "error");
        } finally {
            setLoading(false);
        }
    };

    const extractGradeNumber = (gradeString) => {
        if (!gradeString) return 0;
        const match = gradeString.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    };

    const pendingGrades = allGrades.filter(g => !upgradedClasses.includes(g));
    const highestPendingGradeNumber = pendingGrades.length > 0 ? Math.max(...pendingGrades.map(extractGradeNumber)) : 0;
    
    const allowedClassOptions = pendingGrades
        .filter(g => extractGradeNumber(g) === highestPendingGradeNumber)
        .map(g => ({ label: `Class ${g} (Ready)`, value: g }));

    const isEverythingCompleted = allGrades.length > 0 && pendingGrades.length === 0;

    const actionOptions = [
        { label: 'Promote to Next Class', value: 'PROMOTE' },
        { label: 'Repeat Same Class', value: 'REPEAT' },
        { label: 'Mark as Alumni / Left', value: 'ALUMNI' }
    ];

    const currentGradeNumber = extractGradeNumber(selectedGrade);
    const targetClassOptions = allGrades
        .filter(g => extractGradeNumber(g) > currentGradeNumber)
        .map(g => ({ label: `Class ${g}`, value: g }));

    const handleIndividualChange = (id, field, value) => {
        setStudentData(prev => ({
            ...prev, [id]: { ...prev[id], [field]: value, ...(field === 'action' && value !== 'PROMOTE' ? { targetClass: '' } : {}) }
        }));
    };

    const handleBulkChange = (field, value) => {
        setBulkData(prev => ({
            ...prev, [field]: value, ...(field === 'action' && value !== 'PROMOTE' ? { targetClass: '' } : {})
        }));
    };

    const isReadyToExecute = () => {
        if (students.length === 0) return false;
        if (isBulkMode) {
            if (!bulkData.action) return false;
            if (bulkData.action === 'PROMOTE' && !bulkData.targetClass) return false;
            return true;
        } else {
            for (let s of students) {
                const st = studentData[s._id];
                if (!st || !st.action) return false;
                if (st.action === 'PROMOTE' && !st.targetClass) return false;
            }
            return true;
        }
    };

    // 🚀 STEP 1: TRIGGER CUSTOM CONFIRMATION FOR CLASS LOCK
    const handleExecuteFinal = () => {
        if (!isReadyToExecute()) return;
        
        setConfirmModal({
            show: true,
            title: `Lock ${selectedGrade}?`,
            message: `Are you sure you want to finalize ${selectedGrade}? This class will be LOCKED permanently for ${activeSession}.`,
            onConfirm: executePromotion // Execute actual function on confirm
        });
    };

    // 🚀 STEP 2: ACTUAL EXECUTION OF CLASS LOCK
    const executePromotion = async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null }); // Close modal
        setActionLoading(true);
        try {
            const studentUpdates = students.map(s => ({
                studentId: s._id,
                action: isBulkMode ? bulkData.action : studentData[s._id].action,
                newGrade: isBulkMode ? bulkData.targetClass : studentData[s._id].targetClass
            }));

            await API.post('/users/admin/promote-students', {
                currentSession: activeSession,
                currentGrade: selectedGrade,
                studentUpdates
            });

            triggerToast(`Success! ${selectedGrade} is now LOCKED. 🔒`, 'success');
            setSelectedGrade('');
            setStudents([]);
            fetchSessionConfig(); // Refresh locks
        } catch (error) {
            triggerToast(error.response?.data?.message || 'Error processing promotion ❌', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // 🚀 STEP 1: TRIGGER CUSTOM CONFIRMATION FOR ENTIRE SESSION LOCK
    const handleLockEntireSession = () => {
        const parts = activeSession.split('-');
        const nextSessionStr = `${parseInt(parts[0]) + 1}-${parseInt(parts[1]) + 1}`;

        setConfirmModal({
            show: true,
            title: "Lock Entire Session?",
            message: `Are you absolutely sure? This will officially lock ${activeSession} and switch the school to ${nextSessionStr}.`,
            onConfirm: () => executeSessionLock(nextSessionStr) // Execute actual function on confirm
        });
    };

    // 🚀 STEP 2: ACTUAL EXECUTION OF SESSION LOCK
    const executeSessionLock = async (nextSessionStr) => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null }); // Close modal
        setActionLoading(true);
        try {
            const { data } = await API.post('/users/admin/finalize-session', { nextSession: nextSessionStr });
            triggerToast(data.message, 'success');
            fetchSessionConfig();
        } catch (error) {
            triggerToast('Failed to lock session', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* 🔥 NEW: CUSTOM CENTERED CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white w-full max-w-sm md:max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10 text-center border border-slate-200">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="text-[#42A5F5]" size={36} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">{confirmModal.title}</h2>
                            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                                {confirmModal.message}
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-200">
                                    Cancel
                                </button>
                                <button onClick={confirmModal.onConfirm} className="flex-1 bg-[#42A5F5] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 active:scale-95 transition-all hover:bg-blue-600">
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- PREMIUM HEADER --- */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>
                <div className="flex justify-between items-center relative z-10">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-black italic tracking-tight capitalize">Session Transition</h1>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                        <GraduationCap size={24} />
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20 space-y-6 max-w-7xl mx-auto">
                
                {/* 🚀 THE BIG GREEN SESSION LOCK BUTTON (Appears when all done) */}
                <AnimatePresence>
                    {isEverythingCompleted && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500 rounded-[3.5rem] p-10 shadow-2xl shadow-emerald-500/30 text-center border-4 border-emerald-400 relative z-40 overflow-hidden">
                            <div className="absolute -right-10 -top-10 opacity-20"><CheckCircle size={150} /></div>
                            <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-4">All Classes Locked! 🔒</h2>
                            <p className="text-emerald-100 font-bold mb-8 text-lg">You have successfully processed all classes for {activeSession}.</p>
                            
                            <button 
                                onClick={handleLockEntireSession}
                                disabled={actionLoading}
                                className="bg-white text-emerald-600 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 mx-auto text-lg"
                            >
                                {actionLoading ? <Loader /> : <>Confirm & Lock {activeSession} ✅</>}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SETTINGS CARD */}
                {!isEverythingCompleted && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] p-6 md:p-8 shadow-2xl border border-[#DDE3EA] relative z-30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-black text-slate-400 tracking-widest uppercase">Class Unlock (Descending Order)</label>
                                    <span className="text-xs font-black text-[#42A5F5]">{pendingGrades.length} remaining</span>
                                </div>
                                <CustomDropdown 
                                    options={allowedClassOptions}
                                    value={selectedGrade}
                                    onChange={(val) => { setSelectedGrade(val); fetchStudents(val); }}
                                    placeholder={allowedClassOptions.length > 0 ? "Select Highest Available Class" : "All classes locked!"}
                                    disabled={allowedClassOptions.length === 0}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-black text-slate-400 mb-2 tracking-widest uppercase">Archiving Session (System Managed)</label>
                                <div className="w-full p-4 border-2 border-[#42A5F5] rounded-2xl font-black text-[#42A5F5] bg-blue-50 flex justify-between items-center">
                                    <span>{activeSession}</span>
                                    <Lock size={18} />
                                </div>
                            </div>
                        </div>

                        {/* VISUAL LOCK DISPLAY */}
                        {upgradedClasses.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <label className="block text-xs font-black text-slate-400 mb-3 tracking-widest uppercase">Locked Classes ({activeSession})</label>
                                <div className="flex flex-wrap gap-2">
                                    {upgradedClasses.map(cls => (
                                        <div key={cls} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase flex items-center gap-1 border border-emerald-200">
                                            <Lock size={12} /> {cls}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* DYNAMIC LAYOUT: STUDENTS (LEFT) & ACTION PANEL (RIGHT) */}
                <AnimatePresence>
                    {selectedGrade && !isEverythingCompleted && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-6 items-start relative z-20">
                            
                            <div className="flex-[3] w-full bg-white rounded-[3.5rem] p-6 shadow-2xl border border-[#DDE3EA]">
                                <div className="flex justify-between items-center mb-6 px-2">
                                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="text-[#42A5F5]" size={24} /> Student Roster ({selectedGrade})
                                    </h2>
                                    <span className="bg-blue-100 text-[#42A5F5] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                        {students.length} Total
                                    </span>
                                </div>

                                {students.length > 0 && (
                                    <div 
                                        onClick={() => setIsBulkMode(!isBulkMode)}
                                        className={`flex items-center gap-4 p-5 mb-6 rounded-3xl border-2 transition-all cursor-pointer ${
                                            isBulkMode ? 'bg-[#42A5F5] border-[#42A5F5] shadow-lg shadow-blue-500/30' : 'bg-slate-50 border-slate-200 hover:border-[#42A5F5]'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isBulkMode ? 'border-white' : 'border-slate-400'}`}>
                                            {isBulkMode && <div className="w-3 h-3 bg-white rounded-full"></div>}
                                        </div>
                                        <span className={`font-black uppercase tracking-widest text-sm ${isBulkMode ? 'text-white' : 'text-slate-500'}`}>
                                            Apply Bulk Edit To All Students
                                        </span>
                                    </div>
                                )}

                                {loading ? (
                                    <div className="py-20 flex justify-center"><Loader /></div>
                                ) : students.length === 0 ? (
                                    <div className="text-center py-16">
                                        <AlertTriangle size={48} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest">No active students found. Ready to lock.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-visible md:overflow-x-auto min-h-[400px] pb-40">
                                        <table className="w-full text-left min-w-[700px] border-separate border-spacing-y-2">
                                            <thead>
                                                <tr>
                                                    <th className="py-2 px-4 text-xs font-black text-slate-400 tracking-widest uppercase">Student Profile</th>
                                                    <th className="py-2 text-xs font-black text-slate-400 tracking-widest uppercase text-center w-[50%]">Status Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map(student => (
                                                    <tr key={student._id} className={`transition-colors ${isBulkMode ? 'opacity-70' : 'hover:bg-slate-50'}`}>
                                                        <td className="p-4 border border-slate-100 rounded-l-2xl bg-white">
                                                            <div className="flex items-center gap-4">
                                                                <img src={student.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="avatar" className="w-12 h-12 rounded-full border-2 border-slate-200" />
                                                                <div>
                                                                    <h4 className="font-black text-slate-700 capitalize text-lg">{student.name}</h4>
                                                                    <p className="text-xs font-bold text-[#42A5F5] tracking-widest uppercase">{student.enrollmentNo}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 border-y border-r border-slate-100 rounded-r-2xl bg-white">
                                                            {isBulkMode ? (
                                                                <div className="flex items-center justify-center gap-2 text-emerald-500 font-black tracking-widest uppercase text-sm h-full">
                                                                    <CheckCircle size={20} /> Selected for Bulk Update
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col md:flex-row gap-2 w-full">
                                                                    <CustomDropdown options={actionOptions} value={studentData[student._id]?.action} onChange={(val) => handleIndividualChange(student._id, 'action', val)} placeholder="Set Status" />
                                                                    {studentData[student._id]?.action === 'PROMOTE' && (
                                                                        <CustomDropdown options={targetClassOptions} value={studentData[student._id]?.targetClass} onChange={(val) => handleIndividualChange(student._id, 'targetClass', val)} placeholder="Next Class" />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 w-full flex flex-col gap-6 lg:sticky lg:top-6 z-10">
                                
                                <div className="bg-white rounded-[3.5rem] p-6 md:p-8 shadow-2xl border border-blue-200 bg-gradient-to-b from-white to-blue-50/50">
                                    <h2 className="text-xl font-black text-[#42A5F5] uppercase tracking-wider flex items-center gap-2 mb-6">
                                        {isBulkMode ? <Layers size={24} /> : <CheckCircle size={24} />} 
                                        {isBulkMode ? "Bulk Actions" : "Finalize"}
                                    </h2>

                                    {isBulkMode ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                            <label className="block text-xs font-black text-slate-400 tracking-widest uppercase">Bulk Status</label>
                                            <CustomDropdown options={actionOptions} value={bulkData.action} onChange={(val) => handleBulkChange('action', val)} placeholder="Set Action for ALL" />
                                            {bulkData.action === 'PROMOTE' && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                                    <label className="block text-xs font-black text-slate-400 tracking-widest uppercase mt-4 mb-2">Target Class</label>
                                                    <CustomDropdown options={targetClassOptions} value={bulkData.targetClass} onChange={(val) => handleBulkChange('targetClass', val)} placeholder="Next Class" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-sm font-bold text-slate-500">Configure each student individually using the dropdowns on the left.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-[3.5rem] p-6 shadow-2xl border border-[#DDE3EA]">
                                    <div className="mb-4 text-center">
                                        {!isReadyToExecute() && students.length > 0 ? (
                                            <p className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1"><AlertTriangle size={14}/> Resolve all statuses to execute.</p>
                                        ) : (
                                            <p className="text-xs font-black text-[#42A5F5] uppercase tracking-widest flex items-center justify-center gap-1"><Lock size={14}/> Ready to lock {selectedGrade}.</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleExecuteFinal}
                                        disabled={actionLoading || (!isReadyToExecute() && students.length > 0)}
                                        className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-white transition-all shadow-lg flex justify-center items-center gap-2 ${
                                            actionLoading || (!isReadyToExecute() && students.length > 0)
                                                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                                : 'bg-[#42A5F5] hover:bg-blue-600 active:scale-95 shadow-blue-500/30'
                                        }`}
                                    >
                                        {actionLoading ? <Loader /> : <>Lock {selectedGrade} 🔒</>}
                                    </button>
                                </div>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SessionPromotion;
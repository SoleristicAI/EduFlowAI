import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, UserCheck, Zap, PlusCircle, Eye, EyeOff, Download, 
    User, Mail, Lock, Phone, BookOpen, Fingerprint, 
    Users, MapPin, CalendarDays, Check, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

const AddTeacher = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [confirmPass, setConfirmPass] = useState('');
    const [isFinance, setIsFinance] = useState(false);
    const [isGenderOpen, setIsGenderOpen] = useState(false);
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
    const [msg, setMsg] = useState('');
    
    // Custom Calendar States (Teachers typically born between 1950 - 2005)
    const [isCalOpen, setIsCalOpen] = useState(false);
    const [calView, setCalView] = useState('days'); 
    const [calDate, setCalDate] = useState(new Date(1990, 0, 1)); 

    const [teacherData, setTeacherData] = useState({
        name: '', email: '', password: '', subjects: '', assignedClass: '',
        fatherName: '', motherName: '', dob: '', gender: 'Male', religion: '',
        phone: '', address: { pincode: '', district: '', state: '', fullAddress: '' }
    });

    const [financeExists, setFinanceExists] = useState(false);
    const [availableClasses, setAvailableClasses] = useState([]);

    useEffect(() => {
        const checkFinance = async () => {
            try {
                const { data } = await API.get('/users/check-finance-exists');
                setFinanceExists(data.exists);
            } catch (err) { console.error("Finance check failed"); }
        };
        checkFinance();
    }, []);

    useEffect(() => {
        const fetchAvailable = async () => {
            try {
                const { data } = await API.get('/users/available-classes');
                setAvailableClasses(data);
            } catch (err) { console.error("Classes fetch failed"); }
        };
        if (!isFinance) fetchAvailable();
    }, [isFinance]);

    // --- PDF Generator ---
    const generateCredentialsPDF = (credentialsList) => {
        if (!credentialsList || credentialsList.length === 0) return;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.setTextColor(66, 165, 245); 
        doc.text("EduFlowAI - Faculty Identity & Access Matrix", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("CONFIDENTIAL: Handover these credentials to the respective personnel.", 14, 30);

        const tableBody = credentialsList.map((user, index) => [
            index + 1, user.name, user.role, user.email, user.password
        ]);

        autoTable(doc, {
            startY: 38,
            head: [['S.No', 'Faculty Name', 'Role', 'Email (Login ID)', 'AI Password']],
            body: tableBody,
            headStyles: { fillColor: [66, 165, 245], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { textColor: [50, 50, 50] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        doc.save(`Faculty_Credentials_Batch_${new Date().getTime()}.pdf`);
    };

    // --- Bulk Upload ---
    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const { data } = await API.post('/auth/bulk-register-teachers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.errors && data.errors.length > 0) {
                console.warn("Some rows failed:", data.errors);
                setMsg("Synced with some exceptions. Check console! ⚠️");
            } else {
                setMsg(data.message);
            }

            if (data.credentials && data.credentials.length > 0) {
                generateCredentialsPDF(data.credentials);
            }
            setTimeout(() => navigate('/admin/manage-users'), 3000);
        } catch (err) {
            console.error(err);
            setMsg("Faculty Sync Failed! Neural link broken 🛡️");
        } finally {
            setLoading(false);
            e.target.value = null; 
        }
    };

    // --- Manual Add Form ---
    const handleAddTeacher = async (e) => {
        e.preventDefault();
        
        if(teacherData.password !== confirmPass) {
            alert("Passwords do not match!");
            return;
        }

        if(!teacherData.dob) {
            alert("Please select a Date of Birth!");
            return;
        }

        setLoading(true);
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const processedData = {
                ...teacherData,
                role: isFinance ? 'finance' : 'teacher',
                schoolId: currentUser?.schoolId,
                assignedClass: isFinance ? null : (teacherData.assignedClass?.trim().toUpperCase() || null),
                subjects: isFinance ? [] : (teacherData.subjects ? teacherData.subjects.split(',').map(s => s.trim()) : [])
            };

            const { data } = await API.post('/auth/register', processedData);
            setMsg(`${isFinance ? 'Finance Personnel' : 'Faculty Node'} Active: EMP ID ${data.generatedId} ⚡`);
            setTimeout(() => navigate('/admin/manage-users'), 2000);
        } catch (err) {
            alert(err.response?.data?.message || "Error adding teacher");
        } finally {
            setLoading(false);
        }
    };

    // --- Custom Calendar Logic ---
    const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const blankDays = Array(firstDayOfMonth).fill(null);
    const monthDays = Array.from({length: daysInMonth}, (_, i) => i + 1);
    const yearsArray = Array.from({length: 2005 - 1950 + 1}, (_, i) => 1950 + i).reverse(); // Teachers logic

    const handleDayClick = (day) => {
        const formattedMonth = String(calDate.getMonth() + 1).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const formattedDate = `${calDate.getFullYear()}-${formattedMonth}-${formattedDay}`;
        setTeacherData({...teacherData, dob: formattedDate});
        setIsCalOpen(false); 
    };

    const closeAllDropdowns = () => {
        setIsCalOpen(false);
        setIsGenderOpen(false);
        setIsClassDropdownOpen(false);
    };

    // Staggered Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            
            {/* Top Header */}
            <div className="bg-[#42A5F5] px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10">
                <button onClick={() => navigate(-1)} className="p-3 bg-white/20 border border-white/30 rounded-2xl text-white shadow-sm active:scale-95 transition-all mb-8">
                    <ArrowLeft size={24} />
                </button>
                <div className="text-center text-white">
                    <h1 className="text-3xl font-black italic tracking-tight uppercase">Access Matrix</h1>
                    <p className="text-[14px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Enroll Faculty Node</p>
                </div>
            </div>

            <div className="px-5 md:px-8 -mt-12 relative z-20 max-w-5xl mx-auto">
                
                {/* --- BULK IMPORT SECTION --- */}
                <div className="bg-white p-8 rounded-[3rem] border border-blue-50 text-center space-y-4 shadow-xl mb-10 ring-1 ring-slate-100">
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-4 bg-blue-50 rounded-[2rem] text-[#42A5F5] shadow-inner border border-blue-100">
                            <Zap size={28} className="animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter leading-none mt-2">Faculty Bulk Import</h3>
                        <p className="text-[14px] font-bold text-slate-400 px-6 uppercase tracking-wider">Upload CSV to add a whole department</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-4">
                        <input type="file" id="bulkTeacherFile" hidden accept=".csv" onChange={handleBulkUpload} disabled={loading} />
                        
                        <button
                            type="button"
                            onClick={() => {
                                const csvContent = "name,role,subjects,assignedClass,fatherName,motherName,dob,gender,religion,phone,pincode,district,state,fullAddress\n" +
                                                   "Ravi Kumar,teacher,Math,10-C,Deshwal,Neeta,1990-05-15,Male,Hindu,9876543210,110001,Delhi,Delhi,Noida Sec 15";
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'EduFlowAI_Faculty_Template.csv';
                                a.click();
                            }}
                            className="flex-1 py-4 bg-slate-50 text-[#42A5F5] rounded-[2rem] font-black uppercase text-[13px] tracking-widest shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={18} /> Blueprint (CSV)
                        </button>

                        <label
                            htmlFor="bulkTeacherFile"
                            className={`flex-1 py-4 bg-[#42A5F5] text-white rounded-[2rem] font-black uppercase text-[13px] tracking-widest shadow-lg shadow-blue-200 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : 'hover:-translate-y-1'}`}
                        >
                            <UserCheck size={18} /> Upload Data
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-8 px-4 opacity-50">
                    <div className="h-[2px] flex-1 bg-slate-300 rounded-full"></div>
                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-[0.4em]">Manual Override</span>
                    <div className="h-[2px] flex-1 bg-slate-300 rounded-full"></div>
                </div>

                {/* --- MANUAL ENTRY FORM --- */}
                <form 
                    onSubmit={handleAddTeacher} 
                    autoComplete="off" // Strict Autofill Block
                    className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 ring-1 ring-slate-50"
                >
                    {/* Hidden inputs to trick browser autofill */}
                    <input type="text" style={{ display: 'none' }} />
                    <input type="password" style={{ display: 'none' }} />

                    <LayoutGroup>
                        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
                            
                            {/* --- FINANCE TOGGLE --- */}
                            <motion.div layout variants={itemVariants}>
                                {!financeExists && (
                                    <div className="flex items-center gap-4 bg-blue-50/50 p-5 rounded-3xl border border-blue-100 cursor-pointer shadow-sm hover:bg-blue-50 transition-colors"
                                        onClick={() => setIsFinance(!isFinance)}>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isFinance ? 'bg-[#42A5F5] border-[#42A5F5]' : 'border-slate-300'}`}>
                                            {isFinance && <Check size={14} className="text-white" />}
                                        </div>
                                        <label className="text-[15px] font-black uppercase italic text-[#42A5F5] cursor-pointer">
                                            Assign as Finance Admin (Accountant)
                                        </label>
                                    </div>
                                )}

                                {financeExists && (
                                    <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm flex items-center justify-center gap-3">
                                        <Zap size={18} className="text-amber-500"/>
                                        <p className="text-[13px] text-amber-700 font-black italic uppercase">
                                            Finance Faculty already deployed for your School.
                                        </p>
                                    </div>
                                )}
                            </motion.div>

                            {/* SECTION 1: SYSTEM CREDENTIALS */}
                            <motion.div layout variants={itemVariants} className="space-y-6 bg-blue-50/30 p-6 rounded-[2.5rem] border border-blue-50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-xl text-[#42A5F5]"><Lock size={18}/></div>
                                    <h3 className="text-[16px] font-black uppercase tracking-widest text-slate-800">System Credentials</h3>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider flex items-center gap-2">
                                        <Mail size={14}/> Faculty Email
                                    </label>
                                    <input 
                                        type="email" 
                                        name={`faculty_email_${Math.random()}`}
                                        autoComplete="new-password"
                                        placeholder="faculty@eduflow.ai" 
                                        className="w-full p-4 bg-white rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                                        onChange={(e) => setTeacherData({ ...teacherData, email: e.target.value })} required 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider flex items-center gap-2">
                                            <Fingerprint size={14}/> Set Password
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type={showPass ? "text" : "password"}
                                                name={`faculty_pass_${Math.random()}`}
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                className="w-full p-4 pr-14 bg-white rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-inner tracking-widest"
                                                onChange={(e) => setTeacherData({ ...teacherData, password: e.target.value })} required
                                            />
                                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#42A5F5] transition-colors">
                                                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">
                                            Confirm Password
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type={showPass ? "text" : "password"}
                                                name={`faculty_pass_confirm_${Math.random()}`}
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                className={`w-full p-4 pr-14 bg-white rounded-[1.5rem] border outline-none text-[16px] font-bold text-slate-700 transition-all shadow-inner tracking-widest ${confirmPass && teacherData.password !== confirmPass ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' : 'border-slate-200 focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50'}`}
                                                value={confirmPass}
                                                onChange={(e) => setConfirmPass(e.target.value)} required
                                            />
                                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#42A5F5] transition-colors">
                                                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        {confirmPass && teacherData.password !== confirmPass && (
                                            <p className="text-[11px] text-rose-500 font-black uppercase mt-1 ml-4 italic">Passwords do not match! ⚠️</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* SECTION 2: PROFESSIONAL IDENTITY */}
                            <motion.div layout variants={itemVariants} className="space-y-6">
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><BookOpen size={18}/></div>
                                    <h3 className="text-[16px] font-black uppercase tracking-widest text-slate-800">Professional Identity</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Full Name</label>
                                        <input type="text" placeholder="e.g. Dr. Ravi Kumar" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                            onChange={(e) => setTeacherData({ ...teacherData, name: e.target.value })} required />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider flex items-center gap-2">
                                            <Phone size={14}/> Mobile Number
                                        </label>
                                        <input type="text" placeholder="10 Digit Number" maxLength="10" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                                            onChange={(e) => setTeacherData({ ...teacherData, phone: e.target.value.replace(/\D/g, "") })} required />
                                    </div>

                                    {/* Only show these if NOT finance */}
                                    {!isFinance && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider flex items-center gap-2">
                                                    Assign Subjects
                                                </label>
                                                <input type="text" placeholder="Math, Physics, English..." className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                                    onChange={(e) => setTeacherData({ ...teacherData, subjects: e.target.value })} />
                                            </div>

                                            {/* 🔥 FLOATING ASSIGNED CLASS DROPDOWN 🔥 */}
                                            <div className={`space-y-2 relative ${isClassDropdownOpen ? 'z-[100]' : 'z-10'}`}>
                                                <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Assign Class (Optional)</label>
                                                
                                                <div 
                                                    onClick={() => { closeAllDropdowns(); setIsClassDropdownOpen(!isClassDropdownOpen); }}
                                                    className={`w-full p-4 bg-slate-50 rounded-[1.5rem] border ${isClassDropdownOpen ? 'border-[#42A5F5] ring-4 ring-blue-50 bg-white' : 'border-slate-200'} flex items-center justify-between cursor-pointer transition-all shadow-inner`}
                                                >
                                                    <span className={`text-[16px] font-black uppercase ${teacherData.assignedClass ? 'text-slate-700' : 'text-slate-400'}`}>
                                                        {teacherData.assignedClass || "Select Vacant Class"}
                                                    </span>
                                                    <PlusCircle size={20} className="text-[#42A5F5]" />
                                                </div>

                                                <AnimatePresence>
                                                    {isClassDropdownOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-[110]" onClick={() => setIsClassDropdownOpen(false)} />
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                                                                className="absolute left-0 right-0 top-[105%] z-[120] bg-white border border-blue-100 rounded-2xl shadow-2xl overflow-hidden max-h-60 custom-scrollbar"
                                                            >
                                                                {availableClasses.length > 0 ? (
                                                                    availableClasses.map((cls) => (
                                                                        <div key={cls} onClick={() => { setTeacherData({ ...teacherData, assignedClass: cls }); setIsClassDropdownOpen(false); }} className={`p-4 text-[14px] font-black italic uppercase transition-colors cursor-pointer border-b border-slate-50 last:border-none ${teacherData.assignedClass === cls ? 'bg-blue-50 text-[#42A5F5]' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                                            {cls}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-4 text-center text-slate-400 font-bold italic">No vacant classes</div>
                                                                )}
                                                                <div onClick={() => { setTeacherData({ ...teacherData, assignedClass: '' }); setIsClassDropdownOpen(false); }} className="p-3 bg-slate-800 text-white text-center text-[12px] font-black uppercase cursor-pointer hover:bg-slate-700 transition-colors">
                                                                    Clear Selection
                                                                </div>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>

                            {/* SECTION 3: DEMOGRAPHICS & CUSTOM CALENDAR */}
                            <motion.div layout variants={itemVariants} className={`space-y-6 relative ${(isGenderOpen || isCalOpen) ? 'z-[100]' : 'z-10'}`}>
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><Users size={18}/></div>
                                    <h3 className="text-[16px] font-black uppercase tracking-widest text-slate-800">Demographics</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Father's Name</label>
                                        <input type="text" placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                            onChange={(e) => setTeacherData({ ...teacherData, fatherName: e.target.value })} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Mother's Name</label>
                                        <input type="text" placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                            onChange={(e) => setTeacherData({ ...teacherData, motherName: e.target.value })} required />
                                    </div>
                                    
                                    {/* 🔥 FLOATING GENDER DROPDOWN 🔥 */}
                                    <div className="space-y-2 relative">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Gender</label>
                                        <div 
                                            onClick={() => { closeAllDropdowns(); setIsGenderOpen(!isGenderOpen); }} 
                                            className={`w-full p-4 bg-slate-50 rounded-[1.5rem] border ${isGenderOpen ? 'border-[#42A5F5] ring-4 ring-blue-50 bg-white' : 'border-slate-200'} flex items-center justify-between cursor-pointer transition-all shadow-inner`}
                                        >
                                            <span className="text-[16px] font-black text-slate-700 uppercase">{teacherData.gender}</span>
                                            <div className={`transition-transform duration-300 ${isGenderOpen ? 'rotate-180' : 'rotate-0'}`}><PlusCircle size={20} className="text-[#42A5F5]" /></div>
                                        </div>
                                        
                                        <AnimatePresence>
                                            {isGenderOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[110]" onClick={() => setIsGenderOpen(false)} />
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                                                        className="absolute left-0 right-0 top-[105%] bg-white border border-blue-100 rounded-2xl shadow-2xl overflow-hidden z-[120]"
                                                    >
                                                        {["Male", "Female", "Other"].map((opt) => (
                                                            <div key={opt} onClick={() => { setTeacherData({ ...teacherData, gender: opt }); setIsGenderOpen(false); }} className="p-4 text-[14px] font-black uppercase text-slate-600 hover:bg-blue-50 hover:text-[#42A5F5] cursor-pointer transition-colors border-b border-slate-50 last:border-none">
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Religion</label>
                                        <input type="text" placeholder="e.g. Hindu" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                            onChange={(e) => setTeacherData({ ...teacherData, religion: e.target.value })} required />
                                    </div>
                                </div>

                                {/* 🔥 FLOATING BOLD CALENDAR WIDGET 🔥 */}
                                <div className="space-y-2 pt-4 relative">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider flex items-center gap-2">
                                        <CalendarDays size={14}/> Date of Birth
                                    </label>
                                    
                                    <div 
                                        onClick={() => { closeAllDropdowns(); setIsCalOpen(!isCalOpen); }}
                                        className={`w-full p-5 bg-slate-50 rounded-[1.5rem] border ${isCalOpen ? 'border-[#42A5F5] ring-4 ring-blue-50 bg-white' : 'border-slate-200'} cursor-pointer transition-all shadow-inner flex items-center justify-between`}
                                    >
                                        <span className={`text-[18px] font-black tracking-widest ${teacherData.dob ? 'text-[#42A5F5]' : 'text-slate-400'}`}>
                                            {teacherData.dob ? new Date(teacherData.dob).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).toUpperCase() : 'SELECT DATE'}
                                        </span>
                                        <CalendarDays size={24} className={teacherData.dob ? 'text-[#42A5F5]' : 'text-slate-400'}/>
                                    </div>

                                    {/* Absolute Floating Calendar Box */}
                                    <AnimatePresence>
                                        {isCalOpen && (
                                            <>
                                                {/* Backdrop */}
                                                <div className="fixed inset-0 z-[110]" onClick={() => setIsCalOpen(false)} />
                                                {/* Floating Calendar */}
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10 }} 
                                                    animate={{ opacity: 1, y: 0 }} 
                                                    exit={{ opacity: 0, y: -10 }} 
                                                    className="absolute left-0 md:w-3/4 lg:w-1/2 top-[105%] z-[120] bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 overflow-hidden"
                                                >
                                                    {/* Calendar Header */}
                                                    <div className="flex justify-between items-center mb-6">
                                                        {calView === 'days' ? (
                                                            <>
                                                                <button type="button" onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-[#42A5F5] rounded-2xl transition-colors"><ChevronLeft size={24}/></button>
                                                                <div 
                                                                    onClick={() => setCalView('years')}
                                                                    className="text-[20px] font-black uppercase text-slate-800 cursor-pointer hover:text-[#42A5F5] transition-colors"
                                                                >
                                                                    {monthNames[calDate.getMonth()]} {calDate.getFullYear()}
                                                                </div>
                                                                <button type="button" onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-[#42A5F5] rounded-2xl transition-colors"><ChevronRight size={24}/></button>
                                                            </>
                                                        ) : (
                                                            <div className="w-full text-center text-[20px] font-black uppercase text-slate-800">Select Year</div>
                                                        )}
                                                    </div>

                                                    {/* Calendar Body */}
                                                    {calView === 'days' ? (
                                                        <div>
                                                            <div className="grid grid-cols-7 gap-2 mb-4">
                                                                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                                                    <div key={d} className="text-center text-[12px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-2">
                                                                {blankDays.map((_, i) => <div key={`blank-${i}`} />)}
                                                                {monthDays.map(day => {
                                                                    const isSelected = teacherData.dob === `${calDate.getFullYear()}-${String(calDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                                                                    return (
                                                                        <button 
                                                                            type="button"
                                                                            key={day} 
                                                                            onClick={() => handleDayClick(day)}
                                                                            className={`h-12 rounded-[1rem] flex items-center justify-center text-[16px] font-black transition-all ${isSelected ? 'bg-[#42A5F5] text-white shadow-md scale-110' : 'text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-[#42A5F5]'}`}
                                                                        >
                                                                            {day}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto custom-scrollbar p-2">
                                                            {yearsArray.map(yr => (
                                                                <button 
                                                                    type="button"
                                                                    key={yr} 
                                                                    onClick={() => { setCalDate(new Date(yr, calDate.getMonth(), 1)); setCalView('days'); }}
                                                                    className={`p-4 rounded-[1.2rem] text-[16px] font-black transition-all ${calDate.getFullYear() === yr ? 'bg-[#42A5F5] text-white shadow-md' : 'text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-[#42A5F5]'}`}
                                                                >
                                                                    {yr}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                            {/* SECTION 4: ADDRESS NODE */}
                            <motion.div layout variants={itemVariants} className="space-y-6 relative z-10">
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><MapPin size={18}/></div>
                                    <h3 className="text-[16px] font-black uppercase tracking-widest text-slate-800">Location Node</h3>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Full Address</label>
                                    <textarea placeholder="House No, Street, Landmark..." className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner h-24 resize-none"
                                        onChange={(e) => setTeacherData({ ...teacherData, address: { ...teacherData.address, fullAddress: e.target.value } })} required />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Pincode</label>
                                        <input type="text" placeholder="6 Digits" maxLength="6" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                                            onChange={(e) => setTeacherData({ ...teacherData, address: { ...teacherData.address, pincode: e.target.value.replace(/\D/g, "") } })} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">District</label>
                                        <input type="text" placeholder="District" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                            onChange={(e) => setTeacherData({ ...teacherData, address: { ...teacherData.address, district: e.target.value } })} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">State</label>
                                        <input type="text" placeholder="State" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                            onChange={(e) => setTeacherData({ ...teacherData, address: { ...teacherData.address, state: e.target.value } })} required />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.button 
                                layout
                                variants={itemVariants}
                                type="submit" 
                                disabled={loading} 
                                className={`w-full py-6 rounded-[2rem] font-black text-[16px] uppercase tracking-widest shadow-xl transition-all mt-4 flex items-center justify-center gap-3 ${loading ? 'bg-slate-300 text-slate-500 shadow-none' : 'bg-[#42A5F5] text-white shadow-blue-200 hover:-translate-y-1 active:translate-y-0 active:scale-95'}`}
                            >
                                {loading ? "Transmitting data..." : <><Check size={20}/> Authorize Faculty Link</>}
                            </motion.button>

                        </motion.div>
                    </LayoutGroup>
                </form>
            </div >
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div >
    );
};

export default AddTeacher;
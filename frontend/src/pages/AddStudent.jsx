import React, { useState } from 'react';
import { 
    ArrowLeft, Zap, Eye, EyeOff, PlusCircle, Download, 
    User, Mail, Lock, Phone, BookOpen, Fingerprint, 
    Users, MapPin, CalendarDays, Check, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AddStudent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [confirmPass, setConfirmPass] = useState('');
    const [isGenderOpen, setIsGenderOpen] = useState(false);
    const [msg, setMsg] = useState('');
    
    // Custom Calendar States
    const [isCalOpen, setIsCalOpen] = useState(false);
    const [calView, setCalView] = useState('days'); // 'days' or 'years'
    const [calDate, setCalDate] = useState(new Date(2010, 0, 1)); 
    
    const [studentData, setStudentData] = useState({
        name: '', email: '', password: '', grade: '',
        fatherName: '', motherName: '', dob: '', gender: 'Male', religion: '', admissionNo: '',
        phone: '', address: { pincode: '', district: '', state: '', fullAddress: '' }
    });

    // --- PDF Generator ---
    const generateCredentialsPDF = (credentialsList) => {
        if (!credentialsList || credentialsList.length === 0) return;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.setTextColor(66, 165, 245); 
        doc.text("EduFlowAI - Student Identity & Access Matrix", 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("CONFIDENTIAL: Handover these credentials to the respective students/parents.", 14, 30);

        const tableBody = credentialsList.map((user, index) => [
            index + 1, user.name, user.grade, user.email, user.password
        ]);

        autoTable(doc, {
            startY: 38,
            head: [['S.No', 'Student Name', 'Class/Grade', 'Email (Login ID)', 'AI Password']],
            body: tableBody,
            headStyles: { fillColor: [66, 165, 245], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { textColor: [50, 50, 50] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        doc.save(`Student_Credentials_Batch_${new Date().getTime()}.pdf`);
    };

    // --- Bulk Upload ---
    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const { data } = await API.post('/auth/bulk-register-students', formData, {
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
            setMsg("Neural Link Failed during Bulk Sync! 🛡️");
        } finally {
            setLoading(false);
            e.target.value = null; 
        }
    };

    // --- Manual Add Form ---
    const handleAddStudent = async (e) => {
        e.preventDefault();
        
        if(studentData.password !== confirmPass) {
            alert("Passwords do not match!");
            return;
        }

        if(!studentData.dob) {
            alert("Please select a Date of Birth!");
            return;
        }

        setLoading(true);
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const processedData = {
                ...studentData,
                role: 'student',
                schoolId: currentUser?.schoolId
            };

            const { data } = await API.post('/users/add-student', processedData);

            setMsg(data.message || `Student enrolled: ID ${data.student?.enrollmentNo} ⚡`);
            setTimeout(() => navigate('/admin/manage-users'), 2000);
        } catch (err) {
            console.error("Enrollment Error:", err);
            alert(err.response?.data?.message || "Error adding student");
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
    const yearsArray = Array.from({length: new Date().getFullYear() - 1995 + 1}, (_, i) => 1995 + i).reverse();

    const handleDayClick = (day) => {
        const formattedMonth = String(calDate.getMonth() + 1).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const formattedDate = `${calDate.getFullYear()}-${formattedMonth}-${formattedDay}`;
        setStudentData({...studentData, dob: formattedDate});
        setIsCalOpen(false); 
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
                    <p className="text-[14px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Enroll New Student</p>
                </div>
            </div>

            <div className="px-5 md:px-8 -mt-12 relative z-20 max-w-5xl mx-auto">
                
                {/* --- BULK IMPORT SECTION --- */}
                <div className="bg-white p-8 rounded-[3rem] border border-blue-50 text-center space-y-4 shadow-xl mb-10 ring-1 ring-slate-100">
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-4 bg-blue-50 rounded-[2rem] text-[#42A5F5] shadow-inner border border-blue-100">
                            <Zap size={28} className="animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter leading-none mt-2">Neural Bulk Import</h3>
                        <p className="text-[14px] font-bold text-slate-400 px-6 uppercase tracking-wider">Upload CSV for batch processing</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-4">
                        <input type="file" id="bulkFile" hidden accept=".csv" onChange={handleBulkUpload} disabled={loading} />
                        
                        <button
                            type="button"
                            onClick={() => {
                                const csvContent = "name,grade,fatherName,motherName,dob,gender,religion,phone,admissionNo,pincode,district,state,fullAddress\n" +
                                    "Rahul Kumar,10-C,Sunil Kumar,Anita Devi,2010-05-15,Male,Hindu,9876543210,ADM001,110001,Delhi,Delhi,Noida Sec 15";
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'EduFlowAI_Student_Template.csv';
                                a.click();
                            }}
                            className="flex-1 py-4 bg-slate-50 text-[#42A5F5] rounded-[2rem] font-black uppercase text-[13px] tracking-widest shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={18} /> Blueprint (CSV)
                        </button>

                        <label
                            htmlFor="bulkFile"
                            className={`flex-1 py-4 bg-[#42A5F5] text-white rounded-[2rem] font-black uppercase text-[13px] tracking-widest shadow-lg shadow-blue-200 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : 'hover:-translate-y-1'}`}
                        >
                            <PlusCircle size={18} /> Upload Data
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
                    onSubmit={handleAddStudent} 
                    autoComplete="off" 
                    className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 ring-1 ring-slate-50"
                >
                    <input type="text" style={{ display: 'none' }} />
                    <input type="password" style={{ display: 'none' }} />

                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
                        
                        {/* SECTION 1: SYSTEM CREDENTIALS */}
                        <motion.div variants={itemVariants} className="space-y-6 bg-blue-50/30 p-6 rounded-[2.5rem] border border-blue-50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 rounded-xl text-[#42A5F5]"><Lock size={18}/></div>
                                <h3 className="text-[16px] font-black uppercase tracking-widest text-slate-800">System Credentials</h3>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider flex items-center gap-2">
                                    <Mail size={14}/> Student Email
                                </label>
                                <input 
                                    type="email" 
                                    name={`student_email_${Math.random()}`}
                                    autoComplete="new-password"
                                    placeholder="student@eduflow.ai" 
                                    className="w-full p-4 bg-white rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                                    onChange={(e) => setStudentData({ ...studentData, email: e.target.value })} required 
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
                                            name={`student_pass_${Math.random()}`}
                                            autoComplete="new-password"
                                            placeholder="••••••••"
                                            className="w-full p-4 pr-14 bg-white rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-inner tracking-widest"
                                            onChange={(e) => setStudentData({ ...studentData, password: e.target.value })} required
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
                                            name={`student_pass_confirm_${Math.random()}`}
                                            autoComplete="new-password"
                                            placeholder="••••••••"
                                            className={`w-full p-4 pr-14 bg-white rounded-[1.5rem] border outline-none text-[16px] font-bold text-slate-700 transition-all shadow-inner tracking-widest ${confirmPass && studentData.password !== confirmPass ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' : 'border-slate-200 focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50'}`}
                                            value={confirmPass}
                                            onChange={(e) => setConfirmPass(e.target.value)} required
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#42A5F5] transition-colors">
                                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {confirmPass && studentData.password !== confirmPass && (
                                        <p className="text-[11px] text-rose-500 font-black uppercase mt-1 ml-4 italic">Passwords do not match! ⚠️</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* SECTION 2: PERSONAL IDENTITY */}
                        <motion.div variants={itemVariants} className="space-y-6">
                            <div className="flex items-center gap-3 mb-2 px-2">
                                <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><User size={18}/></div>
                                <h3 className="text-[16px] font-black uppercase tracking-widest text-slate-800">Personal Identity</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Full Name</label>
                                    <input type="text" placeholder="e.g. Rahul Sharma" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                        onChange={(e) => setStudentData({ ...studentData, name: e.target.value })} required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider flex items-center gap-2">
                                        <Phone size={14}/> Mobile Number
                                    </label>
                                    <input type="text" placeholder="10 Digit Number" maxLength="10" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                                        onChange={(e) => setStudentData({ ...studentData, phone: e.target.value.replace(/\D/g, "") })} required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider flex items-center gap-2">
                                        <BookOpen size={14}/> Target Class
                                    </label>
                                    <input type="text" placeholder="e.g. 10-A" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                        onChange={(e) => setStudentData({ ...studentData, grade: e.target.value })} required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Admission No.</label>
                                    <input type="text" placeholder="ADM-2026-001" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                        onChange={(e) => setStudentData({ ...studentData, admissionNo: e.target.value })} required />
                                </div>
                            </div>
                        </motion.div>

                        {/* SECTION 3: DEMOGRAPHICS & CUSTOM CALENDAR */}
                        {/* 🔥 FIX 1: DYNAMIC Z-INDEX PREVENTS OVERLAPS 🔥 */}
                        <motion.div variants={itemVariants} className={`space-y-6 relative ${(isGenderOpen || isCalOpen) ? 'z-[100]' : 'z-10'}`}>
                            <div className="flex items-center gap-3 mb-2 px-2">
                                <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><Users size={18}/></div>
                                <h3 className="text-[16px] font-black uppercase tracking-widest text-slate-800">Demographics</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Father's Name</label>
                                    <input type="text" placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                        onChange={(e) => setStudentData({ ...studentData, fatherName: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Mother's Name</label>
                                    <input type="text" placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                        onChange={(e) => setStudentData({ ...studentData, motherName: e.target.value })} required />
                                </div>
                                
                                {/* 🔥 FLOATING GENDER DROPDOWN 🔥 */}
                                <div className="space-y-2 relative">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Gender</label>
                                    <div 
                                        onClick={() => { setIsGenderOpen(!isGenderOpen); setIsCalOpen(false); }} 
                                        className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 flex items-center justify-between cursor-pointer active:scale-95 transition-all shadow-inner focus:ring-4 focus:ring-blue-50"
                                    >
                                        <span className="text-[16px] font-black text-slate-700 uppercase">{studentData.gender}</span>
                                        <div className={`transition-transform duration-300 ${isGenderOpen ? 'rotate-180' : 'rotate-0'}`}><PlusCircle size={20} className="text-[#42A5F5]" /></div>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {isGenderOpen && (
                                            <>
                                                {/* Backdrop */}
                                                <div className="fixed inset-0 z-[110]" onClick={() => setIsGenderOpen(false)} />
                                                {/* Floating Menu */}
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                                                    className="absolute left-0 right-0 top-[105%] bg-white border border-blue-100 rounded-2xl shadow-2xl overflow-hidden z-[120]"
                                                >
                                                    {["Male", "Female", "Other"].map((opt) => (
                                                        <div key={opt} onClick={() => { setStudentData({ ...studentData, gender: opt }); setIsGenderOpen(false); }} className="p-4 text-[14px] font-black uppercase text-slate-600 hover:bg-blue-50 hover:text-[#42A5F5] cursor-pointer transition-colors border-b border-slate-50 last:border-none">
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
                                        onChange={(e) => setStudentData({ ...studentData, religion: e.target.value })} required />
                                </div>
                            </div>

                            {/* 🔥 FLOATING BOLD CALENDAR WIDGET 🔥 */}
                            <div className="space-y-2 pt-4 relative">
                                <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider flex items-center gap-2">
                                    <CalendarDays size={14}/> Date of Birth
                                </label>
                                
                                <div 
                                    onClick={() => { setIsCalOpen(!isCalOpen); setIsGenderOpen(false); }}
                                    className={`w-full p-5 bg-slate-50 rounded-[1.5rem] border ${isCalOpen ? 'border-[#42A5F5] ring-4 ring-blue-50 bg-white' : 'border-slate-200'} cursor-pointer transition-all shadow-inner flex items-center justify-between`}
                                >
                                    <span className={`text-[18px] font-black tracking-widest ${studentData.dob ? 'text-[#42A5F5]' : 'text-slate-400'}`}>
                                        {studentData.dob ? new Date(studentData.dob).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}).toUpperCase() : 'SELECT DATE'}
                                    </span>
                                    <CalendarDays size={24} className={studentData.dob ? 'text-[#42A5F5]' : 'text-slate-400'}/>
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
                                                                const isSelected = studentData.dob === `${calDate.getFullYear()}-${String(calDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
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
                        <motion.div variants={itemVariants} className="space-y-6 relative z-10">
                            <div className="flex items-center gap-3 mb-2 px-2">
                                <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><MapPin size={18}/></div>
                                <h3 className="text-[16px] font-black uppercase tracking-widest text-slate-800">Location Node</h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Full Address</label>
                                <textarea placeholder="House No, Street, Landmark..." className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner h-24 resize-none"
                                    onChange={(e) => setStudentData({ ...studentData, address: { ...studentData.address, fullAddress: e.target.value } })} required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">Pincode</label>
                                    <input type="text" placeholder="6 Digits" maxLength="6" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                                        onChange={(e) => setStudentData({ ...studentData, address: { ...studentData.address, pincode: e.target.value.replace(/\D/g, "") } })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">District</label>
                                    <input type="text" placeholder="District" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                        onChange={(e) => setStudentData({ ...studentData, address: { ...studentData.address, district: e.target.value } })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] text-slate-500 ml-2 font-black uppercase tracking-wider">State</label>
                                    <input type="text" placeholder="State" className="w-full p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 outline-none text-[16px] font-bold text-slate-700 focus:bg-white focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all uppercase shadow-inner"
                                        onChange={(e) => setStudentData({ ...studentData, address: { ...studentData.address, state: e.target.value } })} required />
                                </div>
                            </div>
                        </motion.div>

                        <motion.button 
                            variants={itemVariants}
                            type="submit" 
                            disabled={loading} 
                            className={`w-full py-6 rounded-[2rem] font-black text-[16px] uppercase tracking-widest shadow-xl transition-all mt-4 flex items-center justify-center gap-3 ${loading ? 'bg-slate-300 text-slate-500 shadow-none' : 'bg-[#42A5F5] text-white shadow-blue-200 hover:-translate-y-1 active:translate-y-0 active:scale-95'}`}
                        >
                            {loading ? "Transmitting data..." : <><Check size={20}/> Sync Student Link</>}
                        </motion.button>

                    </motion.div>
                </form>
            </div >
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div >
    );
};

export default AddStudent;
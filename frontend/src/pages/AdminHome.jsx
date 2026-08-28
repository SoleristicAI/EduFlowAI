import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Megaphone, PlusCircle, Database, X, MessageSquare, UserCheck, Bot, ClipboardCheck, Activity, BarChart3, ClipboardList, Zap, FileText, Download, Calendar, ArrowRight, ShieldCheck,Bus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';
import { motion } from 'framer-motion';

const AdminHome = ({ searchQuery }) => {
    const navigate = useNavigate();
    const [showTeacherForm, setShowTeacherForm] = useState(false);
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFinance, setIsFinance] = useState(false);
    const [msg, setMsg] = useState('');
    const [liveStats, setLiveStats] = useState({ students: 0, teachers: 0, fees: 0 });
    
    // Logo State
    const [hasLogo, setHasLogo] = useState(false);

    useEffect(() => {
        checkLogoStatus();
    }, []);

    const checkLogoStatus = async () => {
        try {
            const { data } = await API.get('/school/logo');
            setHasLogo(!!data.logo); 
        } catch (err) {
            console.log("Failed to verify institutional logo status.");
        }
    };

    useEffect(() => {
        const fetchLiveStats = async () => {
            try {
                const { data } = await API.get('/users/admin/live-stats');
                setLiveStats({
                    students: data.totalStudents,
                    teachers: data.totalTeachers,
                    fees: data.totalFees
                });
            } catch (err) { console.error("Stats Fetch Error", err); }
        };
        fetchLiveStats();
    }, []);

    const [subData, setSubData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [teacherData, setTeacherData] = useState({
        name: '', email: '', password: '', subjects: '', assignedClass: '',
        fatherName: '', motherName: '', dob: '', gender: 'Male', religion: '',
        phone: '', address: { pincode: '', district: '', state: '', fullAddress: '' }
    });

    const [studentData, setStudentData] = useState({
        name: '', email: '', password: '', grade: '',
        fatherName: '', motherName: '', dob: '', gender: 'Male', religion: '', admissionNo: '',
        phone: '', address: { pincode: '', district: '', state: '', fullAddress: '' }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: sub } = await API.get('/school/subscription-status');
                setSubData(sub.subscription);
                const { data: txs } = await API.get('/school/transactions');
                setTransactions(txs);
            } catch (err) { console.error("Data Fetch Error", err); }
        };
        fetchData();
    }, []);

    const downloadInvoice = async (txId, txNumber) => {
        try {
            const response = await API.get(`/school/invoice/${txId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${txNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) { alert("Could not download invoice."); }
    };

    const handleAdvancePayment = async () => {
        if (!window.confirm("Confirm Advance Payment for next month?")) return;
        setLoading(true);
        try {
            const { data } = await API.post('/school/pay-advance');
            setMsg(data.message);
            setSubData(data.subscription);
            const { data: updatedTxs } = await API.get('/school/transactions');
            setTransactions(updatedTxs);
        } catch (err) { alert("Payment Gateway Simulated."); }
        finally { setLoading(false); }
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const sId = currentUser?.schoolId;

            const processedData = {
                ...teacherData,
                role: isFinance ? 'finance' : 'teacher',
                schoolId: sId,
                assignedClass: isFinance ? null : (teacherData.assignedClass?.trim().toUpperCase() || null),
                subjects: isFinance ? [] : (teacherData.subjects ? teacherData.subjects.split(',').map(s => s.trim()) : [])
            };

            const { data } = await API.post('/auth/register', processedData);
            setMsg(`${isFinance ? 'Finance personnel' : 'Faculty node'} active: Emp id ${data.generatedId} ⚡`);
            setShowTeacherForm(false);
            setIsFinance(false);
            setTeacherData({
                name: '', email: '', password: '', subjects: '', assignedClass: '',
                fatherName: '', motherName: '', dob: '', gender: 'Male', religion: '',
                phone: '', address: { pincode: '', district: '', state: '', fullAddress: '' }
            });
        } catch (err) { alert(err.response?.data?.message || "Error adding teacher"); } finally { setLoading(false); }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const sId = currentUser?.schoolId;

            const processedData = {
                ...studentData,
                role: 'student',
                schoolId: sId,
                address: {
                    pincode: studentData.address.pincode,
                    district: studentData.address.district,
                    state: studentData.address.state,
                    fullAddress: studentData.address.fullAddress
                }
            };

            const { data } = await API.post('/auth/register', processedData);
            setMsg(`Student enrolled: Id ${data.generatedId} ⚡`);
            setShowStudentForm(false);
            setStudentData({
                name: '', email: '', password: '', grade: '',
                fatherName: '', motherName: '', dob: '', gender: 'Male', religion: '', admissionNo: '',
                phone: '', address: { pincode: '', district: '', state: '', fullAddress: '' }
            });
        } catch (err) { alert(err.response?.data?.message || "Error adding student"); } finally { setLoading(false); }
    };

    // 🔥 Premium Grid Stats Array (Updated for separate cards) 🔥
    const adminStats = [
        {
            label: 'Total students',
            value: liveStats.students.toLocaleString(),
            icon: <Users size={28} />,
            bg: 'bg-emerald-50',
            text: 'text-emerald-500'
        },
        {
            label: 'Total teachers',
            value: liveStats.teachers.toLocaleString(),
            icon: <Bot size={28} />,
            bg: 'bg-violet-50',
            text: 'text-violet-500'
        },
        {
            label: 'Fees collected',
            value: `₹${liveStats.fees >= 100000 ? (liveStats.fees / 100000).toFixed(1) + 'L' : liveStats.fees.toLocaleString()}`,
            icon: <Activity size={28} />,
            bg: 'bg-blue-50',
            text: 'text-[#42A5F5]'
        },
    ];

    // 🔥 Modules mapped to Image Design (Added btnText, iconBg, btnColor) 🔥
    const managementModules = [
        { id: 'add-student', title: 'Classes & Students', btnText: 'Manage Students', icon: <PlusCircle size={24} />, desc: 'Enroll new students', iconBg: 'bg-blue-50 text-blue-500', btnColor: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200' },
        { id: 'add-staff', title: 'Manage staff', btnText: 'Manage Teachers', icon: <Users size={24} />, desc: 'Assign roles & classes', iconBg: 'bg-indigo-50 text-indigo-500', btnColor: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200' },
        { id: 'attendance-report', title: 'Performance', btnText: 'View Reports', icon: <BarChart3 size={24} />, desc: 'Class wise performance', iconBg: 'bg-cyan-50 text-cyan-500', btnColor: 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-200' },
        { id: 'notice', title: 'Publish notice', btnText: 'Send Notice', icon: <Megaphone size={24} />, desc: 'Send notice to all', iconBg: 'bg-orange-50 text-orange-500', btnColor: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' },
        { id: 'notice-feed', title: 'Notice archive', btnText: 'View Archive', icon: <ClipboardList size={24} />, desc: 'Manage & delete notices', iconBg: 'bg-red-50 text-red-500', btnColor: 'bg-red-500 hover:bg-red-600 shadow-red-200' },
        { id: 'timetable', title: 'Timetable', btnText: 'Manage Matrix', icon: <Database size={24} />, desc: 'Schedule all classes', iconBg: 'bg-blue-50 text-[#42A5F5]', btnColor: 'bg-[#42A5F5] hover:bg-blue-600 shadow-blue-200' },
        { id: 'edit-timetable', title: 'Edit timetable', btnText: 'Edit Timetable', icon: <Database size={24} />, desc: 'Modify existing schedules', iconBg: 'bg-rose-50 text-rose-500', btnColor: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' },
        { id: 'faculty-tracking', title: 'Faculty schedule', btnText: 'Track Faculty', icon: <UserCheck size={24} />, desc: "View Teacher Schedules", iconBg: 'bg-emerald-50 text-emerald-500', btnColor: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' },
        { id: 'datesheet-engine', title: 'Datesheet Engine', btnText: 'Create Exams', icon: <Calendar size={24} />, desc: 'Exam scheduler', iconBg: 'bg-violet-50 text-violet-500', btnColor: 'bg-violet-500 hover:bg-violet-600 shadow-violet-200' },
        { id: 'admit-card', title: 'Admit Cards', btnText: 'Issue Cards', icon: <ClipboardCheck size={24} />, desc: 'Exam hall tickets', iconBg: 'bg-indigo-50 text-indigo-500', btnColor: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200' },
        { id: 'academic-calendar', title: 'Academic Calendar', btnText: 'View Calendar', icon: <Calendar size={24} />, desc: 'Manage holidays, exams & PTMs', iconBg: 'bg-rose-50 text-rose-500', btnColor: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' },
        { id: 'feedback-engine', title: 'Feedback Engine', btnText: 'View Feedback', icon: <MessageSquare size={24} />, desc: 'Request teacher evaluations', iconBg: 'bg-teal-50 text-teal-500', btnColor: 'bg-teal-500 hover:bg-teal-600 shadow-teal-200' },
        { id: 'manage-users', title: 'User Management', btnText: 'Manage Users', icon: <Users size={24} />, desc: 'Edit or Delete personnel', iconBg: 'bg-blue-50 text-[#42A5F5]', btnColor: 'bg-[#42A5F5] hover:bg-blue-600 shadow-blue-200' },
        { id: 'session-upgrade', title: 'Session upgrade', btnText: 'Upgrade Now', icon: <Zap size={24} />, desc: 'Promote students to next class', iconBg: 'bg-emerald-50 text-emerald-500', btnColor: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' },
        // { id: 'transport-setup', title: 'Transport Fleet', btnText: 'Manage Transport', icon: <Bus size={24} />, desc: 'Assign Incharge & Buses', iconBg: 'bg-amber-50 text-amber-500', btnColor: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'},
    ];

    // 🔥 DYNAMIC PREMIUM INJECTION 🔥
    // LocalStorage se check kar rahe hain ki is school ko transport feature allowed hai ya nahi
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const hasTransportAccess = currentUser?.schoolData?.hasTransportFeature || false;

    if (hasTransportAccess) {
        managementModules.push({
            id: 'transport-setup',
            title: 'Transport Fleet',
            btnText: 'Manage Transport',
            icon: <Bus size={24} />, 
            desc: 'Assign Incharge & Buses',
            iconBg: 'bg-amber-50 text-amber-500',
            btnColor: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
        });
    }

    return (
        // EXACT TOP MARGIN AS YOUR ORIGINAL CODE
        <div className="px-5 -mt-17 space-y-6 relative z-10 font-sans italic">

            {/* --- PREMIUM STATS CARDS (Matching Image Style) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {adminStats.map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-md border border-slate-100 flex items-center gap-6 transition-all"
                    >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${stat.bg} ${stat.text}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                {stat.label}
                            </p>
                            <p className="text-3xl font-black text-slate-800 tracking-tighter">
                                {stat.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- DYNAMIC SCHOOL LOGO MANAGER BUTTON --- */}
            <div className="flex justify-center mt-2 mb-4">
                <button
                    onClick={() => navigate('/admin/school-logo')}
                    className={`border-2 px-8 py-3 rounded-full font-black uppercase tracking-widest text-[13px] shadow-sm active:scale-95 transition-all flex items-center gap-3 ${hasLogo
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-emerald-100'
                        : 'bg-red-50/60 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 hover:shadow-red-100'
                        }`}
                >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${hasLogo ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                    </span>
                    <span>{hasLogo ? 'School Logo Verified' : 'Upload School Logo'}</span>
                </button>
            </div>

            {/* --- PREMIUM MODULES GRID (Matched with Photo) --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {managementModules
                    .filter(m => m.title.toLowerCase().includes(searchQuery?.toLowerCase() || ''))
                    .map((m, i) => (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                            key={i} 
                            onClick={() => {
                                if (m.id === 'manage-users') navigate('/admin/manage-users');
                                if (m.id === 'add-student') navigate('/admin/add-student');
                                if (m.id === 'add-staff') navigate('/admin/add-teacher');
                                if (m.id === 'timetable') navigate('/admin/timetable');
                                if (m.id === 'faculty-tracking') navigate('/admin/faculty-tracking');
                                if (m.id === 'fees') navigate('/admin/fees');
                                if (m.id === 'attendance-report') navigate('/admin/attendance-report');
                                if (m.id === 'notice') navigate('/admin/global-notice');
                                if (m.id === 'notice-feed') navigate('/notice-feed');
                                if (m.id === 'edit-timetable') navigate('/admin/edit-timetable');
                                if (m.id === 'datesheet-engine') navigate('/admin/datesheet');
                                if (m.id === 'admit-card') navigate('/admin/admit-card');
                                if (m.id === 'academic-calendar') navigate('/admin/academic-calendar');
                                if (m.id === 'feedback-engine') navigate('/admin/feedback');
                                if (m.id === 'session-upgrade') navigate('/admin/session-upgrade');
                                if (m.id === 'transport-setup') navigate('/admin/transport-setup');
                            }} 
                            className="bg-white rounded-[2rem] p-5 border border-slate-100 flex flex-col items-center text-center cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            {/* Circular Icon */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${m.iconBg}`}>
                                {m.icon}
                            </div>
                            
                            {/* Title & Desc */}
                            <h4 className="font-black text-slate-800 text-[16px] leading-tight italic tracking-tight mb-2">
                                {m.title}
                            </h4>
                            <p className="text-[12px] text-slate-400 font-bold italic tracking-tighter leading-snug flex-grow mb-5">
                                {m.desc}
                            </p>

                            {/* Full Width Colored Button */}
                            <div className={`w-full py-3 rounded-xl text-white font-black text-[12px] uppercase tracking-widest shadow-md transition-all ${m.btnColor}`}>
                                {m.btnText}
                            </div>
                        </motion.div>
                    ))}
            </div>

            {/* --- EXACT SAME SYSTEM STATUS FOOTER (NO EXTRA SPACE AT BOTTOM) --- */}
            <div className="bg-slate-800 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <h3 className="font-black text-[16px] uppercase italic tracking-tighter">System: Sovereign</h3>
                        </div>
                        <p className="text-[12px] text-white/40 font-black uppercase tracking-widest italic">Encrypted admin session active</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-3xl backdrop-blur-md border border-white/10">
                        <Activity className="text-[#42A5F5] animate-pulse" size={32} />
                    </div>
                </div>
            </div>

            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default AdminHome;
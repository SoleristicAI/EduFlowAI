import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Megaphone, PlusCircle, Database, X, Bot, ClipboardCheck, Activity, BarChart3, ClipboardList, Zap, FileText, Download, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';

const AdminHome = ({ searchQuery }) => {
    const navigate = useNavigate();
    const [showTeacherForm, setShowTeacherForm] = useState(false);
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFinance, setIsFinance] = useState(false);
    const [msg, setMsg] = useState('');
    const [liveStats, setLiveStats] = useState({ students: 0, teachers: 0, fees: 0 });
    // 1. Naya State (Add with other states)
    const [hasLogo, setHasLogo] = useState(false);

    // 2. Apne existing useEffect ke andar ya alag se ye chalwa de (Add around line 45)
    useEffect(() => {
        checkLogoStatus();
    }, []);

    // 3. Status fetch karne ka logic (Add before return)
    const checkLogoStatus = async () => {
        try {
            const { data } = await API.get('/school/logo');
            setHasLogo(!!data.logo); // Agar logo database mein hoga toh true, nahi toh false
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

    const adminStats = [
        {
            label: 'Total students',
            value: liveStats.students.toLocaleString(),
            icon: <Users size={20} />
        },
        {
            label: 'Total teachers',
            value: liveStats.teachers.toLocaleString(),
            icon: <Bot size={20} />
        },
        {
            label: 'Fees collected',
            value: `₹${liveStats.fees >= 100000
                ? (liveStats.fees / 100000).toFixed(1) + 'L'
                : liveStats.fees.toLocaleString()}`,
            icon: <Activity size={20} />
        },
    ];

    const managementModules = [
        { id: 'add-student', title: 'Add student', icon: <PlusCircle size={24} />, desc: 'Enroll new students', color: 'bg-blue-50 text-[#42A5F5] border-blue-100' },
        { id: 'add-staff', title: 'Manage staff', icon: <Users size={24} />, desc: 'Assign roles & classes', color: 'bg-indigo-50 text-indigo-500 border-indigo-100' },
        { id: 'attendance-report', title: 'Student performance', icon: <BarChart3 size={24} />, desc: 'Class wise performance', color: 'bg-cyan-50 text-cyan-500 border-cyan-100' },
        { id: 'notice', title: 'Publish notice', icon: <Megaphone size={24} />, desc: 'Send notice to all', color: 'bg-orange-50 text-orange-500 border-orange-100' },
        { id: 'notice-feed', title: 'Notice archive', icon: <ClipboardList size={24} />, desc: 'Manage & delete notices', color: 'bg-rose-50 text-rose-500 border-rose-100' },
        { id: 'timetable', title: 'Timetable', icon: <Database size={24} />, desc: 'Schedule all classes', color: 'bg-blue-50 text-[#42A5F5] border-blue-100' },
        { id: 'edit-timetable', title: 'Edit timetable', icon: <Database size={24} />, desc: 'Modify existing schedules', color: 'bg-rose-50 text-rose-500 border-rose-100' },
        { id: 'datesheet-engine', title: 'Generate datesheet', icon: <Calendar size={24} />, desc: 'Exam scheduler', color: 'bg-violet-50 text-violet-500 border-violet-100' },
        { id: 'admit-card', title: 'Publish Admit Card ', icon: <ClipboardCheck size={24} />, desc: 'Exam hall tickets', color: 'bg-indigo-50 text-indigo-500 border-indigo-100' },
        { id: 'academic-calendar', title: 'Academic Calendar', icon: <Calendar size={24} />, desc: 'Manage holidays, exams & PTMs', color: 'bg-rose-50 text-rose-500 border-rose-100' },
        { id: 'manage-users', title: 'Manage student and teacher', icon: <Users size={24} />, desc: 'Edit or Delete personnel', color: 'bg-blue-50 text-[#42A5F5] border-blue-100' },
    ];

    return (
        <div className="px-5 -mt-24 space-y-6  relative z-10 font-sans italic">

            {/* Subscription Card */}
            {/* <div className={`p-8 rounded-[3rem] border shadow-xl transition-all ${subData?.hasPaidAdvance ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={18} className={subData?.hasPaidAdvance ? 'text-emerald-500' : 'text-[#42A5F5]'} />
                            <h3 className="font-black text-slate-700 text-[14px] uppercase tracking-widest italic">Service subscription</h3>
                        </div>
                        <p className={`text-3xl font-black italic tracking-tighter ${subData?.hasPaidAdvance ? 'text-emerald-600' : 'text-[#42A5F5]'}`}>
                            ₹{subData?.monthlyFee || '0'} <span className="text-[12px] text-slate-400 uppercase">/ Month</span>
                        </p>
                        <p className="text-[12px] font-bold text-slate-400 mt-2 italic uppercase tracking-widest">Next billing: {subData?.nextPaymentDate ? new Date(subData.nextPaymentDate).toLocaleDateString('en-GB') : 'N/A'}</p>
                    </div>
                    <button 
                        onClick={handleAdvancePayment} 
                        disabled={loading || subData?.hasPaidAdvance} 
                        className={`px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all shadow-md ${subData?.hasPaidAdvance ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-[#42A5F5] text-white shadow-blue-100 active:scale-95'}`}
                    >
                        {subData?.hasPaidAdvance ? "Month secured" : "Pay advance"}
                    </button>
                </div>
                {subData?.hasPaidAdvance && (
                    <div className="mt-4 flex items-center gap-2 text-emerald-600">
                        <ShieldCheck size={14} />
                        <p className="text-[11px] font-black uppercase tracking-tighter italic">Automatic debit paused. System synchronized. ✅</p>
                    </div>
                )}
            </div> */}

            {/* Billing History */}
            {/* <div className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 mb-8 ml-2">
                    <FileText size={20} className="text-[#42A5F5]" />
                    <h3 className="text-[15px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Billing history</h3>
                </div>
                <div className="space-y-4">
                    {transactions.length > 0 ? (
                        transactions.map((tx, idx) => (
                            <div key={idx} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-[#42A5F5] transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="bg-white p-4 rounded-2xl text-[#42A5F5] border border-slate-100 shadow-sm"><CreditCard size={22} /></div>
                                    <div>
                                        <p className="text-slate-700 font-black text-[16px] uppercase italic tracking-tighter">{tx.month}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{tx.transactionId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-right">
                                    <div>
                                        <p className="text-[#42A5F5] font-black text-[18px] italic">₹{tx.amount}</p>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Secured</span>
                                    </div>
                                    <button onClick={() => downloadInvoice(tx._id, tx.transactionId)} className="bg-white p-3 rounded-xl text-slate-400 hover:text-[#42A5F5] border border-slate-100 transition-all shadow-sm"><Download size={18} /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-30 italic font-black text-[14px] uppercase tracking-widest text-slate-400">No transactions archived.</div>
                    )}
                </div>
            </div> */}

            {/* Stats */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-2xl grid grid-cols-3 gap-4 ring-1 ring-slate-100">
                {adminStats.map((stat, i) => (
                    <div key={i} className="text-center border-r last:border-0 border-slate-100 px-2">
                        <div className="flex justify-center text-[#42A5F5] mb-2">{stat.icon}</div>
                        <p className="text-[26px] font-black text-slate-800 leading-none tracking-tighter">
                            {stat.value}
                        </p>
                        <p className="text-[15px] font-black text-slate-400 uppercase mt-2 tracking-widest leading-none">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Modules */}
            <div className="space-y-4">
                <h3 className="text-[20px] font-black text-slate-900 uppercase tracking-[0.1em] ml-4 italic">Administrative panel</h3>
                {/* --- DYNAMIC SCHOOL LOGO MANAGER BUTTON (RED / GREEN BLIP) --- */}
                <div className="flex justify-center mt-4 mb-8">
                    <button
                        onClick={() => navigate('/admin/school-logo')}
                        className={`border-2 px-8 py-3 rounded-full font-black uppercase tracking-widest text-[13px] shadow-sm active:scale-95 transition-all flex items-center gap-3 ${hasLogo
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-emerald-100 hover:shadow-md'
                            : 'bg-red-50/60 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 hover:shadow-red-100 hover:shadow-md'
                            }`}
                    >
                        {/* Dynamic Icon Wrapper */}
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${hasLogo ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                            }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                        </span>

                        {/* Dynamic Text Indicator */}
                        <span>{hasLogo ? 'School Logo Verified' : 'Upload School Logo'}</span>
                    </button>
                </div>
                {managementModules
                    .filter(m => m.title.toLowerCase().includes(searchQuery?.toLowerCase() || ''))
                    .map((m, i) => (
                        <div key={i} onClick={() => {
                            if (m.id === 'manage-users') navigate('/admin/manage-users');
                            if (m.id === 'add-student') navigate('/admin/add-student');
                            if (m.id === 'add-staff') navigate('/admin/add-teacher');
                            if (m.id === 'timetable') navigate('/admin/timetable');
                            if (m.id === 'fees') navigate('/admin/fees');
                            if (m.id === 'attendance-report') navigate('/admin/attendance-report');
                            if (m.id === 'notice') navigate('/admin/global-notice');
                            if (m.id === 'notice-feed') navigate('/notice-feed');
                            if (m.id === 'edit-timetable') navigate('/admin/edit-timetable');
                            if (m.id === 'datesheet-engine') navigate('/admin/datesheet');
                            if (m.id === 'admit-card') navigate('/admin/admit-card');
                            if (m.id === 'academic-calendar') navigate('/admin/academic-calendar');
                        }} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group shadow-sm hover:shadow-md hover:border-blue-100">
                            <div className="flex items-center gap-5">
                                <div className={`${m.color} p-4 rounded-2xl border transition-all`}>{m.icon}</div>
                                <div>
                                    {/* Yahan se uppercase hata diya gaya hai */}
                                    <h4 className="font-black text-slate-700 text-[21px] leading-none italic tracking-tighter">{m.title}</h4>
                                    <p className="text-[16px] text-slate-400 mt-2 font-bold italic tracking-tighter leading-none">{m.desc}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-full border border-slate-100 text-slate-300 group-hover:text-[#42A5F5] group-hover:bg-blue-50 transition-all"><PlusCircle size={20} /></div>
                        </div>
                    ))}
            </div>

            {/* System Status Footer */}
            <div className="bg-slate-800 rounded-[3.5rem] p-8 text-white shadow-2xl relative overflow-hidden ">
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
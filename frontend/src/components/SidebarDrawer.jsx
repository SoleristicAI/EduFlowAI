import React, { useState, useEffect } from 'react';
import { Wallet, FileText, PieChart, AlertCircle, Clock, PlusCircle, User, ShieldCheck, HelpCircle, Settings, LayoutDashboard, Users, X, Cpu, ChevronRight, LogOut, CreditCard, Layers, Check, CheckSquare, CalendarDays, Video, Bot, Megaphone, MessageCircle, Calendar, TrendingUp, GraduationCap, Book, Database, ClipboardList, BarChart3, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../App.css';


const SidebarDrawer = ({ isOpen, onClose, user }) => {
    const navigate = useNavigate();
    // --- DAY 134: BACKGROUND SCROLL LOCK PROTOCOL ---
    useEffect(() => {
        if (isOpen) {
            // Background scroll disable
            document.body.style.overflow = 'hidden';
        } else {
            // Background scroll enable
            document.body.style.overflow = 'unset';
        }

        // Cleanup function: Agar component unmount ho jaye toh scroll wapas on ho jaye
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);
    const [showConfirm, setShowConfirm] = useState(false);
    // if (!isOpen) return null;


    const handleLogout = () => {
        const backup = localStorage.getItem('superadmin_backup');

        if (backup) {
            localStorage.setItem('user', backup);
            localStorage.removeItem('superadmin_backup');

            window.location.replace('/superadmin/dashboard');
        } else {
            localStorage.removeItem('user');

            window.location.replace('/login');
        }
    };

    const handleNavigation = (path) => {
        navigate(path);
        onClose();
    };
    const menuItems = user?.role === 'superadmin' ? [
        { icon: <LayoutDashboard size={20} />, label: 'Executive Hub', color: 'text-neon', path: '/superadmin/dashboard' },
        { icon: <User size={20} />, label: 'Master Account', color: 'text-neon', path: '/superadmin/account' },
        { icon: <ShieldCheck size={20} />, label: 'Technical Logs', color: 'text-cyan-400', path: '/superadmin/technical-logs' },
        { icon: <Settings size={20} />, label: 'Settings', color: 'text-white/40', path: '/settings' },
    ] : user?.role === 'finance' ? [
        { icon: <User size={20} />, label: 'My Account', color: 'text-white/40', path: '/my-account' },
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', color: 'text-neon', path: '/finance/dashboard' },
        { icon: <PlusCircle size={20} />, label: 'Add Payment', color: 'text-cyan-400', path: '/finance/add-payment' },
        { icon: <FileText size={20} />, label: 'Finance Reports', color: 'text-neon', path: '/finance/reports' },
        { icon: <Users size={20} />, label: 'Fees Tracker', color: 'text-orange-400', path: '/finance/fees-tracker' },
        { icon: <Layers size={20} />, label: 'Fee Setup', color: 'text-neon', path: '/finance/fee-setup' },
        { icon: <ShieldCheck size={20} />, label: 'Payment Gateway', color: 'text-emerald-400', path: '/finance/gateway' },
        { icon: <ShieldCheck size={20} />, label: 'Setting', color: 'text-neon', path: '/settings' },
    ] : user?.role === 'admin' ? [
        { icon: <User size={20} />, label: 'My Account', color: 'text-white/40', path: '/my-account' },
        // { icon: <LayoutDashboard size={20} />, label: 'Admin Hub', color: 'text-[#42A5F5]', path: '/admin/dashboard' },
        { icon: <PlusCircle size={20} />, label: 'Add Student', color: 'text-[#42A5F5]', path: '/admin/add-student' },
        { icon: <Users size={20} />, label: 'Manage Staff', color: 'text-indigo-500', path: '/admin/add-teacher' },
        { icon: <Database size={20} />, label: 'Timetable', color: 'text-[#42A5F5]', path: '/admin/timetable' },
        { icon: <Database size={20} />, label: 'Edit Timetable', color: 'text-rose-500', path: '/admin/edit-timetable' },
        { icon: <Users size={20} />, label: 'User Control', color: 'text-[#42A5F5]', path: '/admin/manage-users' },
        { icon: <Megaphone size={20} />, label: 'Publish Notice', color: 'text-orange-500', path: '/admin/global-notice' },
        { icon: <ClipboardList size={20} />, label: 'Notice Archive', color: 'text-rose-500', path: '/notice-feed' },
        { icon: <BarChart3 size={20} />, label: 'Performance', color: 'text-cyan-500', path: '/admin/attendance-report' },
        { icon: <ShieldCheck size={20} />, label: 'Settings', color: 'text-[#42A5F5]', path: '/settings' },

    ] : user?.role === 'teacher' ? [
        // --- DAY 136: SYNCED TEACHER MODULES ---
        { icon: <User size={20} />, label: 'My Account', color: 'text-white/40', path: '/my-account' },
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', color: 'text-neon', path: '/teacher/dashboard' },
        { icon: <CheckSquare size={20} />, label: 'Attendance', color: 'text-neon', path: '/teacher/attendance' },
        { icon: <CalendarDays size={20} />, label: 'Schedule', color: 'text-neon', path: '/timetable' },
        { icon: <PlusCircle size={20} />, label: 'Assignments', color: 'text-neon', path: '/teacher/assignments' },
        { icon: <Users size={20} />, label: 'Class List', color: 'text-neon', path: '/teacher/students' },
        { icon: <Video size={20} />, label: 'Live Class', color: 'text-neon', path: '/teacher/live-class' },
        { icon: <Bot size={20} />, label: 'Broadcast', color: 'text-neon', path: '/teacher/notices' },
        { icon: <Megaphone size={20} />, label: 'Notice Feed', color: 'text-neon', path: '/notice-feed' },
        { icon: <MessageCircle size={20} />, label: 'Support', color: 'text-neon', path: '/teacher/support' },
        { icon: <Layers size={20} />, label: 'Syllabus', color: 'text-neon', path: '/teacher/upload-syllabus' },
        { icon: <ShieldCheck size={20} />, label: 'Setting', color: 'text-neon', path: '/settings' },
    ] : user?.role === 'student' ? [
        { icon: <User size={20} />, label: 'My Account', color: 'text-neon', path: '/my-account' },
        { icon: <Calendar size={20} />, label: 'Attendance', color: 'text-neon', path: '/attendance' },
        { icon: <Clock size={20} />, label: 'TimeTable', color: 'text-neon', path: '/timetable' },
        { icon: <BookOpen size={20} />, label: 'Class Diary', color: 'text-neon', path: '/class-diary' },
        { icon: <CreditCard size={20} />, label: 'My Fees', color: 'text-neon', path: '/student/fees' },
        { icon: <Megaphone size={20} />, label: 'Notice Board', color: 'text-neon', path: '/notice-feed' },
        { icon: <FileText size={20} />, label: 'Assignments', color: 'text-white/60', path: '/assignments' },
        { icon: <TrendingUp size={20} />, label: 'Performance', color: 'text-white/60', path: '/performance' },
        { icon: <GraduationCap size={20} />, label: 'Exams', color: 'text-white/60', path: '/exams' },
        { icon: <Book size={20} />, label: 'Library', color: 'text-white/60', path: '/library' },
        { icon: <Video size={20} />, label: 'Live Class', color: 'text-white/60', path: '/live-class' },
        { icon: <HelpCircle size={20} />, label: 'Support', color: 'text-neon', path: '/support' },
        { icon: <ShieldCheck size={20} />, label: 'Setting', color: 'text-neon', path: '/settings' },
    ] : [
        { icon: <User size={20} />, label: 'My Account', color: 'text-neon', path: '/my-account' },
        { icon: <ShieldCheck size={20} />, label: 'Security', color: 'text-neon', path: '/settings' },
        { icon: <Settings size={20} />, label: 'Settings', color: 'text-white/40', path: '/settings' },
    ];

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex">
                        {/* Dashboard Overlay / Blur */}
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="absolute inset-0 bg-void/80 backdrop-blur-md"
                            onClick={onClose}
                        ></motion.div>

                        {/* Sidebar Menu Main Container */}
                        <motion.div
                            initial={{ x: -100, opacity: 0, scale: 0.98, filter: "blur(8px)" }}
                            animate={{ x: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ x: -120, opacity: 0, scale: 0.98, filter: "blur(6px)" }}
                            transition={{
                                type: "spring",
                                stiffness: 120,
                                damping: 18,
                                mass: 0.8
                            }}
                            className="relative w-80 bg-[#F8FAFC] h-full shadow-[20px_0_60px_rgba(0,0,0,0.2)] flex flex-col border-r border-slate-100 italic overflow-hidden"
                        >

                            {/* --- STEP 1: PREMIUM LIGHT BLUE HEADER (Fixed at Top) --- */}
                            <div className="p-6 pb-8 bg-gradient-to-br from-[#42A5F5] to-[#1E88E5] rounded-br-[3rem] relative shadow-lg shrink-0">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-white p-1 rounded-full shadow-xl">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                                            {user?.avatar ? (
                                                <img src={`http://localhost:5000${user.avatar}`} alt="profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={30} className="text-[#42A5F5]" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden text-left">
                                        <h2 className="text-[20px] font-black text-white truncate drop-shadow-sm">
                                            {user?.name?.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(' ')}
                                        </h2>
                                        <p className="text-[15px] font-bold text-white/80 tracking-wider">
                                            {user?.role === 'student' ? user?.enrollmentNo : user?.employeeId || 'ID: 001'}
                                        </p>
                                    </div>
                                    {/* <button onClick={onClose} className="bg-white/20 p-2 rounded-xl backdrop-blur-md text-white active:scale-90 transition-all">
                                <ChevronRight size={20} className="rotate-180" />
                            </button> */}
                                </div>

                                {/* --- ACTION BUTTONS (ACCOUNT, SUPPORT, LOGOUT) --- */}
                                <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md p-3 rounded-[2rem] border border-white/20">

                                    <button onClick={() => handleNavigation('/my-account')} className="flex flex-col items-center gap-1 group">
                                        <div className="bg-white text-[#42A5F5] p-2.5 rounded-full shadow-md active:scale-90 transition-all"><User size={18} /></div>
                                        <span className="text-[15px] font-bold text-white">My Account</span>
                                    </button>
                                    {user?.role === 'student' && (
                                        <button onClick={() => handleNavigation('/support')} className="flex flex-col items-center gap-1 group">
                                            <div className="bg-white text-[#42A5F5] p-2.5 rounded-full shadow-md active:scale-90 transition-all">
                                                <HelpCircle size={18} />
                                            </div>
                                            <span className="text-[15px] font-bold text-white">Support</span>
                                        </button>
                                    )}
                                    {user?.role === 'teacher' && (
                                        <button onClick={() => handleNavigation('/teacher/support')} className="flex flex-col items-center gap-1 group">
                                            <div className="bg-white text-[#42A5F5] p-2.5 rounded-full shadow-md active:scale-90 transition-all">
                                                <MessageCircle size={18} />
                                            </div>
                                            <span className="text-[15px] font-bold text-white italic">Help desk</span>
                                        </button>
                                    )}
                                    {user?.role === 'finance' && (
                                        <>
                                            <button onClick={() => handleNavigation('/finance/add-payment')} className="flex flex-col items-center gap-1 group">
                                                <div className="bg-white text-[#42A5F5] p-2.5 rounded-full shadow-md active:scale-90 transition-all">
                                                    <PlusCircle size={18} />
                                                </div>
                                                <span className="text-[15px] font-bold text-white italic">Add Payment</span>
                                            </button>
                                        </>
                                    )}

                                    {user?.role === 'admin' && (
                                        <button onClick={() => handleNavigation('/notice-feed')} className="flex flex-col items-center gap-1 group">
                                            <div className="bg-white text-[#42A5F5] p-2.5 rounded-full shadow-md active:scale-90 transition-all">
                                                <ClipboardList size={18} />
                                            </div>
                                            <span className="text-[15px] font-bold text-white italic">Notices</span>
                                        </button>
                                    )}

                                    <button onClick={() => handleNavigation('/settings')} className="flex flex-col items-center gap-1 group">
                                        <div className="bg-white text-red-500 p-2.5 rounded-full shadow-md active:scale-90 transition-all"><Settings size={18} /></div>
                                        <span className="text-[15px] font-bold text-white">Settings</span>
                                    </button>
                                </div>
                            </div>

                            {/* --- SCROLLABLE CONTENT AREA --- */}
                            <div className="flex-1 overflow-y-auto pb-12 custom-scrollbar">
                                {user?.role === 'student' && (
                                    <>
                                        {/* --- STEP 2: DAILY ROUTINE WITH SNAKE BORDER --- */}
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Daily Routine</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* ATTENDANCE MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/attendance')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <Calendar size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Attendance</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* TIMETABLE MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/timetable')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <Clock size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">TimeTable</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleNavigation('/class-diary')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <BookOpen size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Class Diary</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Updates</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* Notice Module */}
                                                    <button
                                                        onClick={() => handleNavigation('/notice-feed')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <Megaphone size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Notice Board</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* Support MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/support')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <HelpCircle size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Support</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleNavigation('/live-class')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <Video size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Live Class</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Finance</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* Fees MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/student/fees')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <CreditCard size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">My Fees</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>


                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Academics</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* Assignment MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/Assignments')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <FileText size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Assignments</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* Performance MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/performance')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <TrendingUp size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Performance</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                    {/* Exam module */}
                                                    <button
                                                        onClick={() => handleNavigation('/exams')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <GraduationCap size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Exams</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                    {/* Library module */}
                                                    <button
                                                        onClick={() => handleNavigation('/library')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <Book size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Library</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {user?.role === 'teacher' && (
                                    <>
                                        {/* Academic Management */}
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Academic Management</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* CLASS ATTENDANCE MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/teacher/attendance')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <CheckSquare size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Class Attendance</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* TEACHER ASSIGNMENT MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/teacher/assignments')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <PlusCircle size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Assignments</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                    {/* CLASS SYLLABUS UPLOAD */}
                                                    <button
                                                        onClick={() => handleNavigation('/teacher/upload-syllabus')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <Layers size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Syllabus</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Class Management */}
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Class Management</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* CLASS LIST MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/teacher/students')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <Users size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Class list</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* TEACHER TIMETABLE MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/timetable')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <CalendarDays size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Schedule</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                    {/* LIVE CLASS MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/teacher/live-class')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <Video size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Live class</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Communication with students */}
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Communication</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* BROADCAST MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/teacher/notices')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <Bot size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Broadcast</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* NOTICE-FEED MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/notice-feed')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <Megaphone size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Notice feed</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleNavigation('/teacher/support')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <MessageCircle size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Support center</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {user?.role === 'admin' && (
                                    <>
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />

                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Personnel Management</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/*add student module*/}
                                                    <button
                                                        onClick={() => handleNavigation('/admin/add-student')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <PlusCircle size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Add Student</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* add staff module */}
                                                    <button
                                                        onClick={() => handleNavigation('/admin/add-teacher')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <PlusCircle size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Manage Staff</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                    {/* users module */}
                                                    <button
                                                        onClick={() => handleNavigation('/admin/manage-users')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <Users size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">User Control</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Scheduling System</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* timetable MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/admin/timetable')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <Database size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Timetable</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* edit timetable MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/admin/edit-timetable')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <Database size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Edit Timetable</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Communication Hub</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* publish notice MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/admin/global-notice')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <Megaphone size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Publish Notice</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* notice view MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/notice-feed')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <ClipboardList size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Notice Archive</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Analytics & Reports</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/* performance MODULE */}
                                                    <button
                                                        onClick={() => handleNavigation('/admin/attendance-report')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <BarChart3 size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Performance</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {user?.role === 'finance' && (
                                    <>
                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Payments</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/*Payments module*/}
                                                    <button
                                                        onClick={() => handleNavigation('/finance/add-payment')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <PlusCircle size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Add Payment</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* Payment Gateway */}
                                                    <button
                                                        onClick={() => handleNavigation('/finance/gateway')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <ShieldCheck size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Payment Gateway</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Reports & Tracking</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/*Payments module*/}
                                                    <button
                                                        onClick={() => handleNavigation('/finance/reports')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <FileText size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Finance Reports</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>

                                                    {/* Payment Gateway */}
                                                    <button
                                                        onClick={() => handleNavigation('/finance/fees-tracker')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100 group-hover/item:scale-110 transition-all">
                                                                <Users size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Fees Tracker</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 px-4">
                                            <div className="relative bg-white rounded-[2.5rem] p-6 shadow-md border border-slate-100 overflow-hidden group">

                                                {/* --- SNAKE PERIMETER ANIMATION (Precision Border Only) --- */}
                                                <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.5rem] overflow-hidden">
                                                    {/* Rotating Gradient (Sirf kinaro par dikhega) */}
                                                    <div
                                                        className="absolute inset-[-100%] animate-[snake-rotate_4s_linear_infinite]"
                                                        style={{
                                                            background: 'conic-gradient(from 0deg, transparent 0%, #ef4444 25%, transparent 50%, #ef4444 75%, transparent 100%)',
                                                        }}
                                                    />
                                                    {/* Inner Mask (Isne beech ka color chupa diya taaki sirf border bache) */}
                                                    <div className="absolute inset-[2px] bg-white rounded-[2.4rem] z-10" />
                                                </div>

                                                <p className="text-[15px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2 italic text-left relative z-10">Setup / Configuration</p>

                                                <div className="space-y-6 relative z-10">
                                                    {/*fee setup*/}
                                                    <button
                                                        onClick={() => handleNavigation('/finance/reports')}
                                                        className="w-full flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className="bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100 group-hover/item:scale-110 transition-all">
                                                                <ShieldCheck size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[15px] italic">Fee Setup</span>
                                                        </div>
                                                        <ChevronRight size={20} className="text-black group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-6 border-t border-neon/10">
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="w-full bg-red-500/10 text-red-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-95 backdrop-blur-md uppercase text-[15px] tracking-[0.2em] italic"
                                >
                                    <LogOut size={30} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* --- LOGOUT CONFIRMATION MODAL (CENTERED & BLURRED) --- */}
            {/* --- STEP 3: PREMIUM LIGHT THEME LOGOUT MODAL --- */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        {/* Soft Backdrop Blur (Light Theme) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirm(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />

                        {/* Modal Box (Puffy White Design) */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white border border-slate-100 p-10 rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] text-center font-sans overflow-hidden"
                        >
                            {/* Top Soft Red Accent Line */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-100 via-red-400 to-red-100"></div>

                            {/* Animated Warning Icon */}
                            <div className="p-6 bg-red-50 rounded-full inline-block mb-6 border border-red-100 shadow-inner">
                                <AlertCircle size={48} className="text-red-500 animate-pulse" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Confirm Logout</h3>
                            <p className="text[15px] font-bold text-slate-400 mt-3 leading-relaxed">
                                Are you sure you want to logout?
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-10">
                                {/* "No" Button (Cancel) */}
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-black text-slate-500 hover:bg-slate-100 active:scale-95 transition-all uppercase tracking-widest"
                                >
                                    No
                                </button>
                                {/* "Yes" Button (Confirm) */}
                                <button
                                    onClick={handleLogout}
                                    className="py-5 bg-red-500 text-white rounded-3xl text-sm font-black shadow-[0_15px_30px_rgba(239,68,68,0.3)] hover:bg-red-600 active:scale-95 transition-all uppercase tracking-widest"
                                >
                                    Yes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SidebarDrawer;
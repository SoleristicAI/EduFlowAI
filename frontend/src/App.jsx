import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Animation ke liye
import { Bot, Cpu, Zap, ShieldCheck, X, Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import API from './api';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import StudentHome from './pages/StudentHome';
import AttendanceDetails from './pages/AttendanceDetails';
import Timetable from './pages/Timetable';
import StudentFees from './pages/student/StudentFees';
import Notifications from './pages/Notifications';
import TeacherHome from './pages/TeacherHome';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherStudentList from './pages/TeacherStudentList';
import TeacherAssignments from './pages/TeacherAssignments';
import TeacherSchedule from './pages/TeacherSchedule';
import Academic from './pages/Academic';
import Support from './pages/Support';
import NoticeFeed from './pages/NoticeFeed';
import Settings from './pages/Settings';
import MyAccount from './pages/MyAccount';
import Exams from './pages/Exams';
import Transport from './pages/Transport';
import IDCard from './pages/IDCard';
import Library from './pages/Library';
import StudentLiveClass from './pages/student/StudentLiveClass';
import Feedback from './pages/Feedback';
import Requests from './pages/Requests';
import Mentorship from './pages/Mentorship';
import Syllabus from './pages/Syllabus';
import AdminHome from './pages/AdminHome';
import AdminTimetable from './pages/AdminTimetable';
import AddStudent from './pages/AddStudent';
import AddTeacher from './pages/AddTeacher';
import ClassDiary from './pages/ClassDiary';
import LeaveRequest from './pages/LeaveRequest';
import StudentSyllabus from './pages/student/StudentSyllabus';
import StudentDatesheet from './pages/student/StudentDatesheet';
import StudentAdmitCard from './pages/student/StudentAdmitCard';
import TeacherUploadResult from './pages/teacher/TeacherUploadResult';
import StudentExamResult from './pages/student/StudentExamResult';
import StudentPerformance from './pages/student/StudentPerformance';
import TeacherAcademicCalendar from './pages/teacher/TeacherAcademicCalendar';
// import AdminFees from './pages/AdminFees';
import LeaveReview from './pages/LeaveReview';
import StudentAssignments from './pages/StudentAssignments';
import TeacherGrading from './pages/TeacherGrading';
import TeacherNotices from './pages/TeacherNotices';
import TeacherSupport from './pages/TeacherSupport';
import ChangePassword from './pages/ChangePassword';
import TeacherUploadSyllabus from './pages/TeacherUploadSyllabus';
import DigitalMaterial from './pages/DigitalMaterial';
import TeacherLiveClass from './pages/teacher/TeacherLiveClass';
import StudentAttendance from './pages/StudentAttendance';
import AdminAttendance from './pages/AdminAttendance';
import AdminGlobalNotice from './pages/AdminGlobalNotice';
import ManageUsers from './pages/ManageUsers';
import AdminEditTimetable from './pages/AdminEditTimetable';
import StudentDetail from './pages/StudentDetail'; 
import StudentLeaveHistory from './pages/StudentLeaveHistory';
import MySubjects from './pages/student/MySubjects'; 
import StudentAcademicCalendar from './pages/student/StudentAcademicCalendar';
import AdminDatesheet from './pages/admin/AdminDatesheet';
import AdminManageDatesheets from './pages/admin/AdminManageDatesheets';
import TeacherDatesheet from './pages/teacher/TeacherDatesheet';
import AdminSchoolLogo from './pages/admin/AdminSchoolLogo';
import AdminAdmitCard from './pages/admin/AdminAdmitCard';
import AdminManageAdmitCards from './pages/admin/AdminManageAdmitCards';
import AdminAcademicCalendar from './pages/admin/AdminAcademicCalendar';

import FinanceDashboard from './pages/finance/FinanceDashboard';
// import StudentsFees from './pages/finance/StudentsFees';
import FinanceGateway from './pages/finance/FinanceGateway';
import AddPayment from './pages/finance/AddPayment';
import FeeReceipt from './pages/finance/FeeReceipt';
import Installments from './pages/finance/Installments';
import FeesTracker from './pages/finance/FeesTracker';
import FeesNoticeManager from './pages/finance/FeesNoticeManager';
import StudentLedger from './pages/finance/StudentLedger';
import FeeReports from './pages/finance/FeeReports'; // Naya import
import FeeSetup from './pages/finance/FeeSetup'; // Day 114: Class Fee Configuration
import TechnicalSupportModal from './components/TechnicalSupportModal';

// Day 64: SuperAdmin Module Imports
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminOnboard from './pages/SuperAdminOnboard';
import SuperAdminAccount from './pages/SuperAdminAccount';
import SuperAdminTechnical from './pages/SuperAdminTechnical'; // <--- YE ADD KARO (Step 2 wali file)

import StudentCheckout from './pages/student/StudentCheckout'; // Day 109: New Invoice Page
import PaymentMethods from './pages/student/PaymentMethods'; // Day 110: New Payment Methods Page

import LandingPage from './pages/LandingPage';

// DAY 76: Theme Integration
import { useTheme } from './context/ThemeContext';
// --- NEURAL VISUAL MATRIX COMPONENT ---
const VisualMatrix = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-neon font-mono text-[10px] whitespace-nowrap animate-matrix italic"
          style={{
            left: `${i * 5}%`,
            '--duration': `${Math.random() * 10 + 5}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        >
          {Array(20).fill('01NEURAL_DATA_FLOW_').join('')}
        </div>
      ))}
    </div>
  );
};;

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false); // Password visibility toggle ke liye
  const [showConfirm, setShowConfirm] = useState(false); // 👈 YE NAYI WALI ADD KAR DE
  const [showBypass, setShowBypass] = useState(false);
  const [bypassStep, setBypassStep] = useState(1); // 1: Email Input, 2: OTP & New Password
  const [bypassData, setBypassData] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [loginError, setLoginError] = useState(''); // Error message ke liye
  const [bypassMsg, setBypassMsg] = useState({ text: '', type: '' }); // Reset messages ke liye
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, isMatrixActive } = useTheme();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setCheckingAuth(false);
  }, []);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(''); // Naya attempt shuru hote hi error clear
    try {
      const { data } = await API.post('/auth/login', { email, password });

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));

      setLoading(false);
      if (data.role === 'superadmin') {
        navigate("/superadmin/dashboard");
      } else if (data.role === 'finance') {
        navigate("/finance/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      setLoading(false);
      // Alert ki jagah state mein message set kar diya
      setLoginError(error.response?.data?.message || "Login failed! Check your credentials.");
    }
  };
  const handleSendOTP = async () => {
    setBypassMsg({ text: '', type: '' }); // Reset previous messages
    try {
      await API.post('/auth/send-otp', { email: bypassData.email });
      setBypassStep(2);
      setBypassMsg({ text: "OTP sent to your registered email", type: 'success' });
    } catch (err) {
      const errorResponse = err.response?.data?.message || "";

      // Agar backend se 'identity not found' jaisa kuch aaye toh 'Invalid email' dikhao
      const customMessage = errorResponse.toLowerCase().includes("identity")
        ? "Invalid email id! ⚠️"
        : errorResponse || "Transmission failed";

      setBypassMsg({
        text: customMessage,
        type: 'error'
      });
    }
  };

  const handleResetFinal = async () => {
    if (bypassData.newPassword !== bypassData.confirmPassword) {
      return setBypassMsg({ text: "Ciphers do not match!", type: 'error' });
    }
    try {
      await API.post('/auth/reset-password', bypassData);
      setBypassMsg({ text: "Password updated successfully! Please log in again. 🔐", type: 'success' });
      // 2 sec baad modal band kar do taaki user message padh le
      setTimeout(() => {
        setShowBypass(false);
        setBypassStep(1);
        setBypassData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
        setBypassMsg({ text: '', type: '' });
      }, 2500);
    } catch (err) {
      setBypassMsg({ text: err.response?.data?.message || "Reset Failed", type: 'error' });
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#42A5F5]/30 border-t-[#42A5F5] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        {/* Step 2.1: Default Route par Landing Page dikhega */}
        <Route path="/" element={<LandingPage />} />

        {/* Step 2.2: Login Route par tera Pura UI jo tune bheja hai */}
        <Route path="/login" element={

          <div className="relative min-h-screen w-full flex items-center justify-center font-sans overflow-hidden bg-[#F8FAFC]">
            {isMatrixActive && <VisualMatrix />}

            <button
              onClick={() => navigate('/')}
              className="absolute top-10 left-10 z-50 bg-white/20 hover:bg-white/40 p-3 rounded-2xl border border-white/30 text-slate-600 transition-all active:scale-90 flex items-center gap-2 font-black uppercase text-[12px] italic tracking-widest shadow-xl backdrop-blur-md"
            >
              <ArrowLeft size={20} /> Back
            </button>

            {/* LIGHT THEME BACKGROUND IMAGE (Tera Day 163 wala exact code) */}
            {/* --- STABLE BACKGROUND ENGINE --- */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
              {/* Background Image */}
              <img
                src="/image.png.jpeg"
                alt="AI background"
                className="absolute inset-0 w-full h-full object-cover opacity-40 scale-110 motion-safe:animate-pulse-slow select-none"
                style={{ filter: 'hue-rotate(10deg) saturate(150%)' }}
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#F8FAFC] via-white/60 to-[#42A5F5]/20 backdrop-blur-[2px]"></div>

              {/* Animated Wave Layer */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -inset-[100%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIjMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiLz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZmYiIHN0b3Atb3BhY2l0eT0iMCIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjNDJBNUY1IiBzdG9wLW9wYWNpdHk9IjAuMSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmZiIgc3RvcC1vcGFjaXR5PSIwIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+')] animate-wave-slow"></div>
              </div>
            </div>

            {/* ROBOT ANIMATION */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: ["-100%", "0%", "-100%"] }}
              transition={{ duration: 4, times: [0, 0.5, 1], ease: "easeInOut" }}
              className="absolute left-0 z-30 flex items-center pointer-events-none"
            >
              <div className="bg-gradient-to-r from-[#42A5F5] to-blue-600 p-4 rounded-r-full shadow-xl border-y-4 border-r-4 border-white">
                <Bot size={80} className="text-white animate-pulse" />
              </div>
              <div className="w-20 h-2 bg-slate-200 shadow-sm border-y border-slate-300"></div>
            </motion.div>

            {/* LOGIN CARD */}
            <motion.div
              initial={{ x: "-120%", opacity: 0, rotate: -10 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              transition={{ duration: 2, delay: 0.5, type: "spring", stiffness: 50 }}
              className="relative z-10 w-full max-w-lg px-6"
            >
              <div className="bg-white/80 backdrop-blur-3xl border border-[#DDE3EA] rounded-[4rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group italic">
                <motion.div
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#42A5F5] to-transparent opacity-30 z-0"
                />

                <div className="text-center mb-10 relative z-10">
                  <div className="flex justify-center gap-4 mb-4 items-center">
                    <Cpu className="text-[#42A5F5] animate-[spin_10s_linear_infinite]" size={36} />
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">EduFlowAI</h2>
                    <Zap className="text-amber-400 fill-amber-400 animate-[pulse_1.5s_ease-in-out_infinite]" size={36} />
                  </div>
                  <motion.div
                    animate={{ scaleX: [1, 1.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="h-1 w-20 bg-[#42A5F5] mx-auto rounded-full mb-4 shadow-sm"
                  />
                  <p className="text-slate-700 font-bold uppercase text-[19px] italic">Login Required</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#42A5F5]">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email ID"
                      className="w-full bg-slate-50 border border-slate-400 py-5 pl-14 pr-8 rounded-[2.5rem] outline-none text-slate-700 font-bold text-[16px] italic focus:border-[#42A5F5] focus:bg-white transition-all"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#42A5F5]">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className="w-full bg-slate-50 border border-slate-400 py-5 pl-14 pr-16 rounded-[2.5rem] outline-none text-slate-700 font-bold text-[16px] italic focus:border-[#42A5F5] focus:bg-white transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#42A5F5]">
                      {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>

                  {loginError && (
                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-[13px] font-bold italic ml-6 mt-2">
                      {loginError}
                    </motion.p>
                  )}

                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest italic">Secure <br /> Login</span>
                    </div>
                    <button type="button" onClick={() => setShowBypass(true)} className="text-[11px] font-black text-[#42A5F5] uppercase tracking-widest hover:underline italic">Forgot Password?</button>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#42A5F5] text-white py-6 rounded-[2.5rem] font-black shadow-lg shadow-blue-100 active:scale-95 transition-all uppercase text-[17px] mt-6 flex items-center justify-center gap-4 italic">
                    {loading ? <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span> : <><span>Login</span><Zap size={20} className="fill-white" /></>}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* BYPASS MODAL (FORGOT PASSWORD) - Tera Pura Code */}
            <AnimatePresence>
              {showBypass && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 italic">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white border border-[#DDE3EA] p-10 rounded-[3.5rem] w-full max-w-md shadow-2xl relative overflow-hidden">
                    <button onClick={() => { setShowBypass(false); setBypassStep(1) }} className="absolute top-8 right-8 text-slate-900 hover:text-slate-600 transition-all p-2 bg-slate-50 rounded-full"><X size={20} /></button>
                    <div className="flex items-center gap-3 mb-8">
                      <ShieldCheck className="text-[#42A5F5]" size={24} />
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic capitalize">Password Reset</h3>
                    </div>

                    {bypassMsg.text && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${bypassMsg.type === 'success' ? 'bg-blue-50 border-blue-200 text-[#42A5F5]' : 'bg-red-50 border-red-200 text-red-500'}`}>
                        <Zap size={16} className={bypassMsg.type === 'success' ? 'animate-pulse' : ''} />
                        <p className="text-[13px] font-bold italic">{bypassMsg.text}</p>
                      </motion.div>
                    )}

                    {bypassStep === 1 ? (
                      <div className="space-y-5">
                        <p className="text-[15px] text-slate-700 font-bold italic ml-2">Enter Your Linked Email ID</p>
                        <input type="email" placeholder="Registered Email ID" className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-500 text-[15px] text-slate-700 outline-none focus:border-[#42A5F5] italic font-bold" onChange={(e) => setBypassData({ ...bypassData, email: e.target.value })} />
                        <button onClick={handleSendOTP} className="w-full bg-[#42A5F5] text-white py-5 rounded-2xl font-black text-[15px] shadow-lg shadow-blue-50 active:scale-95 transition-all italic">Request OTP</button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-[13px] text-emerald-500 font-bold italic ml-2">OTP transmitted • Verify identity</p>
                        <input type="text" placeholder="6-digit OTP" className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-900 text-[15px] font-bold text-slate-900 outline-none focus:border-[#42A5F5]" value={bypassData.otp} onChange={(e) => setBypassData({ ...bypassData, otp: e.target.value })} />
                        <div className="relative group">
                          <input type={showPass ? "text" : "password"} placeholder="New Password" className="w-full bg-slate-50 p-5 pr-14 rounded-2xl border border-slate-900 text-[15px] font-bold text-slate-900 outline-none focus:border-[#42A5F5]" value={bypassData.newPassword} onChange={(e) => setBypassData({ ...bypassData, newPassword: e.target.value })} />
                          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-900 hover:text-[#42A5F5]">{showPass ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                        </div>
                        <div className="relative group">
                          <input type={showConfirm ? "text" : "password"} placeholder="Confirm Password" className="w-full bg-slate-50 p-5 pr-14 rounded-2xl border border-slate-900 text-[15px] font-bold text-slate-900 outline-none focus:border-[#42A5F5]" onChange={(e) => setBypassData({ ...bypassData, confirmPassword: e.target.value })} />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-900 hover:text-[#42A5F5]">{showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                        </div>
                        <button onClick={handleResetFinal} className="w-full bg-[#42A5F5] text-white py-5 rounded-2xl font-black text-[15px] shadow-lg shadow-blue-50 active:scale-95 transition-all italic">Reset Password</button>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#42A5F5] rounded-full animate-ping opacity-20"></div>
            <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-1000 opacity-20"></div>
          </div>
        } />

        {/* Catch-all route to redirect back to Landing Page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  const dashboardPaths = ["/", "/dashboard", "/superadmin/dashboard", "/finance/dashboard"];
  const isDashboard = dashboardPaths.includes(location.pathname);

  return (
    <div className="min-h-screen relative bg-[#F8FAFC]">
      {isDarkMode && isMatrixActive && <VisualMatrix />}
      {isDashboard && (
        <div className="print:hidden">
          <Navbar
            user={user}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSupportClick={() => setIsTechModalOpen(true)}
          />
        </div>
      )}
      <main className={`relative z-0 pb-32 overflow-x-hidden ${isDashboard ? 'pt-20' : 'pt-6'} bg-[#F8FAFC]`}>
        <Routes>
          {/* Main Dashboard Logic based on Role */}
          <Route path="/" element={
            user.role === 'superadmin' ? <SuperAdminDashboard /> :
              user.role === 'admin' ? <AdminHome searchQuery={searchQuery} /> : // <--- Prop Added
                user.role === 'finance' ? <FinanceDashboard searchQuery={searchQuery} /> : // <--- Prop Added
                  user.role === 'teacher' ? <TeacherHome user={user} searchQuery={searchQuery} /> : // <--- Prop Added
                    <StudentHome user={user} searchQuery={searchQuery} />
          } />
          <Route path="/dashboard" element={
            user.role === 'superadmin' ? <SuperAdminDashboard /> :
              user.role === 'admin' ? <AdminHome searchQuery={searchQuery} /> : // <--- Prop Added
                user.role === 'finance' ? <FinanceDashboard searchQuery={searchQuery} /> : // <--- Prop Added
                  user.role === 'teacher' ? <TeacherHome user={user} searchQuery={searchQuery} /> : // <--- Prop Added
                    <StudentHome user={user} searchQuery={searchQuery} />
          } />

          {/* SuperAdmin Specific Routes - Day 64 */}
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/onboard" element={<SuperAdminOnboard />} />
          <Route path="/superadmin/account" element={<SuperAdminAccount user={user} />} />
          <Route path="/superadmin/technical" element={<SuperAdminTechnical />} />

          {/* Timetable & Admin Management */}
          <Route path="/timetable" element={user.role === 'teacher' ? <TeacherSchedule user={user} /> : <Timetable user={user} />} />
          <Route path="/admin/timetable" element={<AdminTimetable />} />
          <Route path="/admin/student-report/:studentId" element={<StudentDetail />} /> {/* DAY 87: Deep Profile Route */}
          <Route path="/admin/edit-timetable" element={<AdminEditTimetable />} /> {/* Naya Module */}
          <Route path="/student/fees" element={<StudentFees />} />
          <Route path="/admin/attendance-report" element={<AdminAttendance />} />
          <Route path="/admin/global-notice" element={<AdminGlobalNotice />} />
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/add-student" element={<AddStudent />} />
          <Route path="/admin/add-teacher" element={<AddTeacher />} />
          <Route path="/admin/datesheet" element={<AdminDatesheet user={user} />} />
          <Route path="/admin/manage-datesheets" element={<AdminManageDatesheets />} />
          <Route path="/admin/school-logo" element={<AdminSchoolLogo />} />
          <Route path="/admin/admit-card" element={<AdminAdmitCard />} />
          <Route path="/admin/manage-admit-cards" element={<AdminManageAdmitCards />} />
          <Route path="/teacher/results" element={<TeacherUploadResult user={user} />} />
          <Route path="/admin/academic-calendar" element={<AdminAcademicCalendar />} />

          {/* Academic & Feature Routes */}
          <Route path="/assignments" element={<StudentAssignments user={user} />} />
          <Route path="/attendance" element={user.role === 'student' ? <StudentAttendance /> : <AttendanceDetails />} />
          {/* <Route path="/fees" element={<Fees user={user} />} /> */}
          <Route path="/notices" element={<Notifications />} />
          <Route path="/academic" element={<Academic />} />
          <Route path="/support" element={<Support />} />
          <Route path="/notice-feed" element={<NoticeFeed user={user} />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/id-card" element={<IDCard user={user} />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/digital" element={<DigitalMaterial />} />
          <Route path="/live-class" element={<StudentLiveClass />} />
          <Route path="/class-diary" element={<ClassDiary />} />
          <Route path="/leave" element={<LeaveRequest />} />
          <Route path="/student/leave-history" element={<StudentLeaveHistory />} />
          <Route path="/my-subjects" element={<MySubjects user={user} />} />
          <Route path="/syllabus" element={<StudentSyllabus user={user} />} />
          <Route path="/exam-datesheet" element={<StudentDatesheet user={user} />} />
          <Route path="/admit-card" element={<StudentAdmitCard user={user} />} />
          <Route path="/exam-results" element={<StudentExamResult />} />
          <Route path="/holidays" element={<StudentAcademicCalendar />} />
          <Route path="/performance" element={<StudentPerformance />} />

          <Route path="/feedback" element={<Feedback />} />

          <Route path="/requests" element={<Requests />} />
          <Route path="/mentors" element={<Mentorship />} />
          <Route path="/syllabus" element={<Syllabus user={user} />} />

          {/* Teacher Specific Routes */}
          <Route path="/teacher/leave-requests" element={<LeaveReview />} />
          <Route path="/teacher/calendar" element={<TeacherAcademicCalendar />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance user={user} />} />
          <Route path="/teacher/students" element={<TeacherStudentList user={user} />} />
          <Route path="/teacher/assignments" element={<TeacherAssignments user={user} />} />
          <Route path="/teacher/grade/:assignmentId" element={<TeacherGrading />} />
          <Route path="/teacher/notices" element={<TeacherNotices />} />
          <Route path="/teacher/support" element={<TeacherSupport />} />
          <Route path="/teacher/upload-syllabus" element={<TeacherUploadSyllabus user={user} />} />
          <Route path="/teacher/live-class" element={<TeacherLiveClass user={user} />} />
          <Route path="/teacher/datesheet" element={<TeacherDatesheet />} />

          {/* --- FINANCE MODULE ROUTES --- */}
          <Route path="/finance/dashboard" element={<FinanceDashboard searchQuery={searchQuery} />} />
          <Route path="/finance/fee-setup" element={<FeeSetup />} />
          <Route path="/finance/gateway" element={<FinanceGateway />} />
          {/* <Route path="/finance/fees" element={<StudentsFees />} /> */}
          <Route path="/finance/reports" element={<FeeReports />} />
          <Route path="/finance/add-payment" element={<AddPayment />} />
          <Route path="/finance/receipt/:id" element={<FeeReceipt />} />
          <Route path="/finance/installments" element={<Installments />} />
          <Route path="/finance/fees-tracker" element={<FeesTracker />} />
          <Route path="/finance/student-ledger/:id" element={<StudentLedger />} />
          <Route path="/student/checkout" element={<StudentCheckout />} />
          <Route path="/student/payment-methods" element={<PaymentMethods />} />
          <Route path="/finance/fees-notice" element={<FeesNoticeManager />} />

          {/* User Profile & Security */}
          <Route path="/my-account" element={user.role === 'superadmin' ? <SuperAdminAccount user={user} /> : <MyAccount user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <AnimatePresence>
        {isTechModalOpen && (
          <TechnicalSupportModal
            isOpen={isTechModalOpen}
            onClose={() => setIsTechModalOpen(false)}
            user={user}
          />
        )}
      </AnimatePresence>
      {/* SuperAdmin, Admin aur Finance ke liye BottomNav nahi dikhega */}
      <div className="print:hidden fixed bottom-0 left-0 w-full z-40">
        {(user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'finance') && <BottomNav />}
      </div>
    </div>
  );
}

export default App;
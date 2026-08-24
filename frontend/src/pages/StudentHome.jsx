import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import {
  Calendar, Clock, CreditCard, Bell, Sun, FileText, TrendingUp, FileSearch, ClipboardCheck, Bus, Book, Video, BookOpen, Megaphone, Users, GraduationCap, UserPlus, MessageSquare, Bot, ChevronDown, ChevronUp, ClipboardList, Sparkles, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

const StudentHome = ({ user, searchQuery }) => {
  const navigate = useNavigate();

  // --- EXPAND STATE ---
  const [isExpanded, setIsExpanded] = useState(false);

  // --- AI CHAT FLOATING BUTTON POSITION ---
  const [position, setPosition] = useState({
    x: window.innerWidth - 110,
    y: window.innerHeight - 180
  });

  const [unreadERP, setUnreadERP] = useState(0);
  // --- BIRTHDAY ENGINE STATES ---
  const [bdayData, setBdayData] = useState({ isBirthday: false, wish: '', name: '' });
  const [showBdayModal, setShowBdayModal] = useState(false);
  const [bdayPhase, setBdayPhase] = useState(0); // 0: Start, 1: Wish, 2: Closing
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Window size for Confetti
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Birthday Fetch API
  useEffect(() => {
    const checkBirthday = async () => {
      try {
        const { data } = await API.get('/users/student/birthday-wish');
        if (data.isBirthday) {
          setBdayData(data);
          
          // Check if already shown today
          const todayStr = new Date().toDateString();
          const shownDate = localStorage.getItem(`bday_shown_${user?.enrollmentNo}`);
          
          if (shownDate !== todayStr) {
            setShowBdayModal(true);
            // 5 Second baad phase 1 (Wish dikhana)
            setTimeout(() => setBdayPhase(1), 5000);
            localStorage.setItem(`bday_shown_${user?.enrollmentNo}`, todayStr);
          }
        }
      } catch (err) { console.error("Birthday check failed"); }
    };
    if (user) checkBirthday();
  }, [user]);

  const handleThankYouClick = () => {
    setBdayPhase(2); // Show welcome message
    setTimeout(() => {
      setShowBdayModal(false); // Close completely after 3 seconds
    }, 3000);
  };

useEffect(() => {
    const fetchUnreadNotices = async () => {
      if (!user?.enrollmentNo) return;
      try {
        const { data } = await API.get('/fee-notices/view'); 
        if (data && data.notices) {
          const readNotices = JSON.parse(localStorage.getItem(`read_erp_notices_${user?.enrollmentNo}`) || "[]");
          const newNotices = data.notices.filter(n => !readNotices.includes(n._id));
          setUnreadERP(newNotices.length);
        }
      } catch (err) { console.log("Notice fetch error", err); }
    };
    
    // Page load hone pe fetch karo
    fetchUnreadNotices();

    // Jab notice page se back dabake wapas aaye, tab dobara check karo aur badge hata do
    const handleFocus = () => {
        fetchUnreadNotices();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);

  }, [user]);

  // const [dragging, setDragging] = useState(false);

  // --- SCREEN BOUNDARY FIX ---
  const clampPosition = (x, y) => {
    const size = 85;

    // Navbar ki actual height
    const navbarHeight = 110;

    // Bottom nav ki height
    const bottomPadding = 90;

    const maxX = window.innerWidth - size;
    const maxY = window.innerHeight - size - bottomPadding;

    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(navbarHeight, Math.min(y, maxY))
    };
  };

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => clampPosition(prev.x, prev.y));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const topRowModules = [
    { title: 'Attendance', icon: <Calendar size={30} />, path: '/attendance', bgColor: 'bg-[#FFEBEE]', iconColor: 'bg-[#FFCDD2] text-[#E53935]' },
    { title: 'TimeTable', icon: <Clock size={30} />, path: '/timetable', bgColor: 'bg-[#E8EAF6]', iconColor: 'bg-[#C5CAE9] text-[#3F51B5]' },
  ];

  const bottomRowModules = [
    { title: 'Fees', icon: <CreditCard size={22} />, path: '/student/fees', bgColor: 'bg-[#E0F2F1]', iconColor: 'bg-[#B2DFDB] text-[#00897B]' },
    { title: 'Class Diary', icon: <BookOpen size={22} />, path: '/class-diary', bgColor: 'bg-[#E3F2FD]', iconColor: 'bg-[#BBDEFB] text-[#1E88E5]' },
    { title: 'Notices', icon: <Megaphone size={22} />, path: '/notice-feed', bgColor: 'bg-[#FFF3E0]', iconColor: 'bg-[#FFE0B2] text-[#FB8C00]' },
  ];

  const subModules = [
    { title: 'Assignment', icon: <FileText size={17} />, path: '/assignments' },
    { title: 'ERP Notices', icon: <Bell size={17} />, path: '/notices' },
    { title: 'Performance', icon: <TrendingUp size={17} />, path: '/performance' },
    { title: 'Mentorship', icon: <Users size={17} />, path: '/mentors' },
    { title: 'Holidays', icon: <Calendar size={17} />, path: '/holidays' },
    { title: 'Leave Request', icon: <ClipboardList size={17} />, path: '/leave' },
    { title: 'My Subjects', icon: <BookOpen size={17} />, path: '/my-subjects' },
    { title: 'Live Class', icon: <Video size={17} />, path: '/live-class' },
  ];

  const extraModules = [
    { title: 'Bus Tracker', icon: <Bus size={17} />, path: '/transport' },
    { title: 'Library', icon: <Book size={17} />, path: '/library' },
    { title: 'Feedback', icon: <MessageSquare size={17} />, path: '/student/feedback' },
  ];

  const examModules = [

    {
      title: 'Syllabus',
      icon: <BookOpen size={17} />,
      path: '/syllabus',
      bgColor: 'bg-[#E0F7FA]',
      iconColor: 'bg-[#B2EBF2] text-[#0097A7]'
    },

    {
      title: 'Date Sheet',
      icon: <Calendar size={17} />,
      path: '/exam-datesheet',
      bgColor: 'bg-[#FFF4E5]',
      iconColor: 'bg-[#FFE0B2] text-[#FB8C00]'
    },

    {
      title: 'Admit Card',
      icon: <ClipboardCheck size={17} />,
      path: '/admit-card',
      bgColor: 'bg-[#E3F2FD]',
      iconColor: 'bg-[#BBDEFB] text-[#1E88E5]'
    },

    {
      title: 'Results',
      icon: <BarChart3 size={17} />,
      path: '/exam-results',
      bgColor: 'bg-[#E8F5E9]',
      iconColor: 'bg-[#C8E6C9] text-[#43A047]'
    },
  ];

  const filteredSub = subModules.filter(sm =>
    sm.title.toLowerCase().includes(searchQuery?.toLowerCase() || '')
  );

  const filteredExtra = extraModules.filter(em =>
    em.title.toLowerCase().includes(searchQuery?.toLowerCase() || '')
  );

  const noResults = filteredSub.length === 0 && filteredExtra.length === 0;

  return (
   <div className={`px-5 -mt-18 space-y-4 relative z-10 pb-10 md:pb-20 font-sans overflow-x-hidden min-h-screen transition-all duration-1000 ${bdayData.isBirthday ? 'bg-gradient-to-br from-rose-50 via-fuchsia-50 to-amber-50' : 'bg-[#F8FAFC]'}`}>
      {/* --- MAIN MODULES --- */}
      <div className="space-y-4 pt-4">

        {/* TOP ROW */}
        <div className="grid grid-cols-2 gap-4">
          {topRowModules.map((m, i) => (
            <Link
              to={m.path}
              key={i}
              className={`${m.bgColor} rounded-[2.5rem] p-4 flex flex-col items-start justify-between min-h-[120px] shadow-sm border border-white/60 active:scale-95 transition-all relative overflow-hidden group`}
            >
              <span className="font-black text-slate-800 text-base z-10 italic leading-tight">
                {m.title}
              </span>

              <div className={`self-end p-3 rounded-[2rem] ${m.iconColor} shadow-inner group-hover:scale-110 transition-transform`}>
                {m.icon}
              </div>

              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
            </Link>
          ))}
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-3 gap-3">
          {bottomRowModules.map((m, i) => (
            <Link
              to={m.path}
              key={i}
              className={`${m.bgColor} rounded-[2rem] p-4 flex flex-col items-start justify-between min-h-[90px] shadow-sm border border-white/50 active:scale-95 transition-all relative overflow-hidden group`}
            >
              <span className="font-black text-slate-800 text-xs z-10 italic leading-tight">
                {m.title}
              </span>

              <div className={`self-end p-2 rounded-[1.5rem] ${m.iconColor} shadow-inner group-hover:rotate-12 transition-transform`}>
                {m.icon}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* --- SUB MODULES --- */}
      <div className="bg-white rounded-[3.5rem] p-5 lg:p-8 shadow-sm border border-slate-100 relative min-h-[200px] flex flex-col justify-center">

        {noResults ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 w-full col-span-full"
          >
            <Bot size={48} className="text-slate-200 mb-4 animate-bounce" />

            <p className="text-slate-400 font-bold text-sm lg:text-base italic uppercase tracking-widest">
              No Module Found...
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-y-4 gap-x-4">

           {filteredSub.map((sm, i) => (
              // Link mein 'relative' class zaroor add kar dena
              <Link to={sm.path} key={i} className="flex flex-col items-center gap-4 group relative">

                <div className="relative w-12 h-12 lg:w-20 lg:h-20 flex items-center justify-center rounded-[2rem] bg-[#E3F2FD] text-[#2196F3] group-hover:bg-[#2196F3] group-hover:text-white transition-all active:scale-90 border border-blue-50">
                  {sm.icon}
                  {sm.title === 'ERP Notices' && unreadERP > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] lg:text-[11px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-md animate-bounce">
                      {unreadERP}
                    </span>
                  )}
                  
                </div>

                <span className="text-xs lg:text-sm font-bold text-slate-600 text-center leading-tight">
                  {sm.title}
                </span>
              </Link>
            ))}

            <AnimatePresence>
              {(isExpanded || searchQuery) && filteredExtra.map((em, i) => (
                <motion.div
                  key={`extra-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Link to={em.path} className="flex flex-col items-center gap-4 group">

                    <div className="w-12 h-12 lg:w-20 lg:h-20 flex items-center justify-center rounded-[2rem] bg-[#E3F2FD] text-[#2196F3] group-hover:bg-[#2196F3] group-hover:text-white transition-all active:scale-90 border border-purple-50">
                      {em.icon}
                    </div>

                    <span className="text-xs lg:text-sm font-bold text-slate-600 text-center leading-tight">
                      {em.title}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>

          </div>
        )}

        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex justify-center w-full mt-3 hover:scale-110 transition-transform cursor-pointer"
        >
          <div className="bg-slate-50 p-1 rounded-full border border-slate-100 shadow-sm">
            {isExpanded
              ? <ChevronUp size={21} className="text-slate-400" />
              : <ChevronDown size={21} className="text-slate-400" />
            }
          </div>
        </button>
      </div>
      {/* --- EXAM HUB SECTION --- */}
      <div className="rounded-[2rem] p-5 shadow-md border border-blue-100 relative overflow-hidden bg-white">

        {/* Background Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>

        {/* Heading */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <h2 className="text-1xl font-black text-slate-800 italic">
              Examination Hub
            </h2>
          </div>

          <div className="bg-white/60 backdrop-blur-md p-2.5 rounded-[1.8rem] shadow-sm border border-white">
            <GraduationCap size={25} className="text-[#7E57C2]" />
          </div>
        </div>

        {/* Modules */}
        <div className="grid grid-cols-2 gap-3 relative z-10">

          {examModules.map((m, i) => (
            <Link
              to={m.path}
              key={i}
              className={`${m.bgColor} rounded-[2rem] p-2 flex items-center justify-between shadow-sm border border-white/70 active:scale-95 transition-all group`}
            >
              <div>
                <p className="text-xs font-black text-slate-700 italic leading-tight">
                  {m.title}
                </p>
              </div>

              <div className={`p-1.5 rounded-[1.2rem] ${m.iconColor} group-hover:rotate-12 transition-transform`}>
                {m.icon}
              </div>
            </Link>
          ))}

        </div>
      </div>
      {/* ========================================================= */}
      {/* 🔥 THE PREMIUM APPLE-STYLE LIQUID BIRTHDAY MODAL 🔥 */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showBdayModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
            {/* Glassmorphism Background Lock */}
            <motion.div 
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 bg-white/40"
            />

            {/* Confetti Crackers (Only during Phase 0 and 1) */}
            {bdayPhase < 2 && (
              <Confetti width={windowSize.width} height={windowSize.height} recycle={bdayPhase === 0} numberOfPieces={bdayPhase === 0 ? 500 : 150} gravity={0.15} />
            )}

            <div className="relative z-10 text-center px-6 w-full max-w-md">
              <AnimatePresence mode="wait">
                
                {/* PHASE 0: Initial Liquid Greeting */}
                {bdayPhase === 0 && (
                  <motion.div
                    key="phase0"
                    initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
                    transition={{ duration: 1.2, type: "spring" }}
                  >
                    <p className="text-xl md:text-2xl font-black text-rose-400 uppercase tracking-[0.3em] mb-4 drop-shadow-md">
                      Hey {bdayData.name},
                    </p>
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 leading-tight drop-shadow-xl italic">
                      Happy<br/>Birthday! 🎉
                    </h1>
                  </motion.div>
                )}

                {/* PHASE 1: The Premium Wish & Thank You Button */}
                {bdayPhase === 1 && (
                  <motion.div
                    key="phase1"
                    initial={{ opacity: 0, scale: 0.9, filter: "blur(15px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    transition={{ duration: 1.2, type: "spring" }}
                    className="bg-white/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-fuchsia-500 rounded-full mx-auto flex items-center justify-center shadow-lg mb-6 animate-bounce">
                      <span className="text-4xl">🎂</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 italic leading-snug mb-8">
                      "{bdayData.wish}"
                    </p>
                    <button 
                      onClick={handleThankYouClick}
                      className="w-full py-5 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all hover:shadow-2xl"
                    >
                      Thank You ❤️
                    </button>
                  </motion.div>
                )}

                {/* PHASE 2: The Sweet Closing Liquid Text */}
                {bdayPhase === 2 && (
                  <motion.div
                    key="phase2"
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(20px)" }}
                    transition={{ duration: 1 }}
                  >
                    <h2 className="text-4xl font-black text-slate-700 italic tracking-tighter drop-shadow-lg">
                      Welcome back! <br/>
                      <span className="text-rose-500 text-3xl">Enjoy your special day... ✨</span>
                    </h2>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentHome;
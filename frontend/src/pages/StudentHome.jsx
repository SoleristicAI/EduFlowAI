import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    // {
    //   title: 'Exam Notices',
    //   icon: <Megaphone size={24} />,
    //   path: '/exam-notices',
    //   bgColor: 'bg-[#F3E5F5]',
    //   iconColor: 'bg-[#E1BEE7] text-[#8E24AA]'
    // },


    // {
    //   title: 'Exam Registration',
    //   icon: <UserPlus size={24} />,
    //   path: '/exam-registration',
    //   bgColor: 'bg-[#FFF3E0]',
    //   iconColor: 'bg-[#FFE0B2] text-[#FB8C00]'
    // },
  ];

  const filteredSub = subModules.filter(sm =>
    sm.title.toLowerCase().includes(searchQuery?.toLowerCase() || '')
  );

  const filteredExtra = extraModules.filter(em =>
    em.title.toLowerCase().includes(searchQuery?.toLowerCase() || '')
  );

  const noResults = filteredSub.length === 0 && filteredExtra.length === 0;

  return (
    <div className="px-5 -mt-18 space-y-4 relative z-10 pb-10 md:pb-20 font-sans bg-[#F8FAFC] overflow-x-hidden">

      {/* ---------------- AI FLOATING BUTTON ---------------- */}
      {/* <motion.div

        dragConstraints={{
          left: 0,
          top: 80,
          right: window.innerWidth - 85,
          bottom: window.innerHeight - 85
        }}
        drag
        dragListener={true}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(event, info) => {
          const newPos = clampPosition(
            position.x + info.offset.x,
            position.y + info.offset.y
          );

          setPosition(newPos);
        }}
        animate={{
          x: position.x,
          y: position.y
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25
        }}

        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
        }}
        className="w-[85px] h-[85px] rounded-full cursor-grab active:cursor-grabbing"
      >
        <div
          onClick={() => navigate('/ai-chatbot')}
          className="relative w-full h-full rounded-full bg-gradient-to-br from-[#42A5F5] via-[#7E57C2] to-[#EC4899] shadow-[0_10px_40px_rgba(66,165,245,0.45)] flex items-center justify-center border-4 border-white active:scale-95 transition-all overflow-hidden group"
        > */}
      {/* Glow */}
      {/* <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-xl"></div> */}

      {/* Pulse Ring */}
      {/* <div className="absolute w-full h-full rounded-full border-2 border-white/30 animate-ping"></div> */}

      {/* Icon */}
      {/* <div className="relative z-10 flex flex-col items-center">
            <Sparkles size={28} className="text-white drop-shadow-lg" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest mt-1">
              AI
            </span>
          </div>
        </div>
      </motion.div> */}

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
              <Link to={sm.path} key={i} className="flex flex-col items-center gap-4 group">

                <div className="w-12 h-12 lg:w-20 lg:h-20 flex items-center justify-center rounded-[2rem] bg-[#E3F2FD] text-[#2196F3] group-hover:bg-[#2196F3] group-hover:text-white transition-all active:scale-90 border border-blue-50">
                  {sm.icon}
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
    </div>
  );
};

export default StudentHome;
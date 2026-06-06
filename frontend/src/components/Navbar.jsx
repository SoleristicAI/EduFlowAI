import React, { useState, useEffect } from 'react';
import { Bell, Menu, Search, Headphones, LogOut, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarDrawer from './SidebarDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

const Navbar = ({ user, searchQuery, setSearchQuery, onSupportClick }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [greeting, setGreeting] = useState({ text: 'Good Morning', emoji: '☀️' });
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    if (!user || !user.token) return;

    const fetchUnreadCount = async () => {
      const backup = localStorage.getItem('superadmin_backup');
      if (user?.role === 'admin' && backup) return;
      if (user?.role === 'admin' || user?.role === 'superadmin') return;

      try {
        const { data } = await API.get('/notices/my-notices');
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        if (err.response?.status !== 401) {
          console.error("Notification Fetch Error:", err);
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleBellClick = async () => {
    try {
      if (user?.role === 'superadmin') return;
      if (user?.role !== 'admin' && unreadCount > 0) {
        await API.put('/notices/mark-all-read');
        setUnreadCount(0);
      }
      navigate('/notice-feed');
    } catch (err) {
      console.error("Redirect error:", err);
      navigate('/notice-feed');
    }
  };

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting({ text: 'Good Morning', emoji: '☀️' });
      else if (hour < 17) setGreeting({ text: 'Good Afternoon', emoji: '🌤️' });
      else if (hour < 21) setGreeting({ text: 'Good Evening', emoji: '👋' });
      else setGreeting({ text: 'Good Night', emoji: '🌙' });
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 900000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    const backup = localStorage.getItem('superadmin_backup');
    if (backup) {
      localStorage.setItem('user', backup);
      localStorage.removeItem('superadmin_backup');
      window.location.href = '/superadmin/dashboard';
    } else {
      localStorage.removeItem('user');
      window.location.reload();
    }
  };


  return (
    <>
      <header className="bg-[#42A5F5] text-white px-6 pt-6 pb-8 rounded-b-[2.5rem] shadow-md relative z-50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon/60 to-transparent animate-pulse"></div>
        </div>
        {/* FULL TOP MOVING ORANGE LINE */}
        <div className="absolute top-0 left-0 w-full h-[4px] overflow-hidden">
          <div className="w-full h-full bg-red-200/200 relative">
            <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-[slideLine_2.5s_linear_infinite]"></div>
          </div>
        </div>

        <style>
          {`
            @keyframes slideLine {
              0% {
                left: -100%;
              }
              100% {
                left: 100%;
              }
            }
          `}
        </style>

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <Menu
              size={24}
              className="cursor-pointer text-white/80 hover:text-neon transition-all active:scale-90"
              onClick={() => setIsDrawerOpen(true)}
            />
            <div className="bg-neon/10 p-2 rounded-xl border border-neon/30 backdrop-blur-md shadow-inner">
              <Cpu size={18} className="text-white animate-spin-slow" />
            </div>
            <span className="text-[15px] font-black  titlecase text-white/80">
              EduFlowAI v2.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user?.role !== 'superadmin' && (
              <div
                onClick={handleBellClick}
                className="bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-md relative cursor-pointer hover:bg-neon/20 transition-all active:scale-90"
              >
                <Bell size={18} className="text-white/80" />
                {user?.role !== 'admin' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-void animate-bounce shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {unreadCount}
                  </span>
                )}
              </div>
            )}

            {/* ISKO MAINE CONDITION MEIN WRAP KAR DIYA HAI */}
            {user?.role !== 'superadmin' && (
              <div
                onClick={onSupportClick}
                className="bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-md hover:bg-neon/20 transition-all active:scale-90 cursor-pointer"
              >
                <Headphones size={18} className="text-white/80" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-left relative z-10 px-2">
          <h2 className="text-2xl font-bold tracking-tight text-white/90">
            {greeting.text} {greeting.emoji}{' '} <span className="text-white font-black">
              {user?.name?.split(' ')[0].charAt(0).toUpperCase() + user?.name?.split(' ')[0].slice(1).toLowerCase()}
            </span>
          </h2>
          <span className="inline-block mt-2 px-4 py-1 bg-white/20 border border-white/30 rounded-full text-[15px] font-bold tracking-wide text-white">
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1).toLowerCase()} Portal
          </span>
          <motion.div
            className="mt-6 relative px-1"
            whileTap={{
              y: 4,
              scale: 0.985
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 20
            }}
            whileHover={{
              y: -2,
              scale: 1.02,
              boxShadow: "0px 10px 20px rgba(66, 165, 245, 0.3)"
            }}
          >
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none"
              size={20}
            />

            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-none text-slate-700 py-4 pl-12 pr-4 rounded-[1.5rem] shadow-lg outline-none placeholder:text-slate-400 font-bold text-sm"
            />
          </motion.div>
        </div>
      </header>

      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} user={user} />
    </>
  );
};

export default Navbar;
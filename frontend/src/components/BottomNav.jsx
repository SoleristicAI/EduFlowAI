import React, { useState } from 'react';
import { Home, Megaphone, School, X, MapPin, Phone, ShieldCheck, User as UserIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const BottomNav = () => {
  const [showSchoolModal, setShowSchoolModal] = useState(false);

  // 1. User data nikaalo (Jisne login kiya hai)
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // 2. School ki details (schoolData se hi aayengi)
  const schoolName = user.schoolData?.schoolName || "EduFlowAI Institution";
  const schoolAddress = user.schoolData?.address || "Digital Campus, Sector 42";
  const schoolContact = user.schoolData?.adminDetails?.mobile || "+91 98765-43210";

  // 3. BACHE KI PHOTO & NAAM (Logged in user profile)
  const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://tera-backend.onrender.com";
  const studentPhoto = user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`) : null;
  const studentName = user.name || "Student Name";
  // 🔥 BOTTOM NAV BIRTHDAY CHECK 🔥
  const today = new Date();
  const dobDate = user.dob ? new Date(user.dob) : null;
  const isBirthday = user.role === 'student' && dobDate && today.getMonth() === dobDate.getMonth() && today.getDate() === dobDate.getDate();

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-10 flex justify-between items-center z-40 rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.06)] h-20 pb-0 font-sans italic text-[15px]">
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? (isBirthday ? 'text-rose-500' : 'text-[#42A5F5]') : 'text-slate-400'}`}>
          <Home size={20} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </NavLink>

        {/* Center Node Button */}
        <div className="relative -top-4 flex flex-col items-center">
          <div onClick={() => setShowSchoolModal(true)} className="relative cursor-pointer group">
            <div className={`absolute inset-0 rounded-full ${isBirthday ? 'bg-rose-500/50' : 'bg-[#42A5F5]/40'} blur-2xl group-hover:blur-3xl transition-all`}></div>
            <div className={`relative ${isBirthday ? 'bg-gradient-to-br from-fuchsia-500 to-rose-500 shadow-[0_15px_30px_rgba(244,63,94,0.4)]' : 'bg-[#42A5F5] shadow-[0_15px_30px_rgba(66,165,245,0.4)]'} text-white p-3 rounded-full border-[4px] border-white active:scale-90 transition-all`}>
              <School size={28} />
            </div>
          </div>
          <span className="mt-1 text-slate-500 text-[10px] font-black uppercase tracking-widest">Details</span>
        </div>

        <NavLink to="/notice-feed" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#42A5F5]' : 'text-slate-400'}`}>
          <Megaphone size={20} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Feed</span>
        </NavLink>
      </div>

      {/* PORTAL MODAL */}
      {createPortal(
        <AnimatePresence>
          {showSchoolModal && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6 overflow-hidden">

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSchoolModal(false)}
                className="absolute inset-0 bg-slate-950/85"
              />

              {/* Identity Card */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 100, borderRadius: "100%" }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  borderRadius: "4.5rem",
                  transition: { type: "spring", damping: 20, stiffness: 100 }
                }}
                exit={{ scale: 0.5, opacity: 0, y: 200 }}
                className="relative w-full max-w-sm bg-white shadow-[0_60px_150px_rgba(0,0,0,0.8)] flex flex-col items-center p-12 text-center border border-white/40"
              >
                <button
                  onClick={() => setShowSchoolModal(false)}
                  className="absolute top-8 right-8 p-2.5 bg-slate-100/80 text-slate-500 rounded-full hover:bg-rose-500 hover:text-white transition-all active:scale-75 shadow-sm"
                >
                  <X size={20} />
                </button>

                {/* BACHE KI PHOTO - Profile Picture of Login User */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mb-4 relative"
                >
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl -z-10" />
                  {studentPhoto ? (
                    <img
                      src={studentPhoto}
                      alt="Profile"
                      className="w-48 h-48 rounded-[4rem] object-cover drop-shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
                    />
                  ) : (
                    <div className="w-36 h-36 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-[3.5rem] flex items-center justify-center text-[#42A5F5] shadow-inner">
                      <UserIcon size={70} />
                    </div>
                  )}
                </motion.div>

                {/* BACHE KA NAAM */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="mb-6"
                >
                  <h3 className="text-[18px] font-black text-[#42A5F5] uppercase tracking-wider italic">
                    {studentName}
                  </h3>
                </motion.div>

                {/* SCHOOL DETAILS */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full space-y-6"
                >
                  <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none uppercase">
                    {schoolName}
                  </h2>

                  <div className="h-1.5 w-14 bg-gradient-to-r from-[#42A5F5] to-indigo-500 mx-auto rounded-full shadow-md" />

                  <div className="space-y-4 pt-2">
                    {/* SCHOOL ADDRESS SECTION */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[19px] font-black uppercase text-slate-400 tracking-[0.1em] ml-6 italic">School Address</span>
                      <div className="flex items-start gap-4 text-left bg-slate-50/60 p-5 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="p-2.5 bg-white rounded-2xl text-[#42A5F5] shadow-sm shrink-0">
                          <MapPin size={20} />
                        </div>
                        <p className="text-[13px] font-bold text-slate-500 leading-relaxed italic">
                          {schoolAddress}
                        </p>
                      </div>
                    </div>

                    {/* SCHOOL CONTACT SECTION */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[19px] font-black uppercase text-[#42A5F5] tracking-[0.1em] ml-6 italic">Contact No.</span>
                      <div className="flex items-center gap-4 text-left bg-blue-50/40 p-5 rounded-[2.5rem] border border-blue-100/30 shadow-sm">
                        <div className="p-2.5 bg-white rounded-2xl text-[#42A5F5] shadow-sm shrink-0">
                          <Phone size={20} />
                        </div>
                        <p className="text-[16px] font-black text-slate-700 tracking-widest">
                          {schoolContact}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 flex flex-col items-center gap-2 opacity-20">
                    <ShieldCheck size={22} className="text-slate-800" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Institutional Ledger Verified</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default BottomNav;
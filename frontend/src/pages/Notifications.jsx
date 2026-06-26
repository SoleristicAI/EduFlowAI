import React, { useState, useEffect } from 'react';
import { ArrowLeft, Megaphone, Clock, Sun, AlertTriangle, FileText, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import Loader from '../components/Loader';

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [noticeList, setNoticeList] = useState([]);

  useEffect(() => {
    const fetchErpNotices = async () => {
      try {
        setLoading(true);
        // Naye clean and fresh route se data pull kiya
        const { data } = await API.get('/fee-notices/view');
        setNoticeList(data.notices || []);
      } catch (err) {
        console.error("Centralized ERP Notice Feed Link Severed");
      } finally {
        setLoading(false);
      }
    };

    fetchErpNotices();
  }, []);

  const filteredNotices = noticeList;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">

      {/* Header Layer */}
      <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">

        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

        {/* Top Row */}
        <div className="relative z-10 flex justify-between items-center">

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Right Icon */}
          <div className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
            <Bell size={24} />
          </div>
        </div>

        {/* Center Heading */}
        <div className="relative z-10 text-center mt-4">
          <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
            ERP Notices
          </h1>

          <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-2 whitespace-nowrap">
            Important School Updates
          </p>
        </div>

      </div>

      {/* Main Ribbon Indicator */}
      <div className="px-6 space-y-6 relative z-20 min-h-[70vh]">
        {loading ? (
          <div className="py-20"><Loader /></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="loaded-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="-mt-14 mb-4">
                <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#42A5F5] animate-pulse"></span>
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 not-italic">
                      All Fees Notices
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2.5 py-0.5 rounded-full font-black text-slate-400 not-italic">
                    {filteredNotices.length} Live
                  </span>
                </div>
              </div>

              {filteredNotices.length > 0 ? (
                <div className="space-y-6 min-h-[420px]">
                  {filteredNotices.map((notice, idx) => {
                    {/* 🔥 FIXED: notice.category ki jagah ab naye model ka notice.noticeType check hoga */ }
                    const isFeeAlert = notice.noticeType === 'fee_alert';

                    return (
                      <motion.div
                        key={notice._id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-xl relative group overflow-hidden"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isFeeAlert ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                              }`}>
                              {isFeeAlert ? <AlertTriangle size={22} /> : <FileText size={22} />}
                            </div>

                            <div>
                              <h4 className={`font-black text-[25px] leading-tight uppercase ${isFeeAlert ? 'text-rose-500' : 'text-amber-500'
                                }`}>
                                {isFeeAlert ? "Fee Alert Notice" : "Financial Notice (Others)"}
                              </h4>
                              <p className="text-[15px] font-bold text-slate-400 italic mt-0.5">
                                Verified & Issued by ERP System
                              </p>
                            </div>
                          </div>

                          {/* Message Body Block */}
                          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                            <p className="text-[19px] font-bold text-slate-600 leading-relaxed italic whitespace-pre-line not-italic">
                              {/* 🔥 FIXED: notice.mode ki jagah ab asli notice.content render hoga */}
                              {notice.content}
                            </p>
                          </div>

                          {/* Footer Date Block */}
                          <div className="flex items-center justify-between text-[12px] font-black uppercase text-slate-800 tracking-widest px-2">
                            <span className="flex items-center gap-2">
                              <Clock size={12} />
                              Published: {new Date(notice.date || notice.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })} at {new Date(notice.date || notice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* Empty Grid State */
                <motion.div
                  key="empty-notices"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-[3.5rem] min-h-[420px] flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 px-8"
                >
                  <Sun size={60} className="mx-auto text-emerald-300 mb-6 animate-spin-slow" />
                  <h3 className="text-[21px] font-black text-slate-800 italic">Clear Account Status</h3>
                  <p className="text-[16px] font-bold text-slate-400 mt-2">
                    No outstanding dues found for this account. Everything is up to date.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Notifications;
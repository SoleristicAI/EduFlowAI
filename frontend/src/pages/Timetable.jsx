import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, BookOpen, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';

const Timetable = ({ user }) => {
  const navigate = useNavigate();

  // --- NAYA LOGIC: LIVE DAY DETECTION ---
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  // Sunday ho toh Monday dikhao, warna jo din hai wahi active rakho
  const [activeDay, setActiveDay] = useState(todayName === 'Sunday' ? 'Monday' : todayName);

  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  const daysMap = [
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' },
  ];

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!user?.grade) { setLoading(false); return; }
      try {
        const { data } = await API.get(`/timetable/${user.grade}`);
        setTimetable(data);
      } catch (err) { console.error("Timetable fetch error"); }
      finally { setLoading(false); }
    };
    fetchTimetable();
  }, [user]);

  const currentSchedule = timetable?.schedule?.find(d => d.day === activeDay);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
      <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[3.5rem] shadow-lg relative overflow-hidden">

        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

        {/* Header Row */}
        <div className="flex justify-between items-center mb-6 relative z-10">

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="bg-white/20 p-2.5 rounded-2xl active:scale-90 border border-white/10 text-white"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Center Title */}
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-black italic tracking-tight capitalize">
              Class Schedule
            </h1>

            <p className="text-[15px] font-bold text-white/80 tracking-widest mt-1 capitalize">
              {user?.grade ? `Class: ${user.grade}` : "Not Assigned"}
            </p>
          </div>

          {/* Right Icon */}
          <div className="bg-white/20 p-2.5 rounded-2xl border border-white/10 text-white">
            <Clock3 size={24} />
          </div>
        </div>

        {/* Days Scroller */}
        <div className="flex justify-between overflow-x-auto gap-3 no-scrollbar py-2 relative z-10">
          {daysMap.map((day) => (
            <button
              key={day.full}
              onClick={() => setActiveDay(day.full)}
              className={`flex flex-col items-center min-w-[60px] py-3 rounded-2xl transition-all duration-300 border ${activeDay === day.full
                  ? "bg-white text-[#42A5F5] border-white shadow-md scale-105"
                  : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                }`}
            >
              <span className="text-[13px] font-black italic capitalize tracking-wide">
                {day.short}
              </span>
            </button>
          ))}
        </div>

      </div>

      <div className="px-5 -mt-10 space-y-4 relative z-20">
        {currentSchedule && currentSchedule.periods.length > 0 ? (
          currentSchedule.periods.map((item, index) => (
            <div key={index} className="bg-white p-5 rounded-[2.5rem] border border-[#DDE3EA] flex gap-5 active:scale-[0.98] transition-all italic shadow-sm group">
              {/* Time Block */}
              <div className="flex flex-col items-center justify-center border-r border-[#DDE3EA] pr-5 min-w-[100px]">
                <Clock size={20} className="text-[#42A5F5] mb-2" />
                <span className="text-[16px] font-black text-black/40 text-center leading-none">
                  {item.startTime}
                </span>
                <span className="text-[16px] font-black text-black/40 text-center mt-1 uppercase">
                  To <br />{item.endTime}
                </span>
              </div>

              <div className="flex-1 py-1">
                <h3 className="font-black text-slate-800 text-[20px] mb-1 capitalize leading-tight group-hover:text-[#42A5F5] transition-colors">
                  {item.subject.toLowerCase()}
                </h3>
                <p className="text-[16px] text-slate-500 font-bold flex items-center gap-2 capitalize">
                  <span className="w-2 h-2 bg-[#42A5F5] rounded-full"></span>
                  Teacher: {item.teacherName?.toLowerCase() || "not assigned"}
                </p>
                <div className="flex items-center gap-2 mt-4 text-[#42A5F5] bg-blue-50 w-fit px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
                  <MapPin size={12} />
                  <span className="text-[16px] font-black tracking-widest uppercase">Room: {item.room || "N/A"}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-[3.5rem] border border-dashed border-[#DDE3EA] mx-1">
            <BookOpen className="mx-auto text-slate-200 mb-4" size={56} />
            <p className="text-slate-400 font-bold text-[20px] italic text-center capitalize">Free from today's classes! ⚡</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timetable;
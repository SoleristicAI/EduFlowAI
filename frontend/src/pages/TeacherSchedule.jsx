import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, Users, Calendar, BookOpen, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion'; // Upar add kar
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react'; // Inhe bhi icons mein add kar lo

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextDateForDay = (targetDay) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const todayIndex = today.getDay();
  const targetIndex = days.indexOf(targetDay);

  let diff = targetIndex - todayIndex;

  if (diff < 0) diff += 7;

  const resultDate = new Date(today);
  resultDate.setDate(today.getDate() + diff);

  // Note: formatLocalDate function wahi hona chahiye jo aapne date format ke liye banaya hai
  return formatLocalDate(resultDate);
};
const TeacherSchedule = () => {
  const navigate = useNavigate();
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const [activeDay, setActiveDay] = useState(todayName === 'Sunday' ? 'Monday' : todayName);
  const [personalSchedule, setPersonalSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDiary, setShowDiary] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [diaryContent, setDiaryContent] = useState("");
  const today = new Date();
  const [diaryDate, setDiaryDate] = useState(formatLocalDate(today));
  const [isSaving, setIsSaving] = useState(false);
  const [submittedDiaries, setSubmittedDiaries] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const daysMap = [
    { short: 'Mon', full: 'Monday' }, { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' }, { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' }, { short: 'Sat', full: 'Saturday' }
  ];
  const openDiaryModal = async (period) => {
    setSelectedPeriod(period);
    setDiaryContent("");

    // 1. Pehle ye dekho ki activeDay (Mon, Tue etc.) ke hisaab se date kya banti hai
    const selectedDayDate = getNextDateForDay(activeDay);

    // 2. State update karo taaki modal mein sahi date dikhe
    setDiaryDate(selectedDayDate);
    setShowDiary(true);

    try {
      // 3. API call mein 'selectedDayDate' bhejo, na ki 'todayStr'
      const { data: existing } = await API.get(
        `/homework/check?className=${period.grade}&subject=${period.subject}&date=${selectedDayDate}`
      );

      if (existing) {
        // Agar us specific date (e.g. Tuesday) ko diary bhari thi, toh content dikhao
        setDiaryContent(existing.content);
      } else {
        // Agar us din ki entry nahi hai, toh fresh (khali) diary dikhao
        setDiaryContent("");
      }
    } catch (err) {
      console.error("Diary check error:", err);
      setDiaryContent("");
    }
  };

  const handleSaveDiary = async () => {
    if (!diaryContent) {
      setToast({ show: true, message: "Diary content is empty! ✍️", type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
      return;
    }

    setIsSaving(true);
    try {
      await API.post('/homework/assign', {
        className: selectedPeriod.grade,
        subject: selectedPeriod.subject,
        date: diaryDate,
        content: diaryContent
      });
      const newKey = `${selectedPeriod.grade}-${selectedPeriod.subject}-${diaryDate}`;
      setSubmittedDiaries(prev => {
        // Duplicate entry na ho isliye check kar rahe hain
        if (prev.includes(newKey)) return prev;
        return [...prev, newKey];
      });

      // handleSaveDiary ke andar
      // handleSaveDiary ke andar isey replace karein:
      setSubmittedDiaries(prev => [...prev, `${selectedPeriod.grade}-${selectedPeriod.subject}-${diaryDate}`]);

      // Success Toast 📡
      setToast({ show: true, message: "Diary Submitted Successfully! 📡", type: 'success' });
      setShowDiary(false);

      // Auto-hide toast after 3 seconds
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);

    } catch (err) {
      setToast({ show: true, message: "Uplink failed! Check connection. 🛡️", type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const calculatedDate = getNextDateForDay(activeDay);
    setDiaryDate(calculatedDate);
  }, [activeDay]); // Jab bhi activeDay badle, date bhi badle

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // STEP 1: Timetable Load Karna (Priority)
        // Sabse pehle backend se teacher ka pura hafte ka schedule mangwaya.
        const { data: scheduleData } = await API.get(
          '/timetable/teacher/personal-schedule'
        );

        // State update ki taaki UI par Periods dikhne lagein
        setPersonalSchedule(scheduleData.schedule);

        // Timetable aate hi loading screen hata di (Taki user ko wait na karna pade)
        setLoading(false);

        // STEP 2: Diary Status Check Karna (Background Process)
        const activeDiaries = [];
        const todayStr = formatLocalDate(new Date()); // Aaj ki date string format mein

        // Hum saare periods par loop chala rahe hain check karne ke liye
        Promise.all(
          scheduleData.schedule.flatMap(day =>
            day.periods.map(async (period) => {
              const key = `${period.grade}-${period.subject}`;

              if (!activeDiaries.includes(key)) {
                try {
                  // Backend se pucha: "Kya is class+subject ki aaj ki diary bhari hai?"
                  const { data: existingToday } = await API.get(
                    `/homework/check?className=${period.grade}&subject=${period.subject}&date=${todayStr}`
                  );
                  if (existingToday) {
                    activeDiaries.push(`${period.grade}-${period.subject}-${todayStr}`);
                  }
                } catch (err) {
                }
              }
            })
          )
        ).then(() => {
          // Jab saare checks pure ho jayein, tab state update karo
          // Isse UI par "Green Check" ya "Submitted" status dikhega
          setSubmittedDiaries(activeDiaries);
        });

      } catch (err) {
        console.error("Initial load failed", err);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Empty dependency array matlab ye sirf page load par ek baar chalega
  // const isDoneToday = submittedDiaries.includes(`${item.grade}-${item.subject}`);

  const currentDayData = personalSchedule?.find(d => d.day === activeDay);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-overscroll-none fixed inset-0 overflow-y-auto">
      {/* Header Section */}
      <div className="bg-white text-slate-800 px-6 pt-12 pb-20 rounded-b-[4rem] border-b border-slate-100 shadow-md relative overflow-hidden">
        <div className="flex justify-between items-center mb-8 relative z-10 px-2">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white rounded-2xl border border-[#DDE3EA] text-[#42A5F5] shadow-md active:scale-90 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-black italic tracking-tight capitalize">Class schedule</h1>
          <div className="p-3 bg-blue-50 rounded-2xl text-[#42A5F5]">
            <Calendar size={24} />
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex justify-between overflow-x-auto gap-3 no-scrollbar py-2 relative z-10 px-2">
          {daysMap.map((day) => (
            <button
              key={day.full}
              onClick={() => setActiveDay(day.full)}
              className={`flex flex-col items-center min-w-[60px] py-4 rounded-2xl border transition-all ${activeDay === day.full
                ? 'bg-[#42A5F5] text-white border-[#42A5F5] shadow-lg shadow-blue-100'
                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white'
                }`}
            >
              <span className="text-[12px] font-black uppercase italic tracking-wider">{day.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Matrix Area */}
      <div className="px-5 -mt-10 space-y-6 relative z-20">
        {currentDayData && currentDayData.periods.length > 0 ? (
          [...currentDayData.periods]
            .sort((a, b) => {
              const timeA = new Date(`1970/01/01 ${a.startTime}`);
              const timeB = new Date(`1970/01/01 ${b.startTime}`);
              return timeA - timeB;
            })
            .map((item, index) => {
              const diaryKey = `${item.grade}-${item.subject}-${diaryDate}`;
              const hasActiveDiary = submittedDiaries.includes(diaryKey);

              return (
                // ... baki card ka code
                <div key={index} className="bg-white rounded-[3rem] p-6 border-l-[8px] border-l-[#42A5F5] shadow-xl border border-slate-100 flex gap-5 relative italic group hover:scale-[1.02] transition-transform">
                  <span className="absolute top-0 right-10 bg-blue-50 text-[#42A5F5] text-[15px] font-black px-5 py-1.5 rounded-b-2xl uppercase tracking-widest border-x border-b border-blue-100">
                    Class: {item.grade}
                  </span>

                  {/* Time Slot */}
                  <div className="flex flex-col items-center justify-center border-r border-slate-100 pr-5 min-w-[100px]">
                    <Clock size={20} className="text-[#42A5F5] mb-2 animate-pulse" />
                    <span className="text-[15px] font-bold text-slate-700 leading-tight uppercase">{item.startTime}</span>
                    <span className="text-[15px] font-bold text-slate-700 uppercase mt-1 italic">To</span>
                    <span className="text-[15px] font-bold text-slate-700 uppercase mt-1 italic">{item.endTime}</span>
                  </div>

                  {/* Subject Info */}
                  <div className="flex-1 pt-4">
                    <h3 className="font-black text-slate-800 text-[20px] leading-tight mb-2 capitalize italic group-hover:text-[#42A5F5] transition-colors">
                      💠 {item.subject}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 mt-3 bg-slate-50 w-fit px-4 py-1.5 rounded-full border border-slate-100">
                      <MapPin size={18} className="text-[#42A5F5]/60" />
                      <span className="text-[15px] font-black uppercase tracking-wider italic">Room no: {item.room}</span>
                    </div>

                    {/* Assign Homework Button */}
                    <button
                      onClick={() => openDiaryModal(item)}
                      className={`mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all shadow-lg ${hasActiveDiary
                        ? 'bg-emerald-500 text-white shadow-emerald-100' // ✅ Green hi rahega
                        : 'bg-[#42A5F5] text-white shadow-blue-100'
                        }`}
                    >
                      {hasActiveDiary ? (
                        <><CheckCircle2 size={16} /> Update Diary (Done)</>
                      ) : (
                        <><BookOpen size={16} />Homework</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="text-center py-24 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-sm mx-2">
            <BookOpen className="mx-auto text-slate-200 mb-6 animate-bounce" size={80} />
            <p className="text-slate-300 font-black text-[15px] uppercase tracking-[0.4em] italic text-center px-10">Free from today classes! ⚡</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showDiary && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDiary(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />

            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100 overflow-visible"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 italic leading-none">Class Diary</h2>
                  <p className="text-[16px] font-bold text-[#42A5F5] uppercase tracking-widest mt-2">
                    {selectedPeriod?.subject} • Class {selectedPeriod?.grade}
                  </p>
                </div>
                <button onClick={() => setShowDiary(false)} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={25} /></button>
              </div>

              {/* Form */}
              <div className="space-y-5 relative">
                <div className="flex flex-col gap-2 relative">
                  <label className="text-[16px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">
                    Date
                  </label>

                  <button
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full text-[19px] bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 flex justify-between items-center"
                  >
                    <span>
                      {new Date(diaryDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <Calendar size={18} className="opacity-60" />
                  </button>
                  <AnimatePresence>
                    {isCalendarOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-3 w-full bg-white border border-blue-100 rounded-[2rem] shadow-2xl p-4 z-[2000]"
                      >
                        {/* Month Control */}
                        <div className="flex justify-between items-center mb-3">
                          <button
                            onClick={() => {
                              const d = new Date(diaryDate);
                              d.setMonth(d.getMonth() - 1);
                              setDiaryDate(formatLocalDate(d));
                            }}
                            className="text-[#42A5F5] font-bold p-2"
                          >
                            ←
                          </button>

                          <span className="font-black text-[#42A5F5]">
                            {new Date(diaryDate).toLocaleDateString('en-GB', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>

                          <button
                            onClick={() => {
                              const d = new Date(diaryDate);
                              d.setMonth(d.getMonth() + 1);
                              setDiaryDate(formatLocalDate(d));
                            }}
                            className="text-[#42A5F5] font-bold p-2"
                          >
                            →
                          </button>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-bold text-slate-400 mb-2">
                          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                            <span key={d}>{d}</span>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({
                            length: new Date(new Date(diaryDate).getFullYear(), new Date(diaryDate).getMonth() + 1, 0).getDate()
                          }, (_, i) => i + 1).map(day => {
                            const current = new Date(diaryDate);
                            const tempDate = new Date(
                              current.getFullYear(),
                              current.getMonth(),
                              day,
                              12
                            );

                            const formatted = formatLocalDate(tempDate);
                            const isSelected = formatted === diaryDate;

                            return (
                              <button
                                key={day}
                                onClick={() => {
                                  setDiaryDate(formatted);
                                  setIsCalendarOpen(false);
                                }}
                                className={`
                p-2 rounded-xl text-[13px] font-black transition-colors
                ${isSelected ? 'bg-[#42A5F5] text-white shadow-md' : 'text-slate-600 hover:bg-blue-50'}
              `}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[16px] font-black uppercase text-slate-400 ml-4 tracking-widest italic">Homework</label>
                  <textarea
                    rows="5"
                    placeholder="e.g. Complete Exercise 4.2 from textbook..."
                    value={diaryContent}
                    onChange={(e) => setDiaryContent(e.target.value)}
                    className="w-full text-[19px] bg-slate-50 border-none p-5 rounded-[2rem] font-bold text-slate-700 outline-none focus:ring-2 ring-blue-100 transition-all resize-none italic"
                  />
                </div>

                <button
                  onClick={handleSaveDiary}
                  disabled={isSaving}
                  className="w-full py-5 bg-[#42A5F5] text-white rounded-[2rem] font-black text-[15px] uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Syncing..." : <><Send size={18} /> Submit Diary</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {toast.show && (
          <motion.div
            initial={{ y: -100, opacity: 0, x: "-50%" }} // Upar se shuru hoga
            animate={{ y: 50, opacity: 1, x: "-50%" }}   // Niche slide hoke aayega (50px top se)
            exit={{ y: -100, opacity: 0, x: "-50%" }}    // Wapas upar jayega
            className={`fixed left-1/2 top-0 z-[9999] px-8 py-4 rounded-[2rem] font-black text-[14px] italic shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center gap-3 border whitespace-nowrap ${toast.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-rose-500 text-white border-rose-400'
              }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherSchedule;
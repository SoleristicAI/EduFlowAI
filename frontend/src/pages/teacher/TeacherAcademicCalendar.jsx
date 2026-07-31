import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Info, MapPin, AlignLeft, CalendarDays, Clock , History, ChevronDown} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

const TeacherAcademicCalendar = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });

    // Calendar States
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventMap, setEventMap] = useState({});

    // Color Legends
    const eventThemeMap = {
        'Holiday': { badge: 'bg-red-100 text-red-600 border-red-200', dot: 'bg-red-500', bg: 'bg-red-50' },
        'Exam': { badge: 'bg-amber-100 text-amber-600 border-amber-200', dot: 'bg-amber-500', bg: 'bg-amber-50' },
        'PTM': { badge: 'bg-indigo-100 text-indigo-600 border-indigo-200', dot: 'bg-indigo-500', bg: 'bg-indigo-50' },
        'Event': { badge: 'bg-emerald-100 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500', bg: 'bg-emerald-50' }
    };

    const [activeSession, setActiveSession] = useState(null);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!activeSession) {
                const sessionRes = await API.get('/users/general/session-info');
                setActiveSession(sessionRes.data.activeSession);
                setAvailableSessions(sessionRes.data.allAvailableSessions);
                fetchCalendarEvents(sessionRes.data.activeSession);
            } else {
                fetchCalendarEvents(activeSession);
            }
        };
        init();
    }, [activeSession]);

    const triggerToast = (message, type = "success") => {
        setShowToast({ show: true, message, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const fetchCalendarEvents = async (sessionParam) => {
        if (!sessionParam) return;
        setLoading(true);
        try {
            const { data } = await API.get(`/academic-calendar/all-events?session=${sessionParam}`);
            setEvents(data);
            processEventsForCalendar(data);
        } catch (err) {
            triggerToast("Failed to load calendar updates.", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- SMART PARSER FOR MULTIPLE DAYS ---
    const processEventsForCalendar = (apiEvents) => {
        const map = {};
        apiEvents.forEach(evt => {
            map[evt.date] = evt;

            const multiDayMatch = evt.description?.match(/Duration: From (\d{2}-\d{2}-\d{4}) To (\d{2}-\d{2}-\d{4})/);
            if (multiDayMatch) {
                const startDateStr = multiDayMatch[1];
                const endDateStr = multiDayMatch[2];

                const parseDt = (str) => {
                    const [d, m, y] = str.split('-');
                    return new Date(y, m - 1, d);
                };

                const startDt = parseDt(startDateStr);
                const endDt = parseDt(endDateStr);

                let currentDt = new Date(startDt);
                while (currentDt <= endDt) {
                    const d = String(currentDt.getDate()).padStart(2, '0');
                    const m = String(currentDt.getMonth() + 1).padStart(2, '0');
                    const y = currentDt.getFullYear();
                    map[`${d}-${m}-${y}`] = evt;
                    currentDt.setDate(currentDt.getDate() + 1);
                }
            }
        });
        setEventMap(map);
    };

    const handleDateClick = (dateStr, isPast) => {
        if (isPast) return;
        if (eventMap[dateStr]) {
            setSelectedEvent(eventMap[dateStr]);
        } else {
            // Khali date (Regular Day)
            setSelectedEvent({
                isEmpty: true,
                date: dateStr
            });
        }
    };

    const canGoPrev = viewDate.getFullYear() > today.getFullYear() || (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() > today.getMonth());

    const prevMonth = () => { if (canGoPrev) setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); setSelectedEvent(null); };
    const nextMonth = () => { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); setSelectedEvent(null); };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            {/* BASE HEADER */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-visible">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50 rounded-b-[4rem]"></div>

                {/* Top Row - isko z-[100] diya taaki Dropdown white box ke upar aaye */}
                <div className="flex justify-between items-center relative z-[100]">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Center Title & Dropdown (Replaced Subtitle) */}
                    <div className="text-center absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <h1 className="text-4xl font-black italic tracking-tight text-white capitalize">
                            Calendar
                        </h1>

                        {/* 🔥 SESSION GLASS DROPDOWN 🔥 */}
                        <div className="relative mt-2">
                            <button
                                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 border border-white/30 backdrop-blur-sm shadow-sm rounded-full active:scale-95 transition-all"
                            >
                                <History size={14} className="text-white" />
                                <span className="text-[12px] font-black tracking-widest text-white uppercase">{activeSession || 'Loading...'}</span>
                                <ChevronDown size={14} className={`text-white transition-transform ${isSessionDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isSessionDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full mt-2 w-full min-w-[140px] left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-blue-50 overflow-hidden"
                                    >
                                        {availableSessions.map((session) => (
                                            <div
                                                key={session}
                                                onClick={() => {
                                                    setActiveSession(session);
                                                    setIsSessionDropdownOpen(false);
                                                }}
                                                className={`px-4 py-3 text-center cursor-pointer text-[13px] font-black italic transition-all ${activeSession === session ? 'bg-[#42A5F5] text-white' : 'text-slate-600 hover:bg-blue-50'}`}
                                            >
                                                {session}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Icon Restored */}
                    <div className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                        <CalendarIcon size={24} />
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20 space-y-6 max-w-3xl mx-auto">

                {/* 1. LEGENDS BAR */}
                <div className="bg-white p-5 rounded-[2rem] shadow-lg border border-[#E2E8F0] flex flex-wrap justify-center gap-4">
                    {Object.keys(eventThemeMap).map(type => (
                        <div key={type} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${eventThemeMap[type].dot} shadow-sm`}></div>
                            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{type}</span>
                        </div>
                    ))}
                </div>

                {/* 2. CALENDAR BOARD */}
                <div className="bg-white rounded-[3.5rem] p-6 md:p-10 shadow-xl border border-[#E2E8F0]">
                    <div className="flex justify-between items-center mb-8 bg-slate-50 p-3 rounded-[2rem] border border-slate-100">
                        <button onClick={prevMonth} disabled={!canGoPrev} className={`p-3 rounded-full font-black transition-all ${canGoPrev ? 'bg-white text-slate-700 hover:bg-[#42A5F5] hover:text-white shadow-sm' : 'text-slate-300 cursor-not-allowed opacity-50'}`}>←</button>
                        <span className="font-black text-[#42A5F5] text-lg md:text-xl uppercase tracking-widest">
                            {viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                        </span>
                        <button onClick={nextMonth} className="p-3 bg-white text-slate-700 rounded-full font-black hover:bg-[#42A5F5] hover:text-white shadow-sm transition-all">→</button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">
                        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (<span key={d}>{d}</span>))}
                    </div>

                    <div className="grid grid-cols-7 gap-2 md:gap-3">
                        {(() => {
                            const year = viewDate.getFullYear();
                            const month = viewDate.getMonth();
                            const firstDay = new Date(year, month, 1);
                            const lastDate = new Date(year, month + 1, 0).getDate();

                            let startDay = firstDay.getDay();
                            startDay = startDay === 0 ? 6 : startDay - 1;

                            const days = [];

                            for (let i = 0; i < startDay; i++) {
                                days.push(<div key={`empty-${i}`} className="p-4"></div>);
                            }

                            for (let d = 1; d <= lastDate; d++) {
                                const tempDate = new Date(year, month, d);
                                tempDate.setHours(0, 0, 0, 0);
                                const isPast = tempDate < today;

                                const formattedVal = tempDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                                const hasEvent = eventMap[formattedVal];
                                const isSelected = selectedEvent && !selectedEvent.isEmpty && selectedEvent._id === hasEvent?._id;
                                const isSelectedEmpty = selectedEvent && selectedEvent.isEmpty && selectedEvent.date === formattedVal;

                                let cellStyle = "text-slate-700 bg-slate-50 border border-slate-100 hover:border-[#42A5F5]";
                                if (isPast) {
                                    cellStyle = "text-slate-300 bg-slate-50 opacity-40 cursor-not-allowed";
                                } else if (hasEvent) {
                                    cellStyle = `${eventThemeMap[hasEvent.eventType].bg} ${eventThemeMap[hasEvent.eventType].dot.replace('bg-', 'text-')} border-2 border-transparent font-black shadow-sm relative`;
                                }

                                if ((isSelected || isSelectedEmpty) && !isPast) {
                                    cellStyle += " ring-4 ring-offset-2 ring-blue-300 transform scale-105 z-10 shadow-md";
                                }

                                days.push(
                                    <button
                                        key={d}
                                        type="button"
                                        disabled={isPast}
                                        onClick={() => handleDateClick(formattedVal, isPast)}
                                        className={`p-3 md:p-4 rounded-2xl text-sm md:text-base font-black transition-all flex justify-center items-center ${cellStyle}`}
                                    >
                                        {d}
                                        {hasEvent && !isPast && (
                                            <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${eventThemeMap[hasEvent.eventType].dot}`}></div>
                                        )}
                                    </button>
                                );
                            }
                            return days;
                        })()}
                    </div>
                </div>

                {/* 3. SELECTED EVENT DETAILS CARDS */}
                <AnimatePresence>
                    {selectedEvent && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-8 shadow-2xl border-4 border-blue-50 overflow-hidden relative"
                        >
                            {selectedEvent.isEmpty ? (
                                <div className="relative z-10 text-center py-4">
                                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarIcon size={32} />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Date: {selectedEvent.date}</p>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-wide mb-2">Regular Day</h2>
                                    <p className="text-sm font-medium text-slate-500 bg-slate-50 p-3 rounded-2xl inline-block mt-2">
                                        No holidays, exams, or special events scheduled.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${eventThemeMap[selectedEvent.eventType].dot}`}></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`px-4 py-2 rounded-full border text-[10px] md:text-xs font-black uppercase tracking-widest ${eventThemeMap[selectedEvent.eventType].badge}`}>
                                                {selectedEvent.eventType}
                                            </span>
                                            {selectedEvent.description?.includes('Duration:') ? (
                                                <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest">
                                                    <CalendarDays size={12} /> Multiple Days
                                                </span>
                                            ) : (
                                                <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest">
                                                    <Clock size={12} /> Single Day
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-wide mb-4 leading-tight">
                                            {selectedEvent.title}
                                        </h2>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <CalendarIcon size={20} className="text-[#42A5F5] shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Date</p>
                                                    <p className="text-sm font-bold text-slate-700">{selectedEvent.date}</p>
                                                </div>
                                            </div>

                                            {selectedEvent.description && (
                                                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <AlignLeft size={20} className="text-[#42A5F5] shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Context & Instructions</p>
                                                        <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                                            {selectedEvent.description.replace(/\| Duration:.*/, '')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TeacherAcademicCalendar;
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Calendar, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminEditTimetable = () => {
    const navigate = useNavigate();
    
    const [day, setDay] = useState('');
    const [grade, setGrade] = useState('');
    
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [existingGrades, setExistingGrades] = useState([]);

    const [masterSchedule, setMasterSchedule] = useState({});

    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
    const [activeTeacherDropdown, setActiveTeacherDropdown] = useState(null);
    const [activeSubjectDropdown, setActiveSubjectDropdown] = useState(null);

    useEffect(() => {
        fetchTeachers();
        fetchGrades();
    }, []);

    useEffect(() => {
        if (day) {
            loadMasterSchedule(day);
        } else {
            setMasterSchedule({}); 
        }
    }, [day]);

    const fetchTeachers = async () => {
        try {
            const { data } = await API.get('/timetable/teachers-list');
            setTeachers(data);
        } catch (err) { console.error("Faculty sync error"); }
    };

    const fetchGrades = async () => {
        try {
            const { data } = await API.get('/timetable/grades/list');
            const sortedGrades = data.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
            setExistingGrades(sortedGrades);
        } catch (err) { console.error("Grade sync error"); }
    };

    const loadMasterSchedule = async (selectedDay) => {
        try {
            const { data } = await API.get(`/timetable/school/day/${selectedDay}`);
            setMasterSchedule(data);
        } catch (err) { 
            console.error("Master schedule load error"); 
        }
    };

    const periods = masterSchedule[grade] || [];

    const setPeriods = (newPeriods) => {
        setMasterSchedule(prev => ({
            ...prev,
            [grade]: newPeriods
        }));
    };

    // 🔥 TIME PARSER & OVERLAP ALGORITHM (FAANG LEVEL) 🔥
    const parseTimeToMinutes = (timeStr) => {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return (hours * 60) + (minutes || 0);
    };

    const getTeacherStatus = (empId, startTime, endTime) => {
        if (!startTime || !endTime) return "Time not set";

        const startA = parseTimeToMinutes(startTime);
        const endA = parseTimeToMinutes(endTime);

        for (const g of Object.keys(masterSchedule)) {
            if (g === grade) continue; 
            const classPeriods = masterSchedule[g];

            const isBusy = classPeriods.find(p => {
                if (p.teacherEmpId !== empId || !p.startTime || !p.endTime) return false;
                const startB = parseTimeToMinutes(p.startTime);
                const endB = parseTimeToMinutes(p.endTime);

                // Overlap: A starts before B ends AND B starts before A ends
                return startA < endB && startB < endA;
            });

            if (isBusy) return `In ${g}`;
        }
        return "Free";
    };

    const updateTime = (index, field, type, value) => {
        const newPeriods = [...periods];
        const currentStr = newPeriods[index][field] || "09:00 AM";
        let [time, modifier] = currentStr.split(' ');
        let [hour, minute] = time.split(':');

        let val = value.slice(0, 2);
        if (type === 'hour') hour = val;
        if (type === 'minute') minute = val;

        newPeriods[index][field] = `${hour}:${minute} ${modifier}`;
        setPeriods(newPeriods);
    };

    const validateTimeOnBlur = (index, field, type) => {
        const newPeriods = [...periods];
        let [time, modifier] = newPeriods[index][field].split(' ');
        let [hour, minute] = time.split(':');

        if (type === 'hour') {
            let hr = parseInt(hour);
            if (isNaN(hr) || hr < 1) hour = "01";
            else if (hr > 12) hour = "12";
            else hour = hr.toString().padStart(2, '0');
        }

        if (type === 'minute') {
            let min = parseInt(minute);
            if (isNaN(min) || min < 0) minute = "00";
            else if (min > 59) minute = "59";
            else minute = min.toString().padStart(2, '0');
        }

        newPeriods[index][field] = `${hour}:${minute} ${modifier}`;
        setPeriods(newPeriods);
    };

    const addPeriod = () => {
        if (!day || !grade) {
            setMsg("Select both Day and Class first! ⚠️");
            return;
        }
        setPeriods([...periods, { startTime: '09:00 AM', endTime: '10:00 AM', subject: '', room: '', teacherEmpId: '' }]);
    };

    const removePeriod = (index) => {
        setPeriods(periods.filter((_, i) => i !== index));
    };

    const handleUpdateAll = async () => {
        if (!day) return setMsg("Select a day to save schedule! ⚠️");
        
        setLoading(true);
        try {
            const payload = {
                day: day,
                masterSchedule: masterSchedule 
            };
            const { data } = await API.post('/timetable/bulk-upload', payload);
            setMsg(data.message);
        } catch (err) {
            setMsg(err.response?.data?.message || "Sync failed!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            
            {/* Header Area */}
            <div className="bg-[#42A5F5] text-white px-4 md:px-8 pt-10 pb-28 rounded-b-[3rem] shadow-lg relative overflow-visible flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="bg-white/20 p-2.5 rounded-xl border border-white/30 text-white active:scale-90 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight italic">Schedule</h1>
                        <p className="text-[12px] font-black text-blue-100 uppercase tracking-widest mt-1 italic">Master Planner</p>
                    </div>
                </div>

                <div className="mt-6 md:mt-0 w-full md:w-auto overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                            <button
                                key={d}
                                onClick={() => setDay(d)}
                                className={`px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${day === d ? 'bg-white text-[#42A5F5] shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 md:px-8 -mt-16 relative z-20">
                
                {/* Control Bar */}
                <div className="bg-white p-4 rounded-3xl border border-blue-50 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    {/* Class Selector Dropdown */}
                    <div className="relative w-full md:w-64 z-[120]">
                        <div 
                            onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
                            className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                        >
                            <span className="font-black text-[15px] text-[#42A5F5] uppercase italic">
                                Class: {grade || "Select"}
                            </span>
                            <Plus size={18} className={`text-[#42A5F5] transition-transform duration-300 ${isGradeDropdownOpen ? 'rotate-45' : 'rotate-0'}`} />
                        </div>

                        <AnimatePresence>
                            {isGradeDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsGradeDropdownOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 right-0 mt-2 bg-white border border-blue-50 rounded-2xl shadow-2xl overflow-hidden z-20 ring-1 ring-slate-100"
                                    >
                                        <div className="max-h-60 overflow-y-auto">
                                            {existingGrades.map((g) => (
                                                <div
                                                    key={g}
                                                    onClick={() => { setGrade(g); setIsGradeDropdownOpen(false); }}
                                                    className={`p-4 text-[14px] font-black italic uppercase border-b border-slate-50 last:border-none cursor-pointer ${grade === g ? 'bg-blue-50 text-[#42A5F5]' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    {g}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex w-full md:w-auto gap-3">
                        <button onClick={addPeriod} className="flex-1 md:flex-none px-6 py-4 bg-white text-[#42A5F5] border border-blue-200 rounded-2xl font-black uppercase text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <Plus size={16} /> Add Slot
                        </button>
                        <button onClick={handleUpdateAll} disabled={loading} className="flex-1 md:flex-none px-8 py-4 bg-[#42A5F5] text-white rounded-2xl font-black uppercase text-[12px] shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <Save size={16} /> {loading ? "Saving..." : "Save Master"}
                        </button>
                    </div>
                </div>

                {/* 🔥 GRID LAYOUT FOR PERIODS 🔥 */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(!day || !grade) ? (
                        <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <Calendar className="mx-auto text-slate-200 mb-4" size={56} />
                            <p className="text-slate-400 font-bold text-[16px] italic capitalize px-10">Select a Day and Class to manage timeline</p>
                        </div>
                    ) : periods.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <Clock className="mx-auto text-slate-200 mb-4" size={56} />
                            <p className="text-slate-400 font-bold text-[16px] italic capitalize px-10">No slots available. Click 'Add Slot' to begin.</p>
                        </div>
                    ) : periods.map((p, index) => (
                        <div key={index} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm relative group">
                            
                            <button 
                                onClick={() => removePeriod(index)} 
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-50 rounded-xl"><Clock size={14} className="text-[#42A5F5]" /></div>
                                <h3 className="text-[14px] font-black text-slate-700 uppercase italic">Slot {index + 1}</h3>
                            </div>

                            {/* Compact Time Inputs */}
                            <div className="flex items-center justify-between gap-2 mb-5">
                                <div className="flex-[0.48] bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-center gap-1 shadow-inner">
                                    <input
                                        type="number" placeholder="HH"
                                        className="w-10 bg-transparent text-center text-[16px] font-black text-[#42A5F5] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={p.startTime ? p.startTime.split(':')[0] : ''}
                                        onChange={(e) => updateTime(index, 'startTime', 'hour', e.target.value)}
                                        onBlur={() => validateTimeOnBlur(index, 'startTime', 'hour')}
                                    />
                                    <span className="font-black text-slate-300 pb-0.5">:</span>
                                    <input
                                        type="number" placeholder="MM"
                                        className="w-10 bg-transparent text-center text-[16px] font-black text-[#42A5F5] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={p.startTime ? p.startTime.split(':')[1]?.split(' ')[0] : ''}
                                        onChange={(e) => updateTime(index, 'startTime', 'minute', e.target.value)}
                                        onBlur={() => validateTimeOnBlur(index, 'startTime', 'minute')}
                                    />
                                    <button
                                        onClick={() => {
                                            const newPeriods = [...periods];
                                            const [time, oldMod] = (newPeriods[index].startTime || "09:00 AM").split(' ');
                                            newPeriods[index].startTime = `${time} ${oldMod === 'AM' ? 'PM' : 'AM'}`;
                                            setPeriods(newPeriods);
                                        }}
                                        className="ml-1 text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-white text-slate-700 shadow-sm border border-slate-200 active:scale-95 transition-all"
                                    >
                                        {p.startTime?.split(' ')[1] || 'AM'}
                                    </button>
                                </div>

                                <span className="text-slate-300 font-black">-</span>

                                <div className="flex-[0.48] bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-center gap-1 shadow-inner">
                                    <input
                                        type="number" placeholder="HH"
                                        className="w-10 bg-transparent text-center text-[16px] font-black text-[#42A5F5] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={p.endTime ? p.endTime.split(':')[0] : ''}
                                        onChange={(e) => updateTime(index, 'endTime', 'hour', e.target.value)}
                                        onBlur={() => validateTimeOnBlur(index, 'endTime', 'hour')}
                                    />
                                    <span className="font-black text-slate-300 pb-0.5">:</span>
                                    <input
                                        type="number" placeholder="MM"
                                        className="w-10 bg-transparent text-center text-[16px] font-black text-[#42A5F5] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={p.endTime ? p.endTime.split(':')[1]?.split(' ')[0] : ''}
                                        onChange={(e) => updateTime(index, 'endTime', 'minute', e.target.value)}
                                        onBlur={() => validateTimeOnBlur(index, 'endTime', 'minute')}
                                    />
                                    <button
                                        onClick={() => {
                                            const newPeriods = [...periods];
                                            const [time, oldMod] = (newPeriods[index].endTime || "10:00 AM").split(' ');
                                            newPeriods[index].endTime = `${time} ${oldMod === 'AM' ? 'PM' : 'AM'}`;
                                            setPeriods(newPeriods);
                                        }}
                                        className="ml-1 text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-white text-slate-700 shadow-sm border border-slate-200 active:scale-95 transition-all"
                                    >
                                        {p.endTime?.split(' ')[1] || 'AM'}
                                    </button>
                                </div>
                            </div>

                            {/* Dropdowns */}
                            <div className="space-y-3">
                                {/* Teacher Dropdown */}
                                <div className="relative">
                                    <div 
                                        onClick={() => setActiveTeacherDropdown(activeTeacherDropdown === index ? null : index)}
                                        className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer"
                                    >
                                        <span className="text-[13px] font-black text-slate-700 uppercase italic truncate">
                                            {p.teacherEmpId ? teachers.find(t => t.employeeId === p.teacherEmpId)?.name : "Assign Teacher"}
                                        </span>
                                    </div>
                                    <AnimatePresence>
                                        {activeTeacherDropdown === index && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setActiveTeacherDropdown(null)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                    className="absolute w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                                                >
                                                    <div className="max-h-40 overflow-y-auto">
                                                        {teachers.map((t) => {
                                                            // 🔥 YAHAN START AUR END TIME DONO PASS HOTE HAIN 🔥
                                                            const tStatus = getTeacherStatus(t.employeeId, p.startTime, p.endTime);
                                                            const isFree = tStatus === "Free";
                                                            return (
                                                                <div
                                                                    key={t.employeeId}
                                                                    onClick={() => {
                                                                        const n = [...periods];
                                                                        n[index].teacherEmpId = t.employeeId;
                                                                        n[index].subject = '';
                                                                        setPeriods(n);
                                                                        setActiveTeacherDropdown(null);
                                                                    }}
                                                                    className={`p-3 flex justify-between items-center border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${p.teacherEmpId === t.employeeId ? 'bg-blue-50' : ''}`}
                                                                >
                                                                    <div>
                                                                        <p className="text-[13px] font-black italic uppercase text-slate-700">{t.name}</p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{t.subjects[0]}</p>
                                                                    </div>
                                                                    <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${isFree ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                                                        {tStatus}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div 
                                            onClick={() => { if (p.teacherEmpId) setActiveSubjectDropdown(activeSubjectDropdown === index ? null : index); }}
                                            className={`w-full p-3.5 rounded-xl border flex items-center justify-between ${!p.teacherEmpId ? 'bg-slate-100 opacity-50 cursor-not-allowed' : 'bg-slate-50 border-slate-100 cursor-pointer'}`}
                                        >
                                            <span className="text-[13px] font-black uppercase italic truncate text-slate-600">
                                                {p.subject || "Subject"}
                                            </span>
                                        </div>
                                        <AnimatePresence>
                                            {activeSubjectDropdown === index && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveSubjectDropdown(null)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                        className="absolute w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                                                    >
                                                        {teachers.find(t => t.employeeId === p.teacherEmpId)?.subjects.map((sub) => (
                                                            <div
                                                                key={sub}
                                                                onClick={() => {
                                                                    const n = [...periods]; n[index].subject = sub; setPeriods(n);
                                                                    setActiveSubjectDropdown(null);
                                                                }}
                                                                className="p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 text-[12px] font-black italic uppercase text-slate-700"
                                                            >
                                                                {sub}
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <input
                                        type="text" placeholder="Room"
                                        className="w-20 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[13px] font-black text-slate-700 text-center uppercase outline-none focus:border-[#42A5F5]"
                                        value={p.room}
                                        onChange={(e) => { const n = [...periods]; n[index].room = e.target.value; setPeriods(n); }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default AdminEditTimetable;
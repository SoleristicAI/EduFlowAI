import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Save, Calendar, RefreshCcw, ClipboardCheck, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';
import Loader from '../components/Loader';
import { AnimatePresence, motion } from 'framer-motion';

const getLocalDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-CA');
};

const TeacherAttendance = ({ user }) => {
    const navigate = useNavigate();
    const dateRef = useRef(null);
    const [assignedClass, setAssignedClass] = useState(user?.assignedClass || null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showToast, setShowToast] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [showList, setShowList] = useState(false); // Controls gatekeeper
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingCount, setPendingCount] = useState(0);

    const today = new Date().toISOString().split('T')[0];
    const isFutureDate = selectedDate > today;

    useEffect(() => {
        const fetchData = async () => {
            if (!assignedClass) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setShowList(false); // Date badalne par pehle gatekeeper dikhao
                const { data: resp } = await API.get(`/attendance/my-students`);
                const { data: existing } = await API.get(`/attendance/view?grade=${assignedClass}&date=${selectedDate}`);

                const stdList = resp.students;

                if (existing && existing.records.length > 0) {
                    const formattedData = stdList.map(s => {
                        const record = existing.records.find(r => r.studentId === s._id || r.student === s._id);
                        return {
                            id: s._id,
                            name: s.name,
                            roll: s.enrollmentNo,
                            status: record ? record.status : 'Present'
                        };
                    });
                    setStudents(formattedData);
                    setIsUpdateMode(true);
                } else {
                    const formattedData = stdList.map(s => ({
                        id: s._id,
                        name: s.name,
                        roll: s.enrollmentNo,
                        status: 'Present'
                    }));
                    setStudents(formattedData);
                    setIsUpdateMode(false);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDate, assignedClass]);

    const toggleStatus = (id) => {
        setStudents(students.map(s =>
            s.id === id ? { ...s, status: s.status === 'Present' ? 'Absent' : 'Present' } : s
        ));
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateRef.current && !dateRef.current.contains(event.target)) {
                setIsDateOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchPendingCount = async () => {
    if (!assignedClass) return; // Agar class assigned nahi hai toh request mat bhejo
    try {
        const { data } = await API.get('/leaves/pending-count');
        setPendingCount(data.count);
    } catch (err) {
        console.error("Error fetching count");
    }
};

    useEffect(() => {
        // Jab bhi teacher is page par wapas aaye (focus kare), count refresh ho
        const handleFocus = () => fetchPendingCount();
        window.addEventListener('focus', handleFocus);

        fetchPendingCount(); // Initial load

        return () => window.removeEventListener('focus', handleFocus);
    }, []);


    const handleSubmit = async () => {
        if (students.length === 0) return;
        setIsSaving(true);
        try {
            const records = students.map(s => ({
                studentId: s.id,
                name: s.name,
                status: s.status
            }));
            const payload = {
                grade: assignedClass,
                date: selectedDate,
                records: records
            };
            await API.post('/attendance/mark', payload);
            setShowToast(true);
            setTimeout(() => {
                setIsSaving(false);
                setShowList(false);
            }, 2000);
        } catch (err) {
            alert(err.response?.data?.message || "Submission failed!");
            setIsSaving(false);
        }
    };

    if (loading) return <Loader />;

    if (!assignedClass) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-center p-10 italic">
            <p className="text-slate-300 font-black text-[18px] uppercase italic tracking-widest leading-relaxed">
                No class assigned to you! <br />
                <span className="text-[#42A5F5] text-[12px]">Contact admin to assign you a class.</span>
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-25 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {showToast && (
                <Toast
                    message={isUpdateMode ? "Records updated successfully!" : "Attendance marked successfully!"}
                    type="success"
                    onClose={() => setShowToast(false)}
                />
            )}

            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-md border-b border-slate-100 relative z-10 overflow-visible">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-50 to-transparent pointer-events-none opacity-50"></div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl border border-[#DDE3EA] text-[#42A5F5] shadow-md active:scale-90 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-black italic tracking-tight text-slate-800">Attendance </h1>
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-[#42A5F5] shadow-sm">
                        <Calendar size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[3rem] border border-[#DDE3EA] shadow-lg italic relative z-10">
                    <div className="flex justify-between items-center px-2">
                        <div>
                            {/* <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest italic mb-1"></p> */}
                            <h2 className="font-black text-xl text-[#42A5F5] italic uppercase tracking-tighter">
                                Class {assignedClass}
                            </h2>
                        </div>
                        <div ref={dateRef} className="text-right relative overflow-visible">
                            <p className="text-[12px] font-black uppercase text-slate-400 tracking-widest italic mb-1 mr-2">Select date</p>

                            {/* Trigger Button */}
                            <button
                                onClick={() => setIsDateOpen(!isDateOpen)}
                                className="bg-slate-50 p-3 px-5 rounded-2xl font-black text-[16px] text-[#42A5F5] italic border border-slate-100 shadow-sm flex items-center gap-2 active:scale-95 transition-all"
                            >
                                <span>{new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                <Calendar size={16} className="opacity-60" />
                            </button>

                            {/* Custom Dropdown Calendar */}
                            <AnimatePresence>
                                {isDateOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 z-[100] bg-white border border-blue-100 rounded-[2.5rem] shadow-2xl p-6 w-72"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <h4 className="text-[12px] font-black uppercase text-slate-800 text-center tracking-widest">Change Date</h4>

                                            {/* Native Input Hidden but controlled by Custom UI */}
                                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">

                                                {/* HEADER */}
                                                <div className="flex justify-between items-center mb-3">
                                                    <button
                                                        onClick={() =>
                                                            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                                                        }
                                                        className="text-[#42A5F5] font-bold"
                                                    >
                                                        ←
                                                    </button>

                                                    <span className="font-black text-[#42A5F5]">
                                                        {viewDate.toLocaleDateString('en-GB', {
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>

                                                    <button
                                                        onClick={() =>
                                                            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                                                        }
                                                        className="text-[#42A5F5] font-bold"
                                                    >
                                                        →
                                                    </button>
                                                </div>

                                                {/* DAYS NAME */}
                                                <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-bold text-slate-400 mb-2">
                                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                                                        <span key={d}>{d}</span>
                                                    ))}
                                                </div>

                                                {/* CALCULATIONS */}
                                                {/* CALCULATIONS SECTION KE ANDAR IS JAGAH CHANGE KARO */}
                                                {(() => {
                                                    const year = viewDate.getFullYear();
                                                    const month = viewDate.getMonth();
                                                    const firstDay = new Date(year, month, 1);
                                                    const lastDate = new Date(year, month + 1, 0).getDate();
                                                    let startDay = firstDay.getDay();
                                                    startDay = startDay === 0 ? 6 : startDay - 1;

                                                    const days = [];
                                                    for (let i = 0; i < startDay; i++) {
                                                        days.push(<div key={"empty-" + i}></div>);
                                                    }

                                                    for (let day = 1; day <= lastDate; day++) {
                                                        const tempDate = new Date(year, month, day);
                                                        const formatted = tempDate.toISOString().split('T')[0];
                                                        const isSelected = formatted === selectedDate;
                                                        const isFuture = formatted > today;

                                                        days.push(
                                                            <button
                                                                key={day}
                                                                disabled={isFuture}
                                                                onClick={() => {
                                                                    // --- STEP 2 KA KAAM YAHAN HUA HAI ---
                                                                    const dYear = viewDate.getFullYear();
                                                                    const dMonth = viewDate.getMonth();
                                                                    const selectedTempDate = new Date(dYear, dMonth, day);

                                                                    setSelectedDate(getLocalDate(selectedTempDate)); // 👈 Ye fix laga diya
                                                                    setIsDateOpen(false);
                                                                }}
                                                                className={`p-2 rounded-xl text-[13px] font-black
                    ${isSelected ? 'bg-blue-50' : 'text-slate-600'}
                    ${isFuture ? 'opacity-20 cursor-not-allowed' : 'hover:bg-blue-100'}
                `}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    }
                                                    return <div className="grid grid-cols-7 gap-2">{days}</div>;
                                                })()}
                                            </div>


                                            <p className="text-[15px] text-slate-900 font-bold text-center italic">
                                                Future dates are not allowed
                                            </p>

                                            <button
                                                onClick={() => setIsDateOpen(false)}
                                                className="w-full py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest italic active:scale-95 transition-all"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    {/* LEAVE REQUEST BUTTON */}
                    <div className="mt-2 relative">
                        <button
                            onClick={() => navigate('/teacher/leave-requests')} // Ye route hum baad mein set karenge
                            className="w-full bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-lg flex items-center justify-between group transition-all hover:border-[#42A5F5] active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-5">
                                <div className="bg-blue-50 text-[#42A5F5] p-4 rounded-2xl group-hover:bg-[#42A5F5] group-hover:text-white transition-all">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-[17px] font-black text-slate-700 italic uppercase">Leave Requests</h3>
                                    {/* <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Review pending applications</p> */}
                                </div>
                            </div>

                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[14px] transition-all duration-500
        ${pendingCount > 0
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-200 animate-bounce"
                                        : "bg-slate-100 text-slate-400"
                                    }`}
                            >
                                {pendingCount}
                            </motion.div>
                        </button>
                    </div>
                </div>

            </div>
            {/* Main Area */}
            <div className={`px-5 -mt-10 space-y-6 relative ${isDateOpen ? 'z-0' : 'z-20'}`}>
                {!showList ? (
                    /* GATEKEEPER BUTTON VIEW */
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[4rem] border-2 border-dashed border-slate-200 shadow-xl mx-2 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 relative z-0">
                        {isFutureDate ? (
                            <>
                                <div className="p-8 bg-rose-50 rounded-full border border-rose-100">
                                    <AlertCircle size={60} className="text-rose-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-slate-800 italic uppercase">System locked</h3>
                                    <p className="text-[13px] text-slate-900 font-bold uppercase tracking-widest px-10">
                                        Cannot Mark Attendance for future dates. Please select current or past date.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-8 bg-blue-50 rounded-full border border-blue-100 shadow-inner">
                                    <ClipboardCheck size={60} className="text-[#42A5F5]" />
                                </div>
                                <div className="space-y-2">
                                    {/* <h3 className="text-2xl font-black text-slate-800 italic capitalize">Ready for session</h3> */}
                                    <p className="text-[18px] text-slate-900 font-bold uppercase tracking-widest">
                                        Class: {assignedClass} • Date: {new Date(selectedDate).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowList(true)}
                                    className="px-12 py-6 bg-[#42A5F5] text-white rounded-[2.5rem] font-black uppercase text-[15px] tracking-[0.2em] shadow-2xl shadow-blue-200 active:scale-95 transition-all italic border-b-4 border-blue-700"
                                >
                                    {isUpdateMode ? "Update attendance" : "Take attendance"}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    /* ATTENDANCE LIST VIEW */
                    <>
                        <div className="flex justify-between items-center px-6 mb-2">
                            <span className="text-[15px] font-black text-[#42A5F5] uppercase tracking-widest italic">
                                {isUpdateMode ? '📍 Updating Atd.' : '📝 Mark Atd.'}
                            </span>
                            <span className="text-[15px] font-black text-white uppercase tracking-widest bg-[#42A5F5] px-5 py-2 rounded-full shadow-md italic">
                                Present: {students.filter(s => s.status === 'Present').length} / {students.length}
                            </span>
                        </div>
                        {/* --- NEURAL SEARCH NODE --- */}
                        <div className="px-2 mb-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <RefreshCcw size={20} className={`text-[#42A5F5] transition-all ${searchQuery ? 'animate-spin' : 'opacity-40'}`} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name or roll no..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-[#DDE3EA] p-5 pl-14 rounded-[2rem] text-[16px] font-black italic text-slate-900 outline-none focus:border-[#42A5F5] focus:shadow-lg focus:shadow-blue-50 transition-all placeholder:text-slate-300 shadow-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-5 flex items-center text-slate-300 hover:text-rose-500"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {students
                                .filter(student =>
                                    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    student.roll.toString().includes(searchQuery)
                                )
                                .map((student) => (
                                    <div key={student.id} className="bg-white p-6 rounded-[3rem] flex justify-between items-center shadow-md border border-[#DDE3EA] group hover:border-[#42A5F5] transition-all italic">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-slate-50 text-[#42A5F5] border border-slate-100 rounded-2xl flex items-center justify-center font-black text-[16px] shadow-inner group-hover:bg-[#42A5F5] group-hover:text-white transition-all duration-300">
                                                {student.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-700 text-[17px] capitalize italic tracking-tight group-hover:text-[#42A5F5] transition-colors leading-tight">{student.name}</h3>
                                                <p className="text-[14px] font-bold text-slate-600 uppercase tracking-widest mt-1 italic">{student.roll}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleStatus(student.id)}
                                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[11px] uppercase transition-all shadow-sm ${student.status === 'Present'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : 'bg-rose-500 text-white shadow-lg shadow-rose-100'
                                                }`}
                                        >
                                            {student.status === 'Present' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                            {student.status}
                                        </button>
                                    </div>
                                ))
                            }

                            {/* No Results Message */}
                            {students.filter(s =>
                                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                s.roll.toString().includes(searchQuery)
                            ).length === 0 && (
                                    <div className="text-center py-10 opacity-20 italic font-black uppercase text-[19px] tracking-widest">
                                        No matching student found
                                    </div>
                                )}
                        </div>

                        <div className="pt-10 pb-20 w-full px-4 z-30 italic">
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving || students.length === 0}
                                className={`w-full py-7 rounded-[3rem] font-black flex items-center justify-center gap-4 active:scale-95 transition-all uppercase text-[15px] tracking-widest shadow-2xl ${isSaving ? 'bg-slate-200 text-slate-400' : 'bg-slate-800 text-white shadow-slate-200'}`}
                            >
                                {isSaving ? "Synchronizing..." : (isUpdateMode ? "Update records" : "Submit attendance")}
                                {isUpdateMode ? <RefreshCcw size={22} /> : <Save size={22} />}
                            </button>
                            <button
                                onClick={() => setShowList(false)}
                                className="w-full mt-4 text-slate-400 font-bold text-[13px] uppercase tracking-widest hover:text-[#42A5F5] transition-colors"
                            >
                                Cancel and go back
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TeacherAttendance;
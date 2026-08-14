import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserCheck, Edit3, Trash2, X, GraduationCap, Mail, Filter, Search, Plus, Database, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";

const ManageUsers = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState(null); // 'teachers' or 'students'
    const [selectedGrade, setSelectedGrade] = useState('');
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [msg, setMsg] = useState('');

    const [availableGrades, setAvailableGrades] = useState([]);
    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
    const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
    const [isAssignClassDropdownOpen, setIsAssignClassDropdownOpen] = useState(false);

    const [freeClasses, setFreeClasses] = useState([]);
    const [deleteUserId, setDeleteUserId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Jab bhi dropdown khule, tab latest free classes fetch karo
    useEffect(() => {
        const fetchFreeClasses = async () => {
            try {
                // Humne backend mein already '/available-classes' route banaya tha
                const { data } = await API.get('/users/available-classes');
                setFreeClasses(data);
            } catch (err) { console.error("Free classes fetch failed"); }
        };
        if (isAssignClassDropdownOpen) fetchFreeClasses();
    }, [isAssignClassDropdownOpen]);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                // Hum timetable wale route se hi grades utha rahe hain kyunki logic same hai
                const { data } = await API.get('/timetable/meta/student-grades');
                setAvailableGrades(data);
            } catch (err) { console.error("Grades fetch failed"); }
        };
        if (viewMode === 'students') fetchGrades();
    }, [viewMode]);

    const fetchTeachers = async () => {
        setLoading(true);
        setViewMode('teachers');
        try {
            const { data } = await API.get('/users/teachers');
            setUsersList(data);
        } catch (err) {
            console.error("Teacher fetch error:", err);
        }
        finally { setLoading(false); }
    };

    const fetchStudents = async (grade) => {
        if (!grade) return;
        setLoading(true);
        try {
            const { data } = await API.get(`/users/students/${grade}`);
            setUsersList(data);
        } catch (err) {
            console.error("Student fetch error:", err);
        }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        try {
            await API.delete(`/users/delete/${id}`);
            setMsg("User deleted successfully 🗑️");
            setUsersList(usersList.filter(u => u._id !== id));
        } catch (err) {
            setMsg("Delete failed");
        }

        setShowDeleteConfirm(false);
        setDeleteUserId(null);
    };
    const handleDobChange = (type, value) => {
        // Pehle existing date uthao ya default setup karo
        let currentDob = editingUser.dob ? editingUser.dob.split('T')[0] : "2000-01-01";
        let [year, month, day] = currentDob.split('-');

        // Agar Admin ne box khali kiya hai, toh use khali hi rehne do (validation blur par hogi)
        if (type === 'day') day = value;
        if (type === 'month') month = value;
        if (type === 'year') year = value;

        // Sirf state update karo bina kisi padding ke, padding blur par karenge
        setEditingUser({ ...editingUser, dob: `${year}-${month}-${day}` });
    };
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/users/update/${editingUser._id}`, editingUser);
            setMsg("Neural profile synchronized! ⚡");
            setEditingUser(null);
            viewMode === 'teachers' ? fetchTeachers() : fetchStudents(selectedGrade);
        } catch (err) { alert("Update failed"); }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            {/* Header Section */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible text-center">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-10 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90 z-20"
                >
                    <ArrowLeft size={24} />
                </button>

                {/* Text Container - Isme Top Padding add ki hai taaki arrow se door rahe */}
                <div className="mt-4 px-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-tight">
                        Personnel manager
                    </h1>
                    <p className="text-[17px] font-black text-blue-700 uppercase tracking-[0.2em] mt-2 italic">
                        Identity portal
                    </p>
                </div>

                {/* Toggle Buttons Container (Same as before) */}
                <div className="flex gap-4 mt-10 px-2 relative z-10">
                    <button
                        onClick={fetchTeachers}
                        className={`flex-1 py-5 rounded-[2rem] font-black uppercase text-[17px] tracking-widest transition-all shadow-lg border-2 ${viewMode === 'teachers' ? 'bg-white text-[#42A5F5] border-white' : 'bg-blue-400 text-white border-blue-300'}`}
                    >
                        <UserCheck size={21} className="inline mr-2" /> Teachers
                    </button>
                    <button
                        onClick={() => { setViewMode('students'); setUsersList([]); }}
                        className={`flex-1 py-5 rounded-[2rem] font-black uppercase text-[17px] tracking-widest transition-all shadow-lg border-2 ${viewMode === 'students' ? 'bg-white text-[#42A5F5] border-white' : 'bg-blue-400 text-white border-blue-300'}`}
                    >
                        <GraduationCap size={21} className="inline mr-2" /> Students
                    </button>
                </div>
            </div>

            <div className="px-6 -mt-10 relative z-20 space-y-6">
                {/* Class Filter for Students */}
                {viewMode === 'students' && (
                    <div className="relative z-[120]">
                        {/* Custom Dropdown Trigger */}
                        <div
                            onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
                            className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all ring-1 ring-slate-50"
                        >
                            <div className="flex items-center gap-4">
                                <Filter size={22} className="text-[#42A5F5]" />
                                <span className="font-black text-[18px] text-slate-700 uppercase italic">
                                    {selectedGrade || "Select class to filter"}
                                </span>
                            </div>
                            <Plus size={22} className={`text-[#42A5F5] transition-transform duration-300 ${isGradeDropdownOpen ? 'rotate-45' : 'rotate-0'}`} />
                        </div>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isGradeDropdownOpen && (
                                <>
                                    {/* Overlay to close */}
                                    <div className="fixed inset-0 z-10" onClick={() => setIsGradeDropdownOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 right-0 mt-3 bg-white border border-blue-50 rounded-[2.5rem] shadow-2xl overflow-hidden z-20 ring-1 ring-slate-100"
                                    >
                                        <div className="max-h-60 overflow-y-auto scrollbar-hide">
                                            {availableGrades.length > 0 ? (
                                                availableGrades.map((g) => (
                                                    <div
                                                        key={g}
                                                        onClick={() => {
                                                            setSelectedGrade(g);
                                                            fetchStudents(g);
                                                            setIsGradeDropdownOpen(false);
                                                        }}
                                                        className={`p-5 text-[17px] font-black italic uppercase border-b border-slate-50 last:border-none cursor-pointer transition-all
                                            ${selectedGrade === g ? 'bg-blue-50 text-[#42A5F5]' : 'text-slate-600 hover:bg-slate-50'}
                                        `}
                                                    >
                                                        {g}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-5 text-center text-slate-400 font-bold italic">
                                                    No active classes found
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Users List Container */}
                <div className="space-y-4 pb-10">
                    {loading ? <Loader /> : usersList.length > 0 ? usersList.map((u) => (
                        <div key={u._id} className="bg-white p-5 rounded-[3rem] border border-slate-50 flex items-center justify-between group shadow-lg hover:shadow-2xl transition-all ring-1 ring-slate-100/50">
                            <div className="flex items-center gap-4">
                                <img
                                    src={u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BASE_URL}${u.avatar}`) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                    className="w-14 h-14 rounded-2xl border-2 border-slate-50 object-cover shadow-sm bg-slate-100"
                                    alt="user"
                                    onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                                />
                                <div>
                                    <h4 className="font-black text-slate-900 text-[19px] uppercase italic tracking-tight leading-tight">{u.name}</h4>
                                    <div className="flex flex-col mt-1 gap-0.5">
                                        {/* Pehli Line: ID (Employee ID / Enrollment No) */}
                                        <p className="text-[16px] font-black text-[#42A5F5] uppercase tracking-wider leading-none">
                                            {u.role === 'finance' ? `${u.employeeId} • Finance` : (u.role === 'teacher' ? u.employeeId : u.enrollmentNo)}
                                        </p>

                                        {/* Dusri Line: Subjects / Grade / Role Details */}
                                        <p className="text-[16px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                            {u.role === 'finance' ? 'Accounting' : (u.role === 'teacher' ? u.subjects?.join(', ') : `Grade: ${u.grade}`)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingUser(u)} className="p-3 bg-blue-50 text-[#42A5F5] rounded-2xl hover:bg-[#42A5F5] hover:text-white transition-all shadow-sm active:scale-90"><Edit3 size={18} /></button>
                                <button
                                    onClick={() => {
                                        setDeleteUserId(u._id);
                                        setShowDeleteConfirm(true);
                                    }} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    )) : viewMode && (
                        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <Search className="mx-auto text-slate-100 mb-3" size={48} />
                            <p className="text-slate-400 font-bold italic text-[15px]">No user identities found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FULL EDIT MODAL */}
            <AnimatePresence>
                {editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingUser(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[3.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <button onClick={() => setEditingUser(null)} className="absolute top-6 right-8 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all active:scale-90">
                                <X size={24} />
                            </button>

                            <h3 className="font-black text-2xl text-slate-800 mb-2 uppercase italic text-center tracking-tighter">Edit profile</h3>

                            {/* Primary Identity Identity Info */}
                            {/* Primary Identity Info Block - Vertical Layout */}
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] mb-8 flex flex-col gap-6 border border-slate-100 shadow-inner mt-4">
                                {/* Email Section */}
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#42A5F5]/10 p-3.5 rounded-2xl text-[#42A5F5] shadow-sm">
                                        <Mail size={25} />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Identity Email</p>
                                        <p className="text-[20px] font-black text-slate-700 italic break-all">{editingUser.email}</p>
                                    </div>
                                </div>

                                {/* Divider Line (Optional for clean look) */}
                                <div className="h-px bg-slate-200/50 w-full" />

                                {/* ID Section */}
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-200/30 p-3.5 rounded-2xl text-slate-400 shadow-sm">
                                        <Database size={25} />
                                    </div>
                                    {/* ID Section Fix */}
                                    <div>
                                        <p className="text-[15px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Sequence ID</p>
                                        <p className="text-[20px] font-black text-[#42A5F5] uppercase italic">
                                            {/* Yahan 'finance' role ko bhi add kar diya hai */}
                                            {['teacher', 'finance'].includes(editingUser.role) ? editingUser.employeeId : editingUser.enrollmentNo}
                                        </p>
                                    </div>
                                    {/* Student ke liye Admission No yahan dikhega */}
                                    {editingUser.role === 'student' && (
                                        <div>
                                            <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Admission no</p>
                                            <p className="text-[18px] font-black text-slate-700 uppercase italic">
                                                {editingUser.admissionNo || "Not available"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5 italic font-bold">
                                <div className="space-y-1.5">
                                    <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider">Full name</label>
                                    <input type="text" value={editingUser.name} className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-[16px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none shadow-inner"
                                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} placeholder="Full name" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider">Mobile No.</label>
                                    <input type="text" value={editingUser.phone} className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-[16px] text-slate-700 focus:border-[#42A5F5] outline-none shadow-inner"
                                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} placeholder="Mobile signal" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider">Father's name</label>
                                    <input type="text" value={editingUser.fatherName} className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-[16px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none shadow-inner"
                                        onChange={(e) => setEditingUser({ ...editingUser, fatherName: e.target.value })} placeholder="Father's name" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider">Mother's name</label>
                                    <input type="text" value={editingUser.motherName} className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-[16px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none shadow-inner"
                                        onChange={(e) => setEditingUser({ ...editingUser, motherName: e.target.value })} placeholder="Mother's name" />
                                </div>

                                {/* 🔥 DOB SECTION (Bigger & Premium) 🔥 */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider italic">Date Of Birth</label>
                                    <div className="grid grid-cols-3 gap-5 bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                        {/* Day Input */}
                                        <div className="flex flex-col items-center">
                                            <input
                                                type="number" placeholder="DD"
                                                className="w-full py-5 bg-white rounded-3xl border border-slate-200 text-center text-[22px] font-black text-[#42A5F5] outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                                // Smart Value Check: Agar 00 hai toh khali dikhao
                                                value={(editingUser.dob?.split('T')[0].split('-')[2] === '00') ? '' : editingUser.dob?.split('T')[0].split('-')[2]}
                                                onInput={(e) => e.target.value = e.target.value.slice(0, 2)}
                                                onChange={(e) => handleDobChange('day', e.target.value)}
                                            />
                                            <span className="text-[14px] font-black text-slate-400 uppercase mt-3 tracking-widest">Day</span>
                                        </div>

                                        {/* Month Input */}
                                        <div className="flex flex-col items-center">
                                            <input
                                                type="number" placeholder="MM"
                                                className="w-full py-5 bg-white rounded-3xl border border-slate-200 text-center text-[22px] font-black text-[#42A5F5] outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                                value={(editingUser.dob?.split('T')[0].split('-')[1] === '00') ? '' : editingUser.dob?.split('T')[0].split('-')[1]}
                                                onInput={(e) => e.target.value = e.target.value.slice(0, 2)}
                                                onChange={(e) => handleDobChange('month', e.target.value)}
                                            />
                                            <span className="text-[14px] font-black text-slate-400 uppercase mt-3 tracking-widest">Month</span>
                                        </div>

                                        {/* Year Input */}
                                        <div className="flex flex-col items-center">
                                            <input
                                                type="number" placeholder="YYYY"
                                                className="w-full py-5 bg-white rounded-3xl border border-slate-200 text-center text-[22px] font-black text-[#42A5F5] outline-none focus:border-[#42A5F5] focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                                value={(editingUser.dob?.split('T')[0].split('-')[0] === '0000') ? '' : editingUser.dob?.split('T')[0].split('-')[0]}
                                                onInput={(e) => e.target.value = e.target.value.slice(0, 4)}
                                                onChange={(e) => handleDobChange('year', e.target.value)}
                                            />
                                            <span className="text-[14px] font-black text-slate-400 uppercase mt-3 tracking-widest">Year</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 relative">
                                    <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider italic">Gender</label>

                                    {/* Custom Dropdown Trigger */}
                                    <div
                                        onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                                        className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all shadow-inner h-[65px]"
                                    >
                                        <span className="text-[17px] font-black text-[#42A5F5] uppercase italic">
                                            {editingUser.gender || "Select gender"}
                                        </span>
                                        <Plus size={22} className={`text-[#42A5F5] transition-transform duration-300 ${isGenderDropdownOpen ? 'rotate-45' : 'rotate-0'}`} />
                                    </div>

                                    {/* Custom Dropdown Menu */}
                                    <AnimatePresence>
                                        {isGenderDropdownOpen && (
                                            <>
                                                {/* Overlay to close */}
                                                <div className="fixed inset-0 z-[130]" onClick={() => setIsGenderDropdownOpen(false)} />

                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute left-0 right-0 top-[110%] z-[140] bg-white border border-blue-50 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-slate-100"
                                                >
                                                    <div className="overflow-hidden">
                                                        {['Male', 'Female', 'Other'].map((option) => (
                                                            <div
                                                                key={option}
                                                                onClick={() => {
                                                                    setEditingUser({ ...editingUser, gender: option });
                                                                    setIsGenderDropdownOpen(false);
                                                                }}
                                                                className={`p-5 flex items-center justify-between border-b border-slate-50 last:border-none cursor-pointer transition-all ${editingUser.gender === option ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                                            >
                                                                <span className={`text-[17px] font-black italic uppercase ${editingUser.gender === option ? 'text-[#42A5F5]' : 'text-slate-600'}`}>
                                                                    {option}
                                                                </span>
                                                                {editingUser.gender === option && <Check size={18} className="text-[#42A5F5]" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider">Religion </label>
                                    <input type="text" value={editingUser.religion} className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-[16px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none shadow-inner"
                                        onChange={(e) => setEditingUser({ ...editingUser, religion: e.target.value })} placeholder="Religion" />
                                </div>

                                {editingUser.role === 'student' ? (
                                    <div className="space-y-1.5">
                                        <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider italic">Admission no</label>
                                        <input
                                            type="text"
                                            value={editingUser.admissionNo || ''}
                                            className="w-full p-5 bg-slate-100/50 rounded-[2rem] border border-slate-200 text-[16px] text-slate-400 focus:border-[#42A5F5] uppercase outline-none shadow-inner cursor-not-allowed"
                                            readOnly // Tune bola edit nahi karna, toh readOnly laga diya
                                            placeholder="Admission no"
                                        />
                                    </div>
                                ) : (

                                    <>
                                        {editingUser.role === 'finance' ? (
                                            <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 p-6 rounded-[2.5rem] text-center my-2 shadow-inner">
                                                <p className="text-[16px] font-black text-[#42A5F5] uppercase italic tracking-widest">Finance teacher identity active</p>
                                                <p className="text-[13px] text-slate-600 uppercase mt-1">Class and subject protocols are restricted for this role.</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* --- SUBJECTS BLOCK: Sirf Teachers ke liye --- */}
                                                {editingUser.role === 'teacher' && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider italic">Subjects</label>
                                                        <input
                                                            type="text"
                                                            value={editingUser.subjects?.join(', ')}
                                                            className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-[16px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none shadow-inner"
                                                            onChange={(e) => setEditingUser({ ...editingUser, subjects: e.target.value.split(',').map(s => s.trim()) })}
                                                            placeholder="Subjects (e.g. Maths, Science)"
                                                        />
                                                    </div>
                                                )}
                                                {editingUser.role === 'teacher' && (
                                                    <div className="space-y-1.5 relative">
                                                        <label className="text-[20px] font-black text-[#42A5F5] ml-4 uppercase tracking-wider italic">Class Assigned</label>

                                                        {/* Custom Dropdown Trigger */}
                                                        <div
                                                            onClick={() => setIsAssignClassDropdownOpen(!isAssignClassDropdownOpen)}
                                                            className="w-full p-5 bg-blue-50/30 rounded-[2rem] border border-blue-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all shadow-inner h-[65px]"
                                                        >
                                                            <span className={`text-[17px] font-black uppercase italic ${editingUser.assignedClass ? 'text-[#42A5F5]' : 'text-slate-400'}`}>
                                                                {editingUser.assignedClass || "Not assigned class"}
                                                            </span>
                                                            <Plus size={22} className={`text-[#42A5F5] transition-transform duration-300 ${isAssignClassDropdownOpen ? 'rotate-45' : 'rotate-0'}`} />
                                                        </div>

                                                        {/* Custom Dropdown Menu */}
                                                        <AnimatePresence>
                                                            {isAssignClassDropdownOpen && (
                                                                <>
                                                                    <div className="fixed inset-0 z-[130]" onClick={() => setIsAssignClassDropdownOpen(false)} />
                                                                    {/* Custom Dropdown Menu - Ise check kar */}
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: -10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -10 }}
                                                                        className="absolute left-0 right-0 top-[105%] z-[999] bg-white border border-blue-50 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-slate-100"
                                                                    >
                                                                        <div className="max-h-60 overflow-y-auto scrollbar-hide">
                                                                            {/* Option 1: Remove assignment */}
                                                                            <div
                                                                                onClick={() => {
                                                                                    setEditingUser({ ...editingUser, assignedClass: '' });
                                                                                    setIsAssignClassDropdownOpen(false);
                                                                                }}
                                                                                className="p-5 border-b border-slate-50 text-rose-500 font-black italic uppercase text-[15px] hover:bg-rose-50 cursor-pointer flex justify-between items-center"
                                                                            >
                                                                                Remove assignment
                                                                                {!editingUser.assignedClass && <Check size={18} />}
                                                                            </div>

                                                                            {/* Option 2: Current Assigned Class (Agar pehle se assign hai toh wo bhi dikhni chahiye) */}
                                                                            {editingUser.assignedClass && (
                                                                                <div className="p-5 border-b border-slate-50 bg-blue-50 text-[#42A5F5] font-black italic uppercase text-[17px] flex justify-between items-center">
                                                                                    {editingUser.assignedClass}
                                                                                    <Check size={18} />
                                                                                </div>
                                                                            )}

                                                                            {/* Option 3: Baki ki sari Free Classes */}
                                                                            {freeClasses.length > 0 ? (
                                                                                freeClasses
                                                                                    .filter(g => g !== editingUser.assignedClass) // Current wali ko upar dikha diya isliye yahan se filter
                                                                                    .map((g) => (
                                                                                        <div
                                                                                            key={g}
                                                                                            onClick={() => {
                                                                                                setEditingUser({ ...editingUser, assignedClass: g });
                                                                                                setIsAssignClassDropdownOpen(false);
                                                                                            }}
                                                                                            className="p-5 flex items-center justify-between border-b border-slate-50 last:border-none cursor-pointer transition-all hover:bg-slate-50"
                                                                                        >
                                                                                            <span className="text-[17px] font-black italic uppercase text-slate-600">
                                                                                                {g}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))
                                                                            ) : (
                                                                                <div className="p-5 text-center text-slate-400 font-bold italic text-[14px]">
                                                                                    No free classes available
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                <div className="md:col-span-2 grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider">Pincode</label>
                                        <input type="text" value={editingUser.address?.pincode} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] text-slate-700 focus:border-[#42A5F5] outline-none shadow-inner"
                                            onChange={(e) => setEditingUser({ ...editingUser, address: { ...editingUser.address, pincode: e.target.value } })} placeholder="Pincode" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider">District</label>
                                        <input type="text" value={editingUser.address?.district} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none shadow-inner"
                                            onChange={(e) => setEditingUser({ ...editingUser, address: { ...editingUser.address, district: e.target.value } })} placeholder="District" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider">State</label>
                                        <input type="text" value={editingUser.address?.state} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none shadow-inner"
                                            onChange={(e) => setEditingUser({ ...editingUser, address: { ...editingUser.address, state: e.target.value } })} placeholder="State" />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[20px] font-black text-slate-600 ml-4 uppercase tracking-wider">Full address</label>
                                    <textarea value={editingUser.address?.fullAddress} className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 text-[15px] text-slate-700 focus:border-[#42A5F5] uppercase h-24 outline-none shadow-inner"
                                        onChange={(e) => setEditingUser({ ...editingUser, address: { ...editingUser.address, fullAddress: e.target.value } })} placeholder="Detailed address"></textarea>
                                </div>

                                <button type="submit" className="md:col-span-2 w-full bg-[#42A5F5] text-white py-6 rounded-[2.5rem] font-black text-[17px] uppercase shadow-xl shadow-blue-100 active:scale-[0.98] transition-all mt-4 italic tracking-[0.15em]">
                                    Update Profile
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl text-center"
                        >
                            <h3 className="text-xl font-black text-slate-800 mb-2 italic">
                                Are you sure?
                            </h3>

                            <p className="text-slate-500 font-bold text-sm mb-6">
                                Do you want to delete this user?
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteUserId(null);
                                    }}
                                    className="py-4 rounded-2xl bg-slate-100 font-black"
                                >
                                    No
                                </button>

                                <button
                                    onClick={() => handleDelete(deleteUserId)}
                                    className="py-4 rounded-2xl bg-rose-500 text-white font-black"
                                >
                                    Yes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default ManageUsers;
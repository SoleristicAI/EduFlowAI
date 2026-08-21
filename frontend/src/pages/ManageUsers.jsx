import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserCheck, Edit3, Trash2, X, GraduationCap, Mail, Search, Plus, Database, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";

const ManageUsers = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('teachers'); // Default mode
    const [selectedGrade, setSelectedGrade] = useState('');
    const [usersList, setUsersList] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // 🔥 NEW: Search Feature
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [msg, setMsg] = useState('');

    const [availableGrades, setAvailableGrades] = useState([]);
    const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
    const [isAssignClassDropdownOpen, setIsAssignClassDropdownOpen] = useState(false);

    const [freeClasses, setFreeClasses] = useState([]);
    const [deleteUserId, setDeleteUserId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Initial load fetch
    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        const fetchFreeClasses = async () => {
            try {
                const { data } = await API.get('/users/available-classes');
                setFreeClasses(data);
            } catch (err) { console.error("Free classes fetch failed"); }
        };
        if (isAssignClassDropdownOpen) fetchFreeClasses();
    }, [isAssignClassDropdownOpen]);

   useEffect(() => {
        const fetchGrades = async () => {
            try {
                const { data } = await API.get('/timetable/meta/student-grades');
                
                // 🔥 SMART SORTING ALGORITHM (Choti se Badi class) 🔥
                const sortedGrades = data.sort((a, b) => {
                    const getWeight = (g) => {
                        let gl = g.toLowerCase();
                        if (gl.includes('play') || gl.includes('pre')) return -4;
                        if (gl.includes('nur')) return -3;
                        if (gl.includes('lkg') || gl.includes('kg1')) return -2;
                        if (gl.includes('ukg') || gl.includes('kg2')) return -1;
                        const match = gl.match(/\d+/);
                        return match ? parseInt(match[0]) : 999;
                    };
                    const weightA = getWeight(a);
                    const weightB = getWeight(b);
                    if (weightA !== weightB) return weightA - weightB;
                    return a.localeCompare(b); // Agar dono 10th hain, toh 10-A pehle, 10-B baad mein
                });

                setAvailableGrades(sortedGrades);
                
                if (sortedGrades.length > 0 && !selectedGrade) {
                    setSelectedGrade(sortedGrades[0]);
                    fetchStudents(sortedGrades[0]);
                }
            } catch (err) { console.error("Grades fetch failed"); }
        };
        if (viewMode === 'students') fetchGrades();
    }, [viewMode]);
   const fetchTeachers = async () => {
        // setLoading(true);  <-- HATA DIYA
        setViewMode('teachers');
        setSearchTerm('');
        try {
            const { data } = await API.get('/users/teachers');
            setUsersList(data);
        } catch (err) { console.error("Teacher fetch error:", err); }
        // finally block HATA DIYA
    };

    const fetchStudents = async (grade) => {
        if (!grade) return;
        // setLoading(true); <-- HATA DIYA
        try {
            const { data } = await API.get(`/users/students/${grade}`);
            setUsersList(data);
        } catch (err) { console.error("Student fetch error:", err); }
        // finally block HATA DIYA
    };

    const handleDelete = async (id) => {
        try {
            await API.delete(`/users/delete/${id}`);
            setMsg("Identity purged successfully 🗑️");
            setUsersList(usersList.filter(u => u._id !== id));
        } catch (err) {
            setMsg("Delete failed");
        }
        setShowDeleteConfirm(false);
        setDeleteUserId(null);
    };

    const handleDobChange = (type, value) => {
        let currentDob = editingUser.dob ? editingUser.dob.split('T')[0] : "2000-01-01";
        let [year, month, day] = currentDob.split('-');
        if (type === 'day') day = value;
        if (type === 'month') month = value;
        if (type === 'year') year = value;
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

    // 🔥 LIVE SEARCH LOGIC 🔥
    const filteredUsers = usersList.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.employeeId && u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.enrollmentNo && u.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto">
            
            {/* --- HEADER SECTION --- */}
            <div className="bg-gradient-to-br from-[#42A5F5] to-[#1E88E5] text-white px-6 pt-12 pb-28 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible text-center">
                <button onClick={() => navigate(-1)} className="absolute top-10 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90 z-20">
                    <ArrowLeft size={24} />
                </button>

                <div className="mt-4 px-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-tight">Identity Portal</h1>
                    <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Personnel Manager</p>
                </div>

                {/* PREMIUM SEGMENTED CONTROL (Toggles) */}
                <div className="flex bg-white/20 p-1.5 rounded-full max-w-sm mx-auto mt-8 relative z-10 backdrop-blur-md border border-white/30 shadow-inner">
                    <button
                        onClick={fetchTeachers}
                        className={`flex-1 py-3 rounded-full font-black uppercase text-[13px] tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'teachers' ? 'bg-white text-[#42A5F5] shadow-md' : 'text-white hover:bg-white/10'}`}
                    >
                        <UserCheck size={18} /> Staff
                    </button>
                    <button
                        onClick={() => { setViewMode('students'); setUsersList([]); }}
                        className={`flex-1 py-3 rounded-full font-black uppercase text-[13px] tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'students' ? 'bg-white text-[#42A5F5] shadow-md' : 'text-white hover:bg-white/10'}`}
                    >
                        <GraduationCap size={18} /> Students
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="px-5 md:px-8 -mt-10 relative z-20 space-y-5 max-w-4xl mx-auto">
                
                {/* Horizontal Class Filter (Only for Students) */}
                <AnimatePresence>
                    {viewMode === 'students' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2">
                            {availableGrades.map(g => (
                                <button
                                    key={g}
                                    onClick={() => { setSelectedGrade(g); fetchStudents(g); }}
                                    className={`px-6 py-3 rounded-[1.5rem] text-[13px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${selectedGrade === g ? 'bg-[#42A5F5] text-white border-none' : 'bg-white text-slate-500 hover:bg-blue-50 border border-slate-100'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search Bar */}
                <div className="bg-white p-2 rounded-[2rem] flex items-center border border-slate-200 shadow-sm transition-all focus-within:shadow-md focus-within:border-blue-300">
                    <Search className="text-slate-400 ml-4" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Name or ID..."
                        className="bg-transparent text-slate-700 placeholder-slate-400 outline-none w-full px-4 py-3 font-bold tracking-wider text-[14px] uppercase italic"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Users List */}
                <div className="space-y-4 pb-10">
                    {loading ? <Loader /> : filteredUsers.length > 0 ? (
                        <AnimatePresence>
                            {filteredUsers.map((u, index) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                    key={u._id} 
                                    className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-sm hover:shadow-xl ring-1 ring-slate-50 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BASE_URL}${u.avatar}`) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                            className="w-14 h-14 rounded-2xl border-2 border-slate-50 object-cover shadow-sm bg-slate-100"
                                            alt="user"
                                            onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                                        />
                                        <div>
                                            <h4 className="font-black text-slate-800 text-[18px] uppercase italic tracking-tight leading-tight group-hover:text-[#42A5F5] transition-colors">{u.name}</h4>
                                            <div className="flex items-center flex-wrap gap-2 mt-1.5">
                                                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {u.role === 'finance' ? u.employeeId : (u.role === 'teacher' ? u.employeeId : u.enrollmentNo)}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${u.role === 'finance' ? 'bg-emerald-50 text-emerald-600' : (u.role === 'teacher' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-[#42A5F5]')}`}>
                                                    {u.role === 'finance' ? 'Finance' : (u.role === 'teacher' ? 'Teacher' : `Class ${u.grade}`)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingUser(u)} className="p-3 bg-blue-50 text-[#42A5F5] rounded-2xl hover:bg-[#42A5F5] hover:text-white transition-all shadow-sm active:scale-95 border border-blue-100"><Edit3 size={18} /></button>
                                        <button onClick={() => { setDeleteUserId(u._id); setShowDeleteConfirm(true); }} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 border border-rose-100"><Trash2 size={18} /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <Search className="mx-auto text-slate-200 mb-4" size={48} />
                            <p className="text-slate-400 font-bold italic text-[15px] uppercase tracking-widest">No identities found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- FULL EDIT MODAL (Unchanged Structure, Just Polished) --- */}
            <AnimatePresence>
                {editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingUser(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[3.5rem] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                            <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all active:scale-90">
                                <X size={24} />
                            </button>

                            <h3 className="font-black text-3xl text-slate-800 mb-6 uppercase italic text-center tracking-tighter">Edit profile</h3>

                            <div className="bg-slate-50 p-6 rounded-[2.5rem] mb-8 flex flex-col gap-6 border border-slate-100 shadow-inner">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#42A5F5]/10 p-4 rounded-2xl text-[#42A5F5] shadow-sm"><Mail size={24} /></div>
                                    <div>
                                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Identity Email</p>
                                        <p className="text-[18px] font-black text-slate-700 italic break-all leading-none">{editingUser.email}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-slate-200/50 w-full" />
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-200/50 p-4 rounded-2xl text-slate-500 shadow-sm"><Database size={24} /></div>
                                    <div>
                                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sequence ID</p>
                                        <p className="text-[18px] font-black text-[#42A5F5] uppercase italic leading-none">
                                            {['teacher', 'finance'].includes(editingUser.role) ? editingUser.employeeId : editingUser.enrollmentNo}
                                        </p>
                                    </div>
                                    {editingUser.role === 'student' && (
                                        <div className="ml-auto text-right">
                                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Admission no</p>
                                            <p className="text-[18px] font-black text-slate-700 uppercase italic leading-none">{editingUser.admissionNo || "N/A"}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5 italic font-bold">
                                {/* Inputs (Mapped exactly to original, just cleaner borders) */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 ml-2 uppercase tracking-widest">Full name</label>
                                    <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[15px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 ml-2 uppercase tracking-widest">Mobile No.</label>
                                    <input type="text" value={editingUser.phone} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[15px] text-slate-700 focus:border-[#42A5F5] outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 ml-2 uppercase tracking-widest">Father's name</label>
                                    <input type="text" value={editingUser.fatherName} onChange={(e) => setEditingUser({ ...editingUser, fatherName: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[15px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 ml-2 uppercase tracking-widest">Mother's name</label>
                                    <input type="text" value={editingUser.motherName} onChange={(e) => setEditingUser({ ...editingUser, motherName: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[15px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none" />
                                </div>

                                {/* DOB SECTION */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[14px] font-black text-slate-400 ml-2 uppercase tracking-widest">Date Of Birth</label>
                                    <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-[2rem] border border-slate-100">
                                        <input type="number" placeholder="DD" value={(editingUser.dob?.split('T')[0].split('-')[2] === '00') ? '' : editingUser.dob?.split('T')[0].split('-')[2]} onInput={(e) => e.target.value = e.target.value.slice(0, 2)} onChange={(e) => handleDobChange('day', e.target.value)} className="w-full py-4 bg-white rounded-2xl border border-slate-200 text-center text-[18px] font-black text-[#42A5F5] outline-none focus:border-[#42A5F5]" />
                                        <input type="number" placeholder="MM" value={(editingUser.dob?.split('T')[0].split('-')[1] === '00') ? '' : editingUser.dob?.split('T')[0].split('-')[1]} onInput={(e) => e.target.value = e.target.value.slice(0, 2)} onChange={(e) => handleDobChange('month', e.target.value)} className="w-full py-4 bg-white rounded-2xl border border-slate-200 text-center text-[18px] font-black text-[#42A5F5] outline-none focus:border-[#42A5F5]" />
                                        <input type="number" placeholder="YYYY" value={(editingUser.dob?.split('T')[0].split('-')[0] === '0000') ? '' : editingUser.dob?.split('T')[0].split('-')[0]} onInput={(e) => e.target.value = e.target.value.slice(0, 4)} onChange={(e) => handleDobChange('year', e.target.value)} className="w-full py-4 bg-white rounded-2xl border border-slate-200 text-center text-[18px] font-black text-[#42A5F5] outline-none focus:border-[#42A5F5]" />
                                    </div>
                                </div>

                                {/* Dropdowns */}
                                <div className="space-y-1.5 relative">
                                    <label className="text-[14px] font-black text-slate-400 ml-2 uppercase tracking-widest">Gender</label>
                                    <div onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between cursor-pointer">
                                        <span className="text-[15px] font-black text-[#42A5F5] uppercase italic">{editingUser.gender || "Select"}</span>
                                        <Plus size={18} className={`text-[#42A5F5] transition-transform ${isGenderDropdownOpen ? 'rotate-45' : ''}`} />
                                    </div>
                                    <AnimatePresence>
                                        {isGenderDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-[130]" onClick={() => setIsGenderDropdownOpen(false)} />
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute left-0 right-0 top-[100%] z-[140] bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden mt-1">
                                                    {['Male', 'Female', 'Other'].map((option) => (
                                                        <div key={option} onClick={() => { setEditingUser({ ...editingUser, gender: option }); setIsGenderDropdownOpen(false); }} className="p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 text-[14px] font-black italic uppercase text-slate-600 flex justify-between">
                                                            {option} {editingUser.gender === option && <Check size={16} className="text-[#42A5F5]" />}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 ml-2 uppercase tracking-widest">Religion</label>
                                    <input type="text" value={editingUser.religion} onChange={(e) => setEditingUser({ ...editingUser, religion: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[15px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none" />
                                </div>

                                {editingUser.role === 'teacher' && (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-black text-slate-400 ml-2 uppercase tracking-widest">Subjects</label>
                                            <input type="text" value={editingUser.subjects?.join(', ')} onChange={(e) => setEditingUser({ ...editingUser, subjects: e.target.value.split(',').map(s => s.trim()) })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[15px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none" />
                                        </div>
                                        <div className="space-y-1.5 relative">
                                            <label className="text-[14px] font-black text-[#42A5F5] ml-2 uppercase tracking-widest">Class Assigned</label>
                                            <div onClick={() => setIsAssignClassDropdownOpen(!isAssignClassDropdownOpen)} className="w-full p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between cursor-pointer">
                                                <span className={`text-[15px] font-black uppercase italic ${editingUser.assignedClass ? 'text-[#42A5F5]' : 'text-slate-400'}`}>{editingUser.assignedClass || "Not assigned"}</span>
                                                <Plus size={18} className={`text-[#42A5F5] transition-transform ${isAssignClassDropdownOpen ? 'rotate-45' : ''}`} />
                                            </div>
                                            <AnimatePresence>
                                                {isAssignClassDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[130]" onClick={() => setIsAssignClassDropdownOpen(false)} />
                                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute left-0 right-0 top-[100%] z-[140] bg-white border border-slate-100 rounded-2xl shadow-xl overflow-y-auto max-h-48 mt-1">
                                                            <div onClick={() => { setEditingUser({ ...editingUser, assignedClass: '' }); setIsAssignClassDropdownOpen(false); }} className="p-4 border-b border-slate-50 text-rose-500 font-black italic uppercase text-[14px] hover:bg-rose-50 cursor-pointer">Remove assignment</div>
                                                            {freeClasses.filter(g => g !== editingUser.assignedClass).map((g) => (
                                                                <div key={g} onClick={() => { setEditingUser({ ...editingUser, assignedClass: g }); setIsAssignClassDropdownOpen(false); }} className="p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 text-[14px] font-black italic uppercase text-slate-600">{g}</div>
                                                            ))}
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </>
                                )}

                                <div className="md:col-span-2 grid grid-cols-3 gap-3 mt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-black text-slate-400 ml-2 uppercase tracking-widest">Pincode</label>
                                        <input type="text" value={editingUser.address?.pincode} onChange={(e) => setEditingUser({ ...editingUser, address: { ...editingUser.address, pincode: e.target.value } })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] text-slate-700 focus:border-[#42A5F5] outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-black text-slate-400 ml-2 uppercase tracking-widest">District</label>
                                        <input type="text" value={editingUser.address?.district} onChange={(e) => setEditingUser({ ...editingUser, address: { ...editingUser.address, district: e.target.value } })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-black text-slate-400 ml-2 uppercase tracking-widest">State</label>
                                        <input type="text" value={editingUser.address?.state} onChange={(e) => setEditingUser({ ...editingUser, address: { ...editingUser.address, state: e.target.value } })} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] text-slate-700 focus:border-[#42A5F5] uppercase outline-none" />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 ml-2 uppercase tracking-widest">Full address</label>
                                    <textarea value={editingUser.address?.fullAddress} onChange={(e) => setEditingUser({ ...editingUser, address: { ...editingUser.address, fullAddress: e.target.value } })} className="w-full p-4 bg-slate-50 rounded-3xl border border-slate-100 text-[14px] text-slate-700 focus:border-[#42A5F5] uppercase h-24 outline-none resize-none" />
                                </div>

                                <button type="submit" className="md:col-span-2 w-full bg-[#42A5F5] text-white py-5 rounded-3xl font-black text-[16px] uppercase shadow-lg shadow-blue-200 active:scale-[0.98] transition-all mt-4 italic tracking-widest hover:bg-blue-500">
                                    Update Profile
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- PREMIUM DELETE MODAL --- */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white border border-slate-100 p-10 rounded-[3.5rem] shadow-2xl text-center">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-100 via-red-400 to-red-100"></div>
                            <div className="p-6 bg-red-50 rounded-full inline-block mb-6 border border-red-100 shadow-inner">
                                <AlertCircle size={48} className="text-red-500 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Delete Identity?</h3>
                            <p className="text-[14px] font-bold text-slate-400 mt-3 leading-relaxed tracking-widest uppercase">This action cannot be undone.</p>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button onClick={() => setShowDeleteConfirm(false)} className="py-4 bg-slate-50 border border-slate-200 rounded-3xl text-[12px] font-black text-slate-500 hover:bg-slate-100 active:scale-95 transition-all uppercase tracking-widest">Cancel</button>
                                <button onClick={() => handleDelete(deleteUserId)} className="py-4 bg-red-500 text-white rounded-3xl text-[12px] font-black shadow-[0_15px_30px_rgba(239,68,68,0.3)] hover:bg-red-600 active:scale-95 transition-all uppercase tracking-widest">Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default ManageUsers;
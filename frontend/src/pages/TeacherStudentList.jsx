import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Phone, MessageCircle, ShieldAlert, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";

const TeacherStudentList = ({ user }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignedClass, setAssignedClass] = useState("");

    // TeacherStudentList.jsx ke useEffect ke andar change karo
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                // Path hamesha backend routes se match karna chahiye
                const { data } = await API.get('/attendance/my-class-list');
                setStudents(data.students);
                setAssignedClass(data.className);
            } catch (err) {
                console.error("Error fetching class list", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.enrollmentNo?.includes(searchTerm)
    );

    // Call Handler
    const handleCall = (number) => {
        window.location.href = `tel:${number}`;
    };

    const handleWhatsApp = (number) => {
        // Ab yahan console.log karoge toh data dikhega!
        // console.log("Full User Context:", user);

        // Ye logic ab kaam karega kyunki 'user' ab undefined nahi hai
        const schoolName =
            user?.schoolName ||
            user?.schoolId?.schoolName ||
            user?.schoolData?.schoolName ||
            "the school";

        const msg = encodeURIComponent(`Hello, I am your child's class teacher from ${schoolName}. I would like to discuss something important regarding your child. Please connect with me when convenient.`);


        window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
    };

    if (loading) return <Loader />;

    if (!assignedClass) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-10 text-center italic">
            <ShieldAlert size={80} className="text-slate-200 mb-4" />
            <p className="text-slate-900 font-black text-[20px] uppercase tracking-widest leading-relaxed">
                No class assigned! <br />
                <span className="text-[#42A5F5] text-[15px]">Initialize class mapping via admin.</span>
            </p>
            <button onClick={() => navigate(-1)} className="mt-8 text-[#42A5F5] font-black uppercase text-[12px] tracking-widest border-b-2 border-[#42A5F5]">Return to hub</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">
            {/* --- PREMIUM BLUE HEADER --- */}
            <div className="bg-[#42A5F5] px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible">
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-md active:scale-95 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-4xl font-black italic tracking-tight text-white capitalize">Class list</h1>
                        <p className="text-[15px] font-black uppercase tracking-widest text-blue-90 opacity-60 mt-1">Class: {assignedClass}</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm"><Users size={24} /></div>
                </div>

                {/* Search Box */}
                <div className="relative mt-4 z-10">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search student or roll no..."
                        className="w-full bg-white text-slate-700 placeholder:text-slate-700 py-5 pl-14 pr-6 rounded-[2rem] shadow-lg outline-none font-bold text-[16px] italic focus:ring-4 focus:ring-blue-400/20 transition-all border-none"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="px-5 -mt-10 space-y-5 relative z-20">
                <div className="flex justify-between items-center px-4 mb-2">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">Total Students: {filteredStudents.length}</p>
                    {/* <span className="text-[10px] font-black bg-blue-50 text-[#42A5F5] px-4 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest">Active session</span> */}
                </div>

                {filteredStudents.map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-[3rem] shadow-md border border-[#DDE3EA] group hover:border-[#42A5F5] transition-all italic relative overflow-hidden">

                        {/* Student Info Top */}
                        <div className="flex items-center gap-5 mb-6 border-b border-slate-50 pb-5">
                            {s.avatar ? (
                                <img
                                    src={s.avatar.startsWith('http') ? s.avatar : `${BASE_URL}${s.avatar}`}
                                    alt={s.name}
                                    className="w-16 h-16 rounded-[1.8rem] object-cover shadow-sm border border-slate-100"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-slate-50 text-[#42A5F5] border border-slate-100 rounded-[1.8rem] flex items-center justify-center font-black text-[22px] shadow-inner group-hover:bg-[#42A5F5] group-hover:text-white transition-all">
                                    {s.name?.charAt(0)}
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="font-black text-slate-800 text-[21px] capitalize italic tracking-tight group-hover:text-[#42A5F5] transition-colors leading-tight">{s.name}</h3>
                                <div className="flex flex-col gap-1 mt-2">
                                    <span className="text-[14px] font-black text-slate-900 uppercase tracking-widest">
                                        Roll: {s.enrollmentNo}
                                    </span>

                                    <span className="text-[14px] font-black text-[#42A5F5] uppercase tracking-widest">
                                        Father: {s.fatherName || "Not set"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-[2rem] border border-slate-400">
                            <div>
                                <p className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em] mb-1 italic">Contact parent</p>
                                <p className="text-[19px] font-black text-slate-700 tracking-tighter">{s.phone || "No signal"}</p>
                            </div>

                            <div className="flex gap-3">
                                {/* CALL BUTTON */}
                                <button
                                    onClick={() => handleCall(s.phone)}
                                    className="flex items-center justify-center w-14 h-14 bg-white text-emerald-500 border border-slate-200 rounded-2xl active:scale-90 transition-all shadow-md hover:bg-emerald-500 hover:text-white"
                                >
                                    <Phone size={24} />
                                </button>

                                {/* WHATSAPP BUTTON */}
                                <button
                                    onClick={() => handleWhatsApp(s.phone)}
                                    className="flex items-center justify-center w-14 h-14 bg-white text-[#42A5F5] border border-slate-200 rounded-2xl active:scale-90 transition-all shadow-md hover:bg-[#42A5F5] hover:text-white"
                                >
                                    <MessageCircle size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredStudents.length === 0 && (
                    <div className="text-center py-20 opacity-20 italic font-black uppercase text-[12px] tracking-widest">
                        No matching student records found
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherStudentList;
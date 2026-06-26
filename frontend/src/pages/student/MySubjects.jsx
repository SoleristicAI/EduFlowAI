import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, BookOpen, User2, PhoneCall, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api";

const MySubjects = () => {
    const navigate = useNavigate();

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const timeoutRef = useRef(null);
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success"
    });

    useEffect(() => {
        fetchMySubjects();
    }, []);

    const fetchMySubjects = async () => {
        try {
            setLoading(true);

            const { data } = await API.get("/student/my-subjects");

            // Backend already formatted data de raha hai
            setSubjects(data);

        } catch (err) {
            setToast({
                show: true,
                message: "Failed to load subjects",
                type: "error"
            });

            timeoutRef.current = setTimeout(() => {
                setToast({
                    show: false,
                    message: "",
                    type: "success"
                });
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 fixed inset-0 overflow-y-auto"
        >
            {/* Header */}
            <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg mb-8 relative overflow-hidden"
            >

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
                        <BookOpen size={24} />
                    </div>
                </div>

                {/* Heading + Subtitle */}
                <div className="relative z-10 text-center mt-4">
                    <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                        My Subjects
                    </h1>

                    <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-2 whitespace-nowrap">
                        Your Class Subjects
                    </p>
                </div>

            </motion.div>

            {/* Body */}
            <div className="px-8 -mt-20 relative z-20 space-y-6">
                <AnimatePresence>
                    {loading ? (
                        <>
                            {[...Array(4)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm animate-pulse"
                                >
                                    <div className="h-5 bg-slate-200 rounded w-40 mb-4"></div>
                                    <div className="h-4 bg-slate-100 rounded w-60"></div>
                                </motion.div>
                            ))}
                        </>
                    ) : subjects.length > 0 ? (
                        <>
                            {subjects.map((item, index) => (
                                <motion.div
                                    key={item.subject}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{
                                        duration: 0.35,
                                        delay: index * 0.08
                                    }}
                                    whileHover={{ y: -4 }}
                                    className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm"
                                >
                                    {/* Subject Box */}
                                    <div className="mb-6 bg-sky-100 border border-sky-100 rounded-2xl px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <BookOpen size={20} className="text-sky-600" />
                                            <p className="text-[18px] font-black text-sky-700 uppercase">
                                                Subject:
                                            </p>
                                            <p className="text-[18px] font-black text-slate-800 uppercase">
                                                {item.subject}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Teacher Names Only */}
                                    <div className="space-y-4">
                                        {(item.teachers || "")
                                            .split(",")
                                            .filter(Boolean)
                                            .map((teacher, idx) => {
                                                const [name, phone] = teacher.split("|"); // format: Name|Phone

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between gap-4 bg-slate-50 rounded-2xl px-5 py-4"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-blue-50 rounded-2xl text-[#42A5F5]">
                                                                <User2 size={21} />
                                                            </div>

                                                            <p className="text-[18px] font-bold text-slate-700 flex-1 break-words">
                                                                {name
                                                                    ?.trim()
                                                                    .toLowerCase()
                                                                    .split(" ")
                                                                    .map(
                                                                        (word) =>
                                                                            word.charAt(0).toUpperCase() + word.slice(1)
                                                                    )
                                                                    .join(" ")}
                                                            </p>
                                                        </div>

                                                        {phone && (
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                {/* <a
                                                                    href={`tel:${phone.trim()}`}
                                                                    className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-2xl text-green-600 active:scale-90 transition"
                                                                >
                                                                    <PhoneCall size={19} />
                                                                </a> */}

                                                                <a
                                                                    href={`https://wa.me/91${phone.trim()}?text=${encodeURIComponent(
                                                                        "Mam, I have a query regarding the " +
                                                                        item.subject.charAt(0).toUpperCase() + item.subject.slice(1).toLowerCase() + " subject. Please assist me when you get a chance. Thank you!"
                                                                    )}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="w-12 h-12 flex items-center justify-center bg-green-400 rounded-2xl text-white active:scale-90 transition"
                                                                >
                                                                    <MessageCircle size={19} />
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </motion.div>
                            ))}
                        </>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center mt-40"
                        >
                            <p className="text-2xl font-black text-slate-700 italic">
                                No Subjects Found
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 40, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className={`fixed top-0 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl font-black text-[13px] shadow-2xl italic ${toast.type === "success"
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white"
                            }`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MySubjects;
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import API from '../api';

const StudentLeaveHistory = () => {
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const { data } = await API.get('/leaves/my-history');
                setHistory(data);
            } catch (err) {
                console.error("History fetch failed");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await API.get('/leaves/my-history');
                setHistory(data);
            } catch (err) {
                console.error("History fetch failed");
            }
        };

        fetchHistory();

        const interval = setInterval(fetchHistory, 3000); // every 3 sec

        return () => clearInterval(interval);
    }, []);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto"
        >
            {/* Header */}
            <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[3.5rem] shadow-lg mb-8"
            >
                <div className="flex items-center gap-5">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/20 rounded-2xl border border-white/10 active:scale-90 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tight capitalize">Leave History</h1>
                        <p className="text-[15px] font-bold text-white/80 tracking-widest mt-1">Track your applications</p>
                    </div>
                </div>
            </motion.div>

            <div className="px-8 -mt-16 space-y-6">
                <AnimatePresence>
                    {loading ? (
                        <div className="text-center mt-40 text-slate-400 font-bold">
                            Loading...
                        </div>
                    ) : history.length > 0 ? history.map((req, index) => (
                        <motion.div
                            key={req._id}
                            initial={{ opacity: 0, y: 30, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{
                                duration: 0.35,
                                delay: index * 0.08
                            }}
                            whileTap={{ scale: 0.98 }}
                            whileHover={{ y: -3 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm flex justify-between items-center transition-all"
                        >
                            <div>
                                <p className="text-[19px] font-black italic">{req.reason}</p>
                                <p className="text-[13px] font-bold text-slate-600 uppercase tracking-widest mt-2">
                                    {req.leaveType === "One Day" ? (
                                        formatDate(req.fromDate)
                                    ) : (
                                        <>
                                            {formatDate(req.fromDate)}
                                            <br />
                                            To {formatDate(req.toDate)}
                                        </>
                                    )}
                                </p>
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className={`px-4 py-2 rounded-full font-black text-[14px] uppercase ${req.status === 'Confirmed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : req.status === 'Rejected'
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                {req.status}
                            </motion.div>

                        </motion.div>

                    )) : (

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-center text-slate-700 font-bold mt-40  text-2xl"
                        >
                            No history found.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default StudentLeaveHistory;
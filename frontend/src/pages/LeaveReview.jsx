import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, X, FileText, User, AlertCircle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveReview = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmBox, setConfirmBox] = useState({
        show: false,
        id: null,
        status: ''
    });
    const [viewDoc, setViewDoc] = useState({
        show: false,
        url: ""
    });

    const fetchRequests = async (firstLoad = false) => {
        try {
            if (firstLoad) setLoading(true);

            const { data } = await API.get('/leaves/requests');
            setRequests(data);
        } catch (err) {
            console.error("Failed to fetch requests");
        } finally {
            if (firstLoad) setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(true); // sirf first load pe loader

        const interval = setInterval(() => {
            fetchRequests(false); // background refresh, loader nahi
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const handleAction = async () => {
        try {
            const { id, status } = confirmBox;

            await API.put(`/leaves/update-status/${id}`, { status });

            setRequests(prev =>
                prev.map(req =>
                    req._id === id ? { ...req, status } : req
                )
            );

            setToast({
                show: true,
                message:
                    status === "Confirmed"
                        ? "Leave Confirmed! ✅"
                        : "Leave Rejected! ❌",
                type: status === "Confirmed" ? "success" : "error"
            });

            setTimeout(() =>
                setToast({ show: false, message: "", type: "success" }), 3000);

            setConfirmBox({ show: false, id: null, status: "" });

        } catch (err) {
            setToast({
                show: true,
                message: "Action failed!",
                type: "error"
            });
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {/* Header */}
            <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-[#42A5F5] px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative z-10 overflow-visible mb-8"
            >
                <div className="flex justify-between items-center relative z-10">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-md active:scale-95 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Center Title */}
                    <div className="text-center">
                        <h1 className="text-4xl font-black italic tracking-tight text-white capitalize">
                            Leave Requests
                        </h1>

                        <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-80 mt-1">
                            Manage Student Leaves
                        </p>
                    </div>

                    {/* Right Icon */}
                    <div className="p-3 bg-white rounded-2xl text-[#42A5F5] shadow-sm">
                        <FileText size={24} />
                    </div>

                </div>
            </motion.div>

            <motion.div
                layout
                className="px-6 -mt-8 space-y-6"
            >
                {requests.length > 0 ? requests.map(req => (
                    <motion.div
                        key={req._id}
                        initial={{ opacity: 0, y: 40, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.96 }}
                        transition={{ duration: 0.35 }}
                        layout
                        className="bg-white p-8 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm"
                    >
                        {/* Student Info */}
                        <div className="mb-4">
                            <span className="text-[14px] font-black uppercase text-[#42A5F5] bg-blue-50 px-4 py-2 rounded-full inline-block">
                                {req.reason}
                            </span>
                        </div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-50 rounded-2xl text-[#42A5F5]"><User /></div>
                                <div>
                                    <h3 className="text-[18px] font-black italic">{req.student.name}</h3>
                                    <p className="text-[14px] font-bold text-slate-400 uppercase">{req.student.grade}</p>
                                </div>
                            </div>
                            {/* <span className="text-[14px] font-black uppercase text-[#42A5F5] bg-blue-50 px-4 py-1.5 rounded-full">{req.reason}</span> */}
                        </div>

                        <p className="text-[15px] text-slate-600 mb-6 font-bold italic border-l-4 border-blue-100 pl-4">
                            {req.leaveType === "One Day"
                                ? new Date(req.fromDate).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric"
                                })
                                : `${new Date(req.fromDate).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric"
                                })} to ${new Date(req.toDate).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric"
                                })}`
                            }
                        </p>

                        {/* Document View - Naye tab mein khulega */}
                        <div className="flex justify-center mb-6">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.03 }}
                                onClick={() =>
                                    setViewDoc({
                                        show: true,
                                        url: `http://localhost:5000${req.document}`
                                    })
                                }
                                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#F1F7FF] border border-[#D6E8FF] text-[#42A5F5] font-black text-[14px] shadow-sm"
                            >
                                <FileText size={18} />
                                View Document
                            </motion.button>
                        </div>

                        <AnimatePresence mode="wait">
                            {req.status === "Confirmed" ? (
                                <motion.div
                                    key="confirmed"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-emerald-50 text-emerald-600 p-5 rounded-2xl font-black text-center italic mt-4"
                                >
                                    Confirmed
                                </motion.div>
                            ) : req.status === "Rejected" ? (
                                <motion.div
                                    key="rejected"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-rose-50 text-rose-600 p-5 rounded-2xl font-black text-center italic mt-4"
                                >
                                    Rejected
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="actions"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex gap-4 mt-6"
                                >
                                    <button
                                        onClick={() =>
                                            setConfirmBox({
                                                show: true,
                                                id: req._id,
                                                status: "Confirmed"
                                            })
                                        }
                                        className="flex-1 bg-emerald-500 text-white p-5 rounded-2xl font-black italic"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() =>
                                            setConfirmBox({
                                                show: true,
                                                id: req._id,
                                                status: "Rejected"
                                            })
                                        }
                                        className="flex-1 bg-rose-500 text-white p-5 rounded-2xl font-black italic"
                                    >
                                        Reject
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )) : (
                    <p className="text-center text-slate-600 font-black mt-32 text-[20px] tracking-wide">
                        No pending requests.
                    </p>
                )}
            </motion.div>

            {/* Neural Toast Overlay */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 40, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className={`fixed top-0 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl font-black text-[13px] shadow-2xl flex items-center gap-3 italic ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {confirmBox.show && (
                    <>
                        {/* Blur Background */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200]"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] bg-white rounded-[2rem] p-8 w-[90%] max-w-sm shadow-2xl border border-[#DDE3EA]"
                        >
                            <h2 className="text-xl font-black text-center mb-3">
                                Are you sure?
                            </h2>

                            <p className="text-center text-slate-500 font-bold mb-6">
                                {confirmBox.status === "Confirmed"
                                    ? "Do you want to confirm this leave?"
                                    : "Do you want to reject this leave?"}
                            </p>

                            <div className="flex gap-4">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() =>
                                        setConfirmBox({
                                            show: false,
                                            id: null,
                                            status: ""
                                        })
                                    }
                                    className="flex-1 p-4 rounded-2xl bg-slate-100 font-black"
                                >
                                    No
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={handleAction}
                                    className={`flex-1 p-4 rounded-2xl text-white font-black ${confirmBox.status === "Confirmed"
                                        ? "bg-emerald-500"
                                        : "bg-rose-500"
                                        }`}
                                >
                                    Yes
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewDoc.show && (
                    <>
                        {/* Background Blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[300]"
                        />

                        {/* Document Viewer */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="fixed inset-6 z-[301] bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            {/* Top Bar */}
                            <div className="flex justify-between items-center px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                                <h2 className="font-black text-lg">Document Preview</h2>

                                <div className="flex items-center gap-3">
                                    {/* Download Button */}
                                    <a
                                        href={viewDoc.url}
                                        download
                                        className="px-4 py-2 rounded-xl bg-[#42A5F5] text-white font-black text-[13px] hover:scale-105 transition-all"
                                    >
                                        Download
                                    </a>

                                    {/* Close Button */}
                                    <button
                                        onClick={() =>
                                            setViewDoc({
                                                show: false,
                                                url: ""
                                            })
                                        }
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                                    >
                                        <X size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* File Preview */}
                            <iframe
                                src={viewDoc.url}
                                className="w-full h-[calc(100%-70px)]"
                                title="Document Preview"
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
};

export default LeaveReview;
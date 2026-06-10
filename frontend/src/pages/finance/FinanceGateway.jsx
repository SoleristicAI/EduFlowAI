import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Save, Eye, CheckCircle, Smartphone, User, Hash, Edit3, X, Zap, Activity, Database, Layers, Phone, UserCheck, ArrowLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Loader from '../../components/Loader';

const FinanceGateway = () => {
    const [settings, setSettings] = useState({ upiId: '', merchantName: '' });
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const [resolvedSignals, setResolvedSignals] = useState([]);
    const [selectedSignal, setSelectedSignal] = useState(null);
    const [isZoomed, setIsZoomed] = useState(false); // Screenshot bada karke dekhne ke liye
    const [confirmDelete, setConfirmDelete] = useState(false);
    const formRef = useRef(null);

    const loadTerminal = async () => {
        try {
            setLoading(true);
            const { data: config } = await API.get('/fees/settings/penalty');
            if (config.paymentSettings) {
                setSettings({
                    upiId: config.paymentSettings.upiId || '',
                    merchantName: config.paymentSettings.merchantName || ''
                });
            }
            const { data } = await API.get('/fees/audit/pending-verifications');
            setPendingVerifications(data.pending || []);
            setResolvedSignals(data.resolved || []);
        } catch (err) { console.error("Sync error"); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadTerminal(); }, []);

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            await API.post('/fees/settings/gateway', settings);
            setToastMsg("Gateway details updated successfully");
            setShowToast(true);
            setIsEditing(false);
            setTimeout(() => setShowToast(false), 3000);
            loadTerminal();
        } catch (err) { console.error("Update failed"); }
    };

    const handleAuditAction = async (feeId, action) => {
        try {
            const route = action === 'verify' ? '/fees/audit/verify-payment' : '/fees/audit/reject-payment';
            const { data } = await API.post(route, { feeId });

            if (data.success) {
                setToastMsg(action === 'verify' ? "Payment verified: Fees updated" : "Payment rejected: Fees still pending");
                setShowToast(true);
                setSelectedSignal(null);
                setTimeout(() => setShowToast(false), 5000);
                loadTerminal();
            }
        } catch (err) {
            alert("Action failed: Check neural link");
        }
    };

    const handleDelete = async () => {
        try {
            await API.delete('/fees/settings/gateway');
            setSettings({ upiId: '', merchantName: '' });
            setToastMsg("Gateway deleted successfully! 🛡️");
            setShowToast(true);
            setConfirmDelete(false); // Modal band
            setIsEditing(true);      // Form khol do
            setTimeout(() => setShowToast(false), 3000);
            loadTerminal();
        } catch (err) {
            alert("Failed to delete gateway");
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F1F5F9] text-slate-800 p-5 pb-32 italic font-sans text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto">

            {/* MODAL: SCREENSHOT PREVIEW */}
            <AnimatePresence>
                {selectedSignal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 backdrop-blur-xl bg-slate-900/60"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
                        >
                            <button onClick={() => setSelectedSignal(null)} className="absolute top-6 right-6 z-[11] p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={20} /></button>

                            {/* Image Section */}
                            <div className="w-full md:w-2/3 bg-slate-50 flex items-center justify-center p-6">
                                <img
                                    src={`http://localhost:5000${selectedSignal.paymentScreenshot}`}
                                    className="max-w-full max-h-full object-contain rounded-3xl shadow-lg border border-slate-200 cursor-zoom-in hover:scale-[1.02] transition-transform"
                                    alt="Payment evidence"
                                    onClick={() => setIsZoomed(true)}
                                />
                            </div>

                            {/* Details Section */}
                            <div className="w-full md:w-1/3 p-8 border-t md:border-t-0 md:border-l border-slate-100 space-y-6 overflow-y-auto">
                                <h3 className="text-[16px] font-black text-[#42A5F5] uppercase tracking-widest border-b border-blue-50 pb-4">Payment verification</h3>

                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                                        <p className="text-[15px] text-[#42A5F5] uppercase font-black mb-1 italic tracking-wider">Student identity</p>
                                        <p className="text-[15px] font-black text-slate-700 truncate capitalize">{selectedSignal.student?.name}</p>
                                        <p className="text-[15px] font-bold text-slate-700 mt-1 uppercase tracking-widest">{selectedSignal.student?.grade} • {selectedSignal.student?.enrollmentNo}</p>
                                    </div>

                                    <div className="bg-blue-50/30 p-5 rounded-[2rem] border border-blue-100">
                                        <p className="text-[15px] text-[#42A5F5] uppercase font-black mb-1 italic tracking-wider">Parent details</p>
                                        <p className="text-[15px] font-black text-slate-700 uppercase flex items-center gap-2"><UserCheck size={16} className="text-[#42A5F5]" /> {selectedSignal.student?.fatherName || 'Not found'}</p>
                                        <p className="text-[15px] font-black text-slate-700 mt-2 flex items-center gap-2 tracking-widest"><Phone size={14} className="text-[#42A5F5]" /> {selectedSignal.student?.phone || 'No signal'}</p>
                                    </div>

                                    <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100 text-center shadow-sm">
                                        <p className="text-[15px] text-emerald-600 uppercase font-black mb-1 italic tracking-widest">Paid amount</p>
                                        <p className="text-4xl font-black italic tracking-tighter text-slate-800">₹{selectedSignal.amountPaid?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={() => handleAuditAction(selectedSignal._id, 'verify')}
                                        className="w-full bg-emerald-500 text-white py-5 rounded-[2rem] font-black uppercase text-[15px] tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                                    >
                                        Approve payment
                                    </button>

                                    <button
                                        onClick={() => handleAuditAction(selectedSignal._id, 'reject')}
                                        className="w-full bg-white text-red-500 border border-red-100 py-5 rounded-[2rem] font-black uppercase text-[15px] tracking-widest hover:bg-red-50 active:scale-95 transition-all"
                                    >
                                        Reject payment
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* NEURAL TOAST */}
            <AnimatePresence>
                {showToast && (
                    <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
                        className="fixed top-8 left-1/2 -translate-x-1/2 z-[999] bg-white border-2 border-[#42A5F5] px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 w-fit"
                    >
                        <div className="p-2 bg-[#42A5F5] rounded-full shadow-sm"><CheckCircle size={18} className="text-white" /></div>
                        <span className="text-[13px] font-black uppercase text-slate-700 tracking-wider">
                            {toastMsg || "Protocol synchronized"}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4 relative z-10">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl border border-[#DDE3EA] shadow-md hover:bg-blue-50 active:scale-90 transition-all group"
                    >
                        <ArrowLeft className="text-[#42A5F5]" size={24} />
                    </button>

                    <div>
                        <h1 className="text-3xl font-black italic tracking-tight flex items-center gap-3 capitalize">
                            <ShieldCheck className="text-[#42A5F5]" size={32} />
                            Finance <span className="text-[#42A5F5]">terminal</span>
                        </h1>
                        <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">EduFlow Payment System v1.3.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-blue-50 p-2 px-5 rounded-full border border-blue-100 w-fit shadow-sm">
                    <Activity size={16} className="text-[#42A5F5] animate-pulse" />
                    <span className="text-[15px] font-black text-[#42A5F5] uppercase tracking-widest italic">Protocol 130 secure</span>
                </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 relative z-10">

                {/* CREDENTIALS HUB (LEFT) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* UPI Details Card */}
                    <div className="bg-white p-8 rounded-[3.5rem] border border-[#DDE3EA] relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 text-[#42A5F5]"><Database size={100} /></div>

                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${settings.upiId ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-[#42A5F5]'}`}></div>
                                <h2 className="text-[15px] font-black text-slate-600 uppercase tracking-widest italic">
                                    {settings.upiId ? "Active UPI Details" : "Configure UPI"}
                                </h2>
                            </div>

                            {/* Show Edit/Delete if configured */}
                            {settings.upiId && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setConfirmDelete(true)}
                                        className="p-3.5 bg-red-50 text-red-500 rounded-2xl border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button onClick={() => setIsEditing(!isEditing)} className={`p-3.5 rounded-2xl border transition-all active:scale-90 ${isEditing ? 'bg-red-50 border-red-100 text-red-500' : 'bg-blue-50 border-blue-100 text-[#42A5F5]'}`}>
                                        {isEditing ? <X size={20} /> : <Edit3 size={20} />}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* DETAILS OR ADD BUTTON */}
                        {settings.upiId ? (
                            <div className="space-y-5 relative z-10">
                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner">
                                    <p className="text-[12px] uppercase text-slate-400 font-black mb-1 tracking-widest italic">Upi id</p>
                                    <p className="text-[17px] font-black text-slate-700 tracking-widest break-all italic">{settings.upiId}</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner">
                                    <p className="text-[12px] uppercase text-slate-400 font-black mb-1 tracking-widest italic">Receiver name</p>
                                   <p className="text-[17px] font-black text-slate-700 truncate italic">
  {settings.merchantName
    ?.toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())}
</p>
                                </div>
                            </div>
                        ) : (
                            // Add UPI Details Box (Light Blue)
                            <div
                                onClick={() => setIsEditing(true)}
                                className="p-8 rounded-[2rem] bg-blue-50 border-2 border-dashed border-[#42A5F5]/30 text-center cursor-pointer hover:bg-blue-100 transition-all group"
                            >
                                <Zap size={30} className="mx-auto text-[#42A5F5] mb-3" />
                                <p className="text-[15px] font-black text-[#42A5F5] uppercase tracking-widest italic group-hover:scale-105 transition-transform">
                                    Add UPI Details
                                </p>
                            </div>
                        )}
                    </div>

                    {/* DYNAMIC PROTOCOL EDITOR */}
                    <AnimatePresence>
                        {isEditing && (
                            <motion.form
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                onSubmit={handleUpdateSettings} className="bg-white border-2 border-[#42A5F5]/30 p-8 rounded-[3.5rem] space-y-6 overflow-hidden shadow-xl"
                            >
                                <h2 className="text-[19px] font-black text-[#42A5F5] uppercase tracking-widest mb-2 flex items-center gap-3 italic">
                                    <Edit3 size={18} /> {settings.upiId ? "Update details" : "Enter details"}
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[16px] font-black text-slate-700 uppercase ml-4 italic tracking-widest">Upi id</label>
                                        <input className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 mt-2 font-black text-slate-700 outline-none focus:border-[#42A5F5] transition-all text-[15px] italic shadow-inner"
                                            value={settings.upiId} onChange={e => setSettings({ ...settings, upiId: e.target.value })} placeholder="school@upi" required />
                                    </div>
                                    <div>
                                        <label className="text-[16px] font-black text-slate-700 uppercase ml-4 italic tracking-widest">Receiver name</label>
                                        <input className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 mt-2 font-black text-slate-700 outline-none focus:border-[#42A5F5] transition-all text-[15px] italic shadow-inner"
                                            value={settings.merchantName} onChange={e => setSettings({ ...settings, merchantName: e.target.value })} placeholder="Institution name" required />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#42A5F5] text-white py-5 rounded-[2rem] font-black uppercase text-[12px] tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all italic">
                                    Save Changes
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* AUDIT FEED (RIGHT) */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-[#DDE3EA] shadow-sm min-h-[500px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-rose-500 uppercase tracking-widest italic">Activity History</h2>
                                <p className="text-[15px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Payment screenshots</p>
                            </div>
                            <div className="bg-rose-50 px-6 py-3 rounded-full border border-rose-100 flex items-center gap-3">
                                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div>
                                <span className="text-[13px] font-black text-rose-500 uppercase tracking-widest italic">{pendingVerifications.length} Pending payments</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {pendingVerifications.length > 0 ? pendingVerifications.map((item, i) => (
                                <motion.div
                                    initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                                    key={i} onClick={() => setSelectedSignal(item)}
                                    className="bg-slate-50 p-5 md:p-6 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 group hover:border-[#42A5F5] hover:bg-white transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                                >
                                    {/* Left Section: Student Avatar & Info */}
                                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5 w-full md:w-auto">
                                        <div className="p-4 bg-white rounded-2xl text-slate-400 group-hover:text-[#42A5F5] group-hover:shadow-md transition-all duration-300 shadow-sm border border-slate-50 shrink-0">
                                            <User size={28} />
                                        </div>
                                        <div className="text-center md:text-left overflow-hidden w-full">
                                            <p className="text-[20px] font-black text-slate-700 group-hover:text-[#42A5F5] transition-colors italic capitalize truncate">
                                                {item.student?.name}
                                            </p>
                                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-1.5 text-[15px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Layers size={13} className="text-[#42A5F5]" /> {item.student?.grade}</span>
                                                <span className="hidden md:block w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                                <span className="flex items-center gap-1.5 text-[#42A5F5]/60"><UserCheck size={13} /> {item.student?.fatherName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Section: Amount & Action */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                                        <div className="text-left md:text-right">
                                            <p className="text-xl md:text-3xl font-black text-slate-800 italic tracking-tighter group-hover:scale-110 transition-transform origin-right">
                                                ₹{item.amountPaid?.toLocaleString()}
                                            </p>
                                            <div className="mt-1 text-[13px] font-black uppercase px-2.5 py-1 rounded-full w-fit md:ml-auto italic bg-amber-50 text-amber-600 border border-amber-100">
                                                {item.status || 'Pending'}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white text-slate-800 rounded-2xl border border-slate-100 group-hover:text-[#42A5F5] group-hover:border-[#42A5F5] transition-all shadow-sm shrink-0">
                                            <Eye size={24} />
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-32 opacity-20 italic text-center">
                                    <Zap size={60} className="mb-6 text-slate-800" />
                                    <p className="text-[14px] font-black uppercase tracking-[0.5em]">No pending payments</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ONLINE PAYMENT HISTORY */}
                    <div className="mt-8 bg-white p-8 md:p-10 rounded-[3.5rem] border border-[#DDE3EA] shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <Database size={22} className="text-[#42A5F5]" />
                                <h2 className="text-2xl font-black text-slate-700 italic capitalize">Payment History</h2>
                            </div>
                            <span className="text-[9px] bg-slate-50 px-4 py-2 rounded-full text-slate-700 uppercase font-black tracking-widest border border-slate-100 shadow-inner">V1.3.0 stable</span>
                        </div>

                        <div className="space-y-4">
                            {resolvedSignals.length > 0 ? resolvedSignals.map((item, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    key={i} onClick={() => setSelectedSignal(item)}
                                    className="bg-slate-50 p-5 rounded-[2.2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 group hover:bg-white hover:border-blue-100 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                                >
                                    {/* Left: Status Icon & Student Name */}
                                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5 w-full md:w-auto">
                                        <div className={`p-4 rounded-2xl shadow-sm border border-white shrink-0 ${item.status === 'Verified' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                            {item.status === 'Verified' ? <CheckCircle size={24} /> : <X size={24} />}
                                        </div>
                                        <div className="text-center md:text-left overflow-hidden w-full">
                                            <p className="text-[18px] font-black text-slate-700 italic group-hover:text-[#42A5F5] transition-colors capitalize truncate">
                                                {item.student?.name}
                                            </p>
                                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-1.5 text-[15px] text-slate-400 font-bold tracking-widest italic">
                                                <span className="uppercase">Ref: {item._id.slice(-8).toUpperCase()}</span>
                                                <span className="hidden md:block w-1 h-1 bg-slate-200 rounded-full"></span>
                                                <br />
                                                <span className="uppercase">{item.student?.grade}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Amount & Edit Icon */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                                        <div className="text-left md:text-right">
                                            <p className="text-[23px] md:text-[19px] font-black text-slate-500 italic tracking-tighter">
                                                ₹{item.amountPaid?.toLocaleString()}
                                            </p>
                                            <p className={`text-[14px] font-black uppercase mt-1 tracking-widest italic ${item.status === 'Verified' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {item.status === 'Verified' ? 'Payment confirmed' : 'Payment rejected'}
                                            </p>
                                        </div>
                                        <div className="p-3.5 bg-white text-slate-800 rounded-2xl border border-slate-50 group-hover:text-[#42A5F5] group-hover:border-blue-100 transition-all shadow-sm shrink-0">
                                            <Edit3 size={18} />
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center italic">
                                    <Database size={40} className="mb-3 text-slate-700" />
                                    <p className="text-[14px] font-black uppercase tracking-[0.5em]">Database empty</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* --- FULL SCREEN ZOOM OVERLAY --- */}
            <AnimatePresence>
                {isZoomed && selectedSignal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] bg-slate-900/95 flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setIsZoomed(false)} // Kahin bhi click karo band ho jayega
                    >
                        <motion.div
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            className="relative max-w-full max-h-full"
                        >
                            {/* Close Button */}
                            <button
                                className="absolute -top-12 right-0 text-white flex items-center gap-2 font-black uppercase text-[12px] tracking-widest"
                                onClick={() => setIsZoomed(false)}
                            >
                                <X size={29} className="bg-white/10 p-1 rounded-full" />
                            </button>

                            <img
                                src={`http://localhost:5000${selectedSignal.paymentScreenshot}`}
                                className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/10"
                                alt="Full View"
                            />
                            <p className="text-center text-white/40 font-bold italic mt-4 uppercase text-[11px] tracking-[0.3em]">
                                Neural View Protocol Active
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={30} />
                            </div>
                            <h3 className="text-xl font-black italic mb-2">Delete Details?</h3>
                            <p className="text-slate-500 font-bold italic mb-8">This action cannot be undone. All UPI data will be wiped.</p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 font-black italic uppercase text-[12px]"
                                >
                                    No, Back
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black italic uppercase text-[12px]"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FinanceGateway;
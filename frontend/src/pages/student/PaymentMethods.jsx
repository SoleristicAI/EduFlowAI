import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, Smartphone, Zap, ShieldCheck, Landmark, ArrowRight, ArrowLeft, Construction, ShieldAlert, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api';
import Loader from '../../components/Loader';

const PaymentMethods = () => {
    const [summary, setSummary] = useState(null);
    const [paymentMode, setPaymentMode] = useState(null); // 'upi' or 'netbanking'
    const [selectedApp, setSelectedApp] = useState(null); // specific upi app
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- DAY 130: NEW SCREENSHOT STATES ---
    const [screenshot, setScreenshot] = useState(null);
    const [preview, setPreview] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data } = await API.get('/fees/student-summary');
                setSummary(data);
            } catch (err) { console.error("Payment Data Load Error", err); }
        };
        loadData();
    }, []);

    // --- DAY 130: FILE SELECTION LOGIC ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setScreenshot(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // --- DAY 130: MANUAL TRANSMISSION LOGIC ---
    const handleFinalSubmit = async () => {
        if (!screenshot) {
            setToast({ show: true, message: "Upload payment screenshot! 🛡️", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
            return;
        }

        setIsProcessing(true);
        const formData = new FormData();
        formData.append('screenshot', screenshot);
        formData.append('amount', summary.grandTotal);
        formData.append('method', selectedApp);

        try {
            // Backend route name: capture-with-screenshot
            await API.post('/fees/capture-with-screenshot', formData);
            setToast({ show: true, message: "Payment Submitted Successfully!📡", type: 'success' });
            setTimeout(() => {
                navigate('/student/fees', { replace: true });
            }, 2000);
        } catch (err) {
            setToast({ show: true, message: "Upload Failed.", type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
            setIsProcessing(false);
        }
    };

    if (!summary) return <Loader />;

    // UPI Link generation using Teacher's configured UPI ID
    const upiLink = `upi://pay?pa=${summary.schoolPhone}&pn=${summary.schoolName}&am=${summary.grandTotal}&cu=INR`;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans italic flex flex-col items-center justify-start pt-12 relative p-6 text-[15px] overflow-y-auto pb-44">
            <AnimatePresence mode="wait">
                {/* STEP 1: SELECT MODE */}
                {!paymentMode && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-md space-y-5">
                        {/* space-y-6 ko 4 kiya aur mt-0 add kiya */}
                        <div className="flex items-center gap-4 mb-8 border-b border-[#DDE3EA] pb-6">
                            <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl border border-[#DDE3EA] text-[#42A5F5] shadow-sm active:scale-90 transition-all">
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className="text-2xl font-black italic tracking-tight capitalize">Select gateway</h1>
                        </div>
                        {/* mb-10 ko 6 kiya taaki upar chadh jaye */}

                        <button onClick={() => setPaymentMode('upi')} className="w-full p-8 bg-white border border-[#DDE3EA] rounded-[2.5rem] flex items-center gap-6 hover:border-[#42A5F5] transition-all group shadow-sm active:scale-[0.98]">
                            <div className="p-4 bg-blue-50 text-[#42A5F5] rounded-2xl group-hover:bg-[#42A5F5] group-hover:text-white transition-all"><Zap size={24} /></div>
                            <div className="text-left">
                                <span className="block font-black text-[16px] capitalize tracking-tight">UPI portal</span>
                                <span className="text-[12px] font-bold text-slate-400 capitalize">GPay, PhonePe, Paytm QR</span>
                            </div>
                            <ArrowRight size={20} className="ml-auto text-slate-300 group-hover:text-[#42A5F5]" />
                        </button>

                        <button onClick={() => setPaymentMode('netbanking')} className="w-full p-8 bg-white border border-slate-100 rounded-[2.5rem] flex items-center gap-6 group shadow-sm opacity-60 cursor-not-allowed">
                            <div className="p-4 bg-slate-50 text-slate-300 rounded-2xl"><Landmark size={24} /></div>
                            <div className="text-left">
                                <span className="block font-black text-[16px] capitalize tracking-tight text-slate-400">Net banking</span>
                                <span className="text-[12px] font-bold text-slate-300 capitalize">Coming soon</span>
                            </div>
                        </button>

                        {/* <button onClick={() => navigate(-1)} className="w-full text-center text-[10px] font-black uppercase text-white/20 tracking-widest pt-4 hover:text-white transition-colors underline underline-offset-4">Back to Summary</button> */}
                    </motion.div>
                )}

                {/* STEP 2: UPI APP SELECTION */}
                {paymentMode === 'upi' && !selectedApp && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
                        <div className="flex items-center gap-4 mb-8 border-b border-[#DDE3EA] pb-6">
                            <button onClick={() => setPaymentMode(null)} className="p-2 bg-white rounded-xl border border-[#DDE3EA] text-[#42A5F5] shadow-sm active:scale-90 transition-all">
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className="text-2xl font-black italic tracking-tight capitalize">Select method</h1>
                        </div>
                        <div className="grid gap-4">
                            {['PhonePe', 'Google Pay', 'Paytm', 'Manual QR'].map(app => (
                                <button key={app} onClick={() => setSelectedApp(app)} className="w-full p-6 bg-white border border-[#DDE3EA] rounded-[2rem] flex justify-between items-center hover:border-[#42A5F5] shadow-sm transition-all group active:scale-[0.98]">
                                    <span className="font-black text-[16px] italic text-slate-700 group-hover:text-[#42A5F5]">{app}</span>
                                    <div className="w-2.5 h-2.5 bg-[#42A5F5] rounded-full animate-pulse shadow-[0_0_10px_rgba(66,165,245,0.4)]"></div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: NETBANKING - CONSTRUCTION SCREEN (Reused from your code) */}
                {paymentMode === 'netbanking' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center w-full max-w-lg">
                        <button onClick={() => setPaymentMode(null)} className="mb-10 bg-white p-4 rounded-2xl border border-[#DDE3EA] text-[#42A5F5] shadow-md flex items-center gap-2 active:scale-90 transition-all">
                            <ArrowLeft size={20} />
                            <span className="text-[13px] font-black capitalize">Return to modes</span>
                        </button>
                        <div className="bg-white border-2 border-dashed border-[#DDE3EA] p-12 rounded-[3.5rem] shadow-sm mb-8">
                            <Construction size={64} className="text-[#42A5F5] animate-bounce mx-auto" />
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tight capitalize text-slate-800">Module under construction</h1>
                        <p className="text-[14px] text-slate-400 font-bold capitalize mt-2">Secure system protocol 130 is active</p>
                    </motion.div>
                )}

                {/* STEP 3: QR & SCREENSHOT UPLOAD PANEL (DAY 130) */}
                {paymentMode === 'upi' && selectedApp && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white p-8 rounded-[3.5rem] border border-[#DDE3EA] text-center shadow-2xl relative">

                        {isProcessing ? (
                            <div className="py-20 space-y-6">
                                <div className="w-20 h-20 border-4 border-blue-50 border-t-[#42A5F5] rounded-full animate-spin mx-auto"></div>
                                <h2 className="text-2xl font-black italic capitalize">Finalizing uplink</h2>
                                <p className="text-[14px] text-slate-400 font-bold italic capitalize">Uploading evidence to secure node...</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-8">
                                    <button onClick={() => setSelectedApp(null)} className="p-2 bg-slate-50 rounded-xl text-slate-400 border border-slate-100"><ArrowLeft size={20} /></button>
                                    <h2 className="text-[13px] font-bold text-[#42A5F5] uppercase tracking-[0.3em] flex items-center gap-2">
                                        <ShieldCheck size={16} /> Secure checkout
                                    </h2>
                                    <div className="w-10"></div>
                                </div>

                                {/* QR DISPLAY LOGIC */}
<div className="bg-[#F8FAFC] p-6 rounded-[2.5rem] inline-block mb-6 border-2 border-[#DDE3EA] shadow-inner min-w-[200px] min-h-[200px] flex items-center justify-center">
    {summary.schoolPhone ? (
        <QRCodeSVG value={upiLink} size={180} fgColor="#1e293b" />
    ) : (
        <div className="text-center p-4">
            <ShieldAlert size={40} className="text-slate-300 mx-auto mb-2" />
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic">
                No QR available right now <br /> You can try again later
            </p>
        </div>
    )}
</div>

{/* UPI Details Logic */}
<div className="space-y-1 mb-8">
    <p className="text-4xl font-black italic tracking-tighter text-[#42A5F5]">
        ₹{summary.grandTotal.toLocaleString()}
    </p>
    {summary.schoolPhone ? (
        <p className="text-[12px] text-slate-400 font-bold tracking-widest">
            UPI ID: {summary.schoolPhone}
        </p>
    ) : (
        <p className="text-[12px] text-rose-400 font-bold tracking-widest uppercase italic">
            Gateway not configured
        </p>
    )}
</div>

{/* --- SCREENSHOT UPLOAD AREA (Only show if schoolPhone exists) --- */}
{summary.schoolPhone && (
    <div className="space-y-4">
        {!preview ? (
            <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-blue-100 rounded-[2rem] bg-blue-50/30 cursor-pointer hover:bg-blue-50 transition-all group">
                <Upload className="text-[#42A5F5] group-hover:animate-bounce mb-3" size={32} />
                <span className="text-[14px] font-black text-[#42A5F5] italic tracking-tight capitalize">Upload payment screenshot</span>
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </label>
        ) : (
            <div className="relative">
                <img src={preview} className="w-full h-44 object-contain rounded-3xl border-2 border-[#42A5F5]/30 bg-slate-50 p-2" alt="Preview" />
                <button
                    onClick={() => { setPreview(null); setScreenshot(null) }}
                    className="absolute -top-3 -right-3 bg-rose-500 text-white p-2 rounded-full shadow-lg active:scale-90"
                >
                    <X size={16} />
                </button>
                <p className="text-[13px] font-black text-emerald-500 italic mt-3 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Screenshot captured successfully
                </p>
            </div>
        )}

        {/* Action Button */}
        <AnimatePresence>
            {screenshot && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleFinalSubmit}
                    className="w-full py-5 bg-[#42A5F5] text-white rounded-[2rem] font-black text-[16px] shadow-lg shadow-blue-200 active:scale-95 transition-all mt-4 capitalize"
                >
                    Payment Completed
                </motion.button>
            )}
        </AnimatePresence>
    </div>
)}
                                {/* <button onClick={() => setSelectedApp(null)} className="mt-8 text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-all underline underline-offset-4 decoration-white/10">Change Method</button> */}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Mesh */}
            {/* <div className="absolute bottom-6 opacity-10 flex items-center gap-2">
                <ShieldAlert size={12} />
                <p className="text-[8px] font-black uppercase tracking-[0.5em]">EduFlowAI Secure Payment Mesh</p>
            </div> */}
            {/* --- NEURAL TOAST OVERLAY --- */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 40, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className={`fixed top-0 z-[100] px-8 py-4 rounded-2xl font-black text-[13px] italic shadow-2xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="absolute bottom-8 opacity-30 flex items-center gap-2 text-slate-400">
                <ShieldAlert size={14} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Neural encrypted gateway</p>
            </div>
        </div>
    );
};

export default PaymentMethods;
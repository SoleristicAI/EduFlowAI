import React, { useState, useEffect, useRef } from 'react';
import { IndianRupee, User, Calendar, CreditCard, Zap, Layers, ChevronDown, ArrowLeft, CheckCircle2, Bus, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react'; // 🔥 NAYA: QR Code import kiya
import API from '../../api';
import Toast from '../../components/Toast';

const AddPayment = () => {
    const navigate = useNavigate();
    const [msg, setMsg] = useState('');
    const [isMonthOpen, setIsMonthOpen] = useState(false);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [activeFields, setActiveFields] = useState([]);
    const [openClass, setOpenClass] = useState(false);
    const [openStudent, setOpenStudent] = useState(false);
    const [openFee, setOpenFee] = useState(false);
    const [selectedFees, setSelectedFees] = useState([]);
    const wrapperRef = useRef(null);

    // 🔥 NAYA: School ki UPI ID store karne ke liye
    const [upiId, setUpiId] = useState('');

    const [feeType, setFeeType] = useState('Academic');

    const [formData, setFormData] = useState({
        grade: '',
        enrollmentNo: '',
        paymentMode: 'Cash', // Default cash rahega
        feeCategory: '', 
        amountPaid: '',
        day: new Date().getDate(),
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        remarks: ''
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpenClass(false);
                setOpenStudent(false);
                setOpenFee(false);
                setIsMonthOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, []);

    // 🔥 NAYA: Page load hote hi School ka UPI Gateway fetch karo 🔥
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await API.get('/fees/settings/penalty'); // Isme gateway details aati hain
                if (data?.paymentSettings?.upiId) {
                    setUpiId(data.paymentSettings.upiId);
                }
            } catch (err) { console.error("Failed to fetch gateway"); }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchClasses = async () => {
            const { data } = await API.get('/fees/setup/classes');
            setClasses(data);
        };
        fetchClasses();
    }, []);

    const handleClassChange = async (grade) => {
        setFormData({ ...formData, grade, enrollmentNo: '', feeCategory: '', amountPaid: '' });
        const resStudents = await API.get(`/fees/setup/students/${grade}`);
        setStudents(resStudents.data);
        const resFields = await API.get(`/fees/setup/fields/${grade}`);
        setActiveFields(resFields.data);
    };

    // Auto-fetch pending transport dues if Transport is selected
    useEffect(() => {
        const fetchTransportDues = async (studentId) => {
            try {
                const { data } = await API.get(`/fees/audit-transport/${studentId}`);
                if (data && data.grandTotal !== undefined) {
                    setFormData(prev => ({ ...prev, amountPaid: data.grandTotal }));
                }
            } catch (err) { console.error("Failed to fetch transport dues"); }
        };

        if (feeType === 'Transport' && formData.enrollmentNo) {
            const student = students.find(s => s.enrollmentNo === formData.enrollmentNo);
            if (student) fetchTransportDues(student._id);
        } else if (feeType === 'Academic') {
            setFormData(prev => ({ ...prev, amountPaid: '' }));
        }
    }, [feeType, formData.enrollmentNo, students]);

    const handlePayment = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, feeType };
            const { data } = await API.post('/users/finance/add-payment', payload);

            setMsg("Payment synchronized! ✅");

            setTimeout(() => {
                navigate(`/finance/receipt/${data.feeRecord._id}`);
            }, 2000);

        } catch (err) {
            setMsg(err?.response?.data?.message || "Failed to log payment ❌");
        }
    };

    return (
        <div
            ref={wrapperRef}
            className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-32 px-5 pt-10 italic text-[15px] overflow-x-hidden overscroll-none fixed inset-0 overflow-y-auto"
        >
            <div className="flex items-center gap-5 mb-10 border-l-4 border-[#42A5F5] pl-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white rounded-2xl border border-[#DDE3EA] shadow-md hover:bg-blue-50 transition-all active:scale-90 group"
                >
                    <ArrowLeft className="text-[#42A5F5]" size={24} />
                </button>
                <h1 className="text-3xl font-black italic tracking-tight capitalize">Add Payment</h1>
            </div>

            <form onSubmit={handlePayment} className="space-y-6">

                {/* STEP 1: CLASS SELECTION */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                    <label className="text-[15px] font-black text-slate-700 uppercase ml-4 flex items-center gap-1 italic tracking-widest">
                        <Layers size={14} /> 1. Select class
                    </label>
                    <div className="relative mt-3">
                        <button
                            type="button"
                            onClick={() => {
                                setOpenClass(!openClass);
                                setOpenStudent(false);
                                setIsMonthOpen(false);
                            }}
                            className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center text-[16px] text-slate-700 font-bold italic"
                        >
                            <span>{formData.grade || "Choose class"}</span>
                            <ChevronDown size={20} className={`transition-transform ${openClass ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {openClass && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-50 w-full mt-2 bg-white border border-[#DDE3EA] rounded-3xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar p-2"
                                >
                                    {classes.map(c => (
                                        <div
                                            key={c}
                                            onClick={() => { handleClassChange(c); setOpenClass(false); }}
                                            className="p-4 hover:bg-blue-50 rounded-2xl cursor-pointer text-slate-700 font-bold transition-colors border-b border-slate-50 last:border-none"
                                        >
                                            {c}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {formData.grade && (
                    <>
                        {/* STEP 2: STUDENT SELECTION */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                            <label className="text-[15px] font-black text-slate-700 uppercase ml-4 flex items-center gap-1 italic tracking-widest">
                                <User size={14} /> 2. Select student
                            </label>
                            <div className="relative mt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenStudent(!openStudent);
                                        setOpenClass(false);
                                        setIsMonthOpen(false);
                                    }}
                                    className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center text-[16px] text-slate-700 font-bold italic transition-all focus:border-[#42A5F5]"
                                >
                                    <span className="truncate pr-4">
                                        {formData.enrollmentNo
                                            ? students.find(s => s.enrollmentNo === formData.enrollmentNo)?.name.toUpperCase()
                                            : "Choose student"}
                                    </span>
                                    <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${openStudent ? 'rotate-180 text-[#42A5F5]' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {openStudent && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="absolute z-50 w-full mt-2 bg-white border border-[#DDE3EA] rounded-3xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar p-2"
                                        >
                                            {students.length > 0 ? (
                                                students.map((s) => (
                                                    <div
                                                        key={s._id}
                                                        onClick={() => {
                                                            setFormData({ ...formData, enrollmentNo: s.enrollmentNo });
                                                            setOpenStudent(false);
                                                        }}
                                                        className={`p-4 mb-1 rounded-2xl cursor-pointer transition-all flex flex-col gap-0.5
                                                        ${formData.enrollmentNo === s.enrollmentNo ? 'bg-blue-50 border-l-4 border-[#42A5F5]' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                                                    >
                                                        <span className="text-[15px] font-black text-slate-700 uppercase">{s.name}</span>
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{s.enrollmentNo}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-6 text-center text-slate-400 font-bold italic">No students found</div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* STEP 3 - FEE TYPE SELECTION */}
                        {formData.enrollmentNo && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                                <label className="text-[15px] font-black text-slate-700 uppercase ml-4 flex items-center gap-1 italic tracking-widest mb-3">
                                    <Layers size={14} /> 3. Select Fee Type
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFeeType('Academic')}
                                        className={`flex-1 py-5 rounded-2xl text-[14px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${feeType === 'Academic' ? 'bg-[#42A5F5] text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                    >
                                        <BookOpen size={18} /> Academic
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFeeType('Transport')}
                                        className={`flex-1 py-5 rounded-2xl text-[14px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${feeType === 'Transport' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                    >
                                        <Bus size={18} /> Transport
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: PAYMENT MODE */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                            <label className="text-[15px] font-black text-slate-700 uppercase ml-4 flex items-center gap-1 italic tracking-widest">
                                <CreditCard size={14} /> 4. Payment method
                            </label>
                            <div className="flex gap-3 mt-3">
                                {/* 🔥 NAYA: 'Bank' hata diya gaya hai */}
                                {['Cash', 'Online'].map(mode => (
                                    <button
                                        key={mode} type="button"
                                        onClick={() => setFormData({ ...formData, paymentMode: mode })}
                                        className={`flex-1 py-5 rounded-2xl text-[14px] font-black uppercase transition-all shadow-sm ${formData.paymentMode === mode ? 'bg-[#42A5F5] text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* STEP 5: AMOUNT TO BE PAID & DYNAMIC QR */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm space-y-4 overflow-hidden">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[15px] font-black text-slate-700 uppercase flex items-center gap-1 italic tracking-widest">
                                    <Zap size={14} /> 5. Amount To Be Paid
                                </label>
                            </div>
                            <div className="relative mt-2">
                                <div className={`absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl ${feeType === 'Transport' ? 'text-amber-500' : 'text-[#42A5F5]'}`}>
                                    ₹
                                </div>
                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    className={`w-full bg-slate-50 p-6 pl-12 rounded-3xl border border-slate-200 text-2xl text-slate-700 font-black outline-none transition-all shadow-inner focus:bg-white ${feeType === 'Transport' ? 'focus:border-amber-400' : 'focus:border-[#42A5F5]'}`}
                                    value={formData.amountPaid}
                                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-400 font-bold italic px-2">
                                {feeType === 'Transport' 
                                    ? "Pending transport fee has been auto-filled. You can edit for advance/partial." 
                                    : "Enter the amount that will be collected from the student."}
                            </p>

                            {/* 🔥 THE MAGIC: DYNAMIC QR CODE REVEAL FOR ONLINE PAYMENTS 🔥 */}
                            <AnimatePresence>
                                {formData.paymentMode === 'Online' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                                        animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }} 
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }} 
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex flex-col items-center justify-center text-center shadow-inner">
                                            {upiId ? (
                                                <>
                                                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-4 inline-block">
                                                        {/* UPI String generates dynamically as they type the amount */}
                                                        <QRCodeSVG 
                                                            value={`upi://pay?pa=${upiId}&pn=School Fee Collection&am=${formData.amountPaid || 0}&cu=INR`} 
                                                            size={160} 
                                                            fgColor="#1e293b" 
                                                        />
                                                    </div>
                                                    <h4 className="text-[16px] font-black text-[#42A5F5] uppercase tracking-widest italic">Scan to Pay</h4>
                                                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1">UPI ID: {upiId}</p>
                                                    <div className="mt-4 bg-white px-4 py-2 border border-slate-200 rounded-xl">
                                                        <p className="text-[11px] font-bold text-slate-400 italic leading-snug">Ask the parent to scan this QR code. Once the payment is successful, click "Record Payment" below.</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="py-6">
                                                    <p className="text-[13px] font-black text-rose-500 uppercase tracking-widest italic flex items-center justify-center gap-2">
                                                        <AlertCircle size={18} /> UPI Gateway not configured!
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 font-bold mt-2 italic">Please set up the UPI ID in School Settings.</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* STEP 6: DATE LOGISTICS */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-2 rounded-3xl border border-[#DDE3EA] shadow-sm">
                                <input type="number" placeholder="Day" className="w-full bg-transparent p-4 text-[15px] font-bold text-center outline-none text-slate-700" value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value })} />
                            </div>
                            <div className="relative">
                                <div
                                    onClick={() => {
                                        setIsMonthOpen(!isMonthOpen);
                                        setOpenClass(false);
                                        setOpenStudent(false);
                                    }}
                                    className="bg-white p-2 rounded-3xl border border-[#DDE3EA] shadow-sm cursor-pointer active:scale-[0.98] transition-all"
                                >
                                    <div className="w-full p-4 flex justify-between items-center">
                                        <span className="text-[15px] font-bold text-slate-700 truncate mr-2">
                                            {formData.month || "Month"}
                                        </span>
                                        <motion.div animate={{ rotate: isMonthOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                            <ChevronDown size={18} className="text-[#42A5F5]" />
                                        </motion.div>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {isMonthOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 8, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute top-full left-0 right-0 z-50 bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-3 mt-2 max-h-60 overflow-y-auto custom-scrollbar"
                                        >
                                            {[ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ].map((m) => (
                                                <div
                                                    key={m} onClick={() => { setFormData({ ...formData, month: m }); setIsMonthOpen(false); }}
                                                    className={`p-4 rounded-2xl mb-1 cursor-pointer font-bold text-[14px] transition-all flex justify-between items-center ${formData.month === m ? "bg-blue-50 text-[#42A5F5]" : "text-slate-600 hover:bg-slate-50"}`}
                                                >
                                                    {m}
                                                    {formData.month === m && <CheckCircle2 size={16} className="text-[#42A5F5]" />}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="bg-white p-2 rounded-3xl border border-[#DDE3EA] shadow-sm">
                                <input type="number" placeholder="Year" className="w-full bg-transparent p-4 text-[15px] font-bold text-center outline-none text-slate-700" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
                            </div>
                        </div>

                        <button type="submit" className={`w-full text-white py-7 rounded-[2.5rem] font-black text-[16px] uppercase shadow-lg active:scale-95 transition-all mt-6 italic ${feeType === 'Transport' ? 'bg-amber-500 shadow-amber-100 hover:bg-amber-600' : 'bg-[#42A5F5] shadow-blue-100 hover:bg-blue-600'}`}>
                            Record Payment
                        </button>
                    </>
                )}
            </form>
            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default AddPayment;
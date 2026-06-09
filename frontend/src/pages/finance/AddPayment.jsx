import React, { useState, useEffect, useRef } from 'react';
import { IndianRupee, User, Calendar, CreditCard, Zap, Layers, ChevronDown, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // 👈 YE WALI LINE ADD KARO
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


    const [formData, setFormData] = useState({
        grade: '',
        enrollmentNo: '',
        paymentMode: 'Cash',
        feeCategory: '', // can be single or 'ALL'
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

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchClasses = async () => {
            const { data } = await API.get('/fees/setup/classes');
            setClasses(data);
        };
        fetchClasses();
    }, []);

    const handleClassChange = async (grade) => {
        setFormData({ ...formData, grade, enrollmentNo: '', feeCategory: '' });
        const resStudents = await API.get(`/fees/setup/students/${grade}`);
        setStudents(resStudents.data);
        const resFields = await API.get(`/fees/setup/fields/${grade}`);
        setActiveFields(resFields.data);
    };

    const handleAllSelect = () => {
        const allLabels = activeFields.map(f => f.label);
        const total = activeFields.reduce((sum, f) => sum + Number(f.amount), 0);

        setSelectedFees(allLabels);

        setFormData({
            ...formData,
            feeCategory: allLabels.join(', '),
            amountPaid: total,
            remarks: 'Full settlement'
        });
    };

    const handleFeeToggle = (fee) => {
        let updated = [...selectedFees];

        if (updated.includes(fee.label)) {
            updated = updated.filter(item => item !== fee.label);
        } else {
            updated.push(fee.label);
        }

        const total = activeFields
            .filter(f => updated.includes(f.label))
            .reduce((sum, f) => sum + Number(f.amount), 0);

        setSelectedFees(updated);

        setFormData({
            ...formData,
            feeCategory: updated.join(', '),
            amountPaid: total
        });
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        try {
            const { data } = await API.post(
                '/users/finance/add-payment',
                formData
            );

            setMsg("Payment synchronized! ✅");

            setTimeout(() => {
                navigate(`/finance/receipt/${data.feeRecord._id}`);
            }, 2000);

        } catch (err) {
            setMsg(
                err?.response?.data?.message ||
                "Failed to log payment ❌"
            );
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
                    {/* Custom Dropdown Trigger */}
                    <div className="relative mt-3">
                        <button
                            type="button"
                            onClick={() => {
                                setOpenClass(!openClass);
                                setOpenStudent(false);
                                setOpenFee(false);
                                setIsMonthOpen(false);
                            }}
                            className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center text-[16px] text-slate-700 font-bold italic"
                        >
                            <span>{formData.grade || "Choose class"}</span>
                            <ChevronDown size={20} className={`transition-transform ${openClass ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {openClass && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-50 w-full mt-2 bg-white border border-[#DDE3EA] rounded-3xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden p-2"
                                >
                                    {classes.map(c => (
                                        <div
                                            key={c}
                                            onClick={() => {
                                                handleClassChange(c);
                                                setOpenClass(false);
                                            }}
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
                                        setOpenFee(false);
                                        setIsMonthOpen(false);
                                    }}
                                    className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center text-[16px] text-slate-700 font-bold italic transition-all focus:border-[#42A5F5]"
                                >
                                    {/* Agar student select hai to uska naam dikhao, nahi to placeholder */}
                                    <span className="truncate pr-4">
                                        {formData.enrollmentNo
                                            ? students.find(s => s.enrollmentNo === formData.enrollmentNo)?.name.toUpperCase()
                                            : "Choose student"}
                                    </span>
                                    <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${openStudent ? 'rotate-180 text-[#42A5F5]' : ''}`} />
                                </button>

                                {/* --- DROPDOWN LIST --- */}
                                <AnimatePresence>
                                    {openStudent && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute z-50 w-full mt-2 bg-white border border-[#DDE3EA] rounded-3xl shadow-2xl max-h-72 overflow-y-auto p-2"
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
                                ${formData.enrollmentNo === s.enrollmentNo
                                                                ? 'bg-blue-50 border-l-4 border-[#42A5F5]'
                                                                : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
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

                        {/* STEP 3: PAYMENT MODE */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm">
                            <label className="text-[18px] font-black text-slate-700 uppercase ml-4 flex items-center gap-1 italic tracking-widest">
                                <CreditCard size={14} /> 3. Payment method
                            </label>
                            <div className="flex gap-3 mt-3">
                                {['Cash', 'Online', 'Bank'].map(mode => (
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

                        {/* STEP 4: AMOUNT TO BE PAID */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-[#DDE3EA] shadow-sm space-y-4">

                            <div className="flex justify-between items-center px-2">
                                <label className="text-[15px] font-black text-slate-700 uppercase flex items-center gap-1 italic tracking-widest">
                                    <Zap size={14} />
                                    4. Amount To Be Paid
                                </label>
                            </div>

                            <div className="relative mt-2">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#42A5F5] font-black text-2xl">
                                    ₹
                                </div>

                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    className="
                w-full
                bg-slate-50
                p-6
                pl-12
                rounded-3xl
                border border-slate-200
                text-2xl
                text-slate-700
                font-black
                outline-none
                focus:border-[#42A5F5]
                focus:bg-white
                transition-all
                shadow-inner
            "
                                    value={formData.amountPaid}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            amountPaid: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>

                            <p className="text-xs text-slate-700 px-2">
                                Enter the amount that will be collected from the student.
                            </p>

                        </div>

                        {/* STEP 5: DATE LOGISTICS */}
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
                                        setOpenFee(false);
                                    }}
                                    className="bg-white p-2 rounded-3xl border border-[#DDE3EA] shadow-sm cursor-pointer active:scale-[0.98] transition-all"
                                >
                                    <div className="w-full p-4 flex justify-between items-center">
                                        <span className="text-[15px] font-bold text-slate-700">
                                            {formData.month || "Select Month"}
                                        </span>

                                        <motion.div
                                            animate={{ rotate: isMonthOpen ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown size={18} className="text-[#42A5F5]" />
                                        </motion.div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isMonthOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 8, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute top-full left-0 right-0 z-50 bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-3 mt-2 max-h-72 overflow-y-auto"
                                        >
                                            {[
                                                "January", "February", "March", "April",
                                                "May", "June", "July", "August",
                                                "September", "October", "November", "December"
                                            ].map((m) => (
                                                <div
                                                    key={m}
                                                    onClick={() => {
                                                        setFormData({ ...formData, month: m });
                                                        setIsMonthOpen(false);
                                                    }}
                                                    className={`p-4 rounded-2xl mb-1 cursor-pointer font-bold text-[15px] transition-all flex justify-between items-center
                        ${formData.month === m
                                                            ? "bg-blue-50 text-[#42A5F5]"
                                                            : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    {m}

                                                    {formData.month === m && (
                                                        <CheckCircle2 size={16} className="text-[#42A5F5]" />
                                                    )}
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

                        <button type="submit" className="w-full bg-[#42A5F5] text-white py-7 rounded-[2.5rem] font-black text-[16px] uppercase shadow-lg shadow-blue-100 active:scale-95 transition-all mt-6 italic">
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
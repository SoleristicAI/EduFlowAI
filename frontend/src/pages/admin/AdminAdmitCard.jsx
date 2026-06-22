import React, { useState, useEffect } from 'react';
import { ArrowLeft, ClipboardCheck, Zap, Upload, ChevronDown, Check, X, FileSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import Loader from '../../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const AdminAdmitCard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [datesheets, setDatesheets] = useState([]);

    // Fixed School Profile Fetching
    const [schoolProfile, setSchoolProfile] = useState({ name: 'EduFlowAI School', logo: null });

    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // View Controller
    const [showPreview, setShowPreview] = useState(false);
    const [publishModal, setPublishModal] = useState(false);

    const [formData, setFormData] = useState({
        datesheetId: '',
        datesheetTitle: '',
        batch: '',
        examType: '',
        instructions: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // 1. Fetch Datesheets
            const dsRes = await API.get('/admitcard/available-datesheets');
            setDatesheets(dsRes.data);

            // 2. Fetch ONLY Logo
            let fetchedLogo = null;
            try {
                const logoRes = await API.get('/school/logo');
                fetchedLogo = logoRes.data?.logo || null;
            } catch (logoErr) {
                console.log("No logo found");
            }

            // 3. Fetch Authentic School Name via the existing subscription route
            let sName = 'EduFlowAI Public School';
            try {
                const statusRes = await API.get('/school/subscription-status');
                if (statusRes.data && statusRes.data.schoolName) {
                    sName = statusRes.data.schoolName;
                }
            } catch (nameErr) {
                // Fallback to local storage if API fails
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const userObj = JSON.parse(userStr);
                    sName = userObj.schoolId?.name || userObj.schoolName || sName;
                }
            }

            // 4. Set the final profile state
            setSchoolProfile({
                name: sName,
                logo: fetchedLogo
            });

        } catch (err) {
            triggerToast("Failed to load data.", "error");
        } finally {
            setLoading(false);
        }
    };

    const triggerToast = (msg, type = "success") => {
        setShowToast({ show: true, message: msg, type });
        setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    // Open Preview Engine
    const handleGeneratePreview = (e) => {
        e.preventDefault();
        if (!formData.datesheetId || !formData.batch || !formData.examType || !formData.instructions) {
            return triggerToast("Fill all configuration details!", "error");
        }
        setShowPreview(true);
    };

    // Actual DB Publish
    // Actual DB Publish
    const handlePublish = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                instructions: formData.instructions.split('\n').filter(i => i.trim() !== '') // Convert to Array
            };
            await API.post('/admitcard/publish', payload);
            triggerToast("Admit Cards Published Successfully! 🚀", "success");

            // 1. Modal band karo
            setPublishModal(false);

            // 2. Preview hata kar wapas form view laao
            setShowPreview(false);

            // 3. Form ko poora khali (reset) kar do
            setFormData({
                datesheetId: '',
                datesheetTitle: '',
                batch: '',
                examType: '',
                instructions: ''
            });

        } catch (err) {
            triggerToast(err.response?.data?.message || "Failed to publish.", "error");
            setPublishModal(false); // Error aaye toh bhi modal band karo
        } finally {
            setLoading(false);
        }
    };

    const selectedDs = datesheets.find(ds => ds._id === formData.datesheetId);
    const sampleClass = selectedDs?.classes[0] || "10";
    const todayStr = new Date().toLocaleDateString('en-GB');

    if (loading && !showPreview) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 text-[15px] overflow-x-hidden fixed inset-0 overflow-y-auto">
            {showToast.show && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast({ show: false, message: '', type: '' })} />}

            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">

                    {/* Left Button */}
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/20 rounded-2xl border border-white/30 active:scale-90 transition-all shadow-sm">
                        <ArrowLeft size={24} />
                    </button>

                    {/* Center Title */}
                    <div className="absolute left-1/2 -translate-x-1/2 text-center">
                        <h1 className="text-4xl md:text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                            Admit Card
                        </h1>
                        <p className="text-[17px] font-black uppercase tracking-widest text-white opacity-90 mt-1 whitespace-nowrap">
                            Issue & Manage
                        </p>
                    </div>

                    <div className="p-3 bg-white/20 rounded-2xl border border-white/30 shadow-sm"><ClipboardCheck size={24} /></div>
                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-4xl mx-auto">

                {!showPreview && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => navigate('/admin/manage-admit-cards')}
                            className="bg-white border border-slate-200 text-[#42A5F5] px-6 py-3 rounded-[2rem] font-black uppercase tracking-widest text-[12px] shadow-sm hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-2"
                        >
                            Manage Published
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {!showPreview ? (
                        /* --- CONFIGURATION FORM --- */
                        <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white p-8 rounded-[3.5rem] shadow-2xl border border-slate-100">
                            <h2 className="text-xl font-black italic text-slate-800 mb-6 uppercase tracking-widest border-b-2 border-slate-100 pb-4 text-center">Exam Configuration</h2>

                            {datesheets.length === 0 ? (
                                <div className="text-center p-6 bg-red-50 rounded-3xl text-red-500 font-bold">
                                    ⚠️ Generate Datesheet first to issue Admit Cards.
                                </div>
                            ) : (
                                <form onSubmit={handleGeneratePreview} className="space-y-6">
                                    {/* CUSTOM ANIMATED DROPDOWN */}
                                    <div>
                                        <label className="text-[15px] font-black italic text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Datesheet</label>
                                        <div className="relative">
                                            <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200 font-bold text-slate-700 outline-none transition-all">
                                                <span className="truncate">{formData.datesheetTitle || 'Select Datesheet from Dropdown'}</span>
                                                <ChevronDown size={20} className={`text-[#42A5F5] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            <AnimatePresence>
                                                {isDropdownOpen && (
                                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 max-h-60 overflow-y-auto">
                                                        {datesheets.map(ds => (
                                                            <button
                                                                key={ds._id} type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, datesheetId: ds._id, datesheetTitle: ds.title });
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl font-bold transition-all mb-2 ${formData.datesheetId === ds._id ? 'bg-[#42A5F5] text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                                            >
                                                                <span className="text-left truncate w-5/6">{ds.title}</span>
                                                                {formData.datesheetId === ds._id && <Check size={16} />}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[15px] font-black italic text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Academic Batch</label>
                                            <input type="text" placeholder="e.g. 2025 - 2026" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:border-[#42A5F5] uppercase" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="text-[15px] font-black italic text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Exam Type</label>
                                            <input type="text" placeholder="e.g. HALF YEARLY" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:border-[#42A5F5] uppercase" value={formData.examType} onChange={(e) => setFormData({ ...formData, examType: e.target.value })} required />
                                        </div>
                                    </div>

                                    {/* MANUAL INSTRUCTIONS TEXTAREA */}
                                    <div>
                                        <label className="text-[15px] font-black italic text-slate-500 uppercase ml-2 mb-2 block tracking-widest">Instructions for Students</label>
                                        <textarea rows="4" placeholder="1. Reach exam hall 10 mins early...&#10;2. Bring ID card..." className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:border-[#42A5F5] resize-none" value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} required />
                                    </div>

                                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black italic uppercase tracking-widest shadow-xl hover:bg-[#42A5F5] transition-all flex items-center justify-center gap-2 mt-4">
                                        <FileSearch size={20} /> Preview Sample
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    ) : (
                        /* --- LIVE PREVIEW & ACTIONS --- */
                        <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">

                            {/* THE HALL TICKET PREVIEW */}
                            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border-4 border-slate-200 select-none">
                                <div className="border-[3px] border-[#2B7A9F] p-1 w-full">

                                    {/* Header Row - NO TAGLINE, ROUND LOGO */}
                                    <div className="flex justify-between items-center border-b-2 border-[#2B7A9F] pb-4 px-4 pt-2">
                                        <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                            {schoolProfile.logo ? (
                                                <img src={schoolProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">LOGO</div>
                                            )}
                                        </div>
                                        <div className="text-center flex-1 px-4">
                                            <h1 className="text-2xl md:text-3xl font-black text-[#E31E24] uppercase tracking-wider">{schoolProfile.name}</h1>
                                        </div>
                                        <div className="w-20 h-24 border-2 border-slate-300 bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 text-center rounded-md">
                                            STUDENT<br />PHOTO
                                        </div>
                                    </div>

                                    {/* Titles */}
                                    <div className="text-center py-3 border-b-2 border-[#2B7A9F] bg-slate-50">
                                        <h2 className="font-black text-[#111] uppercase tracking-[0.2em]">Hall Ticket</h2>
                                        <h3 className="font-extrabold text-[#111] uppercase tracking-widest mt-1 text-xs">{formData.batch}</h3>
                                    </div>

                                    {/* Student Details Table - ADM/ENROLLMENT FIXED */}
                                    <div className="w-full">
                                        <table className="w-full text-left text-[12px] font-semibold text-[#111] border-collapse">
                                            <tbody>
                                                <tr className="border-b border-[#2B7A9F]">
                                                    <td className="p-2 border-r border-[#2B7A9F] font-extrabold w-1/4 bg-slate-50/50">Admission No.:</td>
                                                    <td className="p-2 border-r border-[#2B7A9F] w-1/4">ADM9823 (Sample)</td>
                                                    <td className="p-2 border-r border-[#2B7A9F] font-extrabold w-1/4 bg-slate-50/50">Enrollment No.:</td>
                                                    <td className="p-2 w-1/4">STU10A001 (Sample)</td>
                                                </tr>
                                                <tr className="border-b border-[#2B7A9F]">
                                                    <td className="p-2 border-r border-[#2B7A9F] font-extrabold bg-slate-50/50">Name of the Student:</td>
                                                    <td colSpan="3" className="p-2">Aditya Arya (Sample Data)</td>
                                                </tr>
                                                <tr className="border-b border-[#2B7A9F]">
                                                    <td className="p-2 border-r border-[#2B7A9F] font-extrabold bg-slate-50/50">Father's Name:</td>
                                                    <td className="p-2 border-r border-[#2B7A9F]">Vishavpal Arya</td>
                                                    <td className="p-2 border-r border-[#2B7A9F] font-extrabold bg-slate-50/50">Mother's Name:</td>
                                                    <td className="p-2">Neeraj Arya</td>
                                                </tr>
                                                <tr className="border-b border-[#2B7A9F]">
                                                    <td className="p-2 border-r border-[#2B7A9F] font-extrabold bg-slate-50/50">Class:</td>
                                                    <td className="p-2 border-r border-[#2B7A9F] font-black text-[#E31E24] text-sm">{sampleClass}</td>
                                                    <td className="p-2 border-r border-[#2B7A9F] font-extrabold bg-slate-50/50">DOB:</td>
                                                    <td className="p-2">01/09/2005</td>
                                                </tr>
                                                <tr className="border-b-2 border-[#2B7A9F]">
                                                    <td className="p-2 border-r border-[#2B7A9F] font-extrabold bg-slate-50/50">Exam Type:</td>
                                                    <td className="p-2 border-r border-[#2B7A9F] font-bold uppercase">{formData.examType}</td>
                                                    <td className="p-2 border-r border-[#2B7A9F] font-extrabold bg-slate-50/50">Date of Issue:</td>
                                                    <td className="p-2">{todayStr}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Subjects Table */}
                                    <div className="w-full mt-1">
                                        <table className="w-full text-center text-[12px] font-semibold text-[#111] border-collapse">
                                            <thead className="bg-slate-100">
                                                <tr className="border-b-2 border-[#2B7A9F]">
                                                    <th className="p-2 border-r border-[#2B7A9F] font-extrabold uppercase tracking-wider">Exam Code</th>
                                                    <th className="p-2 border-r border-[#2B7A9F] font-extrabold text-left uppercase tracking-wider">Subject Name</th>
                                                    <th className="p-2 border-r border-[#2B7A9F] font-extrabold uppercase tracking-wider">Session</th>
                                                    <th className="p-2 font-extrabold uppercase tracking-wider">Date & Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedDs?.schedule.map((row, idx) => {
                                                    const subject = row.classExams[sampleClass];
                                                    if (!subject || subject === '-') return null;
                                                    const examCode = `EXM${subject.substring(0, 3).toUpperCase()}${idx + 1}`;

                                                    return (
                                                        <tr key={idx} className="border-b border-[#2B7A9F]">
                                                            <td className="p-2 border-r border-[#2B7A9F] font-bold">{examCode}</td>
                                                            <td className="p-2 border-r border-[#2B7A9F] text-left uppercase font-bold text-sm">{subject}</td>
                                                            <td className="p-2 border-r border-[#2B7A9F] uppercase">{formData.batch}</td>
                                                            <td className="p-2">
                                                                <div className="font-bold">{row.date}</div>
                                                                <div className="text-[10px] text-slate-500 mt-0.5 font-black uppercase">{selectedDs.timing}</div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr className="border-b-2 border-[#2B7A9F] bg-slate-50">
                                                    <td colSpan="4" className="p-2 font-extrabold text-[10px] tracking-widest text-center">
                                                        --- END OF STATEMENT ---
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Signatures */}
                                    <div className="relative pt-24 pb-4 border-b-2 border-[#2B7A9F] px-8 flex justify-between items-end overflow-hidden">
                                        <div className="text-center font-extrabold text-[12px]">
                                            <div className="border-t-2 border-black pt-1 w-32 md:w-48 uppercase">Student Signature</div>
                                        </div>
                                        <div className="text-center font-extrabold text-[12px] relative">
                                            {selectedDs?.signatures?.incharge && <img src={selectedDs.signatures.incharge} alt="sign" className="h-10 mx-auto absolute bottom-8 left-1/2 -translate-x-1/2" />}
                                            <div className="border-t-2 border-black pt-1 w-32 md:w-48 uppercase">Controller of Exams</div>
                                        </div>
                                    </div>
                                    <div className="text-center p-3 font-black text-[11px] uppercase tracking-widest bg-slate-50">
                                        Student must bring the School ID Card along with this Hall Ticket.
                                    </div>
                                </div>

                                {/* DYNAMIC INSTRUCTIONS */}
                                <div className="mt-6 px-2">
                                    <h4 className="font-extrabold text-[14px] text-center mb-4 uppercase tracking-widest border-b pb-2">Instructions to Students</h4>
                                    <ol className="list-decimal pl-5 text-[11px] font-bold space-y-2 text-[#333]">
                                        {formData.instructions.split('\n').map((note, i) => (
                                            note.trim() && <li key={i} className="leading-relaxed">{note}</li>
                                        ))}
                                    </ol>
                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <button onClick={() => setShowPreview(false)} className="flex-1 py-4 bg-red-50 text-red-500 rounded-[2rem] font-black italic uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                    <X size={20} /> Discard & Edit
                                </button>
                                <button onClick={() => setPublishModal(true)} disabled={loading} className="flex-1 py-4 bg-[#42A5F5] text-white rounded-[2rem] font-black italic uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                                    <Upload size={20} /> Publish to Students
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {publishModal && (
                        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPublishModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />

                            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl relative z-10 text-center border border-[#DDE3EA]">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Upload className="text-[#42A5F5]" size={36} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Publish Now?</h2>
                                <p className="text-slate-500 font-bold mb-8 leading-relaxed text-sm">
                                    Are you sure? This will instantly generate and distribute Admit Cards to all eligible students' dashboards.
                                </p>

                                <div className="flex gap-4">
                                    <button disabled={loading} onClick={handlePublish} className="flex-1 bg-[#42A5F5] text-white py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex justify-center items-center hover:bg-blue-600">
                                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Yes, Publish"}
                                    </button>
                                    <button onClick={() => setPublishModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-200">
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminAdmitCard;
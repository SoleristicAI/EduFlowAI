import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BarChart3, BookOpen, BookMarked, AlertCircle, Download, Filter, CalendarDays, ArrowRightLeft, X, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // FIXED: Proper AutoTable Import

// --- CUSTOM PREMIUM DROPDOWN ---
const CustomDropdown = ({ options, value, onChange, placeholder, icon: Icon, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`relative z-20 ${className}`}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] border transition-all cursor-pointer bg-slate-50 ${isOpen ? "border-[#42A5F5] ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-300"
                    }`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {Icon && <Icon size={20} className={value ? "text-[#42A5F5] shrink-0" : "text-slate-400 shrink-0"} />}
                    <span className={`text-[13px] font-black uppercase tracking-widest truncate ${value ? "text-slate-700" : "text-slate-400"}`}>
                        {options.find(opt => opt.value === value)?.label || placeholder}
                    </span>
                </div>
                <div className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#42A5F5]" : ""}`}>
                    <ArrowLeft size={16} className="-rotate-90" />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 right-0 top-[105%] z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {options.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => { onChange(option.value); setIsOpen(false); }}
                                        className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-all hover:bg-blue-50 ${value === option.value ? "bg-blue-50 text-[#42A5F5]" : "text-slate-700"
                                            }`}
                                    >
                                        <span className="font-bold text-[13px] uppercase tracking-widest">{option.label}</span>
                                        {value === option.value && <CheckCircle size={16} />}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const LibraryReports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [reportData, setReportData] = useState({ stats: {}, transactions: [] });
    const [timeFilter, setTimeFilter] = useState('30days');

    // Modal States
    const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // 🔥 FIX: Extracting precise school data from user storage based on backend logic 🔥
    const user = JSON.parse(localStorage.getItem('user')) || {};

    // Fallback logic for name: SchoolName -> User Name -> Default
    const schoolName = user?.schoolData?.schoolName || "EduFlowAI Institution";
    const schoolContact = user?.phone || "N/A";

    // Constructing the full address string using backend schema properties
    const adr = user?.address || {};
    const fullStreet = adr.fullAddress ? adr.fullAddress : '';
    const locationPart = [adr.district, adr.state, adr.pincode].filter(Boolean).join(', ');
    const rawAddress = fullStreet ? `${fullStreet}${locationPart ? ` - ${locationPart}` : ''}` : "Digital Campus, India";
    const schoolAddress = rawAddress.replace(/\b\w/g, char => char.toUpperCase()); // Har word ka pehla letter capital ho jayega

    const filterOptions = [
        { label: 'All Time History', value: 'all' },
        { label: 'Last 30 Days', value: '30days' },
        { label: 'Last 7 Days', value: '7days' }
    ];

    useEffect(() => {
        fetchReports();
    }, [timeFilter]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const { data } = await API.get(`/library/reports?filter=${timeFilter}`);
            setReportData(data);
        } catch (error) {
            setMsg("Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 GENERATE & DOWNLOAD PDF LOGIC (FIXED FOR SAAS) 🔥
    const generatePDF = () => {
        setIsDownloading(true);
        try {
            const stats = reportData?.stats || { totalTransactions: 0, issued: 0, returned: 0, overdue: 0 };
            const transactions = reportData?.transactions || [];

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // 1. School Header (Dynamic from User Data)
            doc.setFontSize(22);
            doc.setTextColor(66, 165, 245); // #42A5F5
            doc.setFont("helvetica", "bold");
            doc.text(String(schoolName).toUpperCase(), pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "normal");
            doc.text(String(schoolAddress), pageWidth / 2, 28, { align: 'center' });
            doc.text(`Contact: ${String(schoolContact)}`, pageWidth / 2, 34, { align: 'center' });

            // Divider Line
            doc.setDrawColor(220, 227, 234);
            doc.line(14, 40, pageWidth - 14, 40);

            // 2. Report Title & Generation Date ONLY (Removed Filter applied)
            doc.setFontSize(16);
            doc.setTextColor(30, 41, 59); // Slate 800
            doc.setFont("helvetica", "bold");
            doc.text("LIBRARY REPORT", 14, 52);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 59);

            // 3. Stats Summary
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(`Total Transactions: ${stats.totalTransactions}`, 14, 70);
            doc.text(`Total Issued: ${stats.issued}`, 75, 70);
            doc.text(`Total Returned: ${stats.returned}`, 135, 70);
            doc.text(`Overdue Cases: ${stats.overdue}`, 14, 77);

            // 4. Data Table (Strings Only for Safety)
            const tableColumn = ["Issue Date", "Student Details", "Book Details", "Status"];
            const tableRows = [];

            transactions.forEach(tx => {
                const date = tx.issueDate ? new Date(tx.issueDate).toLocaleDateString('en-GB') : 'N/A';

                const stuName = tx.studentId?.name ? tx.studentId.name.toUpperCase() : 'UNKNOWN';
                const stuId = tx.studentId?.enrollmentNo || 'N/A';
                const studentString = `${stuName}\nID: ${stuId}`;

                const bookTitle = tx.bookId?.title ? tx.bookId.title.toUpperCase() : 'UNKNOWN';
                const bookIsbn = tx.bookId?.isbn || 'N/A';
                const bookString = `${bookTitle}\nISBN: ${bookIsbn}`;

                const isOverdue = tx.status === 'Overdue' || (tx.status === 'Issued' && tx.dueDate && new Date(tx.dueDate) < new Date());
                const status = tx.status === 'Returned' ? 'RETURNED' : isOverdue ? 'OVERDUE' : 'ISSUED';

                tableRows.push([String(date), String(studentString), String(bookString), String(status)]);
            });

            // FIXED: Proper autoTable initialization
            if (tableRows.length > 0) {
                autoTable(doc, {
                    startY: 85,
                    head: [tableColumn],
                    body: tableRows,
                    theme: 'grid',
                    headStyles: { fillColor: [66, 165, 245], textColor: 255, fontStyle: 'bold' },
                    styles: { fontSize: 9, cellPadding: 4, valign: 'middle' },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    columnStyles: {
                        0: { cellWidth: 25 },
                        3: { cellWidth: 30, fontStyle: 'bold' }
                    }
                });
            } else {
                doc.setFontSize(12);
                doc.setFont("helvetica", "italic");
                doc.setTextColor(150, 150, 150);
                doc.text("No transactions found for this period.", pageWidth / 2, 95, { align: 'center' });
            }

            // Save the PDF
            doc.save(`Library_Audit_Report_${new Date().getTime()}.pdf`);

            setMsg("PDF Downloaded Successfully! 📄");
            setShowDownloadConfirm(false);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            setMsg("Failed to generate PDF. Check console.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans italic text-slate-800 overscroll-none fixed inset-0 overflow-y-auto custom-scrollbar">

            {/* HEADER */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl relative text-center">
                <button onClick={() => navigate(-1)} className="absolute top-12 left-6 bg-white/20 p-3 rounded-2xl border border-white/30 text-white transition-all active:scale-90"><ArrowLeft size={24} /></button>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic flex items-center justify-center gap-3 px-16 leading-tight">Library Analytics</h1>
                <p className="text-[14px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2 italic">Master Audit Report</p>
            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-7xl mx-auto">

                {/* TOOLBAR */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">

                    {/* CUSTOM DROPDOWN */}
                    <div className="w-full md:w-80">
                        <CustomDropdown
                            options={filterOptions}
                            value={timeFilter}
                            onChange={(val) => setTimeFilter(val)}
                            icon={Filter}
                            placeholder="Select Filter"
                        />
                    </div>

                    <button onClick={() => setShowDownloadConfirm(true)} className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[13px] shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 shrink-0">
                        <Download size={18} /> Download PDF
                    </button>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner bg-indigo-50 text-indigo-500"><ArrowRightLeft size={24} /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transactions</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{reportData.stats.totalTransactions}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner bg-blue-50 text-[#42A5F5]"><BookOpen size={24} /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Issued</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{reportData.stats.issued}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner bg-emerald-50 text-emerald-500"><BookMarked size={24} /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Returned</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{reportData.stats.returned}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner bg-rose-50 text-rose-500"><AlertCircle size={24} /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overdue Cases</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{reportData.stats.overdue}</p>
                    </motion.div>
                </div>

                {/* DETAILED LEDGER TABLE */}
                <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-slate-50 text-[#42A5F5] rounded-2xl"><BarChart3 size={24} /></div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Transaction Ledger</h2>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar pb-4">
                        <table className="w-full text-left border-separate border-spacing-y-3 min-w-[800px]">
                            <thead>
                                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 pb-4">Issue Date</th>
                                    <th className="px-6 pb-4">Student Details</th>
                                    <th className="px-6 pb-4">Book Information</th>
                                    <th className="px-6 pb-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-slate-400 font-bold">No transactions found for this period.</td>
                                    </tr>
                                ) : (
                                    reportData.transactions.map((tx, i) => {
                                        const isOverdue = tx.status === 'Overdue' || (tx.status === 'Issued' && new Date(tx.dueDate) < new Date());
                                        const displayStatus = tx.status === 'Returned' ? 'Returned' : isOverdue ? 'Overdue' : 'Issued';

                                        return (
                                            <tr key={i} className="bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer">
                                                <td className="py-4 px-6 border-y border-l border-slate-100 rounded-l-[1.5rem]">
                                                    <div className="flex items-center gap-2 text-slate-600 font-black text-[13px] uppercase tracking-wider">
                                                        <CalendarDays size={16} className="text-[#42A5F5]" />
                                                        {new Date(tx.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 border-y border-slate-100">
                                                    <p className="text-[14px] font-black text-slate-800 uppercase">{tx.studentId?.name || "Unknown"}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: {tx.studentId?.enrollmentNo} | {tx.studentId?.grade}</p>
                                                </td>
                                                <td className="py-4 px-6 border-y border-slate-100">
                                                    <p className="text-[13px] font-black text-slate-700 capitalize">{tx.bookId?.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ISBN: {tx.bookId?.isbn}</p>
                                                </td>
                                                <td className="py-4 px-6 border-y border-r border-slate-100 rounded-r-[1.5rem] text-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${displayStatus === 'Returned' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            displayStatus === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                'bg-blue-50 text-[#42A5F5] border-blue-100'
                                                        }`}>
                                                        {displayStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 🔥 PDF DOWNLOAD CONFIRMATION MODAL 🔥 */}
            <AnimatePresence>
                {showDownloadConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDownloadConfirm(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center z-10">
                            <div className="w-20 h-20 bg-blue-50 text-[#42A5F5] rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                                <FileText size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Generate PDF?</h3>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-6 leading-relaxed">
                                Download a formal audit report for <br /> <span className="text-[#42A5F5] font-black">{filterOptions.find(o => o.value === timeFilter)?.label}</span>?
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDownloadConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={generatePDF} disabled={isDownloading} className="flex-1 py-4 bg-[#42A5F5] text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg transition-all flex items-center justify-center gap-2">
                                    {isDownloading ? "Generating..." : <><Download size={18} /> Download</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {msg && <Toast message={msg} onClose={() => setMsg('')} />}
        </div>
    );
};

export default LibraryReports;
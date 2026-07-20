import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, ChevronDown, Download, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import Toast from '../../components/Toast';
import { AnimatePresence, motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "https://eduflowai-3a47.onrender.com";

const StudentExamResult = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const [viewMode, setViewMode] = useState('select');
    const [publishedResults, setPublishedResults] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [studentProfile, setStudentProfile] = useState(null);
    const [schoolName, setSchoolName] = useState("");
    const [schoolLogo, setSchoolLogo] = useState("");

    const [showToast, setShowToast] = useState({
        show: false,
        message: '',
        type: ''
    });

    useEffect(() => {
        setSelectedResult(null);
        loadData();
    }, []);

    const triggerToast = (message, type = "success") => {
        setShowToast({ show: true, message, type });
        setTimeout(() => {
            setShowToast({ show: false, message: '', type: '' });
        }, 3000);
    };

    const loadData = async () => {
        setLoading(true);

        try {
            const userStr = localStorage.getItem("user");

            // Agar user hi nahi hai toh aage mat badho
            if (!userStr) return;

            const user = JSON.parse(userStr);

            setStudentProfile(user);

            if (user.schoolId?.name) {
                setSchoolName(user.schoolId.name);
            }

            if (user.schoolId?.logo) {
                setSchoolLogo(user.schoolId.logo);
            }

            // ===============================
            // SMART RESULTS CACHE SYSTEM (Fix for cross-account leak)
            // ===============================
            // Cache ko specific user ki ID ke sath lock kar diya
            const cacheKey = `studentExamResults_${user._id}`;
            const cachedResults = localStorage.getItem(cacheKey);

            if (cachedResults) {
                // instant load from cache ONLY FOR THIS STUDENT
                setPublishedResults(JSON.parse(cachedResults));
            }

            // background fresh fetch (silent)
            const { data } = await API.get("/exam-results/my-results");

            // compare old vs new
            const oldData = cachedResults ? JSON.parse(cachedResults) : [];

            const oldString = JSON.stringify(oldData);
            const newString = JSON.stringify(data);

            if (oldString !== newString) {
                localStorage.setItem(
                    cacheKey, // Updated key
                    JSON.stringify(data)
                );

                setPublishedResults(data);
            }

            // latest logo fetch
            try {
                const { data: logoData } = await API.get("/school/logo");

                if (logoData?.logo) {
                    setSchoolLogo(logoData.logo);
                }
            } catch {
                console.log("Logo fetch skipped");
            }

        } catch {
            triggerToast("Failed to load results", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleResultSelect = (id) => {
        const found = publishedResults.find(r => r._id === id);

        setSelectedResult(found);

        // yaha set karo
        setSchoolName(found.schoolName);
        setSchoolLogo(found.schoolLogo);

        setIsDropdownOpen(false);
    };

    const generatePDF = async () => {
        try {
            setIsDownloading(true);
            triggerToast("Generating PDF...");

            const element = document.getElementById('report-card-pdf-content');

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#FFFFFF"
            });

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${studentProfile?.name}_${selectedResult?.examTitle}_Result.pdf`);

            triggerToast("PDF Downloaded Successfully");
        } catch (err) {
            console.error(err);
            triggerToast("PDF Generation Failed", "error");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] fixed inset-0 overflow-y-auto pb-24">
            {showToast.show && (
                <Toast
                    message={showToast.message}
                    type={showToast.type}
                    onClose={() => setShowToast({ show: false, message: '', type: '' })}
                />
            )}

            {/* Header */}
            <div className="bg-[#42A5F5] text-white px-6 pt-12 pb-24 rounded-b-[4rem] shadow-lg relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-transparent pointer-events-none opacity-50"></div>

                {/* Top Row */}
                <div className="relative z-10 flex justify-between items-center">

                    {/* Back Button */}
                    <button
                        onClick={() => {
                            if (viewMode === "reportCard") setViewMode("select");
                            else navigate(-1);
                        }}
                        className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white active:scale-90 transition-all shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Right Icon */}
                    <div className="p-3 bg-white/20 rounded-2xl border border-white/30 text-white shadow-sm">
                        <BarChart3 size={24} />
                    </div>
                </div>

                {/* Heading + Subtitle */}
                <div className="relative z-10 text-center mt-4">
                    <h1 className="text-4xl font-black italic tracking-tight capitalize whitespace-nowrap">
                        Exam Results
                    </h1>

                    <p className="text-[15px] font-black uppercase tracking-widest text-white opacity-90 mt-2 whitespace-nowrap">
                        Student Performance Report
                    </p>
                </div>

            </div>

            <div className="px-5 -mt-10 relative z-20 max-w-4xl mx-auto">

                {/* SELECT SCREEN */}
                {viewMode === 'select' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-[3rem] p-8 shadow-xl border border-[#E2E8F0] space-y-6"
                    >
                        {/* Student Identity */}
                        <div>
                            <label className="text-[12px] font-black text-[#64748B] uppercase mb-2 block">
                                Enrolled Identity
                            </label>

                            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 flex justify-between items-center">
                                <div className="flex gap-3 items-center">
                                    <Layers className="text-[#42A5F5]" />
                                    <span className="font-black text-[#1E3A8A]">
                                        Class: {studentProfile?.grade || "Loading..."}
                                    </span>
                                </div>

                                <span className="text-[#42A5F5] font-black text-xs uppercase">
                                    Verified
                                </span>
                            </div>
                        </div>

                        {/* Dropdown */}
                        <div className="relative">
                            <label className="text-[12px] font-black text-[#64748B] uppercase mb-2 block tracking-widest">
                                Choose Examination
                            </label>

                            {/* Select Button */}
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] p-5 rounded-2xl flex justify-between items-center shadow-sm transition-all hover:border-[#42A5F5] hover:bg-white"
                            >
                                <span className="font-black text-[#0F172A] uppercase tracking-wide">
                                    {selectedResult?.examTitle || "Select Exam"}
                                </span>

                                <ChevronDown
                                    size={22}
                                    className={`text-[#42A5F5] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute w-full mt-3 bg-white border-2 border-[#E2E8F0] rounded-2xl shadow-2xl p-3 z-50"
                                    >
                                        <div className="flex flex-col gap-2">
                                            {publishedResults.length > 0 ? (
                                                publishedResults.map((res) => (
                                                    <button
                                                        key={res._id}
                                                        type="button"
                                                        onClick={() => handleResultSelect(res._id)}
                                                        className={`w-full text-left px-4 py-3 rounded-xl font-black uppercase transition-all
                                    ${selectedResult?._id === res._id
                                                                ? "bg-[#42A5F5] text-white"
                                                                : "bg-white text-[#0F172A] hover:bg-[#EFF6FF]"
                                                            }`}
                                                    >
                                                        {res.examTitle}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="text-center text-sm font-bold text-[#94A3B8] py-3">
                                                    No exams available
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {selectedResult && (
                            <button
                                onClick={() => setViewMode('reportCard')}
                                className="w-full bg-[#42A5F5] text-white py-5 rounded-[2rem] font-black uppercase flex justify-center gap-3"
                            >
                                <BarChart3 size={20} />
                                View Result Card
                            </button>
                        )}
                    </motion.div>
                )}

                {/* VIEW SCREEN */}
                {viewMode === 'reportCard' && selectedResult && (
                    <div className="space-y-6">

                        {/* Simple UI Card */}
                        <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-[#E2E8F0]">
                            <h2 className="text-2xl font-black text-[#42A5F5] text-center uppercase mb-6">
                                Result Summary
                            </h2>

                            <div className="space-y-4">

                                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
                                    <p className="text-[11px] font-black uppercase text-[#64748B] mb-1 tracking-widest">
                                        Student Name
                                    </p>
                                    <p className="text-[16px] font-black text-[#0F172A]">
                                        {studentProfile?.name || "N/A"}
                                    </p>
                                </div>

                                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
                                    <p className="text-[11px] font-black uppercase text-[#64748B] mb-1 tracking-widest">
                                        Enrollment No
                                    </p>
                                    <p className="text-[16px] font-black text-[#0F172A]">
                                        {studentProfile?.enrollmentNo || "N/A"}
                                    </p>
                                </div>

                                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
                                    <p className="text-[11px] font-black uppercase text-[#64748B] mb-1 tracking-widest">
                                        Father Name
                                    </p>
                                    <p className="text-[16px] font-black text-[#0F172A]">
                                        {studentProfile?.fatherName || "N/A"}
                                    </p>
                                </div>

                                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
                                    <p className="text-[11px] font-black uppercase text-[#64748B] mb-1 tracking-widest">
                                        Class
                                    </p>
                                    <p className="text-[16px] font-black text-[#0F172A]">
                                        {studentProfile?.grade || "N/A"}
                                    </p>
                                </div>

                                {/* Rank Card */}
                                <div className="bg-[#DBEAFE] p-5 rounded-2xl border border-[#93C5FD] text-center shadow-md">
                                    <p className="text-[#42A5F5] uppercase text-xs font-black tracking-widest mb-2">
                                        Rank
                                    </p>
                                    <h3 className="text-4xl font-black text-[#1E3A8A]">
                                        #{selectedResult?.rank || "-"}
                                    </h3>
                                </div>

                            </div>
                        </div>

                        <button
                            onClick={generatePDF}
                            disabled={isDownloading}
                            className="w-full bg-[#42A5F5] text-white py-5 rounded-[2rem] font-black uppercase flex justify-center gap-3"
                        >
                            <Download size={20} />
                            Download Result
                        </button>

                        {/* Hidden PDF */}
                        <div className="absolute -left-[9999px] top-0">
                            <div
                                id="report-card-pdf-content"
                                className="w-[750px] bg-white p-8 text-black"
                                style={{
                                    backgroundColor: "#ffffff",
                                    color: "#000000"
                                }}
                            >
                                {/* SCHOOL HEADER */}
                                <div
                                    className="relative flex items-center justify-center pb-5 mb-6"
                                    style={{
                                        borderBottom: "3px solid #42A5F5"
                                    }}
                                >
                                    {/* Left Side Logo */}
                                    {schoolLogo && (
                                        <div
                                            className="absolute left-0 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
                                            style={{
                                                border: "2px solid #42A5F5"
                                            }}
                                        >
                                            <img
                                                src={schoolLogo.startsWith('http') ? schoolLogo : `${BASE_URL}${schoolLogo}`}
                                                alt="School Logo"
                                                className="w-full h-full object-cover"
                                                crossOrigin="anonymous"
                                            />
                                        </div>
                                    )}

                                    {/* Center School Name */}
                                    <h2
                                        className="text-3xl font-black text-center"
                                        style={{ color: "#0F172A" }}
                                    >
                                        {schoolName}
                                    </h2>
                                </div>

                                {/* EXAM TITLE */}
                                <div className="text-center mb-8">
                                    <h1
                                        className="text-2xl font-black"
                                        style={{ color: "#42A5F5" }}
                                    >
                                        {selectedResult?.examTitle
                                            ?.toLowerCase()
                                            .replace(/\b\w/g, (c) => c.toUpperCase())}{" "}
                                        Result Card
                                    </h1>
                                </div>

                                {/* STUDENT DETAILS */}
                                <div className="space-y-3 mb-8 text-[15px] font-bold">

                                    <div className="flex justify-between">
                                        <p>
                                            <strong>Name:</strong> {studentProfile?.name}
                                        </p>
                                        <p>
                                            <strong>Enrollment:</strong> {studentProfile?.enrollmentNo}
                                        </p>
                                    </div>

                                    <div className="flex justify-between">
                                        <p>
                                            <strong>Father:</strong> {studentProfile?.fatherName}
                                        </p>
                                        <p>
                                            <strong>Mother:</strong> {studentProfile?.motherName}
                                        </p>
                                    </div>

                                    <div className="flex justify-between">
                                        <p>
                                            <strong>Class:</strong> {studentProfile?.grade}
                                        </p>
                                        <p>
                                            <strong>Rank:</strong> #{selectedResult?.rank}
                                        </p>
                                    </div>

                                </div>

                                {/* RESULT TABLE */}
                                <table
                                    className="w-full border-collapse mb-8"
                                    style={{
                                        border: "1px solid #000000"
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                backgroundColor: "#42A5F5",
                                                color: "#ffffff"
                                            }}
                                        >
                                            <th className="border p-3">Subject</th>
                                            <th className="border p-3">Status</th>
                                            <th className="border p-3">Marks</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {selectedResult?.myMarks.map((m, i) => (
                                            <tr key={i}>
                                                <td className="border p-3 font-bold">
                                                    {m.subjectName}
                                                </td>
                                                <td className="border p-3">
                                                    {m.status}
                                                </td>
                                                <td className="border p-3">
                                                    {m.status === "Absent"
                                                        ? "0"
                                                        : m.marksObtained}
                                                    /{selectedResult.maxMarks}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* FINAL SUMMARY */}
                                <div
                                    className="p-5 rounded-xl"
                                    style={{
                                        backgroundColor: "#F8FAFC",
                                        border: "1px solid #CBD5E1"
                                    }}
                                >
                                    <div className="flex justify-between font-bold text-[16px]">
                                        <p>
                                            Total Marks: {selectedResult?.totalObtained}/
                                            {selectedResult?.grandTotal}
                                        </p>

                                        <p>
                                            Percentage: {selectedResult?.percentage}%
                                        </p>

                                        <p>
                                            Rank: #{selectedResult?.rank}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentExamResult;
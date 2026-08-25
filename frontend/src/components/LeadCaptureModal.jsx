import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import { X, ChevronDown, Check, Building, User, Users, Mail, Phone, MessageSquare, Target } from "lucide-react";

// --- CUSTOM DROPDOWN COMPONENT (No Native <select>) ---
const CustomDropdown = ({ options, value, onChange, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full z-20">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer bg-slate-50/50 backdrop-blur-sm ${
          isOpen ? "border-[#4A90E2] ring-4 ring-blue-50 bg-white" : "border-blue-100 hover:border-blue-300"
        }`}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className={value ? "text-[#4A90E2]" : "text-slate-400"} />}
          <span className={`text-[15px] font-medium ${value ? "text-slate-800" : "text-slate-400"}`}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#4A90E2]" : ""}`}
        />
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
              className="absolute left-0 right-0 top-[105%] z-50 bg-white border border-blue-50 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((option) => (
                  <div
                    key={option}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-all hover:bg-blue-50 ${
                      value === option ? "bg-blue-50/50 text-[#4A90E2]" : "text-slate-700"
                    }`}
                  >
                    <span className="font-medium text-[15px]">{option}</span>
                    {value === option && <Check size={16} />}
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

// --- MAIN MODAL COMPONENT ---
export default function LeadCaptureModal({ isOpen, onClose, planType }) {
  
  const [formData, setFormData] = useState({
    fullName: "",
    institutionName: "",
    workEmail: "",
    alternateEmail: "",
    phone: "",
    alternatePhone: "",
    role: "",
    studentCount: "",
    biggestChallenge: "",
    jobTitle: "",
    branches: "",
    requirements: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // BASE_URL extraction
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // SCROLL LOCK EFFECT
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const roles = ["Principal", "Director", "Admin/Manager", "IT Head", "Owner"];
  const studentCounts = ["0-300 Students", "301-1500 Students", "1500+ Students"];
  const challenges = ["Fee Collection & Tracking", "Attendance & Timetable", "Parent Communication", "Administrative Overload", "Other"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); // 🔥 Purana error saaf karo
    
    // ==========================================
    // 🔥 THE MASTER VALIDATION LOCK 🔥
    // ==========================================
    if (planType !== "Enterprise") {
      if (!formData.role) {
        setErrorMsg("⚠️ Please select your Role from the dropdown.");
        return; // Ye form ko aage submit hone se rok dega!
      }
      if (planType === "General" && !formData.studentCount) {
        setErrorMsg("⚠️ Please select the Total Students count.");
        return; // Ye form ko aage submit hone se rok dega!
      }
    }
    // ==========================================

    setIsSubmitting(true);
    
    try {
      const payload = { ...formData, planType: planType };

      // Direct axios call bina token ke
      await axios.post(`${BASE_URL}/leads/submit`, payload);
      
      // 🔥 SUCCESS STATE ON 🔥
      setShowSuccess(true);
      
      // 3.5 Seconds baad modal auto-close hoga aur form reset hoga
      setTimeout(() => {
        setFormData({
          fullName: "", institutionName: "", workEmail: "", alternateEmail: "",
          phone: "", alternatePhone: "", role: "", studentCount: "",
          biggestChallenge: "", jobTitle: "", branches: "", requirements: ""
        });
        setShowSuccess(false);
        setErrorMsg(""); // Reset error
        onClose();
      }, 3500);

    } catch (error) {
      console.error("Lead Submission Error:", error);
      setErrorMsg("❌ Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4 py-6 md:p-6">
      
      {/* Blurred Backdrop */}
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 cursor-pointer"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-3xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[95vh]"
      >
        
        {/* Header Area */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 md:p-8 border-b border-blue-100 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm active:scale-90"
          >
            <X size={20} />
          </button>
          
          <div className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-[#4A90E2] font-bold text-xs uppercase tracking-wider mb-3 shadow-sm">
            {planType === "General" ? "Book a Free Demo" : `${planType} Plan Inquiry`}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
            {planType === "Enterprise" ? "Let's build something custom." : "See EduFlowAI in action."}
          </h2>
          <p className="text-slate-500 text-sm md:text-base mt-2 font-medium">
            Fill out the details below and our {planType === "Enterprise" ? "Enterprise team" : "product experts"} will connect with you.
          </p>
        </div>

        {/* Scrollable Form / Success Area */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-white relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {!showSuccess ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                
                {/* 1. Basic Info Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Full Name *</label>
                    <div className="relative flex items-center">
                      <User size={18} className="absolute left-4 text-slate-400" />
                      <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50/50 border border-blue-100 focus:border-[#4A90E2] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-[15px] text-slate-800" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Institution Name *</label>
                    <div className="relative flex items-center">
                      <Building size={18} className="absolute left-4 text-slate-400" />
                      <input type="text" required value={formData.institutionName} onChange={e => setFormData({...formData, institutionName: e.target.value})} className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50/50 border border-blue-100 focus:border-[#4A90E2] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-[15px] text-slate-800" placeholder="Delhi Public School" />
                    </div>
                  </div>
                </div>

                {/* 2. Primary & Alternate Emails Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Primary Email *</label>
                    <div className="relative flex items-center">
                      <Mail size={18} className="absolute left-4 text-slate-400" />
                      <input type="email" required value={formData.workEmail} onChange={e => setFormData({...formData, workEmail: e.target.value})} className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50/50 border border-blue-100 focus:border-[#4A90E2] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-[15px] text-slate-800" placeholder="director@school.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Alternate Email (Required) *</label>
                    <div className="relative flex items-center">
                      <Mail size={18} className="absolute left-4 text-slate-400" />
                      <input type="email" required value={formData.alternateEmail} onChange={e => setFormData({...formData, alternateEmail: e.target.value})} className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50/50 border border-blue-100 focus:border-[#4A90E2] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-[15px] text-slate-800" placeholder="backup@school.com" />
                    </div>
                  </div>
                </div>

                {/* 3. Primary & Alternate Phones Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Primary Phone *</label>
                    <div className="relative flex items-center">
                      <Phone size={18} className="absolute left-4 text-[#4A90E2]" />
                      <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50/50 border border-blue-100 focus:border-[#4A90E2] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-[15px] text-slate-800" placeholder="+91 98765 XXXXX" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Alternate Phone (Required) *</label>
                    <div className="relative flex items-center">
                      <Phone size={18} className="absolute left-4 text-slate-400" />
                      <input type="tel" required value={formData.alternatePhone} onChange={e => setFormData({...formData, alternatePhone: e.target.value})} className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50/50 border border-blue-100 focus:border-[#4A90E2] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-[15px] text-slate-800" placeholder="+91 99999 XXXXX" />
                    </div>
                  </div>
                </div>

                {/* CONDITIONAL FIELDS BASED ON PLAN */}

                {/* General, Starter, Professional get standard Role dropdown */}
                {planType !== "Enterprise" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 z-20">
                      <label className="text-[13px] font-bold text-slate-500 ml-1">Your Role *</label>
                      <CustomDropdown icon={User} placeholder="Select Role" options={roles} value={formData.role} onChange={(val) => setFormData({...formData, role: val})} />
                    </div>

                    {/* Only General asks for Student Count */}
                    {planType === "General" && (
                      <div className="space-y-1.5 z-10">
                        <label className="text-[13px] font-bold text-slate-500 ml-1">Total Students *</label>
                        <CustomDropdown icon={Users} placeholder="Select Size" options={studentCounts} value={formData.studentCount} onChange={(val) => setFormData({...formData, studentCount: val})} />
                      </div>
                    )}

                    {/* Professional asks for Challenge */}
                    {planType === "Professional" && (
                      <div className="space-y-1.5 z-10">
                        <label className="text-[13px] font-bold text-slate-500 ml-1">Biggest Challenge?</label>
                        <CustomDropdown icon={Target} placeholder="Select Challenge" options={challenges} value={formData.biggestChallenge} onChange={(val) => setFormData({...formData, biggestChallenge: val})} />
                      </div>
                    )}
                  </div>
                )}

                {/* Enterprise Specific Fields */}
                {planType === "Enterprise" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-bold text-slate-500 ml-1">Job Title *</label>
                        <input type="text" required value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full px-4 py-4 rounded-2xl bg-slate-50/50 border border-blue-100 focus:border-[#4A90E2] focus:bg-white outline-none transition-all font-medium text-[15px]" placeholder="e.g. Academic Director" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-bold text-slate-500 ml-1">No. of Branches *</label>
                        <input type="number" required value={formData.branches} onChange={e => setFormData({...formData, branches: e.target.value})} className="w-full px-4 py-4 rounded-2xl bg-slate-50/50 border border-blue-100 focus:border-[#4A90E2] focus:bg-white outline-none transition-all font-medium text-[15px]" placeholder="e.g. 5" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-slate-500 ml-1">Custom Requirements</label>
                      <div className="relative">
                        <MessageSquare size={18} className="absolute left-4 top-4 text-slate-400" />
                        <textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50/50 border border-blue-100 focus:border-[#4A90E2] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-[15px] h-28 resize-none text-slate-800" placeholder="Briefly describe your needs..." />
                      </div>
                    </div>
                  </>
                )}

                {/* 🔥 PREMIUM ERROR MESSAGE UI 🔥 */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold text-center"
                    >
                      {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-2 shrink-0">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full text-white py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider shadow-[0_15px_30px_rgba(74,144,226,0.3)] transition-all ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#4A90E2] to-[#2563EB] hover:shadow-[0_20px_40px_rgba(74,144,226,0.4)] hover:-translate-y-1 active:scale-95'}`}
                  >
                    {isSubmitting ? "Submitting..." : (planType === "Enterprise" ? "Request Callback" : "Secure My Demo")}
                  </button>
                </div>
                
              </motion.form>
            ) : (
              
              // 🔥 PREMIUM SUCCESS SCREEN 🔥
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="flex flex-col items-center justify-center text-center py-16"
              >
                <div className="relative mb-8">
                  {/* Glowing Background */}
                  <div className="absolute inset-0 bg-emerald-400 blur-[30px] opacity-40 rounded-full animate-pulse"></div>
                  {/* Icon Container */}
                  <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <Check size={50} className="text-white" />
                  </div>
                </div>
                {/* <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-3 italic">Welcome! 🎉</h3> */}
                <p className="text-slate-500 font-bold text-[16px] max-w-sm leading-relaxed">
                  Thank you, <span className="text-[#4A90E2]">{formData.fullName.split(' ')[0]}</span>! Your request for the <span className="text-[#4A90E2]">{planType}</span> plan has been confirmed. Our team will contact you shortly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
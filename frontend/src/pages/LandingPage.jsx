
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Bot, Users, GraduationCap, School,
  CheckCircle, ChevronDown, Star, BarChart3,
  CreditCard, MessageSquare, Calendar, Shield
} from "lucide-react";

const stats = [
  { value: 80, suffix: "%", label: "Less Administrative Work" },
  { value: 3, suffix: "x", label: "Faster Parent Communication" },
  { value: 60, suffix: "%", label: "Fewer Manual Tasks" },
  { value: 24, suffix: "/7", label: "AI Assistance" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(0);

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur border-b z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="font-black text-2xl text-[#4A90E2]">EduFlowAI</h1>
          <div className="hidden md:flex gap-8">
            <a href="#platform">Platform</a>
            <a href="#ai">AI</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="bg-[#4A90E2] text-white px-5 py-2 rounded-xl"
          >
            Book Demo
          </button>
        </div>
      </nav>

      <section className="pt-40 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex px-4 py-2 rounded-full bg-blue-100 text-[#4A90E2] font-semibold">
            AI-Powered Education Operating System
          </div>

          <h1 className="text-5xl md:text-7xl font-black mt-8 leading-tight">
            Run Your Entire Institution
            <span className="text-[#4A90E2]"> On One AI Platform</span>
          </h1>

          <p className="max-w-3xl mx-auto mt-8 text-xl text-slate-600">
            Manage admissions, fees, attendance, academics, communication,
            administration and AI assistants from one intelligent system.
          </p>

          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <button className="bg-[#4A90E2] text-white px-8 py-4 rounded-2xl flex items-center gap-2">
              Book Demo <ArrowRight size={18} />
            </button>
            <button className="border px-8 py-4 rounded-2xl bg-white">
              Watch Product Tour
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-sm">
              <h3 className="text-4xl font-black text-[#4A90E2]">
                {s.value}{s.suffix}
              </h3>
              <p className="mt-2 text-slate-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-black">
            Running a School Shouldn't Feel Like Managing 10 Systems
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {[
              "Student Records Scattered",
              "Parent Calls All Day",
              "Manual Reporting",
              "Fee Tracking Issues",
              "Administrative Overload",
              "Disconnected Workflows",
            ].map((item) => (
              <div key={item} className="p-8 rounded-3xl bg-slate-50 border">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ai" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-5xl font-black mb-14">
            Meet Your Institution's AI Workforce
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              ["AI Parent Assistant", "Answers parent queries 24/7", Bot],
              ["AI Student Assistant", "Academic support instantly", GraduationCap],
              ["AI Teacher Assistant", "Lesson and report automation", School],
              ["AI Admin Assistant", "Institution insights and reports", BarChart3],
              ["AI Admission Assistant", "Convert leads into enrollments", Users],
              ["AI Analytics Engine", "Predict trends and risks", Shield],
            ].map(([title, desc, Icon], i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm">
                <Icon className="text-[#4A90E2]" size={32} />
                <h3 className="font-bold text-xl mt-4">{title}</h3>
                <p className="text-slate-600 mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-5xl font-black mb-14">
            Everything Your Institution Needs
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              ["Attendance", CheckCircle],
              ["Fee Management", CreditCard],
              ["Communication", MessageSquare],
              ["Admissions", Users],
              ["Academic Reporting", BarChart3],
              ["Scheduling", Calendar],
            ].map(([title, Icon], i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-3xl border">
                <Icon className="text-[#4A90E2]" />
                <h3 className="font-bold mt-4">{title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-5xl font-black mb-14">
            Trusted By Educational Leaders
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[1,2,3].map((i)=>(
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm">
                <div className="flex mb-4">
                  {[1,2,3,4,5].map(x => <Star key={x} size={18} fill="currentColor" />)}
                </div>
                <p>"EduFlowAI transformed our operations and reduced admin workload dramatically."</p>
                <div className="mt-4 font-bold">Principal</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-5xl font-black mb-14">Pricing</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {["Starter","Growth","Enterprise"].map((plan,i)=>(
              <div key={i} className="rounded-3xl border p-8 bg-white">
                <h3 className="text-2xl font-bold">{plan}</h3>
                <div className="text-5xl font-black my-6">
                  {i===2 ? "Custom" : `₹${(i+1)*4999}`}
                </div>
                <button className="w-full bg-[#4A90E2] text-white py-3 rounded-xl">
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-5xl font-black mb-14">FAQ</h2>

          {[
            "How long does implementation take?",
            "Can we customize workflows?",
            "Is student data secure?",
            "Do you provide onboarding support?",
          ].map((q, i) => (
            <div key={i} className="mb-4 bg-white rounded-2xl border overflow-hidden">
              <button
                className="w-full p-6 flex justify-between items-center"
                onClick={() => setOpenFAQ(i)}
              >
                {q}
                <ChevronDown />
              </button>

              {openFAQ === i && (
                <div className="px-6 pb-6 text-slate-600">
                  EduFlowAI provides enterprise-grade support, security and onboarding.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto bg-[#4A90E2] text-white rounded-[40px] p-16 text-center">
          <h2 className="text-5xl font-black">
            Stop Managing Systems. Start Running an Institution.
          </h2>
          <p className="mt-6 text-xl opacity-90">
            Join forward-thinking institutions using AI to simplify operations.
          </p>
          <button className="mt-10 bg-white text-[#4A90E2] px-8 py-4 rounded-2xl font-bold">
            Book Personalized Demo
          </button>
        </div>
      </section>

      <footer className="border-t bg-white py-10 text-center text-slate-500">
        © 2026 EduFlowAI. All rights reserved.
      </footer>
    </div>
  );
}
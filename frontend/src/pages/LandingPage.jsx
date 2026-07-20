
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Countup from "react-countup";
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
  const [openFAQ, setOpenFAQ] = useState(null);
  const [activeSection, setActiveSection] = useState("");

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const sections = ["platform", "ai", "pricing", "faq"];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;

      sections.forEach((section) => {
        const element = document.getElementById(section);

        if (
          element &&
          scrollPosition >= element.offsetTop &&
          scrollPosition < element.offsetTop + element.offsetHeight
        ) {
          setActiveSection(section);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const testimonials = [
    {
      quote:
        "EduFlowAI transformed our operations and reduced administrative workload significantly.",
      role: "Principal",
      school: "Nvs Public School",
    },
    {
      quote:
        "Parent communication and attendance management became much faster and more organized.",
      role: "Director",
      school: "Sri Chaitanya School",
    },
    {
      quote:
        "The AI features helped our staff save hours every week on repetitive tasks.",
      role: "Administrator",
      school: "Apollo International School",
    },
  ];

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen relative overflow-x-hidden">

      {/* PREMIUM BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-[180px]" />

        <div className="absolute top-[40%] right-10 w-[500px] h-[500px] bg-cyan-400/30 rounded-full blur-[180px]" />

        <div className="absolute bottom-0 left-[30%] w-[500px] h-[500px] bg-purple-400/30 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10">
        <nav className="
fixed top-0 w-full z-50
bg-white/70
backdrop-blur-xl
border-b border-white/30
shadow-[0_8px_30px_rgba(0,0,0,0.04)]
">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png.jpeg"
                alt="EduFlowAI"
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shadow-lg"
              />

              <h1 className="
    font-black text-2xl
    bg-gradient-to-r
    from-[#4A90E2]
    via-[#3B82F6]
    to-[#2563EB]
    bg-clip-text
    text-transparent
  ">
                EduFlowAI
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => scrollToSection("platform")}
                className={`
    px-4 py-2 rounded-xl
    backdrop-blur-md
    font-medium
    transition-all duration-300
    hover:bg-blue-50
    hover:border-[#4A90E2]
    hover:text-[#4A90E2]
    hover:-translate-y-1
    hover:shadow-[0_8px_20px_rgba(74,144,226,0.15)]
    ${activeSection === "platform"
                    ? "bg-blue-100 text-[#4A90E2] border border-[#4A90E2]"
                    : "bg-white/70 border border-blue-100 text-slate-700"
                  }
`}
              >
                Platform
              </button>

              <button
                onClick={() => scrollToSection("ai")}
                className={`
    px-4 py-2 rounded-xl
    backdrop-blur-md
    font-medium
    transition-all duration-300
    hover:bg-blue-50
    hover:border-[#4A90E2]
    hover:text-[#4A90E2]
    hover:-translate-y-1
    hover:shadow-[0_8px_20px_rgba(74,144,226,0.15)]
    ${activeSection === "ai"
                    ? "bg-blue-100 text-[#4A90E2] border border-[#4A90E2]"
                    : "bg-white/70 border border-blue-100 text-slate-700"
                  }
`}
              >
                AI
              </button>

              <button
                onClick={() => scrollToSection("pricing")}
                className={`
    px-4 py-2 rounded-xl
    backdrop-blur-md
    font-medium
    transition-all duration-300
    hover:bg-blue-50
    hover:border-[#4A90E2]
    hover:text-[#4A90E2]
    hover:-translate-y-1
    hover:shadow-[0_8px_20px_rgba(74,144,226,0.15)]
    ${activeSection === "pricing"
                    ? "bg-blue-100 text-[#4A90E2] border border-[#4A90E2]"
                    : "bg-white/70 border border-blue-100 text-slate-700"
                  }
`}
              >
                Pricing
              </button>

              <button
                onClick={() => scrollToSection("faq")}
                className={`
    px-4 py-2 rounded-xl
    backdrop-blur-md
    font-medium
    transition-all duration-300
    hover:bg-blue-50
    hover:border-[#4A90E2]
    hover:text-[#4A90E2]
    hover:-translate-y-1
    hover:shadow-[0_8px_20px_rgba(74,144,226,0.15)]
    ${activeSection === "faq"
                    ? "bg-blue-100 text-[#4A90E2] border border-[#4A90E2]"
                    : "bg-white/70 border border-blue-100 text-slate-700"
                  }
`}
              >
                FAQ
              </button>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="
bg-gradient-to-r
from-[#4A90E2]
to-[#2563EB]
text-white
px-5 py-2
rounded-xl
font-semibold
transition-all duration-300
hover:scale-105
hover:shadow-[0_15px_35px_rgba(74,144,226,0.35)]
"
            >
              Lou7ggu7gb
            </button>
          </div>
        </nav>

        <section className="bg-transparent pt-40 pb-24 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div
              className="
  inline-flex px-5 py-2 rounded-full
  bg-white/70 backdrop-blur-md
  border border-blue-100
  text-[#4A90E2]
  font-semibold
  shadow-lg
"
            >
              AI-Powered Education Operating System
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-black mt-8 leading-tight"
            >
              The AI Operating System
              <br />

              <span className="bg-gradient-to-r from-[#4A90E2] via-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent">
                For Modern Schools & Colleges
              </span>
            </motion.h1>

            <p className="max-w-4xl mx-auto mt-8 text-xl md:text-2xl text-slate-600 leading-relaxed">
              Admissions, Attendance, Fees, Academics,
              Communication & AI Assistants —
              all from one platform.
            </p>

            <div className="mt-10 flex justify-center gap-4 flex-wrap">
              <button
                className="bg-[#4A90E2] text-white px-8 py-4 rounded-2xl flex items-center gap-2
             font-bold transition-all duration-300
             hover:bg-[#357ABD]
             hover:shadow-[0_15px_35px_rgba(74,144,226,0.35)]
             hover:-translate-y-1 hover:scale-[1.03]
             active:scale-95"
              >
                Book Demo

                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
              <button
                className="border border-blue-100 px-8 py-4 rounded-2xl bg-white
             transition-all duration-300
             hover:bg-blue-50 hover:border-[#4A90E2]
             hover:text-[#4A90E2]
             hover:shadow-[0_10px_25px_rgba(74,144,226,0.15)]
             hover:-translate-y-1
             active:scale-95"
              >
                Watch Product Tour
              </button>
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-slate-500 text-sm">
          <span>✓ Secure Cloud Platform</span>
          <span>✓ 24/7 AI Support</span>
          <span>✓ School & College Ready</span>
        </div>

        <div className="mt-20 relative">
          <motion.img
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            whileHover={{
              y: -10,
              scale: 1.01
            }}
            src="/dashboar.png.png"
            alt="EduFlowAI Dashboard"
            className="
      mx-auto
      rounded-[30px]
      border border-slate-200
      shadow-[0_30px_80px_rgba(0,0,0,0.15)]
      transition-all
    "
          />
        </div>

        <div
          className="
  absolute inset-0
  bg-blue-400/20
  blur-[120px]
  -z-10
"
        />
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">

            <h2 className="text-center text-5xl font-black mb-4">
              How EduFlowAI Works
            </h2>

            <p className="text-center text-slate-600 mb-16">
              From setup to automation in just a few simple steps.
            </p>

            <div className="grid md:grid-cols-4 gap-6">

              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl border border-blue-100 text-center shadow-sm hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-[#4A90E2] flex items-center justify-center font-black text-2xl">
                  1
                </div>

                <h3 className="font-bold text-xl mt-6">
                  Setup Institution
                </h3>

                <p className="text-slate-600 mt-3">
                  Configure classes, staff, subjects and academic structure.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl border border-blue-100 text-center shadow-sm hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-[#4A90E2] flex items-center justify-center font-black text-2xl">
                  2
                </div>

                <h3 className="font-bold text-xl mt-6">
                  Manage Students
                </h3>

                <p className="text-slate-600 mt-3">
                  Admissions, attendance, fees and academics from one dashboard.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl border border-blue-100 text-center shadow-sm hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-[#4A90E2] flex items-center justify-center font-black text-2xl">
                  3
                </div>

                <h3 className="font-bold text-xl mt-6">
                  AI Automates Tasks
                </h3>

                <p className="text-slate-600 mt-3">
                  AI assistants handle communication, reporting and support.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl border border-blue-100 text-center shadow-sm hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-[#4A90E2] flex items-center justify-center font-black text-2xl">
                  4
                </div>

                <h3 className="font-bold text-xl mt-6">
                  Generate Insights
                </h3>

                <p className="text-slate-600 mt-3">
                  Get reports, analytics and actionable recommendations instantly.
                </p>
              </div>

            </div>

          </div>
        </section>
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.15
                }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100
  hover:-translate-y-2
  hover:shadow-[0_15px_40px_rgba(74,144,226,0.2)]
  transition-all duration-300"
              >
                <motion.h3
                  initial={{ scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.15
                  }}
                  className="text-4xl font-black text-[#4A90E2]"
                >
                  {s.value}
                  {s.suffix}
                </motion.h3>

                <p className="mt-2 text-slate-600 font-medium">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="bg-white/70 backdrop-blur-sm py-24 px-6">
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
                <div
                  key={item}
                  className="p-8 rounded-3xl bg-slate-50 border border-blue-100 text-[#4A90E2] font-bold
             transition-all duration-300 cursor-pointer
             hover:bg-blue-50 hover:border-[#4A90E2]
             hover:shadow-[0_10px_30px_rgba(74,144,226,0.25)]
             hover:-translate-y-2"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="bg-white/70 backdrop-blur-sm py-24 px-6">
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
                <div
                  key={i}
                  className="bg-slate-50 p-8 rounded-3xl border border-blue-100
             transition-all duration-300 cursor-pointer group
             hover:bg-blue-50 hover:border-[#4A90E2]
             hover:shadow-[0_15px_40px_rgba(74,144,226,0.25)]
             hover:-translate-y-2 hover:scale-[1.02]"
                >
                  <Icon
                    className="text-[#4A90E2] group-hover:scale-125 transition-transform duration-300"
                  />

                  <h3 className="font-bold mt-4 text-slate-800 group-hover:text-[#4A90E2] transition-colors duration-300">
                    {title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="ai" className="bg-white/70 backdrop-blur-sm py-24 px-6">
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
                <div
                  key={i}
                  className="bg-white p-8 rounded-3xl border border-blue-100
             shadow-sm transition-all duration-300
             hover:-translate-y-3 hover:scale-[1.02]
             hover:shadow-[0_15px_40px_rgba(74,144,226,0.25)]
             hover:border-[#4A90E2] group cursor-pointer"
                >
                  <Icon
                    className="text-[#4A90E2] group-hover:scale-125 transition-transform duration-300"
                    size={32}
                  />
                  <h3 className="font-bold text-xl mt-4 text-slate-800 group-hover:text-[#4A90E2] transition-colors duration-300">
                    {title}
                  </h3>
                  <p className="text-slate-600 mt-2 group-hover:text-slate-700 transition-colors duration-300">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white/70 backdrop-blur-sm py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center text-5xl font-black mb-14">
              Trusted By Educational Leaders
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((item, i) => (
                <div
                  key={i}
                  className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl
  border border-blue-100
  hover:-translate-y-2
  hover:shadow-[0_20px_50px_rgba(74,144,226,0.15)]
  transition-all duration-300"
                >
                  <div className="flex mb-4 text-amber-400">
                    {[1, 2, 3, 4, 5].map((x) => (
                      <Star
                        key={x}
                        size={18}
                        fill="currentColor"
                        className="text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    "{item.quote}"
                  </p>
                  <div className="mt-6">
                    <div className="font-bold text-slate-800">
                      {item.role}
                    </div>

                    <div className="text-sm text-slate-500">
                      {item.school}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white/70 backdrop-blur-sm py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center text-5xl font-black mb-14">Pricing</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {["Starter", "Growth", "Enterprise"].map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-3xl border p-8 bg-white transition-all duration-300
  ${i === 1
                      ? "border-[#4A90E2] scale-105 shadow-[0_20px_50px_rgba(74,144,226,0.25)]"
                      : "border-slate-200 hover:-translate-y-2 hover:shadow-xl"
                    }`}
                >
                  {i === 1 && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-[#4A90E2] rounded-full text-xs font-bold mb-4">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className="text-2xl font-bold">{plan}</h3>

                  <div className="text-5xl font-black my-6">
                    {i === 2 ? "Custom" : `₹${(i + 1) * 4999}`}
                  </div>

                  <div className="text-slate-500 mb-4">
                    Per Month
                  </div>

                  <ul className="space-y-3 mb-8 text-slate-600">
                    <li>✓ Attendance Management</li>
                    <li>✓ Fee Management</li>
                    <li>✓ Parent Communication</li>
                    <li>✓ Academic Reports</li>

                    {i >= 1 && (
                      <>
                        <li>✓ AI Assistant</li>
                        <li>✓ Advanced Analytics</li>
                      </>
                    )}

                    {i === 2 && (
                      <>
                        <li>✓ Custom Integrations</li>
                        <li>✓ Dedicated Support</li>
                      </>
                    )}
                  </ul>

                  <button className="w-full bg-[#4A90E2] text-white py-3 rounded-xl">
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-white/70 backdrop-blur-sm py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center text-5xl font-black mb-14">FAQ</h2>

            {[
              "How long does implementation take?",
              "Can we customize workflows?",
              "Is student data secure?",
              "Do you provide onboarding support?",
            ].map((q, i) => (
              <div
                key={i}
                className={`
    mb-5 rounded-3xl overflow-hidden
    border transition-all duration-300
    bg-white/90 backdrop-blur-sm
    ${openFAQ === i
                    ? "border-[#4A90E2] shadow-[0_15px_40px_rgba(74,144,226,0.18)]"
                    : "border-blue-100 hover:border-[#4A90E2] hover:shadow-[0_10px_25px_rgba(74,144,226,0.12)]"
                  }
  `}
              >
                <button
                  className="
    w-full px-6 py-5
    flex justify-between items-center
    text-left font-semibold text-lg
    transition-all duration-300
  "
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                >
                  {q}
                  <ChevronDown
                    className={`
    transition-transform duration-300
    ${openFAQ === i ? "rotate-180 text-[#4A90E2]" : ""}
  `}
                  />
                </button>

                <div
                  className={`
    grid transition-all duration-300 ease-in-out
    ${openFAQ === i
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                    }
  `}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                      EduFlowAI provides enterprise-grade support, security and onboarding.
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/70 backdrop-blur-sm py-17 px-6">
          <div
            className="max-w-6xl mx-auto bg-[#4A90E2] text-white rounded-[40px] p-16 text-center
  shadow-[0_25px_80px_rgba(74,144,226,0.35)]
"
          >
            <h2 className="text-5xl font-black">
              Stop Managing Systems. Start Running an Institution.
            </h2>
            <p className="mt-6 text-xl opacity-90">
              Join forward-thinking institutions using AI to simplify operations.
            </p>
            <button className="mt-10 bg-white text-[#4A90E2] px-8 py-4 rounded-2xl font-bold">
              Book Personalized Demo
            </button>

            <p className="mt-4 text-sm opacity-80">
              Implementation support included • No setup fee
            </p>
          </div>
        </section>

        <footer className="bg-white/70 backdrop-blur-sm py-18 px-6">
          <div className="max-w-6xl mx-auto text-center">

            <h3 className="font-black text-2xl bg-gradient-to-r from-[#4A90E2] to-[#2563EB] bg-clip-text text-transparent">
              EduFlowAI
            </h3>

            <p className="text-slate-500 mt-2">
              AI-Powered Education Operating System
            </p>

            <div className="flex justify-center gap-8 mt-6 text-slate-600 font-medium">
              <a
                href="#"
                className="hover:text-[#4A90E2] transition-colors duration-300"
              >
                Privacy
              </a>

              <a
                href="#"
                className="hover:text-[#4A90E2] transition-colors duration-300"
              >
                Terms
              </a>

              <a
                href="#"
                className="hover:text-[#4A90E2] transition-colors duration-300"
              >
                Contact
              </a>
            </div>

            <p className="text-slate-400 text-sm mt-6">
              © 2026 EduFlowAI. All rights reserved.
            </p>

          </div>
        </footer>

      </div>
    </div>
  );
}
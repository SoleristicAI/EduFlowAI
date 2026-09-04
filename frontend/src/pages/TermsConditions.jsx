import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A90E2] font-semibold hover:underline mb-8">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        
        <h1 className="text-4xl font-black text-slate-900 mb-2">Terms & Conditions</h1>
        <p className="text-slate-500 font-medium mb-8">Effective Date: 23 July 2026</p>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p>Welcome to EduFlowAI, a cloud-based Education Management System (EMS) developed and operated by SoleristicAI (“Company”, “we”, “our”, or “us”).</p>
          <p>EduFlowAI provides digital management solutions for educational institutions, including schools, colleges, universities, coaching institutes, training centers, and other educational organizations.</p>
          <p>These Terms & Conditions (“Terms”) govern your access to and use of EduFlowAI through our website, web application, and mobile applications.</p>
          <p>By accessing or using EduFlowAI, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not use EduFlowAI.</p>

          <hr className="my-8 border-slate-200" />

          <h2 className="text-xl font-bold text-slate-900 mt-8">1. Definitions</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Company:</strong> means SoleristicAI.</li>
            <li><strong>EduFlowAI:</strong> means the Education Management System developed and operated by SoleristicAI.</li>
            <li><strong>Institution:</strong> means any school, college, university, coaching institute, academy, training center, or other educational organization using EduFlowAI.</li>
            <li><strong>User:</strong> means any authorized administrator, principal, faculty member, teacher, staff member, student, parent, guardian, or any other person granted access by an Institution.</li>
            <li><strong>Services:</strong> means all software, websites, mobile applications, APIs, dashboards, AI features, communication tools, and related services provided through EduFlowAI.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8">2. Eligibility</h2>
          <p>EduFlowAI may only be used by registered educational institutions, authorized users approved by an Institution, and individuals legally permitted to enter into binding agreements. Users must provide accurate and complete information while creating or using accounts.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">3. Services</h2>
          <p>EduFlowAI may include, but is not limited to: Student Information Management, Admissions Management, Attendance Management, Fee Management, Timetable Management, Homework & Assignments, Examination & Results, Parent Communication, Notifications, Staff Management, Library Management, Transport Management, AI-powered features, Reports & Analytics, Mobile Applications, Web Dashboard, and Future software modules introduced by SoleristicAI. We reserve the right to add, modify, suspend, or discontinue any feature without prior notice.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">4. User Accounts</h2>
          <p>Each Institution is responsible for managing its own users. Users agree to keep login credentials confidential, use strong passwords, not share accounts, and notify the Institution or SoleristicAI immediately if unauthorized access is suspected. The Company shall not be responsible for losses resulting from compromised credentials caused by user negligence.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">5. Subscription & Payment</h2>
          <p>Certain features require a paid subscription. Institutions agree to pay setup fees where applicable, pay recurring subscription fees on time, maintain valid billing information, and comply with agreed pricing plans. Failure to make payments may result in suspension or termination of services.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">6. Pricing Changes</h2>
          <p>SoleristicAI reserves the right to modify pricing, subscription plans, and service offerings. Price changes shall not affect existing subscriptions until the next renewal period unless otherwise agreed.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">7. Free Trials & 8. Refund Policy</h2>
          <p>If offered, free trials are available for a limited duration, may have limited functionality, and do not guarantee future availability. Unless otherwise agreed in writing, setup fees are non-refundable once onboarding has commenced, and subscription fees are generally non-refundable. Refunds, if approved, shall be at the sole discretion of SoleristicAI.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">9. Data Ownership & 10. Data Backup</h2>
          <p>All educational data uploaded into EduFlowAI remains the exclusive property of the respective Institution. SoleristicAI does not claim ownership of Institution data. We perform reasonable backups of system data; however, Institutions are encouraged to maintain independent backups. SoleristicAI does not guarantee recovery from every possible data loss event.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">11. Acceptable Use</h2>
          <p>Users agree not to violate applicable laws, upload illegal or harmful content, attempt unauthorized access, reverse engineer the software, copy or reproduce EduFlowAI, interfere with platform security, introduce malware, abuse system resources, impersonate another user, or use EduFlowAI for unlawful purposes. Violation may result in immediate suspension or termination.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">12. Intellectual Property</h2>
          <p>EduFlowAI and all associated intellectual property remain the exclusive property of SoleristicAI. Nothing in these Terms transfers ownership of any intellectual property to users or Institutions.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">13. Artificial Intelligence Features</h2>
          <p>Certain EduFlowAI features may use artificial intelligence. AI-generated outputs are provided to assist users, may contain inaccuracies, and should be reviewed before making important academic or administrative decisions. Users remain responsible for all decisions made using AI-generated content.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">14. Third-Party Services & 15. Availability</h2>
          <p>EduFlowAI may integrate with third-party providers (WhatsApp, Payment gateways, etc.). These services operate under their own terms. We strive to provide reliable service but do not guarantee uninterrupted or error-free availability due to maintenance, internet failures, or events beyond our reasonable control.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">16. Privacy</h2>
          <p>Your use of EduFlowAI is governed by our Privacy Policy. By using EduFlowAI, you consent to the collection and processing of information as described in the Privacy Policy.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">17. Limitation of Liability & 18. Indemnification</h2>
          <p>To the fullest extent permitted by applicable law, SoleristicAI shall not be liable for indirect, incidental, or consequential damages. Our total liability shall not exceed the subscription fees actually paid by the Institution during the preceding twelve (12) months. The Institution agrees to indemnify and hold harmless SoleristicAI from claims arising from misuse, violation of Terms, or unauthorized activities.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">19. Suspension, Termination & 20. Changes</h2>
          <p>We may suspend or terminate access for unpaid fees, violations, or fraudulent activity. SoleristicAI may update features, pricing, policies, and Terms at any time. Continued use constitutes acceptance.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">21. Governing Law & Dispute Resolution</h2>
          <p>These Terms shall be governed by the laws of the Republic of India. Disputes shall first be attempted to be resolved through good-faith negotiations, failing which they shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be Haryana, India. Subject to applicable law, the courts located in Haryana, India, shall have exclusive jurisdiction.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">22. Force Majeure, 23. Severability & 24. Entire Agreement</h2>
          <p>SoleristicAI shall not be liable for delays resulting from circumstances beyond its reasonable control (Force Majeure). If any provision is invalid, the rest remain in effect. These Terms, our Privacy Policy, and any signed MSA constitute the entire agreement.</p>

          <h2 className="text-xl font-bold text-slate-900 mt-8">25. Contact Information</h2>
          <div className="bg-slate-100 p-4 rounded-xl mt-4">
            <p className="font-bold text-slate-800">SoleristicAI</p>
            <p>Product: EduFlowAI</p>
            <p>Email: soleristicai@gmail.com</p>
            <p>Website: <a href="https://eduflowai.uk" className="text-[#4A90E2] hover:underline">https://eduflowai.uk</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
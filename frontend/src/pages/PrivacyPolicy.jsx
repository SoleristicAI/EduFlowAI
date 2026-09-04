import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A90E2] font-semibold hover:underline mb-8">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        
        <h1 className="text-4xl font-black text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 font-medium mb-8">Effective Date: 23 July 2026</p>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p>Welcome to EduFlowAI, a cloud-based Education Management System (EMS) developed and operated by SoleristicAI (“Company”, “we”, “our”, or “us”).</p>
          <p>EduFlowAI provides digital management solutions for educational institutions, including schools, colleges, universities, coaching institutes, training centers, and other educational organizations.</p>
          <p>This Privacy Policy explains how we collect, use, store, disclose, and protect information when educational institutions, administrators, faculty members, staff, students, parents, guardians, and other authorized users access EduFlowAI through our website, web application, and mobile applications.</p>
          <p>By accessing or using EduFlowAI, you acknowledge that you have read and understood this Privacy Policy.</p>

          <hr className="my-8 border-slate-200" />

          <h2 className="text-2xl font-bold text-slate-900 mt-8">1. Information We Collect</h2>
          <p>We may collect and process the following categories of information.</p>

          <h3 className="text-lg font-bold text-slate-800 mt-4">A. Educational Institution Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Institution name & address</li>
            <li>Contact details & Administrator information</li>
            <li>Subscription & Billing information</li>
            <li>Institution branding assets</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-4">B. Student Information</h3>
          <p>Depending on the institution’s requirements, we may collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Student name, Admission/registration number, Roll number</li>
            <li>Date of birth, Gender, Class, section, course or semester</li>
            <li>Attendance, Academic, and Examination records</li>
            <li>Fee, Transport, Hostel, and Library records</li>
            <li>Identity documents uploaded by the institution (where applicable)</li>
            <li>Parent or guardian information</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-4">C. Parent / Guardian Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name, Mobile number, Email address</li>
            <li>Relationship with student, Address, Communication preferences</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-4">D. Faculty & Staff Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Employee ID, Name, Contact information</li>
            <li>Department, Designation, Attendance</li>
            <li>Payroll-related references (if enabled)</li>
            <li>Roles and permissions, Login activity</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-4">E. User Account Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Username, Email address, Mobile number</li>
            <li>Encrypted password, Login history, Authentication information</li>
          </ul>
          <p className="italic text-sm text-slate-500">Passwords are stored using industry-standard encryption and are never stored in plain text.</p>

          <h3 className="text-lg font-bold text-slate-800 mt-4">F. Device & Technical Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>IP address, Browser type, Operating system</li>
            <li>Device information, App version, Crash reports</li>
            <li>Log files, Usage analytics, Session information</li>
          </ul>

          <hr className="my-8 border-slate-200" />

          <h2 className="text-2xl font-bold text-slate-900 mt-8">2. How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide EduFlowAI services & manage educational institution operations</li>
            <li>Manage admissions, attendance, academic records, and fee collection</li>
            <li>Process examination results & generate reports</li>
            <li>Send notifications & enable communication</li>
            <li>Improve product functionality & maintain platform security</li>
            <li>Detect fraud or misuse & provide customer support</li>
            <li>Comply with applicable laws</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">3. Legal Basis for Processing</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>With the authorization of the educational institution</li>
            <li>To perform contractual obligations & comply with legal obligations</li>
            <li>To protect legitimate business interests</li>
            <li>Based on user consent where required by law</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">4. Data Security</h2>
          <p>Protecting user information is a priority. We implement reasonable administrative, technical, and organizational safeguards including secure authentication, encrypted passwords, HTTPS encryption, secure cloud infrastructure, role-based access control, regular system updates, backup procedures, activity monitoring, and security logging. Despite our efforts, no electronic system can guarantee absolute security.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">5. Data Sharing</h2>
          <p>We do not sell personal information. Information may be shared only:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With the respective educational institution & authorized users</li>
            <li>With trusted third-party service providers supporting EduFlowAI</li>
            <li>With payment processors & cloud infrastructure providers</li>
            <li>When required by law, regulation, court order, or government authority</li>
            <li>To protect the rights, safety, or property of SoleristicAI or its users</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">6. Third-Party Services</h2>
          <p>EduFlowAI may integrate with third-party services including cloud hosting providers, email delivery providers, SMS providers, WhatsApp Business APIs, push notification services, payment gateways, analytics providers, and customer support tools. Each third-party service operates under its own privacy practices.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">7. Cookies & Similar Technologies</h2>
          <p>Our website and applications may use cookies and similar technologies to maintain secure sessions, improve user experience, remember preferences, analyze platform usage, and improve performance. Users may disable cookies through browser settings, although certain features may not function properly.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">8. Data Retention</h2>
          <p>We retain information only for as long as necessary to provide services, fulfill contractual obligations, comply with applicable laws, resolve disputes, and enforce legal agreements. Educational institutions may request deletion of their information after account termination, subject to legal, contractual, and regulatory obligations.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">9. Data Ownership</h2>
          <p>All educational records and institutional information stored within EduFlowAI remain the property of the respective educational institution. SoleristicAI does not claim ownership of any institutional, student, faculty, staff, or administrative data uploaded by customers. We process such information solely to provide and improve EduFlowAI services.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">10. User Rights</h2>
          <p>Depending on applicable law, users may have the right to access personal information, correct inaccurate information, request deletion, request restriction of processing, request data portability, withdraw consent where applicable, and lodge complaints with relevant authorities. Requests should generally be submitted through the respective educational institution or by contacting us.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">11. Children’s Privacy</h2>
          <p>EduFlowAI is intended for use by educational institutions. Where EduFlowAI processes information relating to minors, such processing is carried out under the authority of the respective educational institution and, where required by applicable law, with appropriate parental or guardian consent. For adult students, personal information is processed in accordance with this Privacy Policy and applicable laws.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">12. Account Security</h2>
          <p>Users are responsible for maintaining the confidentiality of their account credentials. Users should not share passwords with others. Any suspected unauthorized access should be reported immediately.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">13. International Data Transfers</h2>
          <p>Where data is transferred or processed outside the user’s country, SoleristicAI will implement appropriate safeguards consistent with applicable data protection laws.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">14. Service Availability</h2>
          <p>We strive to provide reliable and uninterrupted services. However, scheduled maintenance, software updates, technical issues, internet outages, or circumstances beyond our reasonable control may occasionally affect service availability. SoleristicAI shall not be liable for temporary interruptions reasonably necessary for maintenance or security.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">15. Changes to this Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. The latest version will always be available on our website and applications. Continued use of EduFlowAI after updates constitutes acceptance of the revised Privacy Policy.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8">16. Contact Us</h2>
          <p>If you have questions regarding this Privacy Policy or our privacy practices, please contact us:</p>
          <div className="bg-slate-100 p-4 rounded-xl mt-4">
            <p className="font-bold text-slate-800">SoleristicAI</p>
            <p>Product: EduFlowAI</p>
            <p>Email: soleristicai@gmail.com</p>
            <p>Website: <a href="https://eduflowai.uk" className="text-[#4A90E2] hover:underline">https://eduflowai.uk</a></p>
          </div>

          <p className="italic text-sm text-slate-500 mt-8">Disclaimer: This Privacy Policy is intended as a general business privacy policy. It is not legal advice. Before onboarding enterprise customers or expanding internationally, consider having your legal documents reviewed by a qualified lawyer to ensure compliance with applicable laws such as India’s Digital Personal Data Protection Act (DPDP Act), GDPR (if serving EU users), or other relevant regulations.</p>
        </div>
      </div>
    </div>
  );
}
import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/auth_provider.dart';
import 'forgot_password_modal.dart';

const String _privacyPolicyContent = '''
Effective Date: 23 July 2026

Welcome to EduFlowAI, a cloud-based Education Management System (EMS) developed and operated by SoleristicAI (“Company”, “we”, “our”, or “us”).

EduFlowAI provides digital management solutions for educational institutions, including schools, colleges, universities, coaching institutes, training centers, and other educational organizations.

This Privacy Policy explains how we collect, use, store, disclose, and protect information when educational institutions, administrators, faculty members, staff, students, parents, guardians, and other authorized users access EduFlowAI through our website, web application, and mobile applications.

By accessing or using EduFlowAI, you acknowledge that you have read and understood this Privacy Policy.

⸻

1. Information We Collect

We may collect and process the following categories of information.

A. Educational Institution Information
* Institution name
* Institution address
* Contact details
* Administrator information
* Subscription information
* Billing information
* Institution branding assets

⸻

B. Student Information
Depending on the institution’s requirements, we may collect:
* Student name
* Admission or registration number
* Roll number
* Date of birth
* Gender
* Class, section, course or semester
* Attendance records
* Academic records
* Examination results
* Fee records
* Transport information
* Hostel information
* Library records
* Identity documents uploaded by the institution (where applicable)
* Parent or guardian information

⸻

C. Parent / Guardian Information
Where applicable, we may collect:
* Name
* Mobile number
* Email address
* Relationship with student
* Address
* Communication preferences

⸻

D. Faculty & Staff Information
We may collect:
* Employee ID
* Name
* Contact information
* Department
* Designation
* Attendance
* Payroll-related references (if enabled)
* Roles and permissions
* Login activity

⸻

E. User Account Information
We collect:
* Username
* Email address
* Mobile number
* Encrypted password
* Login history
* Authentication information
Passwords are stored using industry-standard encryption and are never stored in plain text.

⸻

F. Device & Technical Information
We may automatically collect:
* IP address
* Browser type
* Operating system
* Device information
* App version
* Crash reports
* Log files
* Usage analytics
* Session information

⸻

2. How We Use Information

We use collected information to:
* Provide EduFlowAI services
* Manage educational institution operations
* Manage admissions
* Track attendance
* Manage academic records
* Process examination results
* Manage fee collection
* Generate reports
* Send notifications
* Enable communication between institutions and users
* Improve product functionality
* Maintain platform security
* Detect fraud or misuse
* Provide customer support
* Comply with applicable laws

⸻

3. Legal Basis for Processing

Where applicable, we process information:
* With the authorization of the educational institution
* To perform contractual obligations
* To comply with legal obligations
* To protect legitimate business interests
* Based on user consent where required by law

⸻

4. Data Security

Protecting user information is a priority.
We implement reasonable administrative, technical, and organizational safeguards including:
* Secure authentication
* Encrypted passwords
* HTTPS encryption
* Secure cloud infrastructure
* Role-based access control
* Regular system updates
* Backup procedures
* Activity monitoring
* Security logging
Despite our efforts, no electronic system can guarantee absolute security.

⸻

5. Data Sharing

We do not sell personal information.
Information may be shared only:
* With the respective educational institution
* With authorized users designated by the institution
* With trusted third-party service providers supporting EduFlowAI
* With payment processors (where applicable)
* With cloud infrastructure providers
* When required by law, regulation, court order, or government authority
* To protect the rights, safety, or property of SoleristicAI or its users

⸻

6. Third-Party Services

EduFlowAI may integrate with third-party services including:
* Cloud hosting providers
* Email delivery providers
* SMS providers
* WhatsApp Business APIs
* Push notification services
* Payment gateways
* Analytics providers
* Customer support tools
Each third-party service operates under its own privacy practices.

⸻

7. Cookies & Similar Technologies

Our website and applications may use cookies and similar technologies to:
* Maintain secure sessions
* Improve user experience
* Remember preferences
* Analyze platform usage
* Improve performance
Users may disable cookies through browser settings, although certain features may not function properly.

⸻

8. Data Retention

We retain information only for as long as necessary to:
* Provide services
* Fulfill contractual obligations
* Comply with applicable laws
* Resolve disputes
* Enforce legal agreements
Educational institutions may request deletion of their information after account termination, subject to legal, contractual, and regulatory obligations.

⸻

9. Data Ownership

All educational records and institutional information stored within EduFlowAI remain the property of the respective educational institution.
SoleristicAI does not claim ownership of any institutional, student, faculty, staff, or administrative data uploaded by customers.
We process such information solely to provide and improve EduFlowAI services.

⸻

10. User Rights

Depending on applicable law, users may have the right to:
* Access personal information
* Correct inaccurate information
* Request deletion
* Request restriction of processing
* Request data portability
* Withdraw consent where applicable
* Lodge complaints with relevant authorities
Requests should generally be submitted through the respective educational institution or by contacting us.

⸻

11. Children’s Privacy

EduFlowAI is intended for use by educational institutions, including schools, colleges, universities, coaching institutes, training centers, and similar organizations.
Where EduFlowAI processes information relating to minors, such processing is carried out under the authority of the respective educational institution and, where required by applicable law, with appropriate parental or guardian consent.
For adult students enrolled in colleges or universities, personal information is processed in accordance with this Privacy Policy and applicable laws.

⸻

12. Account Security

Users are responsible for maintaining the confidentiality of their account credentials.
Users should not share passwords with others.
Any suspected unauthorized access should be reported immediately.

⸻

13. International Data Transfers

Where data is transferred or processed outside the user’s country, SoleristicAI will implement appropriate safeguards consistent with applicable data protection laws.

⸻

14. Service Availability

We strive to provide reliable and uninterrupted services.
However, scheduled maintenance, software updates, technical issues, internet outages, or circumstances beyond our reasonable control may occasionally affect service availability.
SoleristicAI shall not be liable for temporary interruptions reasonably necessary for maintenance or security.

⸻

15. Changes to this Privacy Policy

We may update this Privacy Policy from time to time.
The latest version will always be available on our website and applications.
Continued use of EduFlowAI after updates constitutes acceptance of the revised Privacy Policy.

⸻

16. Contact Us

If you have questions regarding this Privacy Policy or our privacy practices, please contact us.
SoleristicAI
Product: EduFlowAI
Email: soleristicai@gmail.com 
Website: https://eduflowai.uk

⸻

Disclaimer
This Privacy Policy is intended as a general business privacy policy. It is not legal advice. Before onboarding enterprise customers or expanding internationally, consider having your legal documents reviewed by a qualified lawyer to ensure compliance with applicable laws such as India’s Digital Personal Data Protection Act (DPDP Act), GDPR (if serving EU users), or other relevant regulations.
''';

const String _termsContent = '''
Effective Date: 23 July 2026

Welcome to EduFlowAI, a cloud-based Education Management System (EMS) developed and operated by SoleristicAI (“Company”, “we”, “our”, or “us”).
EduFlowAI provides digital management solutions for educational institutions, including schools, colleges, universities, coaching institutes, training centers, and other educational organizations.
These Terms & Conditions (“Terms”) govern your access to and use of EduFlowAI through our website, web application, and mobile applications.
By accessing or using EduFlowAI, you acknowledge that you have read, understood, and agree to be bound by these Terms.
If you do not agree to these Terms, you must not use EduFlowAI.

⸻

1. Definitions

For the purposes of these Terms:
Company means SoleristicAI.
EduFlowAI means the Education Management System developed and operated by SoleristicAI.
Institution means any school, college, university, coaching institute, academy, training center, or other educational organization using EduFlowAI.
User means any authorized administrator, principal, faculty member, teacher, staff member, student, parent, guardian, or any other person granted access by an Institution.
Services means all software, websites, mobile applications, APIs, dashboards, AI features, communication tools, and related services provided through EduFlowAI.

⸻

2. Eligibility

EduFlowAI may only be used by:
* Registered educational institutions
* Authorized users approved by an Institution
* Individuals legally permitted to enter into binding agreements
Users must provide accurate and complete information while creating or using accounts.

⸻

3. Services

EduFlowAI may include, but is not limited to:
* Student Information Management
* Admissions Management
* Attendance Management
* Fee Management
* Timetable Management
* Homework & Assignments
* Examination & Results
* Parent Communication
* Notifications
* Staff Management
* Library Management
* Transport Management
* AI-powered features
* Reports & Analytics
* Mobile Applications
* Web Dashboard
* Future software modules introduced by SoleristicAI
We reserve the right to add, modify, suspend, or discontinue any feature without prior notice.

⸻

4. User Accounts

Each Institution is responsible for managing its own users.
Users agree to:
* Keep login credentials confidential
* Use strong passwords
* Not share accounts
* Notify the Institution or SoleristicAI immediately if unauthorized access is suspected
The Company shall not be responsible for losses resulting from compromised credentials caused by user negligence.

⸻

5. Subscription & Payment

Certain features require a paid subscription.
Institutions agree to:
* Pay setup fees where applicable
* Pay recurring subscription fees on time
* Maintain valid billing information
* Comply with agreed pricing plans
Failure to make payments may result in suspension or termination of services.

⸻

6. Pricing Changes

SoleristicAI reserves the right to modify pricing, subscription plans, and service offerings.
Price changes shall not affect existing subscriptions until the next renewal period unless otherwise agreed.

⸻

7. Free Trials

If offered, free trials:
* Are available for a limited duration
* May have limited functionality
* May be discontinued at any time
* Do not guarantee future availability
The Company reserves the right to end any free trial without prior notice.

⸻

8. Refund Policy

Unless otherwise agreed in writing:
* Setup fees are non-refundable once onboarding or implementation has commenced.
* Subscription fees are generally non-refundable.
* Refunds, if approved, shall be at the sole discretion of SoleristicAI and in accordance with applicable law.

⸻

9. Data Ownership

All educational data uploaded into EduFlowAI remains the exclusive property of the respective Institution.
This includes:
* Student records
* Faculty records
* Attendance
* Academic records
* Fee records
* Documents
* Institution branding
* Administrative information
SoleristicAI does not claim ownership of Institution data.
We process such data solely for providing, maintaining, securing, and improving EduFlowAI.

⸻

10. Data Backup & Recovery

We perform reasonable backups of system data.
However:
* Institutions are encouraged to maintain independent backups of critical records.
* SoleristicAI does not guarantee recovery from every possible data loss event.
* Disaster recovery timelines may vary depending on technical circumstances.

⸻

11. Acceptable Use

Users agree not to:
* Violate applicable laws
* Upload illegal or harmful content
* Attempt unauthorized access
* Reverse engineer the software
* Copy or reproduce EduFlowAI
* Interfere with platform security
* Introduce malware or malicious code
* Abuse system resources
* Impersonate another user
* Use EduFlowAI for unlawful purposes
Violation may result in immediate suspension or termination.

⸻

12. Intellectual Property

EduFlowAI and all associated intellectual property remain the exclusive property of SoleristicAI.
This includes:
* Source code
* APIs
* Software architecture
* Databases
* User interface
* Branding
* Logos
* Trademarks
* AI systems
* Documentation
* Designs
* Mobile applications
* Website content
Nothing in these Terms transfers ownership of any intellectual property to users or Institutions.

⸻

13. Artificial Intelligence Features

Certain EduFlowAI features may use artificial intelligence.
AI-generated outputs:
* Are provided to assist users.
* May contain inaccuracies.
* Should be reviewed before making important academic or administrative decisions.
Users remain responsible for all decisions made using AI-generated content.

⸻

14. Third-Party Services

EduFlowAI may integrate with:
* WhatsApp Business
* Payment gateways
* SMS providers
* Email services
* Cloud hosting providers
* Analytics platforms
* Authentication providers
* Notification services
These services operate under their own terms and privacy policies.
SoleristicAI is not responsible for third-party outages or failures.

⸻

15. Availability

We strive to provide reliable service.
However, interruptions may occur due to:
* Scheduled maintenance
* Security updates
* Internet failures
* Infrastructure issues
* Third-party outages
* Events beyond our reasonable control
We do not guarantee uninterrupted or error-free availability.

⸻

16. Privacy

Your use of EduFlowAI is governed by our Privacy Policy.
By using EduFlowAI, you consent to the collection and processing of information as described in the Privacy Policy.

⸻

17. Limitation of Liability

To the fullest extent permitted by applicable law, SoleristicAI shall not be liable for:
* Loss of data resulting from user actions
* Internet interruptions
* Institution administrative errors
* Third-party service failures
* Indirect, incidental, or consequential damages
* Loss of revenue
* Loss of profits
* Loss of business opportunities
Our total liability shall not exceed the subscription fees actually paid by the Institution during the preceding twelve (12) months.

⸻

18. Indemnification

The Institution agrees to indemnify and hold harmless SoleristicAI, its founders, directors, employees, contractors, affiliates, and partners from any claims, liabilities, damages, losses, costs, or expenses arising from:
* Misuse of EduFlowAI
* Violation of these Terms
* Violation of applicable laws
* Unauthorized activities by Institution users
* Intellectual property infringement caused by Institution content

⸻

19. Suspension & Termination

We may suspend or terminate access if:
* Subscription fees remain unpaid
* These Terms are violated
* Fraudulent activity is detected
* Security risks are identified
* Required by law
Upon termination:
* Platform access may be disabled.
* Institutions may request export of eligible data within the applicable retention period.
* Data may subsequently be deleted in accordance with our Privacy Policy and legal obligations.

⸻

20. Changes to Services & Terms

SoleristicAI may update:
* Features
* Pricing
* Policies
* Terms
* Platform functionality
Updated Terms become effective upon publication.
Continued use of EduFlowAI constitutes acceptance of the revised Terms.

⸻

21. Governing Law & Dispute Resolution

These Terms shall be governed by the laws of the Republic of India.
The Parties shall first attempt to resolve disputes through good-faith negotiations.
If a dispute cannot be resolved amicably, it shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996.
The seat of arbitration shall be Haryana, India.
Subject to applicable law, the courts located in Haryana, India, shall have exclusive jurisdiction.

⸻

22. Force Majeure

SoleristicAI shall not be liable for delays or failures resulting from circumstances beyond its reasonable control, including but not limited to:
* Natural disasters
* Fire
* Flood
* Earthquake
* Pandemic
* War
* Government actions
* Internet failures
* Cyberattacks
* Power outages

⸻

23. Severability

If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

⸻

24. Entire Agreement

These Terms, together with our Privacy Policy and any applicable service agreements executed between SoleristicAI and an Institution, constitute the entire agreement governing the use of EduFlowAI and supersede all prior understandings relating to the Services.

⸻

25. Contact Information

For questions regarding these Terms & Conditions, please contact:
SoleristicAI
Product: EduFlowAI
Email: soleristicai@gmail.com 
Website: https://eduflowai.uk

⸻

Last Updated: 23 July 2026

⸻

This version is suitable for publishing on your website and apps. For paying institutions, I also recommend maintaining a separate Master Service Agreement (MSA) or School Service Agreement, which covers implementation, onboarding, payment schedules, service levels (SLA), support commitments, and commercial terms beyond these general Terms & Conditions.
''';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with TickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();

  bool _showPass = false;
  bool _isExiting = false;
  bool _showSuccessPop = false;
  int _shakeTrigger = 0;

  late final AnimationController _bgController; // ambient background loop
  late final AnimationController _scanController; // field focus scan line
  late final AnimationController _buttonPressController;

  @override
  void initState() {
    super.initState();

    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat();

    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();

    _buttonPressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      lowerBound: 0.0,
      upperBound: 1.0,
      value: 0.0,
    );

    _emailFocus.addListener(() => setState(() {}));
    _passwordFocus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _bgController.dispose();
    _scanController.dispose();
    _buttonPressController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    // Keyboard should drop the moment Login is tapped.
    FocusScope.of(context).unfocus();

    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() => _shakeTrigger++);
      return;
    }

    final success = await ref
        .read(authProvider.notifier)
        .login(_emailController.text, _passwordController.text, context);

    if (!mounted) return;

    if (success) {
      // Premium success beat: quick checkmark pop, then fade the whole
      // screen out before actually navigating.
      setState(() => _showSuccessPop = true);
      await Future.delayed(const Duration(milliseconds: 550));
      if (!mounted) return;
      setState(() => _isExiting = true);
      await Future.delayed(const Duration(milliseconds: 320));
      if (!mounted) return;

      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr != null) {
        final role = jsonDecode(userStr)['role'];
        if (role == 'superadmin') {
          context.go('/superadmin/dashboard');
        } else if (role == 'finance') {
          context.go('/finance/dashboard');
        } else if (role == 'transport_incharge') { 
          // 👇🔥 NAYA ROUTE ADD KIYA 🔥👇
          context.go('/transporter/dashboard');
        } else {
          context.go('/');
        }
      }
    } else {
      setState(() => _shakeTrigger++);
    }
  }

  void _showLegalSheet(String title, String content) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          minChildSize: 0.4,
          maxChildSize: 0.92,
          expand: false,
          builder: (context, scrollController) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 12, 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: Color(0xFF94A3B8)),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
                      child: Text(
                        content,
                        style: const TextStyle(fontSize: 13.5, height: 1.65, color: Color(0xFF475569)),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    const accent = Color(0xFF42A5F5);
    const accentSoft = Color(0xFF9C6BFF);
    const gold = Colors.amber;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      // We handle the keyboard ourselves below, so the background,
      // top header and footer never resize or jump when it opens.
      resizeToAvoidBottomInset: false,
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => FocusScope.of(context).unfocus(),
        child: AnimatedOpacity(
          opacity: _isExiting ? 0.0 : 1.0,
          duration: const Duration(milliseconds: 320),
          curve: Curves.easeOut,
          child: AnimatedScale(
            scale: _isExiting ? 1.04 : 1.0,
            duration: const Duration(milliseconds: 320),
            curve: Curves.easeOut,
            child: Stack(
              children: [
                // --- BACKGROUND GRADIENT ---
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFFE0F2FE), Color(0xFFF8FAFC), Color(0xFFF1F5F9)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ),

                // --- AMBIENT FLOATING GLOW ORBS (continuously alive) ---
                AnimatedBuilder(
                  animation: _bgController,
                  builder: (context, child) {
                    final t = _bgController.value;
                    return Positioned(
                      top: -100 + math.sin(t * 2 * math.pi) * 20,
                      left: -60 + math.cos(t * 2 * math.pi) * 15,
                      child: Container(
                        width: 300,
                        height: 300,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: accent.withValues(alpha: 0.22),
                        ),
                      ),
                    );
                  },
                ),
                AnimatedBuilder(
                  animation: _bgController,
                  builder: (context, child) {
                    final t = _bgController.value;
                    return Positioned(
                      bottom: -130 + math.cos(t * 2 * math.pi) * 25,
                      right: -80 + math.sin(t * 2 * math.pi) * 18,
                      child: Container(
                        width: 340,
                        height: 340,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: accentSoft.withValues(alpha: 0.18),
                        ),
                      ),
                    );
                  },
                ),

                Positioned.fill(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 50, sigmaY: 50),
                    child: Container(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                ),

                // --- DRIFTING AMBIENT PARTICLES BEHIND CARD ---
                ...List.generate(16, (index) {
                  final rand = math.Random(index);
                  final startX = rand.nextDouble();
                  final startY = rand.nextDouble();
                  final size = rand.nextDouble() * 3 + 1.5;
                  return AnimatedBuilder(
                    animation: _bgController,
                    builder: (context, child) {
                      final t = (_bgController.value + index * 0.06) % 1.0;
                      final drift = math.sin(t * 2 * math.pi) * 14;
                      return Positioned(
                        left: startX * MediaQuery.of(context).size.width + drift,
                        top: startY * MediaQuery.of(context).size.height,
                        child: Opacity(
                          opacity: 0.35 + (math.sin(t * 2 * math.pi) * 0.25),
                          child: Container(
                            width: size,
                            height: size,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: accent,
                              boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.5), blurRadius: size * 2)],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                }),

                // --- MAIN CARD (scrolls itself up above the keyboard) ---
                Positioned.fill(
                  child: Center(
                    child: AnimatedPadding(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeOut,
                      padding: EdgeInsets.only(bottom: bottomInset),
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: _ShakeWrapper(
                          trigger: _shakeTrigger,
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(50),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.06),
                                  blurRadius: 40,
                                  spreadRadius: 10,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // --- LOGO & TITLE ---
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.memory, color: accent, size: 36)
                                        .animate(onPlay: (c) => c.repeat())
                                        .rotate(duration: 10.seconds),
                                    const SizedBox(width: 14),
                                    const Text(
                                      "EduFlowAI",
                                      style: TextStyle(
                                        fontSize: 34,
                                        fontWeight: FontWeight.w900,
                                        fontStyle: FontStyle.italic,
                                        color: Color(0xFF1E293B),
                                        letterSpacing: -1.2,
                                        height: 1,
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Container(
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(color: gold.withValues(alpha: 0.35), blurRadius: 8, spreadRadius: 1),
                                        ],
                                      ),
                                      child: const Icon(Icons.bolt, color: gold, size: 38),
                                    )
                                        .animate(onPlay: (c) => c.repeat(reverse: true))
                                        .scale(duration: 1500.ms, begin: const Offset(1, 1), end: const Offset(1.12, 1.12)),
                                  ],
                                )
                                    .animate()
                                    .fadeIn(duration: 500.ms)
                                    .scale(begin: const Offset(0.85, 0.85), curve: Curves.easeOutBack),

                                const SizedBox(height: 12),

                                // Animated blue divider — grows in from nothing
                                Container(
                                  height: 4,
                                  width: 60,
                                  decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(10)),
                                )
                                    .animate()
                                    .fadeIn(delay: 250.ms, duration: 300.ms)
                                    .then()
                                    .animate(onPlay: (c) => c.repeat(reverse: true))
                                    .scaleX(duration: 1.2.seconds, begin: 1, end: 1.5),

                                const SizedBox(height: 16),

                                const Text(
                                  "LOGIN REQUIRED",
                                  style: TextStyle(
                                    color: Color(0xFF475569),
                                    fontWeight: FontWeight.w800,
                                    fontStyle: FontStyle.italic,
                                    fontSize: 14,
                                    letterSpacing: 1,
                                  ),
                                ).animate().fadeIn(delay: 350.ms, duration: 400.ms),

                                const SizedBox(height: 35),

                                // --- PREMIUM EMAIL FIELD ---
                                _PremiumField(
                                  controller: _emailController,
                                  focusNode: _emailFocus,
                                  scanController: _scanController,
                                  hint: "Email ID",
                                  icon: Icons.email_outlined,
                                  keyboardType: TextInputType.emailAddress,
                                  accent: accent,
                                ).animate().fadeIn(delay: 450.ms, duration: 450.ms).slideY(begin: 0.25, curve: Curves.easeOutCubic),

                                const SizedBox(height: 20),

                                // --- PREMIUM PASSWORD FIELD ---
                                _PremiumField(
                                  controller: _passwordController,
                                  focusNode: _passwordFocus,
                                  scanController: _scanController,
                                  hint: "Enter Password",
                                  icon: Icons.lock_outline,
                                  obscureText: !_showPass,
                                  accent: accent,
                                  suffix: GestureDetector(
                                    onTap: () => setState(() => _showPass = !_showPass),
                                    child: AnimatedSwitcher(
                                      duration: const Duration(milliseconds: 250),
                                      transitionBuilder: (child, anim) => RotationTransition(
                                        turns: Tween<double>(begin: 0.75, end: 1).animate(anim),
                                        child: ScaleTransition(scale: anim, child: child),
                                      ),
                                      child: Icon(
                                        _showPass ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                        key: ValueKey(_showPass),
                                        color: const Color(0xFF94A3B8),
                                        size: 22,
                                      ),
                                    ),
                                  ),
                                ).animate().fadeIn(delay: 550.ms, duration: 450.ms).slideY(begin: 0.25, curve: Curves.easeOutCubic),

                                // --- ERROR MESSAGE ---
                                if (authState.error != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 12),
                                    child: Text(
                                      authState.error!,
                                      style: const TextStyle(
                                          color: Colors.redAccent, fontStyle: FontStyle.italic, fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                  ).animate().fadeIn().slideY(begin: -0.2),

                                const SizedBox(height: 24),

                                // --- SECURE LOGIN & FORGOT PASSWORD ROW ---
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Row(
                                      children: [
                                        Icon(Icons.security, size: 16, color: Color(0xFF94A3B8)),
                                        SizedBox(width: 6),
                                        Text("SECURE\nLOGIN",
                                            style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w900,
                                                color: Color(0xFF94A3B8),
                                                fontStyle: FontStyle.italic,
                                                height: 1.1)),
                                      ],
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        showModalBottomSheet(
                                          context: context,
                                          isScrollControlled: true,
                                          backgroundColor: Colors.transparent,
                                          builder: (context) => const ForgotPasswordModal(),
                                        );
                                      },
                                      child: const Text("FORGOT PASSWORD?",
                                          style: TextStyle(
                                              color: accent,
                                              fontWeight: FontWeight.w900,
                                              fontSize: 11,
                                              fontStyle: FontStyle.italic,
                                              letterSpacing: 0.5)),
                                    ),
                                  ],
                                ).animate().fadeIn(delay: 650.ms, duration: 400.ms),

                                const SizedBox(height: 24),

                                // --- PREMIUM LOGIN BUTTON ---
                                GestureDetector(
                                  onTapDown: (_) => _buttonPressController.forward(),
                                  onTapUp: (_) => _buttonPressController.reverse(),
                                  onTapCancel: () => _buttonPressController.reverse(),
                                  onTap: authState.isLoading ? null : _handleLogin,
                                  child: AnimatedBuilder(
                                    animation: _buttonPressController,
                                    builder: (context, child) {
                                      final scale = 1.0 - (_buttonPressController.value * 0.035);
                                      return Transform.scale(scale: scale, child: child);
                                    },
                                    child: Container(
                                      width: double.infinity,
                                      height: 60,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(40),
                                        gradient: const LinearGradient(
                                          colors: [accent, Color(0xFF2F6DF6)],
                                          begin: Alignment.centerLeft,
                                          end: Alignment.centerRight,
                                        ),
                                        boxShadow: [
                                          BoxShadow(color: accent.withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 8)),
                                        ],
                                      ),
                                      alignment: Alignment.center,
                                      child: AnimatedSwitcher(
                                        duration: const Duration(milliseconds: 280),
                                        transitionBuilder: (child, anim) =>
                                            ScaleTransition(scale: anim, child: FadeTransition(opacity: anim, child: child)),
                                        child: _showSuccessPop
                                            ? const Icon(Icons.check_circle_rounded, key: ValueKey('success'), color: Colors.white, size: 28)
                                                .animate()
                                                .scale(begin: const Offset(0.5, 0.5), curve: Curves.elasticOut)
                                            : authState.isLoading
                                                ? const SizedBox(
                                                    key: ValueKey('loading'),
                                                    height: 24,
                                                    width: 24,
                                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                                                  )
                                                : const Row(
                                                    key: ValueKey('idle'),
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: [
                                                      Text("LOGIN",
                                                          style: TextStyle(
                                                              color: Colors.white,
                                                              fontSize: 16,
                                                              fontWeight: FontWeight.w900,
                                                              fontStyle: FontStyle.italic,
                                                              letterSpacing: 1)),
                                                      SizedBox(width: 8),
                                                      Icon(Icons.bolt, size: 20, color: Colors.white),
                                                    ],
                                                  ),
                                      ),
                                    ),
                                  ),
                                ).animate().fadeIn(delay: 750.ms, duration: 450.ms).slideY(begin: 0.3, curve: Curves.easeOutBack),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // --- (NEW) FIXED BOTTOM FOOTER — Privacy Policy / Terms ---
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: Center(
                        child: Wrap(
                          alignment: WrapAlignment.center,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            GestureDetector(
                              onTap: () => _showLegalSheet("Privacy Policy", _privacyPolicyContent),
                              child: const Text(
                                "PRIVACY POLICY",
                                style: TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 10.5,
                                  fontStyle: FontStyle.italic,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 8),
                              child: Text("•", style: TextStyle(color: Color(0xFFCBD5E1))),
                            ),
                            GestureDetector(
                              onTap: () => _showLegalSheet("Terms of Service", _termsContent),
                              child: const Text(
                                "TERMS & CONDITIONS",
                                style: TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 10.5,
                                  fontStyle: FontStyle.italic,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ).animate().fadeIn(delay: 300.ms, duration: 500.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// A premium text field: floating focus glow, scanning highlight line
/// along the border while focused, and an icon that gently pulses
/// when the user is actively typing in it.
class _PremiumField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final AnimationController scanController;
  final String hint;
  final IconData icon;
  final bool obscureText;
  final Widget? suffix;
  final TextInputType? keyboardType;
  final Color accent;

  const _PremiumField({
    required this.controller,
    required this.focusNode,
    required this.scanController,
    required this.hint,
    required this.icon,
    required this.accent,
    this.obscureText = false,
    this.suffix,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    final bool isFocused = focusNode.hasFocus;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(40),
        boxShadow: isFocused
            ? [BoxShadow(color: accent.withValues(alpha: 0.28), blurRadius: 22, spreadRadius: 1)]
            : [],
      ),
      child: Stack(
        alignment: Alignment.centerLeft,
        children: [
          TextFormField(
            controller: controller,
            focusNode: focusNode,
            obscureText: obscureText,
            keyboardType: keyboardType,
            style: const TextStyle(fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, color: Color(0xFF334155)),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontStyle: FontStyle.italic),
              prefixIcon: AnimatedBuilder(
                animation: scanController,
                builder: (context, child) {
                  final pulse = isFocused ? (0.5 + 0.5 * math.sin(scanController.value * 2 * math.pi)) : 0.0;
                  return Transform.scale(
                    scale: 1.0 + (pulse * 0.12),
                    child: Icon(icon, color: isFocused ? accent : accent.withValues(alpha: 0.75), size: 22),
                  );
                },
              ),
              suffixIcon: suffix,
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(vertical: 20),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(40),
                borderSide: const BorderSide(color: Color(0xFFCBD5E1), width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(40),
                borderSide: BorderSide(color: accent, width: 2),
              ),
            ),
          ),

          // Scanning highlight sweep — only visible while focused
          if (isFocused)
            IgnorePointer(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(40),
                child: AnimatedBuilder(
                  animation: scanController,
                  builder: (context, child) {
                    final t = scanController.value;
                    return Align(
                      alignment: Alignment(-1.0 + 2.0 * t, 0),
                      child: FractionallySizedBox(
                        widthFactor: 0.18,
                        child: Container(
                          height: 60,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                accent.withValues(alpha: 0.0),
                                accent.withValues(alpha: 0.10),
                                accent.withValues(alpha: 0.0),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Wraps a child and shakes it horizontally whenever [trigger] changes
/// (used for wrong-credentials / empty-field feedback on the whole card).
class _ShakeWrapper extends StatefulWidget {
  final int trigger;
  final Widget child;
  const _ShakeWrapper({required this.trigger, required this.child});

  @override
  State<_ShakeWrapper> createState() => _ShakeWrapperState();
}

class _ShakeWrapperState extends State<_ShakeWrapper> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 450));
  }

  @override
  void didUpdateWidget(covariant _ShakeWrapper oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.trigger != oldWidget.trigger && widget.trigger != 0) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value;
        final offset = math.sin(t * math.pi * 6) * (1 - t) * 10;
        return Transform.translate(offset: Offset(offset, 0), child: child);
      },
      child: widget.child,
    );
  }
}

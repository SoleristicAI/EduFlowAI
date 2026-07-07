import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../features/auth/screens/login_screen.dart';
import '../features/student/screens/student_home.dart';
import '../features/student/screens/student_attendance.dart';
import '../features/student/screens/student_timetable.dart';
import '../features/student/screens/student_fees.dart';
import '../features/student/screens/student_checkout.dart';
import '../features/student/screens/student_payment_methods.dart';
import '../features/student/screens/class_diary.dart';
import '../features/student/screens/notice_feed.dart';
import '../features/student/screens/student_performance.dart';
import '../features/student/screens/mentorship.dart';
import '../features/student/screens/student_calendar.dart';
import '../features/student/screens/student_my_subjects.dart';
import '../features/student/screens/student_live_classes.dart';
import '../features/student/screens/student_erp_notices.dart';
import '../features/student/screens/student_feedback.dart';
import '../features/student/screens/student_settings.dart';
import '../features/student/screens/change_password.dart';
import '../features/student/screens/library.dart';
import '../features/student/screens/student_transport.dart';
import '../features/student/screens/student_assignments.dart';
import '../features/student/screens/student_leave_request.dart';
import '../features/student/screens/student_leave_history.dart';
import '../features/student/screens/student_syllabus.dart';
import '../features/student/screens/student_datesheet.dart';
import '../features/student/screens/student_exam_result.dart';
import '../features/student/screens/student_admit_card.dart';
import '../shared/widgets/technical_support_modal.dart';
import '../shared/widgets//my_account.dart'; // Apna actual path check kar lena
import '../features/student/screens/student_support.dart';
import '../features/teacher/screens/teacher_home.dart';
import '../shared/widgets/layout_wrapper.dart';
import '../splash_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/splash',

  redirect: (context, state) async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    final isLoggedIn = userStr != null;

    final isGoingToLogin = state.uri.path == '/login';
    final isGoingToSplash = state.uri.path == '/splash';
    final isGoingToRoot = state.uri.path == '/';

    // 1. Agar Splash Screen par hai, toh usko wahi rehne do
    if (isGoingToSplash) return null;

    // 2. Agar Login NAHI hai, aur Splash ya Login ke alawa kahin ja raha hai -> Login pe dalo
    if (!isLoggedIn && !isGoingToLogin) {
      return '/login';
    }

    // 3. 🔥 MAIN FIX YAHAN HAI 🔥
    if (isLoggedIn) {
      final role = jsonDecode(userStr!)['role'] ?? 'student';

      // Agar user Login screen ya Root '/' screen par ja raha hai, toh use uske role ke hisaab se patko
      if (isGoingToLogin || isGoingToRoot) {
        if (role == 'superadmin') return '/superadmin/dashboard';
        if (role == 'finance') return '/finance/dashboard';
        if (role == 'teacher') return '/teacher/home'; // Teacher gaya teacher home pe
        
        // Agar inme se koi nahi hai toh matlab student hai
        if (isGoingToLogin) return '/'; // Student ko root pe bhej do
      }
    }

    return null;
  },

  routes: [
    // --- SPLASH SCREEN ROUTE ---
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),

    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),

    GoRoute(
      path: '/attendance',
      builder: (context, state) => const StudentAttendance(),
    ),

    GoRoute(
      path: '/timetable',
      builder: (context, state) => const StudentTimetable(),
    ),

    GoRoute(
      path: '/student/fees',
      builder: (context, state) => const StudentFees(),
    ),

    GoRoute(
      path: '/student/checkout',
      builder: (context, state) => const StudentCheckout(),
    ),

    GoRoute(
      path: '/student/payment-methods',
      builder: (context, state) => const StudentPaymentMethods(),
    ),

    GoRoute(
      path: '/class-diary',
      builder: (context, state) => const ClassDiary(),
    ),

    GoRoute(
      path: '/notice-feed',
      builder: (context, state) => const NoticeFeed(),
    ),

    GoRoute(
      path: '/performance',
      builder: (context, state) => const StudentPerformance(),
    ),

    GoRoute(
      path: '/mentors',
      builder: (context, state) => const Mentorship(),
    ),

    GoRoute(
      path: '/holidays',
      builder: (context, state) => const StudentAcademicCalendar(),
    ),

    GoRoute(
      path: '/my-subjects',
      builder: (context, state) => const StudentMySubjects(),
    ),

    GoRoute(
      path: '/live-classes',
      builder: (context, state) => const StudentLiveClass(),
    ),

    GoRoute(
      path: '/erp-notices',
      builder: (context, state) => const StudentErpNotices(),
    ),

    GoRoute(
      path: '/feedback',
      builder: (context, state) => const StudentFeedback(),
    ),

    GoRoute(
      path: '/settings',
      builder: (context, state) => const StudentSettings(),
    ),

    GoRoute(
      path: '/change-password',
      builder: (context, state) => const ChangePassword(),
    ),

    GoRoute(
      path: '/library',
      builder: (context, state) => const StudentLibrary(),
    ),

    GoRoute(
      path: '/transport',
      builder: (context, state) => const StudentTransport(),
    ),

    GoRoute(
      path: '/assignments',
      builder: (context, state) => const StudentAssignments(),
    ),

    GoRoute(
      path: '/leave',
      builder: (context, state) => const StudentLeaveRequest(),
    ),

    GoRoute(
      path: '/student/leave-history',
      builder: (context, state) => const StudentLeaveHistory(),
    ),

    GoRoute(
      path: '/syllabus',
      builder: (context, state) => const StudentSyllabus(),
    ),

    GoRoute(
      path: '/exam-datesheet',
      builder: (context, state) => const StudentDatesheet(),
    ),

    GoRoute(
      path: '/exam-results',
      builder: (context, state) => const StudentExamResult(),
    ),

    GoRoute(
      path: '/admit-card',
      builder: (context, state) => const StudentAdmitCard(),
    ),

    GoRoute(
      path: '/support', 
      builder: (context, state) => const StudentSupport(),
    ),

    GoRoute(
      path: '/my-account',
      builder: (context, state) => const MyAccount(),
    ),

    // 🔥 MAIN FIX 2: TEACHER HOME KE UPAR BHI LAYOUT WRAPPER LAGA DIYA 🔥
    GoRoute(
      path: '/teacher/home',
      builder: (context, state) {
        return LayoutWrapper(
          role: 'teacher',
          childBuilder: (query) => TeacherHome(searchQuery: query),
        );
      },
    ),

    // --- STUDENT DASHBOARD (ROOT ROUTE) ---
    GoRoute(
      path: '/',
      builder: (context, state) {
        return LayoutWrapper(
          role: 'student',
          childBuilder: (query) => StudentHome(searchQuery: query),
        );
      },
    ),

    // --- SUPERADMIN ---
    GoRoute(
      path: '/superadmin/dashboard',
      builder: (context, state) => const LayoutWrapper(
        role: 'superadmin',
        child: Center(child: Text('Super Admin Hub')),
      ),
    ),

    // --- FINANCE ---
    GoRoute(
      path: '/finance/dashboard',
      builder: (context, state) => const LayoutWrapper(
        role: 'finance',
        child: Center(child: Text('Finance Dashboard')),
      ),
    ),
  ],
);
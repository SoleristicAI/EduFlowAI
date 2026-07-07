import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

// 🔥 ConsumerStatefulWidget so it listens to theme changes
class Sidebar extends ConsumerStatefulWidget {
  const Sidebar({super.key});

  @override
  ConsumerState<Sidebar> createState() => _SidebarState();
}

class _SidebarState extends ConsumerState<Sidebar> {
  Map<String, dynamic>? user;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() => user = jsonDecode(userStr));
    }
  }

  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    final backup = prefs.getString('superadmin_backup');
    ref.read(themeProvider.notifier).resetTheme();
    if (backup != null) {
      await prefs.setString('user', backup);
      await prefs.remove('superadmin_backup');
      if (mounted) context.go('/superadmin/dashboard');
    } else {
      await prefs.remove('user');
      if (mounted) context.go('/login');
    }
  }

  void _navigate(String path) {
    print("Navigating to: $path");
    // 1. Koi pop() nahi, koi drawer close nahi.
    // 2. WidgetsBinding ensure karega ki click hone ke turant baad (agle frame mein) seedha naya page khule.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.push(path); // Seedha attendance page khulega poori screen pe
    });
  }

  // =======================================================================
  // --- THE PREMIUM LOGOUT MODAL (OVERLAYS EVERYTHING) ---
  // =======================================================================
  void _showLogoutConfirmation(BuildContext context, bool isDarkMode) {
    final Color modalBgColor =
        isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary =
        isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color buttonNoBgColor =
        isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color buttonNoBorderColor =
        isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0);

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Logout',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (dialogContext, animation, secondaryAnimation) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              GestureDetector(
                onTap: () => Navigator.pop(dialogContext),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(color: Colors.black.withValues(alpha: 0.4)),
                ),
              ),

              // --- 2. MODAL UI ---
              Center(
                child: GestureDetector(
                  onTap: () {}, // Prevent closing when tapping the card
                  child: Container(
                    width: MediaQuery.of(context).size.width * 0.85,
                    padding: const EdgeInsets.all(35),
                    clipBehavior: Clip.hardEdge,
                    decoration: BoxDecoration(
                      color: modalBgColor,
                      borderRadius: BorderRadius.circular(50),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 40,
                            offset: const Offset(0, 20))
                      ],
                    ),
                    child: Stack(
                      clipBehavior: Clip.none,
                      alignment: Alignment.topCenter,
                      children: [
                        // Top Soft Red Accent Line
                        Positioned(
                          top: -35,
                          left: -35,
                          right: -35,
                          child: Container(
                            height: 8,
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Color(0xFFFEE2E2),
                                  Color(0xFFF87171),
                                  Color(0xFFFEE2E2)
                                ],
                              ),
                            ),
                          ),
                        ),

                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const SizedBox(height: 10),
                            // Animated Warning Icon
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: isDarkMode
                                    ? const Color(0xFF7F1D1D).withOpacity(0.3)
                                    : Colors.red.shade50,
                                shape: BoxShape.circle,
                                border: Border.all(
                                    color: isDarkMode
                                        ? const Color(0xFF7F1D1D)
                                        : Colors.red.shade100),
                                boxShadow: const [
                                  BoxShadow(
                                      color: Colors.black12,
                                      blurRadius: 10,
                                      blurStyle: BlurStyle.inner)
                                ],
                              ),
                              child: const Icon(Icons.error_outline,
                                      color: Colors.redAccent, size: 48)
                                  .animate(
                                      onPlay: (c) => c.repeat(reverse: true))
                                  .scale(
                                      duration: 1.seconds,
                                      begin: const Offset(1, 1),
                                      end: const Offset(1.1, 1.1)),
                            ),
                            const SizedBox(height: 25),
                            Text("Confirm Logout",
                                style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    color: textColorPrimary,
                                    letterSpacing: -0.5)),
                            const SizedBox(height: 10),
                            const Text("Are you sure you want to logout?",
                                style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF94A3B8),
                                    height: 1.5)),
                            const SizedBox(height: 35),

                            // Action Buttons
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () =>
                                        Navigator.pop(dialogContext),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: buttonNoBgColor,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 20),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(30),
                                          side: BorderSide(
                                              color: buttonNoBorderColor)),
                                    ),
                                    child: const Text("NO",
                                        style: TextStyle(
                                            color: Color(0xFF64748B),
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 1.5)),
                                  ),
                                ),
                                const SizedBox(width: 15),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.pop(
                                          dialogContext); // Pehle modal hide karo
                                      _handleLogout(); // Phir log out API trigger karo
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.redAccent,
                                      elevation: 15,
                                      shadowColor: Colors.redAccent
                                          .withValues(alpha: 0.5),
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 20),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(30)),
                                    ),
                                    child: const Text("YES",
                                        style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 1.5)),
                                  ),
                                ),
                              ],
                            )
                          ],
                        ),
                      ],
                    ),
                  ),
                )
                    .animate()
                    .scale(duration: 300.ms, curve: Curves.easeOutBack)
                    .fadeIn(),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = user?['role'] ?? 'student';
    final name = user?['name'] ?? 'Guest User';
    final id = role == 'student'
        ? (user?['enrollmentNo'] ?? 'ST-0000')
        : (user?['employeeId'] ?? 'EMP-0000');

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS FOR DARK/LIGHT MODE 🔥
    final Color bgColor =
        isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    // 🔥 NAYA CODE: AVATAR URL SANITIZATION 🔥
    String? avatarUrl;
    final String currentLaptopIP = "10.163.134.38"; // Tera current IP
    if (user?['avatar'] != null && user!['avatar'].toString().isNotEmpty) {
      String rawAvatar = user!['avatar'].toString();
      if (rawAvatar.startsWith('http')) {
        avatarUrl = rawAvatar
            .replaceAll('localhost', currentLaptopIP)
            .replaceAll('127.0.0.1', currentLaptopIP);
      } else {
        avatarUrl = "http://$currentLaptopIP:5000$rawAvatar";
      }
    }

    return Drawer(
      backgroundColor: Colors.transparent,
      elevation: 0,
      width: MediaQuery.of(context).size.width * 0.72,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: const Duration(milliseconds: 650),
        curve: Curves.easeOutExpo,
        builder: (context, value, child) {
          return Transform.translate(
            offset: Offset(
              lerpDouble(-120, 0, value)!,
              0,
            ),
            child: Transform.scale(
              scale: lerpDouble(0.96, 1, value)!,
              child: Opacity(
                opacity: value,
                child: ImageFiltered(
                  imageFilter: ImageFilter.blur(
                    sigmaX: lerpDouble(8, 0, value)!,
                    sigmaY: lerpDouble(8, 0, value)!,
                  ),
                  child: child,
                ),
              ),
            ),
          );
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.only(
              topRight: Radius.circular(28),
              bottomRight: Radius.circular(28),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 35,
                spreadRadius: 4,
                offset: const Offset(10, 0),
              ),
            ],
          ),
          child: Column(
            children: [
              // --- HEADER SECTION ---
              Container(
                padding: const EdgeInsets.only(
                    top: 50, left: 20, right: 20, bottom: 20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDarkMode
                        ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)]
                        : [const Color(0xFF42A5F5), const Color(0xFF1E88E5)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius:
                      const BorderRadius.only(bottomRight: Radius.circular(40)),
                  boxShadow: const [
                    BoxShadow(
                        color: Colors.black12,
                        blurRadius: 10,
                        offset: Offset(0, 5))
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(color: Colors.black26, blurRadius: 10)
                              ]),
                          // 🔥 NAYA CODE: AVATAR PREVIEW WITH FALLBACK 🔥
                          child: ClipOval(
                            child: avatarUrl != null
                                ? Image.network(
                                    avatarUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => const CircleAvatar(
                                      backgroundColor: Color(0xFFF1F5F9),
                                      child: Icon(Icons.person, color: Color(0xFF42A5F5), size: 30),
                                    ),
                                  )
                                : const CircleAvatar(
                                    backgroundColor: Color(0xFFF1F5F9),
                                    child: Icon(Icons.person, color: Color(0xFF42A5F5), size: 30),
                                  ),
                          ),
                        ),
                        const SizedBox(width: 15),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name.toUpperCase(),
                                style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    fontStyle: FontStyle.italic),
                                overflow: TextOverflow.visible,
                              ),
                              Text(
                                id,
                                style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white70,
                                    letterSpacing: 1),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Quick Action Buttons
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _QuickAction(
                              icon: Icons.person,
                              label: "Account",
                              onTap: () => _navigate('/my-account')),
                          if (role != 'superadmin')
                            _QuickAction(
                                icon: role == 'finance'
                                    ? Icons.add_circle
                                    : role == 'admin'
                                        ? Icons.assignment
                                        : role == 'teacher'
                                            ? Icons.chat_bubble_outline // Teacher ke liye MessageCircle icon
                                            : Icons.help_outline,
                                label: role == 'finance'
                                    ? "Add Pay"
                                    : role == 'admin'
                                        ? "Notices"
                                        : role == 'teacher'
                                            ? "Help desk" // 🔥 Teacher Specific Label
                                            : "Support",
                                onTap: () => _navigate(role == 'finance'
                                    ? '/finance/add-payment'
                                    : role == 'admin'
                                        ? '/notice-feed'
                                        : role == 'teacher'
                                            ? '/teacher/support' // 🔥 Teacher Specific Route
                                            : '/support')),
                          _QuickAction(
                              icon: Icons.settings,
                              label: "Settings",
                              isRed: true,
                              onTap: () => _navigate('/settings')),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // --- SCROLLABLE CATEGORIES ---
              Expanded(
                child: RefreshIndicator(
                  color: const Color(0xFF42A5F5),
                  backgroundColor: isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                  onRefresh: _loadUser, // 🔥 Ye seedha tera function call karega aur naya data layega
                  child: ListView(
                    padding: const EdgeInsets.only(top: 10, bottom: 20),
                    // 🔥 RefreshIndicator ko chalane ke liye AlwaysScrollable zaroori hai
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    children: _buildRoleBasedMenu(role, isDarkMode),
                  ),
                ),
              ),

              // --- LOGOUT BUTTON ---
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  border: Border(
                      top: BorderSide(
                          color: isDarkMode
                              ? const Color(0xFF334155)
                              : const Color(0xFFE2E8F0))),
                ),
                child: InkWell(
                  onTap: () {
                    _showLogoutConfirmation(context, isDarkMode);
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    decoration: BoxDecoration(
                      color: isDarkMode
                          ? const Color(0xFF7F1D1D).withOpacity(0.3)
                          : Colors.red.withValues(alpha: 0.1),
                      border: Border.all(
                          color: isDarkMode
                              ? const Color(0xFF7F1D1D)
                              : Colors.red.withValues(alpha: 0.2)),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.logout, color: Colors.redAccent),
                        SizedBox(width: 10),
                        Text(
                          "LOGOUT",
                          style: TextStyle(
                              color: Colors.redAccent,
                              fontWeight: FontWeight.w900,
                              fontStyle: FontStyle.italic,
                              letterSpacing: 2),
                        )
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // =======================================================================
  // CATEGORY & MENU RENDERERS
  // =======================================================================
  List<Widget> _buildRoleBasedMenu(String role, bool isDarkMode) {
    switch (role) {
      case 'student':
        return [
          _buildCategory(
              "Daily Routine",
              [
                _MenuItem(
                    icon: Icons.calendar_month,
                    label: "Attendance",
                    path: '/attendance',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.access_time,
                    label: "TimeTable",
                    path: '/timetable',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.menu_book,
                    label: "Class Diary",
                    path: '/class-diary',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.videocam,
                    label: "Live Class",
                    path: '/live-classes',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Academic Center",
              [
                _MenuItem(
                    icon: Icons.menu_book,
                    label: "Syllabus",
                    path: '/syllabus',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.description,
                    label: "Assignment",
                    path: '/assignments',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.library_books,
                    label: "My Subjects",
                    path: '/my-subjects',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.book,
                    label: "Library",
                    path: '/library',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Examination Hub",
              [
                _MenuItem(
                    icon: Icons.calendar_today,
                    label: "Date Sheet",
                    path: '/exam-datesheet',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.fact_check,
                    label: "Admit Card",
                    path: '/admit-card',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.bar_chart,
                    label: "Results",
                    path: '/exam-results',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.trending_up,
                    label: "Performance",
                    path: '/performance',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Campus & Support",
              [
                _MenuItem(
                    icon: Icons.credit_card,
                    label: "Fees",
                    path: '/student/fees',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.directions_bus,
                    label: "Bus Tracker",
                    path: '/transport',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.assignment,
                    label: "Leave Request",
                    path: '/leave',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.people,
                    label: "Mentorship",
                    path: '/mentors',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Communication & Updates",
              [
                _MenuItem(
                    icon: Icons.campaign,
                    label: "Notices",
                    path: '/notice-feed',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.notifications,
                    label: "ERP Notices",
                    path: '/erp-notices',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.calendar_month,
                    label: "Holidays",
                    path: '/holidays',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.message,
                    label: "Feedback",
                    path: '/feedback',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
        ];
      case 'teacher':
        return [
          _buildCategory(
              "Academic Management",
              [
                _MenuItem(
                    icon: Icons.check_box,
                    label: "Class Attendance",
                    path: '/teacher/attendance',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.add_circle_outline,
                    label: "Assignments",
                    path: '/teacher/assignments',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.layers,
                    label: "Syllabus",
                    path: '/teacher/upload-syllabus',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.calendar_month,
                    label: "Date Sheet",
                    path: '/teacher/datesheet',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Class Management",
              [
                _MenuItem(
                    icon: Icons.people,
                    label: "Class list",
                    path: '/teacher/students',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.calendar_month,
                    label: "Schedule",
                    path: '/timetable',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.videocam,
                    label: "Live class",
                    path: '/teacher/live-class',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Communication",
              [
                _MenuItem(
                    icon: Icons.smart_toy,
                    label: "Broadcast",
                    path: '/teacher/notices',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.campaign,
                    label: "Notice feed",
                    path: '/notice-feed',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.chat_bubble_outline,
                    label: "Support center",
                    path: '/teacher/support',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
        ];
      case 'admin':
        return [
          _buildCategory(
              "Personnel Management",
              [
                _MenuItem(
                    icon: Icons.add_circle_outline,
                    label: "Add Student",
                    path: '/admin/add-student',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.add_circle_outline,
                    label: "Manage Staff",
                    path: '/admin/add-teacher',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.people,
                    label: "User Control",
                    path: '/admin/manage-users',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Scheduling System",
              [
                _MenuItem(
                    icon: Icons.table_chart,
                    label: "Timetable",
                    path: '/admin/timetable',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.table_chart,
                    label: "Edit Timetable",
                    path: '/admin/edit-timetable',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.calendar_month,
                    label: "Datesheet",
                    path: '/admin/datesheet',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Communication Hub",
              [
                _MenuItem(
                    icon: Icons.campaign,
                    label: "Publish Notice",
                    path: '/admin/global-notice',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.assignment,
                    label: "Notice Archive",
                    path: '/notice-feed',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Analytics & Reports",
              [
                _MenuItem(
                    icon: Icons.bar_chart,
                    label: "Performance",
                    path: '/admin/attendance-report',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
        ];
      case 'finance':
        return [
          _buildCategory(
              "Payments",
              [
                _MenuItem(
                    icon: Icons.add_circle_outline,
                    label: "Add Payment",
                    path: '/finance/add-payment',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.security,
                    label: "Payment Gateway",
                    path: '/finance/gateway',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Reports & Tracking",
              [
                _MenuItem(
                    icon: Icons.description,
                    label: "Finance Reports",
                    path: '/finance/reports',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
                _MenuItem(
                    icon: Icons.people,
                    label: "Fees Tracker",
                    path: '/finance/fees-tracker',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
          _buildCategory(
              "Setup / Configuration",
              [
                _MenuItem(
                    icon: Icons.security,
                    label: "Fee Setup",
                    path: '/finance/reports',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
        ];
      default:
        return [
          _buildCategory(
              "System",
              [
                _MenuItem(
                    icon: Icons.dashboard,
                    label: "Dashboard",
                    path: '/superadmin/dashboard',
                    onTap: _navigate,
                    isDarkMode: isDarkMode),
              ],
              isDarkMode),
        ];
    }
  }

  // --- THE FIXED SNAKE BORDER CATEGORY CARD (HEADING INSIDE) ---
  Widget _buildCategory(String title, List<Widget> items, bool isDarkMode) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(25),
        child: Stack(
          children: [
            Positioned.fill(
              child: Transform.scale(
                scale: 2.5,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: SweepGradient(
                      colors: [
                        Colors.transparent,
                        isDarkMode
                            ? const Color(0xFF7F1D1D)
                            : const Color(0xFFEF4444),
                        Colors.transparent,
                        isDarkMode
                            ? const Color(0xFF7F1D1D)
                            : const Color(0xFFEF4444),
                        Colors.transparent
                      ],
                      stops: const [0.0, 0.25, 0.5, 0.75, 1.0],
                    ),
                  ),
                )
                    .animate(onPlay: (c) => c.repeat())
                    .rotate(duration: 4.seconds),
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 400),
              margin: const EdgeInsets.all(2), // 2px snake border width
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(23),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 5, bottom: 12),
                    child: Text(
                      title.toUpperCase(),
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: isDarkMode
                              ? const Color(0xFF64748B)
                              : const Color(0xFF94A3B8),
                          letterSpacing: 1.5,
                          fontStyle: FontStyle.italic),
                    ),
                  ),
                  ...items,
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// --- HELPER COMPONENTS ---

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidColorCallback onTap;
  final bool isRed;

  const _QuickAction(
      {required this.icon,
      required this.label,
      required this.onTap,
      this.isRed = false});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1), blurRadius: 5)
                ]),
            child: Icon(icon,
                size: 18,
                color: isRed ? Colors.redAccent : const Color(0xFF42A5F5)),
          ),
          const SizedBox(height: 5),
          Text(label,
              style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.white)),
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String path;
  final Function(String) onTap;
  final bool isDarkMode; // 🔥 NAYA THEME STATE INJECT KIYA

  const _MenuItem(
      {required this.icon,
      required this.label,
      required this.path,
      required this.onTap,
      required this.isDarkMode}); // Required me add kar diya

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onTap(path),
      borderRadius: BorderRadius.circular(15),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 400),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDarkMode
                    ? const Color(0xFF7F1D1D).withOpacity(0.3)
                    : Colors.red.shade50,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(
                    color: isDarkMode
                        ? const Color(0xFF7F1D1D)
                        : Colors.red.shade100),
              ),
              child: const Icon(Icons.arrow_forward_ios,
                  color: Colors.redAccent,
                  size:
                      20), // Placeholder icon as previous one had no variable passed
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isDarkMode
                        ? const Color(0xFFF8FAFC)
                        : const Color(0xFF334155),
                    fontStyle: FontStyle.italic),
              ),
            ),
            Icon(Icons.chevron_right,
                color: isDarkMode ? Colors.white54 : Colors.black54, size: 20),
          ],
        ),
      ),
    );
  }
}

typedef VoidColorCallback = void Function();

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

// 🔥 ConsumerStatefulWidget so it listens to theme changes
class StudentTimetable extends ConsumerStatefulWidget {
  const StudentTimetable({super.key});

  @override
  ConsumerState<StudentTimetable> createState() => _StudentTimetableState();
}

class _StudentTimetableState extends ConsumerState<StudentTimetable> {
  Map<String, dynamic>? user;
  Map<String, dynamic>? timetable;
  bool loading = true;
  String activeDay = 'Monday';

  final List<Map<String, String>> daysMap = [
    {'short': 'Mon', 'full': 'Monday'},
    {'short': 'Tue', 'full': 'Tuesday'},
    {'short': 'Wed', 'full': 'Wednesday'},
    {'short': 'Thu', 'full': 'Thursday'},
    {'short': 'Fri', 'full': 'Friday'},
    {'short': 'Sat', 'full': 'Saturday'},
  ];

  @override
  void initState() {
    super.initState();
    _initDayAndData();
  }

  Future<void> _initDayAndData() async {
    // --- LIVE DAY DETECTION ---
    String todayName = DateFormat('EEEE').format(DateTime.now());
    setState(() {
      activeDay = todayName == 'Sunday' ? 'Monday' : todayName;
    });

    // --- GET USER GRADE ---
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      user = jsonDecode(userStr);
    }

    _fetchTimetable();
  }

  Future<void> _fetchTimetable() async {
    final grade = user?['grade'];
    if (grade == null) {
      if (mounted) setState(() => loading = false);
      return;
    }

    try {
      final response = await ApiClient.dio.get('/timetable/$grade');
      timetable = response.data;

      if (mounted) setState(() => loading = false);
    } catch (e) {
      print("Timetable sync failed: $e");
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();

    // Active day ka schedule nikaalna
    List<dynamic> currentPeriods = [];
    if (timetable != null && timetable!['schedule'] != null) {
      final scheduleList = timetable!['schedule'] as List<dynamic>;
      final todaySchedule = scheduleList.firstWhere(
        (d) => d['day'] == activeDay,
        orElse: () => null,
      );
      if (todaySchedule != null && todaySchedule['periods'] != null) {
        currentPeriods = todaySchedule['periods'];
      }
    }

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS FOR DARK/LIGHT MODE 🔥
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);

    return PopScope(
        canPop: false, // 1. Phone ke default back button se app exit ko roko
        onPopInvokedWithResult: (didPop, result) {
          if (didPop) return;

          // 2. Agar pichle pages hain toh wahan jao, warna direct Dashboard (Home) pe
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/');
          }
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          color: bgColor,
          child: Scaffold(
            backgroundColor: Colors.transparent, // Transparent for AnimatedContainer
            // --- NAYA CODE: RefreshIndicator ---
            body: RefreshIndicator(
              color: const Color(0xFF42A5F5),
              backgroundColor: cardColor,
              onRefresh: _fetchTimetable, // Asli API function laga diya!
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(), // FIXED
                padding: const EdgeInsets.only(bottom: 50), // FIXED: 50px
                child: Column(
                  children: [
                    // ==========================================================
                    // HEADER SECTION (Blue Gradient + Days Scroller)
                    // ==========================================================
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.only(top: 60, bottom: 50),
                      decoration: BoxDecoration(
                        color: const Color(0xFF42A5F5),
                        gradient: LinearGradient(
                          colors: isDarkMode 
                                ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                                : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                        boxShadow: const [
                          BoxShadow(
                              color: Colors.black12,
                              blurRadius: 15,
                              offset: Offset(0, 10))
                        ],
                      ),
                      child: Column(
                        children: [
                          // --- TOP BAR ---
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                // Back Button
                                GestureDetector(
                                  onTap: () {
                                    if (context.canPop()) {
                                      context.pop();
                                    } else {
                                      context.go('/');
                                    }
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                          color: Colors.white.withOpacity(0.1)),
                                    ),
                                    child: const Icon(Icons.arrow_back,
                                        color: Colors.white, size: 24),
                                  ),
                                ),

                                // Center Title
                                Column(
                                  children: [
                                    const Text(
                                      "Class Schedule",
                                      style: TextStyle(
                                          fontSize: 28,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                          fontStyle: FontStyle.italic,
                                          letterSpacing: -0.5),
                                    ),
                                    Text(
                                      user?['grade'] != null
                                          ? "Class: ${user!['grade']}"
                                          : "Not Assigned",
                                      style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white.withOpacity(0.8),
                                          letterSpacing: 2),
                                    ),
                                  ],
                                ),

                                // Right Icon (Clock)
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                        color: Colors.white.withOpacity(0.1)),
                                  ),
                                  child: const Icon(Icons.watch_later_outlined,
                                      color: Colors.white, size: 24),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 35),

                          // --- DAYS SCROLLER ---
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Row(
                              children: daysMap.map((day) {
                                bool isActive = activeDay == day['full'];
                                return GestureDetector(
                                  onTap: () =>
                                      setState(() => activeDay = day['full']!),
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 300),
                                    curve: Curves.easeOut,
                                    margin: const EdgeInsets.only(right: 12),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 20, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: isActive
                                          ? (isDarkMode ? const Color(0xFF0F172A) : Colors.white) // 🔥 ADAPTS TO THEME
                                          : Colors.white.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                          color: isActive
                                              ? (isDarkMode ? const Color(0xFF0F172A) : Colors.white)
                                              : Colors.white.withOpacity(0.2)),
                                      boxShadow: [
                                        BoxShadow(
                                          color: isActive
                                              ? Colors.black12
                                              : Colors.transparent,
                                          blurRadius: isActive ? 10.0 : 0.0,
                                          offset: isActive
                                              ? const Offset(0, 5)
                                              : Offset.zero,
                                        )
                                      ],
                                    ),
                                    child: Text(
                                      day['short']!,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w900,
                                        color: isActive
                                            ? const Color(0xFF42A5F5)
                                            : Colors.white.withOpacity(0.8),
                                        fontStyle: FontStyle.italic,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.5),
                        ],
                      ),
                    ),

                    // ==========================================================
                    // SCHEDULE LIST OVERLAPPING HEADER (-mt-10)
                    // ==========================================================
                    Transform.translate(
                      offset: const Offset(0, -30),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 400),
                          switchInCurve: Curves.easeOutBack,
                          switchOutCurve: Curves.easeIn,
                          transitionBuilder:
                              (Widget child, Animation<double> animation) {
                            return FadeTransition(
                              opacity: animation,
                              child: SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(0, 0.05),
                                  end: Offset.zero,
                                ).animate(animation),
                                child: child,
                              ),
                            );
                          },
                          child: currentPeriods.isNotEmpty
                              ? Column(
                                  key: ValueKey('filled_$activeDay'),
                                  children: currentPeriods.map((item) {
                                    return _buildPeriodCard(item, cardColor, borderColor, textColorPrimary, textColorSecondary, isDarkMode);
                                  }).toList(),
                                )
                              : _buildEmptyState(
                                  key: ValueKey('empty_$activeDay'), cardColor: cardColor, borderColor: borderColor),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ))),
    );
  }

  // --- PERIOD CARD UI DYNAMIC THEME PASSED ---
  Widget _buildPeriodCard(Map<String, dynamic> item, Color cardColor, Color borderColor, Color textColorPrimary, Color textColorSecondary, bool isDarkMode) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor, // 🔥 DYNAMIC BG
        borderRadius: BorderRadius.circular(40), 
        border: Border.all(color: borderColor), // 🔥 DYNAMIC BORDER
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)
        ],
      ),
      child: Row(
        children: [
          // Left Side: Time Block
          Container(
            padding: const EdgeInsets.only(right: 20),
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: borderColor)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.access_time_filled,
                    color: Color(0xFF42A5F5), size: 24),
                const SizedBox(height: 8),
                Text(
                  item['startTime'] ?? "--:--",
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: isDarkMode ? Colors.white38 : Colors.black38,
                      fontStyle: FontStyle.italic),
                  textAlign: TextAlign.center,
                ),
                Text(
                  "TO\n${item['endTime'] ?? '--:--'}",
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: isDarkMode ? Colors.white38 : Colors.black38,
                      fontStyle: FontStyle.italic,
                      height: 1.2),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),

          // Right Side: Subject Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (item['subject'] ?? "Unknown").toString().toUpperCase(),
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: textColorPrimary, // 🔥 DYNAMIC TEXT
                      fontStyle: FontStyle.italic),
                ),
                const SizedBox(height: 5),
                Row(
                  children: [
                    Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                            color: Color(0xFF42A5F5), shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "Teacher: ${item['teacherName'] ?? 'Not Assigned'}",
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: textColorSecondary, // 🔥 DYNAMIC TEXT
                            fontStyle: FontStyle.italic),
                        overflow: TextOverflow.visible,
                        maxLines: 2, 
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 15),
                // Room Pill
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.location_on,
                          size: 14, color: Color(0xFF42A5F5)),
                      const SizedBox(width: 6),
                      Text(
                        "ROOM: ${item['room']?.toString().toUpperCase() ?? 'N/A'}",
                        style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF42A5F5),
                            letterSpacing: 1.5,
                            fontStyle: FontStyle.italic),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- EMPTY STATE UI DYNAMIC THEME ---
  Widget _buildEmptyState({Key? key, required Color cardColor, required Color borderColor}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      key: key, 
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 80),
      decoration: BoxDecoration(
        color: cardColor, // 🔥 DYNAMIC BG
        borderRadius: BorderRadius.circular(55),
        border: Border.all(color: borderColor, width: 2), // 🔥 DYNAMIC BORDER
      ),
      child: const Column(
        children: [
          Icon(
            Icons.menu_book_rounded,
            color: Color(0xFFE2E8F0),
            size: 70,
          ),
          SizedBox(height: 15),
          Text(
            "Free from today's classes! ⚡",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: Color(0xFF94A3B8),
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}
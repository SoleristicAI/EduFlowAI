import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/network/api_client.dart';
import 'package:dio/dio.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

// 🔥 ConsumerStatefulWidget so it listens to theme changes
class StudentAttendance extends ConsumerStatefulWidget {
  const StudentAttendance({super.key});

  @override
  ConsumerState<StudentAttendance> createState() => _StudentAttendanceState();
}

class _StudentAttendanceState extends ConsumerState<StudentAttendance> {
  Map<String, dynamic>? stats;
  bool loading = true;
  DateTime currentMonth = DateTime(DateTime.now().year, DateTime.now().month);
  Map<String, dynamic>? selectedDateLog;
  final Map<String, dynamic> _monthlyCache = {};

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    String monthStr = DateFormat('yyyy-MM').format(currentMonth);

    if (_monthlyCache.containsKey(monthStr)) {
      setState(() {
        stats = _monthlyCache[monthStr];
        loading = false;
      });
      return;
    }

    try {
      final response =
          await ApiClient.dio.get('/attendance/student-stats?month=$monthStr');

      final data = response.data;

      _monthlyCache[monthStr] = data;

      setState(() {
        stats = data;
        loading = false;
      });
    } catch (e) {
      print("Attendance Sync Failed: $e");
    }
  }

  void _changeMonth(int offset) {
    setState(() {
      currentMonth = DateTime(currentMonth.year, currentMonth.month + offset);
      selectedDateLog = null; // Mahina badalte hi selection clear
    });
    _fetchStats();
  }

  Map<String, dynamic>? _getLogForDate(int day) {
    if (stats == null || stats!['history'] == null) return null;

    String dateStr = DateFormat('yyyy-MM-dd')
        .format(DateTime(currentMonth.year, currentMonth.month, day));

    for (var log in stats!['history']) {
      String logDateStr = log['date'].toString().split('T')[0];
      if (logDateStr == dateStr) {
        return log;
      }
    }
    return null;
  }

  void _handleDateClick(int day) {
    final log = _getLogForDate(day);
    DateTime clickedDate = DateTime(currentMonth.year, currentMonth.month, day);
    String formattedDate = DateFormat('d MMM yyyy, EEEE').format(clickedDate);

    setState(() {
      if (log != null) {
        selectedDateLog = {
          ...log,
          'formattedDate': formattedDate,
          'day': day, // Selection highlight ke liye
        };
      } else {
        selectedDateLog = {
          'status': 'Not Taken',
          'formattedDate': formattedDate,
          'day': day,
        };
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const CustomLoader(); // <--- TERA NAYA PREMIUM LOADER
    }

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS FOR DARK/LIGHT MODE 🔥
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF334155);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final Color subtleBgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return PopScope(
        canPop: false, // System ke default back button se app exit roko
        onPopInvokedWithResult: (didPop, result) {
          if (didPop) return;

          // Agar pichla page hai toh back, warna direct Dashboard
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
              // (NOTE: Agar tere attendance mein API call ka function '_fetchAttendance' hai toh wo likhna)
              onRefresh: () async {
                // Yahan tera attendance load hone wala function call hoga
                await Future.delayed(const Duration(
                    seconds:
                        1)); // Agar function nahi hai toh ye placeholder hai
                setState(() {});
              },
              child: SingleChildScrollView(
                physics:
                    const AlwaysScrollableScrollPhysics(), // FIXED: Pull to refresh ke liye
                padding: const EdgeInsets.only(
                    bottom: 50), // FIXED: 50px standard padding
                child: Column(
                  children: [
                    // ==========================================================
                    // 1. HEADER SECTION (Blue Curve)
                    // ==========================================================
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.only(top: 60, bottom: 40),
                      decoration: BoxDecoration(
                        color: const Color(0xFF42A5F5),
                        gradient: LinearGradient(
                            colors: isDarkMode 
                                ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                                : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.vertical(
                            bottom: Radius.circular(55)), // rounded-b-[3.5rem]
                        boxShadow: const [
                          BoxShadow(
                              color: Colors.black12,
                              blurRadius: 15,
                              offset: Offset(0, 10))
                        ],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        clipBehavior: Clip.none,
                        children: [
                          // Back Button
                          Positioned(
                            top: 0,
                            left: 24,
                            child: GestureDetector(
                              onTap: () {
                                // NAYA CODE: Upar wale back arrow ko bhi smart bana diya
                                if (context.canPop()) {
                                  context.pop();
                                } else {
                                  context.go('/');
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color:
                                          Colors.white.withValues(alpha: 0.2)),
                                ),
                                child: const Icon(Icons.arrow_back,
                                    color: Colors.white, size: 24),
                              ),
                            ),
                          ),

                          // Right CPU Icon
                          Positioned(
                            top: 0,
                            right: 24,
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.2)),
                              ),
                              child: const Icon(Icons.memory,
                                  color: Colors.white, size: 24),
                            ),
                          ),

                          // Attendance Circle
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const SizedBox(height: 20),
                              Stack(
                                alignment: Alignment.center,
                                children: [
                                  // Inner blur/color
                                  Container(
                                    width: 128,
                                    height: 128,
                                    decoration: BoxDecoration(
                                      color:
                                          Colors.white.withValues(alpha: 0.1),
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: Colors.white
                                              .withValues(alpha: 0.2),
                                          width: 6),
                                    ),
                                    child: Center(
                                      child: Text(
                                        "${stats?['percentage'] ?? 0}%",
                                        style: const TextStyle(
                                            fontSize: 32,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            letterSpacing: -1),
                                      ),
                                    ),
                                  ),
                                  // Outer glow border
                                  Container(
                                    width: 128,
                                    height: 128,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: Colors.white, width: 6),
                                      boxShadow: [
                                        BoxShadow(
                                            color: Colors.white
                                                .withValues(alpha: 0.3),
                                            blurRadius: 20,
                                            spreadRadius: 0)
                                      ],
                                    ),
                                  ),
                                ],
                              ).animate().scale(
                                  duration: 500.ms, curve: Curves.easeOutBack),
                              const SizedBox(height: 16),
                              const Text(
                                "Attendance Percentage %",
                                style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    fontStyle: FontStyle.italic),
                              )
                                  .animate()
                                  .fadeIn(delay: 200.ms)
                                  .slideY(begin: 0.5),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // ==========================================================
                    // 2. STATS CARDS
                    // ==========================================================
                    Transform.translate(
                      offset: const Offset(0, -25), // -mt-8 equivalent
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                _buildStatCard(
                                    "Total days",
                                    stats?['totalDays']?.toString() ?? '0',
                                    isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFFFFFFF),
                                    isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF475569),
                                    Icons.calendar_month,
                                    const Color(0xFF2196F3),
                                    borderColor),
                                const SizedBox(width: 12),
                                _buildStatCard(
                                    "Present",
                                    stats?['presentDays']?.toString() ?? '0',
                                    isDarkMode ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFE0F2F1),
                                    isDarkMode ? const Color(0xFF34D399) : const Color(0xFF059669),
                                    Icons.check_circle,
                                    const Color(0xFF10B981),
                                    isDarkMode ? const Color(0xFF064E3B) : const Color(0xFFDDE3EA)),
                                const SizedBox(width: 12),
                                _buildStatCard(
                                    "Absent",
                                    stats?['absentDays']?.toString() ?? '0',
                                    isDarkMode ? const Color(0xFF881337).withOpacity(0.3) : const Color(0xFFFFEBEE),
                                    isDarkMode ? const Color(0xFFFB7185) : const Color(0xFFE11D48),
                                    Icons.cancel,
                                    const Color(0xFFF43F5E),
                                    isDarkMode ? const Color(0xFF881337) : const Color(0xFFDDE3EA)),
                              ],
                            )
                                .animate()
                                .fadeIn(delay: 300.ms)
                                .slideY(begin: 0.2),

                            const SizedBox(height: 24),

                            // ==========================================================
                            // 3. MONTH NAVIGATOR
                            // ==========================================================
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 400),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 16),
                              decoration: BoxDecoration(
                                color: cardColor,
                                borderRadius: BorderRadius.circular(30),
                                border: Border.all(color: borderColor),
                                boxShadow: [
                                  BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.02),
                                      blurRadius: 5,
                                      offset: const Offset(0, 2))
                                ],
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  GestureDetector(
                                    onTap: () => _changeMonth(-1),
                                    child: const Icon(Icons.chevron_left,
                                        size: 30, color: Color(0xFF94A3B8)),
                                  ),
                                  Row(
                                    children: [
                                      const Icon(Icons.calendar_month,
                                          size: 22, color: Color(0xFF42A5F5)),
                                      const SizedBox(width: 8),
                                      Text(
                                        DateFormat('MMMM yyyy')
                                            .format(currentMonth),
                                        style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: textColorPrimary,
                                            fontStyle: FontStyle.italic),
                                      ),
                                    ],
                                  ),
                                  GestureDetector(
                                    onTap: () => _changeMonth(1),
                                    child: const Icon(Icons.chevron_right,
                                        size: 30, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ),
                            )
                                .animate()
                                .fadeIn(delay: 400.ms)
                                .slideY(begin: 0.2),

                            const SizedBox(height: 24),

                            // ==========================================================
                            // 4. CALENDAR BOARD
                            // ==========================================================
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 400),
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: cardColor,
                                borderRadius: BorderRadius.circular(50),
                                border: Border.all(color: borderColor),
                                boxShadow: [
                                  BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.05),
                                      blurRadius: 20,
                                      offset: const Offset(0, 10))
                                ],
                              ),
                              child: Column(
                                children: [
                                  // Days Header (Mo, Tu, We...)
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceAround,
                                    children: [
                                      "MO",
                                      "TU",
                                      "WE",
                                      "TH",
                                      "FR",
                                      "SA",
                                      "SU"
                                    ]
                                        .map((d) => SizedBox(
                                              width: 35,
                                              child: Text(d,
                                                  textAlign: TextAlign.center,
                                                  style: const TextStyle(
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: Color(0xFF94A3B8),
                                                      letterSpacing: 1)),
                                            ))
                                        .toList(),
                                  ),
                                  const SizedBox(height: 15),

                                  // Dates Grid
                                  _buildCalendarGrid(isDarkMode, subtleBgColor),
                                ],
                              ),
                            )
                                .animate()
                                .fadeIn(delay: 500.ms)
                                .slideY(begin: 0.2),

                            const SizedBox(height: 24),

                            // ==========================================================
                            // 5. SELECTED DATE DETAILS CARD
                            // ==========================================================
                            AnimatedSize(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeOutBack,
                              child: selectedDateLog != null
                                  ? AnimatedContainer(
                                      duration: const Duration(milliseconds: 400),
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(30),
                                      decoration: BoxDecoration(
                                        color: cardColor,
                                        borderRadius: BorderRadius.circular(45),
                                        border: Border.all(
                                            color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade50,
                                            width: 4),
                                        boxShadow: [
                                          BoxShadow(
                                              color: Colors.black
                                                  .withValues(alpha: 0.08),
                                              blurRadius: 25,
                                              offset: const Offset(0, 10))
                                        ],
                                      ),
                                      child: Column(
                                        children: [
                                          Text(
                                            selectedDateLog!['formattedDate']
                                                .toString()
                                                .toUpperCase(),
                                            style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w900,
                                                color: textColorPrimary,
                                                letterSpacing: 2),
                                          ),
                                          const SizedBox(height: 20),
                                          _buildStatusContent(
                                              selectedDateLog!['status'], isDarkMode, subtleBgColor, borderColor),
                                        ],
                                      ),
                                    ).animate().fadeIn().slideY(begin: 0.5)
                                  : const SizedBox.shrink(),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ))),
    );
  }

  // --- WIDGET BUILDERS ---

  Widget _buildStatCard(String label, String value, Color bg, Color textColor,
      IconData icon, Color iconColor, Color borderColor) {
    return Expanded(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        height: 110,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: borderColor),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.02), blurRadius: 5)
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor, size: 22),
            const SizedBox(height: 6),
            Text(value,
                style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: textColor)),
            Text(label,
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: textColor.withValues(alpha: 0.7),
                    fontStyle: FontStyle.italic)),
          ],
        ),
      ),
    );
  }

  Widget _buildCalendarGrid(bool isDarkMode, Color subtleBgColor) {
    int daysInMonth =
        DateTime(currentMonth.year, currentMonth.month + 1, 0).day;
    int firstWeekday = DateTime(currentMonth.year, currentMonth.month, 1)
        .weekday; // 1 = Monday, 7 = Sunday
    int emptySlots = firstWeekday - 1; // Array math (Monday starts at index 0)

    int totalCells = daysInMonth + emptySlots;
    int rows = (totalCells / 7).ceil();

    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 7,
        childAspectRatio: 1.0,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: rows * 7,
      itemBuilder: (context, index) {
        if (index < emptySlots || index >= totalCells) {
          return const SizedBox.shrink(); // Empty space
        }

        int day = index - emptySlots + 1;
        final log = _getLogForDate(day);
        bool isSelected =
            selectedDateLog != null && selectedDateLog!['day'] == day;

        // Default Style dynamically adapting to theme
        Color bgColor = subtleBgColor;
        Color textColor = isDarkMode ? const Color(0xFFCBD5E1) : const Color(0xFF475569);
        Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
        Color? dotColor;

        if (log != null) {
          if (log['status'] == 'Present') {
            bgColor = isDarkMode ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5);
            textColor = isDarkMode ? const Color(0xFF34D399) : const Color(0xFF059669);
            borderColor = isDarkMode ? const Color(0xFF064E3B) : const Color(0xFFA7F3D0);
            dotColor = const Color(0xFF10B981);
          } else if (log['status'] == 'Absent') {
            bgColor = isDarkMode ? const Color(0xFF881337).withOpacity(0.3) : const Color(0xFFFFF1F2);
            textColor = isDarkMode ? const Color(0xFFFB7185) : const Color(0xFFE11D48);
            borderColor = isDarkMode ? const Color(0xFF881337) : const Color(0xFFFECDD3);
            dotColor = const Color(0xFFF43F5E);
          } else if (log['status'] == 'On Leave') {
            bgColor = isDarkMode ? const Color(0xFF78350F).withOpacity(0.3) : const Color(0xFFFFFBEB);
            textColor = isDarkMode ? const Color(0xFFFBBF24) : const Color(0xFFD97706);
            borderColor = isDarkMode ? const Color(0xFF78350F) : const Color(0xFFFDE68A);
            dotColor = const Color(0xFFF59E0B);
          }
        }

        return GestureDetector(
          onTap: () => _handleDateClick(day),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                  color: isSelected ? Colors.blue.shade400 : borderColor,
                  width: isSelected ? 2 : 1),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                          color: Colors.blue.withValues(alpha: 0.3),
                          blurRadius: 8)
                    ]
                  : [],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Text(
                  day.toString(),
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: textColor),
                ),
                if (dotColor != null)
                  Positioned(
                    bottom: 6,
                    child: Container(
                        width: 4,
                        height: 4,
                        decoration: BoxDecoration(
                            color: dotColor, shape: BoxShape.circle)),
                  )
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusContent(String status, bool isDarkMode, Color subtleBgColor, Color themeBorderColor) {
    IconData icon;
    Color color;
    Color bgColor;
    Color borderColor;
    String title;
    String subtitle;

    if (status == 'Present') {
      icon = Icons.check_circle;
      color = isDarkMode ? const Color(0xFF34D399) : const Color(0xFF059669);
      bgColor = isDarkMode ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5);
      borderColor = isDarkMode ? const Color(0xFF064E3B) : const Color(0xFFA7F3D0);
      title = "PRESENT";
      subtitle = "Verified by EduFlowAI System";
    } else if (status == 'Absent') {
      icon = Icons.cancel;
      color = isDarkMode ? const Color(0xFFFB7185) : const Color(0xFFE11D48);
      bgColor = isDarkMode ? const Color(0xFF881337).withOpacity(0.3) : const Color(0xFFFFF1F2);
      borderColor = isDarkMode ? const Color(0xFF881337) : const Color(0xFFFECDD3);
      title = "ABSENT";
      subtitle = "Verified by EduFlowAI System";
    } else if (status == 'On Leave') {
      icon = Icons.lock;
      color = isDarkMode ? const Color(0xFFFBBF24) : const Color(0xFFD97706);
      bgColor = isDarkMode ? const Color(0xFF78350F).withOpacity(0.3) : const Color(0xFFFFFBEB);
      borderColor = isDarkMode ? const Color(0xFF78350F) : const Color(0xFFFDE68A);
      title = "ON LEAVE";
      subtitle = "Approved by Teacher";
    } else {
      icon = Icons.calendar_month;
      color = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
      bgColor = subtleBgColor;
      borderColor = themeBorderColor;
      title = "NO RECORD";
      subtitle = "Attendance was not registered for this day.";
    }

    return Column(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: bgColor,
            shape: BoxShape.circle,
            border: Border.all(color: borderColor, width: 2),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  spreadRadius: 2)
            ],
          ),
          child: Icon(icon, size: 40, color: color),
        ),
        const SizedBox(height: 15),
        Text(title,
            style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: color,
                letterSpacing: 1)),
        const SizedBox(height: 5),
        Text(subtitle,
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF94A3B8),
                fontStyle: FontStyle.italic)),
      ],
    );
  }
}
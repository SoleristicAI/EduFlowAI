import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA THEME PROVIDER

// 🔥 ConsumerStatefulWidget for Global Theme
class StudentHome extends ConsumerStatefulWidget {
  final String searchQuery;
  final Map<String, dynamic>? user;

  const StudentHome({super.key, required this.searchQuery, this.user});

  @override
  ConsumerState<StudentHome> createState() => _StudentHomeState();
}

class _StudentHomeState extends ConsumerState<StudentHome> {
  bool isExpanded = false;

  // --- DATA MODELS ---
  final topRowModules = [
    {
      'title': 'Attendance',
      'icon': Icons.calendar_month,
      'path': '/attendance',
      'bg': 0xFFFFEBEE,
      'iconBg': 0xFFFFCDD2,
      'iconColor': 0xFFE53935,
      // Dark Mode Colors
      'darkBg': 0xFF4C0519,
      'darkIconBg': 0xFF881337,
      'darkIconColor': 0xFFFDA4AF,
    },
    {
      'title': 'TimeTable',
      'icon': Icons.access_time,
      'path': '/timetable',
      'bg': 0xFFE8EAF6,
      'iconBg': 0xFFC5CAE9,
      'iconColor': 0xFF3F51B5,
      // Dark Mode Colors
      'darkBg': 0xFF172554,
      'darkIconBg': 0xFF1E3A8A,
      'darkIconColor': 0xFF93C5FD,
    },
  ];

  final bottomRowModules = [
    {
      'title': 'Fees',
      'icon': Icons.credit_card,
      'path': '/student/fees',
      'bg': 0xFFE0F2F1,
      'iconBg': 0xFFB2DFDB,
      'iconColor': 0xFF00897B,
      'darkBg': 0xFF064E3B,
      'darkIconBg': 0xFF047857,
      'darkIconColor': 0xFF6EE7B7,
    },
    {
      'title': 'Class Diary',
      'icon': Icons.menu_book,
      'path': '/class-diary',
      'bg': 0xFFE3F2FD,
      'iconBg': 0xFFBBDEFB,
      'iconColor': 0xFF1E88E5,
      'darkBg': 0xFF0C4A6E,
      'darkIconBg': 0xFF0369A1,
      'darkIconColor': 0xFF7DD3FC,
    },
    {
      'title': 'Notices',
      'icon': Icons.campaign,
      'path': '/notice-feed',
      'bg': 0xFFFFF3E0,
      'iconBg': 0xFFFFE0B2,
      'iconColor': 0xFFFB8C00,
      'darkBg': 0xFF451A03,
      'darkIconBg': 0xFF78350F,
      'darkIconColor': 0xFFFDBA74,
    },
  ];

  final subModules = [
    {'title': 'Assignment', 'icon': Icons.assignment, 'path': '/assignments'},
    {'title': 'ERP Notices', 'icon': Icons.notifications, 'path': '/erp-notices'},
    {'title': 'Performance', 'icon': Icons.trending_up, 'path': '/performance'},
    {'title': 'Mentorship', 'icon': Icons.people, 'path': '/mentors'},
    {'title': 'Holidays', 'icon': Icons.calendar_month, 'path': '/holidays'},
    {'title': 'Leave Request', 'icon': Icons.list_alt, 'path': '/leave'},
    {'title': 'My Subjects', 'icon': Icons.menu_book, 'path': '/my-subjects'},
    {'title': 'Live Class', 'icon': Icons.videocam, 'path': '/live-classes'},
  ];

  final extraModules = [
    {'title': 'Bus Tracker', 'icon': Icons.directions_bus, 'path': '/transport'},
    {'title': 'Library', 'icon': Icons.book, 'path': '/library'},
    {'title': 'Feedback', 'icon': Icons.message, 'path': '/feedback'},
  ];

  final examModules = [
    {
      'title': 'Syllabus',
      'icon': Icons.menu_book,
      'path': '/syllabus',
      'bg': 0xFFE0F7FA,
      'iconBg': 0xFFB2EBF2,
      'iconColor': 0xFF0097A7,
      'darkBg': 0xFF164E63,
      'darkIconBg': 0xFF0891B2,
      'darkIconColor': 0xFF67E8F9,
    },
    {
      'title': 'Date Sheet',
      'icon': Icons.calendar_month,
      'path': '/exam-datesheet',
      'bg': 0xFFFFF4E5,
      'iconBg': 0xFFFFE0B2,
      'iconColor': 0xFFFB8C00,
      'darkBg': 0xFF451A03,
      'darkIconBg': 0xFF78350F,
      'darkIconColor': 0xFFFDBA74,
    },
    {
      'title': 'Admit Card',
      'icon': Icons.fact_check,
      'path': '/admit-card',
      'bg': 0xFFE3F2FD,
      'iconBg': 0xFFBBDEFB,
      'iconColor': 0xFF1E88E5,
      'darkBg': 0xFF0C4A6E,
      'darkIconBg': 0xFF0369A1,
      'darkIconColor': 0xFF7DD3FC,
    },
    {
      'title': 'Results',
      'icon': Icons.bar_chart,
      'path': '/exam-results',
      'bg': 0xFFE8F5E9,
      'iconBg': 0xFFC8E6C9,
      'iconColor': 0xFF43A047,
      'darkBg': 0xFF064E3B,
      'darkIconBg': 0xFF047857,
      'darkIconColor': 0xFF6EE7B7,
    },
  ];

  DateTime? _lastPressedAt;

  @override
  Widget build(BuildContext context) {
    final query = widget.searchQuery.toLowerCase();
    final filteredSub = subModules
        .where((m) => (m['title'] as String).toLowerCase().contains(query))
        .toList();
    final filteredExtra = extraModules
        .where((m) => (m['title'] as String).toLowerCase().contains(query))
        .toList();
    final noResults = filteredSub.isEmpty && filteredExtra.isEmpty;

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS FOR DASHBOARD PANELS 🔥
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final Color subModuleBg = isDarkMode ? const Color(0xFF0C4A6E) : const Color(0xFFE3F2FD);
    final Color subModuleIconBg = isDarkMode ? const Color(0xFF0C4A6E) : Colors.blue.shade50;
    final Color subModuleIconColor = isDarkMode ? const Color(0xFF7DD3FC) : const Color(0xFF2196F3);

    return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {
          if (didPop) return;

          final now = DateTime.now();
          if (_lastPressedAt == null ||
              now.difference(_lastPressedAt!) > const Duration(seconds: 2)) {
            _lastPressedAt = now;
            // Premium Toast/Snackbar
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                elevation: 0,
                backgroundColor: Colors.transparent,
                duration: const Duration(seconds: 2),
                behavior: SnackBarBehavior.floating,
                margin: const EdgeInsets.only(
                  bottom: 740,
                  left: 35,
                  right: 35,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                ),
                content: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 22,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.36),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.18),
                      width: 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withValues(alpha: 0.04),
                        blurRadius: 25,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Text(
                    "Press BACK again to EXIT app",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontStyle: FontStyle.italic,
                      color: Color(0xFFE2E8F0),
                      fontSize: 10,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            );
          } else {
            SystemNavigator.pop();
          }
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          color: bgColor,
          child: Padding(
            padding: const EdgeInsets.only(top: 15, left: 20, right: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // --- 1. TOP ROW MODULES (2x1) ---
                Row(
                  children: topRowModules
                      .map((m) => Expanded(
                            child: Padding(
                              padding: EdgeInsets.only(
                                  right: m == topRowModules.first ? 10 : 0,
                                  left: m == topRowModules.last ? 10 : 0),
                              child: _buildLargeModuleCard(m, isDarkMode),
                            ),
                          ))
                      .toList(),
                ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

                const SizedBox(height: 12),

                // --- 2. BOTTOM ROW MODULES (3x1) ---
                Row(
                  children: bottomRowModules
                      .map((m) => Expanded(
                            child: Padding(
                              padding: EdgeInsets.only(
                                right: m == bottomRowModules.last ? 0 : 8,
                                left: m == bottomRowModules.first ? 0 : 8,
                              ),
                              child: _buildSmallModuleCard(m, isDarkMode),
                            ),
                          ))
                      .toList(),
                )
                    .animate()
                    .fadeIn(delay: 100.ms, duration: 400.ms)
                    .slideY(begin: 0.1),

                const SizedBox(height: 20),

                // --- 3. SUB MODULES & SEARCH RESULTS ---
                AnimatedContainer(
                  duration: const Duration(milliseconds: 400),
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                  decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(color: borderColor),
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 10,
                          offset: const Offset(0, 5))
                    ],
                  ),
                  child: noResults
                      ? _buildNoResults()
                      : Column(
                          children: [
                            GridView.builder(
                              physics: const NeverScrollableScrollPhysics(),
                              shrinkWrap: true,
                              padding: EdgeInsets.zero,
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 4,
                                childAspectRatio: 0.8,
                                crossAxisSpacing: 2,
                                mainAxisSpacing: 5,
                              ),
                              itemCount: filteredSub.length,
                              itemBuilder: (context, i) =>
                                  _buildSubModuleItem(filteredSub[i], textColorSecondary, subModuleBg, subModuleIconBg, subModuleIconColor),
                            ),

                            // Expandable Section
                            AnimatedSize(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                              child: (isExpanded || widget.searchQuery.isNotEmpty)
                                  ? GridView.builder(
                                      physics: const NeverScrollableScrollPhysics(),
                                      shrinkWrap: true,
                                      padding: const EdgeInsets.only(top: 5),
                                      gridDelegate:
                                          const SliverGridDelegateWithFixedCrossAxisCount(
                                        crossAxisCount: 4,
                                        childAspectRatio: 0.8,
                                        crossAxisSpacing: 2,
                                        mainAxisSpacing: 5,
                                      ),
                                      itemCount: filteredExtra.length,
                                      itemBuilder: (context, i) =>
                                          _buildSubModuleItem(filteredExtra[i], textColorSecondary, subModuleBg, subModuleIconBg, subModuleIconColor),
                                    ).animate().fadeIn()
                                  : const SizedBox.shrink(),
                            ),

                            // Toggle Button
                            if (widget.searchQuery.isEmpty) ...[
                              const SizedBox(height: 5),
                              GestureDetector(
                                onTap: () =>
                                    setState(() => isExpanded = !isExpanded),
                                child: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: BoxDecoration(
                                    color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: borderColor),
                                  ),
                                  child: Icon(
                                    isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                    color: const Color(0xFF94A3B8),
                                    size: 20,
                                  ),
                                ),
                              ),
                            ]
                          ],
                        ),
                )
                    .animate()
                    .fadeIn(delay: 200.ms, duration: 400.ms)
                    .slideY(begin: 0.1),

                const SizedBox(height: 20),

                // --- 4. EXAMINATION HUB ---
                AnimatedContainer(
                  duration: const Duration(milliseconds: 400),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(color: borderColor),
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 15,
                          offset: const Offset(0, 5))
                    ],
                  ),
                  child: Column(
                    children: [
                      // Heading Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Examination Hub",
                            style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: textColorPrimary,
                                fontStyle: FontStyle.italic),
                          ),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isDarkMode ? const Color(0xFF3B0764) : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: isDarkMode ? const Color(0xFF581C87) : const Color(0xFFF1F5F9)),
                              boxShadow: [
                                BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 5)
                              ],
                            ),
                            child: Icon(Icons.school,
                                color: isDarkMode ? const Color(0xFFD8B4FE) : const Color(0xFF7E57C2), size: 22),
                          ),
                        ],
                      ),
                      const SizedBox(height: 15),

                      // Grid
                      GridView.builder(
                        physics: const NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 2.8,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: examModules.length,
                        itemBuilder: (context, i) =>
                            _buildExamModuleCard(examModules[i], isDarkMode),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(delay: 300.ms, duration: 400.ms)
                    .slideY(begin: 0.1),

                const SizedBox(height: 140),
              ],
            ),
          ),
        ));
  }

  // ==========================================================
  // WIDGET BUILDERS (Adapted for Dark Mode)
  // ==========================================================

  Widget _buildLargeModuleCard(Map<String, dynamic> m, bool isDarkMode) {
    Color bgColor = isDarkMode ? Color(m['darkBg']) : Color(m['bg']);
    Color iconBg = isDarkMode ? Color(m['darkIconBg']) : Color(m['iconBg']);
    Color iconColor = isDarkMode ? Color(m['darkIconColor']) : Color(m['iconColor']);
    Color textColor = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);

    return GestureDetector(
      onTap: () => context.go(m['path']),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        height: 120,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(40),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.02), blurRadius: 5)
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              bottom: -20,
              right: -20,
              child: Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: isDarkMode ? 0.1 : 0.4),
                    shape: BoxShape.circle),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  m['title'],
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: textColor,
                      fontStyle: FontStyle.italic),
                ),
                Align(
                  alignment: Alignment.bottomRight,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                        color: iconBg,
                        borderRadius: BorderRadius.circular(20)),
                    child:
                        Icon(m['icon'], color: iconColor, size: 28),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmallModuleCard(Map<String, dynamic> m, bool isDarkMode) {
    Color bgColor = isDarkMode ? Color(m['darkBg']) : Color(m['bg']);
    Color iconBg = isDarkMode ? Color(m['darkIconBg']) : Color(m['iconBg']);
    Color iconColor = isDarkMode ? Color(m['darkIconColor']) : Color(m['iconColor']);
    Color textColor = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);

    return GestureDetector(
      onTap: () => context.go(m['path']),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        height: 100,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.02), blurRadius: 5)
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              m['title'],
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: textColor,
                  fontStyle: FontStyle.italic,
                  height: 1.1),
            ),
            Align(
              alignment: Alignment.bottomRight,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(15)),
                child: Icon(m['icon'], color: iconColor, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubModuleItem(Map<String, dynamic> sm, Color textColor, Color bg, Color border, Color iconColor) {
    String formattedTitle = (sm['title'] as String).replaceFirst(' ', '\n');

    return GestureDetector(
      onTap: () => context.go(sm['path']),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: border),
            ),
            child: Icon(sm['icon'], color: iconColor, size: 20),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: Text(
              formattedTitle,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.visible,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w900,
                color: textColor,
                height: 1.1,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExamModuleCard(Map<String, dynamic> m, bool isDarkMode) {
    Color bgColor = isDarkMode ? Color(m['darkBg']) : Color(m['bg']);
    Color iconBg = isDarkMode ? Color(m['darkIconBg']) : Color(m['iconBg']);
    Color iconColor = isDarkMode ? Color(m['darkIconColor']) : Color(m['iconColor']);
    Color textColor = isDarkMode ? const Color(0xFFCBD5E1) : const Color(0xFF334155);

    return GestureDetector(
      onTap: () => context.go(m['path']),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(25),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                m['title'],
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: textColor,
                    fontStyle: FontStyle.italic),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(15)),
              child: Icon(m['icon'], color: iconColor, size: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoResults() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          const Icon(Icons.smart_toy, size: 48, color: Color(0xFFE2E8F0))
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .slideY(begin: -0.2, end: 0.2, duration: 1.seconds),
          const SizedBox(height: 15),
          const Text(
            "NO MODULE FOUND...",
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF94A3B8),
                fontStyle: FontStyle.italic,
                letterSpacing: 2),
          ),
        ],
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // 🔥 YAHAN IMPORT ADD KIYA EXIT KE LIYE
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';

class TeacherHome extends ConsumerStatefulWidget {
  final String searchQuery;

  const TeacherHome({super.key, this.searchQuery = ''});

  @override
  ConsumerState<TeacherHome> createState() => _TeacherHomeState();
}

class _TeacherHomeState extends ConsumerState<TeacherHome> {
  int supportCount = 0;
  int studentCount = 0;
  DateTime? _lastPressedAt; // 🔥 NAYA VARIABLE BACK-PRESS TRACK KARNE KE LIYE

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  // 🔥 SILENT FETCH: Koi loader nahi lagega is page par as per strict rule 🔥
  Future<void> _fetchStats() async {
    try {
      final studentRes = await ApiClient.dio.get('/auth/student-stats');
      if (mounted && studentRes.data != null) {
        setState(() {
          studentCount = int.tryParse(studentRes.data['totalStudents'].toString()) ?? 120;
        });
      }

      final supportRes = await ApiClient.dio.get('/support/pending-count');
      if (mounted && supportRes.data != null) {
        setState(() {
          supportCount = int.tryParse(supportRes.data['count'].toString()) ?? 0;
        });
      }
    } catch (err) {
      debugPrint("Teacher Stats Fetch Error: $err");
      if (mounted) setState(() => studentCount = 120);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF475569);

    final List<Map<String, dynamic>> teacherModules = [
      {'title': 'Attendance', 'icon': Icons.check_box_outlined, 'path': '/teacher/attendance'},
      {'title': 'Schedule', 'icon': Icons.calendar_month_outlined, 'path': '/teacher/timetable'},
      {'title': 'Broadcast', 'icon': Icons.smart_toy_outlined, 'path': '/teacher/notices'},
      {'title': 'Support center', 'icon': Icons.chat_bubble_outline, 'path': '/teacher/support'},
      {'title': 'Notice feed', 'icon': Icons.campaign_outlined, 'path': '/notice-feed'},
      {'title': 'Class list', 'icon': Icons.people_outline, 'path': '/teacher/students'},
      {'title': 'Assignments', 'icon': Icons.note_add_outlined, 'path': '/teacher/assignments'},
      {'title': 'Syllabus', 'icon': Icons.layers_outlined, 'path': '/teacher/upload-syllabus'},
      {'title': 'Live class', 'icon': Icons.videocam_outlined, 'path': '/teacher/live-class'},
      {'title': 'Exam Datesheet', 'icon': Icons.event_note_outlined, 'path': '/teacher/datesheet'},
      {'title': 'Exam Results', 'icon': Icons.bar_chart_outlined, 'path': '/teacher/results'},
      {'title': 'Academic Calendar', 'icon': Icons.calendar_month, 'path': '/teacher/calendar'},
    ];

    // Search Filtering
    final filteredModules = teacherModules.where((m) {
      return m['title'].toString().toLowerCase().contains(widget.searchQuery.toLowerCase());
    }).toList();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;

        final now = DateTime.now();
        if (_lastPressedAt == null ||
            now.difference(_lastPressedAt!) > const Duration(seconds: 2)) {
          _lastPressedAt = now;
          // 🔥 PREMIUM TOAST JAISA STUDENT HOME MEIN THA 🔥
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
        child: SingleChildScrollView(
          // 🔥 KOI REFRESH INDICATOR NAHI HAI YAHAN 🔥
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.only(top: 20, bottom: 140),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // --- GRID MODULES ---
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filteredModules.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 20,
                    mainAxisSpacing: 20,
                    childAspectRatio: 0.9,
                  ),
                  itemBuilder: (context, index) {
                    final module = filteredModules[index];
                    final isSupport = module['title'] == 'Support center';

                    return GestureDetector(
                      onTap: () => context.go(module['path']),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: cardColor,
                          borderRadius: BorderRadius.circular(40),
                          border: Border.all(color: cardBorder),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
                        ),
                        child: Stack(
                          clipBehavior: Clip.none,
                          alignment: Alignment.center,
                          children: [
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50,
                                    borderRadius: BorderRadius.circular(25),
                                  ),
                                  child: Icon(module['icon'], size: 32, color: const Color(0xFF42A5F5)),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  module['title'].toString().toUpperCase(),
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textPrimary, fontStyle: FontStyle.italic, letterSpacing: 0.5),
                                ),
                              ],
                            ),
                            
                            // Support Center Pulse Badge
                            if (isSupport && supportCount > 0)
                              Positioned(
                                top: -5, right: -5,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEF4444),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: cardColor, width: 2),
                                    boxShadow: [BoxShadow(color: const Color(0xFFEF4444).withOpacity(0.5), blurRadius: 8)],
                                  ),
                                  child: Text(
                                    supportCount.toString(),
                                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                                  ),
                                ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1)),
                              ),
                          ],
                        ),
                      ),
                    ).animate().scale(delay: Duration(milliseconds: 50 * index), duration: 400.ms, curve: Curves.easeOutBack);
                  },
                ),

                const SizedBox(height: 32),

                // --- STAFF BRIEFING CARD ---
                AnimatedContainer(
                  duration: const Duration(milliseconds: 400),
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(48),
                    border: Border.all(color: cardBorder),
                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
                  ),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.auto_graph, color: Color(0xFF42A5F5), size: 24).animate(onPlay: (c) => c.repeat(reverse: true)).fade(begin: 0.5, end: 1),
                              const SizedBox(width: 12),
                              Text(
                                "PERSONNEL BRIEFING",
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isDarkMode ? Colors.white : const Color(0xFF1E293B), fontStyle: FontStyle.italic, letterSpacing: -0.5),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            "Empowering education, one step at a time.",
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), fontStyle: FontStyle.italic, height: 1.5),
                          ),
                          const SizedBox(height: 32),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF42A5F5),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
                            ),
                            child: const Text("KNOWLEDGE", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                          ).animate().scale(delay: 500.ms, curve: Curves.easeOutBack),
                        ],
                      ),
                      Positioned(
                        right: -20, bottom: -20,
                        child: Container(
                          width: 100, height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF42A5F5).withOpacity(isDarkMode ? 0.1 : 0.05),
                          ),
                        ),
                      )
                    ],
                  ),
                ).animate().fadeIn().slideY(begin: 0.1),

              ],
            ),
          ),
        ),
      ),
    );
  }
}
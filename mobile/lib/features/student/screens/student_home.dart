import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/services.dart';

class StudentHome extends StatefulWidget {
  final String searchQuery;
  // User data parameter if you want to pass it
  final Map<String, dynamic>? user;

  const StudentHome({super.key, required this.searchQuery, this.user});

  @override
  State<StudentHome> createState() => _StudentHomeState();
}

class _StudentHomeState extends State<StudentHome> {
  bool isExpanded = false;

  // --- DATA MODELS (Exact match to your React code) ---
  final topRowModules = [
    {
      'title': 'Attendance',
      'icon': Icons.calendar_month,
      'path': '/attendance',
      'bg': 0xFFFFEBEE,
      'iconBg': 0xFFFFCDD2,
      'iconColor': 0xFFE53935
    },
    {
      'title': 'TimeTable',
      'icon': Icons.access_time,
      'path': '/timetable',
      'bg': 0xFFE8EAF6,
      'iconBg': 0xFFC5CAE9,
      'iconColor': 0xFF3F51B5
    },
  ];

  final bottomRowModules = [
    {
      'title': 'Fees',
      'icon': Icons.credit_card,
      'path': '/student/fees',
      'bg': 0xFFE0F2F1,
      'iconBg': 0xFFB2DFDB,
      'iconColor': 0xFF00897B
    },
    {
      'title': 'Class Diary',
      'icon': Icons.menu_book,
      'path': '/class-diary',
      'bg': 0xFFE3F2FD,
      'iconBg': 0xFFBBDEFB,
      'iconColor': 0xFF1E88E5
    },
    {
      'title': 'Notices',
      'icon': Icons.campaign,
      'path': '/notice-feed',
      'bg': 0xFFFFF3E0,
      'iconBg': 0xFFFFE0B2,
      'iconColor': 0xFFFB8C00
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
    {
      'title': 'Bus Tracker',
      'icon': Icons.directions_bus,
      'path': '/transport'
    },
    {'title': 'Library', 'icon': Icons.book, 'path': '/library'},
    {'title': 'Feedback', 'icon': Icons.message, 'path': '/student/feedback'},
  ];

  final examModules = [
    {
      'title': 'Syllabus',
      'icon': Icons.menu_book,
      'path': '/syllabus',
      'bg': 0xFFE0F7FA,
      'iconBg': 0xFFB2EBF2,
      'iconColor': 0xFF0097A7
    },
    {
      'title': 'Date Sheet',
      'icon': Icons.calendar_month,
      'path': '/exam-datesheet',
      'bg': 0xFFFFF4E5,
      'iconBg': 0xFFFFE0B2,
      'iconColor': 0xFFFB8C00
    },
    {
      'title': 'Admit Card',
      'icon': Icons.fact_check,
      'path': '/admit-card',
      'bg': 0xFFE3F2FD,
      'iconBg': 0xFFBBDEFB,
      'iconColor': 0xFF1E88E5
    },
    {
      'title': 'Results',
      'icon': Icons.bar_chart,
      'path': '/exam-results',
      'bg': 0xFFE8F5E9,
      'iconBg': 0xFFC8E6C9,
      'iconColor': 0xFF43A047
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

    // --- NAYA CODE: Dashboard par Double Tap to Exit logic ---
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
                backgroundColor: Colors.transparent, // pure transparent
                duration: const Duration(seconds: 2),
                behavior: SnackBarBehavior.floating,
                margin: const EdgeInsets.only(
                  bottom: 740, // upar shift (adjust if needed)
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
                    color: Colors.black
                        .withValues(alpha: 0.36), // liquid transparent feel
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
                      color: Color(0xFFE2E8F0), // soft liquid text
                      fontSize: 10,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            );
          } else {
            SystemNavigator.pop(); // App exit
          }
        },
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
                            child: _buildLargeModuleCard(m),
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
                            child: _buildSmallModuleCard(m),
                          ),
                        ))
                    .toList(),
              )
                  .animate()
                  .fadeIn(delay: 100.ms, duration: 400.ms)
                  .slideY(begin: 0.1),

              const SizedBox(height: 20),

              // --- 3. SUB MODULES & SEARCH RESULTS ---
              Container(
                width: double.infinity,
                // Andar ki padding 20 se ghata kar top/bottom 15 kar di
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius:
                      BorderRadius.circular(40), // Thoda compact roundness
                  border: Border.all(color: const Color(0xFFF1F5F9)),
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
                              childAspectRatio:
                                  0.8, // Ratio badhaya taaki dabey na
                              crossAxisSpacing: 2, // Horizontal gap bilkul kam
                              mainAxisSpacing:
                                  5, // Vertical gap (Lines ke beech) bilkul kam kar diya!
                            ),
                            itemCount: filteredSub.length,
                            itemBuilder: (context, i) =>
                                _buildSubModuleItem(filteredSub[i]),
                          ),

                          // Expandable Section
                          AnimatedSize(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                            child: (isExpanded || widget.searchQuery.isNotEmpty)
                                ? GridView.builder(
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    shrinkWrap: true,
                                    padding: const EdgeInsets.only(
                                        top:
                                            5), // Arrow ke upar ka gap kam kiya
                                    gridDelegate:
                                        const SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: 4,
                                      childAspectRatio: 0.8,
                                      crossAxisSpacing: 2,
                                      mainAxisSpacing:
                                          5, // Yahan bhi line gap kam kiya
                                    ),
                                    itemCount: filteredExtra.length,
                                    itemBuilder: (context, i) =>
                                        _buildSubModuleItem(filteredExtra[i]),
                                  ).animate().fadeIn()
                                : const SizedBox.shrink(),
                          ),

                          // Toggle Button
                          if (widget.searchQuery.isEmpty) ...[
                            const SizedBox(
                                height:
                                    5), // Arrow aur upar wale icons ke beech ka gap almost khatam
                            GestureDetector(
                              onTap: () =>
                                  setState(() => isExpanded = !isExpanded),
                              child: Container(
                                padding: const EdgeInsets.all(
                                    2), // Arrow button chhota kiya
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: const Color(0xFFE2E8F0)),
                                ),
                                child: Icon(
                                  isExpanded
                                      ? Icons.keyboard_arrow_up
                                      : Icons.keyboard_arrow_down,
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
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(40),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
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
                        const Text(
                          "Examination Hub",
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF1E293B),
                              fontStyle: FontStyle.italic),
                        ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFF1F5F9)),
                            boxShadow: [
                              BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.02),
                                  blurRadius: 5)
                            ],
                          ),
                          child: const Icon(Icons.school,
                              color: Color(0xFF7E57C2), size: 22),
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
                          _buildExamModuleCard(examModules[i]),
                    ),
                  ],
                ),
              )
                  .animate()
                  .fadeIn(delay: 300.ms, duration: 400.ms)
                  .slideY(begin: 0.1),

              const SizedBox(height: 140), // Extra space for Bottom Nav
            ],
          ),
        ));
  }

  // ==========================================================
  // WIDGET BUILDERS (Cloned styling)
  // ==========================================================

  Widget _buildLargeModuleCard(Map<String, dynamic> m) {
    return GestureDetector(
      onTap: () => context.go(m['path']),
      child: Container(
        height: 120,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Color(m['bg']),
          borderRadius: BorderRadius.circular(40),
          border: Border.all(color: Colors.white.withValues(alpha: 0.6)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.02), blurRadius: 5)
          ],
        ),
        child: Stack(
          children: [
            // White Glow matching exact React code
            Positioned(
              bottom: -20,
              right: -20,
              child: Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.4),
                    shape: BoxShape.circle),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  m['title'],
                  style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF1E293B),
                      fontStyle: FontStyle.italic),
                ),
                Align(
                  alignment: Alignment.bottomRight,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                        color: Color(m['iconBg']),
                        borderRadius: BorderRadius.circular(20)),
                    child:
                        Icon(m['icon'], color: Color(m['iconColor']), size: 28),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmallModuleCard(Map<String, dynamic> m) {
    return GestureDetector(
      onTap: () => context.go(m['path']),
      child: Container(
        height: 100,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Color(m['bg']),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.white.withValues(alpha: 0.5)),
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
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1E293B),
                  fontStyle: FontStyle.italic,
                  height: 1.1),
            ),
            Align(
              alignment: Alignment.bottomRight,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                    color: Color(m['iconBg']),
                    borderRadius: BorderRadius.circular(15)),
                child: Icon(m['icon'], color: Color(m['iconColor']), size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubModuleItem(Map<String, dynamic> sm) {
    // JADOO: Ye logic pehle space ko dhoondh kar usey naye line (\n) mein tod dega.
    // 'ERP Notices' ban jayega 'ERP\nNotices'
    String formattedTitle = (sm['title'] as String).replaceFirst(' ', '\n');

    return GestureDetector(
      onTap: () => context.go(sm['path']),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFE3F2FD),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.blue.shade50),
            ),
            child: Icon(sm['icon'], color: const Color(0xFF2196F3), size: 20),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: Text(
              formattedTitle, // Updated title use kiya hai yahan
              textAlign: TextAlign.center, // Text ko center align karega
              maxLines: 2, // 2 lines ki permission de di
              overflow: TextOverflow.visible,
              style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w900,
                color: Color(0xFF475569),
                height: 1.1, // Dono lines ke beech ka gap (Line height)
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExamModuleCard(Map<String, dynamic> m) {
    return GestureDetector(
      onTap: () => context.go(m['path']),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Color(m['bg']),
          borderRadius: BorderRadius.circular(25),
          border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                m['title'],
                style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF334155),
                    fontStyle: FontStyle.italic),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                  color: Color(m['iconBg']),
                  borderRadius: BorderRadius.circular(15)),
              child: Icon(m['icon'], color: Color(m['iconColor']), size: 16),
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

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class RouteAttendanceViewerScreen extends ConsumerStatefulWidget {
  const RouteAttendanceViewerScreen({super.key});

  @override
  ConsumerState<RouteAttendanceViewerScreen> createState() => _RouteAttendanceViewerScreenState();
}

class _RouteAttendanceViewerScreenState extends ConsumerState<RouteAttendanceViewerScreen> {
  List<dynamic> routes = [];
  List<dynamic> students = [];
  Map<String, dynamic>? selectedRoute;
  Map<String, dynamic>? selectedStudent;
  String searchQuery = '';
  bool isLoading = false;

  // Calendar States
  Map<String, dynamic>? attendanceData;
  DateTime currentMonth = DateTime.now();

  @override
  void initState() {
    super.initState();
    _fetchRoutes();
  }

  Future<void> _fetchRoutes() async {
    setState(() => isLoading = true);
    try {
      final res = await ApiClient.dio.get('/transport/routes');
      if (mounted) setState(() => routes = res.data);
    } catch (e) {
      debugPrint("Error fetching routes: $e");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _fetchStudentsForRoute(Map<String, dynamic> route) async {
    setState(() {
      selectedRoute = route;
      searchQuery = '';
      isLoading = true;
    });
    try {
      final res = await ApiClient.dio.get('/transport/routes/${route['_id']}/students');
      if (mounted) setState(() => students = res.data);
    } catch (e) {
      debugPrint("Error fetching students: $e");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _fetchAttendance() async {
    if (selectedStudent == null) return;
    setState(() => isLoading = true);
    try {
      String monthStr = DateFormat('yyyy-MM').format(currentMonth);
      final res = await ApiClient.dio.get('/transport/student-attendance/${selectedStudent!['_id']}?month=$monthStr');
      if (mounted) setState(() => attendanceData = res.data);
    } catch (e) {
      debugPrint("Error fetching attendance: $e");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _changeMonth(int offset) {
    setState(() {
      currentMonth = DateTime(currentMonth.year, currentMonth.month + offset, 1);
      attendanceData = null; // Clear old data
    });
    _fetchAttendance();
  }

  String? _getStatusForDate(int day) {
    if (attendanceData == null || attendanceData!['history'] == null) return null;
    String dateStr = DateFormat('yyyy-MM-dd').format(DateTime(currentMonth.year, currentMonth.month, day));
    
    List logs = attendanceData!['history'].where((log) => log['date'] == dateStr).toList();
    if (logs.isEmpty) return null;
    
    // Priority to morning trip if both exist
    var morningLog = logs.firstWhere((l) => l['tripType'] == 'MORNING', orElse: () => null);
    return morningLog != null ? morningLog['status'] : logs[0]['status'];
  }

  void _handleBack() {
    if (selectedStudent != null) {
      setState(() {
        selectedStudent = null;
        attendanceData = null;
      });
    } else if (selectedRoute != null) {
      setState(() {
        selectedRoute = null;
        searchQuery = '';
      });
    } else {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final textPrimary = isDark ? Colors.white : const Color(0xFF1E293B);
    final textSec = isDark ? const Color(0xFF94A3B8) : Colors.grey;

    final filteredRoutes = routes.where((r) => r['routeName'].toString().toLowerCase().contains(searchQuery.toLowerCase())).toList();
    final filteredStudents = students.where((s) => s['name'].toString().toLowerCase().contains(searchQuery.toLowerCase())).toList();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack();
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: CustomScrollView(
          slivers: [
            // --- HEADER ---
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 60, 20, 40),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFF42A5F5),
                  borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(36), bottomRight: Radius.circular(36)),
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: _handleBack,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
                        child: const Icon(Icons.arrow_back, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(selectedStudent != null ? "Attendance" : "Checker", style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                          Text(selectedStudent != null ? selectedStudent!['name'].toString().toUpperCase() : "VERIFY STUDENT BOARDING", style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // --- CONTENT BODY ---
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  
                  // View 1 & 2 Header/Search (Hide when viewing calendar)
                  if (selectedStudent == null) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(selectedRoute == null ? 'Select a Route' : 'Students in ${selectedRoute!['routeName']}', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                          Text(selectedRoute == null ? 'Browse all active lines' : 'Select a student to view calendar', style: TextStyle(fontSize: 10, color: textSec, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    TextField(
                      onChanged: (val) => setState(() => searchQuery = val),
                      style: TextStyle(color: textPrimary, fontWeight: FontWeight.bold),
                      decoration: InputDecoration(
                        hintText: selectedRoute == null ? 'Search routes...' : 'Search students...',
                        hintStyle: TextStyle(color: textSec),
                        prefixIcon: Icon(Icons.search, color: textSec),
                        filled: true,
                        fillColor: cardColor,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  if (isLoading && selectedStudent == null)
                    const Padding(padding: EdgeInsets.all(40), child: CustomLoader()),

                  // ==================== VIEW 1: ROUTES ====================
                  if (selectedRoute == null && !isLoading) ...[
                    if (filteredRoutes.isEmpty)
                      Center(child: Padding(padding: const EdgeInsets.all(40), child: Text("No routes found", style: TextStyle(color: textSec, fontWeight: FontWeight.bold))))
                    else
                      ...filteredRoutes.map((route) => GestureDetector(
                        onTap: () => _fetchStudentsForRoute(route),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.teal.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
                                child: const Icon(Icons.map, color: Colors.teal),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(route['routeName'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                                    Text('View Attendance', style: TextStyle(fontSize: 10, color: textSec, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                              Icon(Icons.chevron_right, color: textSec),
                            ],
                          ),
                        ),
                      )).toList(),
                  ],

                  // ==================== VIEW 2: STUDENTS ====================
                  if (selectedRoute != null && selectedStudent == null && !isLoading) ...[
                    if (filteredStudents.isEmpty)
                      Center(child: Padding(padding: const EdgeInsets.all(40), child: Text("No students here", style: TextStyle(color: textSec, fontWeight: FontWeight.bold))))
                    else
                      ...filteredStudents.map((student) => GestureDetector(
                        onTap: () {
                          setState(() => selectedStudent = student);
                          _fetchAttendance();
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundImage: NetworkImage(student['avatar'] ?? 'https://cdn-icons-png.flaticon.com/512/149/149071.png'),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(student['name'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                                    Text('Class: ${student['grade']}', style: const TextStyle(fontSize: 10, color: Color(0xFF42A5F5), fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), shape: BoxShape.circle),
                                child: Icon(Icons.calendar_month, color: textSec, size: 18),
                              ),
                            ],
                          ),
                        ),
                      )).toList(),
                  ],

                  // ==================== VIEW 3: STUDENT CALENDAR ====================
                  if (selectedStudent != null) ...[
                    if (isLoading)
                      const Padding(padding: EdgeInsets.all(40), child: CustomLoader())
                    else ...[
                      // Stats Row
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(color: isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5), border: Border.all(color: isDark ? const Color(0xFF047857) : const Color(0xFFD1FAE5)), borderRadius: BorderRadius.circular(24)),
                              child: Row(
                                children: [
                                  Container(padding: const EdgeInsets.all(8), decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle), child: const Icon(Icons.check, color: Colors.white, size: 16)),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text("Boarded", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.green, letterSpacing: 1)),
                                      Text("${attendanceData?['presentDays'] ?? 0}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.green)),
                                    ],
                                  )
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(color: isDark ? const Color(0xFF4C0519) : const Color(0xFFFFF1F2), border: Border.all(color: isDark ? const Color(0xFF9F1239) : const Color(0xFFFFE4E6)), borderRadius: BorderRadius.circular(24)),
                              child: Row(
                                children: [
                                  Container(padding: const EdgeInsets.all(8), decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle), child: const Icon(Icons.close, color: Colors.white, size: 16)),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text("Missed", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.redAccent, letterSpacing: 1)),
                                      Text("${attendanceData?['absentDays'] ?? 0}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.redAccent)),
                                    ],
                                  )
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Calendar Box
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(32), border: Border.all(color: cardBorder), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 5))]),
                        child: Column(
                          children: [
                            // Month Nav
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                GestureDetector(
                                  onTap: () => _changeMonth(-1),
                                  child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), shape: BoxShape.circle), child: Icon(Icons.chevron_left, color: textSec)),
                                ),
                                Text(DateFormat('MMMM yyyy').format(currentMonth).toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary, letterSpacing: 1.5)),
                                GestureDetector(
                                  onTap: () => _changeMonth(1),
                                  child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), shape: BoxShape.circle), child: Icon(Icons.chevron_right, color: textSec)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // Weekdays
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((d) => SizedBox(width: 30, child: Text(d, textAlign: TextAlign.center, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSec)))).toList(),
                            ),
                            const SizedBox(height: 12),

                            // Days Grid
                            GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, childAspectRatio: 1, mainAxisSpacing: 8, crossAxisSpacing: 8),
                              itemCount: _getDaysInMonth(currentMonth) + _getFirstWeekday(currentMonth) - 1,
                              itemBuilder: (context, index) {
                                int offset = _getFirstWeekday(currentMonth) - 1;
                                if (index < offset) return const SizedBox();
                                
                                int day = index - offset + 1;
                                String? status = _getStatusForDate(day);
                                
                                Color cellBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
                                Color cellText = textSec;
                                Color borderCol = cardBorder;
                                
                                if (status == 'Present') {
                                  cellBg = isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5);
                                  cellText = Colors.green;
                                  borderCol = isDark ? const Color(0xFF047857) : const Color(0xFFD1FAE5);
                                } else if (status == 'Absent') {
                                  cellBg = isDark ? const Color(0xFF4C0519) : const Color(0xFFFFF1F2);
                                  cellText = Colors.redAccent;
                                  borderCol = isDark ? const Color(0xFF9F1239) : const Color(0xFFFFE4E6);
                                }

                                return Container(
                                  decoration: BoxDecoration(color: cellBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderCol)),
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      Text(day.toString(), style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: cellText)),
                                      if (status != null)
                                        Positioned(
                                          bottom: 4,
                                          child: Container(width: 4, height: 4, decoration: BoxDecoration(shape: BoxShape.circle, color: status == 'Present' ? Colors.green : Colors.redAccent)),
                                        )
                                    ],
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
                    ]
                  ],
                  const SizedBox(height: 100),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- CALENDAR HELPER FUNCTIONS ---
  int _getDaysInMonth(DateTime date) {
    return DateTime(date.year, date.month + 1, 0).day;
  }

  int _getFirstWeekday(DateTime date) {
    return DateTime(date.year, date.month, 1).weekday; // 1 = Monday, 7 = Sunday
  }
}
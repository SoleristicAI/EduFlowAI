import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class TeacherAttendance extends ConsumerStatefulWidget {
  const TeacherAttendance({super.key});

  @override
  ConsumerState<TeacherAttendance> createState() => _TeacherAttendanceState();
}

class _TeacherAttendanceState extends ConsumerState<TeacherAttendance> {
  bool isLoading = true;
  bool isSaving = false;
  bool isUpdateMode = false;
  bool showList = false;
  bool isDateOpen = false;

  String? assignedClass;
  DateTime selectedDate = DateTime.now();
  DateTime viewDate = DateTime.now();
  
  int pendingCount = 0;
  String searchQuery = '';
  List<Map<String, dynamic>> students = [];

  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initData();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _initData() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      final user = jsonDecode(userStr);
      assignedClass = user['assignedClass'];
    }
    await _fetchData();
  }

  Future<void> _fetchData({bool isRefresh = false}) async {
    if (!isRefresh) setState(() => isLoading = true);
    
    if (assignedClass == null) {
      setState(() => isLoading = false);
      return;
    }

    try {
      final formattedDate = DateFormat('yyyy-MM-dd').format(selectedDate);
      
      // Parallel API calls for speed
      final results = await Future.wait([
        ApiClient.dio.get('/attendance/my-students?date=$formattedDate'),
        ApiClient.dio.get('/attendance/view?grade=$assignedClass&date=$formattedDate'),
        ApiClient.dio.get('/leaves/pending-count'),
      ]);

      final stdResp = results[0];
      final existingResp = results[1];
      final leavesResp = results[2];

      if (mounted) {
        setState(() {
          pendingCount = leavesResp.data['count'] ?? 0;
          
          List<dynamic> stdList = stdResp.data['students'] ?? [];
          List<dynamic> existingRecords = existingResp.data?['records'] ?? [];

          if (existingRecords.isNotEmpty) {
            students = stdList.map((s) {
              final record = existingRecords.firstWhere((r) => r['studentId'] == s['_id'] || r['student'] == s['_id'], orElse: () => null);
              bool isOnLeave = (s['onLeave'] == true) || (record != null && record['onLeave'] == true);
              
              return {
                'id': s['_id'],
                'name': s['name'] ?? 'Unknown',
                'roll': s['enrollmentNo'] ?? 'N/A',
                'status': isOnLeave ? 'On Leave' : (record != null ? record['status'] : 'Present'),
                'onLeave': isOnLeave,
              };
            }).toList();
            isUpdateMode = true;
          } else {
            students = stdList.map((s) {
              bool isOnLeave = s['onLeave'] == true;
              return {
                'id': s['_id'],
                'name': s['name'] ?? 'Unknown',
                'roll': s['enrollmentNo'] ?? 'N/A',
                'status': isOnLeave ? 'On Leave' : 'Present',
                'onLeave': isOnLeave,
              };
            }).toList();
            isUpdateMode = false;
          }
        });
      }
    } catch (e) {
      _showToast("Network Protocol Error", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _toggleStatus(String id) {
    setState(() {
      students = students.map((s) {
        if (s['id'] == id && s['onLeave'] != true) {
          s['status'] = s['status'] == 'Present' ? 'Absent' : 'Present';
        }
        return s;
      }).toList();
    });
  }

  Future<void> _handleSubmit() async {
    if (students.isEmpty) return;
    setState(() => isSaving = true);
    
    try {
      final records = students.map((s) => {
        'studentId': s['id'],
        'name': s['name'],
        'status': s['status'],
        'onLeave': s['onLeave'],
      }).toList();

      await ApiClient.dio.post('/attendance/mark', data: {
        'grade': assignedClass,
        'date': DateFormat('yyyy-MM-dd').format(selectedDate),
        'records': records
      });

      _showToast(isUpdateMode ? "Records updated successfully!" : "Attendance marked successfully!");
      setState(() => showList = false);
    } catch (e) {
      _showToast("Submission Failed!", isError: true);
    } finally {
      if (mounted) setState(() => isSaving = false);
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isError ? Icons.error : Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 12))),
          ],
        ),
        backgroundColor: isError ? const Color(0xFFF43F5E) : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.all(20),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final bool isFutureDate = selectedDate.isAfter(DateTime.now());

    if (assignedClass == null) {
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {
          if (didPop) return;
          // 🔥 SAFE ROUTING FOR HARDWARE BACK BUTTON 🔥
          if (context.canPop()) {
            context.pop(); 
          } else {
            context.go('/teacher/home');
          }
        },
        child: Scaffold(
          backgroundColor: bgColor,
          body: Column(
            children: [
              // --- PREMIUM HEADER WITH BACK BUTTON ---
              Container(
                padding: const EdgeInsets.only(top: 60, bottom: 30, left: 24, right: 24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDarkMode 
                        ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                        : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                    begin: Alignment.topCenter, end: Alignment.bottomCenter,
                  ),
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () {
                        // 🔥 SAFE ROUTING FOR UI BACK BUTTON 🔥
                        if (context.canPop()) {
                          context.pop();
                        } else {
                          context.go('/teacher/home');
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                        child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                      ),
                    ),
                    const Expanded(
                      child: Center(
                        child: Text(
                          "Access Denied", 
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)
                        ),
                      ),
                    ),
                    const SizedBox(width: 48), // Balancing layout
                  ],
                ),
              ),
              
              // --- MAIN BLANK MESSAGE ---
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.block, size: 60, color: textColorSecondary.withOpacity(0.5)),
                      const SizedBox(height: 20),
                      Text(
                        "NO CLASS ASSIGNED TO YOU!\nContact admin to assign you a class.",
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, height: 1.5, letterSpacing: 1),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        
        if (showList) {
          setState(() => showList = false); // Agar list khuli hai toh sirf band hogi
        } else {
          // 🔥 NAYA SAFE BACK ROUTING LOGIC 🔥
          if (context.canPop()) {
            context.pop(); // Normal back
          } else {
            context.go('/teacher/home'); // Agar stack tuta hua hai toh seedha home fekega, app crash nahi karega
          }
        }
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: cardColor,
          onRefresh: () => _fetchData(isRefresh: true),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    // --- HEADER ---
                    Container(
                      padding: const EdgeInsets.only(top: 60, bottom: 40, left: 24, right: 24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF42A5F5),
                        gradient: LinearGradient(
                          colors: isDarkMode 
                              ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                              : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                          begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                             GestureDetector(
                                onTap: () {
                                  if (showList) {
                                    setState(() => showList = false);
                                  } else {
                                    // 🔥 SAME SAFE LOGIC FOR UI BACK BUTTON 🔥
                                    if (context.canPop()) {
                                      context.pop();
                                    } else {
                                      context.go('/teacher/home');
                                    }
                                  }
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                                  child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                                ),
                              ),
                              Column(
                                children: [
                                  const Text("Attendance", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                  Text("CLASS MANAGEMENT", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                                child: const Icon(Icons.calendar_month, color: Colors.white, size: 24),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // DATE & LEAVE REQUEST CARD
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text("CLASS ${assignedClass?.toUpperCase()}", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic)),
                                    GestureDetector(
                                      onTap: () => setState(() => isDateOpen = !isDateOpen),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                        decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
                                        child: Row(
                                          children: [
                                            Text(DateFormat('dd MMM').format(selectedDate), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic)),
                                            const SizedBox(width: 8),
                                            Icon(Icons.calendar_today, size: 14, color: const Color(0xFF42A5F5).withOpacity(0.6)),
                                          ],
                                        ),
                                      ),
                                    )
                                  ],
                                ),
                                
                                // INLINE CUSTOM CALENDAR (REACT REPLICA)
                                AnimatedSize(
                                  duration: const Duration(milliseconds: 300),
                                  curve: Curves.easeInOut,
                                  child: isDateOpen ? _buildCustomCalendar(isDarkMode, cardColor, cardBorder, textColorPrimary) : const SizedBox.shrink(),
                                ),

                                const SizedBox(height: 16),
                                
                                // LEAVE REQUEST BUTTON
                                GestureDetector(
                                  onTap: () => context.push('/teacher/leave-requests'), // Router path match karlena
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : Colors.white, borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
                                              child: const Icon(Icons.assignment_ind, color: Color(0xFF42A5F5), size: 20),
                                            ),
                                            const SizedBox(width: 16),
                                            const Text("LEAVE REQUESTS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1)),
                                          ],
                                        ),
                                        Container(
                                          width: 35, height: 35,
                                          alignment: Alignment.center,
                                          decoration: BoxDecoration(
                                            color: pendingCount > 0 ? const Color(0xFFF43F5E) : (isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                                            shape: BoxShape.circle,
                                            boxShadow: pendingCount > 0 ? [BoxShadow(color: const Color(0xFFF43F5E).withOpacity(0.4), blurRadius: 10)] : [],
                                          ),
                                          child: Text(pendingCount.toString(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: pendingCount > 0 ? Colors.white : textColorSecondary)),
                                        ).animate(
                                          target: pendingCount > 0 ? 1 : 0,
                                          onPlay: (c) => pendingCount > 0 ? c.repeat(reverse: true) : c.stop(), // 🔥 NAYA: Continuous pulse karega jab count hoga
                                        ).scale(begin: const Offset(1,1), end: const Offset(1.1,1.1)),
                                      ],
                                    ),
                                  ),
                                )
                              ],
                            ),
                          )
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- MAIN CONTENT AREA ---
                    Transform.translate(
                      offset: const Offset(0, -20),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: !showList 
                          ? _buildIntroCard(isFutureDate, cardColor, cardBorder, textColorPrimary, textColorSecondary)
                          : _buildAttendanceList(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary),
                      ),
                    ),
                    const SizedBox(height: 50),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  // --- CALENDAR WIDGET ---
  Widget _buildCustomCalendar(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary) {
    int daysInMonth = DateTime(viewDate.year, viewDate.month + 1, 0).day;
    int firstDayWeekday = DateTime(viewDate.year, viewDate.month, 1).weekday; // 1 = Monday, 7 = Sunday
    
    List<Widget> dayWidgets = [];
    for (int i = 1; i < firstDayWeekday; i++) {
      dayWidgets.add(const SizedBox());
    }
    
    for (int day = 1; day <= daysInMonth; day++) {
      DateTime currentDate = DateTime(viewDate.year, viewDate.month, day);
      bool isSelected = selectedDate.year == currentDate.year && selectedDate.month == currentDate.month && selectedDate.day == currentDate.day;
      bool isFuture = currentDate.isAfter(DateTime.now());

      dayWidgets.add(
        GestureDetector(
          onTap: isFuture ? null : () {
            setState(() {
              selectedDate = currentDate;
              isDateOpen = false;
              _fetchData(); // Fetch new date data
            });
          },
          child: Container(
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF42A5F5) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              day.toString(),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: isFuture ? (isDarkMode ? Colors.white24 : Colors.black26) : (isSelected ? Colors.white : textColorPrimary),
              ),
            ),
          ),
        )
      );
    }

    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.2) : Colors.blue.shade50, borderRadius: BorderRadius.circular(25), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100)),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(icon: const Icon(Icons.arrow_back_ios, size: 14, color: Color(0xFF42A5F5)), onPressed: () => setState(() => viewDate = DateTime(viewDate.year, viewDate.month - 1, 1))),
              Text(DateFormat('MMMM yyyy').format(viewDate), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic)),
              IconButton(icon: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF42A5F5)), onPressed: () => setState(() => viewDate = DateTime(viewDate.year, viewDate.month + 1, 1))),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => Text(d, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8)))).toList(),
          ),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 7,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            physics: const NeverScrollableScrollPhysics(),
            children: dayWidgets,
          ),
        ],
      ),
    );
  }

  // --- INTRO CARD ---
  Widget _buildIntroCard(bool isFutureDate, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(50), border: Border.all(color: cardBorder, width: 2, style: BorderStyle.solid), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: isFutureDate ? const Color(0xFFF43F5E).withOpacity(0.1) : const Color(0xFF42A5F5).withOpacity(0.1), shape: BoxShape.circle, border: Border.all(color: isFutureDate ? const Color(0xFFF43F5E).withOpacity(0.3) : const Color(0xFF42A5F5).withOpacity(0.3))),
            child: Icon(isFutureDate ? Icons.lock : Icons.fact_check, size: 40, color: isFutureDate ? const Color(0xFFF43F5E) : const Color(0xFF42A5F5)),
          ).animate(onPlay: (c) => isFutureDate ? null : c.repeat(reverse: true)).scale(begin: const Offset(1,1), end: const Offset(1.05, 1.05)),
          const SizedBox(height: 24),
          Text(isFutureDate ? "SYSTEM LOCKED" : "READY TO MARK", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: 2)),
          const SizedBox(height: 12),
          Text(isFutureDate ? "Cannot mark attendance for future dates." : "Date: ${DateFormat('dd MMM yyyy').format(selectedDate)}", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColorSecondary, letterSpacing: 1)),
          if (!isFutureDate) ...[
            const SizedBox(height: 32),
            GestureDetector(
              onTap: () => setState(() => showList = true),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(30), boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]),
                child: Text(isUpdateMode ? "UPDATE ATTENDANCE" : "TAKE ATTENDANCE", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color.fromARGB(255, 224, 216, 216), letterSpacing: 2, fontStyle: FontStyle.italic)),
              ),
            )
          ]
        ],
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
  }

  // --- ATTENDANCE LIST ---
  Widget _buildAttendanceList(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary) {
    int presentCount = students.where((s) => s['status'] == 'Present').length;
    int totalCount = students.where((s) => s['onLeave'] != true).length;

    List<Map<String, dynamic>> filteredStudents = students.where((s) {
      return s['name'].toString().toLowerCase().contains(searchQuery.toLowerCase()) || 
             s['roll'].toString().contains(searchQuery);
    }).toList();

    return Column(
      children: [
        // Stats Row
       Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(isUpdateMode ? '📍 UPDATING' : '📝 MARKING', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color.fromARGB(255, 0, 10, 16), fontStyle: FontStyle.italic, letterSpacing: 2)),
            Container(
              // 🔥 YAHAN FIX KIYA HAI: horizontal 12 aur vertical 6 kar diya 🔥
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF42A5F5), 
                borderRadius: BorderRadius.circular(20), 
                boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.3), blurRadius: 10)]
              ),
              child: Text("PRESENT: $presentCount / $totalCount", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: 1)),
            )
          ],
        ),
        const SizedBox(height: 16),
        
        // Search
        Container(
          decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
          child: TextField(
            controller: _searchCtrl,
            onChanged: (val) => setState(() => searchQuery = val),
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
            decoration: InputDecoration(
              hintText: "Search by name or roll no...",
              hintStyle: TextStyle(fontSize: 11, color: textColorSecondary),
              prefixIcon: Icon(Icons.search, color: searchQuery.isNotEmpty ? const Color(0xFF42A5F5) : textColorSecondary, size: 20),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // List
        ...filteredStudents.map((s) {
          bool isOnLeave = s['onLeave'] == true;
          bool isPresent = s['status'] == 'Present';

          return AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(35), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 45, height: 45,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14), border: Border.all(color: cardBorder)),
                        child: Text(s['name'].toString().substring(0, s['name'].toString().length >= 2 ? 2 : 1).toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5))),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(s['name'].toString().toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                            const SizedBox(height: 4),
                            Text(s['roll'].toString(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColorSecondary, letterSpacing: 1)),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                isOnLeave 
                  ? Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.1), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3))),
                      child: const Row(
                        children: [
                          Icon(Icons.lock, size: 12, color: Color(0xFFF59E0B)),
                          SizedBox(width: 6),
                          Text("ON LEAVE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFFF59E0B))),
                        ],
                      ),
                    )
                  : GestureDetector(
                      onTap: () => _toggleStatus(s['id']),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        decoration: BoxDecoration(
                          color: isPresent ? const Color(0xFF10B981).withOpacity(0.1) : const Color(0xFFF43F5E),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isPresent ? const Color(0xFF10B981).withOpacity(0.3) : Colors.transparent),
                          boxShadow: isPresent ? [] : [BoxShadow(color: const Color(0xFFF43F5E).withOpacity(0.4), blurRadius: 10)],
                        ),
                        child: Row(
                          children: [
                            Icon(isPresent ? Icons.check_circle : Icons.cancel, size: 14, color: isPresent ? const Color(0xFF10B981) : Colors.white),
                            const SizedBox(width: 6),
                            Text(isPresent ? "PRESENT" : "ABSENT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isPresent ? const Color(0xFF10B981) : Colors.white)),
                          ],
                        ),
                      ),
                    ),
              ],
            ),
          ).animate().fadeIn().slideY(begin: 0.1);
        }).toList(),

        if (filteredStudents.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 40),
            child: Text("NO MATCHING STUDENT FOUND", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5)),
          ),

        const SizedBox(height: 32),
        // Submit Button
        GestureDetector(
          onTap: isSaving || students.isEmpty ? null : _handleSubmit,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: BoxDecoration(
              color: isSaving || students.isEmpty ? textColorSecondary.withOpacity(0.3) : (isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B)),
              borderRadius: BorderRadius.circular(30),
              boxShadow: isSaving || students.isEmpty ? [] : const [BoxShadow(color: Colors.black26, blurRadius: 15, offset: Offset(0, 5))]
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isSaving) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                else Icon(isUpdateMode ? Icons.refresh : Icons.save, color: isDarkMode ? const Color(0xFF1E293B) : Colors.white, size: 16),
                const SizedBox(width: 10),
                Text(isSaving ? "SYNCHRONIZING..." : (isUpdateMode ? "UPDATE RECORDS" : "SUBMIT ATTENDANCE"), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF1E293B) : Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: () => setState(() => showList = false),
          child: Text("CANCEL AND GO BACK", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
        ),
      ],
    ).animate().fadeIn();
  }
}
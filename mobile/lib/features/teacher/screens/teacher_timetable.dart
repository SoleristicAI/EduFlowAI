import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class TeacherTimetable extends ConsumerStatefulWidget {
  const TeacherTimetable({super.key});

  @override
  ConsumerState<TeacherTimetable> createState() => _TeacherTimetableState();
}

class _TeacherTimetableState extends ConsumerState<TeacherTimetable> {
  bool isLoading = true;
  String activeDay = 'Monday';
  List<dynamic> personalSchedule = [];
  Set<String> submittedDiaries = {}; // O(1) lookup for speed

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
    _setInitialDay();
    _fetchInitialData();
  }

  void _setInitialDay() {
    final now = DateTime.now();
    int currentDayIndex = now.weekday == 7 ? 0 : now.weekday; // Sun=0, Mon=1...
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    activeDay = currentDayIndex == 0 ? 'Monday' : days[currentDayIndex];
  }

  String _getWeekDate(String targetDay) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    final today = DateTime.now();
    int currentDayIndex = today.weekday == 7 ? 0 : today.weekday;
    int targetDayIndex = days.indexOf(targetDay);
    int diff = currentDayIndex - targetDayIndex;
    DateTime resultDate = today.subtract(Duration(days: diff));
    return DateFormat('yyyy-MM-dd').format(resultDate);
  }

  Future<void> _fetchInitialData({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isLoading = true);

    try {
      final response = await ApiClient.dio.get('/timetable/teacher/personal-schedule');
      List<dynamic> schedule = response.data['schedule'] ?? [];
      
      Set<String> activeDiaries = {};

      // Background parallel check for diaries
      List<Future<void>> checks = [];
      for (var day in schedule) {
        String targetDate = _getWeekDate(day['day']);
        for (var period in (day['periods'] ?? [])) {
          String key = "${period['grade']}-${period['subject']}-$targetDate";
          checks.add(
            ApiClient.dio.get('/homework/check?className=${period['grade']}&subject=${period['subject']}&date=$targetDate')
            .then((res) {
              if (res.data != null && res.data['content'] != null) {
                activeDiaries.add(key);
              }
            }).catchError((_) {}) // Ignore 404s
          );
        }
      }
      
      await Future.wait(checks);

      if (mounted) {
        setState(() {
          personalSchedule = schedule;
          submittedDiaries = activeDiaries;
        });
      }
    } catch (e) {
      _showToast("Failed to sync schedule", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _openDiaryModal(Map<String, dynamic> period, bool isDarkMode, Color bgColor, Color cardBorder, Color textColor) async {
    String selectedDate = _getWeekDate(activeDay);
    String initialContent = "";
    bool isChecking = true;

    // Show Loading Modal State
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Diary',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, _, __) {
        return StatefulBuilder(
          builder: (context, setStateModal) {
            
            // Check existing diary on open
            if (isChecking) {
              ApiClient.dio.get('/homework/check?className=${period['grade']}&subject=${period['subject']}&date=$selectedDate').then((res) {
                if (res.data != null && res.data['content'] != null) {
                  initialContent = res.data['content'];
                }
              }).catchError((_) {}).whenComplete(() {
                if (mounted) {
                  setStateModal(() {
                    isChecking = false;
                  });
                }
              });
            }

            TextEditingController contentCtrl = TextEditingController(text: initialContent);
            bool isSaving = false;
            bool isCalOpen = false;

            return Scaffold(
              backgroundColor: Colors.transparent,
              body: Stack(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(ctx),
                    child: Container(color: Colors.black.withOpacity(0.5)),
                  ),
                  Center(
                    child: Container(
                      width: MediaQuery.of(context).size.width * 0.9,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(40),
                        border: Border.all(color: cardBorder),
                        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, 10))],
                      ),
                      child: isChecking 
                        ? const Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: Color(0xFF42A5F5)))
                        : Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text("Class Diary", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textColor, fontStyle: FontStyle.italic, leadingDistribution: TextLeadingDistribution.even)),
                                      Text("${period['subject']} • Class ${period['grade']}".toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5)),
                                    ],
                                  ),
                                  GestureDetector(
                                    onTap: () => Navigator.pop(ctx),
                                    child: Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9), shape: BoxShape.circle),
                                      child: const Icon(Icons.close, size: 20, color: Colors.grey),
                                    ),
                                  )
                                ],
                              ),
                              const SizedBox(height: 24),

                              const Text("DATE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic)),
                              const SizedBox(height: 6),
                              GestureDetector(
                                onTap: () => setStateModal(() => isCalOpen = !isCalOpen),
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(DateFormat('dd MMM yyyy').format(DateTime.parse(selectedDate)), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColor, fontStyle: FontStyle.italic)),
                                      const Icon(Icons.calendar_month, size: 18, color: Colors.grey),
                                    ],
                                  ),
                                ),
                              ),

                              // Quick Inline Calendar (Optional visual touch)
                              AnimatedSize(
                                duration: const Duration(milliseconds: 300),
                                child: isCalOpen ? Container(
                                  margin: const EdgeInsets.only(top: 10),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.2) : Colors.blue.shade50, borderRadius: BorderRadius.circular(20)),
                                  child: Text("Date is auto-locked to $activeDay of the current week for accuracy.", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF42A5F5), fontStyle: FontStyle.italic)),
                                ) : const SizedBox.shrink(),
                              ),

                              const SizedBox(height: 20),
                              const Text("HOMEWORK", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic)),
                              const SizedBox(height: 6),
                              Container(
                                decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                child: TextField(
                                  controller: contentCtrl,
                                  maxLines: 4,
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColor, fontStyle: FontStyle.italic),
                                  decoration: InputDecoration(
                                    hintText: "e.g. Complete Exercise 4.2...",
                                    hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                                    border: InputBorder.none,
                                    contentPadding: const EdgeInsets.all(16),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              GestureDetector(
                                onTap: isSaving ? null : () async {
                                  if (contentCtrl.text.trim().isEmpty) {
                                    _showToast("Diary content is empty! ✍️", isError: true);
                                    return;
                                  }
                                  setStateModal(() => isSaving = true);
                                  try {
                                    await ApiClient.dio.post('/homework/assign', data: {
                                      'className': period['grade'],
                                      'subject': period['subject'],
                                      'date': selectedDate,
                                      'content': contentCtrl.text.trim()
                                    });
                                    
                                    // Update parent state safely
                                    if (mounted) {
                                      setState(() {
                                        submittedDiaries.add("${period['grade']}-${period['subject']}-$selectedDate");
                                      });
                                    }
                                    
                                    Navigator.pop(ctx);
                                    _showToast("Diary Submitted Successfully! 📡");
                                  } catch (e) {
                                    _showToast("Uplink failed! Check connection. 🛡️", isError: true);
                                    setStateModal(() => isSaving = false);
                                  }
                                },
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: isSaving ? Colors.grey : const Color(0xFF42A5F5),
                                    borderRadius: BorderRadius.circular(25),
                                    boxShadow: isSaving ? [] : [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      if (isSaving) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                      else const Icon(Icons.send, color: Colors.white, size: 16),
                                      const SizedBox(width: 8),
                                      Text(isSaving ? "SYNCING..." : "SUBMIT DIARY", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                    ],
                                  ),
                                ),
                              )
                            ],
                          ),
                    ).animate().scale(curve: Curves.easeOutBack, duration: 400.ms),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
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

    final currentDayData = personalSchedule.firstWhere((d) => d['day'] == activeDay, orElse: () => null);
    final periods = currentDayData != null ? (currentDayData['periods'] as List<dynamic>) : [];

    // Sort periods by time
    periods.sort((a, b) {
      final tA = DateFormat("hh:mm a").parse(a['startTime'] ?? "12:00 AM");
      final tB = DateFormat("hh:mm a").parse(b['startTime'] ?? "12:00 AM");
      return tA.compareTo(tB);
    });

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) {
          context.pop(); 
        } else {
          context.go('/teacher/home');
        }
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: cardColor,
          onRefresh: () => _fetchInitialData(isRefresh: true),
          child: CustomScrollView(
            // 🔥 YAHAN CLAMPING LAGA HAI (Spinner upar se aayega, Header neeche nahi khichega) 🔥
            physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()),
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    // --- NORMAL SCROLLABLE HEADER ---
                    Container(
                      padding: const EdgeInsets.only(top: 60, bottom: 20, left: 24, right: 24),
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
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              GestureDetector(
                                onTap: () {
                                  // 🔥 SAFE BACK ROUTING LOGIC 🔥
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
                              Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text("Class Schedule", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
                                  Text("DAILY CLASS ROUTINE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                                child: const Icon(Icons.calendar_month, color: Colors.white, size: 24),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 30),
                          
                          // Day Selector Horizon
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            physics: const BouncingScrollPhysics(),
                            child: Row(
                              children: daysMap.map((day) {
                                bool isActive = activeDay == day['full'];
                                return GestureDetector(
                                  onTap: () => setState(() => activeDay = day['full'] ?? 'Monday'),
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 300),
                                    margin: const EdgeInsets.only(right: 12),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: isActive ? Colors.white : Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: isActive ? Colors.white : Colors.white.withOpacity(0.3)),
                                      boxShadow: isActive ? [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)] : [],
                                    ),
                                    child: Text(
                                      day['short']!,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w900,
                                        color: isActive ? const Color(0xFF42A5F5) : Colors.white,
                                        fontStyle: FontStyle.italic,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                          const SizedBox(height: 10),
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- MAIN SCHEDULE AREA ---
                    Padding(
                      padding: const EdgeInsets.only(top: 24, left: 24, right: 24, bottom: 50),
                      child: periods.isNotEmpty 
                        ? Column(
                            children: periods.map((item) {
                              String targetDate = _getWeekDate(activeDay);
                              String diaryKey = "${item['grade']}-${item['subject']}-$targetDate";
                              bool hasActiveDiary = submittedDiaries.contains(diaryKey);

                              return Container(
                                margin: const EdgeInsets.only(bottom: 24),
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  color: cardColor,
                                  borderRadius: BorderRadius.circular(40),
                                  border: Border.all(color: cardBorder),
                                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))],
                                ),
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    // Class Badge
                                    Positioned(
                                      top: -24, right: 10,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50,
                                          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                                          border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100),
                                        ),
                                        child: Text("CLASS: ${item['grade']}", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                      ),
                                    ),

                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Left Time Slot
                                        Container(
                                          width: 80,
                                          padding: const EdgeInsets.only(right: 16),
                                          decoration: BoxDecoration(border: Border(right: BorderSide(color: cardBorder))),
                                          child: Column(
                                            children: [
                                              const Icon(Icons.access_time, color: Color(0xFF42A5F5), size: 24).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1,1), end: const Offset(1.1,1.1)),
                                              const SizedBox(height: 12),
                                              Text(item['startTime'] ?? '', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic), textAlign: TextAlign.center),
                                              const Text("TO", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, fontStyle: FontStyle.italic, height: 2)),
                                              Text(item['endTime'] ?? '', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic), textAlign: TextAlign.center),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 20),

                                        // Right Info
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const SizedBox(height: 12),
                                              Text("💠 ${item['subject']}".toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                              const SizedBox(height: 12),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    const Icon(Icons.room, size: 14, color: Color(0xFF42A5F5)),
                                                    const SizedBox(width: 6),
                                                    Text("ROOM NO: ${item['room']}", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1)),
                                                  ],
                                                ),
                                              ),
                                              const SizedBox(height: 24),
                                              
                                              // Homework Action Button
                                              GestureDetector(
                                                onTap: () => _openDiaryModal(item, isDarkMode, cardColor, cardBorder, textColorPrimary),
                                                child: Container(
                                                  width: double.infinity,
                                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                                  decoration: BoxDecoration(
                                                    color: hasActiveDiary ? const Color(0xFF10B981) : const Color(0xFF42A5F5),
                                                    borderRadius: BorderRadius.circular(20),
                                                    boxShadow: [BoxShadow(color: (hasActiveDiary ? const Color(0xFF10B981) : const Color(0xFF42A5F5)).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
                                                  ),
                                                  child: Row(
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: [
                                                      Icon(hasActiveDiary ? Icons.check_circle : Icons.book, color: Colors.white, size: 16),
                                                      const SizedBox(width: 8),
                                                      Text(hasActiveDiary ? "UPDATE DIARY (DONE)" : "HOMEWORK", style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                                    ],
                                                  ),
                                                ),
                                              )
                                            ],
                                          ),
                                        )
                                      ],
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1);
                            }).toList(),
                          )
                        : Container(
                            padding: const EdgeInsets.symmetric(vertical: 60),
                            width: double.infinity,
                            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(50), border: Border.all(color: cardBorder, width: 2)),
                            child: Column(
                              children: [
                                const Icon(Icons.menu_book, size: 60, color: Colors.grey).animate(onPlay: (c) => c.repeat(reverse: true)).slideY(begin: -0.1, end: 0.1, duration: 1.seconds),
                                const SizedBox(height: 24),
                                const Text("FREE FROM TODAY CLASSES! ⚡", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, fontStyle: FontStyle.italic, letterSpacing: 2)),
                              ],
                            ),
                          ).animate().fadeIn(),
                    ),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
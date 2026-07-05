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

// 🔥 ConsumerStatefulWidget for theme listening
class ClassDiary extends ConsumerStatefulWidget {
  const ClassDiary({super.key});

  @override
  ConsumerState<ClassDiary> createState() => _ClassDiaryState();
}

class _ClassDiaryState extends ConsumerState<ClassDiary> {
  bool loading = true;
  bool isFirstLoad = true;
  List<dynamic> homeworkList = [];
  
  late String selectedDate;
  late List<Map<String, String>> datesMenu;

  @override
  void initState() {
    super.initState();
    selectedDate = DateFormat('yyyy-MM-dd').format(DateTime.now());
    datesMenu = _getDates();
    _fetchHomework();
  }

  List<Map<String, String>> _getDates() {
    List<Map<String, String>> dates = [];
    for (int i = 0; i < 5; i++) {
      DateTime d = DateTime.now().subtract(Duration(days: i));
      dates.add({
        'full': DateFormat('yyyy-MM-dd').format(d),
        'day': DateFormat('EEE').format(d), 
        'date': d.day.toString(),
      });
    }
    return dates;
  }

  Future<void> _fetchHomework() async {
    if (isFirstLoad) {
      setState(() => loading = true);
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      String className = '';
      if (userStr != null) {
        final user = jsonDecode(userStr);
        className = user['grade'] ?? '';
      }

      final response = await ApiClient.dio.get('/homework/view?className=$className&date=$selectedDate');
      
      setState(() {
        homeworkList = response.data is List ? response.data : [];
      });
    } catch (err) {
      print("Diary Fetch Failed: $err");
      setState(() {
        homeworkList = [];
      });
    } finally {
      if (isFirstLoad) {
        setState(() {
          loading = false;
          isFirstLoad = false;
        });
      } else {
        setState(() {}); 
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading && isFirstLoad) return const CustomLoader();

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS FOR DARK/LIGHT MODE 🔥
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final Color innerBoxColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
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
          body: RefreshIndicator(
            color: const Color(0xFF42A5F5),
            backgroundColor: cardColor,
            onRefresh: _fetchHomework,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(), 
              padding: const EdgeInsets.only(bottom: 50),
              child: Column(
                children: [
                // ==========================================================
                // HEADER SECTION (Blue Gradient + Date Scroller)
                // ==========================================================
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.only(top: 60, bottom: 60), 
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
                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                  ),
                  child: Column(
                    children: [
                      // --- Header Row ---
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (context.canPop()) context.pop();
                                else context.go('/');
                              },
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                                ),
                                child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                              ),
                            ),
                            Column(
                              children: [
                                const Text(
                                  "Class Diary",
                                  style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1),
                                ),
                                Text(
                                  "DAILY LEARNING NOTES",
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white.withValues(alpha: 0.8), letterSpacing: 2),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                              ),
                              child: const Icon(Icons.menu_book, color: Colors.white, size: 24),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 30),

                      // --- Date Scroller ---
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(), 
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          children: datesMenu.map((d) {
                            bool isSelected = selectedDate == d['full'];
                            
                            // 🔥 Dynamic selector colors matching theme
                            Color selectorBg = isSelected 
                                ? (isDarkMode ? const Color(0xFF1E293B) : Colors.white) 
                                : Colors.white.withValues(alpha: 0.1);
                            Color selectorText = isSelected 
                                ? const Color(0xFF42A5F5) 
                                : Colors.white;

                            return GestureDetector(
                              onTap: () {
                                if (selectedDate != d['full']) {
                                  setState(() {
                                    selectedDate = d['full']!;
                                  });
                                  _fetchHomework(); 
                                }
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 300),
                                margin: const EdgeInsets.symmetric(horizontal: 6),
                                width: 70,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                decoration: BoxDecoration(
                                  color: selectorBg,
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(color: isSelected ? Colors.transparent : Colors.white.withValues(alpha: 0.2)),
                                  boxShadow: isSelected ? [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 10, offset: const Offset(0, 5))] : [],
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      d['day']!.toUpperCase(),
                                      style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: selectorText, letterSpacing: 2),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      d['date']!,
                                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: selectorText),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ),

                // ==========================================================
                // BODY SECTION (Overlapping Header)
                // ==========================================================
                Transform.translate(
                  offset: const Offset(0, -30),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: homeworkList.isNotEmpty
                          // --- HOMEWORK LIST ---
                          ? Column(
                              key: const ValueKey('homework-list'),
                              children: [
                                // Top Homework Label
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 400),
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: cardColor,
                                    borderRadius: BorderRadius.circular(35),
                                    border: Border.all(color: borderColor),
                                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))],
                                  ),
                                  child: const Text("Homework", textAlign: TextAlign.center, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: -1)),
                                ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
                                
                                const SizedBox(height: 24),

                                ...homeworkList.asMap().entries.map((entry) {
                                  int i = entry.key;
                                  var item = entry.value;
                                  
                                  String teacherName = item['teacherId'] != null && item['teacherId']['name'] != null 
                                      ? item['teacherId']['name'] 
                                      : "Faculty";
                                  
                                  String updateTime = "N/A";
                                  if (item['updatedAt'] != null) {
                                    updateTime = DateFormat('hh:mm a').format(DateTime.parse(item['updatedAt']).toLocal());
                                  }

                                  return AnimatedContainer(
                                    duration: const Duration(milliseconds: 400),
                                    margin: const EdgeInsets.only(bottom: 24),
                                    padding: const EdgeInsets.all(28),
                                    decoration: BoxDecoration(
                                      color: cardColor,
                                      borderRadius: BorderRadius.circular(40),
                                      border: Border.all(color: borderColor),
                                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))],
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Subject & Teacher Header
                                        Row(
                                          children: [
                                            Container(
                                              width: 48, height: 48,
                                              decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50, borderRadius: BorderRadius.circular(16)),
                                              child: const Icon(Icons.menu_book, color: Color(0xFF42A5F5), size: 24),
                                            ),
                                            const SizedBox(width: 16),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(item['subject']?.toString().toUpperCase() ?? "UNKNOWN SUBJECT", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary, height: 1.1)),
                                                  const SizedBox(height: 2),
                                                  Text("By Prof. $teacherName", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), fontStyle: FontStyle.italic)),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 20),

                                        // Content Box
                                        AnimatedContainer(
                                          duration: const Duration(milliseconds: 400),
                                          width: double.infinity,
                                          padding: const EdgeInsets.all(24),
                                          decoration: BoxDecoration(color: innerBoxColor, borderRadius: BorderRadius.circular(30), border: Border.all(color: borderColor)),
                                          child: Text(
                                            item['content'] ?? "No instructions provided.",
                                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColorSecondary, height: 1.5, fontStyle: FontStyle.italic),
                                          ),
                                        ),
                                        const SizedBox(height: 20),

                                        // Time Footer
                                        Row(
                                          children: [
                                            const Icon(Icons.access_time, size: 14, color: Color(0xFF94A3B8)),
                                            const SizedBox(width: 8),
                                            Text("UPDATED AT $updateTime", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ).animate().fadeIn(delay: Duration(milliseconds: 100 * i)).slideY(begin: 0.1);
                                }),
                              ],
                            )
                          
                          // --- EMPTY STATE ---
                          : AnimatedContainer(
                              duration: const Duration(milliseconds: 400),
                              key: const ValueKey('empty-diary'),
                              width: double.infinity,
                              constraints: const BoxConstraints(minHeight: 420),
                              padding: const EdgeInsets.all(32),
                              decoration: BoxDecoration(
                                color: cardColor,
                                borderRadius: BorderRadius.circular(55),
                                border: Border.all(color: borderColor, width: 2),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.wb_sunny, size: 80, color: Color.fromARGB(255, 237, 204, 37)).animate(onPlay: (c) => c.repeat()).rotate(duration: 8.seconds), // amber-300
                                  const SizedBox(height: 24),
                                  Text("No Homework Found", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                  const SizedBox(height: 8),
                                  const Text("Enjoy your day! No diary entries for this date. ❄️", textAlign: TextAlign.center, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                                ],
                              ),
                            ).animate().fadeIn().scale(begin: const Offset(0.9, 0.9)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      )
    ));
  }
}
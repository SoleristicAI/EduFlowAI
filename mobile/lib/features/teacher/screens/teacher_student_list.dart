import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class TeacherStudentList extends ConsumerStatefulWidget {
  const TeacherStudentList({super.key});

  @override
  ConsumerState<TeacherStudentList> createState() => _TeacherStudentListState();
}

class _TeacherStudentListState extends ConsumerState<TeacherStudentList> {
  bool isLoading = true;
  String assignedClass = "";
  List<dynamic> students = [];
  String searchQuery = "";
  Map<String, dynamic>? user;

  @override
  void initState() {
    super.initState();
    _initUserAndData();
  }

  Future<void> _initUserAndData() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      user = jsonDecode(userStr);
    }
    await _fetchStudents();
  }

  Future<void> _fetchStudents({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isLoading = true);

    try {
      final response = await ApiClient.dio.get('/attendance/my-class-list');
      if (mounted) {
        setState(() {
          students = response.data['students'] ?? [];
          assignedClass = response.data['className'] ?? "";
        });
      }
    } catch (e) {
      debugPrint("Error fetching class list: $e");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  // --- NATIVE CALL & WHATSAPP LOGIC ---
  Future<void> _handleCall(String number) async {
    if (number.isEmpty || number == "No signal") return;
    final Uri launchUri = Uri(scheme: 'tel', path: number);
    try {
      if (!await launchUrl(launchUri)) {
        _showToast("Could not open dialer ⚠️", isError: true);
      }
    } catch (e) {
      _showToast("Error opening dialer", isError: true);
    }
  }

  Future<void> _handleWhatsApp(String number) async {
    if (number.isEmpty || number == "No signal") return;
    
    // 🔥 EXACT FIX: Safely parse school name with Type Checking 🔥
    // Agar schoolId sirf ek string ID hui toh ab app crash nahi karega!
    String schoolName = "the school";
    
    if (user != null) {
      if (user!['schoolName'] is String) {
        schoolName = user!['schoolName'];
      } else if (user!['schoolData'] is Map && user!['schoolData']['schoolName'] is String) {
        schoolName = user!['schoolData']['schoolName'];
      } else if (user!['schoolId'] is Map && user!['schoolId']['schoolName'] is String) {
        schoolName = user!['schoolId']['schoolName'];
      }
    }
    
    final msg = "Hello, I am your child's class teacher from $schoolName. I would like to discuss something important regarding your child. Please connect with me when convenient.";
    
    final Uri launchUri = Uri.parse("https://wa.me/$number?text=${Uri.encodeComponent(msg)}");
    try {
      if (!await launchUrl(launchUri, mode: LaunchMode.externalApplication)) {
        _showToast("Could not open WhatsApp ⚠️", isError: true);
      }
    } catch (e) {
      _showToast("WhatsApp not installed or error", isError: true);
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
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : Colors.white;

    // Filter Logic
    final filteredStudents = students.where((s) {
      final name = (s['name'] ?? '').toString().toLowerCase();
      final roll = (s['enrollmentNo'] ?? '').toString().toLowerCase();
      final q = searchQuery.toLowerCase();
      return name.contains(q) || roll.contains(q);
    }).toList();

    // No Assigned Class State
   if (assignedClass.isEmpty && students.isEmpty) {
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
                    const SizedBox(width: 48), // Balancing layout ke liye
                  ],
                ),
              ),
              
              // --- TERA PURANA MAIN CONTENT (DESIGN MAINTAINED) ---
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.shield, size: 80, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text("NO CLASS ASSIGNED!", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: 1.5)),
                      const SizedBox(height: 8),
                      const Text("Initialize class mapping via admin.", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF42A5F5))),
                      const SizedBox(height: 32),
                      GestureDetector(
                        onTap: () {
                          // 🔥 SAME SAFE ROUTING YAHAN BHI 🔥
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/teacher/home');
                          }
                        },
                        child: const Text("RETURN TO HUB", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2, decoration: TextDecoration.underline)),
                      )
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
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/teacher/home'); // Safe Routing
        }
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: cardColor,
          onRefresh: () => _fetchStudents(isRefresh: true),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()), // No Rubber banding
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    // --- HEADER SECTION ---
                    Container(
                      padding: const EdgeInsets.only(top: 60, bottom: 40, left: 24, right: 24),
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
                                  if (context.canPop()) context.pop();
                                  else context.go('/teacher/home');
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
                                  const Text("Class List", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                  Text("CLASS: $assignedClass".toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                                child: const Icon(Icons.people, color: Colors.white, size: 24),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          
                          // SEARCH BOX
                          Container(
                            decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(25), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)]),
                            child: TextField(
                              onChanged: (val) => setState(() => searchQuery = val),
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
                              decoration: InputDecoration(
                                hintText: "Search student or roll no...",
                                hintStyle: TextStyle(fontSize: 12, color: textColorSecondary.withOpacity(0.6)),
                                prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(vertical: 18),
                              ),
                            ),
                          )
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- MAIN LIST AREA ---
                    Transform.translate(
                      offset: const Offset(0, -20),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(left: 8, bottom: 16),
                              child: Text("TOTAL STUDENTS: ${filteredStudents.length}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                            ),

                            if (filteredStudents.isEmpty)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 60),
                                child: Center(child: Text("NO MATCHING STUDENT RECORDS FOUND", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 2))),
                              )
                            else
                              ...filteredStudents.map((s) {
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 20),
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: cardColor,
                                    borderRadius: BorderRadius.circular(40),
                                    border: Border.all(color: cardBorder),
                                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
                                  ),
                                  child: Column(
                                    children: [
                                      // Top Info
                                      Row(
                                        children: [
                                          Container(
                                            width: 55, height: 55,
                                            alignment: Alignment.center,
                                            decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
                                            child: Text(s['name'].toString().substring(0, 1).toUpperCase(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5))),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(s['name'].toString().toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                                const SizedBox(height: 8),
                                                Text("ROLL: ${s['enrollmentNo']}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                                const SizedBox(height: 4),
                                                Text("FATHER: ${(s['fatherName'] ?? 'Not set').toString().toUpperCase()}", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5)),
                                              ],
                                            ),
                                          )
                                        ],
                                      ),
                                      const SizedBox(height: 20),

                                      // Contact Actions Box
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Padding(
                                                padding: const EdgeInsets.only(left: 8),
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text("CONTACT PARENT", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                                    const SizedBox(height: 4),
                                                    Text(s['phone'] ?? "No signal", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorSecondary)),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            Row(
                                              children: [
                                                GestureDetector(
                                                  onTap: () => _handleCall(s['phone'] ?? ''),
                                                  child: Container(
                                                    width: 45, height: 45,
                                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(15), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5)]),
                                                    child: const Icon(Icons.phone, color: Color(0xFF10B981), size: 20),
                                                  ),
                                                ),
                                                const SizedBox(width: 10),
                                                GestureDetector(
                                                  onTap: () => _handleWhatsApp(s['phone'] ?? ''),
                                                  child: Container(
                                                    width: 45, height: 45,
                                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(15), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5)]),
                                                    child: const Icon(Icons.chat_bubble, color: Color(0xFF42A5F5), size: 20),
                                                  ),
                                                ),
                                              ],
                                            )
                                          ],
                                        ),
                                      )
                                    ],
                                  ),
                                ).animate().fadeIn().slideY(begin: 0.1);
                              }).toList(),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 50), // 🔥 EXACT 50PX BOTTOM PADDING LOCKED 🔥
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
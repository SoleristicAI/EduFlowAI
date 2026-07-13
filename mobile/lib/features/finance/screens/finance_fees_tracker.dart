import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class FinanceFeesTracker extends ConsumerStatefulWidget {
  const FinanceFeesTracker({super.key});

  @override
  ConsumerState<FinanceFeesTracker> createState() => _FinanceFeesTrackerState();
}

class _FinanceFeesTrackerState extends ConsumerState<FinanceFeesTracker> {
  bool isInitialLoading = true;
  bool isFetchingStudents = false;

  List<dynamic> classes = [];
  String selectedClass = '';
  List<dynamic> students = [];
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchClasses();
  }

  Future<void> _fetchClasses() async {
    try {
      final res = await ApiClient.dio.get('/fees/tracker/classes');
      if (mounted) {
        List<dynamic> rawClasses = res.data ?? [];

        // 🔥 SMART SORTING LOGIC FOR CLASSES 🔥
        rawClasses.sort((a, b) {
          String g1 = a.toString().trim();
          String g2 = b.toString().trim();

          int getWeight(String grade) {
            String g = grade.toLowerCase();
            if (g.contains('play') || g.contains('pre')) return -4;
            if (g.contains('nur')) return -3;
            if (g.contains('lkg') || g.contains('kg1')) return -2;
            if (g.contains('ukg') || g.contains('kg2')) return -1;
            final match = RegExp(r'\d+').firstMatch(g);
            if (match != null) return int.parse(match.group(0)!);
            return 999;
          }

          int weight1 = getWeight(g1);
          int weight2 = getWeight(g2);

          if (weight1 != weight2) return weight1.compareTo(weight2);
          return g1.compareTo(g2);
        });

        setState(() => classes = rawClasses);
      }
    } catch (e) {
      _showToast("Failed to load active classes", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleClassSelect(String grade, {bool hideLoader = false}) async {
    setState(() {
      selectedClass = grade;
      searchQuery = '';
      if (!hideLoader) isFetchingStudents = true;
    });

    try {
      final res = await ApiClient.dio.get('/fees/tracker/students/$grade');
      if (mounted) setState(() => students = res.data ?? []);
    } catch (e) {
      _showToast("Failed to load students for Class $grade", isError: true);
    } finally {
      if (mounted) setState(() => isFetchingStudents = false);
    }
  }

  // 🔥 NATIVE REFRESH LOGIC 🔥
  Future<void> _handleRefresh() async {
    await _fetchClasses();
    if (selectedClass.isNotEmpty) {
      await _handleClassSelect(selectedClass, hideLoader: true);
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
    if (isInitialLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    final filteredStudents = students.where((s) {
      final query = searchQuery.toLowerCase();
      final name = s['name']?.toString().toLowerCase() ?? '';
      final enroll = s['enrollmentNo']?.toString().toLowerCase() ?? '';
      return name.contains(query) || enroll.contains(query);
    }).toList();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/finance/dashboard');
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: bgColor,
        child: Scaffold(
          backgroundColor: Colors.transparent,
          // 🔥 EXACT REFRESH INDICATOR & SCROLL VIEW STRUCTURE 🔥
           body: RefreshIndicator(
            color: const Color(0xFF42A5F5),
            backgroundColor: cardColor,
            onRefresh: _handleRefresh,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()),
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // --- EXACT PREMIUM HEADER ---
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.only(top: 60, bottom: 80, left: 24, right: 24),
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
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (context.canPop()) context.pop();
                                else context.go('/finance/dashboard');
                              },
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.3)),
                                ),
                                child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                              ),
                            ),
                            Column(
                              children: [
                                const Text("Fees Tracker",
                                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                Text("STUDENT PAYMENT RECORDS",
                                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white.withOpacity(0.3)),
                              ),
                              child: const Icon(Icons.people_alt, color: Colors.white, size: 24),
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      // --- BODY CONTENT OVERLAPPING THE HEADER ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              
                              // 1. CLASS SELECTOR BOX
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  color: cardColor,
                                  borderRadius: BorderRadius.circular(35),
                                  border: Border.all(color: cardBorder),
                                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.class_, size: 14, color: textColorSecondary),
                                        const SizedBox(width: 8),
                                        Text("SELECT CLASS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    GestureDetector(
                                      onTap: () => _showClassPickerBottomSheet(isDarkMode),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                        decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                selectedClass.isEmpty ? "Choose active class..." : "Class $selectedClass",
                                                maxLines: 1, overflow: TextOverflow.ellipsis,
                                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: selectedClass.isEmpty ? const Color(0xFF94A3B8) : textColorPrimary, fontStyle: FontStyle.italic)
                                              ),
                                            ),
                                            const Icon(Icons.keyboard_arrow_down, color: Color(0xFF42A5F5)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),

                              const SizedBox(height: 20),

                              // 2. DYNAMIC STUDENT SECTION
                              if (selectedClass.isNotEmpty) ...[
                                
                                // SEARCH BAR
                                Container(
                                  decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]),
                                  child: TextField(
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
                                    decoration: InputDecoration(
                                      prefixIcon: const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Icon(Icons.search, color: Color(0xFF42A5F5), size: 20)),
                                      prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                                      hintText: "Search name or enrollment...",
                                      hintStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary.withOpacity(0.6), fontStyle: FontStyle.italic),
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(vertical: 18),
                                    ),
                                    onChanged: (val) => setState(() => searchQuery = val),
                                  ),
                                ).animate().fadeIn().slideY(begin: 0.1),

                                const SizedBox(height: 24),

                                // STUDENT LISTING
                                if (isFetchingStudents)
                                  const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator(color: Color(0xFF42A5F5))))
                                else if (filteredStudents.isEmpty)
                                  Container(
                                    width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 40),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(35), border: Border.all(color: cardBorder, style: BorderStyle.solid)),
                                    child: Text("No student records found", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                  ).animate().fadeIn()
                                else
                                  ...filteredStudents.map((student) {
                                    return GestureDetector(
                                      onTap: () => context.push('/finance/student-ledger/${student['_id']}'),
                                      child: Container(
                                        margin: const EdgeInsets.only(bottom: 16),
                                        padding: const EdgeInsets.all(20),
                                        decoration: BoxDecoration(
                                          color: cardColor,
                                          borderRadius: BorderRadius.circular(30),
                                          border: Border.all(color: cardBorder),
                                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))]
                                        ),
                                        child: Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(14),
                                              decoration: BoxDecoration(color: const Color(0xFF42A5F5).withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                                              child: const Icon(Icons.school, size: 20, color: Color(0xFF42A5F5)),
                                            ),
                                            const SizedBox(width: 16),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(student['name']?.toString().toUpperCase() ?? 'UNKNOWN', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                                  const SizedBox(height: 6),
                                                  Row(
                                                    children: [
                                                      // Text("ADM: ${student['admissionNo'] ?? 'N/A'}", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1)),
                                                      Container(margin: const EdgeInsets.symmetric(horizontal: 6), width: 3, height: 3, decoration: BoxDecoration(color: textColorSecondary, shape: BoxShape.circle)),
                                                      Text("ENR: ${student['enrollmentNo'] ?? 'N/A'}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1)),
                                                    ],
                                                  )
                                                ],
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Icon(Icons.arrow_forward_ios, size: 14, color: textColorSecondary.withOpacity(0.5)),
                                          ],
                                        ),
                                      ).animate().fadeIn().slideX(begin: 0.1),
                                    );
                                  }),

                              ]
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 50), // 🔥 BOTTOM 50px LOCKED 🔥
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- BOTTOM SHEETS ---
  void _showClassPickerBottomSheet(bool isDark) {
    showModalBottomSheet(
      context: context, backgroundColor: Colors.transparent, isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.5,
          padding: const EdgeInsets.only(top: 12, left: 24, right: 24, bottom: 24),
          decoration: BoxDecoration(color: isDark ? const Color(0xFF1E293B) : Colors.white, borderRadius: const BorderRadius.vertical(top: Radius.circular(40)), border: Border(top: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFDDE3EA), width: 2))),
          child: Column(
            children: [
              Container(width: 50, height: 5, margin: const EdgeInsets.only(bottom: 24), decoration: BoxDecoration(color: isDark ? const Color(0xFF334155) : Colors.grey.shade300, borderRadius: BorderRadius.circular(10))),
              const Text("SELECT CLASS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1)),
              const SizedBox(height: 16),
              Expanded(
                child: classes.isEmpty 
                  ? Center(child: Text("NO DATA FOUND", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey.shade400, letterSpacing: 1.5)))
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(), itemCount: classes.length,
                      itemBuilder: (context, index) {
                        return GestureDetector(
                          onTap: () {
                            Navigator.pop(context);
                            _handleClassSelect(classes[index].toString());
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                            decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(16), border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))),
                            child: Text("CLASS ${classes[index].toString()}".toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87, letterSpacing: 1.5)),
                          ),
                        );
                      },
                    ),
              ),
            ],
          ),
        );
      },
    );
  }
}
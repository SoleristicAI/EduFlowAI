import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class StudentSyllabus extends ConsumerStatefulWidget {
  const StudentSyllabus({super.key});

  @override
  ConsumerState<StudentSyllabus> createState() => _StudentSyllabusState();
}

class _StudentSyllabusState extends ConsumerState<StudentSyllabus> {
  bool isInitialLoading = true;
  List<dynamic> syllabuses = [];
  dynamic selectedSyllabus; // 🔥 NAYA STATE: For Dropdown Selection
  String? error;

  @override
  void initState() {
    super.initState();
    _fetchSyllabus(isRefresh: false);
  }

  Future<void> _fetchSyllabus({bool isRefresh = false}) async {
    if (!isRefresh && mounted) {
      setState(() => isInitialLoading = true);
    }

    try {
      final response = await ApiClient.dio.get('/exam-syllabus/my-syllabus');
      if (mounted) {
        setState(() {
          syllabuses = response.data as List<dynamic>;
          error = null;
          isInitialLoading = false;
          
          // Agar refresh par purana selected syllabus exist nahi karta toh clear kar do
          if (selectedSyllabus != null) {
            bool exists = syllabuses.any((s) => s['_id'] == selectedSyllabus['_id']);
            if (!exists) selectedSyllabus = null;
          }
        });
      }
    } catch (err) {
      if (mounted) {
        setState(() {
          error = "Failed to load syllabus neural link.";
          isInitialLoading = false;
        });
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchSyllabus(isRefresh: true);
  }

  // 🔥 NAYA FUNCTION: BOTTOM SHEET DROPDOWN KE LIYE 🔥
  void _showSyllabusPicker(Color bottomSheetBg, Color textColorPrimary, Color textColorSecondary) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: bottomSheetBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40, height: 5,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
              ),
              const SizedBox(height: 24),
              Text("SELECT EXAM", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: syllabuses.length,
                  itemBuilder: (context, index) {
                    final s = syllabuses[index];
                    bool isSelected = selectedSyllabus != null && selectedSyllabus['_id'] == s['_id'];
                    
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          selectedSyllabus = s;
                        });
                        Navigator.pop(context);
                      },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF42A5F5) : Colors.transparent,
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(color: isSelected ? Colors.transparent : textColorSecondary.withOpacity(0.2)),
                        ),
                        child: Text(
                          (s['title'] ?? '').toString().toUpperCase(),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            color: isSelected ? Colors.white : textColorPrimary,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      }
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
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);
    
    final Color subjectBoxBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color subjectBadgeBg = isDarkMode ? const Color(0xFF0C4A6E).withOpacity(0.5) : const Color(0xFFF0F9FF);
    final Color subjectBadgeBorder = isDarkMode ? const Color(0xFF0C4A6E) : const Color(0xFFBAE6FD);
    final Color subjectTitleColor = isDarkMode ? const Color(0xFF38BDF8) : const Color(0xFF0369A1);
    
    final Color dropdownBg = isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC);
    final Color dropdownBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) context.pop();
        else context.go('/');
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: bgColor,
        child: Scaffold(
          backgroundColor: Colors.transparent,
          body: RefreshIndicator(
            color: const Color(0xFF42A5F5),
            backgroundColor: cardColor,
            onRefresh: _handleRefresh,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      // --- BLUE HEADER SECTION ---
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
                        child: Column(
                          children: [
                            // 🔥 EXACT COMPACT HEADER LAYOUT 🔥
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    if (context.canPop()) context.pop();
                                    else context.go('/');
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
                                    const Text(
                                      "Exam Syllabus",
                                      style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)
                                    ),
                                    Text(
                                      "ACADEMIC CURRICULUM",
                                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: const Icon(Icons.menu_book, color: Colors.white, size: 24),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      // --- CONTENT AREA ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: error != null
                            ? _buildErrorState(error!, cardColor, cardBorder, textColorSecondary)
                            : syllabuses.isEmpty 
                                ? _buildEmptyState(cardColor, cardBorder, textColorPrimary, textColorSecondary)
                                : Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // 🔥 NAYA DROPDOWN BUTTON FOR EXAM SELECTION 🔥
                                      Padding(
                                        padding: const EdgeInsets.only(left: 16, bottom: 8),
                                        child: Text("SELECT EXAM", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                      ),
                                      GestureDetector(
                                        onTap: () => _showSyllabusPicker(cardColor, textColorPrimary, textColorSecondary),
                                        child: AnimatedContainer(
                                          duration: const Duration(milliseconds: 400),
                                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                                          decoration: BoxDecoration(
                                            color: dropdownBg,
                                            borderRadius: BorderRadius.circular(30),
                                            border: Border.all(color: dropdownBorder),
                                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]
                                          ),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  selectedSyllabus != null ? (selectedSyllabus['title'] ?? '').toString().toUpperCase() : "CHOOSE AN EXAM",
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w900,
                                                    fontStyle: FontStyle.italic,
                                                    color: selectedSyllabus != null ? textColorPrimary : textColorSecondary
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              Icon(Icons.keyboard_arrow_down, color: textColorSecondary, size: 20)
                                            ],
                                          ),
                                        ),
                                      ).animate().fadeIn().slideY(begin: 0.1),
                                      const SizedBox(height: 24),

                                      // 🔥 CONTENT RENDER HOGA AGAR KUCH SELECT KIYA HAI 🔥
                                      if (selectedSyllabus != null) 
                                        _buildSelectedSyllabus(isDarkMode, selectedSyllabus, textColorPrimary, textColorSecondary, subjectBoxBg, cardBorder, subjectBadgeBg, subjectBadgeBorder, subjectTitleColor)
                                      else
                                        // Placeholder when nothing is selected
                                        Padding(
                                          padding: const EdgeInsets.only(top: 40),
                                          child: Center(
                                            child: Column(
                                              children: [
                                                Icon(Icons.touch_app, size: 50, color: textColorSecondary.withOpacity(0.3)),
                                                const SizedBox(height: 16),
                                                Text(
                                                  "PLEASE SELECT AN EXAM\nTO VIEW ITS SYLLABUS",
                                                  textAlign: TextAlign.center,
                                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5),
                                                ),
                                              ],
                                            ),
                                          ).animate().fadeIn(),
                                        )
                                    ],
                                  ),
                        ),
                      ),
                      const SizedBox(height: 50), // 🔥 BOTTOM PADDING 50 LOCKED
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

  // --- WIDGETS --- //

  Widget _buildErrorState(String errMsg, Color cardColor, Color cardBorder, Color textColorSecondary) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(45),
        border: Border.all(color: cardBorder),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))]
      ),
      child: Column(
        children: [
          Icon(Icons.security, size: 60, color: textColorSecondary.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(
            errMsg.toUpperCase(),
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5),
          ),
        ],
      ),
    ).animate().fadeIn();
  }

  Widget _buildEmptyState(Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(45),
        border: Border.all(color: cardBorder),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))]
      ),
      child: Column(
        children: [
          const Icon(Icons.description, size: 60, color: Color(0xFFDBEAFE)),
          const SizedBox(height: 16),
          Text(
            "NO SYLLABUS YET",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: -0.5),
          ),
          const SizedBox(height: 8),
          Text(
            "YOUR CLASS TEACHERS HAVEN'T PUBLISHED ANY EXAM SYLLABUS YET.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  // 🔥 NAYA WIDGET: Bada Box hata diya, direct List render hogi 🔥
  Widget _buildSelectedSyllabus(bool isDarkMode, dynamic syllabus, Color textColorPrimary, Color textColorSecondary, Color subjectBoxBg, Color cardBorder, Color subjectBadgeBg, Color subjectBadgeBorder, Color subjectTitleColor) {
    List<dynamic> subjects = syllabus['subjects'] ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title & Status Badge directly on background
        Center(
          child: Column(
            children: [
              Container(
                width: 56, height: 56,
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100, width: 2),
                ),
                child: const Icon(Icons.layers, color: Color(0xFF42A5F5), size: 28),
              ),
              Text(
                (syllabus['title'] ?? '').toString().toUpperCase(),
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: -0.5, height: 1.1),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                decoration: BoxDecoration(
                  color: isDarkMode ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(color: isDarkMode ? const Color(0xFF064E3B) : const Color(0xFFD1FAE5))
                ),
                child: Text(
                  "PUBLISHED & OFFICIAL",
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF34D399) : const Color(0xFF10B981), letterSpacing: 2, fontStyle: FontStyle.italic),
                ),
              ),
            ],
          ),
        ).animate().fadeIn().slideY(begin: -0.1),
        const SizedBox(height: 32),

        // 🔥 Separate Subject Cards (No outer giant box) 🔥
        ...subjects.where((sub) => sub['content'] != null && sub['content'].toString().trim().isNotEmpty && sub['content'] != "Not Applicable").map((sub) {
          int index = subjects.indexOf(sub);
          return AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: subjectBoxBg,
              borderRadius: BorderRadius.circular(35),
              border: Border.all(color: cardBorder),
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Subject Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: subjectBadgeBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: subjectBadgeBorder),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.school, size: 16, color: subjectTitleColor),
                      const SizedBox(width: 8),
                      Text(
                        (sub['subjectName'] ?? '').toString().toUpperCase(),
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: subjectTitleColor, fontStyle: FontStyle.italic),
                      )
                    ],
                  ),
                ),
                
                // Subject Content
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.only(left: 12),
                  decoration: const BoxDecoration(
                    border: Border(left: BorderSide(color: Color(0xFF42A5F5), width: 2))
                  ),
                  child: Text(
                    sub['content'] ?? '',
                    textAlign: TextAlign.left,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic, height: 1.5),
                  ),
                )
              ],
            ),
          ).animate().fadeIn(delay: Duration(milliseconds: 100 * index)).slideX(begin: 0.1);
        }).toList(),

        // Footer Verify Badge
        const SizedBox(height: 24),
        Center(
          child: Opacity(
            opacity: 0.3,
            child: Column(
              children: [
                Container(width: 40, height: 4, decoration: BoxDecoration(color: textColorSecondary, borderRadius: BorderRadius.circular(10))),
                const SizedBox(height: 8),
                Text(
                  "EDUFLOWAI VERIFIED",
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: 3),
                )
              ],
            ),
          ),
        )
      ],
    );
  }
}
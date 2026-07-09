import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart'; // 🔥 LOADER IMPORT KIYA

class TeacherNotices extends ConsumerStatefulWidget {
  const TeacherNotices({super.key});

  @override
  ConsumerState<TeacherNotices> createState() => _TeacherNoticesState();
}

class _TeacherNoticesState extends ConsumerState<TeacherNotices> {
  bool isLoading = true;
  bool isSubmitting = false;
  
  List<String> classes = [];
  String targetGrade = '';
  
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _contentCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchClasses();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchClasses({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isLoading = true);
    
    try {
      final response = await ApiClient.dio.get('/notices/meta/classes');
      if (mounted) {
        setState(() {
          classes = (response.data as List).map((e) => e.toString()).toList();
          
          // 🔥 CLASSES KO ASCENDING ORDER MEIN SORT KAR DIYA 🔥
          classes.sort((a, b) {
            int? numA = int.tryParse(a.replaceAll(RegExp(r'[^0-9]'), ''));
            int? numB = int.tryParse(b.replaceAll(RegExp(r'[^0-9]'), ''));
            if (numA != null && numB != null) return numA.compareTo(numB);
            return a.compareTo(b);
          });
          
          isLoading = false;
        });
      }
    } catch (e) {
      _showToast("Meta Fetch Error!", isError: true);
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _handleSubmit() async {
    if (targetGrade.isEmpty) {
      _showToast("Please select a target class!", isError: true);
      return;
    }
    if (_titleCtrl.text.trim().isEmpty || _contentCtrl.text.trim().isEmpty) {
      _showToast("Title and Details are required!", isError: true);
      return;
    }

    setState(() => isSubmitting = true);

    try {
      await ApiClient.dio.post('/notices/create', data: {
        'title': _titleCtrl.text.trim(),
        'content': _contentCtrl.text.trim(),
        'audience': 'specific_grade',
        'targetGrade': targetGrade,
      });

      _showToast("Class broadcast successful! 📡");
      
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) context.go('/teacher/home');
      });
    } catch (e) {
      _showToast("Failed to post notice. 🛡️", isError: true);
      setState(() => isSubmitting = false);
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

  // 🔥 BOTTOM SHEET DROPDOWN LOGIC 🔥
  void _showClassPicker(bool isDarkMode, Color bgColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, -5))],
          ),
          padding: const EdgeInsets.only(top: 15, bottom: 40, left: 24, right: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 50, height: 6, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(10))),
              const SizedBox(height: 24),
              Text("SELECT CLASS", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: 2)),
              const SizedBox(height: 24),
              ConstrainedBox(
                constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.5),
                child: ListView.builder(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  itemCount: classes.length,
                  itemBuilder: (context, index) {
                    bool isSelected = targetGrade == classes[index];
                    return GestureDetector(
                      onTap: () {
                        setState(() => targetGrade = classes[index]);
                        Navigator.pop(ctx);
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF42A5F5).withOpacity(0.1) : (isDarkMode ? const Color(0xFF1E293B) : Colors.white),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: isSelected ? const Color(0xFF42A5F5) : cardBorder),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Class ${classes[index]}", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: isSelected ? const Color(0xFF42A5F5) : textColorSecondary, fontStyle: FontStyle.italic)),
                            if (isSelected) const Icon(Icons.check_circle, color: Color(0xFF42A5F5), size: 20)
                          ],
                        ),
                      ),
                    );
                  }
                ),
              )
            ],
          ),
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 1. INITIAL LOADER ADDED 🔥
    if (isLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

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
        // 🔥 2. REFRESH INDICATOR ADDED 🔥
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: cardColor,
          onRefresh: () => _fetchClasses(isRefresh: true),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()), // NO RUBBER-BANDING AT TOP
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
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
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
                              const Text("Class Updates", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
                              Text("SEND MESSAGES TO STUDENTS", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                            child: const Icon(Icons.campaign, color: Colors.white, size: 24),
                          ),
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- FORM SECTION ---
                    Transform.translate(
                      offset: const Offset(0, -20),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: cardColor,
                            borderRadius: BorderRadius.circular(40),
                            border: Border.all(color: cardBorder),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              
                              // 1. CLASS SELECTOR (BottomSheet Trigger)
                              const Padding(
                                padding: EdgeInsets.only(left: 8, bottom: 8),
                                child: Text("CLASS :", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic)),
                              ),
                              GestureDetector(
                                onTap: () => _showClassPicker(isDarkMode, bgColor, cardBorder, textColorPrimary, textColorSecondary),
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: inputBg,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: cardBorder),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(Icons.people, size: 20, color: targetGrade.isNotEmpty ? const Color(0xFF42A5F5) : Colors.grey),
                                          const SizedBox(width: 12),
                                          Text(targetGrade.isNotEmpty ? "Class $targetGrade" : "Select class", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: targetGrade.isNotEmpty ? textColorPrimary : Colors.grey, fontStyle: FontStyle.italic)),
                                        ],
                                      ),
                                      const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // 2. SUBJECT INPUT
                              const Padding(
                                padding: EdgeInsets.only(left: 8, bottom: 8),
                                child: Text("SUBJECT :", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic)),
                              ),
                              Container(
                                decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                child: TextField(
                                  controller: _titleCtrl,
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
                                  decoration: InputDecoration(
                                    hintText: "e.g. Updates",
                                    hintStyle: TextStyle(fontSize: 14, color: textColorSecondary.withOpacity(0.5)),
                                    border: InputBorder.none,
                                    contentPadding: const EdgeInsets.all(16),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // 3. DETAILS TEXTAREA
                              const Padding(
                                padding: EdgeInsets.only(left: 8, bottom: 8),
                                child: Text("DETAILS OF THE NOTICE :", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic)),
                              ),
                              Container(
                                decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                child: TextField(
                                  controller: _contentCtrl,
                                  maxLines: 5,
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
                                  decoration: InputDecoration(
                                    hintText: "Write your details here...",
                                    hintStyle: TextStyle(fontSize: 13, color: textColorSecondary.withOpacity(0.5)),
                                    border: InputBorder.none,
                                    contentPadding: const EdgeInsets.all(16),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 32),

                              // 4. SUBMIT BUTTON
                              GestureDetector(
                                onTap: isSubmitting ? null : _handleSubmit,
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 20),
                                  decoration: BoxDecoration(
                                    color: isSubmitting ? Colors.grey : const Color(0xFF42A5F5),
                                    borderRadius: BorderRadius.circular(30),
                                    border: Border(bottom: BorderSide(color: isSubmitting ? Colors.grey.shade600 : const Color(0xFF1E88E5), width: 4)),
                                    boxShadow: isSubmitting ? [] : [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      if (isSubmitting) const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                      else const Icon(Icons.send, color: Colors.white, size: 18),
                                      const SizedBox(width: 10),
                                      Text(isSubmitting ? "TRANSMITTING..." : "NOTIFY STUDENTS", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                    ],
                                  ),
                                ),
                              )
                            ],
                          ),
                        ),
                      ),
                    ).animate().fadeIn().slideY(begin: 0.1),

                    // 🔥 3. BOTTOM NAVIGATION PADDING ADDED 🔥
                    const SizedBox(height: 140), 
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
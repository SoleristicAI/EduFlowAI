import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

class StudentMySubjects extends ConsumerStatefulWidget {
  const StudentMySubjects({super.key});

  @override
  ConsumerState<StudentMySubjects> createState() => _StudentMySubjectsState();
}

class _StudentMySubjectsState extends ConsumerState<StudentMySubjects> {
  bool loading = true;
  List<dynamic> subjects = [];
  bool showToast = false;
  String toastMessage = "";
  bool isErrorToast = false;

  @override
  void initState() {
    super.initState();
    _fetchMySubjects();
  }

  Future<void> _fetchMySubjects() async {
    try {
      final response = await ApiClient.dio.get('/student/my-subjects');
      
      if (mounted) {
        setState(() {
          subjects = response.data as List<dynamic>;
          loading = false;
        });
      }
    } catch (e) {
      _triggerToast("Failed to load subjects", isError: true);
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchMySubjects();
  }

  void _triggerToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 13)),
        backgroundColor: isError ? Colors.redAccent : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.all(20),
      ),
    );
  }

  // --- WHATSAPP REDIRECTION LOGIC ---
  Future<void> _launchWhatsApp(String phone, String subject) async {
    String cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.length == 10) {
        cleanPhone = '+91$cleanPhone';
      }
    }

    String formattedSubject = subject.isNotEmpty 
        ? subject[0].toUpperCase() + subject.substring(1).toLowerCase() 
        : "Subject";

    String message = "Mam, I have a query regarding the $formattedSubject subject. Please assist me when you get a chance. Thank you!";
    String encodedMessage = Uri.encodeComponent(message);
    String cleanPhoneForWa = cleanPhone.replaceAll('+', '');

    // 1. Direct Native WhatsApp App Scheme
    final Uri whatsappAppUri = Uri.parse("whatsapp://send?phone=$cleanPhoneForWa&text=$encodedMessage");
    // 2. Fallback Web/Browser Scheme
    final Uri whatsappWebUri = Uri.parse("https://wa.me/$cleanPhoneForWa?text=$encodedMessage");

    try {
      // Pehle Native WhatsApp kholne ki koshish karega
      if (await canLaunchUrl(whatsappAppUri)) {
        await launchUrl(whatsappAppUri, mode: LaunchMode.externalApplication);
      } 
      // Agar strict Android security block kare, toh zabardasti Web se forward karega
      else {
        bool launched = await launchUrl(whatsappWebUri, mode: LaunchMode.externalApplication);
        if (!launched) {
          _triggerToast("Could not open WhatsApp", isError: true);
        }
      }
    } catch (e) {
      _triggerToast("Could not open WhatsApp", isError: true);
    }
  }

  // Helper function to capitalize names (John Doe)
  String _capitalizeName(String text) {
    if (text.isEmpty) return text;
    return text.split(' ').map((word) {
      if (word.isEmpty) return word;
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    }).join(' ');
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS FOR DARK/LIGHT MODE 🔥
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color subjectBoxBg = isDarkMode ? const Color(0xFF0C4A6E).withOpacity(0.3) : Colors.lightBlue.shade50;
    final Color subjectBoxBorder = isDarkMode ? const Color(0xFF0C4A6E) : Colors.lightBlue.shade100;
    final Color subjectLabelColor = isDarkMode ? const Color(0xFF38BDF8) : const Color(0xFF0369A1);
    final Color subjectNameColor = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color teacherBoxBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color teacherNameColor = isDarkMode ? const Color(0xFFE2E8F0) : const Color(0xFF334155);

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
          backgroundColor: Colors.transparent, // Background transparent for AnimatedContainer
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
                        padding: const EdgeInsets.only(top: 60, bottom: 80),
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
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            children: [
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
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: Colors.white.withOpacity(0.3)),
                                      ),
                                      child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                                    ),
                                  ),
                                  Column(
                                    children: [
                                      const Text("My Subjects", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                      Text("YOUR CLASS SUBJECTS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: Colors.white.withOpacity(0.3)),
                                    ),
                                    child: const Icon(Icons.menu_book, color: Colors.white, size: 22),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                      // --- CONTENT AREA ---
                     Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: subjects.isNotEmpty 
                              ? Column(
                                  children: subjects.asMap().entries.map((entry) {
                                    int index = entry.key;
                                    var item = entry.value;
                                    
                                    List<String> rawTeachers = (item['teachers'] ?? "").toString().split(',');
                                    List<String> teachers = rawTeachers.where((t) => t.trim().isNotEmpty).toList();

                                    return AnimatedContainer(
                                      duration: const Duration(milliseconds: 400),
                                      margin: const EdgeInsets.only(bottom: 24),
                                      padding: const EdgeInsets.all(24),
                                      decoration: BoxDecoration(
                                        color: cardColor,
                                        borderRadius: BorderRadius.circular(40),
                                        border: Border.all(color: cardBorder),
                                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]
                                      ),
                                      child: Column(
                                        children: [
                                          // Subject Box
                                          AnimatedContainer(
                                            duration: const Duration(milliseconds: 400),
                                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                            margin: const EdgeInsets.only(bottom: 20),
                                            decoration: BoxDecoration(
                                              color: subjectBoxBg,
                                              borderRadius: BorderRadius.circular(20),
                                              border: Border.all(color: subjectBoxBorder)
                                            ),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.menu_book, color: Color(0xFF0284C7), size: 18),
                                                const SizedBox(width: 12),
                                                Text("SUBJECT: ", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: subjectLabelColor)),
                                                Expanded(
                                                  child: Text(
                                                    (item['subject'] ?? '').toString().toUpperCase(),
                                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: subjectNameColor),
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),

                                          // Teacher List
                                          Column(
                                            children: teachers.map((teacherStr) {
                                              var parts = teacherStr.split('|');
                                              String name = parts.isNotEmpty ? parts[0] : 'Unknown';
                                              String phone = parts.length > 1 ? parts[1] : '';

                                              return AnimatedContainer(
                                                duration: const Duration(milliseconds: 400),
                                                margin: const EdgeInsets.only(bottom: 12),
                                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                                decoration: BoxDecoration(
                                                  color: teacherBoxBg,
                                                  borderRadius: BorderRadius.circular(20),
                                                ),
                                                child: Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Expanded(
                                                      child: Row(
                                                        children: [
                                                          Container(
                                                            padding: const EdgeInsets.all(10),
                                                            decoration: BoxDecoration(
                                                              color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50, 
                                                              borderRadius: BorderRadius.circular(16)
                                                            ),
                                                            child: const Icon(Icons.person, color: Color(0xFF42A5F5), size: 18),
                                                          ),
                                                          const SizedBox(width: 16),
                                                          Expanded(
                                                            child: Text(
                                                              _capitalizeName(name),
                                                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: teacherNameColor, fontStyle: FontStyle.italic),
                                                              maxLines: 2,
                                                              overflow: TextOverflow.ellipsis,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                    if (phone.isNotEmpty && phone.trim().isNotEmpty)
                                                      GestureDetector(
                                                        onTap: () => _launchWhatsApp(phone, item['subject'] ?? ''),
                                                        child: Container(
                                                          padding: const EdgeInsets.all(12),
                                                          decoration: BoxDecoration(
                                                            color: const Color(0xFF4ADE80), // Tailwind green-400
                                                            borderRadius: BorderRadius.circular(16),
                                                          ),
                                                          child: const Icon(Icons.chat_bubble_outline, color: Colors.white, size: 18),
                                                        ),
                                                      )
                                                  ],
                                                ),
                                              );
                                            }).toList(),
                                          )
                                        ],
                                      ),
                                    ).animate().fadeIn(delay: Duration(milliseconds: 80 * index)).slideY(begin: 0.1);
                                  }).toList(),
                                )
                              : Container(
                                  margin: const EdgeInsets.only(top: 100),
                                  child: Text(
                                    "NO SUBJECTS FOUND",
                                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF334155), fontStyle: FontStyle.italic),
                                  ),
                                ).animate().fadeIn(),
                        ),
                      ),
                      const SizedBox(height: 50), // Standard bottom padding
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
}
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

// 🔥 ConsumerStatefulWidget so it listens to theme changes
class Mentorship extends ConsumerStatefulWidget {
  const Mentorship({super.key});

  @override
  ConsumerState<Mentorship> createState() => _MentorshipState();
}

class _MentorshipState extends ConsumerState<Mentorship> {
  bool loading = true;
  Map<String, dynamic>? mentor;
  String? error;

  @override
  void initState() {
    super.initState();
    _fetchMentor();
  }

  Future<void> _fetchMentor() async {
    try {
      if (mounted) setState(() { error = null; });
      final response = await ApiClient.dio.get('/users/my-mentor');
      
      if (mounted) {
        setState(() {
          mentor = response.data;
          loading = false;
        });
      }
    } catch (err) {
      if (mounted) {
        setState(() {
          // Dynamic error parsing
          if (err is Map && err['response'] != null && err['response']['data'] != null) {
            error = err['response']['data']['message'];
          } else {
            error = "Mentor connection failed";
          }
          loading = false;
        });
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchMentor();
  }

  // --- CALL LAUNCHER LOGIC ---
  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: phoneNumber,
    );
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    } else {
      _showToast("Could not launch dialer");
    }
  }

  void _showToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 13)),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.all(20),
      ),
    );
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
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final Color subtleBgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color badgeBg = isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50;
    final Color badgeBorder = isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100;

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
          backgroundColor: Colors.transparent, // AnimatedContainer ka color dikhne ke liye
          body: RefreshIndicator(
            color: const Color(0xFF42A5F5),
            backgroundColor: cardColor,
            onRefresh: _handleRefresh,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: 50),
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
                                  const Text("Mentorship", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                  Text("GUIDANCE & STUDENT SUPPORT", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.3)),
                                ),
                                child: const Icon(Icons.people_outline, color: Colors.white, size: 22),
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
                      child: error != null
                          ? AnimatedContainer(
                              duration: const Duration(milliseconds: 400),
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
                              decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(45), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]),
                              child: Column(
                                children: [
                                  Icon(Icons.security, size: 60, color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                                  const SizedBox(height: 16),
                                  Text(error!.toUpperCase(), textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: textColorSecondary, letterSpacing: 2)),
                                ],
                              ),
                            ).animate().fadeIn().scale(begin: const Offset(0.9, 0.9))
                          : AnimatedContainer(
                              duration: const Duration(milliseconds: 400),
                              width: double.infinity,
                              padding: const EdgeInsets.all(32),
                              decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(55), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 25, offset: Offset(0, 10))]),
                              child: Column(
                                children: [
                                  // --- Avatar Node ---
                                  SizedBox(
                                    width: 140, height: 140,
                                    child: Stack(
                                      children: [
                                        AnimatedContainer(
                                          duration: const Duration(milliseconds: 400),
                                          width: 140, height: 140,
                                          decoration: BoxDecoration(
                                            color: badgeBg,
                                            shape: BoxShape.circle,
                                            border: Border.all(color: cardColor, width: 5),
                                            boxShadow: [BoxShadow(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.5) : Colors.blue.shade100, blurRadius: 20, offset: const Offset(0, 10))]
                                          ),
                                          clipBehavior: Clip.hardEdge,
                                          child: (mentor?['avatar'] != null && mentor!['avatar'].toString().isNotEmpty)
                                              // Handle backend IP if running on emulator (localhost to 10.0.2.2)
                                              ? Image.network("http://10.163.134.38:5000${mentor!['avatar']}", fit: BoxFit.cover, errorBuilder: (c, e, s) => const Icon(Icons.person, size: 60, color: Color(0xFF42A5F5)))
                                              : const Icon(Icons.person, size: 60, color: Color(0xFF42A5F5)),
                                        ),
                                        Positioned(
                                          bottom: 0, right: 0,
                                          child: Container(
                                            padding: const EdgeInsets.all(8),
                                            decoration: BoxDecoration(color: const Color(0xFF10B981), shape: BoxShape.circle, border: Border.all(color: cardColor, width: 4), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5)]),
                                            child: const Icon(Icons.verified_user, color: Colors.white, size: 18),
                                          ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(0.9, 0.9), end: const Offset(1.1, 1.1), duration: 1.seconds),
                                        )
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 24),

                                  // --- Mentor Details ---
                                  Text((mentor?['name'] ?? 'Unknown Faculty').toString().toUpperCase(), textAlign: TextAlign.center, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: -0.5, height: 1.1)),
                                  const SizedBox(height: 8),
                                  AnimatedContainer(
                                    duration: const Duration(milliseconds: 400),
                                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                                    decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: badgeBorder)),
                                    child: const Text("CLASS TEACHER", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 2)),
                                  ),
                                  const SizedBox(height: 32),

                                  // --- Number Box with Call Button ---
                                  AnimatedContainer(
                                    duration: const Duration(milliseconds: 400),
                                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                    decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(35), border: Border.all(color: borderColor)),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            AnimatedContainer(
                                              duration: const Duration(milliseconds: 400),
                                              padding: const EdgeInsets.all(12), 
                                              decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(15), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5)]), 
                                              child: const Icon(Icons.phone, color: Color(0xFF42A5F5), size: 18)
                                            ),
                                            const SizedBox(width: 16),
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text("CONTACT NO.", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5)),
                                                Text(mentor?['phone'] ?? '+91 N/A', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: 1.5)),
                                              ],
                                            ),
                                          ],
                                        ),
                                        GestureDetector(
                                          onTap: () {
                                            if (mentor?['phone'] != null) {
                                              _makePhoneCall(mentor!['phone']);
                                            }
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.all(14),
                                            decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 4))]),
                                            child: const Icon(Icons.call, color: Colors.white, size: 20),
                                          ),
                                        )
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 16),

                                  // --- Assigned Subjects Node ---
                                  AnimatedContainer(
                                    duration: const Duration(milliseconds: 400),
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(35), border: Border.all(color: badgeBorder)),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        AnimatedContainer(
                                          duration: const Duration(milliseconds: 400),
                                          padding: const EdgeInsets.all(12), 
                                          decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(15), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5)]), 
                                          child: const Icon(Icons.school, color: Color(0xFF42A5F5), size: 18)
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text("TEACHING EXPERTISE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5)),
                                              const SizedBox(height: 4),
                                              Text(
                                                (mentor?['subjects'] != null && mentor!['subjects'] is List) 
                                                  ? (mentor!['subjects'] as List).join(', ').toUpperCase() 
                                                  : "EXPERT FACULTY", 
                                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColorPrimary, fontStyle: FontStyle.italic, height: 1.4)
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  
                                  const SizedBox(height: 32),
                                  // Footer Mark
                                  Column(
                                    children: [
                                      AnimatedContainer(
                                        duration: const Duration(milliseconds: 400),
                                        width: 40, height: 4, 
                                        decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(10))
                                      ),
                                      const SizedBox(height: 8),
                                      Text("OFFICIAL NEURAL NODE VERIFIED", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 3)),
                                    ],
                                  ).animate().fadeIn(delay: 500.ms)
                                ],
                              ),
                            ).animate().fadeIn().slideY(begin: 0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
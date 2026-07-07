import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

// 🔥 ConsumerStatefulWidget for theme listening
class BottomNav extends ConsumerStatefulWidget {
  const BottomNav({super.key});

  @override
  ConsumerState<BottomNav> createState() => _BottomNavState();
}

class _BottomNavState extends ConsumerState<BottomNav> {
  Map<String, dynamic>? user;
  String currentRoute = '/';

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  // Current route nikalna taaki active icon blue ho sake
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    currentRoute = GoRouterState.of(context).uri.toString();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() => user = jsonDecode(userStr));
    }
  }

  void _showSchoolModal(BuildContext context, bool isDarkMode) {
    // School Details
    final schoolData = user?['schoolData'] ?? {};
    final schoolName = schoolData['schoolName'] ?? "EduFlowAI Institution";
    final schoolAddress = schoolData['address'] ?? "Digital Campus, Sector 42";
    final schoolContact =
        schoolData['adminDetails']?['mobile'] ?? "+91 98765-43210";

    // Student Details
    final studentName = user?['name'] ?? "Student Name";
    String? avatar = user?['avatar'];
    if (avatar != null && !avatar.startsWith('http')) {
      avatar = "http://10.163.134.38:5000$avatar"; // 10.0.2.2 is local for Android
    }

    // 🔥 DYNAMIC MODAL COLORS
    final Color modalBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
    final Color textSecondary = isDarkMode ? const Color(0xFF94A3B8) : Colors.grey.shade400;
    final Color iconBg = isDarkMode ? const Color(0xFF334155) : Colors.grey.shade100;
    final Color iconColor = isDarkMode ? const Color(0xFF94A3B8) : Colors.grey;
    final Color watermarkText = isDarkMode ? const Color(0xFF334155) : const Color(0xFF1E293B).withOpacity(0.2);

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Dismiss',
      transitionDuration: const Duration(milliseconds: 400),
      pageBuilder: (context, animation, secondaryAnimation) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              // --- 1. DARK BLUR BACKGROUND ---
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: TweenAnimationBuilder(
                  tween: Tween<double>(begin: 0, end: 1),
                  duration: const Duration(milliseconds: 300),
                  builder: (context, val, child) {
                    return BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 20 * val, sigmaY: 20 * val),
                      child: Container(
                        color: const Color(0xFF020617).withOpacity(0.85 * val),
                      ),
                    );
                  },
                ),
              ),

              // --- 2. THE ID CARD POPUP ---
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: modalBg, // 🔥 Dynamic
                    borderRadius: BorderRadius.circular(50),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black.withOpacity(0.8),
                          blurRadius: 100,
                          offset: const Offset(0, 40))
                    ],
                  ),
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.center,
                    children: [
                      // Close Button
                      Positioned(
                        top: -15,
                        right: -15,
                        child: GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: iconBg, // 🔥 Dynamic
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.close, size: 20, color: iconColor), // 🔥 Dynamic
                          ),
                        ),
                      ),

                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // --- STUDENT PHOTO ---
                          Container(
                            width: 150,
                            height: 150,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                    color: const Color(0xFF42A5F5).withOpacity(0.4),
                                    blurRadius: 40,
                                    spreadRadius: 10)
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(100),
                              child: avatar != null
                                  ? Image.network(avatar,
                                      fit: BoxFit.cover,
                                      errorBuilder: (c, e, s) =>
                                          _buildDefaultAvatar())
                                  : _buildDefaultAvatar(),
                            ),
                          ).animate().scale(
                              delay: 200.ms,
                              duration: 600.ms,
                              curve: Curves.elasticOut),

                          const SizedBox(height: 25),

                          // --- STUDENT NAME ---
                          Text(
                            studentName.toUpperCase(),
                            style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF42A5F5),
                                fontStyle: FontStyle.italic,
                                letterSpacing: 1.5),
                          ).animate().fadeIn(delay: 250.ms).slideY(begin: 0.5),

                          const SizedBox(height: 25),

                          // --- SCHOOL DETAILS ---
                          Column(
                            children: [
                              Text(
                                schoolName.toUpperCase(),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w900,
                                    color: textPrimary, // 🔥 Dynamic
                                    fontStyle: FontStyle.italic,
                                    height: 1.1,
                                    letterSpacing: -0.5),
                              ),
                              const SizedBox(height: 15),

                              // Gradient Line
                              Container(
                                height: 5,
                                width: 60,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(colors: [
                                    Color(0xFF42A5F5),
                                    Colors.indigoAccent
                                  ]),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              const SizedBox(height: 25),

                              // Address Block
                              _buildInfoBlock("School Address", Icons.location_on, schoolAddress, isDarkMode, textSecondary),
                              const SizedBox(height: 15),

                              // Contact Block
                              _buildInfoBlock("Contact No.", Icons.phone, schoolContact, isDarkMode, textSecondary, isContact: true),
                            ],
                          ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),

                          const SizedBox(height: 35),

                          // --- WATERMARK ---
                          Column(
                            children: [
                              Icon(Icons.verified_user, size: 22, color: watermarkText), // 🔥 Dynamic
                              const SizedBox(height: 5),
                              Text(
                                "INSTITUTIONAL LEDGER VERIFIED",
                                style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: watermarkText, // 🔥 Dynamic
                                    letterSpacing: 4,
                                    fontStyle: FontStyle.italic),
                              )
                            ],
                          )
                        ],
                      ),
                    ],
                  ),
                ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack).fadeIn(),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDefaultAvatar() {
    return Container(
      color: Colors.blue.shade50,
      child: const Icon(Icons.person, size: 70, color: Color(0xFF42A5F5)),
    );
  }

  // 🔥 UPDATE: Added theme colors to helper
  Widget _buildInfoBlock(String title, IconData icon, String value, bool isDarkMode, Color textSecondary, {bool isContact = false}) {
    final Color blockBg = isDarkMode ? const Color(0xFF0F172A) : Colors.grey.shade50.withOpacity(0.8);
    final Color blockBorder = isDarkMode ? const Color(0xFF334155) : Colors.grey.shade200;
    final Color iconBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColor = isDarkMode ? const Color(0xFFE2E8F0) : const Color(0xFF334155);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 20, bottom: 5),
          child: Text(
            title.toUpperCase(),
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: isContact ? const Color(0xFF42A5F5) : textSecondary, // 🔥 Dynamic
                letterSpacing: 1.5,
                fontStyle: FontStyle.italic),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isContact ? Colors.blue.shade50.withOpacity(0.5) : blockBg, // 🔥 Dynamic
            borderRadius: BorderRadius.circular(35),
            border: Border.all(color: isContact ? Colors.blue.shade100 : blockBorder), // 🔥 Dynamic
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                    color: iconBg, // 🔥 Dynamic
                    borderRadius: BorderRadius.circular(15),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5)
                    ]),
                child: Icon(icon, color: const Color(0xFF42A5F5), size: 18),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Text(
                  value,
                  style: TextStyle(
                      fontSize: isContact ? 16 : 13,
                      fontWeight: isContact ? FontWeight.w900 : FontWeight.bold,
                      color: textColor, // 🔥 Dynamic
                      fontStyle: FontStyle.italic,
                      letterSpacing: isContact ? 2 : 0),
                ),
              )
            ],
          ),
        )
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    bool isHome = currentRoute == '/' || currentRoute == '/dashboard';
    bool isFeed = currentRoute.contains('/notice-feed');

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color navBg = isDarkMode ? const Color(0xFF0F172A) : Colors.white;
    final Color borderTop = isDarkMode ? const Color(0xFF1E293B) : Colors.grey.shade100;
    final Color shadowColor = isDarkMode ? Colors.black.withOpacity(0.5) : Colors.black.withOpacity(0.06);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      height: 90, // Perfect compact height
      decoration: BoxDecoration(
        color: navBg, // 🔥 Dynamic
        borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
        boxShadow: [
          BoxShadow(
              color: shadowColor, // 🔥 Dynamic
              blurRadius: 40,
              offset: const Offset(0, -10)) 
        ],
        border: Border(top: BorderSide(color: borderTop)), // 🔥 Dynamic
      ),
      
      padding: const EdgeInsets.only(left: 40, right: 40, bottom: 10, top: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // --- HOME NAV ITEM ---
          _buildNavItem(Icons.home_filled, "HOME", isHome, isDarkMode, () => context.go('/')),

          // --- CENTER FLOATING BUTTON ---
          Transform.translate(
            offset: const Offset(0, -30),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: () => _showSchoolModal(context, isDarkMode), // 🔥 Pass theme state
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 50, height: 50,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                                color: const Color(0xFF42A5F5).withOpacity(0.4),
                                blurRadius: 15,
                                spreadRadius: 5)
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF42A5F5),
                          shape: BoxShape.circle,
                          border: Border.all(color: navBg, width: 3), // 🔥 Dynamic border match bg
                          boxShadow: [
                            BoxShadow(
                                color: const Color(0xFF42A5F5).withOpacity(0.4),
                                blurRadius: 15,
                                offset: const Offset(0, 10))
                          ],
                        ),
                        child: const Icon(Icons.school, color: Colors.white, size: 24),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 11),
                Text(
                  "DETAILS",
                  style: TextStyle(
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                    color: isDarkMode ? const Color(0xFF64748B) : Colors.grey, // 🔥 Dynamic
                    letterSpacing: 1.5,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),

          // --- FEED NAV ITEM ---
          _buildNavItem(Icons.campaign, "FEED", isFeed, isDarkMode, () => context.go('/notice-feed')),
        ],
      ),
    );
  }

  // 🔥 UPDATE: Added theme colors to nav item
  Widget _buildNavItem(IconData icon, String label, bool isActive, bool isDarkMode, VoidCallback onTap) {
    final Color inactiveColor = isDarkMode ? const Color(0xFF64748B) : Colors.grey.shade400;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon,
              size: 24,
              color: isActive ? const Color(0xFF42A5F5) : inactiveColor),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: isActive ? const Color(0xFF42A5F5) : inactiveColor,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }
}
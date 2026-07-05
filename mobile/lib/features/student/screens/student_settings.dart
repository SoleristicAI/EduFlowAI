import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA THEME PROVIDER
import '../../../shared/widgets/custom_loader.dart';

// 🔥 StatefulWidget ki jagah ConsumerStatefulWidget
class StudentSettings extends ConsumerStatefulWidget {
  const StudentSettings({super.key});

  @override
  ConsumerState<StudentSettings> createState() => _StudentSettingsState();
}

class _StudentSettingsState extends ConsumerState<StudentSettings> {
  bool loading = true;
  bool isNotificationsEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
    _simulateLoading();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        isNotificationsEnabled = prefs.getBool('notifications') ?? true;
      });
    }
  }

  Future<void> _toggleNotifications() async {
    setState(() { isNotificationsEnabled = !isNotificationsEnabled; });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications', isNotificationsEnabled);
    
    _showToast(
      isNotificationsEnabled ? "Notifications Enabled 🔔" : "Notifications Muted 🔕", 
      isMuted: !isNotificationsEnabled
    );
  }

  Future<void> _simulateLoading() async {
    setState(() => loading = true);
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => loading = false);
  }

  void _showToast(String message, {bool isMuted = false}) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isMuted ? Icons.notifications_off : Icons.notifications_active, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 13))),
          ],
        ),
        backgroundColor: isMuted ? const Color(0xFF64748B) : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.all(20),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF334155);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final Color toggleBgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    final List<Map<String, dynamic>> appSettings = [
      {
        'title': 'Change password',
        'subtitle': 'Security configurations',
        'icon': Icons.lock_outline,
        'color': const Color(0xFFF43F5E), 
        'bg': isDarkMode ? const Color(0xFF4C1D95).withOpacity(0.2) : const Color(0xFFFFF1F2), 
        'path': '/change-password',
        'actionType': 'navigate', 
      },
      {
        'title': 'Notifications',
        'subtitle': 'Manage alerts and updates',
        'icon': isNotificationsEnabled ? Icons.notifications_active : Icons.notifications_off,
        'color': const Color(0xFFEAB308), 
        'bg': isDarkMode ? const Color(0xFF713F12).withOpacity(0.2) : const Color(0xFFFEFCE8), 
        'actionType': 'notificationToggle', 
      },
      {
        'title': 'Appearance',
        'subtitle': 'Dark and light mode settings',
        'icon': isDarkMode ? Icons.wb_sunny_outlined : Icons.dark_mode_outlined,
        'color': isDarkMode ? const Color(0xFFEAB308) : const Color(0xFF334155),
        'bg': isDarkMode ? const Color(0xFF713F12).withOpacity(0.2) : const Color(0xFFF8FAFC),
        'actionType': 'themeToggle', 
      },
      {
        'title': 'Language',
        'subtitle': 'Select your preferred language',
        'icon': Icons.language,
        'color': const Color(0xFF3B82F6), 
        'bg': isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : const Color(0xFFEFF6FF), 
        'path': null,
        'actionType': 'navigate',
      },
    ];

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
            onRefresh: () async => await _simulateLoading(),
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
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Positioned(
                              right: -10,
                              top: -10,
                              child: Icon(Icons.security, size: 100, color: Colors.white.withOpacity(0.2)),
                            ),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
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
                                    child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text("Settings", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                      Text("SYSTEM CONFIGURATION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // --- CONTENT AREA ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Column(
                            children: [
                              Column(
                                children: appSettings.asMap().entries.map((entry) {
                                  int idx = entry.key;
                                  var setting = entry.value;

                                  return GestureDetector(
                                    onTap: () {
                                      if (setting['actionType'] == 'themeToggle') {
                                        // 🔥 GLOBAL TOGGLE CALL 🔥
                                        ref.read(themeProvider.notifier).toggleTheme();
                                      } else if (setting['actionType'] == 'notificationToggle') {
                                        _toggleNotifications();
                                      } else if (setting['path'] != null) {
                                        context.push(setting['path']);
                                      }
                                    },
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 400),
                                      margin: const EdgeInsets.only(bottom: 16),
                                      padding: const EdgeInsets.all(20),
                                      decoration: BoxDecoration(
                                        color: cardColor, 
                                        borderRadius: BorderRadius.circular(40),
                                        border: Border.all(color: borderColor),
                                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]
                                      ),
                                      child: Row(
                                        children: [
                                          AnimatedContainer(
                                            duration: const Duration(milliseconds: 400),
                                            padding: const EdgeInsets.all(16),
                                            decoration: BoxDecoration(color: setting['bg'], borderRadius: BorderRadius.circular(24)),
                                            child: Icon(setting['icon'], color: setting['color'], size: 22),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  setting['title'].toString().toUpperCase(), 
                                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: 0.5), 
                                                  maxLines: 1, overflow: TextOverflow.ellipsis,
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  setting['subtitle'].toString().toUpperCase(), 
                                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textColorSecondary, letterSpacing: 1), 
                                                  maxLines: 1, overflow: TextOverflow.ellipsis,
                                                ),
                                              ],
                                            ),
                                          ),
                                          Builder(
                                            builder: (context) {
                                              if (setting['actionType'] == 'themeToggle') {
                                                return _buildToggle(isDarkMode, const Color(0xFF42A5F5), toggleBgColor);
                                              } else if (setting['actionType'] == 'notificationToggle') {
                                                return _buildToggle(isNotificationsEnabled, const Color(0xFF10B981), toggleBgColor);
                                              } else {
                                                return AnimatedContainer(
                                                  duration: const Duration(milliseconds: 400),
                                                  padding: const EdgeInsets.all(8),
                                                  decoration: BoxDecoration(color: toggleBgColor, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderColor)),
                                                  child: Icon(Icons.chevron_right, size: 20, color: textColorSecondary),
                                                );
                                              }
                                            }
                                          )
                                        ],
                                      ),
                                    ),
                                  ).animate().fadeIn(delay: Duration(milliseconds: 100 * idx)).slideX(begin: 0.1);
                                }).toList(),
                              ),
                              const SizedBox(height: 32),
                              Opacity(
                                opacity: 0.3,
                                child: Text("PROTOCOL V2 • SECURE LINK", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: 4)),
                              ).animate().fadeIn(delay: 500.ms),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 50),
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

  Widget _buildToggle(bool isActive, Color activeColor, Color inactiveBg) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      width: 44, height: 22,
      decoration: BoxDecoration(
        color: isActive ? activeColor : inactiveBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isActive ? activeColor : const Color(0xFFE2E8F0)),
      ),
      child: Stack(
        children: [
          AnimatedPositioned(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOutBack,
            top: 2,
            left: isActive ? 22 : 2,
            child: Container(
              width: 18, height: 18,
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)]),
              alignment: Alignment.center,
              child: Container(
                width: 6, height: 6,
                decoration: BoxDecoration(color: isActive ? activeColor : const Color(0xFFCBD5E1), shape: BoxShape.circle),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
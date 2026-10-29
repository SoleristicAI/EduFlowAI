import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Added for SystemNavigator.pop()
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart';

class LibrarianDashboard extends ConsumerStatefulWidget {
  const LibrarianDashboard({super.key});

  @override
  ConsumerState<LibrarianDashboard> createState() => _LibrarianDashboardState();
}

class _LibrarianDashboardState extends ConsumerState<LibrarianDashboard> {
  bool _loading = true;
  DateTime? _lastPressedAt; // 🔥 Added for double-back exit

  Map<String, dynamic> _stats = {
    'totalBooks': 0,
    'availableBooks': 0,
    'issuedBooks': 0,
    'overdueBooks': 0,
  };

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final response = await ApiClient.dio.get('/library/stats');
      if (mounted) {
        setState(() {
          _stats = response.data;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint("Failed to fetch stats: $e");
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const CustomLoader();

    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    
    // 🔥 Clean & Premium Colors 🔥
    final bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);
    final textMuted = isDarkMode ? Colors.white60 : Colors.grey.shade500;
    final borderColor = isDarkMode ? Colors.white10 : Colors.grey.shade200;

    final List<Map<String, dynamic>> libraryStats = [
      {'label': 'Total Books', 'value': _stats['totalBooks'], 'icon': Icons.menu_book_rounded, 'color': const Color(0xFF6366F1)},
      {'label': 'Available', 'value': _stats['availableBooks'], 'icon': Icons.check_circle_outline, 'color': const Color(0xFF10B981)},
      {'label': 'Issued', 'value': _stats['issuedBooks'], 'icon': Icons.swap_horiz_rounded, 'color': const Color(0xFFF59E0B)},
      {'label': 'Overdue', 'value': _stats['overdueBooks'], 'icon': Icons.error_outline_rounded, 'color': const Color(0xFFF43F5E)},
    ];

    final List<Map<String, dynamic>> primaryModules = [
      {'id': '/library/issue-return', 'title': 'Issue & Return', 'desc': 'Manage transactions', 'icon': Icons.sync_alt_rounded, 'color': const Color(0xFF42A5F5)},
      {'id': '/library/catalogue', 'title': 'Book Catalogue', 'desc': 'Add or edit books', 'icon': Icons.library_books_rounded, 'color': const Color(0xFF6366F1)},
      {'id': '/library/members', 'title': 'Library Members', 'desc': 'Digital ID Cards', 'icon': Icons.badge_rounded, 'color': const Color(0xFF10B981)},
      {'id': '/library/overdue', 'title': 'Defaulters', 'desc': 'Track overdue fines', 'icon': Icons.warning_rounded, 'color': const Color(0xFFF43F5E)},
    ];

    final List<Map<String, dynamic>> secondaryModules = [
      {'id': '/library/reports', 'title': 'Audit Reports', 'icon': Icons.analytics_rounded, 'color': const Color(0xFF06B6D4)},
      {'id': '/library/settings', 'title': 'Settings', 'icon': Icons.settings_rounded, 'color': const Color(0xFF64748B)},
    ];

    // 🔥 ADDED POPSCOPE FOR DOUBLE-TAP BACK EXIT 🔥
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;

        final now = DateTime.now();
        if (_lastPressedAt == null || now.difference(_lastPressedAt!) > const Duration(seconds: 2)) {
          _lastPressedAt = now;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              elevation: 0,
              backgroundColor: Colors.transparent,
              duration: const Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.only(bottom: 740, left: 35, right: 35),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
              content: Container(
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.85),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: Colors.white.withOpacity(0.18), width: 1.2),
                  boxShadow: [
                    BoxShadow(color: Colors.white.withOpacity(0.04), blurRadius: 25, spreadRadius: 2),
                  ],
                ),
                child: const Text(
                  "Press BACK again to EXIT app",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: Color(0xFFE2E8F0), fontSize: 10, letterSpacing: 0.5),
                ),
              ),
            ),
          );
        } else {
          SystemNavigator.pop();
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 1000),
        color: bgColor,
        child: Padding(
          padding: const EdgeInsets.only(top: 15, left: 20, right: 20, bottom: 50),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              
              // --- 1. SYSTEM STATUS CHIP ---
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF42A5F5), shape: BoxShape.circle)).animate(onPlay: (c) => c.repeat(reverse: true)).fadeOut(),
                        const SizedBox(width: 8),
                        const Text("Library Engine Online", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1.5)),
                      ],
                    ),
                  ).animate().fadeIn(duration: 400.ms),
                ],
              ),

              const SizedBox(height: 25),

              // --- 2. STATS GRID ---
              Column(
                children: [
                  Row(
                    children: [
                      Expanded(child: _buildStatCard(libraryStats[0], cardBg, borderColor, textColor, textMuted, isDarkMode)),
                      const SizedBox(width: 15),
                      Expanded(child: _buildStatCard(libraryStats[1], cardBg, borderColor, textColor, textMuted, isDarkMode)),
                    ],
                  ),
                  const SizedBox(height: 15),
                  Row(
                    children: [
                      Expanded(child: _buildStatCard(libraryStats[2], cardBg, borderColor, textColor, textMuted, isDarkMode)),
                      const SizedBox(width: 15),
                      Expanded(child: _buildStatCard(libraryStats[3], cardBg, borderColor, textColor, textMuted, isDarkMode)),
                    ],
                  ),
                ],
              ).animate().slideY(begin: 0.1, duration: 400.ms).fadeIn(),

              const SizedBox(height: 35),
              Text("CORE MODULES", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textMuted, letterSpacing: 2, fontStyle: FontStyle.italic)),
              const SizedBox(height: 15),

              // --- 3. PRIMARY LIST MODULES ---
              Column(
                children: primaryModules.asMap().entries.map((entry) {
                  final index = entry.key;
                  final module = entry.value;
                  return GestureDetector(
                    onTap: () => context.push(module['id']),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 15),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(25),
                        border: Border.all(color: borderColor),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDarkMode ? 0.1 : 0.02), blurRadius: 8, offset: const Offset(0, 4))],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: module['color'].withOpacity(0.1), borderRadius: BorderRadius.circular(15)),
                            child: Icon(module['icon'], color: module['color'], size: 24),
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(module['title'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColor, fontStyle: FontStyle.italic)),
                                const SizedBox(height: 2),
                                Text(module['desc'], style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textMuted)),
                              ],
                            ),
                          ),
                          Icon(Icons.arrow_forward_ios_rounded, color: textMuted, size: 16),
                        ],
                      ),
                    ).animate().slideX(begin: -0.1, delay: Duration(milliseconds: 100 * index)).fadeIn(),
                  );
                }).toList(),
              ),

              const SizedBox(height: 20),
              Text("SYSTEM & AUDIT", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textMuted, letterSpacing: 2, fontStyle: FontStyle.italic)),
              const SizedBox(height: 15),

              // --- 4. SECONDARY MODULES ---
              Row(
                children: secondaryModules.map((module) {
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => context.push(module['id']),
                      child: Container(
                        margin: EdgeInsets.only(right: module == secondaryModules.first ? 15 : 0),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(color: borderColor),
                        ),
                        child: Column(
                          children: [
                            Icon(module['icon'], color: module['color'], size: 28),
                            const SizedBox(height: 12),
                            Text(module['title'], textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColor, fontStyle: FontStyle.italic)),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ).animate().slideY(begin: 0.1, delay: 500.ms).fadeIn(),

            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(Map<String, dynamic> stat, Color cardBg, Color borderColor, Color textColor, Color textMuted, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: borderColor),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDark ? 0.2 : 0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(stat['icon'], color: stat['color'], size: 22),
              Text(stat['value'].toString(), style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textColor)),
            ],
          ),
          const SizedBox(height: 15),
          Text(stat['label'].toString().toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textMuted, letterSpacing: 1)),
        ],
      ),
    );
  }
}
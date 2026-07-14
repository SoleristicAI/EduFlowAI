import 'dart:convert';
import 'dart:ui';
import 'dart:io' show Platform; // 🔥 NAYA IMPORT: OS detect karne ke liye
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

// 🔥 ConsumerStatefulWidget so it listens to theme changes
class NoticeFeed extends ConsumerStatefulWidget {
  const NoticeFeed({super.key});

  @override
  ConsumerState<NoticeFeed> createState() => _NoticeFeedState();
}

class _NoticeFeedState extends ConsumerState<NoticeFeed> {
  bool loading = true;
  List<dynamic> notices = [];
  Map<String, dynamic>? currentUser;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      currentUser = jsonDecode(userStr);
    }
    await _fetchNotices();
  }

  Future<void> _fetchNotices() async {
    try {
      final response = await ApiClient.dio.get('/notices/my-notices');
      final data = response.data;

      List<dynamic> fetchedNotices = data['notices'] ?? [];

      if (currentUser?['role'] != 'admin' && (data['unreadCount'] ?? 0) > 0) {
        await ApiClient.dio.put('/notices/mark-all-read');
      }

      if (mounted) {
        setState(() {
          notices = fetchedNotices;
          loading = false;
        });
      }
    } catch (e) {
      print("Error fetching neural broadcasts: $e");
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchNotices();
  }

  // 🔥 UPDATE: Added theme colors to Modals
  void _showDeleteModal(String id, bool isDarkMode, Color modalBg, Color textPrimary, Color textSecondary) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Delete',
      pageBuilder: (ctx, anim1, anim2) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              GestureDetector(
                onTap: () => Navigator.pop(ctx),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(color: const Color(0xFF0F172A).withOpacity(0.6)),
                ),
              ),
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: modalBg, // 🔥 Dynamic
                    borderRadius: BorderRadius.circular(55),
                    border: Border.all(color: isDarkMode ? const Color(0xFF7F1D1D) : const Color(0xFFFFE4E6)),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 40, offset: Offset(0, 20))],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 90, height: 90,
                        decoration: BoxDecoration(
                          color: isDarkMode ? const Color(0xFF7F1D1D).withOpacity(0.3) : const Color(0xFFFFF1F2),
                          shape: BoxShape.circle,
                          border: Border.all(color: isDarkMode ? const Color(0xFF7F1D1D) : const Color(0xFFFFE4E6)),
                        ),
                        child: const Icon(Icons.warning_amber_rounded, size: 48, color: Color(0xFFF43F5E)).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(0.9, 0.9)),
                      ),
                      const SizedBox(height: 24),
                      Text("Delete Notice?", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: textPrimary, letterSpacing: -1)),
                      const SizedBox(height: 8),
                      Text("This action will permanently delete this notice.", textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textSecondary, fontStyle: FontStyle.italic)),
                      const SizedBox(height: 40),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.pop(ctx),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 20),
                                decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(30), border: Border.all(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0))),
                                child: Text("No", textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textSecondary)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: GestureDetector(
                              onTap: () async {
                                Navigator.pop(ctx);
                                try {
                                  await ApiClient.dio.delete('/notices/$id');
                                  setState(() {
                                    notices.removeWhere((n) => n['_id'] == id);
                                  });
                                } catch (e) {
                                  print("Delete failed: $e");
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 20),
                                decoration: BoxDecoration(color: const Color(0xFFF43F5E), borderRadius: BorderRadius.circular(30), boxShadow: [BoxShadow(color: const Color(0xFFF43F5E).withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 5))]),
                                child: const Text("Yes", textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
                              ),
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                ).animate().scale(duration: 300.ms, curve: Curves.easeOutBack).fadeIn(),
              ),
            ],
          ),
        );
      },
    );
  }

  // 🔥 UPDATE: Added theme colors to Edit Modal
  void _showEditModal(Map<String, dynamic> notice, bool isDarkMode, Color modalBg, Color textPrimary, Color textSecondary, Color borderColor) {
    String title = notice['title'] ?? '';
    String content = notice['content'] ?? '';
    bool isUpdating = false;

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Edit',
      pageBuilder: (ctx, anim1, anim2) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Scaffold(
              backgroundColor: Colors.transparent,
              body: Stack(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(ctx),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(color: const Color(0xFF0F172A).withOpacity(0.6)),
                    ),
                  ),
                  Center(
                    child: SingleChildScrollView(
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 24),
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: modalBg, // 🔥 Dynamic
                          borderRadius: BorderRadius.circular(55),
                          border: Border.all(color: borderColor),
                          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 40, offset: Offset(0, 20))],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50, borderRadius: BorderRadius.circular(16)),
                                  child: const Icon(Icons.edit, color: Color(0xFF42A5F5), size: 24),
                                ),
                                const SizedBox(width: 12),
                                Text("Edit notice", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: textPrimary)),
                              ],
                            ),
                            const SizedBox(height: 24),
                            Text("NOTICE TITLE", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                            const SizedBox(height: 8),
                            TextField(
                              controller: TextEditingController(text: title)..selection = TextSelection.collapsed(offset: title.length),
                              onChanged: (v) => title = v,
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, color: textPrimary), // 🔥 Dynamic text inside input
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                                contentPadding: const EdgeInsets.all(24),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9))),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9))),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: const BorderSide(color: Color(0xFF42A5F5))),
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text("MESSAGE CONTENT", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                            const SizedBox(height: 8),
                            TextField(
                              controller: TextEditingController(text: content)..selection = TextSelection.collapsed(offset: content.length),
                              onChanged: (v) => content = v,
                              maxLines: 5,
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, fontStyle: FontStyle.italic, color: isDarkMode ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                                contentPadding: const EdgeInsets.all(24),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9))),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9))),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: const BorderSide(color: Color(0xFF42A5F5))),
                              ),
                            ),
                            const SizedBox(height: 32),
                            Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => Navigator.pop(ctx),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 20),
                                      decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(30)),
                                      child: Text("Cancel", textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textSecondary)),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: isUpdating ? null : () async {
                                      setModalState(() => isUpdating = true);
                                      try {
                                        final response = await ApiClient.dio.put('/notices/${notice['_id']}', data: {
                                          'title': title,
                                          'content': content
                                        });
                                        if (mounted) {
                                          setState(() {
                                            int idx = notices.indexWhere((n) => n['_id'] == notice['_id']);
                                            if (idx != -1) notices[idx] = response.data;
                                          });
                                          Navigator.pop(ctx);
                                        }
                                      } catch (e) {
                                        print("Update failed: $e");
                                        setModalState(() => isUpdating = false);
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 20),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF42A5F5), 
                                        borderRadius: BorderRadius.circular(30), 
                                        boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 5))]
                                      ),
                                      child: Text(isUpdating ? "Syncing..." : "Update", textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
                                    ),
                                  ),
                                ),
                              ],
                            )
                          ],
                        ),
                      ).animate().scale(duration: 300.ms, curve: Curves.easeOutBack).fadeIn(),
                    ),
                  ),
                ],
              ),
            );
          }
        );
      },
    );
  }

  String _getTargetLabel(Map<String, dynamic> n) {
    if (n['audience'] == 'all') return "All teachers and students";
    if (n['audience'] == 'teachers') return "All teachers";
    if (n['audience'] == 'specific_grade') {
      var targetGrade = n['targetGrade'];
      if (targetGrade == 'All' || (targetGrade is List && targetGrade.contains('All'))) {
        return "All classes";
      } else if (targetGrade is List) {
        if (targetGrade.length > 1) {
          return "Multi: ${targetGrade.join(', ')}";
        } else if (targetGrade.isNotEmpty) {
          return "Class: ${targetGrade[0]}"; 
        }
      } else {
        return "Class: ${targetGrade ?? 'N/A'}"; 
      }
    }
    return "";
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();

    bool isMasterAdmin = currentUser?['role']?.toString().toLowerCase() == 'admin';

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 OS CHECK KAR RAHE HAIN (TAAKI iOS PE FONT BADA DIKHE) 🔥
    final bool isIOS = Platform.isIOS;

    // 🔥 DYNAMIC COLORS FOR DARK/LIGHT MODE 🔥
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
    final Color textSecondary = isDarkMode ? const Color(0xFF94A3B8) : Colors.grey.shade600;

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
          backgroundColor: Colors.transparent,
          body: RefreshIndicator(
            color: const Color(0xFF42A5F5),
            backgroundColor: cardColor,
            onRefresh: _handleRefresh,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: 50),
              child: Column(
                children: [
                  // --- HEADER SECTION ---
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
                                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                                  ),
                                  child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                                ),
                              ),
                              Column(
                                children: [
                                  const Text("Notice board", style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                  Text("ANNOUNCEMENTS", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white.withOpacity(0.8), letterSpacing: 2)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                                ),
                                child: const Icon(Icons.campaign, color: Colors.white, size: 24).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(0.9, 0.9), end: const Offset(1.1, 1.1), duration: 800.ms),
                              ),
                            ],
                          ),
                          if (isMasterAdmin)
                            Padding(
                              padding: const EdgeInsets.only(top: 16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.security, color: Colors.white, size: 14),
                                  const SizedBox(width: 6),
                                  Text("ADMIN CONTROL", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 3)),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                  // --- BODY SECTION ---
                  Transform.translate(
                    offset: const Offset(0, -40),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: notices.isNotEmpty 
                        ? Column(
                            children: notices.asMap().entries.map((entry) {
                              int i = entry.key;
                              var n = entry.value;

                              String postedById = n['postedBy'] is Map ? (n['postedBy']['_id'] ?? '') : (n['postedBy'] ?? '');
                              String currentUserId = currentUser?['_id'] ?? currentUser?['id'] ?? '';
                              bool isOwner = postedById.isNotEmpty && postedById == currentUserId;
                              bool hasControl = isMasterAdmin || isOwner;

                              String targetLabel = _getTargetLabel(n);
                              String dateStr = "N/A";
                              if (n['createdAt'] != null) {
                                dateStr = DateFormat('dd MMM').format(DateTime.parse(n['createdAt']));
                              }

                              return AnimatedContainer(
                                duration: const Duration(milliseconds: 400),
                                margin: const EdgeInsets.only(bottom: 24),
                                padding: const EdgeInsets.all(28),
                                decoration: BoxDecoration(
                                  color: cardColor, // 🔥 Dynamic
                                  borderRadius: BorderRadius.circular(40),
                                  border: Border.all(color: isMasterAdmin ? (isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100) : borderColor),
                                  boxShadow: [BoxShadow(color: isMasterAdmin ? const Color(0xFF42A5F5).withOpacity(0.1) : Colors.black12, blurRadius: 15, offset: const Offset(0, 5))],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                       Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(12), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 2)]),
                                                child: Text((n['authorRole'] ?? 'Root').toString().toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
                                              ),
                                              const SizedBox(height: 8), 
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                                decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100)),
                                                child: Text("To: $targetLabel", style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1)),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Row(
                                          children: [
                                            const Icon(Icons.access_time, size: 14, color: Color(0xFF94A3B8)),
                                            const SizedBox(width: 4),
                                            Text(dateStr, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: Color(0xFF94A3B8))),
                                          ],
                                        )
                                      ],
                                    ),
                                    const SizedBox(height: 20),
                                    
                                    // 🔥 THE FIX: iOS pe title ka font bada rahega, Android pe exactly 15 rahega
                                    Text(
                                      n['title']?.toString().toUpperCase() ?? 'UNTITLED', 
                                      style: TextStyle(
                                        fontSize: isIOS ? 18 : 15, 
                                        fontWeight: FontWeight.w900, 
                                        fontStyle: FontStyle.italic, 
                                        color: textPrimary, 
                                        height: 1.1
                                      )
                                    ),
                                    const SizedBox(height: 12),

                                    // 🔥 THE FIX: iOS pe content ka font bada rahega, Android pe exactly 10 rahega
                                    Text(
                                      n['content'] ?? '', 
                                      style: TextStyle(
                                        fontSize: isIOS ? 13 : 10, 
                                        fontWeight: FontWeight.w600, 
                                        fontStyle: FontStyle.italic, 
                                        color: textSecondary, 
                                        height: 1.5
                                      )
                                    ),
                                    const SizedBox(height: 20),
                                    Divider(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9), thickness: 1), // 🔥 Dynamic Divider
                                    const SizedBox(height: 16),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            "By: ${n['postedBy'] is Map ? n['postedBy']['name'] : n['authorRole'] ?? 'Admin'}", 
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, color: Color(0xFF94A3B8)),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        if (hasControl)
                                          Row(
                                            children: [
                                              GestureDetector(
                                                onTap: () => _showEditModal(n, isDarkMode, cardColor, textPrimary, textSecondary, borderColor),
                                                child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100)), child: const Icon(Icons.edit, size: 18, color: Color(0xFF42A5F5))),
                                              ),
                                              const SizedBox(width: 10),
                                              GestureDetector(
                                                onTap: () => _showDeleteModal(n['_id'], isDarkMode, cardColor, textPrimary, textSecondary),
                                                child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF7F1D1D).withOpacity(0.3) : const Color(0xFFFFF1F2), borderRadius: BorderRadius.circular(12), border: Border.all(color: isDarkMode ? const Color(0xFF7F1D1D) : const Color(0xFFFFE4E6))), child: const Icon(Icons.delete_outline, size: 18, color: Color(0xFFF43F5E))),
                                              ),
                                            ],
                                          )
                                      ],
                                    )
                                  ],
                                ),
                              ).animate().fadeIn(delay: Duration(milliseconds: 100 * i)).slideY(begin: 0.1);
                            }).toList(),
                          )
                        : AnimatedContainer(
                            duration: const Duration(milliseconds: 400),
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 30),
                            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(55), border: Border.all(color: borderColor, width: 2)),
                            child: Column(
                              children: [
                                Icon(Icons.campaign, size: 80, color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                                const SizedBox(height: 24),
                                const Text("No notices available found 📢", textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, color: Color(0xFF94A3B8))),
                              ],
                            ),
                          ).animate().fadeIn().scale(begin: const Offset(0.9, 0.9)),
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
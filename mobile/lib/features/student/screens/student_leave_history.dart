import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class StudentLeaveHistory extends ConsumerStatefulWidget {
  const StudentLeaveHistory({super.key});

  @override
  ConsumerState<StudentLeaveHistory> createState() => _StudentLeaveHistoryState();
}

class _StudentLeaveHistoryState extends ConsumerState<StudentLeaveHistory> {
  bool loading = true;
  List<dynamic> history = [];
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchHistory(isSilent: false);

    // 🔥 AUTOMATIC 3-SECOND SILENT SYNC (React Logic Replicated) 🔥
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _fetchHistory(isSilent: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel(); // Memory leak se bachne ke liye timer kill karna zaroori hai
    super.dispose();
  }

  Future<void> _fetchHistory({bool isSilent = false}) async {
    if (!isSilent && mounted) {
      setState(() => loading = true);
    }

    try {
      final response = await ApiClient.dio.get('/leaves/my-history');
      if (mounted) {
        setState(() {
          history = response.data as List<dynamic>;
          loading = false;
        });
      }
    } catch (err) {
      debugPrint("History fetch failed");
      if (mounted && !isSilent) {
        setState(() => loading = false);
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchHistory(isSilent: false);
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return "N/A";
    final date = DateTime.parse(dateStr);
    return DateFormat('d MMM yyyy').format(date);
  }

  @override
  Widget build(BuildContext context) {
    if (loading && history.isEmpty) return const CustomLoader(); // 🔥 INITIAL LOADER

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) context.pop();
        else context.go('/student/leave-request');
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
                                // BACK BUTTON
                                GestureDetector(
                                  onTap: () {
                                    if (context.canPop()) context.pop();
                                    else context.go('/student/leave-request');
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
                                
                                // CENTER TITLE & SUBTITLE
                                Column(
                                  children: [
                                    const Text(
                                      "Leave History",
                                      style: TextStyle(
                                          fontSize: 28, // Compact
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                          fontStyle: FontStyle.italic,
                                          letterSpacing: -1)
                                    ),
                                    Text(
                                      "TRACK YOUR APPLICATIONS",
                                      style: TextStyle(
                                          fontSize: 9, // Compact
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white.withOpacity(0.9),
                                          letterSpacing: 2)
                                    ),
                                  ],
                                ),

                                // RIGHT ICON
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: const Icon(Icons.history, color: Colors.white, size: 24),
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
                          child: history.isEmpty 
                            ? Padding(
                                padding: const EdgeInsets.only(top: 80),
                                child: Text(
                                  "NO HISTORY FOUND.",
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: textColorSecondary,
                                    fontStyle: FontStyle.italic,
                                    letterSpacing: 1.5,
                                  ),
                                ).animate().fadeIn(duration: 500.ms),
                              )
                            : Column(
                                children: history.asMap().entries.map((entry) {
                                  int index = entry.key;
                                  var req = entry.value;

                                  // Status Color Mapping Logic
                                  String status = req['status'] ?? 'Pending';
                                  Color statusBg;
                                  Color statusText;

                                  if (status == 'Confirmed') {
                                    statusBg = isDarkMode ? const Color(0xFF064E3B).withOpacity(0.3) : Colors.green.shade100;
                                    statusText = isDarkMode ? const Color(0xFF34D399) : Colors.green.shade700;
                                  } else if (status == 'Rejected') {
                                    statusBg = isDarkMode ? const Color(0xFF7F1D1D).withOpacity(0.3) : Colors.red.shade100;
                                    statusText = isDarkMode ? const Color(0xFFF87171) : Colors.red.shade700;
                                  } else {
                                    statusBg = isDarkMode ? const Color(0xFF78350F).withOpacity(0.3) : Colors.orange.shade100;
                                    statusText = isDarkMode ? const Color(0xFFFBBF24) : Colors.orange.shade700;
                                  }

                                  return AnimatedContainer(
                                    duration: const Duration(milliseconds: 400),
                                    margin: const EdgeInsets.only(bottom: 16),
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(
                                      color: cardColor,
                                      borderRadius: BorderRadius.circular(35),
                                      border: Border.all(color: cardBorder),
                                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5, offset: Offset(0, 3))]
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                req['reason'] ?? 'Leave Request',
                                                style: TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w900,
                                                  color: textColorPrimary,
                                                  fontStyle: FontStyle.italic,
                                                ),
                                              ),
                                              const SizedBox(height: 6),
                                              Text(
                                                req['leaveType'] == 'One Day' 
                                                  ? _formatDate(req['fromDate'])
                                                  : "${_formatDate(req['fromDate'])}\nTO ${_formatDate(req['toDate'])}",
                                                style: TextStyle(
                                                  fontSize: 10, // Compact
                                                  fontWeight: FontWeight.bold,
                                                  color: textColorSecondary,
                                                  letterSpacing: 1.5,
                                                  height: 1.5,
                                                  fontStyle: FontStyle.italic,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                          decoration: BoxDecoration(
                                            color: statusBg,
                                            borderRadius: BorderRadius.circular(25),
                                          ),
                                          child: Text(
                                            status.toUpperCase(),
                                            style: TextStyle(
                                              fontSize: 10, // Compact
                                              fontWeight: FontWeight.w900,
                                              color: statusText,
                                              letterSpacing: 1.5,
                                              fontStyle: FontStyle.italic,
                                            ),
                                          ),
                                        ).animate().scale(delay: 200.ms),
                                      ],
                                    ),
                                  ).animate().fadeIn(delay: Duration(milliseconds: 80 * index)).slideY(begin: 0.1);
                                }).toList(),
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
}
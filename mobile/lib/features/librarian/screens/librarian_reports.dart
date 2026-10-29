import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart';

class LibrarianReports extends ConsumerStatefulWidget {
  const LibrarianReports({super.key});

  @override
  ConsumerState<LibrarianReports> createState() => _LibrarianReportsState();
}

class _LibrarianReportsState extends ConsumerState<LibrarianReports> {
  bool _loading = true;
  Map<String, dynamic> _reportData = {
    'stats': {'totalTransactions': 0, 'issued': 0, 'returned': 0, 'overdue': 0},
    'transactions': []
  };
  
  String _timeFilter = '30days';
  
  final List<Map<String, String>> _filterOptions = [
    {'label': 'All Time History', 'value': 'all'},
    {'label': 'Last 30 Days', 'value': '30days'},
    {'label': 'Last 7 Days', 'value': '7days'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    try {
      if (!mounted) return;
      setState(() => _loading = true);
      final res = await ApiClient.dio.get('/library/reports?filter=$_timeFilter');
      if (mounted) {
        setState(() {
          _reportData = res.data;
          _loading = false;
        });
      }
    } catch (e) {
      _showToast("Failed to generate report.", isError: true);
      if (mounted) setState(() => _loading = false);
    }
  }

  bool _isOverdue(Map<String, dynamic> tx) {
    if (tx['status'] == 'Returned') return false;
    if (tx['status'] == 'Overdue') return true;
    
    DateTime today = DateTime.now();
    DateTime due = DateTime.parse(tx['dueDate']);
    return DateTime(today.year, today.month, today.day).isAfter(DateTime(due.year, due.month, due.day));
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
      backgroundColor: isError ? Colors.redAccent : const Color(0xFF10B981),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ));
  }

  void _showFilterBottomSheet() {
    final isDarkMode = ref.read(themeProvider) == ThemeMode.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDarkMode ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
            border: Border.all(color: isDarkMode ? Colors.white10 : Colors.grey.shade200),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 50, height: 5, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(10)))),
              const SizedBox(height: 20),
              const Text("SELECT TIME FILTER", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2, fontStyle: FontStyle.italic)),
              const SizedBox(height: 16),
              ..._filterOptions.map((opt) {
                final isSelected = opt['value'] == _timeFilter;
                return GestureDetector(
                  onTap: () {
                    Navigator.pop(ctx);
                    if (!isSelected) {
                      setState(() => _timeFilter = opt['value']!);
                      _fetchReports();
                    }
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF42A5F5).withOpacity(0.1) : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: isSelected ? const Color(0xFF42A5F5) : (isDarkMode ? Colors.white10 : Colors.grey.shade200)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(opt['label']!.toUpperCase(), style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: isDarkMode ? Colors.white : Colors.blueGrey.shade700, fontStyle: FontStyle.italic)),
                        if (isSelected) const Icon(Icons.check_circle, color: Color(0xFF42A5F5), size: 20),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const CustomLoader();

    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);
    final borderColor = isDarkMode ? Colors.white10 : Colors.grey.shade200;

    final stats = _reportData['stats'] ?? {};
    final transactions = _reportData['transactions'] as List<dynamic>? ?? [];
    final currentFilterLabel = _filterOptions.firstWhere((o) => o['value'] == _timeFilter)['label'];

    return Scaffold(
      backgroundColor: bgColor,
      body: Column(
        children: [
          // 🔥 1. PREMIUM HEADER (AB YAHAN FIXED RAHEGA) 🔥
          Container(
            padding: const EdgeInsets.only(top: 60, bottom: 40, left: 24, right: 24),
            decoration: BoxDecoration(
              color: const Color(0xFF42A5F5),
              gradient: LinearGradient(
                colors: isDarkMode ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                begin: Alignment.topCenter, end: Alignment.bottomCenter,
              ),
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(right: -40, top: -10, child: Icon(Icons.analytics_rounded, size: 200, color: Colors.white.withOpacity(0.1))),
                Column(
                  children: [
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () {
                            if (context.canPop()) context.pop();
                            else context.go('/librarian/dashboard');
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                            child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("Analytics", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                              Text("MASTER AUDIT REPORT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 25),
                    // Filter Button embedded in header
                    GestureDetector(
                      onTap: _showFilterBottomSheet,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.filter_list_rounded, color: Color(0xFF42A5F5), size: 20),
                                const SizedBox(width: 10),
                                Text(currentFilterLabel!.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.black87, fontStyle: FontStyle.italic)),
                              ],
                            ),
                            const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.black45),
                          ],
                        ),
                      ),
                    )
                  ],
                ),
              ],
            ),
          ),

          // 🔥 2. SCROLLABLE CONTENT AREA 🔥
          Expanded(
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                // STATS GRID
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 30, 20, 10),
                  sliver: SliverGrid.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: 15,
                    crossAxisSpacing: 15,
                    childAspectRatio: 1.1,
                    children: [
                      _buildStatCard("Total Transacts", stats['totalTransactions'].toString(), Icons.swap_horiz_rounded, const Color(0xFF6366F1), cardBg, borderColor, textColor).animate().slideY(begin: 0.1).fadeIn(),
                      _buildStatCard("Total Issued", stats['issued'].toString(), Icons.menu_book_rounded, const Color(0xFF42A5F5), cardBg, borderColor, textColor).animate().slideY(begin: 0.1, delay: 50.ms).fadeIn(),
                      _buildStatCard("Total Returned", stats['returned'].toString(), Icons.bookmark_added_rounded, const Color(0xFF10B981), cardBg, borderColor, textColor).animate().slideY(begin: 0.1, delay: 100.ms).fadeIn(),
                      _buildStatCard("Overdue Cases", stats['overdue'].toString(), Icons.warning_rounded, const Color(0xFFF43F5E), cardBg, borderColor, textColor).animate().slideY(begin: 0.1, delay: 150.ms).fadeIn(),
                    ],
                  ),
                ),

                // TRANSACTION LEDGER
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                    child: Text("TRANSACTION LEDGER", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey.shade500, letterSpacing: 2, fontStyle: FontStyle.italic)),
                  ),
                ),

                if (transactions.isEmpty)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
                      child: Container(
                        width: double.infinity, padding: const EdgeInsets.all(40),
                        decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(30), border: Border.all(color: borderColor)),
                        child: Column(
                          children: [
                            Icon(Icons.history_rounded, size: 60, color: Colors.grey.withOpacity(0.3)),
                            const SizedBox(height: 15),
                            const Text("No transactions found.", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                          ],
                        ),
                      ).animate().fadeIn(),
                    ),
                  )
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final tx = transactions[index];
                        final isLiveOverdue = _isOverdue(tx);
                        final displayStatus = tx['status'] == 'Returned' ? 'Returned' : isLiveOverdue ? 'Overdue' : 'Issued';
                        
                        Color statusColor;
                        Color statusBg;
                        if (displayStatus == 'Returned') { statusColor = const Color(0xFF10B981); statusBg = const Color(0xFF10B981).withOpacity(0.1); }
                        else if (displayStatus == 'Overdue') { statusColor = const Color(0xFFF43F5E); statusBg = const Color(0xFFF43F5E).withOpacity(0.1); }
                        else { statusColor = const Color(0xFF42A5F5); statusBg = const Color(0xFF42A5F5).withOpacity(0.1); }

                        return Container(
                          margin: const EdgeInsets.only(left: 20, right: 20, bottom: 15),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(25), border: Border.all(color: borderColor)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(DateFormat('dd MMM yyyy').format(DateTime.parse(tx['issueDate'])), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isDarkMode ? Colors.white70 : Colors.blueGrey.shade600, letterSpacing: 1)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(10)),
                                    child: Text(displayStatus.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: statusColor, letterSpacing: 1)),
                                  )
                                ],
                              ),
                              const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(height: 1)),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: const Color(0xFF42A5F5).withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.person, color: Color(0xFF42A5F5))),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(tx['studentId']?['name']?.toString().toUpperCase() ?? "UNKNOWN", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColor)),
                                        Text("ID: ${tx['studentId']?['enrollmentNo']} | Class: ${tx['studentId']?['grade']}", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1)),
                                      ],
                                    ),
                                  )
                                ],
                              ),
                              const SizedBox(height: 10),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.indigo.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.menu_book, color: Colors.indigo)),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(tx['bookId']?['title']?.toString().toUpperCase() ?? "UNKNOWN", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColor)),
                                        Text("ISBN: ${tx['bookId']?['isbn']}", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1)),
                                      ],
                                    ),
                                  )
                                ],
                              )
                            ],
                          ),
                        ).animate().fadeIn(delay: Duration(milliseconds: 30 * index)).slideX(begin: 0.1);
                      },
                      childCount: transactions.length,
                    ),
                  ),
                  
                const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, Color cardBg, Color borderColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: borderColor),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textColor)),
        ],
      ),
    );
  }
}
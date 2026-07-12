import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class FinanceFeeReports extends ConsumerStatefulWidget {
  const FinanceFeeReports({super.key});

  @override
  ConsumerState<FinanceFeeReports> createState() => _FinanceFeeReportsState();
}

class _FinanceFeeReportsState extends ConsumerState<FinanceFeeReports> {
  bool isInitialLoading = true;

  Map<String, dynamic> report = {
    'totalCollected': 0,
    'transactionCount': 0,
    'classWise': [],
    'history': [],
    'schoolName': "",
    'schoolAddress': ""
  };

  @override
  void initState() {
    super.initState();
    _fetchReport();
  }

  Future<void> _fetchReport({bool hideLoader = false}) async {
    if (!hideLoader) {
      setState(() => isInitialLoading = true);
    }

    try {
      final results = await Future.wait([
        ApiClient.dio.get('/users/finance/stats'),
        ApiClient.dio.get('/fees/reports/summary'),
      ]);

      final statsData = results[0].data;
      final reportData = results[1].data;

      if (mounted) {
        setState(() {
          report = {
            ...reportData,
            'schoolName': statsData['schoolName'] ?? "",
            'schoolAddress': statsData['schoolAddress'] ?? ""
          };
        });
      }
    } catch (e) {
      _showToast("Failed to load fee reports ❌", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  // 🔥 NATIVE REFRESH LOGIC JUST LIKE ADD PAYMENT 🔥
  Future<void> _handleRefresh() async {
    await _fetchReport(hideLoader: true);
  }

  void _handlePrint() {
    _showToast("Official Report Print Initiated! 🖨️");
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

  @override
  Widget build(BuildContext context) {
    if (isInitialLoading) return const CustomLoader(); // 🔥 TERA LOADER LOGIC

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final num totalAmount = report['totalCollected'] ?? 0;
    final String formattedTotal = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(totalAmount);

    List<dynamic> classWise = report['classWise'] ?? [];
    List<dynamic> history = report['history'] ?? [];

    // 🔥 SMART GROUPING LOGIC 🔥
    Map<String, List<dynamic>> groupedHistory = {};
    for (var fee in history) {
      String grade = fee['student']?['grade']?.toString() ?? 'Unknown';
      groupedHistory.putIfAbsent(grade, () => []).add(fee);
    }

    // Sort grades
    List<String> sortedGrades = groupedHistory.keys.toList();
    sortedGrades.sort((a, b) {
      int getWeight(String grade) {
        String g = grade.toLowerCase();
        if (g.contains('play') || g.contains('pre')) return -4;
        if (g.contains('nur')) return -3;
        if (g.contains('lkg') || g.contains('kg1')) return -2;
        if (g.contains('ukg') || g.contains('kg2')) return -1;
        final match = RegExp(r'\d+').firstMatch(g);
        if (match != null) return int.parse(match.group(0)!);
        return 999;
      }
      int w1 = getWeight(a);
      int w2 = getWeight(b);
      if (w1 != w2) return w1.compareTo(w2);
      return a.compareTo(b);
    });

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/finance/dashboard');
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: bgColor,
        child: Scaffold(
          backgroundColor: Colors.transparent,
          // 🔥 TERA WALA EXACT REFRESH INDICATOR & SCROLL VIEW STRUCTURE 🔥
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
                      // --- EXACT COPY OF YOUR PREMIUM HEADER ---
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
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // LEFT: BACK BUTTON
                            GestureDetector(
                              onTap: () {
                                if (context.canPop()) context.pop();
                                else context.go('/finance/dashboard');
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

                            // CENTER: TITLE & SUBTITLE
                            Column(
                              children: [
                                const Text("Fee Records",
                                    style: TextStyle(
                                        fontSize: 26, 
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        fontStyle: FontStyle.italic,
                                        letterSpacing: -1)),
                                Text("SCHOOL ACCOUNT",
                                    style: TextStyle(
                                        fontSize: 9, 
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white.withOpacity(0.9),
                                        letterSpacing: 2)),
                              ],
                            ),

                            // RIGHT: PRINT ICON
                            GestureDetector(
                              onTap: _handlePrint,
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.3)),
                                ),
                                child: const Icon(Icons.print, color: Colors.white, size: 24),
                              ),
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      // --- BODY CONTENT OVERLAPPING THE HEADER ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            children: [
                              
                              // 1. TOTAL SUMMARY CARD
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(32),
                                decoration: BoxDecoration(
                                  color: cardColor,
                                  borderRadius: BorderRadius.circular(40),
                                  border: Border.all(color: cardBorder),
                                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]
                                ),
                                child: Column(
                                  children: [
                                    Text("TOTAL FEES RECEIVED", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                    const SizedBox(height: 12),
                                    Text(formattedTotal, style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: -1.5, fontStyle: FontStyle.italic)),
                                    const SizedBox(height: 16),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                      decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.2) : Colors.blue.shade50, borderRadius: BorderRadius.circular(20)),
                                      child: Text("Total ${report['transactionCount']} successful payments", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1, fontStyle: FontStyle.italic)),
                                    )
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),
                              
                              const SizedBox(height: 24),

                              if (sortedGrades.isEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 40),
                                  child: Text("No transactions yet ❄️", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                )
                              else
                                // 2. SMART CLASS-WISE TRANSACTIONS BOXES
                                ...sortedGrades.map((grade) {
                                  final classTxs = groupedHistory[grade]!;
                                  final classSummary = classWise.firstWhere((c) => c['_id'] == grade, orElse: () => {'total': 0});
                                  final totalClassAmount = classSummary['total'] ?? 0;
                                  
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 24),
                                    decoration: BoxDecoration(
                                      color: cardColor,
                                      borderRadius: BorderRadius.circular(35),
                                      border: Border.all(color: cardBorder),
                                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]
                                    ),
                                    child: Column(
                                      children: [
                                        // BOX HEADER (CLASS & TOTAL)
                                        Container(
                                          padding: const EdgeInsets.all(20),
                                          decoration: BoxDecoration(
                                            color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                                            borderRadius: const BorderRadius.vertical(top: Radius.circular(35)),
                                            border: Border(bottom: BorderSide(color: cardBorder))
                                          ),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Row(
                                                children: [
                                                  const Icon(Icons.class_, size: 16, color: Color(0xFF42A5F5)),
                                                  const SizedBox(width: 8),
                                                  Text("CLASS $grade".toUpperCase(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1)),
                                                ],
                                              ),
                                              Text("₹${NumberFormat('#,##,###').format(totalClassAmount)}", style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: textColorPrimary)),
                                            ],
                                          ),
                                        ),
                                        
                                        // LIST OF TRANSACTIONS INSIDE THE BOX
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 20),
                                          child: Column(
                                            children: classTxs.asMap().entries.map((entry) {
                                              int idx = entry.key;
                                              var fee = entry.value;
                                              bool isLast = idx == classTxs.length - 1;
                                              
                                              DateTime date = DateTime.tryParse(fee['date']?.toString() ?? '') ?? DateTime.now();
                                              String fDate = DateFormat('dd MMM yyyy').format(date);
                                              
                                              return Container(
                                                padding: const EdgeInsets.symmetric(vertical: 16),
                                                decoration: BoxDecoration(
                                                  border: isLast ? null : Border(bottom: BorderSide(color: cardBorder, width: 0.5)) // Very subtle divider
                                                ),
                                                child: Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Expanded(
                                                      child: Column(
                                                        crossAxisAlignment: CrossAxisAlignment.start,
                                                        children: [
                                                          Text(fee['student']?['name']?.toString().toUpperCase() ?? 'UNKNOWN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorPrimary)),
                                                          const SizedBox(height: 4),
                                                          Row(
                                                            children: [
                                                              Icon(Icons.calendar_today, size: 10, color: textColorSecondary),
                                                              const SizedBox(width: 4),
                                                              Text(fDate, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textColorSecondary, letterSpacing: 1)),
                                                            ],
                                                          ),
                                                        ]
                                                      )
                                                    ),
                                                    Text("₹${NumberFormat('#,##,###').format(fee['amountPaid'] ?? 0)}", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic)),
                                                  ]
                                                )
                                              );
                                            }).toList()
                                          )
                                        )
                                      ],
                                    )
                                  ).animate().fadeIn().slideY(begin: 0.1);
                                }),

                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 50), // 🔥 BOTTOM 50px LOCKED 🔥
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
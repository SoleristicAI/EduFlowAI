import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class FinanceStudentLedger extends ConsumerStatefulWidget {
  final String studentId;
  const FinanceStudentLedger({super.key, required this.studentId});

  @override
  ConsumerState<FinanceStudentLedger> createState() =>
      _FinanceStudentLedgerState();
}

class _FinanceStudentLedgerState extends ConsumerState<FinanceStudentLedger> {
  bool isInitialLoading = true;
  Map<String, dynamic>? audit;

  @override
  void initState() {
    super.initState();
    _fetchAudit();
  }

  Future<void> _fetchAudit({bool hideLoader = false}) async {
    if (!hideLoader) setState(() => isInitialLoading = true);

    try {
      final res = await ApiClient.dio.get('/fees/audit/${widget.studentId}');
      if (mounted) setState(() => audit = res.data);
    } catch (e) {
      _showToast("Ledger decryption error ❌", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  // 🔥 NATIVE REFRESH LOGIC 🔥
  Future<void> _handleRefresh() async {
    await _fetchAudit(hideLoader: true);
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isError ? Icons.error : Icons.check_circle,
                color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
                child: Text(message,
                    style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontStyle: FontStyle.italic,
                        fontSize: 12))),
          ],
        ),
        backgroundColor:
            isError ? const Color(0xFFF43F5E) : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.all(20),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isInitialLoading) return const CustomLoader();
    if (audit == null)
      return const Scaffold(body: Center(child: Text("Ledger not found.")));

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor =
        isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder =
        isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary =
        isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary =
        isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    // Ledger Calculations
    final num monthlyOut = audit?['monthlyOutstanding'] ?? 0;
    final num oneTimeOut = audit?['oneTimeOutstanding'] ?? 0;
    final num advanceBal = audit?['advanceBalance'] ?? 0;
    final num finalRemaining = monthlyOut + oneTimeOut;
    final bool isFeesDone = finalRemaining <= 0;
    final String statusText = isFeesDone ? "COMPLETED" : "PAYMENT REQUIRED";

    // Split Review Data
    List<dynamic> monthlyDetails = audit?['structureDetails']?['monthly'] ?? [];
    List<dynamic> oneTimeDetails = audit?['structureDetails']?['oneTime'] ?? [];
    Map<String, dynamic> historyMap = audit?['history'] ?? {};

    // Dynamic Colors for Status
    final Color statusBg = isFeesDone
        ? (isDarkMode ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
        : (isDarkMode ? const Color(0xFF4C0519) : const Color(0xFFFFF1F2));
    final Color statusBorder = isFeesDone
        ? (isDarkMode ? const Color(0xFF047857) : const Color(0xFFD1FAE5))
        : (isDarkMode ? const Color(0xFF881337) : const Color(0xFFFFE4E6));

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
          // 🔥 EXACT REFRESH INDICATOR & SCROLL VIEW STRUCTURE 🔥
          body: RefreshIndicator(
            color: const Color(0xFF42A5F5),
            backgroundColor: cardColor,
            onRefresh: _handleRefresh,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(
                  parent: ClampingScrollPhysics()),
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // --- PREMIUM HEADER ---
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.only(
                            top: 60, bottom: 80, left: 24, right: 24),
                        decoration: BoxDecoration(
                          color: const Color(0xFF42A5F5),
                          gradient: LinearGradient(
                            colors: isDarkMode
                                ? [
                                    const Color(0xFF1E3A8A),
                                    const Color(0xFF3B82F6)
                                  ]
                                : [
                                    const Color(0xFF64B5F6),
                                    const Color(0xFF42A5F5)
                                  ],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          borderRadius: const BorderRadius.vertical(
                              bottom: Radius.circular(55)),
                          boxShadow: const [
                            BoxShadow(
                                color: Colors.black12,
                                blurRadius: 15,
                                offset: Offset(0, 10))
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (context.canPop())
                                  context.pop();
                                else
                                  context.go('/finance/dashboard');
                              },
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: Colors.white.withOpacity(0.3)),
                                ),
                                child: const Icon(Icons.arrow_back,
                                    color: Colors.white, size: 24),
                              ),
                            ),
                            Column(
                              children: [
                                const Text("Student Ledger",
                                    style: TextStyle(
                                        fontSize: 26,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        fontStyle: FontStyle.italic,
                                        letterSpacing: -1)),
                                Text("FEES RECORDS",
                                    style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white.withOpacity(0.9),
                                        letterSpacing: 2)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.3)),
                              ),
                              child: const Icon(Icons.account_balance_wallet,
                                  color: Colors.white, size: 24),
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
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // 1. TOP STATUS BAR
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                    color: statusBg,
                                    borderRadius: BorderRadius.circular(35),
                                    border: Border.all(color: statusBorder),
                                    boxShadow: const [
                                      BoxShadow(
                                          color: Colors.black12,
                                          blurRadius: 10,
                                          offset: Offset(0, 4))
                                    ]),
                                child: Column(
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                  audit?['student']?['name']
                                                          ?.toString()
                                                          .toUpperCase() ??
                                                      'UNKNOWN',
                                                  style: TextStyle(
                                                      fontSize: 18,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: textColorPrimary,
                                                      fontStyle:
                                                          FontStyle.italic,
                                                      letterSpacing: -0.5)),
                                              const SizedBox(height: 6),
                                              Text(
                                                  "ADM NO: ${audit?['student']?['admissionNo'] ?? 'N/A'} • CLASS: ${audit?['student']?['grade'] ?? 'N/A'}",
                                                  style: TextStyle(
                                                      fontSize: 9,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: textColorSecondary,
                                                      letterSpacing: 1.5)),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 12, vertical: 8),
                                          decoration: BoxDecoration(
                                              color: isFeesDone
                                                  ? const Color(0xFF10B981)
                                                  : const Color(0xFFF43F5E),
                                              borderRadius:
                                                  BorderRadius.circular(20)),
                                          child: Row(
                                            children: [
                                              Icon(
                                                  isFeesDone
                                                      ? Icons.check_circle
                                                      : Icons
                                                          .warning_amber_rounded,
                                                  color: Colors.white,
                                                  size: 12),
                                              const SizedBox(width: 4),
                                              Text(statusText,
                                                  style: const TextStyle(
                                                      fontSize: 8,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: Colors.white,
                                                      letterSpacing: 1)),
                                            ],
                                          ),
                                        )
                                            .animate(
                                                target: isFeesDone ? 0 : 1,
                                                onPlay: (c) =>
                                                    c.repeat(reverse: true))
                                            .fade(begin: 1, end: 0.7),
                                      ],
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),

                              const SizedBox(height: 20),

                              // 2. LEDGER STATUS SECTION (Monthly & One-Time)
                              // Box 1: Monthly Dues
                              Container(
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                    color: cardColor,
                                    borderRadius: BorderRadius.circular(35),
                                    border: Border.all(color: cardBorder),
                                    boxShadow: const [
                                      BoxShadow(
                                          color: Colors.black12,
                                          blurRadius: 10,
                                          offset: Offset(0, 4))
                                    ]),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text("MONTHLY DUES",
                                                style: TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w900,
                                                    color: textColorSecondary,
                                                    letterSpacing: 2,
                                                    fontStyle:
                                                        FontStyle.italic)),
                                            const SizedBox(height: 8),
                                            Text(
                                                "₹${NumberFormat('#,##,###').format(monthlyOut)}",
                                                style: TextStyle(
                                                    fontSize: 32,
                                                    fontWeight: FontWeight.w900,
                                                    color: monthlyOut > 0
                                                        ? const Color(
                                                            0xFFF43F5E)
                                                        : const Color(
                                                            0xFF10B981),
                                                    letterSpacing: -1,
                                                    fontStyle:
                                                        FontStyle.italic)),
                                          ],
                                        ),
                                        Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(
                                              color: monthlyOut > 0
                                                  ? (isDarkMode
                                                      ? const Color(0xFF4C0519)
                                                      : const Color(0xFFFFF1F2))
                                                  : (isDarkMode
                                                      ? const Color(0xFF064E3B)
                                                      : const Color(
                                                          0xFFECFDF5)),
                                              borderRadius:
                                                  BorderRadius.circular(20)),
                                          child: Icon(Icons.calendar_today,
                                              size: 24,
                                              color: monthlyOut > 0
                                                  ? const Color(0xFFF43F5E)
                                                  : const Color(0xFF10B981)),
                                        )
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                        monthlyOut > 0
                                            ? "Includes current month + any unpaid previous months."
                                            : "Monthly fees is fully up to date.",
                                        style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: textColorSecondary,
                                            fontStyle: FontStyle.italic)),
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),

                              const SizedBox(height: 16),

                              // Box 2: One-Time Charges
                              Container(
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                    color: cardColor,
                                    borderRadius: BorderRadius.circular(35),
                                    border: Border.all(color: cardBorder),
                                    boxShadow: const [
                                      BoxShadow(
                                          color: Colors.black12,
                                          blurRadius: 10,
                                          offset: Offset(0, 4))
                                    ]),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text("ONE-TIME YEARLY CHARGES",
                                                style: TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w900,
                                                    color: textColorSecondary,
                                                    letterSpacing: 2,
                                                    fontStyle:
                                                        FontStyle.italic)),
                                            const SizedBox(height: 8),
                                            Text(
                                                "₹${NumberFormat('#,##,###').format(oneTimeOut)}",
                                                style: TextStyle(
                                                    fontSize: 32,
                                                    fontWeight: FontWeight.w900,
                                                    color: oneTimeOut > 0
                                                        ? const Color(
                                                            0xFFF59E0B)
                                                        : const Color(
                                                            0xFF10B981),
                                                    letterSpacing: -1,
                                                    fontStyle:
                                                        FontStyle.italic)),
                                          ],
                                        ),
                                        Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(
                                              color: oneTimeOut > 0
                                                  ? (isDarkMode
                                                      ? const Color(0xFF451A03)
                                                      : const Color(0xFFFFFBEB))
                                                  : (isDarkMode
                                                      ? const Color(0xFF064E3B)
                                                      : const Color(
                                                          0xFFECFDF5)),
                                              borderRadius:
                                                  BorderRadius.circular(20)),
                                          child: Icon(Icons.flash_on,
                                              size: 24,
                                              color: oneTimeOut > 0
                                                  ? const Color(0xFFF59E0B)
                                                  : const Color(0xFF10B981)),
                                        )
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                        oneTimeOut > 0
                                            ? "Fixed annual charges pending for this academic year."
                                            : "One-time charges cleared/Zero balance.",
                                        style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: textColorSecondary,
                                            fontStyle: FontStyle.italic)),
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),

                              // Box 3: Advance Credit
                              if (advanceBal > 0) ...[
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                      color: const Color(0xFF10B981),
                                      borderRadius: BorderRadius.circular(35),
                                      boxShadow: [
                                        BoxShadow(
                                            color: const Color(0xFF10B981)
                                                .withOpacity(0.4),
                                            blurRadius: 15,
                                            offset: const Offset(0, 5))
                                      ]),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text("SURPLUS CREDIT",
                                              style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w900,
                                                  color: Colors.white
                                                      .withOpacity(0.8),
                                                  letterSpacing: 2)),
                                          const SizedBox(height: 4),
                                          Text(
                                              "₹${NumberFormat('#,##,###').format(advanceBal)}",
                                              style: const TextStyle(
                                                  fontSize: 24,
                                                  fontWeight: FontWeight.w900,
                                                  color: Colors.white,
                                                  fontStyle: FontStyle.italic)),
                                        ],
                                      ),
                                      Icon(Icons.check_circle,
                                          size: 36,
                                          color: Colors.white.withOpacity(0.5)),
                                    ],
                                  ),
                                ).animate().fadeIn().slideY(begin: 0.1),
                              ],

                              const SizedBox(height: 24),

                              // 3. SPLIT REVIEW COMPONENTS
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Monthly Split
                                  Container(
                                    width: double
                                        .infinity, // Pura width cover karne ke liye
                                    padding: const EdgeInsets.all(20),
                                    decoration: BoxDecoration(
                                        color: cardColor,
                                        borderRadius: BorderRadius.circular(30),
                                        border: Border.all(color: cardBorder),
                                        boxShadow: const [
                                          BoxShadow(
                                              color: Colors.black12,
                                              blurRadius: 8,
                                              offset: Offset(0, 4))
                                        ]),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text("MONTHLY FEES SETUP",
                                            style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w900,
                                                color: Color(0xFF42A5F5),
                                                fontStyle: FontStyle.italic,
                                                letterSpacing: 1)),
                                        const SizedBox(height: 12),
                                        ...monthlyDetails.map((item) {
                                          return Padding(
                                            padding: const EdgeInsets.only(
                                                bottom: 8),
                                            child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Expanded(
                                                    child: Text(
                                                        item['label']
                                                                ?.toString()
                                                                .toUpperCase() ??
                                                            '',
                                                        maxLines: 1,
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                        style: TextStyle(
                                                            fontSize: 9,
                                                            fontWeight:
                                                                FontWeight.w900,
                                                            color:
                                                                textColorSecondary))),
                                                Text(
                                                    "₹${NumberFormat('#,##,###').format(item['amount'] ?? 0)}",
                                                    style: TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w900,
                                                        color:
                                                            textColorPrimary)),
                                              ],
                                            ),
                                          );
                                        }),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(
                                      height:
                                          16), // Width ki jagah Height kar diya

                                  // One-Time Split
                                  Container(
                                    width: double
                                        .infinity, // Pura width cover karne ke liye
                                    padding: const EdgeInsets.all(20),
                                    decoration: BoxDecoration(
                                        color: cardColor,
                                        borderRadius: BorderRadius.circular(30),
                                        border: Border.all(color: cardBorder),
                                        boxShadow: const [
                                          BoxShadow(
                                              color: Colors.black12,
                                              blurRadius: 8,
                                              offset: Offset(0, 4))
                                        ]),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text("ONE-TIME CHARGES SETUP",
                                            style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w900,
                                                color: Color(0xFFF59E0B),
                                                fontStyle: FontStyle.italic,
                                                letterSpacing: 1)),
                                        const SizedBox(height: 12),
                                        ...oneTimeDetails.map((item) {
                                          return Padding(
                                            padding: const EdgeInsets.only(
                                                bottom: 8),
                                            child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Expanded(
                                                    child: Text(
                                                        item['label']
                                                                ?.toString()
                                                                .toUpperCase() ??
                                                            '',
                                                        maxLines: 1,
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                        style: TextStyle(
                                                            fontSize: 9,
                                                            fontWeight:
                                                                FontWeight.w900,
                                                            color:
                                                                textColorSecondary))),
                                                Text(
                                                    "₹${NumberFormat('#,##,###').format(item['amount'] ?? 0)}",
                                                    style: TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w900,
                                                        color:
                                                            textColorPrimary)),
                                              ],
                                            ),
                                          );
                                        }),
                                      ],
                                    ),
                                  ),
                                ],
                              ).animate().fadeIn().slideY(begin: 0.1),

                              const SizedBox(height: 32),

                              // 4. LEDGER ENTRIES (HISTORY)
                              Row(
                                children: [
                                  const Icon(Icons.history,
                                      size: 16, color: Color(0xFF42A5F5)),
                                  const SizedBox(width: 8),
                                  Text("VERIFIED TRANSACTIONS",
                                      style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                          color: textColorSecondary,
                                          letterSpacing: 2,
                                          fontStyle: FontStyle.italic)),
                                ],
                              ),
                              const SizedBox(height: 20),

                              if (historyMap.isEmpty)
                                Container(
                                  width: double.infinity,
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 40),
                                  decoration: BoxDecoration(
                                      color: cardColor,
                                      borderRadius: BorderRadius.circular(35),
                                      border: Border.all(
                                          color: cardBorder,
                                          style: BorderStyle.solid)),
                                  child: Column(
                                    children: [
                                      Icon(Icons.warning_amber_rounded,
                                          size: 36,
                                          color: textColorSecondary
                                              .withOpacity(0.5)),
                                      const SizedBox(height: 12),
                                      Text("No transactional data logged",
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w900,
                                              color: textColorSecondary,
                                              letterSpacing: 1.5,
                                              fontStyle: FontStyle.italic)),
                                    ],
                                  ),
                                )
                              else
                                ...historyMap.entries.map((entry) {
                                  String monthYear = entry.key;
                                  List<dynamic> records = entry.value;

                                  return Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Month Divider
                                      Row(
                                        children: [
                                          Expanded(
                                              child: Container(
                                                  height: 1,
                                                  color: cardBorder)),
                                          Padding(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 12),
                                            child: Text(monthYear.toUpperCase(),
                                                style: const TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w900,
                                                    color: Color(0xFF42A5F5),
                                                    letterSpacing: 2)),
                                          ),
                                          Expanded(
                                              child: Container(
                                                  height: 1,
                                                  color: cardBorder)),
                                        ],
                                      ),
                                      const SizedBox(height: 16),

                                      // Records
                                      ...records.map((h) {
                                        DateTime date = DateTime.tryParse(
                                                h['date']?.toString() ?? '') ??
                                            DateTime.now();
                                        String fDate = DateFormat('dd/MM/yyyy')
                                            .format(date);
                                        String category = h['category']
                                                ?.toString()
                                                .toUpperCase() ??
                                            'GENERAL FEE';
                                        String mode = h['mode']
                                                ?.toString()
                                                .toUpperCase() ??
                                            'UNKNOWN';

                                        return Container(
                                          margin:
                                              const EdgeInsets.only(bottom: 12),
                                          padding: const EdgeInsets.all(20),
                                          decoration: BoxDecoration(
                                              color: cardColor,
                                              borderRadius:
                                                  BorderRadius.circular(30),
                                              border:
                                                  Border.all(color: cardBorder),
                                              boxShadow: const [
                                                BoxShadow(
                                                    color: Colors.black12,
                                                    blurRadius: 6,
                                                    offset: Offset(0, 3))
                                              ]),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Row(
                                                children: [
                                                  Container(
                                                    padding:
                                                        const EdgeInsets.all(
                                                            12),
                                                    decoration: BoxDecoration(
                                                        color: isDarkMode
                                                            ? const Color(
                                                                0xFF0F172A)
                                                            : const Color(
                                                                0xFFF1F5F9),
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(16)),
                                                    child: const Icon(
                                                        Icons.calendar_today,
                                                        size: 16,
                                                        color:
                                                            Color(0xFF42A5F5)),
                                                  ),
                                                  const SizedBox(width: 16),
                                                  Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Text(category,
                                                          style: TextStyle(
                                                              fontSize: 12,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w900,
                                                              color:
                                                                  textColorPrimary,
                                                              fontStyle:
                                                                  FontStyle
                                                                      .italic)),
                                                      const SizedBox(height: 4),
                                                      Text("$fDate • $mode",
                                                          style: TextStyle(
                                                              fontSize: 9,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .bold,
                                                              color:
                                                                  textColorSecondary)),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                              Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.end,
                                                children: [
                                                  Text(
                                                      "+ ₹${NumberFormat('#,##,###').format(h['amount'] ?? 0)}",
                                                      style: const TextStyle(
                                                          fontSize: 14,
                                                          fontWeight:
                                                              FontWeight.w900,
                                                          color:
                                                              Color(0xFF10B981),
                                                          fontStyle: FontStyle
                                                              .italic)),
                                                  const SizedBox(height: 4),
                                                  Row(
                                                    children: [
                                                      Container(
                                                          width: 4,
                                                          height: 4,
                                                          decoration:
                                                              const BoxDecoration(
                                                                  color: Color(
                                                                      0xFF10B981),
                                                                  shape: BoxShape
                                                                      .circle)),
                                                      const SizedBox(width: 4),
                                                      const Text("CAPTURED",
                                                          style: TextStyle(
                                                              fontSize: 8,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w900,
                                                              color: Color(
                                                                  0xFF94A3B8),
                                                              letterSpacing: 1,
                                                              fontStyle:
                                                                  FontStyle
                                                                      .italic)),
                                                    ],
                                                  )
                                                ],
                                              )
                                            ],
                                          ),
                                        );
                                      })
                                    ],
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

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import 'package:flutter/services.dart';

class FinanceDashboard extends ConsumerStatefulWidget {
  final String? searchQuery;
  const FinanceDashboard({super.key, this.searchQuery});

  @override
  ConsumerState<FinanceDashboard> createState() => _FinanceDashboardState();
}

class _FinanceDashboardState extends ConsumerState<FinanceDashboard> {
  bool isLoading = true;
  Timer? _pollingTimer;
  DateTime? _lastPressedAt;

  Map<String, dynamic> stats = {
    'collectedToday': 0,
    'collectedMonth': 0,
    'recentPayments': [],
    'pendingCount': 0,
  };

  bool showAllSlips = false;
  Map<String, dynamic>? newPaymentAlert;

  @override
  void initState() {
    super.initState();
    _fetchStats();
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (_) => _fetchStats(isPolling: true));
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchStats({bool isRefresh = false, bool isPolling = false}) async {
    if (!isRefresh && !isPolling && mounted) setState(() => isLoading = true);

    try {
      final response = await ApiClient.dio.get('/users/finance/stats');
      final data = response.data;

      if (mounted) {
        List<dynamic> oldPayments = stats['recentPayments'] ?? [];
        List<dynamic> newPayments = data['recentPayments'] ?? [];

        if (oldPayments.isNotEmpty && newPayments.isNotEmpty) {
          String latestOldId = oldPayments[0]['_id'].toString();
          String latestNewId = newPayments[0]['_id'].toString();

          if (latestNewId != latestOldId) {
            setState(() => newPaymentAlert = newPayments[0]);
            Future.delayed(const Duration(seconds: 7), () {
              if (mounted) setState(() => newPaymentAlert = null);
            });
          }
        }

        setState(() {
          stats = data;
          isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Finance Stats Error: $e");
      if (mounted && !isPolling) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    // 🔥 FIX 1: Agar page load ho raha hai, toh pura global CustomLoader (jisme scaffold tha) mat bhej.
    // Uska framework architecture clash khatam karne ke liye hum local native container bhejenge.
    if (isLoading) {
      return Container(
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(vertical: 80),
        alignment: Alignment.center,
        child: const CircularProgressIndicator(
          color: Color(0xFF42A5F5),
          strokeWidth: 4,
        ),
      );
    }

    final List<Map<String, dynamic>> statCards = [
      {'label': "Today's collection", 'value': stats['collectedToday'], 'icon': Icons.account_balance_wallet, 'color': const Color(0xFF42A5F5), 'path': '/finance/add-payment'},
      {'label': "Monthly collection", 'value': stats['collectedMonth'], 'icon': Icons.trending_up, 'color': const Color(0xFF10B981), 'path': '/finance/reports'},
      {'label': "Students fees", 'value': "Track records", 'icon': Icons.people, 'color': const Color(0xFFF97316), 'path': '/finance/fees-tracker'},
      {'label': "Fees details", 'value': "Class setup", 'icon': Icons.layers, 'color': const Color(0xFF3B82F6), 'path': '/finance/fee-setup'},
      {'label': "Payments", 'value': "Configure UPI/QR", 'icon': Icons.security, 'color': const Color(0xFF34D399), 'path': '/finance/gateway'},
      {'label': "Fees Notice Hub", 'value': "Publish Notices", 'icon': Icons.campaign, 'color': const Color(0xFFF43F5E), 'path': '/finance/fees-notice'},
    ];

    final filteredCards = statCards.where((card) {
      if (widget.searchQuery == null || widget.searchQuery!.isEmpty) return true;
      return card['label'].toString().toLowerCase().contains(widget.searchQuery!.toLowerCase());
    }).toList();

    List<dynamic> recentPayments = stats['recentPayments'] ?? [];

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;

        final now = DateTime.now();
        if (_lastPressedAt == null ||
            now.difference(_lastPressedAt!) > const Duration(seconds: 2)) {
          _lastPressedAt = now;
          // 🔥 PREMIUM EXIT TOAST 🔥
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              elevation: 0,
              backgroundColor: Colors.transparent,
              duration: const Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.only(
                bottom: 740, // Height check kar lena apne hisaab se
                left: 35,
                right: 35,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
              content: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 22,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.36),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.18),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.white.withValues(alpha: 0.04),
                      blurRadius: 25,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Text(
                  "Press BACK again to EXIT app",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontStyle: FontStyle.italic,
                    color: Color(0xFFE2E8F0),
                    fontSize: 10,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          );
        } else {
          SystemNavigator.pop(); // 🔥 APP BAND HO JAYEGI 🔥
        }
      },
      child: Container(
        color: Colors.transparent,
        child: Stack(
          children: [
            // Swipe Down Pull-to-Refresh with complete scroll support
            RefreshIndicator(
              color: const Color(0xFF42A5F5),
              backgroundColor: cardColor,
              onRefresh: () => _fetchStats(isRefresh: true),
              child: SingleChildScrollView(
                // BouncingScrollPhysics ensures pull down refresh triggers smoothly
                physics: const BouncingScrollPhysics(),
                child: Column(
                  children: [
                    // --- SEAMLESS HEADER ---
                    Transform.translate(
                      offset: const Offset(0, -3), // Seamlessly merges with LayoutWrapper Navbar
                      child: Container(
                        padding: const EdgeInsets.only(top: 30, bottom: 80, left: 24, right: 24),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: isDarkMode ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                            begin: Alignment.topCenter, end: Alignment.bottomCenter,
                          ),
                          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("Finance Hub", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
                                Text("ACCOUNTANT PANEL", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                              ],
                            ),
                            GestureDetector(
                              onTap: () => context.push('/finance/add-payment'),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
                                child: const Icon(Icons.add, color: Color(0xFF42A5F5), size: 24),
                              ),
                            ).animate().scale(curve: Curves.easeOutBack),
                          ],
                        ),
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- BODY CONTENT ---
                    Transform.translate(
                      offset: const Offset(0, -30),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Column(
                          children: [
                            // 1. ANALYTICS GRID
                            GridView.builder(
                              padding: EdgeInsets.zero,
                              physics: const NeverScrollableScrollPhysics(),
                              shrinkWrap: true, 
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 0.85),
                              itemCount: filteredCards.length,
                              itemBuilder: (context, index) {
                                final card = filteredCards[index];
                                final bool isCountVal = card['value'] is num;

                                return GestureDetector(
                                  onTap: () => context.push(card['path']),
                                  child: Container(
                                    padding: const EdgeInsets.all(20),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(35), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]),
                                    child: Stack(
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Icon(card['icon'], color: card['color'], size: 28),
                                            const Spacer(),
                                            Text(isCountVal ? "₹${card['value'].toString()}" : card['value'].toString(), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                            const SizedBox(height: 4),
                                            Text(card['label'].toString().toUpperCase(), style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                          ],
                                        ),
                                        if (card['label'] == 'Payments' && (stats['pendingCount'] ?? 0) > 0)
                                          Positioned(
                                            top: 0, right: 0,
                                            child: Container(
                                              padding: const EdgeInsets.all(6),
                                              decoration: const BoxDecoration(color: Color(0xFFF43F5E), shape: BoxShape.circle),
                                              child: Text(stats['pendingCount'].toString(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white)),
                                            ).animate().scale(curve: Curves.easeOutBack),
                                          )
                                      ],
                                    ),
                                  ).animate().fadeIn(delay: Duration(milliseconds: 50 * index)).slideY(begin: 0.1),
                                );
                              },
                            ),
                            const SizedBox(height: 24),

                            // 2. RECENT PAYMENTS
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.history, color: Color(0xFF42A5F5), size: 20),
                                      const SizedBox(width: 8),
                                      Text("RECENT TRANSACTIONS", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                    ],
                                  ),
                                  const SizedBox(height: 20),

                                  if (recentPayments.isEmpty)
                                    Center(
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(vertical: 30),
                                        child: Column(
                                          children: [
                                            Icon(Icons.currency_rupee, size: 40, color: textColorSecondary.withOpacity(0.3)),
                                            const SizedBox(height: 12),
                                            Text("NO RECENT INFLOW", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                          ],
                                        ),
                                      ),
                                    )
                                  else ...[
                                    ...(showAllSlips ? recentPayments : recentPayments.take(3)).map((p) {
                                      return GestureDetector(
                                        onTap: () => context.push('/finance/receipt/${p['_id']}'),
                                        child: Container(
                                          margin: const EdgeInsets.only(bottom: 12),
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Row(
                                                      children: [
                                                        Expanded(child: Text(p['studentName'].toString().toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic))),
                                                        Container(
                                                          margin: const EdgeInsets.only(left: 8),
                                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                          decoration: BoxDecoration(color: const Color(0xFF42A5F5).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                                                          child: Text((p['paymentMode'] ?? 'CASH').toString().toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1)),
                                                        )
                                                      ],
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text("${p['grade']} • ${p['date']} ${p['time'] ?? ''}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1)),
                                                  ],
                                                ),
                                              ),
                                              Text("₹${p['amount']}", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic)),
                                            ],
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                    
                                    if (recentPayments.length > 3)
                                      GestureDetector(
                                        onTap: () => setState(() => showAllSlips = !showAllSlips),
                                        child: Container(
                                          width: double.infinity,
                                          margin: const EdgeInsets.only(top: 12),
                                          padding: const EdgeInsets.symmetric(vertical: 16),
                                          decoration: BoxDecoration(color: const Color(0xFF42A5F5).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(showAllSlips ? "SHOW LESS" : "SHOW MORE", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2)),
                                              const SizedBox(width: 4),
                                              Icon(showAllSlips ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, size: 14, color: const Color(0xFF42A5F5)),
                                            ],
                                          ),
                                        ),
                                      )
                                  ]
                                ],
                              ),
                            ).animate().slideY(begin: 0.1),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 80), // 🔥 LOCK 120px EXTRA BOTTOM SPACE FOR NAVIGATION BAR 🔥
                  ],
                ),
              ),
            ),

            // --- FLOATING INCOMING PAYMENT ALERT ---
            if (newPaymentAlert != null)
              Positioned(
                top: 20, left: 20, right: 20,
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(35),
                    border: Border.all(color: const Color(0xFF42A5F5), width: 2),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, 10))]
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(color: Color(0xFF42A5F5), shape: BoxShape.circle),
                        child: const Icon(Icons.flash_on, color: Colors.white, size: 20),
                      ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1,1), end: const Offset(1.1,1.1)),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("INCOMING PAYMENT", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5)),
                            Text(newPaymentAlert!['studentName'].toString().toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                            Text("${newPaymentAlert!['grade']} • Received Now", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text("₹${newPaymentAlert!['amount']}", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                          const Row(
                            children: [
                              Icon(Icons.check_circle, size: 10, color: Color(0xFF10B981)),
                              SizedBox(width: 4),
                              Text("VERIFIED", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF10B981), letterSpacing: 1)),
                            ],
                          )
                        ],
                      )
                    ],
                  ),
                ).animate().slideY(begin: -1.0, duration: 400.ms, curve: Curves.easeOutBack)
              )
          ],
        ),
      ),
    );
  }
}
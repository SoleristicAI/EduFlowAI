import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';

class StudentErpNotices extends StatefulWidget {
  const StudentErpNotices({super.key});

  @override
  State<StudentErpNotices> createState() => _StudentErpNoticesState();
}

class _StudentErpNoticesState extends State<StudentErpNotices> {
  bool loading = true;
  List<dynamic> noticeList = [];

  @override
  void initState() {
    super.initState();
    _fetchErpNotices();
  }

  Future<void> _fetchErpNotices() async {
    try {
      final response = await ApiClient.dio.get('/fee-notices/view');
      
      if (mounted) {
        setState(() {
          // Backend structure: { "success": true, "notices": [...] }
          noticeList = (response.data['notices'] as List<dynamic>?) ?? [];
          loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchErpNotices();
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 ALWAYS USING LOADER AS REQUESTED 🔥
    if (loading) return const CustomLoader();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) context.pop();
        else context.go('/');
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: Colors.white,
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
                      padding: const EdgeInsets.only(top: 60, bottom: 80),
                      decoration: const BoxDecoration(
                        color: Color(0xFF42A5F5),
                        gradient: LinearGradient(
                          colors: [Color(0xFF64B5F6), Color(0xFF42A5F5)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: BorderRadius.vertical(bottom: Radius.circular(55)),
                        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
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
                                    const Text("ERP Notices", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                    Text("IMPORTANT SCHOOL UPDATES", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: const Icon(Icons.notifications_active, color: Colors.white, size: 22),
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
                        child: Column(
                          children: [
                            // Main Ribbon Indicator
                            Container(
                              margin: const EdgeInsets.only(bottom: 24),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.9),
                                borderRadius: BorderRadius.circular(25),
                                border: Border.all(color: Colors.blue.shade50, width: 2),
                                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 10, height: 10,
                                        decoration: const BoxDecoration(color: Color(0xFF42A5F5), shape: BoxShape.circle),
                                      ).animate(onPlay: (controller) => controller.repeat(reverse: true)).fade(begin: 0.2, end: 1.0, duration: 800.ms),
                                      const SizedBox(width: 12),
                                      const Text("ALL FEES NOTICES", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 2)),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                    decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)),
                                    child: Text("${noticeList.length} LIVE", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8))),
                                  )
                                ],
                              ),
                            ).animate().fadeIn().slideY(begin: 0.1),

                            // Dynamic Notice List or Empty State
                            if (noticeList.isNotEmpty)
                              Column(
                                children: noticeList.asMap().entries.map((entry) {
                                  int idx = entry.key;
                                  var notice = entry.value;
                                  bool isFeeAlert = notice['noticeType'] == 'fee_alert';

                                  DateTime rawDate = DateTime.tryParse(notice['date'] ?? notice['createdAt'] ?? '') ?? DateTime.now();
                                  String formattedDate = DateFormat('dd MMM yyyy').format(rawDate);
                                  String formattedTime = DateFormat('hh:mm a').format(rawDate);

                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 24),
                                    padding: const EdgeInsets.all(28),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(40),
                                      border: Border.all(color: const Color(0xFFF1F5F9)),
                                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Header Row
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                color: isFeeAlert ? const Color(0xFFFFF1F2) : const Color(0xFFFFFBEB),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Icon(
                                                isFeeAlert ? Icons.warning_amber_rounded : Icons.description, 
                                                color: isFeeAlert ? const Color(0xFFF43F5E) : const Color(0xFFF59E0B), 
                                                size: 24
                                              ),
                                            ),
                                            const SizedBox(width: 16),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    isFeeAlert ? "FEE ALERT NOTICE" : "FINANCIAL NOTICE (OTHERS)", 
                                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: isFeeAlert ? const Color(0xFFE11D48) : const Color(0xFFD97706), fontStyle: FontStyle.italic, height: 1.1)
                                                  ),
                                                  const SizedBox(height: 4),
                                                  const Text(
                                                    "VERIFIED & ISSUED BY ERP SYSTEM", 
                                                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), fontStyle: FontStyle.italic)
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 24),

                                        // Message Body Block
                                        Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.all(24),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF8FAFC),
                                            borderRadius: BorderRadius.circular(30),
                                            border: Border.all(color: const Color(0xFFF1F5F9)),
                                          ),
                                          child: Text(
                                            notice['content']?.toString() ?? "No content provided.",
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569), height: 1.5),
                                          ),
                                        ),
                                        const SizedBox(height: 20),

                                        // Footer Date Block
                                        Row(
                                          children: [
                                            const Icon(Icons.access_time, size: 14, color: Color(0xFF64748B)),
                                            const SizedBox(width: 8),
                                            Text(
                                              "PUBLISHED: $formattedDate AT $formattedTime",
                                              style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: 1.5)
                                            ),
                                          ],
                                        )
                                      ],
                                    ),
                                  ).animate().fadeIn(delay: Duration(milliseconds: 100 * idx)).slideY(begin: 0.1);
                                }).toList(),
                              )
                            else
                              // Empty Grid State
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 80, horizontal: 24),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(55),
                                  border: Border.all(color: const Color(0xFFF1F5F9), width: 2), // Dashed border simulate nahi kiya jata, normal border lagaya hai
                                ),
                                child: Column(
                                  children: [
                                    const Icon(Icons.wb_sunny, size: 80, color: Color(0xFF6EE7B7)).animate(onPlay: (c) => c.repeat()).rotate(duration: 8.seconds),
                                    const SizedBox(height: 32),
                                    const Text("CLEAR ACCOUNT STATUS", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), fontStyle: FontStyle.italic)),
                                    const SizedBox(height: 12),
                                    const Text(
                                      "No outstanding dues found for this account. Everything is up to date.", 
                                      textAlign: TextAlign.center, 
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn().scale(begin: const Offset(0.9, 0.9)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 50), // Standard bottom padding
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
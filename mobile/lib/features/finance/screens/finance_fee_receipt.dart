import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class FinanceFeeReceipt extends ConsumerStatefulWidget {
  final String receiptId;
  const FinanceFeeReceipt({super.key, required this.receiptId});

  @override
  ConsumerState<FinanceFeeReceipt> createState() => _FinanceFeeReceiptState();
}

class _FinanceFeeReceiptState extends ConsumerState<FinanceFeeReceipt> {
  bool isLoading = true;
  Map<String, dynamic>? receipt;

  @override
  void initState() {
    super.initState();
    _fetchReceipt();
  }

  Future<void> _fetchReceipt({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isLoading = true);

    try {
      final res = await ApiClient.dio.get('/fees/receipt/${widget.receiptId}');
      if (mounted) setState(() => receipt = res.data);
    } catch (e) {
      _showToast("Receipt load error", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _handlePrint() {
    _showToast("Print sequence initiated! 🖨️");
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
    if (isLoading && receipt == null) return const CustomLoader();
    if (receipt == null) {
      return const Scaffold(body: Center(child: Text("Receipt not found.")));
    }

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color paperColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFCBD5E1);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color subtleBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    final bool isTransport = receipt!['feeType'] == 'Transport' || (receipt!['remarks'] != null && receipt!['remarks'].toString().toUpperCase().contains('TRANSPORT'));

    String shortId = widget.receiptId.length > 8 
        ? widget.receiptId.substring(widget.receiptId.length - 8).toUpperCase() 
        : widget.receiptId.toUpperCase();

    String formattedDate = "N/A";
    if (receipt!['date'] != null) {
      try {
        formattedDate = DateFormat('dd/MM/yyyy').format(DateTime.parse(receipt!['date']));
      } catch (_) {}
    }

    // Contact number fallback mapping
    String schoolContact = receipt!['schoolId']?['adminDetails']?['mobile'] ?? 
                           receipt!['schoolId']?['schoolContact'] ?? 
                           receipt!['displayContact'] ?? "+91 98765-43210";

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        // 🔥 DIRECT FINANCE DASHBOARD PAR BHEJO 🔥
        context.go('/finance/dashboard');
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: Colors.black,
          backgroundColor: paperColor,
          onRefresh: () => _fetchReceipt(isRefresh: true),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
              child: Column(
                children: [
                  // --- TOP ACTIONS ---
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GestureDetector(
                        onTap: () {
                          context.go('/finance/dashboard');
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: paperColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor)),
                          child: Icon(Icons.arrow_back, color: textColorPrimary, size: 20),
                        ),
                      ),
                      GestureDetector(
                        onTap: _handlePrint,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(16)),
                          child: const Row(
                            children: [
                              Icon(Icons.print, color: Colors.white, size: 16),
                              SizedBox(width: 8),
                              Text("PRINT RECEIPT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                            ],
                          ),
                        ),
                      ).animate().scale(curve: Curves.easeOutBack),
                    ],
                  ).animate().fadeIn().slideY(begin: -0.2),

                  const SizedBox(height: 24),

                 // --- BLACK & WHITE RECEIPT PAPER DESIGN (OVERFLOW PROOF) ---
                  LayoutBuilder(
                    builder: (context, constraints) {
                      return Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: paperColor,
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))],
                          border: Border.all(color: borderColor),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            
                            // TOP BORDER ACCENT
                            Container(height: 12, decoration: const BoxDecoration(color: Colors.black, borderRadius: BorderRadius.vertical(top: Radius.circular(30)))),

                            // 1. SCHOOL HEADER
                            Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                children: [
                                  Text(
                                    receipt!['schoolId']?['schoolName']?.toString().toUpperCase() ?? "EDUFLOWAI INSTITUTION", 
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: -0.5)
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.location_on, size: 12, color: Colors.black),
                                      const SizedBox(width: 4),
                                      Flexible(
                                        child: Text(
                                          receipt!['schoolId']?['schoolAddress'] ?? "Digital Campus", 
                                          textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, 
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 0.5)
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.phone, size: 12, color: Colors.black),
                                      const SizedBox(width: 4),
                                      Text("CONTACT: $schoolContact", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 0.5)),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            Divider(color: borderColor, thickness: 1, height: 1),

                            // 2. RECEIPT META DATA WITH PAID STAMP (Flexible Row)
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text("RECEIPT NO.", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.2)),
                                        const SizedBox(height: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                          decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(10), border: Border.all(color: borderColor)),
                                          child: Text("#REC-$shortId", maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary, fontFamily: 'monospace')),
                                        )
                                      ],
                                    ),
                                  ),
                                  
                                  const SizedBox(width: 8),
                                  
                                  // B&W PAID STAMP
                                  Transform.rotate(
                                    angle: 0.2,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(border: Border.all(color: Colors.black, width: 2), borderRadius: BorderRadius.circular(8)),
                                      child: const Text("PAID", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.black, fontStyle: FontStyle.italic, letterSpacing: 2)),
                                    ),
                                  ),

                                  const SizedBox(width: 8),

                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text("DATE ISSUED", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.2)),
                                        const SizedBox(height: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                          decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(10), border: Border.all(color: borderColor)),
                                          child: Text(formattedDate, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary, fontFamily: 'monospace')),
                                        )
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),

                            // 3. STUDENT INFORMATION
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(24), border: Border.all(color: borderColor)),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text("STUDENT DETAILS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black, letterSpacing: 1.5)),
                                    const SizedBox(height: 14),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text("STUDENT NAME", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.2)),
                                              const SizedBox(height: 4),
                                              Text(receipt!['student']?['name']?.toString().toUpperCase() ?? "N/A", maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary)),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text("CLASS / GRADE", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.2)),
                                              const SizedBox(height: 4),
                                              Text(receipt!['student']?['grade']?.toString().toUpperCase() ?? "N/A", maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary)),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (receipt!['student']?['enrollmentNo'] != null) ...[
                                      const SizedBox(height: 14),
                                      Divider(color: borderColor, thickness: 1, height: 1),
                                      const SizedBox(height: 14),
                                      Text("ENROLLMENT NO.", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.2)),
                                      const SizedBox(height: 4),
                                      Text(receipt!['student']?['enrollmentNo']?.toString().toUpperCase() ?? "N/A", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorSecondary, fontFamily: 'monospace')),
                                    ]
                                  ],
                                ),
                              ),
                            ),

                            // 4. FEE TABLE
                            Padding(
                              padding: const EdgeInsets.all(20),
                              child: Container(
                                decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), border: Border.all(color: borderColor)),
                                child: Column(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                      decoration: BoxDecoration(color: subtleBg, borderRadius: const BorderRadius.vertical(top: Radius.circular(20)), border: Border(bottom: BorderSide(color: borderColor))),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text("DESCRIPTION", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                          Text("AMOUNT", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                        ],
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  receipt!['feeCategory']?.toString().toUpperCase() ?? "GENERAL FEES", 
                                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)
                                                ),
                                                if (isTransport && receipt!['remarks'] != null) ...[
                                                  const SizedBox(height: 6),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                    decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(8), border: Border.all(color: borderColor)),
                                                    child: Text(receipt!['remarks'], style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorPrimary)),
                                                  ),
                                                ],
                                                const SizedBox(height: 6),
                                                Text("Cycle: ${receipt!['month'] ?? ''} ${receipt!['year'] ?? ''}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textColorSecondary)),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text("₹${receipt!['amountPaid']}", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: -0.5)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // 5. TOTAL SECTION (B&W)
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: Colors.black,
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                                          child: const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.check_circle, color: Colors.black, size: 10),
                                              SizedBox(width: 4),
                                              Text("VERIFIED", style: TextStyle(fontSize: 7, fontWeight: FontWeight.w900, color: Colors.black, letterSpacing: 1)),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Text("MODE: ${receipt!['paymentMode']?.toString().toUpperCase() ?? 'CASH'}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 1.2, fontStyle: FontStyle.italic)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text("TOTAL PAID", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.7), letterSpacing: 1.2)),
                                        const SizedBox(height: 2),
                                        Text("₹${receipt!['amountPaid']}", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                      ],
                                    )
                                  ],
                                ),
                              ),
                            ),

                            // 6. FOOTER NOTE
                            Padding(
                              padding: const EdgeInsets.only(top: 24, bottom: 24, left: 16, right: 16),
                              child: Column(
                                children: [
                                  Container(height: 2, width: 40, decoration: BoxDecoration(color: borderColor, borderRadius: BorderRadius.circular(10))),
                                  const SizedBox(height: 12),
                                  Text(
                                    "This is a system generated secure digital receipt.\n© EduFlowAI Finance Network • No physical signature required.",
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.2, fontStyle: FontStyle.italic, height: 1.4)
                                  ),
                                ],
                              ),
                            )
                            
                          ],
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 50),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
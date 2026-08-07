import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart'; // 🔥 Date formatting ke liye required
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
      // 🔥 FIX 1: API Route '/fees/receipt/' hota hai, '/users/finance/' nahi 🔥
      final res = await ApiClient.dio.get('/fees/receipt/${widget.receiptId}');
      if (mounted) setState(() => receipt = res.data);
    } catch (e) {
      _showToast("Receipt load error", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _handlePrint() {
    // PDF generation/print logic pipeline (Currently shows a premium toast)
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
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color subtleBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    String shortId = widget.receiptId.length > 8 
        ? widget.receiptId.substring(widget.receiptId.length - 8).toUpperCase() 
        : widget.receiptId.toUpperCase();

    // 🔥 FIX 2: Real date parsing logic 🔥
    String formattedDate = "N/A";
    if (receipt!['date'] != null) {
      try {
        formattedDate = DateFormat('dd/MM/yyyy').format(DateTime.parse(receipt!['date']));
      } catch (e) {
        formattedDate = "Invalid Date";
      }
    }

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
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: paperColor,
          onRefresh: () => _fetchReceipt(isRefresh: true),
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
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
                          if (context.canPop()) context.pop();
                          else context.go('/finance/dashboard');
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: paperColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]),
                          child: const Icon(Icons.arrow_back, color: Color(0xFF42A5F5), size: 20),
                        ),
                      ),
                      GestureDetector(
                        onTap: _handlePrint,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 4))]),
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

                  // --- RECEIPT PAPER DESIGN ---
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: paperColor,
                      borderRadius: BorderRadius.circular(40),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))],
                      border: const Border(top: BorderSide(color: Color(0xFF42A5F5), width: 12)) // 🔥 PREMIUM TOP BLUE BORDER 🔥
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        
                        // 1. SCHOOL HEADER
                        Padding(
                          padding: const EdgeInsets.all(30),
                          child: Column(
                            children: [
                              Text(
                                // 🔥 FIX 3: Real Database Field Mapping 🔥
                                receipt!['schoolId']?['schoolName']?.toString().toUpperCase() ?? "EDUFLOWAI INSTITUTION", 
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: -0.5)
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.location_on, size: 12, color: Color(0xFF42A5F5)),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      receipt!['schoolId']?['schoolAddress'] ?? "Digital Campus", 
                                      textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis, 
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: 0.5)
                                    )
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.phone, size: 12, color: textColorPrimary),
                                  const SizedBox(width: 4),
                                  Text(
                                    "CONTACT: ${receipt!['schoolId']?['schoolContact'] ?? "N/A"}", 
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: 0.5)
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        Divider(color: borderColor, thickness: 1, height: 1),

                        // 2. RECEIPT META DATA
                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text("RECEIPT NUMBER", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderColor)),
                                    child: Text("#REC-$shortId", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary, fontFamily: 'monospace')),
                                  )
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text("DATE ISSUED", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderColor)),
                                    child: Text(
                                      formattedDate, // 🔥 FIX: Updated mapped variable
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary, fontFamily: 'monospace')
                                    ),
                                  )
                                ],
                              )
                            ],
                          ),
                        ),

                        // 3. STUDENT INFORMATION
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(30), border: Border.all(color: borderColor)),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("STUDENT INFORMATION :", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5)),
                                const SizedBox(height: 20),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text("STUDENT NAME", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                          const SizedBox(height: 4),
                                          Text(receipt!['student']?['name']?.toString().toUpperCase() ?? "N/A", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary)),
                                        ],
                                      ),
                                    ),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text("CLASS / GRADE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                          const SizedBox(height: 4),
                                          // 🔥 Yahan 9-A, 10-B apne aap snapshot se aayega!
                                          Text(receipt!['student']?['grade']?.toString().toUpperCase() ?? "N/A", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                if (receipt!['student']?['enrollmentNo'] != null) ...[
                                  const SizedBox(height: 16),
                                  Divider(color: borderColor, thickness: 1, height: 1),
                                  const SizedBox(height: 16),
                                  Text("ENROLLMENT NO.", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                  const SizedBox(height: 4),
                                  Text(receipt!['student']?['enrollmentNo']?.toString().toUpperCase() ?? "N/A", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary)),
                                ]
                              ],
                            ),
                          ),
                        ),

                        // 4. FEE TABLE
                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text("DESCRIPTION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                  Text("AMOUNT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Divider(color: subtleBg, thickness: 2, height: 2),
                              const SizedBox(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          // 🔥 FIX 4: Real fee purpose/category mapping 🔥
                                          receipt!['feeCategory']?.toString().toUpperCase() ?? "GENERAL FEES", 
                                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)
                                        ),
                                        const SizedBox(height: 6),
                                        Text("Billing cycle: ${receipt!['month'] ?? ''} ${receipt!['year'] ?? ''}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColorSecondary)),
                                      ],
                                    ),
                                  ),
                                  Text("₹${receipt!['amountPaid']}", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: -0.5)),
                                ],
                              )
                            ],
                          ),
                        ),

                        // 5. TOTAL SECTION
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: const Color(0xFF42A5F5),
                              borderRadius: BorderRadius.circular(35),
                              boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                                      child: const Row(
                                        children: [
                                          Icon(Icons.check_circle, color: Color(0xFF42A5F5), size: 12),
                                          SizedBox(width: 4),
                                          Text("VERIFIED TXN", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1)),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Text("MODE: ${receipt!['paymentMode']?.toString().toUpperCase() ?? 'CASH'}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text("TOTAL PAID", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.7), letterSpacing: 1.5)),
                                    const SizedBox(height: 4),
                                    Text("₹${receipt!['amountPaid']}", style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                  ],
                                )
                              ],
                            ),
                          ),
                        ),

                        // 6. FOOTER NOTE
                        Padding(
                          padding: const EdgeInsets.only(top: 40, bottom: 30),
                          child: Column(
                            children: [
                              Container(height: 3, width: 60, decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(10))),
                              const SizedBox(height: 20),
                              Text(
                                "This is a system generated secure digital receipt.\n© EduFlowAI Finance Neural Network • No physical signature required.",
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic, height: 1.5)
                              ),
                            ],
                          ),
                        )
                        
                      ],
                    ),
                  ).animate().fadeIn().slideY(begin: 0.1),

                  const SizedBox(height: 50), // 🔥 BOTTOM 50px LOCKED 🔥
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
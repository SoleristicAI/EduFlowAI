import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import 'dart:ui';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

// 🔥 ConsumerStatefulWidget for theme listening
class StudentFees extends ConsumerStatefulWidget {
  const StudentFees({super.key});

  @override
  ConsumerState<StudentFees> createState() => _StudentFeesState();
}

class _StudentFeesState extends ConsumerState<StudentFees> {
  Map<String, dynamic>? summary;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _fetchSummary();
  }

  Future<void> _fetchSummary() async {
    try {
      final response = await ApiClient.dio.get('/fees/student-summary');
      setState(() {
        summary = response.data;
        loading = false;
      });
    } catch (e) {
      print("Summary Load Error: $e");
      setState(() => loading = false);
    }
  }

  Future<void> _downloadReceipt(String paymentId) async {
    try {
      // 1. Loading Toast
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text("Generating Digital Receipt...",
                  style: TextStyle(fontStyle: FontStyle.italic)),
              backgroundColor: Color(0xFF42A5F5),
              duration: Duration(seconds: 1)),
        );
      }

      // 2. Fetch Receipt Data from API
      final response = await ApiClient.dio.get('/fees/receipt/$paymentId');
      final p = response.data;

      // 3. Create PDF Document
      final pdf = pw.Document();

      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(30),
          build: (pw.Context context) {
            return pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // --- HEADER DESIGN ---
                pw.Container(
                    width: double.infinity,
                    padding: const pw.EdgeInsets.all(20),
                    color: const PdfColor.fromInt(0xFF0F172A), // Void Dark
                    child: pw.Column(children: [
                      pw.Text(
                        (p['schoolId']?['schoolName'] ??
                                "EDUFLOWAI INSTITUTION")
                            .toString()
                            .toUpperCase(),
                        style: const pw.TextStyle(
                            color: PdfColor.fromInt(0xFF22D3EE),
                            fontSize: 24,
                            fontWeight: pw.FontWeight.bold),
                      ),
                      pw.SizedBox(height: 5),
                      pw.Text("OFFICIAL DIGITAL FEE RECEIPT",
                          style: const pw.TextStyle(
                              color: PdfColors.white, fontSize: 10)),
                      pw.Text(
                          p['schoolId']?['address'] ??
                              'Digital Campus, Cloud Network',
                          style: const pw.TextStyle(
                              color: PdfColors.white, fontSize: 10)),
                    ])),
                pw.SizedBox(height: 20),

                // --- RECEIPT METADATA ---
                pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                          "Receipt ID: #REC-${paymentId.substring(paymentId.length - 6).toUpperCase()}",
                          style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                      pw.Text(
                          "Date: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(p['date']))}",
                          style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                    ]),
                pw.SizedBox(height: 20),

                // --- DATA TABLE ---
                pw.TableHelper.fromTextArray(
                  headers: ['FIELD', 'STUDENT INFORMATION'],
                  headerStyle: pw.TextStyle(
                      color: const PdfColor.fromInt(0xFF22D3EE),
                      fontWeight: pw.FontWeight.bold),
                  headerDecoration: const pw.BoxDecoration(
                      color: PdfColor.fromInt(0xFF0F172A)),
                  cellPadding: const pw.EdgeInsets.all(10),
                  data: [
                    ['STUDENT NAME', p['student']?['name'] ?? 'N/A'],
                    ['ENROLLMENT NO', p['student']?['enrollmentNo'] ?? 'N/A'],
                    ['GRADE/CLASS', p['student']?['grade'] ?? 'N/A'],
                    ['FEE COMPONENT', p['feeCategory'] ?? 'General Fees'],
                    ['FATHER NAME', p['student']?['fatherName'] ?? 'N/A'],
                    ['PAYMENT MODE', p['paymentMode'] ?? 'N/A'],
                    ['BILLING MONTH', '${p['month']} ${p['year']}'],
                  ],
                ),

                pw.SizedBox(height: 30),
                pw.Divider(
                    color: const PdfColor.fromInt(0xFF22D3EE), thickness: 2),
                pw.SizedBox(height: 10),

                // --- FINAL TOTAL ---
                pw.Text(
                    "TOTAL PAID: INR ${NumberFormat('#,##0').format(p['amountPaid'] ?? 0)}/-",
                    style: pw.TextStyle(
                        fontSize: 16, fontWeight: pw.FontWeight.bold)),

                pw.Spacer(),

                // --- FOOTER ---
                pw.Center(
                    child: pw.Text(
                        "This is a system-generated secure document. No physical signature is required.",
                        style: const pw.TextStyle(
                            fontSize: 9, color: PdfColors.grey))),
                pw.Center(
                    child: pw.Text("© EduFlowAI Finance Neural Network",
                        style: const pw.TextStyle(
                            fontSize: 9, color: PdfColors.grey))),
              ],
            );
          },
        ),
      );

      // 4. Save and Open PDF in Phone
      final dir = await getApplicationDocumentsDirectory();
      final file = File(
          '${dir.path}/Receipt_${paymentId.substring(paymentId.length - 6).toUpperCase()}.pdf');
      await file.writeAsBytes(await pdf.save());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text("Downloaded! Opening Document..."),
              backgroundColor: Color(0xFF10B981),
              behavior: SnackBarBehavior.floating),
        );
      }

      await OpenFilex.open(file.path);
    } catch (e) {
      print("PDF Download Error: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text("Failed to generate PDF. Check Network."),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  void _showPendingModal(bool isDarkMode) {
    if (summary == null || summary!['pendingSignal'] == null) return;
    final pendingSignal = summary!['pendingSignal'];

    // 🔥 DYNAMIC COLORS FOR MODAL
    final Color modalBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    // final Color textPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textSecondary = isDarkMode ? const Color(0xFF94A3B8) : Colors.black54;
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color boxBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color iconBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9);

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'PendingVerification',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (dialogContext, animation, secondaryAnimation) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              // Blur Background
              GestureDetector(
                onTap: () => Navigator.pop(dialogContext),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(color: Colors.black.withValues(alpha: 0.6)),
                ),
              ),
              // Modal Content
              Center(
                child: Container(
                  width: MediaQuery.of(context).size.width * 0.85,
                  clipBehavior: Clip.hardEdge,
                  decoration: BoxDecoration(
                    color: modalBg, // 🔥 Dynamic
                    borderRadius: BorderRadius.circular(45),
                    boxShadow: const [
                      BoxShadow(
                          color: Colors.black26,
                          blurRadius: 40,
                          offset: Offset(0, 20))
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Close Button
                      Positioned(
                        top: 20,
                        right: 20,
                        child: GestureDetector(
                          onTap: () => Navigator.pop(dialogContext),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                                color: iconBg, // 🔥 Dynamic
                                shape: BoxShape.circle),
                            child: const Icon(Icons.close,
                                size: 18, color: Color(0xFF64748B)),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(30),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.watch_later,
                                    color: Color(0xFFD97706), size: 22),
                                SizedBox(width: 8),
                                Text("Verification pending",
                                    style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFFD97706))),
                              ],
                            ),
                            const SizedBox(height: 20),
                            // Image Preview
                            Container(
                              width: double.infinity,
                              height: 250,
                              decoration: BoxDecoration(
                                color: iconBg, // 🔥 Dynamic
                                borderRadius: BorderRadius.circular(24),
                                border:
                                    Border.all(color: borderColor), // 🔥 Dynamic
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(24),
                                child: Image.network(
                                  // NAYA CODE: Yahan apne laptop ka asli Wi-Fi IPv4 address daal!
                                  "http://192.168.31.33:5000${pendingSignal['screenshot']}", // <--- Is line ko change kar
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const Center(
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.broken_image,
                                              color: Colors.black26, size: 40),
                                          SizedBox(height: 4),
                                          Text("Image Load Failed",
                                              style: TextStyle(
                                                  fontSize: 11,
                                                  color: Colors.black26,
                                                  fontWeight: FontWeight.bold)),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                            // Details Box
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: boxBg, // 🔥 Dynamic
                                borderRadius: BorderRadius.circular(20),
                                border:
                                    Border.all(color: borderColor), // 🔥 Dynamic
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text("Amount sent:",
                                          style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                              color: textSecondary)), // 🔥 Dynamic
                                      Text(
                                          "₹${NumberFormat('#,##0').format(pendingSignal['amount'] ?? 0)}",
                                          style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF42A5F5))),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text("Status:",
                                          style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                              color: textSecondary)), // 🔥 Dynamic
                                      const Text("Awaiting approval",
                                          style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFFD97706))),
                                    ],
                                  ),
                                ],
                              ),
                            )
                          ],
                        ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .scale(duration: 300.ms, curve: Curves.easeOutBack)
                    .fadeIn(),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();

    // Fallback UI if data is null after loading
    if (summary == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("My Fees")),
        body: const Center(child: Text("No fee data available.")),
      );
    }

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS FOR DARK/LIGHT MODE 🔥
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF334155);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color iconBgLight = isDarkMode ? const Color(0xFF0F172A) : Colors.blue.withValues(alpha: 0.1);

    final double currentMonthPaid =
        (summary?['totalPaidThisMonth'] ?? 0).toDouble();
    final double finalOutstanding = (summary?['grandTotal'] ?? 0).toDouble();
    final double advanceMoney = (summary?['advanceBalance'] ?? 0).toDouble();
    final double structureTotal =
        (summary?['totalFeesStructure'] ?? 0).toDouble();

    final double monthlyOutstanding =
        (summary?['monthlyOutstanding'] ?? 0).toDouble();
    final double oneTimeOutstanding =
        (summary?['oneTimeOutstanding'] ?? 0).toDouble();

    final bool isFeesDone = finalOutstanding <= 0;

    String lastDate = "NO ACTIVITY";
    if (summary?['lastActivity'] != null) {
      lastDate = DateFormat('dd/MM/yyyy')
          .format(DateTime.parse(summary!['lastActivity']));
    }

    final DateTime today = DateTime.now();
    final DateTime nextMonth = DateTime(today.year, today.month + 1, 1);
    final String deadlineStr = DateFormat('dd/MM/yyyy').format(nextMonth);

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
          backgroundColor: Colors.transparent, // Let AnimatedContainer show through
          body: RefreshIndicator(
            color: const Color(0xFF42A5F5), 
            backgroundColor: cardColor,
            onRefresh: _fetchSummary, 
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(), 
              padding: const EdgeInsets.only(bottom: 50),
              child: Column(
                children: [
                // ==========================================================
                // HEADER SECTION
                // ==========================================================
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
                    boxShadow: const [
                      BoxShadow(
                          color: Colors.black12,
                          blurRadius: 15,
                          offset: Offset(0, 10))
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GestureDetector(
                          onTap: () {
                            if (context.canPop()) {
                              context.pop();
                            } else {
                              context.go('/');
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: const Icon(Icons.arrow_back,
                                color: Colors.white, size: 24),
                          ),
                        ),
                        Column(
                          children: [
                            const Text(
                              "My Fees",
                              style: TextStyle(
                                  fontSize: 38,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  fontStyle: FontStyle.italic,
                                  letterSpacing: -1),
                            ),
                            Text(
                              "PAYMENT DETAILS",
                              style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white.withValues(alpha: 0.8),
                                  letterSpacing: 2),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(16),
                            border:
                                Border.all(color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: const Icon(Icons.credit_card,
                              color: Colors.white, size: 24),
                        ),
                      ],
                    ),
                  ),
                ),

                // ==========================================================
                // BODY SECTION (Overlapping Header)
                // ==========================================================
                Transform.translate(
                  offset: const Offset(0, -50),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        // --- BALANCE CARDS ---
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: cardColor, // 🔥 Dynamic
                            borderRadius: BorderRadius.circular(40),
                            border: Border.all(color: borderColor), // 🔥 Dynamic
                            boxShadow: const [
                              BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 15,
                                  offset: Offset(0, 5))
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          "${summary?['currentMonth'] ?? 'Current Month'} & Backlog Dues"
                                              .toUpperCase(),
                                          style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w900,
                                              color: Color(0xFF94A3B8),
                                              fontStyle: FontStyle.italic,
                                              letterSpacing: 1.5),
                                        ),
                                        const SizedBox(height: 5),
                                        Text(
                                          "₹${NumberFormat('#,##0').format(monthlyOutstanding)}",
                                          style: TextStyle(
                                              fontSize: 36,
                                              fontWeight: FontWeight.w900,
                                              color: monthlyOutstanding > 0
                                                  ? const Color(0xFFF43F5E) // Bright Red
                                                  : const Color(0xFF10B981), // Bright Green
                                              letterSpacing: -1),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: monthlyOutstanding > 0
                                          ? (isDarkMode ? const Color(0xFF881337).withOpacity(0.3) : const Color(0xFFFFF1F2)) // Dark Red / Light Red
                                          : (isDarkMode ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5)), // Dark Green / Light Green
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Icon(Icons.calendar_month,
                                        color: monthlyOutstanding > 0
                                            ? const Color(0xFFF43F5E)
                                            : const Color(0xFF10B981),
                                        size: 28),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                monthlyOutstanding > 0
                                    ? "Includes current month + any unpaid previous months."
                                    : "Monthly fees is fully up to date.",
                                style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: textColorSecondary, // 🔥 Dynamic
                                    fontStyle: FontStyle.italic),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),

                        const SizedBox(height: 16),

                        // One Time Fees Card
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: cardColor, // 🔥 Dynamic
                            borderRadius: BorderRadius.circular(40),
                            border: Border.all(color: borderColor), // 🔥 Dynamic
                            boxShadow: const [
                              BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 15,
                                  offset: Offset(0, 5))
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          "ONE-TIME YEARLY CHARGES",
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w900,
                                              color: Color(0xFF94A3B8),
                                              fontStyle: FontStyle.italic,
                                              letterSpacing: 1.5),
                                        ),
                                        const SizedBox(height: 5),
                                        Text(
                                          "₹${NumberFormat('#,##0').format(oneTimeOutstanding)}",
                                          style: TextStyle(
                                              fontSize: 36,
                                              fontWeight: FontWeight.w900,
                                              color: oneTimeOutstanding > 0
                                                  ? const Color(0xFFF59E0B) // Bright Yellow
                                                  : const Color(0xFF10B981), // Bright Green
                                              letterSpacing: -1),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: oneTimeOutstanding > 0
                                          ? (isDarkMode ? const Color(0xFF78350F).withOpacity(0.3) : const Color(0xFFFFFBEB))
                                          : (isDarkMode ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5)),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Icon(Icons.bolt,
                                        color: oneTimeOutstanding > 0
                                            ? const Color(0xFFF59E0B)
                                            : const Color(0xFF10B981),
                                        size: 28),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                oneTimeOutstanding > 0
                                    ? "Fixed annual charges pending for this academic year."
                                    : "One-time charges cleared/Zero balance.",
                                style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: textColorSecondary, // 🔥 Dynamic
                                    fontStyle: FontStyle.italic),
                              ),
                            ],
                          ),
                        )
                            .animate()
                            .fadeIn(delay: 100.ms, duration: 400.ms)
                            .slideY(begin: 0.2),

                        const SizedBox(height: 16),

                        // Advance Credit
                        if (advanceMoney > 0)
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                                color: const Color(0xFF10B981),
                                borderRadius: BorderRadius.circular(35),
                                boxShadow: const [
                                  BoxShadow(color: Colors.black12, blurRadius: 10)
                                ]),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text("SURPLUS CREDIT",
                                        style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white70,
                                            letterSpacing: 2)),
                                    Text(
                                        "₹${NumberFormat('#,##0').format(advanceMoney)}",
                                        style: const TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            fontStyle: FontStyle.italic)),
                                  ],
                                ),
                                const Icon(Icons.check_circle,
                                    color: Colors.white54, size: 36),
                              ],
                            ),
                          ).animate().fadeIn(delay: 200.ms).slideY(),

                        const SizedBox(height: 24),

                        // --- STATS GRID ---
                        Row(
                          children: [
                            Expanded(
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 400),
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                    color: cardColor, // 🔥 Dynamic
                                    borderRadius: BorderRadius.circular(35),
                                    border: Border.all(
                                        color: borderColor)), // 🔥 Dynamic
                                child: Column(
                                  children: [
                                    const Icon(Icons.trending_up,
                                        color: Color(0xFF93C5FD), size: 24),
                                    const SizedBox(height: 10),
                                    Text(
                                        "Paid for ${summary?['currentMonth'] ?? ''}",
                                        style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF94A3B8)),
                                        textAlign: TextAlign.center),
                                    Text(
                                        "₹${NumberFormat('#,##0').format(currentMonthPaid)}",
                                        style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w900,
                                            color: textColorPrimary)), // 🔥 Dynamic
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 400),
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                    color: cardColor, // 🔥 Dynamic
                                    borderRadius: BorderRadius.circular(35),
                                    border: Border.all(
                                        color: borderColor)), // 🔥 Dynamic
                                child: Column(
                                  children: [
                                    const Icon(Icons.calendar_month,
                                        color: Color(0xFF94A3B8), size: 24),
                                    const SizedBox(height: 10),
                                    const Text("Fee Structure",
                                        style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF94A3B8)),
                                        textAlign: TextAlign.center),
                                    Text(
                                        "₹${NumberFormat('#,##0').format(structureTotal)}",
                                        style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w900,
                                            color: textColorPrimary)), // 🔥 Dynamic
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),

                        const SizedBox(height: 24),

                        // --- TIMELINE INFO ---
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                              color: isDarkMode ? const Color(0xFF1E3A8A) : const Color(0xFF42A5F5), // 🔥 Slightly darker blue in dark mode
                              borderRadius: BorderRadius.circular(35),
                              boxShadow: const [
                                BoxShadow(
                                    color: Colors.black12,
                                    blurRadius: 10,
                                    offset: Offset(0, 5))
                              ]),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text("NEXT DEADLINE",
                                        style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white60,
                                            letterSpacing: 1)),
                                    const SizedBox(height: 4),
                                    Text(
                                      "${isFeesDone ? 'NEXT CYCLE: ' : ''}$deadlineStr",
                                      style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white),
                                      maxLines: 2,
                                      overflow: TextOverflow.visible,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Container(
                                  width: 1,
                                  height: 40,
                                  color: Colors.white.withValues(alpha: 0.2)),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text("LAST ACTIVITY",
                                        style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white60,
                                            letterSpacing: 1)),
                                    const SizedBox(height: 4),
                                    Text(
                                      lastDate,
                                      style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2),

                        // --- BALANCE ADJUSTMENT & BUTTON ---
                        if (finalOutstanding > 0)
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 400),
                            margin: const EdgeInsets.only(top: 24),
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: cardColor, // 🔥 Dynamic
                              borderRadius: BorderRadius.circular(40),
                              border: Border.all(
                                  color: isDarkMode ? const Color(0xFF881337) : const Color(0xFFFFE4E6), // 🔥 Dynamic
                                  width: 2), 
                              boxShadow: const [
                                BoxShadow(
                                    color: Colors.black12,
                                    blurRadius: 15,
                                    offset: Offset(0, 5))
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text("Balance Adjustment Required",
                                    style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        color: textColorPrimary, // 🔥 Dynamic
                                        fontStyle: FontStyle.italic)),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Text("Current monthly fees: ",
                                        style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: textColorSecondary, // 🔥 Dynamic
                                            fontStyle: FontStyle.italic)),
                                    Text(
                                        "₹${NumberFormat('#,##0').format(monthlyOutstanding)}",
                                        style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w900,
                                            color: textColorPrimary)), // 🔥 Dynamic
                                  ],
                                ),
                                const SizedBox(height: 20),
                                summary?['pendingSignal'] != null
                                    ? GestureDetector(
                                        onTap: () => _showPendingModal(isDarkMode), // 🔥 Pass theme state
                                        child: Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 18),
                                          decoration: BoxDecoration(
                                              color: const Color(0xFFF59E0B),
                                              borderRadius:
                                                  BorderRadius.circular(30),
                                              boxShadow: const [
                                                BoxShadow(
                                                    color: Colors.black12,
                                                    blurRadius: 10,
                                                    offset: Offset(0, 5))
                                              ]),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              const Icon(Icons.bolt,
                                                      color: Colors.white,
                                                      size: 20)
                                                  .animate(
                                                      onPlay: (c) =>
                                                          c.repeat(reverse: true))
                                                  .fadeOut(duration: 500.ms),
                                              const SizedBox(width: 8),
                                              Text(
                                                  "Verification pending: ₹${NumberFormat('#,##0').format(summary!['pendingSignal']['amount'] ?? 0)}",
                                                  style: const TextStyle(
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.w900,
                                                      color: Colors.white)),
                                            ],
                                          ),
                                        ),
                                      )
                                    : GestureDetector(
                                        onTap: () => context.push(
                                            '/student/checkout'), // Next part ka route
                                        child: Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 18),
                                          decoration: BoxDecoration(
                                              color: const Color(0xFFE11D48),
                                              borderRadius:
                                                  BorderRadius.circular(30),
                                              boxShadow: const [
                                                BoxShadow(
                                                    color: Colors.black12,
                                                    blurRadius: 10,
                                                    offset: Offset(0, 5))
                                              ]),
                                          child: Text(
                                              "RESOLVE TOTAL BALANCE NOW: ₹${NumberFormat('#,##0').format(finalOutstanding)}",
                                              textAlign: TextAlign.center,
                                              style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w900,
                                                  color: Colors.white)),
                                        ),
                                      ),
                              ],
                            ),
                          ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.2),

                        const SizedBox(height: 32),

                        // --- SPLIT FEE STRUCTURE CARDS ---
                        Column(
                          children: [
                            // Monthly Card
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 400),
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                  color: cardColor, // 🔥 Dynamic
                                  borderRadius: BorderRadius.circular(35),
                                  border:
                                      Border.all(color: borderColor)), // 🔥 Dynamic
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                              color: iconBgLight, // 🔥 Dynamic
                                              borderRadius:
                                                  BorderRadius.circular(12)),
                                          child: const Icon(
                                              Icons.access_time_filled,
                                              color: Color(0xFF42A5F5),
                                              size: 18)),
                                      const SizedBox(width: 10),
                                      Expanded(
                                          child: Text("MONTHLY FEES",
                                              style: TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w900,
                                                  color: textColorPrimary, // 🔥 Dynamic
                                                  fontStyle: FontStyle.italic))),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  if (summary?['feeStructureDetails']
                                              ?['monthly'] !=
                                          null &&
                                      summary!['feeStructureDetails']['monthly']
                                          .isNotEmpty)
                                    ...summary!['feeStructureDetails']['monthly']
                                        .map<Widget>((item) => Padding(
                                              padding: const EdgeInsets.symmetric(
                                                  vertical: 8),
                                              child: Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment
                                                        .spaceBetween,
                                                children: [
                                                  Expanded(
                                                      child: Text(item['label'],
                                                          style: TextStyle(
                                                              fontSize: 12,
                                                              fontWeight:
                                                                  FontWeight.bold,
                                                              color: textColorSecondary))), // 🔥 Dynamic
                                                  Text(
                                                      "₹${NumberFormat('#,##0').format(item['amount'])}",
                                                      style: TextStyle(
                                                          fontSize: 13,
                                                          fontWeight:
                                                              FontWeight.w900,
                                                          color:
                                                              textColorPrimary)), // 🔥 Dynamic
                                                ],
                                              ),
                                            ))
                                        .toList()
                                  else
                                    const Text("No monthly fees",
                                        style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF94A3B8),
                                            fontStyle: FontStyle.italic)),
                                ],
                              ),
                            ),

                            const SizedBox(height: 16),
                            // One-Time Card
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 400),
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                  color: cardColor, // 🔥 Dynamic
                                  borderRadius: BorderRadius.circular(35),
                                  border:
                                      Border.all(color: borderColor)), // 🔥 Dynamic
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                              color: isDarkMode ? const Color(0xFF78350F).withOpacity(0.3) : Colors.amber.withValues(alpha: 0.1), // 🔥 Dynamic
                                              borderRadius:
                                                  BorderRadius.circular(12)),
                                          child: const Icon(Icons.bolt,
                                              color: Color(0xFFF59E0B),
                                              size: 18)),
                                      const SizedBox(width: 10),
                                      Expanded(
                                          child: Text("ONE-TIME CHARGES",
                                              style: TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w900,
                                                  color: textColorPrimary, // 🔥 Dynamic
                                                  fontStyle: FontStyle.italic))),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  if (summary?['feeStructureDetails']
                                              ?['oneTime'] !=
                                          null &&
                                      summary!['feeStructureDetails']['oneTime']
                                          .isNotEmpty)
                                    ...summary!['feeStructureDetails']['oneTime']
                                        .map<Widget>((item) => Padding(
                                              padding: const EdgeInsets.symmetric(
                                                  vertical: 8),
                                              child: Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment
                                                        .spaceBetween,
                                                children: [
                                                  Expanded(
                                                      child: Text(item['label'],
                                                          style: TextStyle(
                                                              fontSize: 12,
                                                              fontWeight:
                                                                  FontWeight.bold,
                                                              color: textColorSecondary))), // 🔥 Dynamic
                                                  Text(
                                                      "₹${NumberFormat('#,##0').format(item['amount'])}",
                                                      style: TextStyle(
                                                          fontSize: 13,
                                                          fontWeight:
                                                              FontWeight.w900,
                                                          color:
                                                              textColorPrimary)), // 🔥 Dynamic
                                                ],
                                              ),
                                            ))
                                        .toList()
                                  else
                                    const Text("No one-time charges",
                                        style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF94A3B8),
                                            fontStyle: FontStyle.italic)),
                                ],
                              ),
                            ),
                          ],
                        ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2),

                        const SizedBox(height: 32),

                        // --- PAYMENT HISTORY LEDGER ---
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: cardColor, // 🔥 Dynamic
                            borderRadius: BorderRadius.circular(45),
                            border: Border.all(color: borderColor), // 🔥 Dynamic
                            boxShadow: const [
                              BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 15,
                                  offset: Offset(0, 5))
                            ],
                          ),
                          child: Column(
                            children: [
                              // Ledger Header
                              Padding(
                                padding:
                                    const EdgeInsets.only(top: 24, bottom: 16),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 24, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: cardColor, // 🔥 Dynamic
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                        color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0)), // 🔥 Dynamic
                                    boxShadow: const [
                                      BoxShadow(
                                          color: Colors.black12, blurRadius: 5)
                                    ],
                                  ),
                                  child: const Text("ALL TRANSACTIONS",
                                      style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF94A3B8),
                                          letterSpacing: 2)),
                                ),
                              ),

                              Padding(
                                padding: const EdgeInsets.all(24),
                                child:
                                    summary?['paymentHistory'] != null &&
                                            (summary!['paymentHistory'] as Map)
                                                .isNotEmpty
                                        ? Column(
                                            children: (summary!['paymentHistory']
                                                    as Map<String, dynamic>)
                                                .entries
                                                .map((entry) {
                                              final monthYear = entry.key;
                                              final records =
                                                  entry.value as List<dynamic>;

                                              return Padding(
                                                padding: const EdgeInsets.only(
                                                    bottom: 24),
                                                child: Column(
                                                  children: [
                                                    // Month Divider
                                                    Row(
                                                      children: [
                                                        Text(
                                                            monthYear
                                                                .toUpperCase(),
                                                            style:
                                                                const TextStyle(
                                                                    fontSize: 12,
                                                                    fontWeight:
                                                                        FontWeight
                                                                            .w900,
                                                                    color: Color(
                                                                        0xFF42A5F5),
                                                                    letterSpacing:
                                                                        1.5)),
                                                        const SizedBox(width: 15),
                                                        Expanded(
                                                            child: Container(
                                                                height: 1,
                                                                color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9))), // 🔥 Dynamic
                                                      ],
                                                    ),
                                                    const SizedBox(height: 16),
                                                    // Records
                                                    ...records
                                                        .map((pay) => AnimatedContainer(
                                                              duration: const Duration(milliseconds: 400),
                                                              margin:
                                                                  const EdgeInsets
                                                                      .only(
                                                                      bottom: 12),
                                                              padding:
                                                                  const EdgeInsets
                                                                      .all(20),
                                                              decoration:
                                                                  BoxDecoration(
                                                                color:
                                                                    cardColor, // 🔥 Dynamic
                                                                borderRadius:
                                                                    BorderRadius
                                                                        .circular(
                                                                            35),
                                                                border: Border.all(
                                                                    color: borderColor), // 🔥 Dynamic
                                                              ),
                                                              child: Row(
                                                                mainAxisAlignment:
                                                                    MainAxisAlignment
                                                                        .spaceBetween,
                                                                children: [
                                                                  Expanded(
                                                                    child: Row(
                                                                      children: [
                                                                        Container(
                                                                          padding: const EdgeInsets
                                                                              .all(
                                                                              12),
                                                                          decoration: BoxDecoration(
                                                                              color:
                                                                                  iconBgLight, // 🔥 Dynamic
                                                                              borderRadius: BorderRadius.circular(16)),
                                                                          child: const Icon(
                                                                              Icons
                                                                                  .trending_up,
                                                                              color:
                                                                                  Color(0xFF42A5F5),
                                                                              size: 20),
                                                                        ),
                                                                        const SizedBox(
                                                                            width:
                                                                                15),
                                                                        Expanded(
                                                                          child:
                                                                              Column(
                                                                            crossAxisAlignment:
                                                                                CrossAxisAlignment.start,
                                                                            children: [
                                                                              Text(
                                                                                pay['category']?.toString().toUpperCase() ?? "GENERAL FEE",
                                                                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary), // 🔥 Dynamic
                                                                                maxLines: 1,
                                                                                overflow: TextOverflow.ellipsis,
                                                                              ),
                                                                              const SizedBox(height: 4),
                                                                              Text(
                                                                                "${DateFormat('dd MMM').format(DateTime.parse(pay['date']))} • ${pay['mode']?.toString().toLowerCase()} mode",
                                                                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColorSecondary), // 🔥 Dynamic
                                                                                maxLines: 1,
                                                                                overflow: TextOverflow.ellipsis,
                                                                              ),
                                                                            ],
                                                                          ),
                                                                        ),
                                                                      ],
                                                                    ),
                                                                  ),
                                                                  const SizedBox(
                                                                      width:
                                                                          10),

                                                                  // Right Side (Amount & Download Button)
                                                                  Column(
                                                                    crossAxisAlignment:
                                                                        CrossAxisAlignment
                                                                            .end,
                                                                    children: [
                                                                      Text(
                                                                          "₹${NumberFormat('#,##0').format(pay['amount'])}",
                                                                          style: const TextStyle(
                                                                              fontSize:
                                                                                  16,
                                                                              fontWeight:
                                                                                  FontWeight.w900,
                                                                              color: Color(0xFF10B981),
                                                                              fontStyle: FontStyle.italic)),
                                                                      const SizedBox(
                                                                          height:
                                                                              6),
                                                                      GestureDetector(
                                                                        onTap: () =>
                                                                            _downloadReceipt(pay['id'] ??
                                                                                pay['_id']),
                                                                        child:
                                                                            const Row(
                                                                          children: [
                                                                            Icon(
                                                                                Icons.download_rounded,
                                                                                size: 14,
                                                                                color: Color(0xFF42A5F5)),
                                                                            SizedBox(
                                                                                width: 4),
                                                                            Text(
                                                                                "GET SLIP",
                                                                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1)),
                                                                          ],
                                                                        ),
                                                                      )
                                                                    ],
                                                                  )
                                                                ],
                                                              ),
                                                            ))
                                                  ],
                                                ),
                                              );
                                            }).toList(),
                                          )
                                        : const Padding(
                                            padding: EdgeInsets.symmetric(
                                                vertical: 40),
                                            child: Column(
                                              children: [
                                                Icon(Icons.schedule,
                                                    size: 48,
                                                    color: Color(0xFFE2E8F0)),
                                                SizedBox(height: 15),
                                                Text(
                                                    "No payment records found in ledger",
                                                    style: TextStyle(
                                                        fontSize: 14,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        color: Color(0xFF94A3B8),
                                                        fontStyle:
                                                            FontStyle.italic)),
                                              ],
                                            ),
                                          ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 700.ms).slideY(begin: 0.1),

                        const SizedBox(height: 24),

                        // --- SECURITY FOOTER ---
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(35),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                                colors: isDarkMode 
                                    ? [const Color(0xFF1E3A8A), const Color(0xFF1E40AF)] // 🔥 Darker footer gradient
                                    : [const Color(0xFF42A5F5), const Color(0xFF2563EB)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight),
                            borderRadius: BorderRadius.circular(45),
                            boxShadow: const [
                              BoxShadow(
                                  color: Colors.black26,
                                  blurRadius: 15,
                                  offset: Offset(0, 5))
                            ],
                          ),
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Positioned(
                                top: -20,
                                right: -20,
                                child: Transform.rotate(
                                  angle: 0.2, // 12 degrees
                                  child: const Icon(Icons.credit_card,
                                      size: 120, color: Colors.white10),
                                ),
                              ),
                              const Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text("SECURITY ASSURED",
                                      style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                          letterSpacing: 4)),
                                  SizedBox(height: 5),
                                  Text("End-to-end encrypted billing",
                                      style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                          fontStyle: FontStyle.italic)),
                                ],
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 800.ms).slideY(begin: 0.1),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ));
  }
}
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:pdf/pdf.dart' as pw_core;
import 'package:pdf/widgets.dart' as pw;

import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart';

class StudentTransportFees extends ConsumerStatefulWidget {
  const StudentTransportFees({super.key});

  @override
  ConsumerState<StudentTransportFees> createState() => _StudentTransportFeesState();
}

class _StudentTransportFeesState extends ConsumerState<StudentTransportFees> {
  Map<String, dynamic>? summary;
  bool loading = true;

  String? activeSession;
  List<String> availableSessions = [];
  bool _isDropdownOpen = false;

  @override
  void initState() {
    super.initState();
    _fetchSummary();
  }

  Future<void> _fetchSummary({String? session}) async {
    if (mounted) setState(() => loading = true);
    try {
      if (activeSession == null) {
        final sessionRes = await ApiClient.dio.get('/users/general/session-info');
        activeSession = sessionRes.data['activeSession'];
        availableSessions = List<String>.from(sessionRes.data['allAvailableSessions'] ?? []);
      }

      final query = session ?? activeSession;
      final response = await ApiClient.dio.get('/fees/transport-summary?session=$query');

      if (mounted) {
        setState(() {
          summary = response.data;
          loading = false;
        });
      }
    } catch (e) {
      debugPrint("Transport Summary Load Error: $e");
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _downloadReceipt(String paymentId) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Generating Transport Receipt...", style: TextStyle(fontStyle: FontStyle.italic)),
          backgroundColor: Color(0xFF42A5F5),
          duration: Duration(seconds: 1),
        ),
      );

      final response = await ApiClient.dio.get('/fees/receipt/$paymentId');
      final p = response.data;

      final pdf = pw.Document();
      final baseColor = pw_core.PdfColor.fromInt(0xFF42A5F5);

      pdf.addPage(
        pw.Page(
          pageFormat: pw_core.PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(30),
          build: (pw.Context context) {
            return pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.all(20),
                  color: const pw_core.PdfColor.fromInt(0xFF0F172A),
                  child: pw.Column(
                    children: [
                      pw.Text(
                        (p['schoolId']?['schoolName'] ?? "EDUFLOWAI INSTITUTION").toString().toUpperCase(),
                        style: pw.TextStyle(color: baseColor, fontSize: 18, fontWeight: pw.FontWeight.bold), // Adjusted for PDF
                      ),
                      pw.SizedBox(height: 5),
                      pw.Text("OFFICIAL TRANSPORT FEE RECEIPT", style: const pw.TextStyle(color: pw_core.PdfColors.white, fontSize: 9)),
                      pw.Text(p['schoolId']?['address'] ?? 'Digital Campus', style: const pw.TextStyle(color: pw_core.PdfColors.white, fontSize: 9)),
                    ],
                  ),
                ),
                pw.SizedBox(height: 20),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text("Receipt ID: #REC-${p['_id']?.toString().substring(p['_id'].toString().length - 6).toUpperCase()}", style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                    pw.Text("Date: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(p['date'] ?? DateTime.now().toIso8601String()))}", style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                  ],
                ),
                pw.SizedBox(height: 20),
                pw.TableHelper.fromTextArray(
                  headers: ['FIELD', 'STUDENT INFORMATION'],
                  headerStyle: pw.TextStyle(color: baseColor, fontWeight: pw.FontWeight.bold, fontSize: 9),
                  headerDecoration: const pw.BoxDecoration(color: pw_core.PdfColor.fromInt(0xFF0F172A)),
                  cellPadding: const pw.EdgeInsets.all(8),
                  cellStyle: const pw.TextStyle(fontSize: 9),
                  data: [
                    ['STUDENT NAME', p['student']?['name'] ?? 'N/A'],
                    ['ENROLLMENT NO', p['student']?['enrollmentNo'] ?? 'N/A'],
                    ['GRADE/CLASS', p['student']?['grade'] ?? 'N/A'],
                    ['FEE COMPONENT', p['displayPurpose'] ?? p['feeCategory'] ?? 'Transport Fees'],
                    ['TRANSPORT ROUTE', p['remarks'] ?? 'N/A'],
                    ['PAYMENT MODE', p['paymentMode'] ?? 'N/A'],
                    ['BILLING MONTH', '${p['month'] ?? ''} ${p['year'] ?? ''}'],
                  ],
                ),
                pw.SizedBox(height: 30),
                pw.Divider(color: baseColor, thickness: 2),
                pw.SizedBox(height: 10),
                pw.Text("TOTAL PAID: INR ${NumberFormat('#,##0').format(p['amountPaid'] ?? 0)}/-", style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                pw.Spacer(),
                pw.Center(child: pw.Text("This is a system-generated secure document. No physical signature is required.", style: const pw.TextStyle(fontSize: 8, color: pw_core.PdfColors.grey))),
                pw.Center(child: pw.Text("© EduFlowAI Transport Network", style: const pw.TextStyle(fontSize: 8, color: pw_core.PdfColors.grey))),
              ],
            );
          },
        ),
      );

      final dir = await getApplicationDocumentsDirectory();
      final fileId = p['_id']?.toString() ?? "123456";
      final safeId = fileId.length >= 6 ? fileId.substring(fileId.length - 6).toUpperCase() : fileId.toUpperCase();
      final file = File('${dir.path}/Transport_Receipt_$safeId.pdf');
      await file.writeAsBytes(await pdf.save());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Downloaded! Opening Document..."),
            backgroundColor: Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
          ),
        );
        await OpenFilex.open(file.path);
      }
    } catch (e) {
      debugPrint("PDF Download Error: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Failed to generate PDF. Check Network."),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Widget _buildSessionDropdown(bool isDarkMode) {
    if (availableSessions.isEmpty || activeSession == null) return const SizedBox.shrink();

    return PopupMenuButton<String>(
      initialValue: activeSession,
      color: isDarkMode ? const Color(0xFF1E3A8A) : const Color(0xFF42A5F5),
      surfaceTintColor: Colors.transparent,
      elevation: 8,
      onOpened: () => setState(() => _isDropdownOpen = true),
      onCanceled: () => setState(() => _isDropdownOpen = false),
      onSelected: (String newValue) {
        setState(() {
          activeSession = newValue;
          _isDropdownOpen = false;
        });
        _fetchSummary(session: newValue);
      },
      itemBuilder: (BuildContext context) {
        return availableSessions.map((String session) {
          return PopupMenuItem<String>(
            value: session,
            child: Row(
              children: [
                Text(
                  session,
                  style: TextStyle(
                    fontSize: 12, // Font optimized
                    fontWeight: activeSession == session ? FontWeight.w900 : FontWeight.w700,
                    fontStyle: FontStyle.italic,
                    color: Colors.white,
                  ),
                ),
                if (activeSession == session) ...[
                  const Spacer(),
                  const Icon(Icons.check, color: Colors.white, size: 16),
                ]
              ],
            ),
          );
        }).toList();
      },
      offset: const Offset(0, 45),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(51),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withAlpha(76)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.history, color: Colors.white, size: 14),
            const SizedBox(width: 6),
            Text(activeSession!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.2)),
            const SizedBox(width: 4),
            AnimatedRotation(
              turns: _isDropdownOpen ? 0.5 : 0.0,
              duration: const Duration(milliseconds: 300),
              child: const Icon(Icons.arrow_drop_down, color: Colors.white, size: 18),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();
    if (summary == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Transport Fees", style: TextStyle(fontSize: 16))),
        body: const Center(child: Text("No transport fee data available.", style: TextStyle(fontSize: 14))),
      );
    }

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF334155);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color iconBgLight = isDarkMode ? const Color(0xFF0F172A) : Colors.blue.withAlpha(25);

    final double finalOutstanding = (summary?['grandTotal'] ?? 0).toDouble();
    final double advanceMoney = (summary?['advanceBalance'] ?? 0).toDouble();
    
    final Map<String, dynamic> historyMap = summary?['paymentHistory'] != null ? Map<String, dynamic>.from(summary!['paymentHistory']) : {};

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
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: cardColor,
          onRefresh: () => _fetchSummary(session: activeSession),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    // --- HEADER ---
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.only(top: 50, bottom: 65, left: 20, right: 20), // Padding reduced
                      decoration: BoxDecoration(
                        color: const Color(0xFF42A5F5),
                        gradient: LinearGradient(
                          colors: isDarkMode
                              ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)]
                              : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(45)), // Radius reduced
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 8))],
                      ),
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
                              padding: const EdgeInsets.all(10), // Padding reduced
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(51),
                                borderRadius: BorderRadius.circular(14), // Radius reduced
                                border: Border.all(color: Colors.white.withAlpha(25)),
                              ),
                              child: const Icon(Icons.arrow_back, color: Colors.white, size: 20), // Icon reduced
                            ),
                          ),
                          Column(
                            children: [
                              const Text("Transport Fees",
                                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)), // Font optimized
                              const SizedBox(height: 6),
                              _buildSessionDropdown(isDarkMode),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(51),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Colors.white.withAlpha(25)),
                            ),
                            child: const Icon(Icons.directions_bus, color: Colors.white, size: 20),
                          ),
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- BODY ---
                    Transform.translate(
                      offset: const Offset(0, -30), // Offset reduced
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16), // Padding reduced
                        child: Column(
                          children: [
                            // --- ROUTE & STOP DETAILS BOX ---
                            Container(
                              padding: const EdgeInsets.all(18), // Padding reduced
                              decoration: BoxDecoration(
                                color: cardColor,
                                borderRadius: BorderRadius.circular(25), // Radius reduced
                                border: Border.all(color: borderColor),
                                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: iconBgLight,
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          child: const Icon(Icons.location_on, color: Color(0xFF42A5F5), size: 22), // Size reduced
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text("Pick/Drop Location", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.2, fontStyle: FontStyle.italic)), // Font optimized
                                              const SizedBox(height: 3),
                                              Text(summary?['stopName']?.toString().toUpperCase() ?? "NOT ASSIGNED", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, height: 1.1)), // Font optimized
                                              const SizedBox(height: 3),
                                              Text(summary?['routeName'] ?? "N/A", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColorSecondary)), // Font optimized
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text("MONTHLY", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.2)), // Font optimized
                                      Text("₹${summary?['monthlyRate'] ?? 0}", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5))), // Font optimized
                                    ],
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),

                            const SizedBox(height: 14),

                            // --- BALANCE BOX ---
                            Container(
                              padding: const EdgeInsets.all(18), // Padding reduced
                              decoration: BoxDecoration(
                                color: cardColor,
                                borderRadius: BorderRadius.circular(25),
                                border: Border.all(color: borderColor),
                                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text("TOTAL PENDING DUES", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.2, fontStyle: FontStyle.italic)), // Font optimized
                                            const SizedBox(height: 4),
                                            Text("₹${NumberFormat('#,##0').format(finalOutstanding)}",
                                                style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: finalOutstanding > 0 ? const Color(0xFFF43F5E) : const Color(0xFF10B981), letterSpacing: -1)), // Font optimized
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: finalOutstanding > 0 ? (isDarkMode ? const Color(0xFF881337).withAlpha(76) : const Color(0xFFFFF1F2)) : (isDarkMode ? const Color(0xFF064E3B).withAlpha(76) : const Color(0xFFECFDF5)),
                                          borderRadius: BorderRadius.circular(14),
                                        ),
                                        child: Icon(Icons.calendar_month, color: finalOutstanding > 0 ? const Color(0xFFF43F5E) : const Color(0xFF10B981), size: 22), // Icon optimized
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    finalOutstanding > 0 ? "Includes 15th-day rule auto calculation." : "Transport account is fully settled.",
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic), // Font optimized
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(delay: 100.ms, duration: 400.ms).slideY(begin: 0.2),

                            const SizedBox(height: 14),

                            // --- ADVANCE BALANCE BOX ---
                            if (advanceMoney > 0)
                              Container(
                                padding: const EdgeInsets.all(18),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981),
                                  borderRadius: BorderRadius.circular(25),
                                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8)],
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text("SURPLUS ADVANCE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white70, letterSpacing: 1.5)), // Font optimized
                                        Text("₹${NumberFormat('#,##0').format(advanceMoney)}", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic)), // Font optimized
                                      ],
                                    ),
                                    const Icon(Icons.check_circle, color: Colors.white54, size: 28), // Icon optimized
                                  ],
                                ),
                              ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),

                            // --- PAY NOW ACTION ---
                            if (finalOutstanding > 0) ...[
                              const SizedBox(height: 18),
                              summary?['pendingSignal'] != null
                                  ? Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF42A5F5),
                                        borderRadius: BorderRadius.circular(25),
                                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))],
                                      ),
                                      child: const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.bolt, color: Colors.white, size: 16),
                                          SizedBox(width: 6),
                                          Text("Payment in Verification", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white)), // Font optimized
                                        ],
                                      ),
                                    )
                                  : GestureDetector(
                                      onTap: () {
                                        context.push('/student/checkout', extra: {'feeType': 'Transport'});
                                      },
                                      child: Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFE11D48),
                                          borderRadius: BorderRadius.circular(25),
                                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))],
                                        ),
                                        child: Text(
                                          "PAY TRANSPORT FEES: ₹${NumberFormat('#,##0').format(finalOutstanding)}",
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.8), // Font optimized
                                        ),
                                      ),
                                    ),
                            ],

                            const SizedBox(height: 24),

                            // --- TRANSPORT RECEIPTS LEDGER ---
                            Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: cardColor,
                                borderRadius: BorderRadius.circular(35),
                                border: Border.all(color: borderColor),
                                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
                              ),
                              child: Column(
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(top: 20, bottom: 12),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                      decoration: BoxDecoration(
                                        color: cardColor,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 3)],
                                      ),
                                      child: const Text("TRANSPORT RECEIPTS", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5)), // Font optimized
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(18),
                                    child: historyMap.isNotEmpty
                                        ? Column(
                                            children: historyMap.entries.map((entry) {
                                              final monthYear = entry.key;
                                              final records = entry.value as List<dynamic>;
                                              return Padding(
                                                padding: const EdgeInsets.only(bottom: 20),
                                                child: Column(
                                                  children: [
                                                    Row(
                                                      children: [
                                                        Text(monthYear.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.2)), // Font optimized
                                                        const SizedBox(width: 12),
                                                        Expanded(child: Container(height: 1, color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9))),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 12),
                                                    ...records.map((pay) => Container(
                                                      margin: const EdgeInsets.only(bottom: 10),
                                                      padding: const EdgeInsets.all(16), // Padding reduced
                                                      decoration: BoxDecoration(
                                                        color: cardColor,
                                                        borderRadius: BorderRadius.circular(25),
                                                        border: Border.all(color: borderColor),
                                                      ),
                                                      child: Row(
                                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                        children: [
                                                          Expanded(
                                                            child: Row(
                                                              children: [
                                                                Container(
                                                                  padding: const EdgeInsets.all(10),
                                                                  decoration: BoxDecoration(
                                                                    color: iconBgLight,
                                                                    borderRadius: BorderRadius.circular(14),
                                                                  ),
                                                                  child: const Icon(Icons.directions_bus, color: Color(0xFF42A5F5), size: 16), // Icon reduced
                                                                ),
                                                                const SizedBox(width: 12),
                                                                Expanded(
                                                                  child: Column(
                                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                                    children: [
                                                                      Text(
                                                                        pay['category']?.toString().toUpperCase() ?? "TRANSPORT FEE",
                                                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary), // Font optimized
                                                                        maxLines: 1,
                                                                        overflow: TextOverflow.ellipsis,
                                                                      ),
                                                                      const SizedBox(height: 2),
                                                                      Text(
                                                                        "${DateFormat('dd MMM yyyy').format(DateTime.parse(pay['date']))} • ${pay['mode']?.toString().toLowerCase()}",
                                                                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textColorSecondary), // Font optimized
                                                                        maxLines: 1,
                                                                        overflow: TextOverflow.ellipsis,
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ],
                                                            ),
                                                          ),
                                                          Column(
                                                            crossAxisAlignment: CrossAxisAlignment.end,
                                                            children: [
                                                              Text("₹${NumberFormat('#,##0').format(pay['amount'])}", style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF10B981), fontStyle: FontStyle.italic)), // Font optimized
                                                              const SizedBox(height: 4),
                                                              GestureDetector(
                                                                onTap: () => _downloadReceipt(pay['id'] ?? pay['_id']),
                                                                child: const Row(
                                                                  children: [
                                                                    Icon(Icons.download_rounded, size: 12, color: Color(0xFF42A5F5)), // Icon reduced
                                                                    SizedBox(width: 2),
                                                                    Text("GET SLIP", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 0.8)), // Font optimized
                                                                  ],
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ],
                                                      ),
                                                    ))
                                                  ],
                                                ),
                                              );
                                            }).toList(),
                                          )
                                        : const Padding(
                                            padding: EdgeInsets.symmetric(vertical: 30),
                                            child: Column(
                                              children: [
                                                Icon(Icons.directions_bus, size: 36, color: Color(0xFFE2E8F0)), // Icon reduced
                                                SizedBox(height: 10),
                                                Text("No transport payments found", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), fontStyle: FontStyle.italic)), // Font optimized
                                              ],
                                            ),
                                          ),
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1),

                            const SizedBox(height: 40),
                          ],
                        ),
                      ),
                    ),
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
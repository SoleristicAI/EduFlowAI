import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:open_filex/open_filex.dart'; // 🔥 AUTO OPEN FEATURE
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/constants/app_config.dart';

class StudentExamResult extends ConsumerStatefulWidget {
  const StudentExamResult({super.key});

  @override
  ConsumerState<StudentExamResult> createState() => _StudentExamResultState();
}

class _StudentExamResultState extends ConsumerState<StudentExamResult> {
  bool isInitialLoading = true;
  bool isDownloading = false;

  String viewMode = 'select'; // 'select' or 'reportCard'
  List<dynamic> publishedResults = [];
  Map<String, dynamic>? selectedResult;
  Map<String, dynamic>? studentProfile;
  String schoolName = "EduFlowAI Public School";
  String? schoolLogo;
  
  // 🔥 NAYE SESSION STATES 🔥
  String? activeSession;
  List<String> availableSessions = [];

  @override
  void initState() {
    super.initState();
    _initSessionData(); // Naya function call kiya hai
  }

  Future<void> _initSessionData() async {
    try {
      final sessionRes = await ApiClient.dio.get('/users/general/session-info');
      if (mounted) {
        setState(() {
          activeSession = sessionRes.data['activeSession'];
          availableSessions = List<String>.from(sessionRes.data['allAvailableSessions'] ?? []);
        });
        _loadData(sessionParam: activeSession);
      }
    } catch (e) {
      _showToast("Session Error.", isError: true);
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _loadData({String? sessionParam, bool isRefresh = false}) async {
    if (sessionParam == null) return;
    if (!isRefresh && mounted) setState(() => isInitialLoading = true);
    if (!isRefresh) await Future.delayed(const Duration(milliseconds: 1000));

    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      
      if (userStr == null) {
        if (mounted) setState(() => isInitialLoading = false);
        return;
      }

      final user = jsonDecode(userStr);
      studentProfile = user;

      if (user['schoolId'] != null && user['schoolId'] is Map) {
        if (user['schoolId']['name'] != null) schoolName = user['schoolId']['name'];
        if (user['schoolId']['logo'] != null) schoolLogo = user['schoolId']['logo'];
      }

      // 🔥 SMART CACHE SYSTEM WITH SESSION 🔥
      final cacheKey = 'studentExamResults_${user['_id']}_$sessionParam';
      final cachedResultsStr = prefs.getString(cacheKey);

      if (cachedResultsStr != null && !isRefresh) {
        publishedResults = jsonDecode(cachedResultsStr);
        if (mounted) setState(() => isInitialLoading = false);
      }

      // Background Fetch with Session Param
      final response = await ApiClient.dio.get('/exam-results/my-results?session=$sessionParam');
      final newData = response.data as List<dynamic>;
      final newString = jsonEncode(newData);

      if (cachedResultsStr != newString) {
        await prefs.setString(cacheKey, newString);
        if (mounted) {
          setState(() {
            publishedResults = newData;
            if (selectedResult != null) {
              final found = publishedResults.firstWhere((r) => r['_id'] == selectedResult!['_id'], orElse: () => null);
              if (found != null) selectedResult = found;
            }
          });
        }
      }

      try {
        final logoRes = await ApiClient.dio.get('/school/logo');
        if (logoRes.data != null && logoRes.data['logo'] != null) {
          if (mounted) setState(() => schoolLogo = logoRes.data['logo']);
        }
      } catch (e) { debugPrint("Logo fetch skipped"); }

    } catch (e) {
      _showToast("Failed to load results", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _loadData(sessionParam: activeSession, isRefresh: true);
  }

  void _handleResultSelect(Map<String, dynamic> result) {
    setState(() {
      selectedResult = result;
      if (result['schoolName'] != null) schoolName = result['schoolName'];
      if (result['schoolLogo'] != null) schoolLogo = result['schoolLogo'];
    });
    Navigator.pop(context); // Close BottomSheet
  }

  void _showExamSelector(Color bottomSheetBg, Color textColorPrimary) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: bottomSheetBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40, height: 5,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
              ),
              const SizedBox(height: 20),
              publishedResults.isEmpty 
                ? Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text("NO EXAMS AVAILABLE", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey.shade400, fontStyle: FontStyle.italic)),
                  )
                : Expanded(
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: publishedResults.length,
                      itemBuilder: (context, index) {
                        final res = publishedResults[index];
                        final isSelected = selectedResult?['_id'] == res['_id'];
                        return GestureDetector(
                          onTap: () => _handleResultSelect(res),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF42A5F5) : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              (res['examTitle'] ?? '').toString().toUpperCase(),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                                fontStyle: FontStyle.italic,
                                color: isSelected ? Colors.white : textColorPrimary,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
            ],
          ),
        );
      }
    );
  }

  // 🔥 NATIVE PDF GENERATION ENGINE WITH AUTO-OPEN 🔥
  Future<void> _generatePDF() async {
    if (selectedResult == null) return;

    setState(() => isDownloading = true);
    _showToast("Generating PDF...");

    try {
      final pdf = pw.Document();

      // Fetch School Logo Image (Sanitize URL via AppConfig)
      pw.MemoryImage? logoImage;
      if (schoolLogo != null && schoolLogo!.isNotEmpty) {
        try {
          // 🔥 UNIVERSAL URL RESOLVER 🔥
          String fullUrl = AppConfig.getAbsoluteUrl(schoolLogo!);
          
          final response = await ApiClient.dio.get(
            fullUrl, 
            options: Options(responseType: ResponseType.bytes)
          );
          logoImage = pw.MemoryImage(response.data);
        } catch (e) {
          debugPrint("Logo fetch failed for PDF: $e");
        }
      }
      // Prepare Data
      final String examTitle = (selectedResult!['examTitle'] ?? '').toString().toUpperCase();
      final String stuName = (studentProfile?['name'] ?? 'N/A').toString();
      final String enroll = (studentProfile?['enrollmentNo'] ?? 'N/A').toString();
      final String father = (studentProfile?['fatherName'] ?? 'N/A').toString();
      final String mother = (studentProfile?['motherName'] ?? 'N/A').toString();
      final String grade = (studentProfile?['grade'] ?? 'N/A').toString();
      final String rank = (selectedResult!['rank'] ?? '-').toString();
      
      final String totalObtained = (selectedResult!['totalObtained'] ?? '0').toString();
      final String grandTotal = (selectedResult!['grandTotal'] ?? '0').toString();
      final String percentage = (selectedResult!['percentage'] ?? '0').toString();

      final List<dynamic> marksList = selectedResult!['myMarks'] ?? [];

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(40),
          build: (pw.Context context) {
            return [
              // --- SCHOOL HEADER ---
              pw.Container(
                padding: const pw.EdgeInsets.only(bottom: 20),
                decoration: const pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: PdfColors.blue400, width: 3))),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.center,
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    if (logoImage != null) 
                      pw.Container(
                        width: 60, height: 60,
                        margin: const pw.EdgeInsets.only(right: 20),
                        child: pw.Image(logoImage),
                      ),
                    pw.Text(schoolName.toUpperCase(), style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
                  ]
                )
              ),
              pw.SizedBox(height: 20),

              // --- EXAM TITLE ---
              pw.Center(
                child: pw.Text("$examTitle RESULT CARD", style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, color: PdfColors.blue500))
              ),
              pw.SizedBox(height: 30),

              // --- STUDENT DETAILS ---
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text("Name: $stuName", style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                  pw.Text("Enrollment: $enroll", style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                ]
              ),
              pw.SizedBox(height: 10),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text("Father: $father", style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                  pw.Text("Mother: $mother", style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                ]
              ),
              pw.SizedBox(height: 10),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text("Class: $grade", style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                  pw.Text("Rank: #$rank", style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                ]
              ),
              pw.SizedBox(height: 30),

              // --- MARKS TABLE ---
              pw.Table.fromTextArray(
                headers: ['SUBJECT', 'STATUS', 'MARKS'],
                headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.white),
                headerDecoration: const pw.BoxDecoration(color: PdfColors.blue400),
                cellAlignment: pw.Alignment.center,
                data: marksList.map((m) {
                  final String subName = (m['subjectName'] ?? '').toString().toUpperCase();
                  final String status = (m['status'] ?? 'N/A').toString();
                  final String marks = status == "Absent" ? "0" : (m['marksObtained'] ?? '0').toString();
                  final String maxMarks = (selectedResult!['maxMarks'] ?? '0').toString();
                  
                  return [subName, status, "$marks/$maxMarks"];
                }).toList(),
              ),
              pw.SizedBox(height: 30),

              // --- SUMMARY BOX ---
              pw.Container(
                padding: const pw.EdgeInsets.all(15),
                decoration: pw.BoxDecoration(
                  color: PdfColors.grey100,
                  border: pw.Border.all(color: PdfColors.grey400)
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text("Total Marks: $totalObtained/$grandTotal", style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                    pw.Text("Percentage: $percentage%", style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                    pw.Text("Rank: #$rank", style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                  ]
                )
              )
            ];
          },
        )
      );

      // Save and Trigger OpenWith
      final Directory dir = await getApplicationDocumentsDirectory();
      final String filePath = "${dir.path}/${stuName}_${examTitle}_Result.pdf".replaceAll(' ', '_');
      
      final file = File(filePath);
      await file.writeAsBytes(await pdf.save());
      
      _showToast("PDF Ready! Opening... ✅");
      await OpenFilex.open(filePath); // 🔥 DIRECT OPEN-WITH POPUP

    } catch (err) {
      _showToast("PDF Generation Failed", isError: true);
    } finally {
      if (mounted) setState(() => isDownloading = false);
    }
  }

  void _handleBack() {
    if (viewMode == 'reportCard') {
      setState(() => viewMode = 'select');
    } else {
      if (context.canPop()) context.pop();
      else context.go('/');
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isError ? Icons.error : Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 13))),
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
    if (isInitialLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color boxBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack();
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
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                GestureDetector(
                                  onTap: _handleBack,
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
                               Column(
                                  children: [
                                    const Text("Exam Results",
                                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                    const SizedBox(height: 4),
                                    
                                    // 🔥 SESSION POPUP MENU DROP DOWN 🔥
                                    PopupMenuButton<String>(
                                      initialValue: activeSession,
                                      position: PopupMenuPosition.under,
                                      offset: const Offset(0, 8),
                                      color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.white,
                                      elevation: 12,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                      onSelected: (String newValue) {
                                        setState(() { 
                                          activeSession = newValue; 
                                          isInitialLoading = true;
                                          selectedResult = null; // Reset
                                          viewMode = 'select'; // Go back to select screen
                                        });
                                        _loadData(sessionParam: newValue);
                                      },
                                      itemBuilder: (BuildContext context) {
                                        return availableSessions.map((String session) {
                                          return PopupMenuItem<String>(
                                            value: session,
                                            child: Text(
                                              session, 
                                              style: TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: activeSession == session ? const Color(0xFF42A5F5) : (isDarkMode ? Colors.white : Colors.black87))
                                            ),
                                          );
                                        }).toList();
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2), 
                                          borderRadius: BorderRadius.circular(20), 
                                          border: Border.all(color: Colors.white.withOpacity(0.3))
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.history, color: Colors.white, size: 14),
                                            const SizedBox(width: 6),
                                            Text(activeSession ?? 'Loading...', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
                                            const SizedBox(width: 4),
                                            const Icon(Icons.arrow_drop_down, color: Colors.white, size: 18),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: const Icon(Icons.bar_chart, color: Colors.white, size: 24),
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
                          child: viewMode == 'select' 
                              ? _buildSelectView(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary, boxBg)
                              : _buildReportCardView(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary, boxBg),
                        ),
                      ),
                      const SizedBox(height: 50),
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

  // --- VIEW 1: SELECT EXAM ---
  Widget _buildSelectView(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary, Color boxBg) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(45),
        border: Border.all(color: cardBorder),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Enrolled Identity
          Text("ENROLLED IDENTITY", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.2) : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE))
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.layers, color: Color(0xFF42A5F5), size: 18),
                    const SizedBox(width: 12),
                    Text("CLASS: ${studentProfile?['grade'] ?? 'N/A'}", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF38BDF8) : const Color(0xFF1E3A8A), fontStyle: FontStyle.italic)),
                  ],
                ),
                const Text("VERIFIED", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2, fontStyle: FontStyle.italic))
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Dropdown
          Text("CHOOSE EXAMINATION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => _showExamSelector(cardColor, textColorPrimary),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: boxBg,
                borderRadius: BorderRadius.circular(25),
                border: Border.all(color: cardBorder, width: 2),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      (selectedResult?['examTitle'] ?? "Select Exam").toString().toUpperCase(),
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: 1),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down, color: Color(0xFF42A5F5), size: 24)
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          // View Button
          if (selectedResult != null)
            GestureDetector(
              onTap: () => setState(() => viewMode = 'reportCard'),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 24),
                decoration: BoxDecoration(
                  color: const Color(0xFF42A5F5),
                  borderRadius: BorderRadius.circular(35),
                  boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.bar_chart, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Text("VIEW RESULT CARD", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                  ],
                ),
              ),
            ).animate().scale(duration: 300.ms, curve: Curves.easeOutBack)
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  // --- VIEW 2: REPORT CARD ---
  Widget _buildReportCardView(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary, Color boxBg) {
    return Column(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(45),
            border: Border.all(color: cardBorder),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
          ),
          child: Column(
            children: [
              const Text("RESULT SUMMARY", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1)),
              const SizedBox(height: 24),

              _buildSummaryBox("STUDENT NAME", studentProfile?['name'], boxBg, cardBorder, textColorPrimary, textColorSecondary),
              const SizedBox(height: 16),
              _buildSummaryBox("ENROLLMENT NO", studentProfile?['enrollmentNo'], boxBg, cardBorder, textColorPrimary, textColorSecondary),
              const SizedBox(height: 16),
              _buildSummaryBox("FATHER NAME", studentProfile?['fatherName'], boxBg, cardBorder, textColorPrimary, textColorSecondary),
              const SizedBox(height: 16),
              _buildSummaryBox("CLASS", studentProfile?['grade'], boxBg, cardBorder, textColorPrimary, textColorSecondary),
              const SizedBox(height: 16),

              // Rank Box
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : const Color(0xFF93C5FD)),
                ),
                child: Column(
                  children: [
                    const Text("RANK", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2, fontStyle: FontStyle.italic)),
                    const SizedBox(height: 8),
                    Text("#${selectedResult?['rank'] ?? '-'}", style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF60A5FA) : const Color(0xFF1E3A8A), fontStyle: FontStyle.italic)),
                  ],
                ),
              )
            ],
          ),
        ).animate().fadeIn().slideX(begin: 0.1),
        
        const SizedBox(height: 24),

        // Download Button
        GestureDetector(
          onTap: isDownloading ? null : _generatePDF,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24),
            decoration: BoxDecoration(
              color: const Color(0xFF42A5F5),
              borderRadius: BorderRadius.circular(35),
              boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                isDownloading 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                  : const Icon(Icons.download, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Text(isDownloading ? "GENERATING..." : "DOWNLOAD RESULT", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
              ],
            ),
          ),
        ).animate().scale(delay: 200.ms)
      ],
    );
  }

  Widget _buildSummaryBox(String label, String? value, Color boxBg, Color cardBorder, Color textColorPrimary, Color textColorSecondary) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: boxBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
          const SizedBox(height: 6),
          Text((value ?? 'N/A').toString().toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }
}
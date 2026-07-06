import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import 'package:pdf/pdf.dart';
import 'package:intl/intl.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:open_filex/open_filex.dart'; // 🔥 NAYA IMPORT: SEEDHA "OPEN WITH" POPUP KE LIYE
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class StudentDatesheet extends ConsumerStatefulWidget {
  const StudentDatesheet({super.key});

  @override
  ConsumerState<StudentDatesheet> createState() => _StudentDatesheetState();
}

class _StudentDatesheetState extends ConsumerState<StudentDatesheet> {
  bool isInitialLoading = true;
  List<dynamic> datesheets = [];
  Map<String, dynamic>? user;
  String currentSchoolName = "EduFlowAI Public School";

  // Views: 'list', 'vault', 'success', 'download'
  String currentView = 'list';
  Map<String, dynamic>? selectedDatesheet;
  bool isValidated = false;

  // Form State
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _enrollCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _enrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _initializeData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');

      if (userStr != null) {
        user = jsonDecode(userStr);

        // SAFE PARSING
        if (user?['schoolId'] != null &&
            user!['schoolId'] is Map<String, dynamic>) {
          if (user!['schoolId']['name'] != null) {
            currentSchoolName = user!['schoolId']['name'];
          }
        }
      }
    } catch (e) {
      debugPrint("Local Data Parsing Error: $e");
    } finally {
      await _fetchDatesheets(isRefresh: false);
    }
  }

  Future<void> _fetchDatesheets({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isInitialLoading = true);

    try {
      final response = await ApiClient.dio.get('/datesheet/my-datesheet');
      if (mounted) {
        setState(() {
          datesheets = response.data as List<dynamic>;
          isInitialLoading = false;
        });
      }
    } catch (err) {
      _showToast("Failed to load datesheet.", isError: true);
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchDatesheets(isRefresh: true);
  }

  Future<void> _handleSelectDatesheet(Map<String, dynamic> ds) async {
    setState(() {
      selectedDatesheet = ds;
    });

    final prefs = await SharedPreferences.getInstance();
    final enrollNo = user?['enrollmentNo'] ?? '';
    final dsId = ds['_id'] ?? '';

    final isVerified =
        prefs.getString('datesheet_verified_${enrollNo}_$dsId') == 'true';

    if (isVerified) {
      setState(() {
        isValidated = true;
        currentView = 'download';
      });
    } else {
      setState(() {
        isValidated = false;
        _nameCtrl.clear();
        _phoneCtrl.clear();
        _enrollCtrl.clear();
        currentView = 'vault';
      });
    }
  }

  Future<void> _handleValidationSubmit() async {
    final nameMatch = _nameCtrl.text.trim().toLowerCase() ==
        (user?['name'] ?? '').toString().trim().toLowerCase();
    final phoneMatch =
        _phoneCtrl.text.trim() == (user?['phone'] ?? '').toString().trim();
    final enrollMatch = _enrollCtrl.text.trim().toLowerCase() ==
        (user?['enrollmentNo'] ?? '').toString().trim().toLowerCase();

    if (nameMatch && phoneMatch && enrollMatch) {
      setState(() => isValidated = true);

      final prefs = await SharedPreferences.getInstance();
      final enrollNo = user?['enrollmentNo'] ?? '';
      final dsId = selectedDatesheet?['_id'] ?? '';
      await prefs.setString('datesheet_verified_${enrollNo}_$dsId', 'true');

      setState(() => currentView = 'success');

      await Future.delayed(const Duration(seconds: 2));
      if (mounted) setState(() => currentView = 'download');
    } else {
      _showToast("Access Denied! Incorrect Credentials. ⚠️", isError: true);
    }
  }

  Future<void> _handleDownload() async {
    if (selectedDatesheet == null) return;

    if (selectedDatesheet!['isManual'] == true) {
      _downloadResource(selectedDatesheet!['fileUrl'],
          "${selectedDatesheet!['title']}_Datesheet");
    } else {
      _showToast("Generating PDF File... ⏳");
      await _generateAndSaveAIPdf();
    }
  }

  Future<void> _generateAndSaveAIPdf() async {
    final pdf = pw.Document();

    final String title =
        (selectedDatesheet!['title'] ?? '').toString().toUpperCase();
    final String gradeStr =
        (user?['grade'] ?? '').toString().split('-')[0].trim().toUpperCase();
    final String timing = (selectedDatesheet!['timing'] ?? 'N/A').toString();
    final String resultDate = selectedDatesheet!['resultDate'] != null
        ? DateFormat('dd MMM yyyy')
            .format(DateTime.parse(selectedDatesheet!['resultDate'].toString()))
        : 'N/A';

    final List<dynamic> schedule = selectedDatesheet!['schedule'] ?? [];
    final String notesStr = (selectedDatesheet!['notes'] ?? '').toString();

    pw.MemoryImage? inchargeImage;
    pw.MemoryImage? principalImage;

    // 🔥 TERA CURRENT LAPTOP IP ENGINE 🔥
    final String currentLaptopIP = "192.168.20.131";

    try {
      if (selectedDatesheet!['signatures']?['incharge'] != null) {
        String url = selectedDatesheet!['signatures']['incharge'].toString();

        // 🔥 AGAR DB ME LOCALHOST YA PURANA IP HAI, TOH CORRECTION MAARO 🔥
        url = url
            .replaceAll('localhost', currentLaptopIP)
            .replaceAll('127.0.0.1', currentLaptopIP)
            .replaceAll('10.0.2.2', currentLaptopIP)
            .replaceAll('192.168.1.15', currentLaptopIP); // Purana IP clean-up

        String fullUrl =
            url.startsWith('http') ? url : "http://$currentLaptopIP:5000$url";

        final response = await ApiClient.dio
            .get(fullUrl, options: Options(responseType: ResponseType.bytes));
        inchargeImage = pw.MemoryImage(response.data);
      }

      if (selectedDatesheet!['signatures']?['principal'] != null) {
        String url = selectedDatesheet!['signatures']['principal'].toString();

        // 🔥 SAME CLEAN-UP FOR PRINCIPAL SIGNATURE 🔥
        url = url
            .replaceAll('localhost', currentLaptopIP)
            .replaceAll('127.0.0.1', currentLaptopIP)
            .replaceAll('10.0.2.2', currentLaptopIP)
            .replaceAll('192.168.1.15', currentLaptopIP);

        String fullUrl =
            url.startsWith('http') ? url : "http://$currentLaptopIP:5000$url";

        final response = await ApiClient.dio
            .get(fullUrl, options: Options(responseType: ResponseType.bytes));
        principalImage = pw.MemoryImage(response.data);
      }
    } catch (e) {
      debugPrint("Signature Images failed to download from network: $e");
    }

    pdf.addPage(pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(32),
      build: (pw.Context context) {
        return [
          // Header
          pw.Center(
              child: pw.Text(
                  (selectedDatesheet!['schoolName'] ?? currentSchoolName)
                      .toString()
                      .toUpperCase(),
                  style: pw.TextStyle(
                      fontSize: 24, fontWeight: pw.FontWeight.bold))),
          pw.SizedBox(height: 8),
          pw.Center(
              child: pw.Text(title,
                  style: pw.TextStyle(
                      fontSize: 18, fontWeight: pw.FontWeight.bold))),
          pw.Center(
              child: pw.Text("DATE SHEET FOR CLASS - $gradeStr",
                  style: pw.TextStyle(fontSize: 14))),
          pw.SizedBox(height: 24),

          // Table
          pw.Table.fromTextArray(
            headers: ['DATE & DAY', 'SUBJECT'],
            headerStyle: pw.TextStyle(
                fontWeight: pw.FontWeight.bold, color: PdfColors.white),
            headerDecoration: const pw.BoxDecoration(color: PdfColors.blue800),
            cellAlignment: pw.Alignment.center,
            data: schedule.map((col) {
              String subject = "-";
              if (col['classExams'] != null) {
                subject = (col['classExams'][user?['grade']] ??
                        col['classExams'][gradeStr] ??
                        "-")
                    .toString();
              }
              if (subject == '-' || subject.toLowerCase() == 'no exam') {
                subject = "NO EXAM";
              }
              return ["${col['date']}\n${col['day']}", subject.toUpperCase()];
            }).toList(),
          ),
          pw.SizedBox(height: 24),

          // Notes
          pw.Text("KINDLY NOTE:",
              style: pw.TextStyle(
                  fontWeight: pw.FontWeight.bold,
                  decoration: pw.TextDecoration.underline)),
          pw.SizedBox(height: 8),
          pw.Bullet(text: "Examination Timing: $timing"),
          pw.Bullet(text: "Result Declaration: $resultDate"),

          ...notesStr
              .split('\n')
              .where((String n) => n.trim().isNotEmpty)
              .map((String note) => pw.Bullet(text: note))
              .toList(),

          // --- NAYA CODE: SIGNATURE BLOCK ---
          pw.SizedBox(height: 40),
          pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                // Incharge Signature
                pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      if (inchargeImage != null)
                        pw.Image(inchargeImage, height: 40),
                      pw.SizedBox(height: 8),
                      // 🔥 ERROR FIXED HERE: Added pw.BoxDecoration 🔥
                      pw.Container(
                          width: 120,
                          decoration: const pw.BoxDecoration(
                              border: pw.Border(top: pw.BorderSide(width: 2)))),
                      pw.SizedBox(height: 4),
                      pw.Text("EXAMINATION INCHARGE",
                          style: pw.TextStyle(
                              fontWeight: pw.FontWeight.bold, fontSize: 10)),
                    ]),
                // Principal Signature
                pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      if (principalImage != null)
                        pw.Image(principalImage, height: 40),
                      pw.SizedBox(height: 8),
                      // 🔥 ERROR FIXED HERE: Added pw.BoxDecoration 🔥
                      pw.Container(
                          width: 120,
                          decoration: const pw.BoxDecoration(
                              border: pw.Border(top: pw.BorderSide(width: 2)))),
                      pw.SizedBox(height: 4),
                      pw.Text("PRINCIPAL",
                          style: pw.TextStyle(
                              fontWeight: pw.FontWeight.bold, fontSize: 10)),
                    ])
              ])
        ];
      },
    ));

    try {
      // 🔥 SIMPLE PATH AUR DIRECT OPEN LOGIC 🔥
      final Directory dir = await getApplicationDocumentsDirectory();
      final String filePath = "${dir.path}/${title}_Schedule.pdf";

      final file = File(filePath);
      await file.writeAsBytes(await pdf.save());

      _showToast("PDF Ready! Opening... ✅");

      // Seedha "Open With" wala popup trigger karega
      await OpenFilex.open(filePath);
    } catch (e) {
      _showToast("Failed to open PDF", isError: true);
    }
  }

  Future<void> _downloadResource(String? urlStr, String fileName) async {
    if (urlStr == null || urlStr.isEmpty) return;
    _showToast("Downloading File... ⏳");

    try {
      final String remoteUrl = urlStr.startsWith('http')
          ? urlStr
          : "http://192.168.20.131:5000$urlStr"; // Apne local IP ke hisab se set rakhna

      final Directory dir = await getApplicationDocumentsDirectory();
      final String filePath = "${dir.path}/$fileName.pdf";

      await ApiClient.dio.download(remoteUrl, filePath);

      _showToast("File Ready! Opening... ✅");

      // Seedha "Open With" popup
      await OpenFilex.open(filePath);
    } catch (err) {
      _showToast("Direct download failed. Routing via cloud sync...",
          isError: true);
      final Uri url = Uri.parse(urlStr.startsWith('http')
          ? urlStr
          : "http://192.168.20.131:5000$urlStr");
      if (await canLaunchUrl(url))
        await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _handleBack() {
    if (currentView != 'list') {
      setState(() {
        currentView = 'list';
        selectedDatesheet = null;
      });
    } else {
      if (context.canPop())
        context.pop();
      else
        context.go('/');
    }
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
                        fontSize: 13))),
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

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor =
        isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary =
        isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary =
        isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);

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
                                      border: Border.all(
                                          color: Colors.white.withOpacity(0.3)),
                                    ),
                                    child: const Icon(Icons.arrow_back,
                                        color: Colors.white, size: 24),
                                  ),
                                ),
                                Column(
                                  children: [
                                    const Text("Date Sheet",
                                        style: TextStyle(
                                            fontSize: 28,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            fontStyle: FontStyle.italic,
                                            letterSpacing: -1)),
                                    Text("EXAMINATION SCHEDULE",
                                        style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w900,
                                            color:
                                                Colors.white.withOpacity(0.9),
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
                                  child: const Icon(Icons.calendar_month,
                                      color: Colors.white, size: 24),
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
                          child: _buildCurrentView(isDarkMode, cardColor,
                              textColorPrimary, textColorSecondary),
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

  // --- VIEW ROUTER ---
  Widget _buildCurrentView(bool isDarkMode, Color cardColor,
      Color textColorPrimary, Color textColorSecondary) {
    switch (currentView) {
      case 'list':
        return _buildListView(
            isDarkMode, cardColor, textColorPrimary, textColorSecondary);
      case 'vault':
        return _buildVaultView(
            isDarkMode, cardColor, textColorPrimary, textColorSecondary);
      case 'success':
        return _buildSuccessView();
      case 'download':
        return _buildDownloadView(
            isDarkMode, cardColor, textColorPrimary, textColorSecondary);
      default:
        return const SizedBox.shrink();
    }
  }

  // 1. LIST VIEW
  Widget _buildListView(bool isDarkMode, Color cardColor,
      Color textColorPrimary, Color textColorSecondary) {
    if (datesheets.isEmpty) {
      return AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(45),
            border: Border.all(
                color: isDarkMode
                    ? const Color(0xFF334155)
                    : const Color(0xFFDDE3EA)),
            boxShadow: const [
              BoxShadow(
                  color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))
            ]),
        child: Column(
          children: [
            const Icon(Icons.calendar_month,
                size: 60, color: Color(0xFFDBEAFE)),
            const SizedBox(height: 16),
            Text("NO EXAMS SCHEDULED",
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: textColorPrimary,
                    fontStyle: FontStyle.italic,
                    letterSpacing: -0.5)),
            const SizedBox(height: 8),
            Text("Your datesheet has not been published yet.",
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: textColorSecondary,
                    fontStyle: FontStyle.italic,
                    letterSpacing: 1.5)),
          ],
        ),
      ).animate().fadeIn().slideY(begin: 0.1);
    }

    return Column(
      children: datesheets.asMap().entries.map((entry) {
        int idx = entry.key;
        var ds = entry.value;

        return GestureDetector(
          onTap: () => _handleSelectDatesheet(ds),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            margin: const EdgeInsets.only(bottom: 24),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDarkMode
                      ? [
                          const Color(0xFF1E3A8A),
                          const Color(0xFF0F172A),
                          const Color(0xFF1E3A8A)
                        ]
                      : [
                          const Color(0xFFEFF6FF),
                          Colors.white,
                          const Color(0xFFDBEAFE)
                        ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(40),
                border: Border.all(
                    color: isDarkMode
                        ? const Color(0xFF42A5F5).withOpacity(0.3)
                        : Colors.white),
                boxShadow: [
                  BoxShadow(
                      color: const Color(0xFF42A5F5)
                          .withOpacity(isDarkMode ? 0.1 : 0.15),
                      blurRadius: 30,
                      offset: const Offset(0, 15))
                ]),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                          color: isDarkMode
                              ? const Color(0xFF1E293B)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                                color:
                                    const Color(0xFF42A5F5).withOpacity(0.25),
                                blurRadius: 15,
                                offset: const Offset(0, 5))
                          ]),
                      child: const Icon(Icons.description,
                          color: Color(0xFF42A5F5), size: 28),
                    ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(
                        begin: const Offset(1, 1),
                        end: const Offset(1.05, 1.05),
                        duration: 1.seconds),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        (ds['title'] ?? '').toString().toUpperCase(),
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: isDarkMode
                                ? const Color(0xFF38BDF8)
                                : const Color(0xFF1E3A8A),
                            fontStyle: FontStyle.italic,
                            letterSpacing: 1),
                      ),
                    )
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  "AVAILABLE FOR DOWNLOAD",
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color:
                          isDarkMode ? const Color(0xFF38BDF8) : Colors.black87,
                      letterSpacing: 3,
                      fontStyle: FontStyle.italic),
                )
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .fade(begin: 0.5, end: 1.0, duration: 1.5.seconds)
              ],
            ),
          )
              .animate()
              .fadeIn(delay: Duration(milliseconds: 100 * idx))
              .slideY(begin: 0.1),
        );
      }).toList(),
    );
  }

  // 2. VAULT VIEW (SECURITY CHECK)
  Widget _buildVaultView(bool isDarkMode, Color cardColor,
      Color textColorPrimary, Color textColorSecondary) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(45),
          border: Border.all(
              color:
                  isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100),
          boxShadow: const [
            BoxShadow(
                color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))
          ]),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: const BoxDecoration(
                gradient: LinearGradient(
                    colors: [Color(0xFF42A5F5), Color(0xFF64B5F6)]),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)]),
            child: const Icon(Icons.security, color: Colors.white, size: 36),
          ),
          const SizedBox(height: 20),
          Text("VERIFY YOUR DETAILS",
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: textColorPrimary,
                  fontStyle: FontStyle.italic)),
          const SizedBox(height: 8),
          Text(
              "PLEASE VERIFY YOUR DETAILS TO ACCESS\n${selectedDatesheet?['title']}",
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF42A5F5),
                  fontStyle: FontStyle.italic,
                  letterSpacing: 1.5)),
          const SizedBox(height: 32),
          _buildVaultInput("FULL NAME", _nameCtrl, isDarkMode),
          const SizedBox(height: 16),
          _buildVaultInput("REGISTERED PHONE", _phoneCtrl, isDarkMode,
              isPhone: true),
          const SizedBox(height: 16),
          _buildVaultInput("ENROLLMENT NUMBER", _enrollCtrl, isDarkMode),
          const SizedBox(height: 32),
          GestureDetector(
            onTap: _handleValidationSubmit,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF42A5F5), Color(0xFF1E88E5)]),
                  borderRadius: BorderRadius.circular(35),
                  boxShadow: [
                    BoxShadow(
                        color: const Color(0xFF42A5F5).withOpacity(0.4),
                        blurRadius: 15,
                        offset: const Offset(0, 5))
                  ]),
              alignment: Alignment.center,
              child: const Text("CONTINUE",
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: 3,
                      fontStyle: FontStyle.italic)),
            ),
          ).animate().scale()
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _buildVaultInput(
      String hint, TextEditingController ctrl, bool isDarkMode,
      {bool isPhone = false}) {
    return Container(
      decoration: BoxDecoration(
        color: isDarkMode ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: isDarkMode ? const Color(0xFF334155) : Colors.blue.shade100),
      ),
      child: TextField(
        controller: ctrl,
        keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
        style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: isDarkMode ? Colors.white : const Color(0xFF1E293B),
            fontStyle: FontStyle.italic),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: Color(0xFF94A3B8),
              letterSpacing: 1.5),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        ),
      ),
    );
  }

  // 3. SUCCESS VIEW
  Widget _buildSuccessView() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
                color: const Color(0xFFD1FAE5),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFECFDF5), width: 8),
                boxShadow: [
                  BoxShadow(
                      color: const Color(0xFF34D399).withOpacity(0.5),
                      blurRadius: 40)
                ]),
            child: const Icon(Icons.check, color: Color(0xFF10B981), size: 60)
                .animate()
                .scale(
                    delay: 200.ms, duration: 400.ms, curve: Curves.easeOutBack),
          ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
          const SizedBox(height: 32),
          const Text("DETAILS MATCHED",
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF059669),
                      letterSpacing: 3,
                      fontStyle: FontStyle.italic))
              .animate()
              .fadeIn(delay: 400.ms)
        ],
      ),
    );
  }

  // 4. DOWNLOAD VIEW
  Widget _buildDownloadView(bool isDarkMode, Color cardColor,
      Color textColorPrimary, Color textColorSecondary) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(45),
          border: Border.all(
              color: isDarkMode
                  ? const Color(0xFF334155)
                  : const Color(0xFFDDE3EA)),
          boxShadow: const [
            BoxShadow(
                color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))
          ]),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: isDarkMode
                      ? const Color(0xFF1E3A8A).withOpacity(0.3)
                      : Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                      color: isDarkMode
                          ? const Color(0xFF1E3A8A)
                          : Colors.blue.shade100),
                ),
                child: const Icon(Icons.download,
                    color: Color(0xFF42A5F5), size: 40),
              ),
              Positioned(
                bottom: -5,
                right: -5,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                      color: Color(0xFF10B981),
                      shape: BoxShape.circle,
                      border: Border.fromBorderSide(
                          BorderSide(color: Colors.white, width: 3))),
                  child: const Icon(Icons.check, color: Colors.white, size: 14),
                ),
              )
            ],
          ),
          const SizedBox(height: 24),
          Text("ACCESS GRANTED",
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: textColorPrimary,
                  fontStyle: FontStyle.italic)),
          const SizedBox(height: 8),
          Text(selectedDatesheet?['title'] ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: textColorSecondary,
                  fontStyle: FontStyle.italic,
                  letterSpacing: 2)),
          const SizedBox(height: 40),
          GestureDetector(
            onTap: _handleDownload,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24),
              decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF42A5F5), Color(0xFF1E88E5)]),
                  borderRadius: BorderRadius.circular(35),
                  boxShadow: [
                    BoxShadow(
                        color: const Color(0xFF42A5F5).withOpacity(0.4),
                        blurRadius: 15,
                        offset: const Offset(0, 5))
                  ]),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.download_for_offline,
                      color: Colors.white, size: 24),
                  SizedBox(width: 12),
                  Text("DOWNLOAD DOCUMENT",
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 2,
                          fontStyle: FontStyle.italic)),
                ],
              ),
            ),
          ).animate().scale()
        ],
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
  }
}

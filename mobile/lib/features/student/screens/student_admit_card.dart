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
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:open_filex/open_filex.dart'; // 🔥 AUTO OPEN FEATURE
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class StudentAdmitCard extends ConsumerStatefulWidget {
  const StudentAdmitCard({super.key});

  @override
  ConsumerState<StudentAdmitCard> createState() => _StudentAdmitCardState();
}

class _StudentAdmitCardState extends ConsumerState<StudentAdmitCard> {
  bool isInitialLoading = true;
  bool isDownloading = false;
  List<dynamic> admitCards = [];
  Map<String, dynamic>? user;
  
  // Views: 'list', 'vault', 'success', 'download'
  String currentView = 'list';
  Map<String, dynamic>? selectedAdmitCard;
  bool isValidated = false;

  // Form State
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _enrollCtrl = TextEditingController();

  // 🔥 CURRENT LAPTOP IP 🔥
  final String currentLaptopIP = "10.163.134.38"; 

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
      }
    } catch (e) {
      debugPrint("Local Data Parsing Error: $e");
    } finally {
      await _fetchAdmitCards(isRefresh: false);
    }
  }

  Future<void> _fetchAdmitCards({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isInitialLoading = true);

    try {
      final response = await ApiClient.dio.get('/admitcard/my-admitcards');
      if (mounted) {
        setState(() {
          admitCards = response.data as List<dynamic>;
          isInitialLoading = false;
        });
      }
    } catch (err) {
      _showToast("Failed to load admit cards.", isError: true);
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchAdmitCards(isRefresh: true);
  }

  Future<void> _handleSelectCard(Map<String, dynamic> ac) async {
    setState(() {
      selectedAdmitCard = ac;
    });

    final prefs = await SharedPreferences.getInstance();
    final enrollNo = user?['enrollmentNo'] ?? '';
    final acId = ac['_id'] ?? '';
    
    final isVerified = prefs.getString('admitcard_verified_${enrollNo}_$acId') == 'true';

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
    final nameMatch = _nameCtrl.text.trim().toLowerCase() == (user?['name'] ?? '').toString().trim().toLowerCase();
    final phoneMatch = _phoneCtrl.text.trim() == (user?['phone'] ?? '').toString().trim();
    final enrollMatch = _enrollCtrl.text.trim().toLowerCase() == (user?['enrollmentNo'] ?? '').toString().trim().toLowerCase();

    if (nameMatch && phoneMatch && enrollMatch) {
      setState(() => isValidated = true);
      
      final prefs = await SharedPreferences.getInstance();
      final enrollNo = user?['enrollmentNo'] ?? '';
      final acId = selectedAdmitCard?['_id'] ?? '';
      await prefs.setString('admitcard_verified_${enrollNo}_$acId', 'true');

      setState(() => currentView = 'success');
      
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) setState(() => currentView = 'download');
    } else {
      _showToast("Access Denied! Incorrect Credentials. ⚠️", isError: true);
    }
  }

// --- 🔥 NATIVE PDF ADMIT CARD ENGINE 🔥 ---
  Future<void> _generatePDF() async {
    if (selectedAdmitCard == null || user == null) return;
    
    setState(() => isDownloading = true);
    _showToast("Generating Admit Card PDF... ⏳");

    try {
      final pdf = pw.Document();

      // --- IMAGES FETCH LOGIC WITH IP SANITIZER ---
      pw.MemoryImage? schoolLogoImg;
      pw.MemoryImage? studentPhotoImg;
      pw.MemoryImage? inchargeSignImg;

      Future<pw.MemoryImage?> fetchImage(String? rawUrl) async {
        if (rawUrl == null || rawUrl.isEmpty) return null;
        try {
          String url = rawUrl.replaceAll('localhost', currentLaptopIP)
                             .replaceAll('127.0.0.1', currentLaptopIP)
                             .replaceAll('10.0.2.2', currentLaptopIP);
          String fullUrl = url.startsWith('http') ? url : "http://$currentLaptopIP:5000$url";
          final response = await ApiClient.dio.get(fullUrl, options: Options(responseType: ResponseType.bytes));
          return pw.MemoryImage(response.data);
        } catch (e) {
          debugPrint("Failed to fetch image: $e");
          return null;
        }
      }

     // 🔥 NAYA CODE: BASE64 LOGO DECODER 🔥
      try {
        final logoRes = await ApiClient.dio.get('/school/logo');
        if (logoRes.data != null && logoRes.data['logo'] != null) {
          String logoData = logoRes.data['logo'].toString();
          
          // Check agar data base64 image hai
          if (logoData.startsWith('data:image')) {
            // "data:image/png;base64," wala part hata ke sirf code extract karo
            String base64String = logoData.split(',').last;
            schoolLogoImg = pw.MemoryImage(base64Decode(base64String));
          } else {
            // Agar normal link hai toh purana function
            schoolLogoImg = await fetchImage(logoData);
          }
        }
      } catch (e) {
        debugPrint("Admit Card Logo Fetch Failed: $e");
      }
      if (user != null && user!['avatar'] != null) {
         studentPhotoImg = await fetchImage(user!['avatar']);
      }
      
      if (selectedAdmitCard!['datesheetId'] != null && selectedAdmitCard!['datesheetId']['signatures'] != null) {
        inchargeSignImg = await fetchImage(selectedAdmitCard!['datesheetId']['signatures']['incharge']);
      }

      // --- DATA PREPARATION ---
      final pdfBlue = PdfColor.fromHex("#2B7A9F");
      final pdfRed = PdfColor.fromHex("#E31E24");

      String getOrdinal(int n) {
        if (n % 100 >= 11 && n % 100 <= 13) return "${n}th";
        switch (n % 10) {
          case 1: return "${n}st";
          case 2: return "${n}nd";
          case 3: return "${n}rd";
          default: return "${n}th";
        }
      }

      String rawGrade = (user!['grade'] ?? '').toString();
      String ordinalGrade = rawGrade.isNotEmpty ? getOrdinal(int.tryParse(rawGrade.split('-')[0].trim()) ?? 0) : "N/A";
      String baseGrade = rawGrade.split('-')[0].trim().toUpperCase();

      // Filter Schedule strictly removing blanks and '-'
      List<dynamic> schedule = selectedAdmitCard!['datesheetId']?['schedule'] ?? [];
      List<Map<String, dynamic>> validSubjects = [];
      
      for (int i = 0; i < schedule.length; i++) {
        var row = schedule[i];
        String subject = "-";
        if (row['classExams'] != null) {
          subject = (row['classExams'][rawGrade] ?? row['classExams'][baseGrade] ?? "-").toString();
        }
        if (subject != "-" && subject.trim().isNotEmpty && subject.toLowerCase() != "no exam") {
          validSubjects.add({
            'code': "EXM${subject.replaceAll(' ', '').substring(0, subject.length >= 3 ? 3 : subject.length).toUpperCase()}${i + 1}",
            'subject': subject,
            'date': row['date'],
            'timing': selectedAdmitCard!['datesheetId']?['timing'] ?? ''
          });
        }
      }

      // Format Instructions with numbers
      List<dynamic> rawInstructions = selectedAdmitCard!['instructions'] as List<dynamic>? ?? [];
      List<String> numberedInstructions = [];
      for (int i = 0; i < rawInstructions.length; i++) {
        numberedInstructions.add("${i + 1}.  ${rawInstructions[i]}");
      }

      // --- BUILD PDF STRUCTURE ---
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(30),
          build: (pw.Context context) {
            return [
              // Main Outer Border Wrapper (This contains the Admit Card Data)
              pw.Container(
                decoration: pw.BoxDecoration(border: pw.Border.all(color: pdfBlue, width: 3)),
                child: pw.Column(
                  children: [
                    // Header (Logo, School Name, Photo)
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      decoration: pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: pdfBlue, width: 3))),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          // Logo Box
                          pw.Container(
                            width: 60, height: 60,
                            decoration: pw.BoxDecoration(shape: pw.BoxShape.circle, border: pw.Border.all(color: PdfColors.grey300, width: 2)),
                            child: schoolLogoImg != null ? pw.ClipOval(child: pw.Image(schoolLogoImg, fit: pw.BoxFit.cover)) : pw.Center(child: pw.Text("LOGO", style: pw.TextStyle(fontSize: 10, color: PdfColors.grey))),
                          ),
                          // School Name
                          pw.Expanded(
                            child: pw.Text((selectedAdmitCard!['schoolName'] ?? 'SCHOOL NAME').toString().toUpperCase(), textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold, color: pdfRed)),
                          ),
                          // Photo Box
                          pw.Container(
                            width: 60, height: 75,
                            decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey400, width: 2), color: PdfColors.grey100),
                            child: studentPhotoImg != null ? pw.Image(studentPhotoImg, fit: pw.BoxFit.cover) : pw.Center(child: pw.Text("PHOTO", style: pw.TextStyle(fontSize: 8, color: PdfColors.grey))),
                          )
                        ]
                      )
                    ),
                    
                    // Title
                    pw.Container(
                      width: double.infinity,
                      padding: const pw.EdgeInsets.symmetric(vertical: 8),
                      decoration: pw.BoxDecoration(color: PdfColors.grey100, border: pw.Border(bottom: pw.BorderSide(color: pdfBlue, width: 3))),
                      child: pw.Column(
                        children: [
                          pw.Text("HALL TICKET", style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, letterSpacing: 2)),
                          pw.Text((selectedAdmitCard!['batch'] ?? '').toString().toUpperCase(), style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                        ]
                      )
                    ),

                    // Student Details Table
                    pw.Table(
                      border: pw.TableBorder.all(color: pdfBlue, width: 1),
                      children: [
                        _buildPdfRow("Admission No.:", (user!['admissionNo'] ?? 'N/A').toString(), "Enrollment No.:", (user!['enrollmentNo'] ?? 'N/A').toString()),
                        pw.TableRow(
                          children: [
                            pw.Container(padding: const pw.EdgeInsets.all(5), color: PdfColors.grey100, child: pw.Text("Name of Student:", style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text((user!['name'] ?? 'N/A').toString().toUpperCase(), style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), color: PdfColors.grey100),
                            pw.Container(padding: const pw.EdgeInsets.all(5)),
                          ]
                        ),
                        _buildPdfRow("Father's Name:", (user!['fatherName'] ?? '-').toString().toUpperCase(), "Mother's Name:", (user!['motherName'] ?? '-').toString().toUpperCase()),
                        pw.TableRow(
                          children: [
                            pw.Container(padding: const pw.EdgeInsets.all(5), color: PdfColors.grey100, child: pw.Text("Class:", style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text(ordinalGrade, style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: pdfRed))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), color: PdfColors.grey100, child: pw.Text("DOB:", style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text(user!['dob'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(user!['dob'])) : '-', style: pw.TextStyle(fontSize: 10))),
                          ]
                        ),
                        _buildPdfRow("Exam Type:", (selectedAdmitCard!['examType'] ?? 'N/A').toString().toUpperCase(), "Date of Issue:", DateFormat('dd/MM/yyyy').format(DateTime.now())),
                      ]
                    ),

                    pw.SizedBox(height: 5),

                    // Exam Schedule Table
                    pw.Table(
                      border: pw.TableBorder.all(color: pdfBlue, width: 1),
                      children: [
                        pw.TableRow(
                          decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                          children: [
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text("EXAM CODE", style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text("SUBJECT NAME", style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text("SESSION", style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text("DATE & TIME", style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold))),
                          ]
                        ),
                        ...validSubjects.map((s) => pw.TableRow(
                          children: [
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Center(child: pw.Text(s['code'], style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text(s['subject'].toString().toUpperCase(), style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Center(child: pw.Text((selectedAdmitCard!['batch'] ?? '').toString().toUpperCase(), style: pw.TextStyle(fontSize: 9)))),
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.center, children: [
                              pw.Text(s['date'], style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
                              pw.Text(s['timing'], style: pw.TextStyle(fontSize: 8, color: PdfColors.grey700)),
                            ])),
                          ]
                        )).toList(),
                        pw.TableRow(
                          decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                          children: [
                            pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Center(child: pw.Text("--- END OF STATEMENT ---", style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, letterSpacing: 2)))),
                            pw.Container(), pw.Container(), pw.Container(),
                          ]
                        )
                      ]
                    ),

                    // Signatures Footer
                    pw.Container(
                      padding: const pw.EdgeInsets.only(top: 40, bottom: 10, left: 30, right: 30),
                      decoration: pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: pdfBlue, width: 3))),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: pw.CrossAxisAlignment.end,
                        children: [
                          pw.Column(children: [
                            pw.Container(width: 120, decoration: const pw.BoxDecoration(border: pw.Border(top: pw.BorderSide(color: PdfColors.black, width: 1.5)))),
                            pw.SizedBox(height: 3),
                            pw.Text("CANDIDATE SIGNATURE", style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold))
                          ]),
                          pw.Column(children: [
                            if (inchargeSignImg != null) pw.Image(inchargeSignImg, height: 35),
                            pw.SizedBox(height: 5),
                            pw.Container(width: 120, decoration: const pw.BoxDecoration(border: pw.Border(top: pw.BorderSide(color: PdfColors.black, width: 1.5)))),
                            pw.SizedBox(height: 3),
                            pw.Text("CONTROLLER OF EXAMS", style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold))
                          ])
                        ]
                      )
                    ),

                    // Important Notice Strip
                    pw.Container(
                      width: double.infinity,
                      padding: const pw.EdgeInsets.all(8),
                      decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                      child: pw.Text("Student must bring the School ID Card along with this Hall Ticket.", textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold))
                    )
                  ]
                )
              ),

              pw.SizedBox(height: 20),

              // 🔥 INSTRUCTIONS BLOCK FIX: ALLOWS PAGE WRAPPING SEAMLESSLY 🔥
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(vertical: 6),
                decoration: pw.BoxDecoration(color: PdfColors.grey100, border: pw.Border.all(color: pdfBlue, width: 2)),
                child: pw.Text("INSTRUCTIONS TO CANDIDATES", textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, letterSpacing: 1))
              ),
              
              // Un-locked container for lists, so it breaks properly across pages
              pw.Container(
                padding: const pw.EdgeInsets.all(12),
                decoration: pw.BoxDecoration(
                  border: pw.Border(
                    left: pw.BorderSide(color: pdfBlue, width: 2),
                    right: pw.BorderSide(color: pdfBlue, width: 2),
                    bottom: pw.BorderSide(color: pdfBlue, width: 2),
                  )
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: numberedInstructions.map((note) {
                    return pw.Padding(
                      padding: const pw.EdgeInsets.only(bottom: 6),
                      child: pw.Text(note, style: pw.TextStyle(fontSize: 9))
                    );
                  }).toList(),
                )
              )
            ];
          },
        )
      );

      // --- OPEN WITH FEATURE (SAVE & LAUNCH) ---
      final Directory dir = await getApplicationDocumentsDirectory();
      final String safeName = user!['name'].toString().replaceAll(' ', '_');
      final String filePath = "${dir.path}/${safeName}_AdmitCard.pdf";
      
      final file = File(filePath);
      await file.writeAsBytes(await pdf.save());
      
      _showToast("Admit Card Ready! Opening... ✅");
      await OpenFilex.open(filePath);

    } catch (err) {
      debugPrint("PDF Gen Error: $err");
      _showToast("PDF Generation Failed", isError: true);
    } finally {
      if (mounted) setState(() => isDownloading = false);
    }
  }

  // --- PDF HELPER METHOD ---
  pw.TableRow _buildPdfRow(String label1, String val1, String label2, String val2) {
    return pw.TableRow(
      children: [
        pw.Container(padding: const pw.EdgeInsets.all(5), color: PdfColors.grey100, child: pw.Text(label1, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
        pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text(val1, style: pw.TextStyle(fontSize: 10))),
        pw.Container(padding: const pw.EdgeInsets.all(5), color: PdfColors.grey100, child: pw.Text(label2, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
        pw.Container(padding: const pw.EdgeInsets.all(5), child: pw.Text(val2, style: pw.TextStyle(fontSize: 10))),
      ]
    );
  }

  void _handleBack() {
    if (currentView != 'list') {
      setState(() {
        currentView = 'list';
        selectedAdmitCard = null;
      });
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
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);

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
                                    const Text("Admit Card",
                                        style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                    Text("EXAMINATION PASS",
                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: const Icon(Icons.badge, color: Colors.white, size: 24),
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
                          child: _buildCurrentView(isDarkMode, cardColor, textColorPrimary, textColorSecondary),
                        ),
                      ),
                      const SizedBox(height: 50), // 🔥 BOTTOM PADDING 50 LOCKED
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
  Widget _buildCurrentView(bool isDarkMode, Color cardColor, Color textColorPrimary, Color textColorSecondary) {
    switch (currentView) {
      case 'list': return _buildListView(isDarkMode, cardColor, textColorPrimary, textColorSecondary);
      case 'vault': return _buildVaultView(isDarkMode, cardColor, textColorPrimary, textColorSecondary);
      case 'success': return _buildSuccessView();
      case 'download': return _buildDownloadView(isDarkMode, cardColor, textColorPrimary, textColorSecondary);
      default: return const SizedBox.shrink();
    }
  }

  // 1. LIST VIEW
  Widget _buildListView(bool isDarkMode, Color cardColor, Color textColorPrimary, Color textColorSecondary) {
    if (admitCards.isEmpty) {
      return AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(45),
          border: Border.all(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA)),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))]
        ),
        child: Column(
          children: [
            const Icon(Icons.assignment_ind, size: 60, color: Color(0xFFDBEAFE)),
            const SizedBox(height: 16),
            Text("NO ADMIT CARDS", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
            const SizedBox(height: 8),
            Text("Your hall ticket has not been issued yet.", textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5)),
          ],
        ),
      ).animate().fadeIn().slideY(begin: 0.1);
    }

    return Column(
      children: admitCards.asMap().entries.map((entry) {
        int idx = entry.key;
        var ac = entry.value;

        return GestureDetector(
          onTap: () => _handleSelectCard(ac),
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
                  :  [
                          const Color(0xFFEFF6FF),
                          Colors.white,
                          const Color(0xFFDBEAFE)
                        ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(40),
              border: Border.all(color: isDarkMode ? const Color(0xFF42A5F5).withOpacity(0.3) : Colors.white),
              boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(isDarkMode ? 0.1 : 0.15), blurRadius: 30, offset: const Offset(0, 15))]
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.25), blurRadius: 15, offset: const Offset(0, 5))]
                      ),
                      child: const Icon(Icons.badge, color: Color(0xFF42A5F5), size: 28),
                    ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1, 1), end: const Offset(1.05, 1.05), duration: 1.seconds),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (ac['examType'] ?? '').toString().toUpperCase(),
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF38BDF8) : Colors.black87, fontStyle: FontStyle.italic, letterSpacing: 1),
                          ),
                          Text(
                            "BATCH: ${ac['batch']}",
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: isDarkMode ? const Color(0xFF38BDF8) : Colors.black87, letterSpacing: 2),
                          ),
                        ],
                      ),
                    )
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  "AUTHENTICATE & DOWNLOAD",
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF38BDF8) : Colors.black87, letterSpacing: 3, fontStyle: FontStyle.italic),
                ).animate(onPlay: (c) => c.repeat(reverse: true)).fade(begin: 0.5, end: 1.0, duration: 1.5.seconds)
              ],
            ),
          ).animate().fadeIn(delay: Duration(milliseconds: 100 * idx)).slideY(begin: 0.1),
        );
      }).toList(),
    );
  }

  // 2. VAULT VIEW
  Widget _buildVaultView(bool isDarkMode, Color cardColor, Color textColorPrimary, Color textColorSecondary) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(45),
        border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
      ),
      child: Column(
        children: [
          Container(
            width: 80, height: 80,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFF42A5F5), Color(0xFF64B5F6)]),
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)]
            ),
            child: const Icon(Icons.security, color: Colors.white, size: 36),
          ),
          const SizedBox(height: 20),
          Text("VERIFY YOUR IDENTITY", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
          const SizedBox(height: 8),
          Text("ENTER DETAILS TO UNLOCK\n${selectedAdmitCard?['examType']}", textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1.5)),
          const SizedBox(height: 32),
          
          _buildVaultInput("FULL NAME", _nameCtrl, isDarkMode),
          const SizedBox(height: 16),
          _buildVaultInput("REGISTERED PHONE", _phoneCtrl, isDarkMode, isPhone: true),
          const SizedBox(height: 16),
          _buildVaultInput("ENROLLMENT NUMBER", _enrollCtrl, isDarkMode),
          const SizedBox(height: 32),

          GestureDetector(
            onTap: _handleValidationSubmit,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF42A5F5), Color(0xFF1E88E5)]),
                borderRadius: BorderRadius.circular(35),
                boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
              ),
              alignment: Alignment.center,
              child: const Text("AUTHENTICATE", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 3, fontStyle: FontStyle.italic)),
            ),
          ).animate().scale()
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _buildVaultInput(String hint, TextEditingController ctrl, bool isDarkMode, {bool isPhone = false}) {
    return Container(
      decoration: BoxDecoration(
        color: isDarkMode ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDarkMode ? const Color(0xFF334155) : Colors.blue.shade100),
      ),
      child: TextField(
        controller: ctrl,
        keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isDarkMode ? Colors.white : const Color(0xFF1E293B), fontStyle: FontStyle.italic),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
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
            width: 120, height: 120,
            decoration: BoxDecoration(
              color: const Color(0xFFD1FAE5),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFECFDF5), width: 8),
              boxShadow: [BoxShadow(color: const Color(0xFF34D399).withOpacity(0.5), blurRadius: 40)]
            ),
            child: const Icon(Icons.check, color: Color(0xFF10B981), size: 60).animate().scale(delay: 200.ms, duration: 400.ms, curve: Curves.easeOutBack),
          ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
          const SizedBox(height: 32),
          const Text("IDENTITY VERIFIED", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF059669), letterSpacing: 3, fontStyle: FontStyle.italic)).animate().fadeIn(delay: 400.ms)
        ],
      ),
    );
  }

  // 4. DOWNLOAD VIEW
  Widget _buildDownloadView(bool isDarkMode, Color cardColor, Color textColorPrimary, Color textColorSecondary) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(45),
        border: Border.all(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA)),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
      ),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              Container(
                width: 90, height: 90,
                decoration: BoxDecoration(
                  color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100),
                ),
                child: const Icon(Icons.file_download, color: Color(0xFF42A5F5), size: 40),
              ),
              Positioned(
                bottom: -5, right: -5,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle, border: Border.fromBorderSide(BorderSide(color: Colors.white, width: 3))),
                  child: const Icon(Icons.check, color: Colors.white, size: 14),
                ),
              )
            ],
          ),
          const SizedBox(height: 24),
          Text("ADMIT CARD READY", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
          const SizedBox(height: 8),
          Text(selectedAdmitCard?['examType'] ?? '', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 2)),
          const SizedBox(height: 40),

          GestureDetector(
            onTap: isDownloading ? null : _generatePDF,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF42A5F5), Color(0xFF1E88E5)]),
                borderRadius: BorderRadius.circular(35),
                boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  isDownloading 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                    : const Icon(Icons.download_for_offline, color: Colors.white, size: 24),
                  const SizedBox(width: 12),
                  Text(isDownloading ? "GENERATING..." : "DOWNLOAD PDF", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                ],
              ),
            ),
          ).animate().scale()
        ],
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
  }
}
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // 🔥 NAYA IMPORT FOR TEXT FORMATTER
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

// 🔥 SMART TIME FORMATTER (12-Hour strict validation & Auto-Correction) 🔥
class TimeTextInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // 1. Sirf numbers ko extract karo, baaki sab hata do (incl. colon)
    String text = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (text.isEmpty) return newValue;

    String formatted = '';

    for (int i = 0; i < text.length; i++) {
      int digit = int.parse(text[i]);

      if (i == 0) {
        // HOURS TENS: Agar user 2-9 dabata hai, toh auto '0' laga do (e.g., 9 ban jayega 09)
        if (digit > 1) {
          formatted += '0$digit';
        } else {
          formatted += digit.toString();
        }
      } else if (i == 1) {
        // HOURS ONES: Agar pehla digit 1 hai, toh dusra digit sirf 0, 1, 2 ho sakta hai
        if (formatted[0] == '1' && digit > 2) {
          formatted += '2'; // Agar 13 likhne ki koshish ki, toh automatic 12 ban jayega
        } else {
          formatted += digit.toString();
        }
      } else if (i == 2) {
        // MINUTES TENS: 6, 7, 8, 9 dabane par auto 5 ban jayega (taaki max 59 ho)
        if (digit > 5) {
          formatted += '5';
        } else {
          formatted += digit.toString();
        }
      } else if (i == 3) {
        // MINUTES ONES: 0-9 sab allowed hai
        formatted += digit.toString();
      }
    }

    // 2. Colon (:) Auto-Insert logic
    if (formatted.length >= 3) {
      formatted = '${formatted.substring(0, 2)}:${formatted.substring(2)}';
    }

    // 3. Max length limit (HH:MM = 5 chars)
    if (formatted.length > 5) {
      formatted = formatted.substring(0, 5);
    }

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class TeacherLiveClass extends ConsumerStatefulWidget {
  const TeacherLiveClass({super.key});

  @override
  ConsumerState<TeacherLiveClass> createState() => _TeacherLiveClassState();
}

class _TeacherLiveClassState extends ConsumerState<TeacherLiveClass> {
  bool isLoading = true;
  String viewMode = 'requests'; // 'requests', 'new', 'monitor'
  
  Map<String, dynamic>? user;
  List<dynamic> setupData = [];
  List<dynamic> myRequests = [];
  List<dynamic> monitorData = [];

  // Form State
  String formDataGrade = '';
  String formDataSubject = '';
  String formDataPlatform = 'Zoom';
  String formDataDate = '';
  String formDataFromTime = '';
  String formDataFromAmPm = 'AM';
  String formDataToTime = '';
  String formDataToAmPm = 'PM';

  // Dropdown States
  bool isGradeOpen = false;
  bool isSubjectOpen = false;
  bool isDateOpen = false;
  bool isFromAmPmOpen = false;
  bool isToAmPmOpen = false;
  DateTime viewDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _initData();
  }

  Future<void> _initData({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr != null) user = jsonDecode(userStr);

      final setupRes = await ApiClient.dio.get('/liveclass/setup-data');
      final reqRes = await ApiClient.dio.get('/liveclass/my-requests');
      
      dynamic monResData = [];
      if (user?['assignedClass'] != null) {
        final monRes = await ApiClient.dio.get('/liveclass/monitor/${user!['assignedClass']}');
        monResData = monRes.data;
      }

      if (mounted) {
        setState(() {
          setupData = setupRes.data ?? [];
          myRequests = reqRes.data ?? [];
          monitorData = monResData ?? [];
        });
      }
    } catch (e) {
      debugPrint("Fetch error: $e");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _handleBack() {
    if (viewMode == 'new' || viewMode == 'monitor') {
      setState(() => viewMode = 'requests');
    } else {
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/teacher/home');
      }
    }
  }

  Future<void> _launchURL(String url) async {
    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      _showToast("Could not launch link ⚠️", isError: true);
    }
  }

  // --- SUBMISSION LOGIC ---
  void _handlePreSubmit(bool isDarkMode, Color bgColor, Color textColor) {
    if (formDataGrade.isEmpty || formDataSubject.isEmpty || formDataDate.isEmpty || formDataFromTime.isEmpty || formDataToTime.isEmpty) {
      _showToast("Please fill all details! ⚠️", isError: true);
      return;
    }
    _showConfirmModal(isDarkMode, bgColor, textColor);
  }

  void _showConfirmModal(bool isDarkMode, Color bgColor, Color textColor) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Confirm Request',
      pageBuilder: (ctx, _, __) {
        return StatefulBuilder(builder: (context, setModalState) {
          bool isSubmitting = false;
          return Scaffold(
            backgroundColor: Colors.transparent,
            body: Stack(
              children: [
                GestureDetector(onTap: () => !isSubmitting ? Navigator.pop(ctx) : null, child: Container(color: Colors.black54)),
                Center(
                  child: Container(
                    width: MediaQuery.of(context).size.width * 0.85,
                    padding: const EdgeInsets.all(30),
                    decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(40)),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), shape: BoxShape.circle), child: const Icon(Icons.videocam, color: Color(0xFF42A5F5), size: 32)),
                        const SizedBox(height: 16),
                        Text("CONFIRM REQUEST", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColor, fontStyle: FontStyle.italic)),
                        const SizedBox(height: 12),
                        Text("Send live class request for $formDataSubject to class teacher?", textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => !isSubmitting ? Navigator.pop(ctx) : null,
                                child: Container(padding: const EdgeInsets.symmetric(vertical: 16), alignment: Alignment.center, decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)), child: const Text("CANCEL", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey))),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: GestureDetector(
                                onTap: () async {
                                  setModalState(() => isSubmitting = true);
                                  try {
                                    await ApiClient.dio.post('/liveclass/request', data: {
                                      'grade': formDataGrade,
                                      'subjectName': formDataSubject,
                                      'platform': formDataPlatform,
                                      'date': formDataDate,
                                      'startTime': '$formDataFromTime $formDataFromAmPm',
                                      'endTime': '$formDataToTime $formDataToAmPm'
                                    });
                                    if (!ctx.mounted) return;
                                    Navigator.pop(ctx);
                                    _showToast("Live Class Requested Successfully! 🎥");
                                    setState(() {
                                      viewMode = 'requests';
                                      formDataGrade = ''; formDataSubject = ''; formDataDate = ''; formDataFromTime = ''; formDataToTime = '';
                                    });
                                    _initData();
                                  } catch (e) {
                                    Navigator.pop(ctx);
                                    
                                    String errorMessage = "Failed to schedule class.";
                                    
                                    // 🔥 MAGIC FIX: Backend ka asli error message nikal rahe hain DioException se 🔥
                                    if (e is DioException && e.response != null && e.response?.data != null) {
                                      errorMessage = e.response?.data['message'] ?? "Server error occurred.";
                                    } else {
                                      errorMessage = e.toString();
                                    }

                                    // Ab check karo ki backend ne 'clash' ya 'overlap' bola hai kya
                                    if (errorMessage.toLowerCase().contains('clash') || errorMessage.toLowerCase().contains('overlap')) {
                                      _showClashErrorModal(errorMessage, isDarkMode, bgColor, textColor);
                                    } else {
                                      // Agar koi aur error hai toh normal red toast dikhao
                                      _showToast(errorMessage, isError: true);
                                    }
                                  }
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(20)),
                                  // ignore: dead_code
                                  child: isSubmitting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text("CONFIRM", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white)),
                                ),
                              ),
                            ),
                          ],
                        )
                      ],
                    ),
                  ).animate().scale(curve: Curves.easeOutBack, duration: 300.ms),
                ),
              ],
            ),
          );
        });
      },
    );
  }

  // --- MONITOR ACTION LOGIC ---
  void _showMonitorActionModal(String id, String action, bool isDarkMode, Color bgColor, Color textColor) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Action',
      pageBuilder: (ctx, _, __) {
        return StatefulBuilder(builder: (context, setModalState) {
          bool isActing = false;
          bool isApprove = action == 'approve';
          return Scaffold(
            backgroundColor: Colors.transparent,
            body: Stack(
              children: [
                GestureDetector(onTap: () => !isActing ? Navigator.pop(ctx) : null, child: Container(color: Colors.black54)),
                Center(
                  child: Container(
                    width: MediaQuery.of(context).size.width * 0.85,
                    padding: const EdgeInsets.all(30),
                    decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(40)),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: isApprove ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1), shape: BoxShape.circle), child: Icon(isApprove ? Icons.check_circle : Icons.delete, color: isApprove ? const Color(0xFF10B981) : const Color(0xFFF43F5E), size: 32)),
                        const SizedBox(height: 16),
                        Text("ARE YOU SURE?", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColor, fontStyle: FontStyle.italic)),
                        const SizedBox(height: 12),
                        Text(isApprove ? "Approve this live class? Links will be generated." : "Reject/Delete this request? Cannot be undone.", textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => !isActing ? Navigator.pop(ctx) : null,
                                child: Container(padding: const EdgeInsets.symmetric(vertical: 16), alignment: Alignment.center, decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)), child: const Text("CANCEL", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey))),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: GestureDetector(
                                onTap: () async {
                                  if (isActing) return;
                                  
                                  setModalState(() => isActing = true);
                                  try {
                                    if (isApprove) {
                                      await ApiClient.dio.put('/liveclass/approve/$id');
                                      _showToast("Class Approved! Links Generated.", isError: false);
                                    } else {
                                      await ApiClient.dio.delete('/liveclass/$id');
                                      _showToast("Request Removed.", isError: false);
                                    }
                                    if (!ctx.mounted) return;
                                    Navigator.pop(ctx);
                                    _initData();
                                  } catch (e) {
                                    if (!ctx.mounted) return;
                                    Navigator.pop(ctx);
                                    _showToast("Action failed.", isError: true);
                                  }
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(color: isApprove ? const Color(0xFF10B981) : const Color(0xFFF43F5E), borderRadius: BorderRadius.circular(20)),
                                  child:const Text("CONFIRM", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white))
                                ),
                              ),
                            ),
                          ],
                        )
                      ],
                    ),
                  ).animate().scale(curve: Curves.easeOutBack, duration: 300.ms),
                ),
              ],
            ),
          );
        });
      },
    );
  }

  void _showClashErrorModal(String error, bool isDarkMode, Color bgColor, Color textColor) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Clash',
      pageBuilder: (ctx, _, __) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              GestureDetector(onTap: () => Navigator.pop(ctx), child: Container(color: Colors.black54)),
              Center(
                child: Container(
                  width: MediaQuery.of(context).size.width * 0.85,
                  padding: const EdgeInsets.all(30),
                  decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: Colors.red.withOpacity(0.3), width: 4)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), shape: BoxShape.circle), child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFF43F5E), size: 40)),
                      const SizedBox(height: 16),
                      Text("SCHEDULE OVERLAP", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColor, fontStyle: FontStyle.italic)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0))),
                        child: Text(error, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                      ),
                      const SizedBox(height: 24),
                      GestureDetector(
                        onTap: () => Navigator.pop(ctx),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(color: isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A), borderRadius: BorderRadius.circular(25)),
                          child: Text("OKAY, I UNDERSTAND", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF0F172A) : Colors.white, letterSpacing: 2)),
                        ),
                      )
                    ],
                  ),
                ).animate().scale(curve: Curves.easeOutBack, duration: 300.ms),
              ),
            ],
          ),
        );
      },
    );
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
    if (isLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    List<String> availableSubjects = [];
    if (formDataGrade.isNotEmpty) {
      final match = setupData.firstWhere((d) => d['grade'] == formDataGrade, orElse: () => null);
      if (match != null) availableSubjects = List<String>.from(match['subjects'] ?? []);
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack(); 
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: cardColor,
          onRefresh: () => _initData(isRefresh: true),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()), 
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    // --- HEADER ---
                    Container(
                      padding: const EdgeInsets.only(top: 60, bottom: 40, left: 24, right: 24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isDarkMode 
                              ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                              : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                          begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: _handleBack,
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                              child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text("Live Classes", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
                              Text(viewMode == 'monitor' ? "CLASS ${user?['assignedClass'] ?? ''} MONITOR" : "DIGITAL BROADCASTS", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                            child: const Icon(Icons.videocam, color: Colors.white, size: 24),
                          ),
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- NAVIGATION TOGGLES ---
                    if (viewMode != 'new')
                      Transform.translate(
                        offset: const Offset(0, -20),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(30), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
                            child: Column(
                              children: [
                                GestureDetector(
                                  onTap: () => setState(() => viewMode = 'new'),
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.3), blurRadius: 8)]),
                                    child: const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.add, color: Colors.white, size: 18),
                                        SizedBox(width: 8),
                                        Text("SCHEDULE NEW CLASS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                      ],
                                    ),
                                  ),
                                ),
                                if (user?['assignedClass'] != null) ...[
                                  const SizedBox(height: 12),
                                  GestureDetector(
                                    onTap: () => setState(() => viewMode = viewMode == 'monitor' ? 'requests' : 'monitor'),
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                      decoration: BoxDecoration(color: viewMode == 'monitor' ? (isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A)) : (isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : const Color(0xFFEFF6FF)), borderRadius: BorderRadius.circular(20)),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.monitor, color: viewMode == 'monitor' ? (isDarkMode ? const Color(0xFF0F172A) : Colors.white) : const Color(0xFF42A5F5), size: 18),
                                          const SizedBox(width: 8),
                                          Text(viewMode == 'monitor' ? "MY SCHEDULES" : "CLASS MONITOR HUB", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: viewMode == 'monitor' ? (isDarkMode ? const Color(0xFF0F172A) : Colors.white) : const Color(0xFF42A5F5), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                        ],
                                      ),
                                    ),
                                  )
                                ]
                              ],
                            ),
                          ),
                        ),
                      ),

                    // --- MY REQUESTS LIST ---
                    if (viewMode == 'requests')
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: myRequests.isEmpty
                            ? Container(padding: const EdgeInsets.all(40), width: double.infinity, decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder, style: BorderStyle.solid)), child: Column(children: [const Icon(Icons.videocam_off, size: 40, color: Colors.grey), const SizedBox(height: 16), const Text("NO CLASSES SCHEDULED", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, fontStyle: FontStyle.italic, letterSpacing: 2))]))
                            : Column(
                                children: myRequests.map((req) {
                                  bool isApproved = req['status'] == 'approved';
                                  bool isRejected = req['status'] == 'rejected';
                                  Color statusColor = isApproved ? const Color(0xFF10B981) : (isRejected ? const Color(0xFFF43F5E) : const Color(0xFFF59E0B));
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 20),
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: isApproved ? const Color(0xFF10B981).withOpacity(0.3) : cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
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
                                                  Text(req['subjectName'].toString().toUpperCase(), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                                  const SizedBox(height: 4),
                                                  Text("CLASS ${req['grade']}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColorSecondary, letterSpacing: 1.5)),
                                                ],
                                              ),
                                            ),
                                            Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(16)), child: Text(req['status'].toString().toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: statusColor, letterSpacing: 1.5, fontStyle: FontStyle.italic))),
                                          ],
                                        ),
                                        const SizedBox(height: 20),
                                        Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                          child: Column(
                                            children: [
                                              Row(children: [const Icon(Icons.calendar_today, size: 14, color: Color(0xFF8B5CF6)), const SizedBox(width: 8), Text(req['date'], style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary))]),
                                              const SizedBox(height: 10),
                                              Row(children: [const Icon(Icons.access_time, size: 14, color: Color(0xFF8B5CF6)), const SizedBox(width: 8), Text("${req['startTime']} - ${req['endTime']}", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary))]),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 20),
                                        if (isApproved)
                                          GestureDetector(
                                            onTap: () => _launchURL(req['hostLink']),
                                            child: Container(width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 16), alignment: Alignment.center, decoration: BoxDecoration(color: isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A), borderRadius: BorderRadius.circular(20)), child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.link, color: isDarkMode ? const Color(0xFF0F172A) : Colors.white, size: 14), const SizedBox(width: 8), Text("START HOSTING ON ${req['platform'].toString().toUpperCase()}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF0F172A) : Colors.white, letterSpacing: 1.5, fontStyle: FontStyle.italic))])),
                                          )
                                        else
                                          Container(width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 16), alignment: Alignment.center, decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)), child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.schedule, color: textColorSecondary, size: 14), const SizedBox(width: 8), Text("AWAITING APPROVAL", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic))])),
                                      ],
                                    ),
                                  ).animate().fadeIn().slideY(begin: 0.1);
                                }).toList(),
                              ),
                      ),

                    // --- NEW CLASS FORM ---
                    if (viewMode == 'new')
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: const Color(0xFF42A5F5).withOpacity(0.3)), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [const Icon(Icons.ondemand_video, color: Color(0xFF42A5F5), size: 24), const SizedBox(width: 12), Text("SCHEDULE CLASS", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic))]),
                              const SizedBox(height: 24),

                              // GRADE
                              const Text("SELECT CLASS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic)),
                              const SizedBox(height: 8),
                              GestureDetector(
                                onTap: () => setState(() => isGradeOpen = !isGradeOpen),
                                child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: isGradeOpen ? const Color(0xFF42A5F5) : cardBorder)), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(formDataGrade.isNotEmpty ? "CLASS $formDataGrade" : "Select Class", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: formDataGrade.isNotEmpty ? textColorPrimary : Colors.grey, fontStyle: FontStyle.italic)), Icon(isGradeOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: const Color(0xFF42A5F5))])),
                              ),
                              AnimatedSize(
                                duration: const Duration(milliseconds: 300),
                                child: isGradeOpen ? Container(margin: const EdgeInsets.only(top: 8), decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)), child: ListView.builder(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), padding: const EdgeInsets.all(8), itemCount: setupData.length, itemBuilder: (ctx, i) {
                                  return GestureDetector(onTap: () => setState(() { formDataGrade = setupData[i]['grade']; formDataSubject = ''; isGradeOpen = false; }), child: Container(padding: const EdgeInsets.all(12), color: Colors.transparent, child: Text("CLASS ${setupData[i]['grade']}", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: formDataGrade == setupData[i]['grade'] ? const Color(0xFF42A5F5) : textColorSecondary, fontStyle: FontStyle.italic))));
                                })) : const SizedBox.shrink(),
                              ),
                              const SizedBox(height: 20),

                              // SUBJECT
                              const Text("SELECT SUBJECT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic)),
                              const SizedBox(height: 8),
                              GestureDetector(
                                onTap: formDataGrade.isNotEmpty ? () => setState(() => isSubjectOpen = !isSubjectOpen) : null,
                                child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: formDataGrade.isNotEmpty ? inputBg : cardBorder.withOpacity(0.5), borderRadius: BorderRadius.circular(20), border: Border.all(color: isSubjectOpen ? const Color(0xFF42A5F5) : cardBorder)), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(formDataSubject.isNotEmpty ? formDataSubject : "Select Subject", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: formDataSubject.isNotEmpty ? textColorPrimary : Colors.grey, fontStyle: FontStyle.italic)), Icon(isSubjectOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: formDataGrade.isNotEmpty ? const Color(0xFF42A5F5) : Colors.grey)])),
                              ),
                              AnimatedSize(
                                duration: const Duration(milliseconds: 300),
                                child: isSubjectOpen ? Container(margin: const EdgeInsets.only(top: 8), decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)), child: ListView.builder(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), padding: const EdgeInsets.all(8), itemCount: availableSubjects.length, itemBuilder: (ctx, i) {
                                  return GestureDetector(onTap: () => setState(() { formDataSubject = availableSubjects[i]; isSubjectOpen = false; }), child: Container(padding: const EdgeInsets.all(12), color: Colors.transparent, child: Text(availableSubjects[i].toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: formDataSubject == availableSubjects[i] ? const Color(0xFF42A5F5) : textColorSecondary, fontStyle: FontStyle.italic))));
                                })) : const SizedBox.shrink(),
                              ),
                              const SizedBox(height: 20),

                              // DATE
                              const Text("DATE OF CLASS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic)),
                              const SizedBox(height: 8),
                              GestureDetector(
                                onTap: () => setState(() => isDateOpen = !isDateOpen),
                                child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: isDateOpen ? const Color(0xFF42A5F5) : cardBorder)), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(formDataDate.isNotEmpty ? formDataDate : "Select Date", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: formDataDate.isNotEmpty ? textColorPrimary : Colors.grey, fontStyle: FontStyle.italic)), const Icon(Icons.calendar_today, color: Color(0xFF42A5F5), size: 18)])),
                              ),
                              AnimatedSize(
                                duration: const Duration(milliseconds: 300),
                                child: isDateOpen ? Container(
                                  margin: const EdgeInsets.only(top: 8), padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                  child: Column(
                                    children: [
                                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [GestureDetector(onTap: () => setState(() => viewDate = DateTime(viewDate.year, viewDate.month - 1, 1)), child: const Padding(padding: EdgeInsets.all(8.0), child: Icon(Icons.arrow_back_ios, size: 14))), Text(DateFormat('MMM yyyy').format(viewDate).toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5))), GestureDetector(onTap: () => setState(() => viewDate = DateTime(viewDate.year, viewDate.month + 1, 1)), child: const Padding(padding: EdgeInsets.all(8.0), child: Icon(Icons.arrow_forward_ios, size: 14)))]),
                                      const SizedBox(height: 12),
                                      Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: ["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => Text(d, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey))).toList()),
                                      const SizedBox(height: 8),
                                      GridView.builder(
                                        shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, childAspectRatio: 1),
                                        itemCount: DateTime(viewDate.year, viewDate.month + 1, 0).day + (DateTime(viewDate.year, viewDate.month, 1).weekday - 1),
                                        itemBuilder: (ctx, i) {
                                          int startOffset = DateTime(viewDate.year, viewDate.month, 1).weekday - 1;
                                          if (i < startOffset) return const SizedBox();
                                          int day = i - startOffset + 1;
                                          DateTime currentDt = DateTime(viewDate.year, viewDate.month, day);
                                          bool isPast = currentDt.isBefore(DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day));
                                          bool isSunday = currentDt.weekday == 7;
                                          bool isLocked = isPast || isSunday;
                                          String formatDt = DateFormat('dd-MM-yyyy').format(currentDt);
                                          return GestureDetector(
                                            onTap: isLocked ? null : () => setState(() { formDataDate = formatDt; isDateOpen = false; }),
                                            child: Container(alignment: Alignment.center, margin: const EdgeInsets.all(2), decoration: BoxDecoration(color: formDataDate == formatDt ? const Color(0xFF42A5F5) : Colors.transparent, borderRadius: BorderRadius.circular(8)), child: Text(day.toString(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isLocked ? Colors.grey.withOpacity(0.3) : (formDataDate == formatDt ? Colors.white : textColorPrimary)))),
                                          );
                                        },
                                      )
                                    ],
                                  )
                                ) : const SizedBox.shrink(),
                              ),
                              const SizedBox(height: 20),

                              // TIME (🔥 SMART MASKING ADDED HERE 🔥)
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Row(children: [Icon(Icons.access_time, size: 16, color: Color(0xFF42A5F5)), SizedBox(width: 8), Text("DURATION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic))]),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        // FROM TIME INPUT
                                        Expanded(
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12), 
                                            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)), 
                                            child: Row(
                                              children: [
                                                Expanded(
                                                  child: TextField(
                                                    onChanged: (v) => formDataFromTime = v, 
                                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary), 
                                                    decoration: InputDecoration(hintText: "09:00", hintStyle: TextStyle(color: Colors.grey.withOpacity(0.5)), border: InputBorder.none), 
                                                    keyboardType: TextInputType.number, 
                                                    maxLength: 5,
                                                    inputFormatters: [TimeTextInputFormatter()], // 🔥 AUTO-COLON LOGIC INJECTED
                                                    buildCounter: (ctx, {required currentLength, required isFocused, maxLength}) => null
                                                  )
                                                ), 
                                                GestureDetector(
                                                  onTap: () => setState(() => isFromAmPmOpen = !isFromAmPmOpen), 
                                                  child: Text(formDataFromAmPm, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5)))
                                                )
                                              ]
                                            )
                                          )
                                        ),
                                        const Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text("TO", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey))),
                                        
                                        // TO TIME INPUT
                                        Expanded(
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12), 
                                            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)), 
                                            child: Row(
                                              children: [
                                                Expanded(
                                                  child: TextField(
                                                    onChanged: (v) => formDataToTime = v, 
                                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary), 
                                                    decoration: InputDecoration(hintText: "10:00", hintStyle: TextStyle(color: Colors.grey.withOpacity(0.5)), border: InputBorder.none), 
                                                    keyboardType: TextInputType.number, 
                                                    maxLength: 5,
                                                    inputFormatters: [TimeTextInputFormatter()], // 🔥 AUTO-COLON LOGIC INJECTED
                                                    buildCounter: (ctx, {required currentLength, required isFocused, maxLength}) => null
                                                  )
                                                ), 
                                                GestureDetector(
                                                  onTap: () => setState(() => isToAmPmOpen = !isToAmPmOpen), 
                                                  child: Text(formDataToAmPm, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5)))
                                                )
                                              ]
                                            )
                                          )
                                        ),
                                      ],
                                    ),
                                    if (isFromAmPmOpen || isToAmPmOpen)
                                      Row(
                                          children: [
                                          Expanded(child: isFromAmPmOpen ? Container(margin: const EdgeInsets.only(top: 4), color: cardColor, child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: ["AM", "PM"].map((p) => GestureDetector(onTap: () => setState(() { formDataFromAmPm = p; isFromAmPmOpen = false; }), child: Padding(padding: const EdgeInsets.all(8.0), child: Text(p, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: formDataFromAmPm == p ? const Color(0xFF42A5F5) : textColorSecondary))))).toList())) : const SizedBox()),
                                          const SizedBox(width: 40),
                                          Expanded(child: isToAmPmOpen ? Container(margin: const EdgeInsets.only(top: 4), color: cardColor, child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: ["AM", "PM"].map((p) => GestureDetector(onTap: () => setState(() { formDataToAmPm = p; isToAmPmOpen = false; }), child: Padding(padding: const EdgeInsets.all(8.0), child: Text(p, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: formDataToAmPm == p ? const Color(0xFF42A5F5) : textColorSecondary))))).toList())) : const SizedBox()),
                                        ],
                                      )
                                  ],
                                ),
                              ),
                              const SizedBox(height: 32),

                              GestureDetector(
                                onTap: () => _handlePreSubmit(isDarkMode, cardColor, textColorPrimary),
                                child: Container(
                                  width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 20),
                                  decoration: BoxDecoration(color: isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A), borderRadius: BorderRadius.circular(30), border: Border(bottom: BorderSide(color: isDarkMode ? Colors.grey.shade400 : Colors.black, width: 4))),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.send, size: 16, color: isDarkMode ? const Color(0xFF0F172A) : Colors.white),
                                      const SizedBox(width: 10),
                                      Text("REQUEST CLASS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF0F172A) : Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                    ],
                                  ),
                                ),
                              )
                            ],
                          ),
                        ),
                      ).animate().fadeIn().slideY(begin: 0.1),

                    // --- MONITOR HUB ---
                    if (viewMode == 'monitor')
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: monitorData.isEmpty
                            ? Container(padding: const EdgeInsets.all(40), width: double.infinity, decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder, style: BorderStyle.solid)), child: Column(children: [const Icon(Icons.monitor, size: 40, color: Colors.grey), const SizedBox(height: 16), Text("NO PENDING REQUESTS FOR CLASS ${user?['assignedClass']}", textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, fontStyle: FontStyle.italic, letterSpacing: 2))]))
                            : Column(
                                children: monitorData.map((req) {
                                  bool isPending = req['status'] == 'pending';
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 20),
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
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
                                                  Text(req['subjectName'].toString().toUpperCase(), style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                                  const SizedBox(height: 4),
                                                  Text("REQUESTED BY: ${req['proposerName']}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textColorSecondary, letterSpacing: 1.5)),
                                                ],
                                              ),
                                            ),
                                            Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: (req['status'] == 'approved' ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withOpacity(0.1), borderRadius: BorderRadius.circular(16)), child: Text("STATUS: ${req['status'].toString().toUpperCase()}", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: req['status'] == 'approved' ? const Color(0xFF10B981) : const Color(0xFFF59E0B), letterSpacing: 1.5, fontStyle: FontStyle.italic))),
                                          ],
                                        ),
                                        const SizedBox(height: 20),
                                        Row(
                                          children: [
                                            Expanded(child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)), child: Column(children: [const Text("PLATFORM", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)), const SizedBox(height: 4), Text(req['platform'], style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary))]))),
                                            const SizedBox(width: 12),
                                            Expanded(
                                      child: Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: inputBg,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: cardBorder),
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text("SCHEDULE", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
        const SizedBox(height: 4),
        Text(req['date'], style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary)),
        const SizedBox(height: 2),
        // 🔥 Yahan FittedBox lagaya hai taaki time hamesha aamne-saamne ek line me rahe 🔥
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            "${req['startTime']} - ${req['endTime']}",
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorPrimary),
          ),
        ),
      ],
    ),
  ),
)
                                          ],
                                        ),
                                        const SizedBox(height: 24),
                                        if (isPending)
                                          Row(
                                            children: [
                                              Expanded(child: GestureDetector(onTap: () => _showMonitorActionModal(req['_id'], 'approve', isDarkMode, cardColor, textColorPrimary), child: Container(padding: const EdgeInsets.symmetric(vertical: 16), alignment: Alignment.center, decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.4), blurRadius: 8)]), child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.check_circle, color: Colors.white, size: 14), SizedBox(width: 6), Text("APPROVE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5))])))),
                                              const SizedBox(width: 12),
                                              Expanded(child: GestureDetector(onTap: () => _showMonitorActionModal(req['_id'], 'reject', isDarkMode, cardColor, textColorPrimary), child: Container(padding: const EdgeInsets.symmetric(vertical: 16), alignment: Alignment.center, decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.1), borderRadius: BorderRadius.circular(20)), child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.close, color: Color(0xFFF43F5E), size: 14), SizedBox(width: 6), Text("REJECT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFFF43F5E), letterSpacing: 1.5))])))),
                                            ],
                                          )
                                        else
                                          Row(
                                            children: [
                                              Expanded(child: GestureDetector(onTap: () => _launchURL(req['hostLink']), child: Container(padding: const EdgeInsets.symmetric(vertical: 16), alignment: Alignment.center, decoration: BoxDecoration(color: isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A), borderRadius: BorderRadius.circular(20)), child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.link, color: isDarkMode ? const Color(0xFF0F172A) : Colors.white, size: 14), const SizedBox(width: 6), Text("REVIEW HOST LINK", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF0F172A) : Colors.white, letterSpacing: 1.5))])))),
                                              const SizedBox(width: 12),
                                              GestureDetector(onTap: () => _showMonitorActionModal(req['_id'], 'reject', isDarkMode, cardColor, textColorPrimary), child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.1), borderRadius: BorderRadius.circular(20)), child: const Icon(Icons.delete, color: Color(0xFFF43F5E), size: 18))),
                                            ],
                                          )
                                      ],
                                    ),
                                  ).animate().fadeIn().slideY(begin: 0.1);
                                }).toList(),
                              ),
                      ),
                    
                    const SizedBox(height: 50), // 🔥 EXACT 50PX BOTTOM PADDING LOCKED 🔥
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
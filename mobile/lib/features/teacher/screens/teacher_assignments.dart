import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:file_selector/file_selector.dart';
import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/constants/app_config.dart'; // 🔥 APNA IP SYSTEM 🔥

class TeacherAssignments extends ConsumerStatefulWidget {
  const TeacherAssignments({super.key});

  @override
  ConsumerState<TeacherAssignments> createState() => _TeacherAssignmentsState();
}

class _TeacherAssignmentsState extends ConsumerState<TeacherAssignments> {
  bool isLoading = true;
  bool isUploading = false;
  Map<String, dynamic>? user;
  List<dynamic> teacherSubjects = [];

  String viewMode = 'create'; // 'create', 'history', 'submissions'
  
  List<dynamic> grades = [];
  List<dynamic> assignments = [];
  List<dynamic> activeSubmissions = [];
  String? activeAssignmentId;

  // Form State
  String selectedGrade = '';
  String selectedSubject = '';
  DateTime dueDate = DateTime.now();
  String totalMarks = '';
  String title = '';
  String description = '';
  XFile? attachedFile;
  String uploadedFileUrl = '';

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
      if (userStr != null) {
        user = jsonDecode(userStr);
        teacherSubjects = user?['subjects'] ?? [];
      }

      await Future.wait([
        _fetchGrades(),
        if (viewMode == 'history' || viewMode == 'create') _fetchHistory(),
        if (viewMode == 'submissions' && activeAssignmentId != null) _fetchSubmissions(activeAssignmentId!),
      ]);

    } catch (e) {
      _showToast("Failed to sync data", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _fetchGrades() async {
    try {
      final res = await ApiClient.dio.get('/users/grades/all');
      if (mounted) {
        List<dynamic> rawGrades = res.data ?? [];
        
        // 🔥 SMART SORTING LOGIC FOR CLASSES 🔥
        rawGrades.sort((a, b) {
          String g1 = a.toString().trim();
          String g2 = b.toString().trim();

          // Har class ko ek numerical "weight" assign karenge
          int getWeight(String grade) {
            String g = grade.toLowerCase();
            if (g.contains('play') || g.contains('pre')) return -4;
            if (g.contains('nur')) return -3;
            if (g.contains('lkg') || g.contains('kg1')) return -2;
            if (g.contains('ukg') || g.contains('kg2')) return -1;
            
            // Agar number hai (e.g. "1", "9-A", "12th"), toh wahi number nikaalo
            final match = RegExp(r'\d+').firstMatch(g);
            if (match != null) return int.parse(match.group(0)!);
            
            return 999; // Agar kuch aur ulta-seedha hai toh sabse last mein daal do
          }

          int weight1 = getWeight(g1);
          int weight2 = getWeight(g2);

          // Agar dono ka weight alag hai, toh chote se bada sort karo (Ascending)
          if (weight1 != weight2) {
            return weight1.compareTo(weight2);
          }
          // Agar dono ka weight same hai (e.g. "10-A" aur "10-B"), toh alphabetically sort karo
          return g1.compareTo(g2);
        });

        setState(() => grades = rawGrades);
      }
    } catch (e) {
      debugPrint("Grades load error");
    }
  }

  Future<void> _fetchHistory() async {
    try {
      final res = await ApiClient.dio.get('/assignments/teacher/my-assignments');
      if (mounted) setState(() => assignments = res.data ?? []);
    } catch (e) {
      debugPrint("History load error");
    }
  }

  Future<void> _fetchSubmissions(String id) async {
    setState(() => isLoading = true);
    try {
      activeAssignmentId = id;
      final res = await ApiClient.dio.get('/assignments/submissions/$id');
      if (mounted) {
        setState(() {
          activeSubmissions = res.data ?? [];
          viewMode = 'submissions';
        });
      }
    } catch (e) {
      _showToast("Submissions load error", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _handleFileChange() async {
    final XFile? file = await openFile(acceptedTypeGroups: []);
    if (file == null) return;
    
    setState(() => isUploading = true);
    try {
      FormData formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path, filename: file.name),
      });
      final res = await ApiClient.dio.post('/upload', data: formData);
      setState(() {
        uploadedFileUrl = res.data.toString();
        attachedFile = file;
      });
    } catch (e) {
      _showToast("Upload Failed", isError: true);
    } finally {
      setState(() => isUploading = false);
    }
  }

  Future<void> _handleSubmit() async {
    if (selectedGrade.isEmpty || selectedSubject.isEmpty || title.isEmpty || totalMarks.isEmpty) {
      return _showToast("Class, Subject, Title & Marks are mandatory! 🛡️", isError: true);
    }

    setState(() => isLoading = true);
    try {
      await ApiClient.dio.post('/assignments/create', data: {
        'grade': selectedGrade,
        'subject': selectedSubject,
        'title': title,
        'description': description,
        'dueDate': DateFormat('yyyy-MM-dd').format(dueDate),
        'totalMarks': int.parse(totalMarks),
        'fileUrl': uploadedFileUrl
      });

      _showToast("Assignment Deployed Successfully! 🚀");
      setState(() {
        selectedGrade = '';
        selectedSubject = '';
        title = '';
        description = '';
        totalMarks = '';
        attachedFile = null;
        uploadedFileUrl = '';
      });
      _fetchHistory(); // Refresh list silently
    } catch (e) {
      _showToast("Deployment Failed", isError: true);
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _confirmDelete(String id) async {
    setState(() => isLoading = true);
    try {
      await ApiClient.dio.delete('/assignments/$id');
      setState(() => assignments.removeWhere((a) => a['_id'] == id));
      _showToast("Assignment deleted! 🗑️");
    } catch (e) {
      _showToast("Purge Failed! 🛡️", isError: true);
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _handleBack() {
    if (viewMode == 'submissions') {
      setState(() => viewMode = 'history');
    } else if (viewMode == 'history') {
      setState(() => viewMode = 'create');
    } else {
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/teacher/home');
      }
    }
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
    if (isLoading && viewMode != 'submissions') return const CustomLoader(); // Soft reload for grades

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

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
                          colors: isDarkMode ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                          begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                      ),
                      child: Column(
                        children: [
                          Row(
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
                                children: [
                                  Text(
                                    viewMode == 'submissions' ? "Evaluation Hub" : "Assignments", 
                                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)
                                  ),
                                  Text(
                                    viewMode == 'create' ? "CREATE & MANAGE" : (viewMode == 'history' ? "PAST ASSIGNMENTS" : "STUDENT SUBMISSIONS"), 
                                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                                child: Icon(
                                  viewMode == 'submissions' ? Icons.grading : Icons.assignment, 
                                  color: Colors.white, size: 24
                                ),
                              ),
                            ],
                          ),
                          
                          // Toggle Button (Create New <-> View History)
                          if (viewMode != 'submissions') ...[
                            const SizedBox(height: 24),
                            Align(
                              alignment: Alignment.centerRight,
                              child: GestureDetector(
                                onTap: () => setState(() => viewMode = viewMode == 'create' ? 'history' : 'create'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(viewMode == 'create' ? Icons.history : Icons.add, color: const Color(0xFF42A5F5), size: 16),
                                      const SizedBox(width: 8),
                                      Text(viewMode == 'create' ? "VIEW HISTORY" : "CREATE NEW", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                    ],
                                  ),
                                ).animate().scale(curve: Curves.easeOutBack),
                              ),
                            )
                          ]
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- BODY ---
                    Transform.translate(
                      offset: const Offset(0, -20),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 400),
                          child: viewMode == 'create' 
                               ? _buildCreateView(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary, inputBg)
                               : viewMode == 'history' 
                                  ? _buildHistoryView(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary)
                                  : _buildSubmissionsView(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary, inputBg),
                        ),
                      ),
                    ),
                    const SizedBox(height: 50),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  // --- VIEW 1: CREATE ASSIGNMENT ---
  Widget _buildCreateView(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary, Color inputBg) {
    return Container(
      key: const ValueKey('create'),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // GRADE SELECTOR
          _buildLabel("SELECT CLASS", textColorSecondary),
          GestureDetector(
            onTap: () => _showListBottomSheet("CLASS", grades, (val) => setState(() => selectedGrade = val)),
            child: _buildSelectorBox(selectedGrade.isEmpty ? "Select..." : "Class: $selectedGrade", isDarkMode, inputBg, cardBorder, textColorPrimary),
          ),
          const SizedBox(height: 20),

          // SUBJECT SELECTOR
          _buildLabel("SELECT SUBJECT", textColorSecondary),
          GestureDetector(
            onTap: () => _showListBottomSheet("SUBJECT", teacherSubjects, (val) => setState(() => selectedSubject = val)),
            child: _buildSelectorBox(selectedSubject.isEmpty ? "Select Subject..." : "Subject: $selectedSubject", isDarkMode, inputBg, cardBorder, textColorPrimary),
          ),
          const SizedBox(height: 20),

          // DEADLINE & MARKS (Row approach better for mobile)
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel("DEADLINE", textColorSecondary),
                    GestureDetector(
                      onTap: () async {
                        final DateTime? picked = await showDatePicker(
                          context: context,
                          initialDate: dueDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime(2101),
                          builder: (context, child) {
                            return Theme(
                              data: ThemeData.light().copyWith(
                                colorScheme: ColorScheme.light(
                                  primary: const Color(0xFF42A5F5),
                                  onPrimary: Colors.white,
                                  surface: isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                                  onSurface: textColorPrimary,
                                ),
                                dialogBackgroundColor: isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                              ),
                              child: child!,
                            );
                          },
                        );
                        if (picked != null && picked != dueDate) setState(() => dueDate = picked);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(DateFormat('dd MMM yyyy').format(dueDate), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                            const Icon(Icons.calendar_today, size: 16, color: Color(0xFF42A5F5)),
                          ],
                        ),
                      ),
                    )
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel("TOTAL MARKS", textColorSecondary),
                    Container(
                      decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                      child: TextField(
                        keyboardType: TextInputType.number,
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
                        decoration: InputDecoration(
                          hintText: "e.g. 100",
                          hintStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary.withOpacity(0.5)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                          suffixIcon: const Icon(Icons.adjust, size: 16, color: Color(0xFF42A5F5))
                        ),
                        onChanged: (val) => totalMarks = val,
                      ),
                    )
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // TITLE & DESC
          TextField(
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
            decoration: InputDecoration(
              hintText: 'Assignment Title...',
              hintStyle: TextStyle(fontSize: 14, color: textColorSecondary),
              filled: true, fillColor: inputBg,
              contentPadding: const EdgeInsets.all(20),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: cardBorder)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: Color(0xFF42A5F5), width: 2)),
            ),
            onChanged: (val) => title = val,
          ),
          const SizedBox(height: 16),
          TextField(
            maxLines: 4,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColorPrimary, fontStyle: FontStyle.italic),
            decoration: InputDecoration(
              hintText: 'Instructions...',
              hintStyle: TextStyle(fontSize: 12, color: textColorSecondary),
              filled: true, fillColor: inputBg,
              contentPadding: const EdgeInsets.all(20),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(25), borderSide: BorderSide(color: cardBorder)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(25), borderSide: const BorderSide(color: Color(0xFF42A5F5), width: 2)),
            ),
            onChanged: (val) => description = val,
          ),
          const SizedBox(height: 24),

          // FILE UPLOAD
          attachedFile == null
              ? GestureDetector(
                  onTap: isUploading ? null : _handleFileChange,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 30),
                    decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.1) : Colors.blue.shade50.withOpacity(0.5), borderRadius: BorderRadius.circular(30), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100, width: 2, style: BorderStyle.solid)),
                    child: Column(
                      children: [
                        isUploading 
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Color(0xFF42A5F5), strokeWidth: 3))
                          : const Icon(Icons.cloud_upload, color: Color(0xFF42A5F5), size: 32),
                        const SizedBox(height: 12),
                        Text(isUploading ? "UPLOADING..." : "ATTACH RESOURCE", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 2)),
                      ],
                    ),
                  ),
                )
              : Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFBFDBFE))),
                  child: Row(
                    children: [
                      const Icon(Icons.description, color: Color(0xFF42A5F5), size: 24),
                      const SizedBox(width: 12),
                      Expanded(child: Text(attachedFile!.name.toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF1E3A8A)))),
                      GestureDetector(
                        onTap: () => setState(() { attachedFile = null; uploadedFileUrl = ''; }),
                        child: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.close, color: Colors.red, size: 16)),
                      )
                    ],
                  ),
                ).animate().scale(),
          
          const SizedBox(height: 32),
          GestureDetector(
            onTap: _handleSubmit,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(30), boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]),
              child: const Text("PUBLISH ASSIGNMENT", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2)),
            ),
          )
        ],
      ),
    ).animate().fadeIn();
  }

  // --- HELPER WIDGETS FOR FORM ---
  Widget _buildLabel(String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, bottom: 8),
      child: Text(text, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: color, fontStyle: FontStyle.italic, letterSpacing: 2)),
    );
  }

  Widget _buildSelectorBox(String text, bool isDarkMode, Color bg, Color border, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: border)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: text.contains("Select") ? Colors.grey : textColor, fontStyle: FontStyle.italic)),
          const Icon(Icons.keyboard_arrow_down, color: Color(0xFF42A5F5)),
        ],
      ),
    );
  }

  // --- VIEW 2: HISTORY LIST ---
  Widget _buildHistoryView(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary) {
    if (assignments.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 60),
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder, style: BorderStyle.solid)),
        child: Column(
          children: [
            const Icon(Icons.history_toggle_off, color: Colors.grey, size: 48).animate(onPlay: (c) => c.repeat(reverse: true)).slideY(begin: -0.1, end: 0.1),
            const SizedBox(height: 16),
            Text("NO ASSIGNMENTS CREATED", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5)),
          ],
        ),
      ).animate().fadeIn();
    }

    return Column(
      key: const ValueKey('history'),
      children: assignments.map((asgn) {
        return Container(
          margin: const EdgeInsets.only(bottom: 24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(16)),
                    child: Text("CLASS: ${asgn['grade']}".toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5)),
                  ),
                  Text("DUE: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(asgn['dueDate']))}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic)),
                ],
              ),
              const SizedBox(height: 16),
              Text(asgn['title'].toString().toUpperCase(), style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => _fetchSubmissions(asgn['_id']),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(20)),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people, size: 16, color: Color(0xFF42A5F5)),
                            SizedBox(width: 8),
                            Text("SUBMISSIONS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () => _showDeleteConfirmModal(asgn['_id']),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                      decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(20)),
                      child: const Icon(Icons.delete, size: 16, color: Colors.red),
                    ),
                  )
                ],
              )
            ],
          ),
        ).animate().slideY(begin: 0.1);
      }).toList(),
    );
  }

  // --- VIEW 3: SUBMISSIONS (GRADING HUB) ---
  Widget _buildSubmissionsView(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary, Color inputBg) {
    return Column(
      key: const ValueKey('submissions'),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("Evaluation Hub", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(20)),
              child: Text("${activeSubmissions.length} RECEIVED", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5)),
            )
          ],
        ),
        const SizedBox(height: 24),
        
        if (activeSubmissions.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 60),
            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder, style: BorderStyle.solid)),
            child: Column(
              children: [
                const Icon(Icons.inbox, color: Colors.grey, size: 48).animate(onPlay: (c) => c.repeat(reverse: true)).slideY(begin: -0.1, end: 0.1),
                const SizedBox(height: 16),
                Text("NO SUBMISSIONS YET", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5)),
              ],
            ),
          ).animate().fadeIn()
        else
          ...activeSubmissions.map((sub) {
            return Container(
              margin: const EdgeInsets.only(bottom: 24),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
              child: _SubmissionEditorCard(
                sub: sub,
                isDarkMode: isDarkMode,
                inputBg: inputBg,
                cardBorder: cardBorder,
                textColorPrimary: textColorPrimary,
                textColorSecondary: textColorSecondary,
                onGradeUpdate: (id, marks) async {
                  try {
                    await ApiClient.dio.put('/assignments/grade/$id', data: {'marksObtained': marks});
                    setState(() {
                      sub['marksObtained'] = marks;
                      sub['status'] = 'Graded';
                    });
                    _showToast("Marks Secured! ✅");
                    return true;
                  } catch (e) {
                    _showToast("Grading Failed! 🛡️", isError: true);
                    return false;
                  }
                },
              ),
            ).animate().slideY(begin: 0.1);
          }).toList(),
      ],
    );
  }

  // --- BOTTOM SHEETS & MODALS ---
  void _showListBottomSheet(String title, List<dynamic> items, Function(String) onSelect) {
    final themeMode = ref.watch(themeProvider);
    final bool isDark = themeMode == ThemeMode.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.5,
          padding: const EdgeInsets.only(top: 12, left: 24, right: 24, bottom: 24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
            border: Border(top: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFDDE3EA), width: 2)),
          ),
          child: Column(
            children: [
              Container(width: 50, height: 5, margin: const EdgeInsets.only(bottom: 24), decoration: BoxDecoration(color: isDark ? const Color(0xFF334155) : Colors.grey.shade300, borderRadius: BorderRadius.circular(10))),
              Text("SELECT $title", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1)),
              const SizedBox(height: 16),
              
              Expanded(
                child: items.isEmpty 
                  ? Center(child: Text("NO DATA FOUND", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey.shade400, letterSpacing: 1.5)))
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        return GestureDetector(
                          onTap: () {
                            onSelect(items[index].toString());
                            Navigator.pop(context);
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                            decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20), border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))),
                            child: Text(items[index].toString().toUpperCase(), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87, letterSpacing: 1.5)),
                          ),
                        );
                      },
                    ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showDeleteConfirmModal(String id) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Action',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, _, __) {
        final themeMode = ref.watch(themeProvider);
        final bool isDark = themeMode == ThemeMode.dark;
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              GestureDetector(onTap: () => Navigator.pop(ctx), child: Container(color: Colors.black.withOpacity(0.6))),
              Center(
                child: Container(
                  width: MediaQuery.of(context).size.width * 0.85,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(color: isDark ? const Color(0xFF1E293B) : Colors.white, borderRadius: BorderRadius.circular(40)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(padding: const EdgeInsets.all(20), decoration: const BoxDecoration(color: Color(0xFFFEF2F2), shape: BoxShape.circle), child: const Icon(Icons.delete, color: Colors.red, size: 40)),
                      const SizedBox(height: 24),
                      const Text("CONFIRM DELETE?", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                      const SizedBox(height: 12),
                      const Text("This action will permanently delete this assignment and all its student submissions.", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, height: 1.5)),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.pop(ctx),
                              child: Container(padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)), child: Text("CANCEL", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black, letterSpacing: 1.5))),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                Navigator.pop(ctx);
                                _confirmDelete(id);
                              },
                              child: Container(padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(20)), child: const Text("YES, DELETE", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5))),
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                ).animate().scale(curve: Curves.easeOutBack),
              ),
            ],
          ),
        );
      },
    );
  }
}

// --- SUBMISSION CARD SUB-COMPONENT ---
class _SubmissionEditorCard extends StatefulWidget {
  final Map<String, dynamic> sub;
  final bool isDarkMode;
  final Color inputBg;
  final Color cardBorder;
  final Color textColorPrimary;
  final Color textColorSecondary;
  final Future<bool> Function(String, int) onGradeUpdate;

  const _SubmissionEditorCard({
    required this.sub, required this.isDarkMode, required this.inputBg,
    required this.cardBorder, required this.textColorPrimary, 
    required this.textColorSecondary, required this.onGradeUpdate
  });

  @override
  State<_SubmissionEditorCard> createState() => _SubmissionEditorCardState();
}

class _SubmissionEditorCardState extends State<_SubmissionEditorCard> {
  late bool isEditing;
  late TextEditingController _marksCtrl;
  bool isSaving = false;

  @override
  void initState() {
    super.initState();
    isEditing = widget.sub['status'] != 'Graded';
    _marksCtrl = TextEditingController(text: widget.sub['marksObtained']?.toString() ?? '');
  }

  @override
  Widget build(BuildContext context) {
    bool isGraded = widget.sub['status'] == 'Graded';
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.sub['student']?['name']?.toString().toUpperCase() ?? 'UNKNOWN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: widget.textColorPrimary, fontStyle: FontStyle.italic)),
                  Text("ENR: ${widget.sub['student']?['enrollmentNo'] ?? 'N/A'}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: widget.textColorSecondary, letterSpacing: 2)),
                ],
              ),
            ),
            if (!isEditing)
              const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 24)
          ],
        ),
        const SizedBox(height: 20),
        
        // 🔥 FILE DOWNLOAD BUTTON WITH NATIVE APP_CONFIG IP RESOLVER 🔥
        GestureDetector(
          onTap: () async {
            if (widget.sub['fileUrl'] != null && widget.sub['fileUrl'].toString().isNotEmpty) {
               final Uri url = Uri.parse(AppConfig.getAbsoluteUrl(widget.sub['fileUrl']));
               if (await canLaunchUrl(url)) {
                 await launchUrl(url, mode: LaunchMode.externalApplication);
               }
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(color: widget.isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.2) : Colors.blue.shade50, borderRadius: BorderRadius.circular(20), border: Border.all(color: widget.isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100)),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.download, size: 16, color: Color(0xFF42A5F5)),
                SizedBox(width: 8),
                Text("VIEW SUBMISSION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("MARKS (${widget.sub['assignment']?['totalMarks'] ?? 'N/A'})", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: widget.textColorSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
            if (!isEditing)
              GestureDetector(
                onTap: () => setState(() => isEditing = true),
                child: const Text("EDIT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5)),
              )
          ],
        ),
        const SizedBox(height: 8),
        
        Container(
          decoration: BoxDecoration(color: widget.inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: isEditing ? const Color(0xFF42A5F5) : widget.cardBorder)),
          child: TextField(
            controller: _marksCtrl,
            enabled: isEditing,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isGraded && !isEditing ? const Color(0xFF10B981) : widget.textColorPrimary, fontStyle: FontStyle.italic),
            decoration: InputDecoration(
              hintText: "00",
              hintStyle: TextStyle(color: widget.textColorSecondary.withOpacity(0.5)),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 16)
            ),
          ),
        ),

        if (isEditing)
          GestureDetector(
            onTap: isSaving ? null : () async {
              if (_marksCtrl.text.isEmpty) return;
              setState(() => isSaving = true);
              bool success = await widget.onGradeUpdate(widget.sub['_id'], int.parse(_marksCtrl.text));
              if (success && mounted) {
                setState(() {
                  isEditing = false;
                  isSaving = false;
                });
              }
            },
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 4))]),
              child: isSaving 
                ? const Center(child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)))
                : const Text("UPDATE SCORE", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2)),
            ),
          ).animate().fadeIn()
      ],
    );
  }
}
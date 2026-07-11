import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class TeacherUploadResult extends ConsumerStatefulWidget {
  const TeacherUploadResult({super.key});

  @override
  ConsumerState<TeacherUploadResult> createState() =>
      _TeacherUploadResultState();
}

class _TeacherUploadResultState extends ConsumerState<TeacherUploadResult> {
  bool isLoading = true;
  bool isActionLoading = false;

  Map<String, dynamic>? currentUser;
  String? assignedClass;
  String? employeeId;
  String? userId;

  String viewMode = 'pending'; // 'pending', 'monitor', 'editor'
  String returnViewMode = 'pending';

  List<dynamic> pendingRequests = [];
  List<dynamic> managedResults = [];
  List<String> examTitles = [];
  Map<String, bool> editModes = {};
  String? selectedMonitorId;

  // Editor Data State
  Map<String, dynamic> editorData = {
    'resultId': '',
    'subjectName': '',
    'examTitle': '',
    'maxMarks': 0,
    'students': []
  };

  // Form State
  String formDataTitle = '';
  String formDataMaxMarks = '';

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
        currentUser = jsonDecode(userStr);
        assignedClass = currentUser?['assignedClass'];
        employeeId = currentUser?['employeeId'];
        userId = currentUser?['_id'];
      }

      await Future.wait([
        _fetchPendingRequests(),
        if (assignedClass != null && assignedClass!.isNotEmpty)
          _fetchManagedResults(),
        if (assignedClass != null && assignedClass!.isNotEmpty)
          _fetchDatesheetTitles(),
      ]);
    } catch (e) {
      _showToast("Failed to sync data", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _fetchPendingRequests() async {
    try {
      final res = await ApiClient.dio.get('/exam-results/pending');
      if (mounted) setState(() => pendingRequests = res.data ?? []);
    } catch (e) {
      debugPrint("Error pending: $e");
    }
  }

  Future<void> _fetchManagedResults() async {
    if (assignedClass == null) return;
    try {
      final res =
          await ApiClient.dio.get('/exam-results/monitor/$assignedClass');
      if (mounted) setState(() => managedResults = res.data ?? []);
    } catch (e) {
      debugPrint("Error managed: $e");
    }
  }

  Future<void> _fetchDatesheetTitles() async {
    if (examTitles.isNotEmpty) return;
    try {
      final res = await ApiClient.dio.get('/datesheet/teacher-datesheets');
      List<dynamic> raw = res.data ?? [];
      Set<String> titles = raw.map((ds) => ds['title'].toString()).toSet();
      if (mounted) setState(() => examTitles = titles.toList());
    } catch (e) {
      debugPrint("Error titles: $e");
    }
  }

  void _handleBack() {
    if (viewMode == 'monitor' || viewMode == 'editor') {
      setState(() {
        viewMode = viewMode == 'editor' ? returnViewMode : 'pending';
      });
    } else {
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/teacher/home');
      }
    }
  }

  void _openEditor(
      Map<String, dynamic> req, String subjectName, String fromView) {
    List<dynamic> preppedStudents = (req['studentMarks'] as List).map((st) {
      var existingMark = (st['marks'] as List).firstWhere(
          (m) => m['subjectName'] == subjectName,
          orElse: () => null);
      return {
        'studentId': st['studentId'],
        'name': st['name'],
        'enrollmentNo': st['enrollmentNo'],
        'status': existingMark?['status'] ?? 'Present',
        'marksObtained': existingMark?['marksObtained']?.toString() ?? ''
      };
    }).toList();

    setState(() {
      editorData = {
        'resultId': req['_id'],
        'examTitle': req['examTitle'],
        'subjectName': subjectName,
        'maxMarks': req['maxMarks'],
        'students': preppedStudents
      };
      returnViewMode = fromView;
      viewMode = 'editor';
    });
  }

  void _handleStudentGridChange(String studentId, String field, String value) {
    if (field == 'marksObtained') {
      int? numVal = int.tryParse(value);
      int maxM = editorData['maxMarks'];
      if (numVal != null && numVal > maxM) {
        _showToast("Maximum marks is $maxM!", isError: true);
        return;
      }
    }

    setState(() {
      var stList = editorData['students'] as List<dynamic>;
      for (var st in stList) {
        if (st['studentId'] == studentId) {
          st[field] = value;
          if (field == 'status' && value == 'Absent') {
            st['marksObtained'] = '0';
          }
        }
      }
    });
  }

  Future<void> _handleEditorFinalSubmit() async {
    // Validation
    List<dynamic> students = editorData['students'];
    bool isInvalid = students.any((st) =>
        st['status'] == 'Present' && st['marksObtained'].toString().isEmpty);
    if (isInvalid)
      return _showToast("Enter marks for all Present students! ⚠️",
          isError: true);

    setState(() => isActionLoading = true);
    try {
      final payload = {
        'subjectName': editorData['subjectName'],
        'studentMarks': students
            .map((st) => {
                  'studentId': st['studentId'],
                  'status': st['status'],
                  'marksObtained':
                      int.tryParse(st['marksObtained'].toString()) ?? 0
                })
            .toList()
      };

      await ApiClient.dio.put(
          '/exam-results/submit-marks/${editorData['resultId']}',
          data: payload);

      setState(() => viewMode = returnViewMode);
      _showToast("Marks Locked Successfully! 📝");
      _fetchPendingRequests();
      if (assignedClass != null) _fetchManagedResults();
    } catch (e) {
      _showToast("Failed to lock marks.", isError: true);
    } finally {
      setState(() => isActionLoading = false);
    }
  }

  Future<void> _handleFinalInitiate() async {
    if (formDataTitle.isEmpty || formDataMaxMarks.isEmpty) {
      return _showToast("Please select Title and enter Max Marks! ⚠️",
          isError: true);
    }

    setState(() => isActionLoading = true);
    try {
      await ApiClient.dio.post('/exam-results/initiate', data: {
        'grade': assignedClass,
        'examTitle': formDataTitle,
        'maxMarks': int.parse(formDataMaxMarks)
      });

      setState(() {
        formDataTitle = '';
        formDataMaxMarks = '';
      });
      _showToast("Result Collection Broadcasted! 📡");
      _fetchManagedResults();
      _fetchPendingRequests();
    } catch (e) {
      _showToast("Failed to initiate.", isError: true);
    } finally {
      setState(() => isActionLoading = false);
    }
  }

  Future<void> _executeActionConfirm(String action, String id) async {
    setState(() => isActionLoading = true);
    try {
      if (action == 'delete') {
        await ApiClient.dio.delete('/exam-results/$id');
        _showToast("Result Record Deleted! 🗑️");
      } else if (action == 'publish') {
        await ApiClient.dio.put('/exam-results/publish/$id');
        _showToast("Published to Students! 🚀");
      }
      _fetchManagedResults();
    } catch (e) {
      _showToast("Action failed.", isError: true);
    } finally {
      setState(() => isActionLoading = false);
    }
  }

  // --- NEW BOTTOM SHEET FOR STATUS ---
  void _showStatusBottomSheet(String studentId, String currentStatus) {
    final themeMode = ref.watch(themeProvider);
    final bool isDark = themeMode == ThemeMode.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          padding:
              const EdgeInsets.only(top: 12, left: 24, right: 24, bottom: 40),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
            border: Border(
                top: BorderSide(
                    color: isDark
                        ? const Color(0xFF334155)
                        : const Color(0xFFDDE3EA),
                    width: 2)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag Handle
              Container(
                width: 50,
                height: 5,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                    color:
                        isDark ? const Color(0xFF334155) : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10)),
              ),

              const Text("MARK ATTENDANCE",
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF42A5F5),
                      fontStyle: FontStyle.italic,
                      letterSpacing: 1)),
              const SizedBox(height: 24),

              // PRESENT BUTTON
              GestureDetector(
                onTap: () {
                  _handleStudentGridChange(studentId, 'status', 'Present');
                  Navigator.pop(context);
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  decoration: BoxDecoration(
                    color: currentStatus == 'Present'
                        ? const Color(0xFF42A5F5)
                        : (isDark
                            ? const Color(0xFF0F172A)
                            : const Color(0xFFEFF6FF)),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(
                        color: currentStatus == 'Present'
                            ? const Color(0xFF42A5F5)
                            : const Color(0xFFBFDBFE),
                        width: 2),
                    boxShadow: currentStatus == 'Present'
                        ? [
                            BoxShadow(
                                color: const Color(0xFF42A5F5).withOpacity(0.4),
                                blurRadius: 15,
                                offset: const Offset(0, 5))
                          ]
                        : [],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle,
                          color: currentStatus == 'Present'
                              ? Colors.white
                              : const Color(0xFF42A5F5),
                          size: 24),
                      const SizedBox(width: 12),
                      Text("PRESENT",
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: currentStatus == 'Present'
                                  ? Colors.white
                                  : const Color(0xFF42A5F5),
                              letterSpacing: 2)),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // ABSENT BUTTON
              GestureDetector(
                onTap: () {
                  _handleStudentGridChange(studentId, 'status', 'Absent');
                  Navigator.pop(context);
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  decoration: BoxDecoration(
                    color: currentStatus == 'Absent'
                        ? Colors.red
                        : (isDark
                            ? const Color(0xFF0F172A)
                            : const Color(0xFFFEF2F2)),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(
                        color: currentStatus == 'Absent'
                            ? Colors.red
                            : const Color(0xFFFECACA),
                        width: 2),
                    boxShadow: currentStatus == 'Absent'
                        ? [
                            BoxShadow(
                                color: Colors.red.withOpacity(0.4),
                                blurRadius: 15,
                                offset: const Offset(0, 5))
                          ]
                        : [],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.cancel,
                          color: currentStatus == 'Absent'
                              ? Colors.white
                              : Colors.red,
                          size: 24),
                      const SizedBox(width: 12),
                      Text("ABSENT",
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: currentStatus == 'Absent'
                                  ? Colors.white
                                  : Colors.red,
                              letterSpacing: 2)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // --- NEW BOTTOM SHEET FOR MONITOR HUB SELECTION ---
  void _showMonitorSelectionBottomSheet() {
    final themeMode = ref.watch(themeProvider);
    final bool isDark = themeMode == ThemeMode.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.6,
          padding: const EdgeInsets.only(top: 12, left: 24, right: 24, bottom: 24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
            border: Border(top: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFDDE3EA), width: 2)),
          ),
          child: Column(
            children: [
              Container(
                width: 50, height: 5, margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(color: isDark ? const Color(0xFF334155) : Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
              ),
              const Text("SELECT EXAM TO MONITOR", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1)),
              const SizedBox(height: 16),
              
              Expanded(
                child: ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  itemCount: managedResults.length,
                  itemBuilder: (context, index) {
                    final res = managedResults[index];
                    bool isPublished = res['status'] == 'published';
                    
                    return GestureDetector(
                      onTap: () {
                        setState(() => selectedMonitorId = res['_id']);
                        Navigator.pop(context);
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(res['examTitle'].toString().toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87)),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(color: isPublished ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(12)),
                              child: Text(isPublished ? "PUBLISHED" : "PENDING", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: isPublished ? const Color(0xFF10B981) : Colors.amber, letterSpacing: 1)),
                            )
                          ],
                        ),
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

void _showExamTitlesBottomSheet(Function(String) onTitleSelected) {
    final themeMode = ref.watch(themeProvider);
    final bool isDark = themeMode == ThemeMode.dark;

    // 🔥 NAYA FILTER LOGIC 🔥
    // Un exams ko dhundo jo pehle se Initiate ho chuke hain (Pending ya Published)
    List<String> usedTitles = managedResults
        .map((r) => r['examTitle'].toString().toLowerCase())
        .toList();

    // Sirf un exams ko filter karo jo abhi tak initiate nahi hue hain
    List<String> availableTitles = examTitles
        .where((title) => !usedTitles.contains(title.toLowerCase()))
        .toList();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.5, // 50% screen height
          padding: const EdgeInsets.only(top: 12, left: 24, right: 24, bottom: 24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
            border: Border(
                top: BorderSide(
                    color: isDark
                        ? const Color(0xFF334155)
                        : const Color(0xFFDDE3EA),
                    width: 2)),
          ),
          child: Column(
            children: [
              // Drag Handle
              Container(
                width: 50,
                height: 5,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                    color:
                        isDark ? const Color(0xFF334155) : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10)),
              ),

              const Text("SELECT EXAM TITLE",
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF42A5F5),
                      fontStyle: FontStyle.italic,
                      letterSpacing: 1)),
              const SizedBox(height: 16),

              // DATESHEETS LIST (Scrollable & Filtered)
              Expanded(
                child: availableTitles.isEmpty
                    ? Center(
                        child: Text(
                            examTitles.isEmpty 
                                ? "NO ACTIVE EXAMS FOUND" 
                                : "ALL EXAMS ALREADY INITIATED", // Agar sab initiate ho gaye toh ye aayega
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                color: Colors.grey.shade400,
                                letterSpacing: 1.5)),
                      )
                    : ListView.builder(
                        physics: const BouncingScrollPhysics(),
                        itemCount: availableTitles.length,
                        itemBuilder: (context, index) {
                          String title = availableTitles[index];
                          bool isSelected = formDataTitle == title;

                          return GestureDetector(
                            onTap: () {
                              onTitleSelected(title); // Update form data
                              Navigator.pop(context); // Close bottom sheet
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 18),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFF42A5F5)
                                    : (isDark
                                        ? const Color(0xFF0F172A)
                                        : const Color(0xFFF1F5F9)),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF42A5F5)
                                        : (isDark
                                            ? const Color(0xFF334155)
                                            : const Color(0xFFE2E8F0))),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                            color: const Color(0xFF42A5F5)
                                                .withOpacity(0.3),
                                            blurRadius: 10,
                                            offset: const Offset(0, 4))
                                      ]
                                    : [],
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(title.toUpperCase(),
                                      style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w900,
                                          color: isSelected
                                              ? Colors.white
                                              : (isDark
                                                  ? Colors.white
                                                  : Colors.black87),
                                          letterSpacing: 1.5)),
                                  if (isSelected)
                                    const Icon(Icons.check_circle,
                                        color: Colors.white, size: 20)
                                ],
                              ),
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
                        fontSize: 12))),
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
    if (isLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor =
        isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder =
        isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary =
        isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary =
        isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);

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
            physics: const AlwaysScrollableScrollPhysics(
                parent: ClampingScrollPhysics()),
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    // HEADER
                    Container(
                      padding: const EdgeInsets.only(
                          top: 60, bottom: 40, left: 24, right: 24),
                      decoration: BoxDecoration(
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
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: _handleBack,
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: Colors.white.withOpacity(0.3))),
                              child: const Icon(Icons.arrow_back,
                                  color: Colors.white, size: 24),
                            ),
                          ),
                          Column(
                            children: [
                              Text(
                                  viewMode == 'monitor'
                                      ? "Result Hub"
                                      : "Enter Marks",
                                  style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      fontStyle: FontStyle.italic,
                                      letterSpacing: -0.5)),
                              Text(
                                  viewMode == 'monitor'
                                      ? "CLASS $assignedClass"
                                      : (assignedClass != null
                                          ? "MANAGE & EVALUATE"
                                          : "SUBJECT EVALUATIONS"),
                                  style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white.withOpacity(0.9),
                                      letterSpacing: 2)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.3))),
                            child: Icon(
                                viewMode == 'monitor'
                                    ? Icons.dashboard
                                    : Icons.bar_chart,
                                color: Colors.white,
                                size: 24),
                          ),
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // BODY
                    Transform.translate(
                      offset: const Offset(0, -20),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 400),
                          child: viewMode == 'pending'
                              ? _buildPendingView(
                                  isDarkMode,
                                  cardColor,
                                  cardBorder,
                                  textColorPrimary,
                                  textColorSecondary)
                              : viewMode == 'monitor'
                                  ? _buildMonitorView(
                                      isDarkMode,
                                      cardColor,
                                      cardBorder,
                                      textColorPrimary,
                                      textColorSecondary)
                                  : _buildEditorView(
                                      isDarkMode,
                                      cardColor,
                                      cardBorder,
                                      textColorPrimary,
                                      textColorSecondary),
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

  // --- VIEW 1: PENDING (SUBJECT TEACHER) ---
  Widget _buildPendingView(bool isDarkMode, Color cardColor, Color cardBorder,
      Color textColorPrimary, Color textColorSecondary) {
    return Column(
      key: const ValueKey('pending'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (assignedClass != null && assignedClass!.isNotEmpty) ...[
          Align(
            alignment: Alignment.centerRight,
            child:GestureDetector(
              onTap: () {
                setState(() {
                  viewMode = 'monitor';
                  selectedMonitorId = null; // Pehle se select clear karo
                });
                // Thoda delay dekar automatically bottom sheet khol do
                Future.delayed(const Duration(milliseconds: 100), () => _showMonitorSelectionBottomSheet());
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: cardBorder),
                    boxShadow: const [
                      BoxShadow(
                          color: Colors.black12,
                          blurRadius: 10,
                          offset: Offset(0, 4))
                    ]),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.dashboard,
                        color: Color(0xFF43A047), size: 18),
                    const SizedBox(width: 8),
                    Text("MONITOR HUB",
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            color: textColorPrimary,
                            letterSpacing: 1.5,
                            fontStyle: FontStyle.italic)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(40),
                border: Border.all(color: cardBorder),
                boxShadow: const [
                  BoxShadow(
                      color: Colors.black12,
                      blurRadius: 15,
                      offset: Offset(0, 5))
                ]),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Initiate Collection",
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: textColorPrimary,
                              fontStyle: FontStyle.italic)),
                      const SizedBox(height: 4),
                      Text("CLASS TEACHER: $assignedClass",
                          style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF42A5F5),
                              letterSpacing: 1.5)),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: _showInitiateModal,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                        color: Color(0xFF42A5F5),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                              color: Color(0xFF42A5F5),
                              blurRadius: 10,
                              offset: Offset(0, 4))
                        ]),
                    child: const Icon(Icons.add, color: Colors.white, size: 28),
                  ),
                )
              ],
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 30),
        ],
        Row(
          children: [
            const Icon(Icons.access_time_filled, color: Colors.amber, size: 20),
            const SizedBox(width: 8),
            Text("PENDING EVALUATIONS",
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    color: textColorSecondary,
                    letterSpacing: 2,
                    fontStyle: FontStyle.italic)),
          ],
        ),
        const SizedBox(height: 16),
        if (pendingRequests.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40),
            decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(40),
                border:
                    Border.all(color: cardBorder, style: BorderStyle.solid)),
            child: Column(
              children: [
                const Icon(Icons.check_circle,
                        color: Color(0xFF10B981), size: 48)
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .slideY(begin: -0.1, end: 0.1),
                const SizedBox(height: 16),
                Text("ALL CAUGHT UP!",
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: textColorSecondary,
                        fontStyle: FontStyle.italic,
                        letterSpacing: 1.5)),
              ],
            ),
          )
        else
          ...pendingRequests.map((req) {
            List subjects = req['subjects'] ?? [];
            return Column(
              children: subjects.where((s) {
                List assigned = s['assignedTeachers'] ?? [];
                bool isMe =
                    assigned.contains(employeeId) || assigned.contains(userId);
                return isMe && !(s['isSubmitted'] ?? false);
              }).map((sub) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 20),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                      color: cardColor,
                      borderRadius: BorderRadius.circular(40),
                      border: Border.all(color: cardBorder),
                      boxShadow: const [
                        BoxShadow(
                            color: Colors.black12,
                            blurRadius: 15,
                            offset: Offset(0, 5))
                      ]),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(req['examTitle'].toString().toUpperCase(),
                          style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: textColorPrimary,
                              fontStyle: FontStyle.italic)),
                      Text("CLASS: ${req['grade']}",
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: textColorSecondary,
                              letterSpacing: 2)),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: isDarkMode
                                ? const Color(0xFF064E3B)
                                : const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: isDarkMode
                                    ? const Color(0xFF064E3B)
                                    : const Color(0xFFD1FAE5))),
                        child: Row(
                          children: [
                            const Icon(Icons.bar_chart,
                                color: Color(0xFF10B981), size: 24),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                    sub['subjectName'].toString().toUpperCase(),
                                    style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        color: isDarkMode
                                            ? Colors.white
                                            : const Color(0xFF064E3B),
                                        fontStyle: FontStyle.italic)),
                                Text("MAX MARKS: ${req['maxMarks']}",
                                    style: const TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF10B981),
                                        letterSpacing: 1.5)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      GestureDetector(
                        onTap: () =>
                            _openEditor(req, sub['subjectName'], 'pending'),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(
                              border:
                                  Border.all(color: const Color(0xFF42A5F5)),
                              borderRadius: BorderRadius.circular(30)),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.send,
                                  color: Color(0xFF42A5F5), size: 16),
                              SizedBox(width: 8),
                              Text("OPEN EDITOR",
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF42A5F5),
                                      letterSpacing: 2,
                                      fontStyle: FontStyle.italic)),
                            ],
                          ),
                        ),
                      )
                    ],
                  ),
                ).animate().slideY(begin: 0.1);
              }).toList(),
            );
          }).toList(),
      ],
    );
  }

 // --- VIEW 2: MONITOR (CLASS TEACHER) ---
  Widget _buildMonitorView(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary) {
    if (managedResults.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 60),
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder, style: BorderStyle.solid)),
        child: Column(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.grey, size: 48).animate(onPlay: (c) => c.repeat(reverse: true)).slideY(begin: -0.1, end: 0.1),
            const SizedBox(height: 16),
            Text("NO RESULTS INITIATED", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5)),
          ],
        ),
      );
    }

    // Agar koi select nahi hua hai, toh select karne ko bolo
    if (selectedMonitorId == null || !managedResults.any((r) => r['_id'] == selectedMonitorId)) {
      return GestureDetector(
        onTap: _showMonitorSelectionBottomSheet,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 40),
          decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: const Color(0xFF42A5F5), width: 2), boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.2), blurRadius: 15)]),
          child: Column(
            children: [
              const Icon(Icons.touch_app, color: Color(0xFF42A5F5), size: 48).animate(onPlay: (c) => c.repeat(reverse: true)).scale(),
              const SizedBox(height: 16),
              const Text("TAP TO SELECT EXAM", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1.5)),
            ],
          ),
        ),
      ).animate().fadeIn();
    }

    // Sirf wahi result uthao jo select hua hai
    final resObj = managedResults.firstWhere((r) => r['_id'] == selectedMonitorId);
    bool allSubmitted = (resObj['subjects'] as List).every((s) => s['isSubmitted'] == true);
    bool isPublished = resObj['status'] == 'published';
    bool isEditMode = editModes[resObj['_id']] ?? false;

    return Column(
      key: const ValueKey('monitor'),
      children: [
        // Top Bar to Change Exam
        Align(
          alignment: Alignment.centerRight,
          child: GestureDetector(
            onTap: _showMonitorSelectionBottomSheet,
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(30), border: Border.all(color: const Color(0xFFBFDBFE))),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.swap_horiz, color: Color(0xFF42A5F5), size: 18),
                  SizedBox(width: 8),
                  Text("CHANGE EXAM", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                ],
              ),
            ),
          ),
        ),

        // MAIN SINGLE CARD
        Container(
          margin: const EdgeInsets.only(bottom: 24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: isEditMode ? const Color(0xFF42A5F5) : cardBorder, width: isEditMode ? 2 : 1), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
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
                        Text(resObj['examTitle'].toString().toUpperCase(), style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(color: isPublished ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(20)),
                          child: Text("STATUS: ${resObj['status']}", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: isPublished ? const Color(0xFF10B981) : Colors.amber, letterSpacing: 1.5)),
                        )
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      if (isPublished)
                        GestureDetector(
                          onTap: () => setState(() => editModes[resObj['_id']] = !isEditMode),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(color: isEditMode ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(16)),
                            child: Icon(isEditMode ? Icons.close : Icons.edit, size: 16, color: isEditMode ? Colors.white : const Color(0xFF42A5F5)),
                          ),
                        ),
                      GestureDetector(
                        onTap: () => _showActionModal('delete', resObj['_id']),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(16)),
                          child: const Icon(Icons.delete, size: 16, color: Colors.red),
                        ),
                      )
                    ],
                  )
                ],
              ),
              const SizedBox(height: 24),
              ...(resObj['subjects'] as List).map((sub) {
                bool showSubjectEdit = sub['isSubmitted'] && (!isPublished || isEditMode);
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: sub['isSubmitted'] ? (isDarkMode ? const Color(0xFF064E3B) : const Color(0xFFECFDF5)) : (isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC)), borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(sub['subjectName'].toString().toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(sub['isSubmitted'] ? Icons.check_circle : Icons.access_time, size: 12, color: sub['isSubmitted'] ? const Color(0xFF10B981) : Colors.amber),
                              const SizedBox(width: 4),
                              Text(sub['isSubmitted'] ? "Marks Compiled Successfully" : "Pending Marks Entry", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: sub['isSubmitted'] ? const Color(0xFF10B981) : Colors.amber, letterSpacing: 0)),
                            ],
                          )
                        ],
                      ),
                      if (showSubjectEdit)
                        GestureDetector(
                          onTap: () => _openEditor(resObj, sub['subjectName'], 'monitor'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(border: Border.all(color: const Color(0xFF10B981)), borderRadius: BorderRadius.circular(16)),
                            child: const Text("EDIT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF10B981), letterSpacing: 1.5)),
                          ),
                        )
                    ],
                  ),
                );
              }).toList(),
              const SizedBox(height: 16),
              if (!isPublished && allSubmitted)
                GestureDetector(
                  onTap: () => _showActionModal('publish', resObj['_id']),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF34D399), Color(0xFF10B981)]), borderRadius: BorderRadius.circular(30), boxShadow: [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 4))]),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
                        SizedBox(width: 8),
                        Text("PUBLISH REPORT CARDS", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                      ],
                    ),
                  ),
                ),
              if (isPublished && !isEditMode)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(color: const Color(0xFFECFDF5), border: Border.all(color: const Color(0xFF10B981)), borderRadius: BorderRadius.circular(30)),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20),
                      SizedBox(width: 8),
                      Text("RESULTS DECLARED", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF10B981), letterSpacing: 2, fontStyle: FontStyle.italic)),
                    ],
                  ),
                ),
              if (isPublished && isEditMode)
                GestureDetector(
                  onTap: () {
                    setState(() => editModes[resObj['_id']] = false);
                    _showToast("Results Updated Successfully! ✨");
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(30), boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 4))]),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.update, color: Colors.white, size: 20),
                        SizedBox(width: 8),
                        Text("UPDATE CHANGES", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ).animate().slideY(begin: 0.1),
      ],
    );
  }

  // --- VIEW 3: EDITOR (MARKS ENTRY) ---
  Widget _buildEditorView(bool isDarkMode, Color cardColor, Color cardBorder,
      Color textColorPrimary, Color textColorSecondary) {
    List<dynamic> students = editorData['students'] ?? [];

    return Column(
      key: const ValueKey('editor'),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(40),
              border: Border.all(color: cardBorder),
              boxShadow: const [
                BoxShadow(
                    color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))
              ]),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            "${editorData['subjectName']} EVALUATION"
                                .toUpperCase(),
                            style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF42A5F5),
                                fontStyle: FontStyle.italic)),
                        const SizedBox(height: 4),
                        Text(
                            "${editorData['examTitle']} • MAX MARKS: ${editorData['maxMarks']}"
                                .toUpperCase(),
                            style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                color: textColorSecondary,
                                letterSpacing: 1)),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() => viewMode = returnViewMode),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                          color: isDarkMode
                              ? const Color(0xFF0F172A)
                              : const Color(0xFFEFF6FF),
                          shape: BoxShape.circle),
                      child: const Icon(Icons.close,
                          color: Color(0xFF42A5F5), size: 20),
                    ),
                  )
                ],
              ),
              const SizedBox(height: 24),
              ...students.map((st) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                      color: isDarkMode
                          ? const Color(0xFF0F172A)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(color: cardBorder)),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(st['name'].toString().toUpperCase(),
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        color: textColorPrimary)),
                                Text(
                                    st['enrollmentNo'].toString().toUpperCase(),
                                    style: TextStyle(
                                        fontSize: 8,
                                        fontWeight: FontWeight.w900,
                                        color: textColorSecondary,
                                        letterSpacing: 2)),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: () => _showStatusBottomSheet(
                                st['studentId'], st['status'].toString()),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                  color: st['status'] == 'Present'
                                      ? const Color(0xFFEFF6FF)
                                      : const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                      color: st['status'] == 'Present'
                                          ? const Color(0xFF42A5F5)
                                          : Colors.red)),
                              child: Row(
                                children: [
                                  Text(st['status'].toString().toUpperCase(),
                                      style: TextStyle(
                                          fontSize:
                                              10, // Bhai isko maine 8 se 10 kar diya hai taaki readable lage
                                          fontWeight: FontWeight.w900,
                                          color: st['status'] == 'Present'
                                              ? const Color(0xFF42A5F5)
                                              : Colors.red,
                                          letterSpacing: 1.5)),
                                  const SizedBox(width: 4),
                                  Icon(
                                      Icons
                                          .keyboard_arrow_down_rounded, // Better icon for bottom sheet
                                      size: 18,
                                      color: st['status'] == 'Present'
                                          ? const Color(0xFF42A5F5)
                                          : Colors.red)
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("MARKS OBTAINED",
                              style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                  color: textColorSecondary,
                                  letterSpacing: 1)),
                          Row(
                            children: [
                              SizedBox(
                                width: 80,
                                child: TextField(
                                  enabled: st['status'] == 'Present',
                                  keyboardType: TextInputType.number,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      color: textColorPrimary),
                                  decoration: InputDecoration(
                                    hintText: '--',
                                    filled: true,
                                    fillColor: st['status'] == 'Present'
                                        ? (isDarkMode
                                            ? const Color(0xFF1E293B)
                                            : Colors.white)
                                        : (isDarkMode
                                            ? const Color(0xFF0F172A)
                                            : const Color(0xFFF1F5F9)),
                                    contentPadding: const EdgeInsets.symmetric(
                                        vertical: 12),
                                    enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide:
                                            BorderSide(color: cardBorder)),
                                    focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: const BorderSide(
                                            color: Color(0xFF42A5F5),
                                            width: 2)),
                                    disabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: BorderSide(
                                            color:
                                                cardBorder.withOpacity(0.5))),
                                  ),
                                  onChanged: (val) => _handleStudentGridChange(
                                      st['studentId'], 'marksObtained', val),
                                  controller: TextEditingController.fromValue(
                                      TextEditingValue(
                                          text: st['marksObtained'],
                                          selection: TextSelection.collapsed(
                                              offset: st['marksObtained']
                                                  .toString()
                                                  .length))),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text("/ ${editorData['maxMarks']}",
                                  style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      color: textColorSecondary)),
                            ],
                          )
                        ],
                      )
                    ],
                  ),
                );
              }).toList(),
            ],
          ),
        ).animate().fadeIn(),
        const SizedBox(height: 24),
        GestureDetector(
          onTap: _showEditorConfirmModal,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: BoxDecoration(
                color: const Color(0xFF42A5F5),
                borderRadius: BorderRadius.circular(40),
                boxShadow: [
                  BoxShadow(
                      color: const Color(0xFF42A5F5).withOpacity(0.4),
                      blurRadius: 15,
                      offset: const Offset(0, 5))
                ],
                border: const Border(
                    bottom: BorderSide(color: Color(0xFF1E3A8A), width: 4))),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.save, color: Colors.white, size: 20),
                SizedBox(width: 8),
                Text("REVIEW & SUBMIT MARKS",
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 2,
                        fontStyle: FontStyle.italic)),
              ],
            ),
          ),
        )
      ],
    );
  }

  // --- MODALS ---
  void _showInitiateModal() {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Initiate',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, anim1, anim2) {
        return StatefulBuilder(
          builder: (context, setStateModal) {
            final themeMode = ref.watch(themeProvider);
            final bool isDark = themeMode == ThemeMode.dark;
            return Scaffold(
              backgroundColor: Colors.transparent,
              body: Stack(
                children: [
                  GestureDetector(
                      onTap: () => Navigator.pop(ctx),
                      child: Container(color: Colors.black.withOpacity(0.6))),
                  Center(
                    child: Container(
                      width: MediaQuery.of(context).size.width * 0.9,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                          color:
                              isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(40),
                          border: Border.all(
                              color: isDark
                                  ? const Color(0xFF334155)
                                  : const Color(0xFFDDE3EA))),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text("NEW COLLECTION",
                                  style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF42A5F5),
                                      fontStyle: FontStyle.italic)),
                              GestureDetector(
                                  onTap: () => Navigator.pop(ctx),
                                  child: const Icon(Icons.close,
                                      color: Colors.grey))
                            ],
                          ),
                          const SizedBox(height: 24),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(20),
                                border:
                                    Border.all(color: const Color(0xFFBFDBFE))),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("CLASS $assignedClass",
                                    style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF1E3A8A))),
                                const Text("LOCKED TARGET",
                                    style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF42A5F5),
                                        letterSpacing: 1.5)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          GestureDetector(
                            onTap: () =>
                                _showExamTitlesBottomSheet((selectedVal) {
                              // Ye callback state update karega jab bottom sheet se item select hoga
                              setStateModal(() {
                                formDataTitle = selectedVal;
                              });
                            }),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF0F172A)
                                      : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                      color: isDark
                                          ? const Color(0xFF334155)
                                          : const Color(0xFFE2E8F0))),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                      formDataTitle.isEmpty
                                          ? "SELECT EXAM TITLE"
                                          : formDataTitle.toUpperCase(),
                                      style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w900,
                                          color: formDataTitle.isEmpty
                                              ? Colors.grey
                                              : (isDark
                                                  ? Colors.white
                                                  : Colors.black),
                                          letterSpacing: 1.5)),
                                  const Icon(Icons.keyboard_arrow_down_rounded,
                                      color: Color(0xFF42A5F5)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            keyboardType: TextInputType.number,
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: isDark ? Colors.white : Colors.black),
                            decoration: InputDecoration(
                              hintText: 'MAXIMUM MARKS (e.g. 100)',
                              hintStyle: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.5,
                                  color: Colors.grey),
                              filled: true,
                              fillColor: isDark
                                  ? const Color(0xFF0F172A)
                                  : const Color(0xFFF8FAFC),
                              contentPadding: const EdgeInsets.all(20),
                              enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(20),
                                  borderSide: BorderSide(
                                      color: isDark
                                          ? const Color(0xFF334155)
                                          : const Color(0xFFE2E8F0))),
                              focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(20),
                                  borderSide: const BorderSide(
                                      color: Color(0xFF42A5F5), width: 2)),
                            ),
                            onChanged: (val) => formDataMaxMarks = val,
                          ),
                          const SizedBox(height: 24),
                          GestureDetector(
                            onTap: () {
                              if (formDataTitle.isEmpty ||
                                  formDataMaxMarks.isEmpty) {
                                _showToast("Fill all fields!", isError: true);
                                return;
                              }
                              Navigator.pop(ctx);
                              _showConfirmModal('initiate');
                            },
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              decoration: BoxDecoration(
                                  color: const Color(0xFF42A5F5),
                                  borderRadius: BorderRadius.circular(30)),
                              child: const Text("CONTINUE",
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      letterSpacing: 2)),
                            ),
                          )
                        ],
                      ),
                    ),
                  ).animate().scale(curve: Curves.easeOutBack),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showConfirmModal(String type) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Confirm',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, _, __) {
        final themeMode = ref.watch(themeProvider);
        final bool isDark = themeMode == ThemeMode.dark;
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              GestureDetector(
                  onTap: () => Navigator.pop(ctx),
                  child: Container(color: Colors.black.withOpacity(0.6))),
              Center(
                child: Container(
                  width: MediaQuery.of(context).size.width * 0.85,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      borderRadius: BorderRadius.circular(40)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                          padding: const EdgeInsets.all(20),
                          decoration: const BoxDecoration(
                              color: Color(0xFFEFF6FF), shape: BoxShape.circle),
                          child: const Icon(Icons.warning_amber_rounded,
                              color: Color(0xFF42A5F5), size: 40)),
                      const SizedBox(height: 24),
                      const Text("FINAL CONFIRMATION",
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF42A5F5),
                              fontStyle: FontStyle.italic)),
                      const SizedBox(height: 12),
                      Text(
                          type == 'initiate'
                              ? "Request $formDataTitle marks collection from all Class $assignedClass subject teachers?"
                              : "Lock marks for ${editorData['subjectName']}? This cannot be edited once submitted.",
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey,
                              height: 1.5)),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.pop(ctx),
                              child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                  decoration: BoxDecoration(
                                      color: isDark
                                          ? const Color(0xFF0F172A)
                                          : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(20)),
                                  child: Text("CANCEL",
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: isDark
                                              ? Colors.white
                                              : Colors.black,
                                          letterSpacing: 1.5))),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                Navigator.pop(ctx);
                                type == 'initiate'
                                    ? _handleFinalInitiate()
                                    : _handleEditorFinalSubmit();
                              },
                              child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                  decoration: BoxDecoration(
                                      color: const Color(0xFF42A5F5),
                                      borderRadius: BorderRadius.circular(20)),
                                  child: const Text("CONFIRM",
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                          letterSpacing: 1.5))),
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

  void _showActionModal(String action, String id) {
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
              GestureDetector(
                  onTap: () => Navigator.pop(ctx),
                  child: Container(color: Colors.black.withOpacity(0.6))),
              Center(
                child: Container(
                  width: MediaQuery.of(context).size.width * 0.85,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      borderRadius: BorderRadius.circular(40)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                              color: action == 'delete'
                                  ? const Color(0xFFFEF2F2)
                                  : const Color(0xFFECFDF5),
                              shape: BoxShape.circle),
                          child: Icon(
                              action == 'delete'
                                  ? Icons.delete
                                  : Icons.check_circle,
                              color: action == 'delete'
                                  ? Colors.red
                                  : const Color(0xFF10B981),
                              size: 40)),
                      const SizedBox(height: 24),
                      const Text("ARE YOU SURE?",
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              fontStyle: FontStyle.italic)),
                      const SizedBox(height: 12),
                      Text(
                          action == 'delete'
                              ? "Delete these results? It will be completely removed from students' report cards!"
                              : "Publish report cards? All students in this class will be able to see their marks.",
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey,
                              height: 1.5)),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.pop(ctx),
                              child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                  decoration: BoxDecoration(
                                      color: isDark
                                          ? const Color(0xFF0F172A)
                                          : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(20)),
                                  child: Text("CANCEL",
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: isDark
                                              ? Colors.white
                                              : Colors.black,
                                          letterSpacing: 1.5))),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                Navigator.pop(ctx);
                                _executeActionConfirm(action, id);
                              },
                              child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                  decoration: BoxDecoration(
                                      color: action == 'delete'
                                          ? Colors.red
                                          : const Color(0xFF10B981),
                                      borderRadius: BorderRadius.circular(20)),
                                  child: const Text("YES, CONFIRM",
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                          letterSpacing: 1.5))),
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

  void _showEditorConfirmModal() => _showConfirmModal('editor');
}

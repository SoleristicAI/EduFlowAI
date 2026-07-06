import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:file_selector/file_selector.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class StudentLeaveRequest extends ConsumerStatefulWidget {
  const StudentLeaveRequest({super.key});

  @override
  ConsumerState<StudentLeaveRequest> createState() => _StudentLeaveRequestState();
}

class _StudentLeaveRequestState extends ConsumerState<StudentLeaveRequest> {
  bool isInitialLoading = true; // 🔥 BADA LOADER (Sirf Page Load / Submit pe aayega)
  bool isProcessing = false;
  
  String leaveType = 'One Day';
  DateTime fromDate = DateTime.now();
  DateTime? toDate;
  String reason = '';
  XFile? document;
  String docType = 'Leave Application';

  final List<String> reasonsList = [
    "Sick Leave",
    "Medical Leave",
    "Family Function",
    "Personal Work",
    "Emergency Leave",
    "Exam Preparation",
    "Other"
  ];

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  Future<void> _initializeForm() async {
    // Simulated fake delay to show premium initial loader
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) setState(() => isInitialLoading = false);
  }

  // 🔥 REFRESH PAR AB BADA LOADER NAHI AAYEGA 🔥
  Future<void> _handleRefresh() async {
    // Is function ke andar `isInitialLoading = true` NAHI karna hai
    await Future.delayed(const Duration(milliseconds: 600)); // Network simulation
    if (mounted) setState(() {});
  }

  void _updateDocType(String selectedReason) {
    if (selectedReason == 'Sick Leave' || 
        selectedReason == 'Medical Leave' || 
        selectedReason == 'Medical Checkup') {
      setState(() {
        docType = 'Lab Report';
      });
    } else {
      setState(() {
        docType = 'Leave Application';
      });
    }
  }

  Future<void> _pickDate(BuildContext context, bool isFromDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isFromDate ? fromDate : (toDate ?? fromDate),
      firstDate: isFromDate ? DateTime.now() : fromDate, 
      lastDate: DateTime(DateTime.now().year + 1),
      builder: (context, child) {
        final isDark = ref.read(themeProvider) == ThemeMode.dark;
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: isDark ? const ColorScheme.dark(
              primary: Color(0xFF42A5F5),
              onPrimary: Colors.white,
              surface: Color(0xFF1E293B),
              onSurface: Colors.white,
            ) : const ColorScheme.light(
              primary: Color(0xFF42A5F5),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Color(0xFF1E293B),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isFromDate) {
          fromDate = picked;
          if (toDate != null && toDate!.isBefore(fromDate)) {
            toDate = null;
          }
        } else {
          toDate = picked;
        }
      });
    }
  }

  void _showReasonPicker(Color bottomSheetBg, Color textColorPrimary) {
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
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: reasonsList.length,
                  itemBuilder: (context, index) {
                    final r = reasonsList[index];
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          reason = r;
                        });
                        _updateDocType(r);
                        Navigator.pop(context);
                      },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: reason == r ? const Color(0xFF42A5F5) : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          r,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            color: reason == r ? Colors.white : textColorPrimary,
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

  Future<void> _pickDocument() async {
    final XFile? file = await openFile();
    if (file != null) {
      setState(() {
        document = file;
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (reason.isEmpty) {
      _showToast("Please select a reason! ⚠️", isError: true);
      return;
    }
    if (document == null) {
      _showToast("Please upload document! ⚠️", isError: true);
      return;
    }

    // Submit ke time bada loader dikhao
    setState(() {
      isProcessing = true;
      isInitialLoading = true; 
    });

    try {
      String formattedFrom = DateFormat('yyyy-MM-dd').format(fromDate);
      String formattedTo = leaveType == 'Multiple Days' 
          ? (toDate != null ? DateFormat('yyyy-MM-dd').format(toDate!) : formattedFrom) 
          : formattedFrom;

      FormData formData = FormData.fromMap({
        'leaveType': leaveType,
        'fromDate': formattedFrom,
        'toDate': formattedTo,
        'reason': reason,
        'documentType': docType,
        'document': await MultipartFile.fromFile(document!.path, filename: document!.name),
      });

      await ApiClient.dio.post('/leaves/apply', data: formData);

      _showToast("Request Submitted Successfully! 🛡️");

      setState(() {
        leaveType = 'One Day';
        fromDate = DateTime.now();
        toDate = null;
        reason = '';
        document = null;
        docType = 'Leave Application';
      });

    } catch (e) {
      _showToast("Submission failed! Try again.", isError: true);
    } finally {
      setState(() {
        isProcessing = false;
        isInitialLoading = false; // Loader hatao
      });
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
    if (isInitialLoading) return const CustomLoader(); // 🔥 ONLY FOR INITIAL OR SUBMIT

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color inputBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) context.pop();
        else context.go('/');
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
                            // 🔥 TERA REQUEST KIYA GAYA EXACT LAYOUT 🔥
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // BACK BUTTON
                                GestureDetector(
                                  onTap: () {
                                    if (context.canPop())
                                      context.pop();
                                    else
                                      context.go('/');
                                  },
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
                                
                                // CENTER TITLE & SUBTITLE
                                Column(
                                  children: [
                                    const Text("Leave Request",
                                        style: TextStyle(
                                            fontSize: 28, // Scaled down for mobile fit
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            fontStyle: FontStyle.italic,
                                            letterSpacing: -1)),
                                    Text("SUBMIT OFFICIAL APPLICATION",
                                        style: TextStyle(
                                            fontSize: 9, // Scaled down
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white.withOpacity(0.9),
                                            letterSpacing: 2)),
                                  ],
                                ),

                                // RIGHT ICON
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                        color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: const Icon(Icons.description,
                                      color: Colors.white, size: 24),
                                ),
                              ],
                            ),
                            
                            const SizedBox(height: 25), // Spacing before toggle button
                            
                            // --- BUTTON BELOW TITLE ---
                            GestureDetector(
                              onTap: () => context.push('/student/leave-history'),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 300),
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                decoration: BoxDecoration(
                                    color: isDarkMode ? const Color(0xFF1E293B) : Colors.white, 
                                    borderRadius: BorderRadius.circular(25),
                                    border: Border.all(color: isDarkMode ? const Color(0xFF334155) : Colors.transparent),
                                    boxShadow: const [
                                      BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))
                                    ]),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: const [
                                    Icon(Icons.history, color: Color(0xFF42A5F5), size: 18),
                                    SizedBox(width: 8),
                                    Text(
                                      "VIEW MY LEAVE HISTORY",
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF42A5F5),
                                          letterSpacing: 1.5,
                                          fontStyle: FontStyle.italic),
                                    )
                                  ],
                                ),
                              ),
                            ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
                          ],
                        ),
                      ),

                      // --- CONTENT AREA ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            children: [
                              // Leave Type Toggle
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 400),
                                padding: const EdgeInsets.all(10), // Compact
                                decoration: BoxDecoration(
                                  color: cardColor,
                                  borderRadius: BorderRadius.circular(35),
                                  border: Border.all(color: cardBorder),
                                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5)]
                                ),
                                child: Row(
                                  children: ['One Day', 'Multiple Days'].map((type) {
                                    bool isSelected = leaveType == type;
                                    return Expanded(
                                      child: GestureDetector(
                                        onTap: () => setState(() => leaveType = type),
                                        child: AnimatedContainer(
                                          duration: const Duration(milliseconds: 300),
                                          padding: const EdgeInsets.symmetric(vertical: 16), // Compact
                                          decoration: BoxDecoration(
                                            color: isSelected ? const Color(0xFF42A5F5) : Colors.transparent,
                                            borderRadius: BorderRadius.circular(25),
                                            boxShadow: isSelected ? [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 5))] : []
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(
                                            type.toUpperCase(),
                                            style: TextStyle(
                                              fontSize: 11, // Font reduced
                                              fontWeight: FontWeight.w900,
                                              fontStyle: FontStyle.italic,
                                              letterSpacing: 1.5,
                                              color: isSelected ? Colors.white : textColorSecondary
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),
                              const SizedBox(height: 20),

                              // Main Form Box
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 400),
                                padding: const EdgeInsets.all(24), // Compact padding
                                decoration: BoxDecoration(
                                  color: cardColor,
                                  borderRadius: BorderRadius.circular(40),
                                  border: Border.all(color: cardBorder),
                                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)]
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildLabel("FROM DATE", textColorSecondary),
                                    _buildDatePickerBtn(
                                      date: fromDate,
                                      onTap: () => _pickDate(context, true),
                                      inputBg: inputBg,
                                      inputBorder: inputBorder,
                                      textColorPrimary: textColorPrimary,
                                    ),
                                    
                                    if (leaveType == 'Multiple Days') ...[
                                      const SizedBox(height: 20),
                                      _buildLabel("TO DATE", textColorSecondary),
                                      _buildDatePickerBtn(
                                        date: toDate,
                                        onTap: () => _pickDate(context, false),
                                        inputBg: inputBg,
                                        inputBorder: inputBorder,
                                        textColorPrimary: textColorPrimary,
                                        isPlaceholder: toDate == null,
                                      ),
                                    ],
                                    const SizedBox(height: 20),

                                    _buildLabel("SELECT REASON", textColorSecondary),
                                    GestureDetector(
                                      onTap: () => _showReasonPicker(cardColor, textColorPrimary),
                                      child: AnimatedContainer(
                                        duration: const Duration(milliseconds: 400),
                                        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
                                        decoration: BoxDecoration(
                                          color: inputBg,
                                          borderRadius: BorderRadius.circular(25),
                                          border: Border.all(color: inputBorder),
                                        ),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              reason.isEmpty ? "Choose Reason" : reason,
                                              style: TextStyle(
                                                fontSize: 14, // Scaled down
                                                fontWeight: FontWeight.w900,
                                                fontStyle: FontStyle.italic,
                                                color: reason.isEmpty ? textColorSecondary : textColorPrimary
                                              ),
                                            ),
                                            Icon(Icons.keyboard_arrow_down, color: textColorSecondary, size: 20)
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),
                              const SizedBox(height: 20),

                              // Upload Section
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 400),
                                width: double.infinity,
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  color: cardColor,
                                  borderRadius: BorderRadius.circular(40),
                                  border: Border.all(color: cardBorder),
                                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)]
                                ),
                                child: Column(
                                  children: [
                                    Text(docType.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2, fontStyle: FontStyle.italic)),
                                    const SizedBox(height: 20),
                                    
                                    document == null
                                        ? GestureDetector(
                                            onTap: _pickDocument,
                                            child: Container(
                                              width: double.infinity,
                                              padding: const EdgeInsets.symmetric(vertical: 30),
                                              decoration: BoxDecoration(
                                                color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.2) : Colors.blue.shade50.withOpacity(0.3),
                                                borderRadius: BorderRadius.circular(30),
                                                border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100, width: 2, style: BorderStyle.solid),
                                              ),
                                              child: Column(
                                                children: [
                                                  const Icon(Icons.upload_file, color: Color(0xFF42A5F5), size: 28),
                                                  const SizedBox(height: 12),
                                                  const Text("UPLOAD DOCUMENT", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic)),
                                                ],
                                              ),
                                            ),
                                          )
                                        : Container(
                                            padding: const EdgeInsets.all(20),
                                            decoration: BoxDecoration(
                                              color: isDarkMode ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5),
                                              borderRadius: BorderRadius.circular(25),
                                              border: Border.all(color: isDarkMode ? const Color(0xFF064E3B) : const Color(0xFFD1FAE5))
                                            ),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.description, color: Color(0xFF10B981), size: 28),
                                                const SizedBox(width: 12),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      const Text("DOCUMENT ATTACHED", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF10B981), fontStyle: FontStyle.italic)),
                                                      Text(document!.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: textColorPrimary, fontWeight: FontWeight.bold)),
                                                    ],
                                                  ),
                                                ),
                                                GestureDetector(
                                                  onTap: () => setState(() => document = null),
                                                  child: Container(
                                                    padding: const EdgeInsets.all(8),
                                                    decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                                                    child: const Icon(Icons.close, color: Colors.white, size: 14),
                                                  ),
                                                )
                                              ],
                                            ),
                                          ).animate().scale()
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),
                              const SizedBox(height: 24),

                              // Submit Button
                              GestureDetector(
                                onTap: (isProcessing || reason.isEmpty || document == null) ? null : _handleSubmit,
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 20),
                                  decoration: BoxDecoration(
                                    color: (reason.isEmpty || document == null) ? (isDarkMode ? const Color(0xFF334155) : Colors.grey.shade300) : const Color(0xFF42A5F5),
                                    borderRadius: BorderRadius.circular(35),
                                    boxShadow: (reason.isEmpty || document == null) ? [] : [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    isProcessing ? "UPLOADING..." : "SUBMIT REQUEST",
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: (reason.isEmpty || document == null) ? textColorSecondary : Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic),
                                  ),
                                ),
                              ),
                            ],
                          ),
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

  Widget _buildLabel(String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 8),
      child: Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: color, letterSpacing: 2, fontStyle: FontStyle.italic)),
    );
  }

  Widget _buildDatePickerBtn({required DateTime? date, required VoidCallback onTap, required Color inputBg, required Color inputBorder, required Color textColorPrimary, bool isPlaceholder = false}) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: BoxDecoration(
          color: inputBg,
          borderRadius: BorderRadius.circular(25),
          border: Border.all(color: inputBorder),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isPlaceholder ? "Select Date" : DateFormat('dd MMM yyyy').format(date!),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                fontStyle: FontStyle.italic,
                color: isPlaceholder ? const Color(0xFF94A3B8) : textColorPrimary
              ),
            ),
            const Icon(Icons.calendar_today, color: Color(0xFF42A5F5), size: 18)
          ],
        ),
      ),
    );
  }
}
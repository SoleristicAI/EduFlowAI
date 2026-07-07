import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_selector/file_selector.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';

class TechnicalSupportModal extends ConsumerStatefulWidget {
  const TechnicalSupportModal({super.key});

  @override
  ConsumerState<TechnicalSupportModal> createState() =>
      _TechnicalSupportModalState();
}

class _TechnicalSupportModalState extends ConsumerState<TechnicalSupportModal> {
  String activeTab = 'new'; // 'new' or 'history'
  bool isSubmitting = false;
  bool isFetchingHistory = false;

  List<dynamic> history = [];

  // Form State
  String issueType = '';
  final TextEditingController _descCtrl = TextEditingController();
  XFile? screenshot;

  final List<String> issueTypes = [
    "Bug Report",
    "App Crash",
    "Login Issue",
    "Attendance Issue",
    "Results Issue",
    "Timetable Issue",
    "Notification Issue",
    "App Performance",
    "UI / Design Issue",
    "Feature Request",
    "Other"
  ];

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchHistory() async {
    setState(() => isFetchingHistory = true);
    try {
      final response = await ApiClient.dio.get('/technical/my-history');
      if (mounted) {
        setState(() {
          history = response.data as List<dynamic>;
        });
      }
    } catch (err) {
      debugPrint("History Fetch Error: $err");
    } finally {
      if (mounted) setState(() => isFetchingHistory = false);
    }
  }

  void _switchTab(String tab) {
    if (activeTab == tab) return;
    setState(() => activeTab = tab);
    if (tab == 'history' && history.isEmpty) {
      _fetchHistory();
    }
  }

  Future<void> _pickImage() async {
    final XFile? file = await openFile(acceptedTypeGroups: [
      const XTypeGroup(label: 'Images', extensions: ['jpg', 'png', 'jpeg'])
    ]);
    if (file != null) {
      setState(() => screenshot = file);
    }
  }

  void _showCategoryPicker(Color bottomSheetBg, Color textColorPrimary) {
    showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (context) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: bottomSheetBg,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(40)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 5,
                  decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(10)),
                ),
                const SizedBox(height: 20),
                Expanded(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: issueTypes.length,
                    itemBuilder: (context, index) {
                      final type = issueTypes[index];
                      return GestureDetector(
                        onTap: () {
                          setState(() => issueType = type);
                          Navigator.pop(context);
                        },
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: issueType == type
                                ? const Color(0xFF42A5F5)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            type,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              fontStyle: FontStyle.italic,
                              color: issueType == type
                                  ? Colors.white
                                  : textColorPrimary,
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
        });
  }

  Future<void> _handleSubmit() async {
    if (issueType.isEmpty) {
      _showToast("Select Issue Type! 🛡️", isError: true);
      return;
    }
    if (_descCtrl.text.trim().isEmpty) {
      _showToast("Please provide a description.", isError: true);
      return;
    }

    setState(() => isSubmitting = true);

    try {
      FormData formData = FormData.fromMap({
        'issueType': issueType,
        'description': _descCtrl.text.trim(),
      });

      if (screenshot != null) {
        formData.files.add(MapEntry(
          'screenshot',
          await MultipartFile.fromFile(screenshot!.path,
              filename: screenshot!.name),
        ));
      }

      await ApiClient.dio.post('/technical/report', data: formData);

      _showToast("Your signal was transmitted successfully! 🚀");

      setState(() {
        issueType = '';
        _descCtrl.clear();
        screenshot = null;
      });

      // Auto close modal on success
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) Navigator.pop(context);
      });
    } catch (err) {
      _showToast("Transmission Failed. Protocol Interrupted.", isError: true);
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isError ? Icons.warning_amber_rounded : Icons.check_circle,
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
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder =
        isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary =
        isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary =
        isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);
    final Color inputBg =
        isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
      child: Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          width: double.infinity,
          constraints: const BoxConstraints(maxWidth: 450, maxHeight: 700),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(45),
            border: Border.all(color: cardBorder, width: 1.5),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withOpacity(isDarkMode ? 0.5 : 0.1),
                  blurRadius: 40,
                  spreadRadius: 10)
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // --- HEADER NODE ---
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDarkMode
                        ? [
                            const Color(0xFF1E3A8A).withOpacity(0.3),
                            Colors.transparent
                          ]
                        : [
                            Colors.blue.shade50.withOpacity(0.5),
                            Colors.transparent
                          ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(45)),
                  border: Border(bottom: BorderSide(color: cardBorder)),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // 🔥 FIX: SizedBox(width: double.infinity) lagaya jisse button ekdum right edge par chala jaye 🔥
                    SizedBox(
                      width: double.infinity,
                      child: Column(
                        children: [
                          Text("SUPPORT", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.warning_amber_rounded, color: Color(0xFF42A5F5), size: 14),
                              const SizedBox(width: 6),
                              const Text("TECHNICAL PROBLEMS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2, fontStyle: FontStyle.italic)),
                            ],
                          )
                        ],
                      ),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      child: GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: inputBg,
                            shape: BoxShape.circle,
                            border: Border.all(color: cardBorder)
                          ),
                          child: Icon(Icons.close, size: 18, color: textColorSecondary),
                        ),
                      ),
                    )
                  ],
                ),
              ),

              // --- TAB INTERFACE ---
              Padding(
                padding: const EdgeInsets.all(20),
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                      color: inputBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: cardBorder)),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _switchTab('new'),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                                color: activeTab == 'new'
                                    ? cardColor
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(15),
                                boxShadow: activeTab == 'new'
                                    ? [
                                        BoxShadow(
                                            color:
                                                Colors.black.withOpacity(0.05),
                                            blurRadius: 5)
                                      ]
                                    : [],
                                border: activeTab == 'new'
                                    ? Border.all(color: cardBorder)
                                    : Border.all(color: Colors.transparent)),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.chat_bubble_outline,
                                    size: 16,
                                    color: activeTab == 'new'
                                        ? const Color(0xFF42A5F5)
                                        : textColorSecondary),
                                const SizedBox(width: 8),
                                Text("NEW QUERY",
                                    style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                        color: activeTab == 'new'
                                            ? const Color(0xFF42A5F5)
                                            : textColorSecondary,
                                        fontStyle: FontStyle.italic,
                                        letterSpacing: 1)),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _switchTab('history'),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                                color: activeTab == 'history'
                                    ? cardColor
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(15),
                                boxShadow: activeTab == 'history'
                                    ? [
                                        BoxShadow(
                                            color:
                                                Colors.black.withOpacity(0.05),
                                            blurRadius: 5)
                                      ]
                                    : [],
                                border: activeTab == 'history'
                                    ? Border.all(color: cardBorder)
                                    : Border.all(color: Colors.transparent)),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.history,
                                    size: 16,
                                    color: activeTab == 'history'
                                        ? const Color(0xFF42A5F5)
                                        : textColorSecondary),
                                const SizedBox(width: 8),
                                Text("MY HISTORY",
                                    style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                        color: activeTab == 'history'
                                            ? const Color(0xFF42A5F5)
                                            : textColorSecondary,
                                        fontStyle: FontStyle.italic,
                                        letterSpacing: 1)),
                              ],
                            ),
                          ),
                        ),
                      )
                    ],
                  ),
                ),
              ),

              // --- DYNAMIC CONTENT AREA ---
              Expanded(
                child: SingleChildScrollView(
                  padding:
                      const EdgeInsets.only(left: 24, right: 24, bottom: 24),
                  physics: const BouncingScrollPhysics(),
                  child: activeTab == 'new'
                      ? _buildNewQueryForm(inputBg, cardBorder,
                          textColorPrimary, textColorSecondary)
                      : _buildHistoryList(cardColor, cardBorder,
                          textColorPrimary, textColorSecondary),
                ),
              )
            ],
          ),
        ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
      ),
    );
  }

  // --- NEW QUERY FORM ---
  Widget _buildNewQueryForm(Color inputBg, Color cardBorder,
      Color textColorPrimary, Color textColorSecondary) {
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category Selection
        Padding(
          padding: const EdgeInsets.only(left: 12, bottom: 8),
          child: Text("CATEGORY *",
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: textColorPrimary,
                  fontStyle: FontStyle.italic,
                  letterSpacing: 2)),
        ),
        GestureDetector(
          onTap: () => _showCategoryPicker(
              isDarkMode ? const Color(0xFF1E293B) : Colors.white,
              textColorPrimary),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: inputBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: cardBorder),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  issueType.isEmpty ? "Choose issue type..." : issueType,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: issueType.isEmpty
                          ? textColorSecondary
                          : textColorPrimary,
                      fontStyle: FontStyle.italic),
                ),
                Icon(Icons.keyboard_arrow_down,
                    color: textColorSecondary, size: 20)
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Description
        Padding(
          padding: const EdgeInsets.only(left: 12, bottom: 8),
          child: Text("DETAILED DESCRIPTION *",
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: textColorPrimary,
                  fontStyle: FontStyle.italic,
                  letterSpacing: 2)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
          decoration: BoxDecoration(
            color: inputBg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: cardBorder),
          ),
          child: TextField(
            controller: _descCtrl,
            maxLines: 4,
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: textColorPrimary,
                fontStyle: FontStyle.italic),
            decoration: InputDecoration(
              hintText: "Brief the technical issue...",
              hintStyle: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: textColorSecondary,
                  fontStyle: FontStyle.italic),
              border: InputBorder.none,
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Screenshot Upload
        screenshot == null
            ? GestureDetector(
                onTap: _pickImage,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 30),
                  decoration: BoxDecoration(
                    color: isDarkMode
                        ? const Color(0xFF1E3A8A).withOpacity(0.2)
                        : Colors.blue.shade50.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(
                        color: isDarkMode
                            ? const Color(0xFF1E3A8A)
                            : Colors.blue.shade100,
                        width: 2,
                        style: BorderStyle.solid),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.cloud_upload,
                          color: Color(0xFF42A5F5), size: 32),
                      const SizedBox(height: 12),
                      const Text("CAPTURE SCREENSHOT",
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF42A5F5),
                              fontStyle: FontStyle.italic,
                              letterSpacing: 1)),
                    ],
                  ),
                ),
              )
            : Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: inputBg,
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(color: cardBorder),
                ),
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Image.file(File(screenshot!.path),
                          height: 120,
                          width: double.infinity,
                          fit: BoxFit.cover), // Fixed for Dart
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        onTap: () => setState(() => screenshot = null),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                              color: Colors.redAccent, shape: BoxShape.circle),
                          child: const Icon(Icons.close,
                              color: Colors.white, size: 14),
                        ),
                      ),
                    )
                  ],
                ),
              ).animate().scale(),

        const SizedBox(height: 32),

        // Submit Button
        GestureDetector(
          onTap: isSubmitting ? null : _handleSubmit,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: BoxDecoration(
                color: const Color(0xFF42A5F5),
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                      color: const Color(0xFF42A5F5).withOpacity(0.4),
                      blurRadius: 15,
                      offset: const Offset(0, 5))
                ]),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                isSubmitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 3))
                    : const Icon(Icons.send, color: Colors.white, size: 18),
                const SizedBox(width: 12),
                Text(isSubmitting ? "TRANSMITTING..." : "SUBMIT REPORT",
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 2,
                        fontStyle: FontStyle.italic)),
              ],
            ),
          ),
        ).animate().scale(delay: 200.ms)
      ],
    ).animate().fadeIn().slideX(begin: -0.1);
  }

  // --- HISTORY LIST ---
  Widget _buildHistoryList(Color cardColor, Color cardBorder,
      Color textColorPrimary, Color textColorSecondary) {
    if (isFetchingHistory) {
      return const Padding(
        padding: EdgeInsets.all(40),
        child:
            Center(child: CircularProgressIndicator(color: Color(0xFF42A5F5))),
      );
    }

    if (history.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 60),
        child: Column(
          children: [
            Icon(Icons.bolt,
                size: 60, color: textColorSecondary.withOpacity(0.3)),
            const SizedBox(height: 16),
            Text("NO LOGS FOUND",
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: textColorSecondary,
                    fontStyle: FontStyle.italic,
                    letterSpacing: 2)),
          ],
        ),
      ).animate().fadeIn();
    }

    return Column(
      children: history.map((h) {
        final bool isResolved = h['status'] == 'Resolved';
        final Color statusColor =
            isResolved ? const Color(0xFF10B981) : const Color(0xFFF59E0B);
        final Color statusBg =
            isResolved ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7);

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(25),
            border: Border.all(color: cardBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                      child: Text(
                          (h['issueType'] ?? '').toString().toUpperCase(),
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              color: textColorPrimary,
                              fontStyle: FontStyle.italic))),
                  Text(
                      h['createdAt'] != null
                          ? DateFormat('dd/MM/yyyy')
                              .format(DateTime.parse(h['createdAt']))
                          : '',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: textColorSecondary,
                          fontStyle: FontStyle.italic)),
                ],
              ),
              const SizedBox(height: 12),
              Text("\"${h['description'] ?? 'No briefing provided.'}\"",
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: textColorSecondary,
                      fontStyle: FontStyle.italic,
                      height: 1.4)),
              const SizedBox(height: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.3))),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                            color: statusColor, shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    Text((h['status'] ?? 'Pending').toString().toUpperCase(),
                        style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: statusColor,
                            letterSpacing: 1.5,
                            fontStyle: FontStyle.italic)),
                  ],
                ),
              )
            ],
          ),
        ).animate().fadeIn().slideY(begin: 0.1);
      }).toList(),
    );
  }
}

import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class FinanceFeesNotice extends ConsumerStatefulWidget {
  const FinanceFeesNotice({super.key});

  @override
  ConsumerState<FinanceFeesNotice> createState() => _FinanceFeesNoticeState();
}

class _FinanceFeesNoticeState extends ConsumerState<FinanceFeesNotice> {
  bool isInitialLoading = true;
  bool isSubmitting = false;

  String noticeType = '';
  String? editingNoticeId;
  final TextEditingController _contentController = TextEditingController();

  List<dynamic> pendingData = [];
  List<dynamic> publishedNotices = [];
  String? expandedClass;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _fetchData({bool hideLoader = false}) async {
    if (!hideLoader) setState(() => isInitialLoading = true);

    try {
      final results = await Future.wait([
        ApiClient.dio.get('/fee-notices/pending-by-classes'),
        ApiClient.dio.get('/fee-notices/view'),
      ]);

      if (mounted) {
        setState(() {
          List<dynamic> rawPending = results[0].data ?? [];
          rawPending.sort((a, b) {
            String g1 = a['className']?.toString() ?? '';
            String g2 = b['className']?.toString() ?? '';
            int getWeight(String g) {
              String gl = g.toLowerCase();
              if (gl.contains('play') || gl.contains('pre')) return -4;
              if (gl.contains('nur')) return -3;
              if (gl.contains('lkg') || gl.contains('kg1')) return -2;
              if (gl.contains('ukg') || gl.contains('kg2')) return -1;
              final match = RegExp(r'\d+').firstMatch(gl);
              if (match != null) return int.parse(match.group(0)!);
              return 999;
            }
            int w1 = getWeight(g1);
            int w2 = getWeight(g2);
            if (w1 != w2) return w1.compareTo(w2);
            return g1.compareTo(g2);
          });

          pendingData = rawPending;
          publishedNotices = results[1].data['notices'] ?? [];
        });
      }
    } catch (e) {
      _showToast("Failed to sync terminal records", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchData(hideLoader: true);
  }

  Future<void> _handleNoticeSelect(String type) async {
    setState(() {
      noticeType = type;
      editingNoticeId = null;
    });

    if (type == 'fee_alert') {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      String schoolName = "School Administration";
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        schoolName = userData['schoolData']?['schoolName'] ?? "School Administration";
      }

      final String currentMonth = DateFormat('MMMM').format(DateTime.now());
      final String currentYear = DateTime.now().year.toString();

      final List<String> templates = [
        "Dear Parent,\n\nWe hope this message finds you well. This is a gentle reminder that the school fee for the billing cycle of $currentMonth $currentYear is currently due.\n\nTo ensure uninterrupted access to all school services, kindly clear the dues at your earliest convenience. If the payment has already been processed, please disregard this notice.\n\nThank you for your continued cooperation.\n\nRegards,\n$schoolName",
        "Dear Parent,\n\nGreetings from $schoolName.\n\nWe are writing to kindly remind you that the fee installment for $currentMonth $currentYear remains pending in our records. We request you to process the payment as soon as possible.\n\nIf you have already made the payment recently, please accept our thanks and ignore this alert.\n\nWarm Regards,\n$schoolName",
        "Dear Parent,\n\nTrust you are having a great day.\n\nOur financial records indicate an outstanding fee balance for your ward for the month of $currentMonth $currentYear. We kindly request you to settle the dues at your earliest convenience.\n\nFor any discrepancies or if the fee is already paid, kindly ignore this message.\n\nBest Regards,\n$schoolName"
      ];

      final String selectedTemplate = templates[Random().nextInt(templates.length)];
      _contentController.text = selectedTemplate;
    } else {
      _contentController.clear();
    }
  }

  Future<void> _handlePublish() async {
    if (noticeType.isEmpty) return _showToast("Please select notice type first!", isError: true);
    if (_contentController.text.trim().isEmpty) return _showToast("Notice content cannot be empty.", isError: true);

    setState(() => isSubmitting = true);
    try {
      if (editingNoticeId != null) {
        await ApiClient.dio.put('/fee-notices/update/$editingNoticeId', data: {
          'type': noticeType,
          'message': _contentController.text.trim()
        });
        _showToast("Notice updated successfully ✅");
      } else {
        await ApiClient.dio.post('/fee-notices/publish', data: {
          'type': noticeType,
          'message': _contentController.text.trim()
        });
        _showToast("ERP Fees Notice sent successfully ✅");
      }

      setState(() {
        noticeType = '';
        _contentController.clear();
        editingNoticeId = null;
      });
      
      await _fetchData(hideLoader: true);
    } catch (e) {
      _showToast("Broadcast communication failure ❌", isError: true);
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
  }

  Future<void> _handleDelete(String noticeId) async {
    setState(() => isInitialLoading = true);
    try {
      await ApiClient.dio.delete('/fee-notices/delete/$noticeId');
      _showToast("Notice Deleted successfully 🗑️");
      await _fetchData(hideLoader: true);
    } catch (e) {
      _showToast("Termination failed ❌", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  void _showDeleteConfirmModal(String noticeId) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Confirm Termination',
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
                  decoration: BoxDecoration(color: isDark ? const Color(0xFF1E293B) : Colors.white, borderRadius: BorderRadius.circular(35)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(padding: const EdgeInsets.all(20), decoration: const BoxDecoration(color: Color(0xFFFFFBEB), shape: BoxShape.circle), child: const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 40)),
                      const SizedBox(height: 24),
                      const Text("CONFIRM TERMINATION?", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                      const SizedBox(height: 12),
                      const Text("This action cannot be undone.", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey, height: 1.5)),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.pop(ctx),
                              child: Container(padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)), child: Text("NO", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black, letterSpacing: 1.5))),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                Navigator.pop(ctx);
                                _handleDelete(noticeId);
                              },
                              child: Container(padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: const Color(0xFFF43F5E), borderRadius: BorderRadius.circular(20)), child: const Text("YES, DELETE", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5))),
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

  void _showNoticeTypeSheet(bool isDark) {
    showModalBottomSheet(
      context: context, backgroundColor: Colors.transparent, isScrollControlled: true,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.only(top: 12, left: 24, right: 24, bottom: 40),
          decoration: BoxDecoration(color: isDark ? const Color(0xFF1E293B) : Colors.white, borderRadius: const BorderRadius.vertical(top: Radius.circular(40)), border: Border(top: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFDDE3EA), width: 2))),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 50, height: 5, margin: const EdgeInsets.only(bottom: 24), decoration: BoxDecoration(color: isDark ? const Color(0xFF334155) : Colors.grey.shade300, borderRadius: BorderRadius.circular(10))),
              const Text("SELECT NOTICE TEMPLATE", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1)),
              const SizedBox(height: 20),
              GestureDetector(
                onTap: () {
                  _handleNoticeSelect('fee_alert');
                  Navigator.pop(context);
                },
                child: Container(
                  width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16), margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(color: noticeType == 'fee_alert' ? const Color(0xFF42A5F5).withOpacity(0.1) : (isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9)), borderRadius: BorderRadius.circular(20), border: Border.all(color: noticeType == 'fee_alert' ? const Color(0xFF42A5F5) : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)))),
                  child: Text("Fee Alert (Pending Balance Notice)", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: noticeType == 'fee_alert' ? const Color(0xFF42A5F5) : (isDark ? Colors.white : Colors.black87), fontStyle: FontStyle.italic)),
                ),
              ),
              GestureDetector(
                onTap: () {
                  _handleNoticeSelect('others');
                  Navigator.pop(context);
                },
                child: Container(
                  width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16), margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(color: noticeType == 'others' ? const Color(0xFF42A5F5).withOpacity(0.1) : (isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9)), borderRadius: BorderRadius.circular(20), border: Border.all(color: noticeType == 'others' ? const Color(0xFF42A5F5) : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)))),
                  child: Text("Others (Custom Manual Input)", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: noticeType == 'others' ? const Color(0xFF42A5F5) : (isDark ? Colors.white : Colors.black87), fontStyle: FontStyle.italic)),
                ),
              ),
              if (noticeType.isNotEmpty)
                GestureDetector(
                  onTap: () {
                    setState(() {
                      noticeType = '';
                      _contentController.clear();
                      editingNoticeId = null;
                    });
                    Navigator.pop(context);
                  },
                  child: Container(
                    width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.3))),
                    child: const Text("❌ CANCEL SELECTION", textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFFF43F5E), letterSpacing: 2)),
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
    if (isInitialLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final String todayDate = DateFormat('EEEE, d MMMM yyyy').format(DateTime.now());

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) context.pop();
        else context.go('/finance/dashboard');
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
              physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()),
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // --- STRICT UNTOUCHED PREMIUM HEADER ---
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
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (context.canPop()) context.pop();
                                else context.go('/finance/dashboard');
                              },
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
                                const Text("Fees Notice Hub",
                                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.calendar_today, size: 10, color: Colors.white),
                                    const SizedBox(width: 4),
                                    Text(todayDate.toUpperCase(),
                                        style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 1.5)),
                                  ],
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
                              child: const Icon(Icons.campaign, color: Colors.white, size: 24),
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      // --- DYNAMIC BODY CONTENT ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              
                              // 1. NOTIFIER SELECTOR TRIGGER
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(32),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF42A5F5),
                                  borderRadius: BorderRadius.circular(40),
                                  boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("NOTICE TEMPLATE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.8), letterSpacing: 2, fontStyle: FontStyle.italic)),
                                    const SizedBox(height: 20),
                                    GestureDetector(
                                      onTap: () => _showNoticeTypeSheet(isDarkMode),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                noticeType == 'fee_alert' ? 'Fee Alert' : noticeType == 'others' ? 'Others (Custom Notice)' : 'Choose Notice Template',
                                                maxLines: 1, overflow: TextOverflow.ellipsis,
                                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: noticeType.isEmpty ? const Color(0xFF94A3B8) : const Color(0xFF1E293B), fontStyle: FontStyle.italic)
                                              ),
                                            ),
                                            const Icon(Icons.keyboard_arrow_down, color: Color(0xFF42A5F5)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),

                              // 2. COMPILE CONTAINER (DABBA FIXED HERE)
                              AnimatedSize(
                                duration: const Duration(milliseconds: 300),
                                child: noticeType.isNotEmpty ? Container(
                                  margin: const EdgeInsets.only(top: 24),
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: cardColor, 
                                    borderRadius: BorderRadius.circular(35), 
                                    border: Border.all(color: cardBorder), 
                                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // 🔥 FIX: Inner Box hatakar seedha TextField daal diya 🔥
                                      TextField(
                                        controller: _contentController,
                                        maxLines: 8,
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColorPrimary, height: 1.5),
                                        decoration: InputDecoration(
                                          hintText: noticeType == 'others' ? "Write your message here..." : "Compiling template content...",
                                          hintStyle: TextStyle(fontSize: 12, color: textColorSecondary.withOpacity(0.5)),
                                          border: InputBorder.none, // Removes inner borders
                                          contentPadding: EdgeInsets.zero, // Removes inner padding
                                        ),
                                      ),
                                      const SizedBox(height: 24), // Extra spacing before button
                                      GestureDetector(
                                        onTap: isSubmitting ? null : _handlePublish,
                                        child: Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.symmetric(vertical: 18),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF42A5F5), 
                                            borderRadius: BorderRadius.circular(20), 
                                            boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))]
                                          ),
                                          child: isSubmitting 
                                            ? const Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)))
                                            : Row(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  const Icon(Icons.send, color: Colors.white, size: 14),
                                                  const SizedBox(width: 8),
                                                  Text(editingNoticeId != null ? "UPDATE NOTICE LOGS" : "SEND NOTICE", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2)),
                                                ],
                                              ),
                                        ),
                                      )
                                    ],
                                  ),
                                ).animate().fadeIn().slideY(begin: 0.1) : const SizedBox.shrink(),
                              ),

                              const SizedBox(height: 32),

                              // 3. FEE NOTICE HISTORY
                              Text("FEE NOTICE HISTORY", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                              const SizedBox(height: 16),
                              if (publishedNotices.isEmpty)
                                Container(
                                  width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 30),
                                  decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(30), border: Border.all(color: cardBorder, style: BorderStyle.solid)),
                                  child: Text("No published logs found", textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                )
                              else
                                ...publishedNotices.map((notice) {
                                  bool isAlert = notice['noticeType'] == 'fee_alert';
                                  DateTime noticeDate = DateTime.tryParse(notice['createdAt']?.toString() ?? notice['date']?.toString() ?? '') ?? DateTime.now();

                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 16),
                                    padding: const EdgeInsets.all(20),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(30), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))]),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(color: isAlert ? const Color(0xFFF43F5E).withOpacity(0.1) : const Color(0xFFF59E0B).withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                                              child: Icon(Icons.campaign, size: 20, color: isAlert ? const Color(0xFFF43F5E) : const Color(0xFFF59E0B)),
                                            ),
                                            const SizedBox(width: 16),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(notice['title']?.toString().toUpperCase() ?? 'NOTICE', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: -0.5)),
                                                  const SizedBox(height: 4),
                                                  Text(notice['content']?.toString() ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColorSecondary, height: 1.4)),
                                                  const SizedBox(height: 8),
                                                  Row(
                                                    children: [
                                                      Icon(Icons.access_time, size: 10, color: textColorSecondary),
                                                      const SizedBox(width: 4),
                                                      Text(DateFormat('hh:mm a • dd MMM yyyy').format(noticeDate), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1)),
                                                    ],
                                                  )
                                                ],
                                              ),
                                            )
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            GestureDetector(
                                              onTap: () {
                                                setState(() {
                                                  editingNoticeId = notice['_id'];
                                                  noticeType = notice['noticeType'] ?? 'others';
                                                  _contentController.text = notice['content'] ?? '';
                                                });
                                              },
                                              child: Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), decoration: BoxDecoration(color: const Color(0xFF42A5F5).withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF42A5F5).withOpacity(0.3))), child: const Icon(Icons.edit, size: 14, color: Color(0xFF42A5F5))),
                                            ),
                                            const SizedBox(width: 8),
                                            GestureDetector(
                                              onTap: () => _showDeleteConfirmModal(notice['_id']),
                                              child: Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.3))), child: const Icon(Icons.delete, size: 14, color: Color(0xFFF43F5E))),
                                            ),
                                          ],
                                        )
                                      ],
                                    ),
                                  ).animate().fadeIn().slideY(begin: 0.1);
                                }),

                              const SizedBox(height: 32),

                              // 4. PENDING FEES BY CLASS (ACCORDION)
                              Text("PENDING FEES BY CLASS", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFF42A5F5), letterSpacing: 2, fontStyle: FontStyle.italic)),
                              const SizedBox(height: 16),
                              if (pendingData.isEmpty)
                                Container(
                                  width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 30),
                                  decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(30), border: Border.all(color: cardBorder, style: BorderStyle.solid)),
                                  child: Text("All Class Accounts Are Up to Date", textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                )
                              else
                                ...pendingData.map((cls) {
                                  List<dynamic> classStudents = cls['students'] ?? [];
                                  bool isExpanded = expandedClass == cls['className'];

                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 16),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(35), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]),
                                    child: Column(
                                      children: [
                                        GestureDetector(
                                          onTap: () {
                                            setState(() {
                                              expandedClass = isExpanded ? null : cls['className'];
                                            });
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.all(24),
                                            color: Colors.transparent, // Required for tap
                                            child: Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Row(
                                                  children: [
                                                    Container(padding: const EdgeInsets.all(12), decoration: const BoxDecoration(color: Color(0xFF42A5F5), shape: BoxShape.circle), child: const Icon(Icons.layers, size: 18, color: Colors.white)),
                                                    const SizedBox(width: 16),
                                                    Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Text("CLASS ${cls['className']}".toUpperCase(), style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                                        const SizedBox(height: 4),
                                                        Text("${classStudents.length} Defaulters Found", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFFF43F5E), letterSpacing: 1)),
                                                      ],
                                                    ),
                                                  ],
                                                ),
                                                Icon(isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: textColorPrimary, size: 20),
                                              ],
                                            ),
                                          ),
                                        ),
                                        
                                        // ACCORDION EXPANDED CONTENT
                                        AnimatedSize(
                                          duration: const Duration(milliseconds: 300),
                                          curve: Curves.easeInOut,
                                          child: isExpanded ? Container(
                                            padding: const EdgeInsets.only(left: 24, right: 24, bottom: 24),
                                            child: Column(
                                              children: classStudents.map((std) {
                                                return Container(
                                                  margin: const EdgeInsets.only(top: 12),
                                                  padding: const EdgeInsets.all(16),
                                                  decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                                  child: Row(
                                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                    children: [
                                                      Row(
                                                        children: [
                                                          Icon(Icons.person, size: 14, color: textColorSecondary),
                                                          const SizedBox(width: 8),
                                                          Text(std['name']?.toString().toUpperCase() ?? 'UNKNOWN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorPrimary)),
                                                        ],
                                                      ),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                                        decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3))),
                                                        child: Text("₹${NumberFormat('#,##,###').format(std['totalPending'] ?? 0)}", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFFF59E0B), fontStyle: FontStyle.italic)),
                                                      )
                                                    ],
                                                  ),
                                                );
                                              }).toList(),
                                            ),
                                          ) : const SizedBox.shrink(),
                                        )
                                      ],
                                    ),
                                  ).animate().fadeIn().slideY(begin: 0.1);
                                })
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 50), // 🔥 BOTTOM 50px LOCKED 🔥
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
}
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/constants/app_config.dart';

class FinanceGateway extends ConsumerStatefulWidget {
  const FinanceGateway({super.key});

  @override
  ConsumerState<FinanceGateway> createState() => _FinanceGatewayState();
}

class _FinanceGatewayState extends ConsumerState<FinanceGateway> {
  bool isInitialLoading = true;
  bool isEditing = false;
  bool isUpdating = false;

  Map<String, dynamic> settings = {'upiId': '', 'merchantName': ''};
  List<dynamic> pendingVerifications = [];
  List<dynamic> resolvedSignals = [];

  final TextEditingController _upiController = TextEditingController();
final TextEditingController _merchantController = TextEditingController();

  // 🔥 NAYE SESSION STATES 🔥
  String? activeSession;
  List<String> availableSessions = [];

  @override
  void initState() {
    super.initState();
    _initSession();
  }

  @override
  void dispose() {
    _upiController.dispose();
    _merchantController.dispose();
    super.dispose();
  }

  Future<void> _initSession() async {
    try {
      final sessionRes = await ApiClient.dio.get('/users/general/session-info');
      if (mounted) {
        setState(() {
          activeSession = sessionRes.data['activeSession'];
          availableSessions = List<String>.from(sessionRes.data['allAvailableSessions'] ?? []);
        });
        _loadTerminal(sessionParam: activeSession);
      }
    } catch (e) {
      _loadTerminal(); // fallback
    }
  }

  Future<void> _loadTerminal({bool hideLoader = false, String? sessionParam}) async {
    if (!hideLoader) setState(() => isInitialLoading = true);

    try {
      final results = await Future.wait([
        ApiClient.dio.get('/fees/settings/penalty'),
        ApiClient.dio.get('/fees/audit/pending-verifications${sessionParam != null ? "?session=$sessionParam" : ""}'),
      ]);

      if (mounted) {
        final config = results[0].data;
        final auditData = results[1].data;

        if (config['paymentSettings'] != null) {
          settings = {
            'upiId': config['paymentSettings']['upiId'] ?? '',
            'merchantName': config['paymentSettings']['merchantName'] ?? ''
          };
          _upiController.text = settings['upiId'];
          _merchantController.text = settings['merchantName'];
        }

        pendingVerifications = auditData['pending'] ?? [];
        resolvedSignals = auditData['resolved'] ?? [];
      }
    } catch (e) {
      _showToast("Sync error ❌", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _loadTerminal(hideLoader: true);
  }

  Future<void> _handleUpdateSettings() async {
    if (_upiController.text.isEmpty || _merchantController.text.isEmpty) {
      return _showToast("Please fill all fields", isError: true);
    }

    setState(() => isUpdating = true);
    try {
      await ApiClient.dio.post('/fees/settings/gateway', data: {
        'upiId': _upiController.text.trim(),
        'merchantName': _merchantController.text.trim(),
      });
      _showToast("Gateway details updated successfully ✅");
      setState(() => isEditing = false);
      await _loadTerminal(hideLoader: true);
    } catch (e) {
      _showToast("Update failed ❌", isError: true);
    } finally {
      if (mounted) setState(() => isUpdating = false);
    }
  }

  Future<void> _handleDelete() async {
    setState(() => isInitialLoading = true);
    try {
      await ApiClient.dio.delete('/fees/settings/gateway');
      setState(() {
        settings = {'upiId': '', 'merchantName': ''};
        _upiController.clear();
        _merchantController.clear();
        isEditing = true;
      });
      _showToast("Gateway deleted successfully! 🛡️");
      await _loadTerminal(hideLoader: true);
    } catch (e) {
      _showToast("Failed to delete gateway ❌", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleAuditAction(String feeId, String action) async {
    setState(() => isInitialLoading = true);
    try {
      final route = action == 'verify' ? '/fees/audit/verify-payment' : '/fees/audit/reject-payment';
      final res = await ApiClient.dio.post(route, data: {'feeId': feeId});
      
      if (res.data['success'] == true) {
        _showToast(action == 'verify' ? "Payment verified: Fees updated" : "Payment rejected: Fees still pending");
        await _loadTerminal(hideLoader: true);
      }
    } catch (e) {
      _showToast("Action failed: Check neural link", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  // --- MODALS ---
  void _showDeleteConfirmModal() {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Delete Confirm',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, _, __) {
        final isDark = ref.watch(themeProvider) == ThemeMode.dark;
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
                      Container(padding: const EdgeInsets.all(20), decoration: const BoxDecoration(color: Color(0xFFFEF2F2), shape: BoxShape.circle), child: const Icon(Icons.delete_outline, color: Color(0xFFF43F5E), size: 40)),
                      const SizedBox(height: 24),
                      const Text("Delete Details?", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                      const SizedBox(height: 12),
                      const Text("This action cannot be undone. All UPI data will be wiped.", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, height: 1.5, fontStyle: FontStyle.italic)),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.pop(ctx),
                              child: Container(padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)), child: Text("NO, BACK", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black, letterSpacing: 1.5))),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                Navigator.pop(ctx);
                                _handleDelete();
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

  // 🔥 NAYA CONFIRMATION MODAL APPROVE/REJECT KE LIYE 🔥
  void _showConfirmActionModal(String feeId, String action, String studentName) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Action Confirm',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, _, __) {
        final isDark = ref.watch(themeProvider) == ThemeMode.dark;
        final bool isVerify = action == 'verify';
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
                      Container(
                        padding: const EdgeInsets.all(20), 
                        decoration: BoxDecoration(color: isVerify ? const Color(0xFF10B981).withOpacity(0.1) : const Color(0xFFF43F5E).withOpacity(0.1), shape: BoxShape.circle), 
                        child: Icon(isVerify ? Icons.verified_user : Icons.warning_amber_rounded, color: isVerify ? const Color(0xFF10B981) : const Color(0xFFF43F5E), size: 40)
                      ),
                      const SizedBox(height: 24),
                      Text(isVerify ? "CONFIRM APPROVAL?" : "CONFIRM REJECTION?", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                      const SizedBox(height: 12),
                      Text("You are about to ${isVerify ? 'approve' : 'reject'} the payment for ${studentName.toUpperCase()}.", textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, height: 1.5, fontStyle: FontStyle.italic)),
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
                                _handleAuditAction(feeId, action);
                              },
                              child: Container(padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: isVerify ? const Color(0xFF10B981) : const Color(0xFFF43F5E), borderRadius: BorderRadius.circular(20)), child: Text("YES, ${isVerify ? 'APPROVE' : 'REJECT'}", textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5))),
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

  void _showZoomedImage(String imgPath) {
    showGeneralDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.95),
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, _, __) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              Center(
                child: InteractiveViewer(
                  panEnabled: true, minScale: 0.5, maxScale: 4,
                  child: Image.network(AppConfig.getAbsoluteUrl(imgPath), fit: BoxFit.contain),
                ).animate().scale(),
              ),
              Positioned(
                top: 50, right: 20,
                child: GestureDetector(
                  onTap: () => Navigator.pop(ctx),
                  child: Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle), child: const Icon(Icons.close, color: Colors.white)),
                ),
              ),
              Positioned(
                bottom: 40, left: 0, right: 0,
                child: const Text("NEURAL VIEW PROTOCOL ACTIVE", textAlign: TextAlign.center, style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 3, fontStyle: FontStyle.italic)).animate().fadeIn(),
              )
            ],
          ),
        );
      }
    );
  }

  // 🔥 UPDATED SIGNAL MODAL WITH CURRENT STATUS AND CONFIRMATION LOGIC 🔥
  void _showSignalModal(Map<String, dynamic> signal) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Signal Modal',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, _, __) {
        final isDark = ref.watch(themeProvider) == ThemeMode.dark;
        final Color modalBg = isDark ? const Color(0xFF1E293B) : Colors.white;
        final Color cardBorder = isDark ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
        
        String currentStatus = signal['status']?.toString().toUpperCase() ?? 'PENDING';
        Color statusColor = currentStatus == 'VERIFIED' ? const Color(0xFF10B981) : (currentStatus == 'REJECTED' ? const Color(0xFFF43F5E) : const Color(0xFFF59E0B));

        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              GestureDetector(onTap: () => Navigator.pop(ctx), child: Container(color: Colors.black.withOpacity(0.7))),
              Center(
                child: Container(
                  width: MediaQuery.of(context).size.width * 0.9,
                  height: MediaQuery.of(context).size.height * 0.85,
                  decoration: BoxDecoration(color: modalBg, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder)),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(40),
                    child: Column(
                      children: [
                        // Image Section
                        Expanded(
                          flex: 5,
                          child: GestureDetector(
                            onTap: () {
                              if (signal['paymentScreenshot'] != null) {
                                _showZoomedImage(signal['paymentScreenshot']);
                              }
                            },
                            child: Container(
                              width: double.infinity,
                              color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                              child: Stack(
                                children: [
                                  Center(
                                    child: signal['paymentScreenshot'] != null 
                                      ? Image.network(AppConfig.getAbsoluteUrl(signal['paymentScreenshot']), fit: BoxFit.contain)
                                      : const Icon(Icons.image_not_supported, size: 50, color: Colors.grey),
                                  ),
                                  Positioned(
                                    top: 16, right: 16,
                                    child: GestureDetector(onTap: () => Navigator.pop(ctx), child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.red.shade50, shape: BoxShape.circle), child: const Icon(Icons.close, color: Colors.red, size: 18))),
                                  ),
                                  Positioned(
                                    bottom: 16, right: 16,
                                    child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.black.withOpacity(0.5), shape: BoxShape.circle), child: const Icon(Icons.zoom_in, color: Colors.white, size: 18)),
                                  )
                                ],
                              ),
                            ),
                          ),
                        ),
                        // Details Section
                        Expanded(
                          flex: 6,
                          child: Container(
                            padding: const EdgeInsets.all(24),
                            child: SingleChildScrollView(
                              physics: const BouncingScrollPhysics(),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text("PAYMENT VERIFICATION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: statusColor.withOpacity(0.3))),
                                        child: Text(currentStatus, style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: statusColor, letterSpacing: 1)),
                                      )
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  
                                  // Student Details
                                  Container(
                                    width: double.infinity, padding: const EdgeInsets.all(20), margin: const EdgeInsets.only(bottom: 12),
                                    decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text("STUDENT IDENTITY", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                        const SizedBox(height: 8),
                                        Text(signal['student']?['name']?.toString().toUpperCase() ?? 'UNKNOWN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87)),
                                        const SizedBox(height: 4),
                                        Text("${signal['student']?['grade'] ?? 'N/A'} • ${signal['student']?['enrollmentNo'] ?? 'N/A'}", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isDark ? Colors.white54 : Colors.black54, letterSpacing: 1.5)),
                                      ],
                                    ),
                                  ),

                                  // Parent Details
                                  Container(
                                    width: double.infinity, padding: const EdgeInsets.all(20), margin: const EdgeInsets.only(bottom: 12),
                                    decoration: BoxDecoration(color: isDark ? const Color(0xFF1E3A8A).withOpacity(0.2) : Colors.blue.shade50.withOpacity(0.5), borderRadius: BorderRadius.circular(25), border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : Colors.blue.shade100)),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text("PARENT DETAILS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            const Icon(Icons.person, size: 14, color: Color(0xFF42A5F5)),
                                            const SizedBox(width: 6),
                                            Text(signal['student']?['fatherName']?.toString().toUpperCase() ?? 'NOT FOUND', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87)),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            const Icon(Icons.phone, size: 14, color: Color(0xFF42A5F5)),
                                            const SizedBox(width: 6),
                                            Text(signal['student']?['phone']?.toString() ?? 'NO SIGNAL', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87, letterSpacing: 1.5)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Amount
                                  Container(
                                    width: double.infinity, padding: const EdgeInsets.all(20), margin: const EdgeInsets.only(bottom: 24),
                                    decoration: BoxDecoration(color: isDark ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(25), border: Border.all(color: isDark ? const Color(0xFF064E3B) : const Color(0xFFD1FAE5))),
                                    child: Column(
                                      children: [
                                        const Text("PAID AMOUNT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF10B981), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                        const SizedBox(height: 4),
                                        Text("₹${NumberFormat('#,##,###').format(signal['amountPaid'] ?? 0)}", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                      ],
                                    ),
                                  ),

                                  // 🔥 Action Buttons with Confirmation Interception 🔥
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.pop(ctx);
                                      _showConfirmActionModal(signal['_id'], 'verify', signal['student']?['name'] ?? 'Unknown');
                                    },
                                    child: Container(width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 18), decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(25), boxShadow: [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 4))]), child: const Text("APPROVE PAYMENT", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5))),
                                  ),
                                  const SizedBox(height: 12),
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.pop(ctx);
                                      _showConfirmActionModal(signal['_id'], 'reject', signal['student']?['name'] ?? 'Unknown');
                                    },
                                    child: Container(width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 18), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : Colors.white, borderRadius: BorderRadius.circular(25), border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.3))), child: const Text("REJECT PAYMENT", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFFF43F5E), letterSpacing: 1.5))),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ).animate().scale(curve: Curves.easeOutBack),
              ),
            ],
          ),
        );
      }
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
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

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
          // 🔥 EXACT REFRESH INDICATOR & SCROLL VIEW STRUCTURE 🔥
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
                      // --- EXACT PREMIUM HEADER ---
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
                                const Text("Gateway Hub",
                                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                Text("FINANCE TERMINAL",
                                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white.withOpacity(0.3)),
                              ),
                              child: const Icon(Icons.security, color: Colors.white, size: 24),
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      // --- BODY CONTENT OVERLAPPING THE HEADER ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              
                              // 1. PROTOCOL STATUS STRIP
                              Center(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                  decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50, borderRadius: BorderRadius.circular(20), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100)),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.wifi, size: 14, color: Color(0xFF42A5F5)),
                                      SizedBox(width: 8),
                                      Text("PROTOCOL 130 SECURE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2, fontStyle: FontStyle.italic)),
                                    ],
                                  ),
                                ),
                              ).animate().fadeIn(),
                              const SizedBox(height: 24),

                              // 2. CREDENTIALS HUB (UPI SETTINGS)
                              Container(
                                width: double.infinity, padding: const EdgeInsets.all(32),
                                decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            Container(width: 10, height: 10, decoration: BoxDecoration(color: settings['upiId'].toString().isNotEmpty ? const Color(0xFF10B981) : const Color(0xFF42A5F5), shape: BoxShape.circle)).animate(onPlay: (c) => c.repeat(reverse: true)).fade(begin: 1, end: 0.5),
                                            const SizedBox(width: 12),
                                            Text(settings['upiId'].toString().isNotEmpty ? "ACTIVE UPI DETAILS" : "CONFIGURE UPI", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                          ],
                                        ),
                                        if (settings['upiId'].toString().isNotEmpty && !isEditing)
                                          Row(
                                            children: [
                                              GestureDetector(onTap: _showDeleteConfirmModal, child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.2))), child: const Icon(Icons.delete, size: 16, color: Color(0xFFF43F5E)))),
                                              const SizedBox(width: 8),
                                              GestureDetector(onTap: () => setState(() => isEditing = true), child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: const Color(0xFF42A5F5).withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF42A5F5).withOpacity(0.2))), child: const Icon(Icons.edit, size: 16, color: Color(0xFF42A5F5)))),
                                            ],
                                          )
                                        else if (isEditing)
                                          GestureDetector(onTap: () => setState(() => isEditing = false), child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: cardBorder)), child: Icon(Icons.close, size: 16, color: textColorSecondary)))
                                      ],
                                    ),
                                    const SizedBox(height: 24),

                                    if (settings['upiId'].toString().isEmpty && !isEditing)
                                      GestureDetector(
                                        onTap: () => setState(() => isEditing = true),
                                        child: Container(
                                          width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 30),
                                          decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.1) : Colors.blue.shade50.withOpacity(0.5), borderRadius: BorderRadius.circular(30), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : const Color(0xFF42A5F5).withOpacity(0.3), style: BorderStyle.solid, width: 2)),
                                          child: Column(
                                            children: [
                                              const Icon(Icons.qr_code_scanner, size: 36, color: Color(0xFF42A5F5)),
                                              const SizedBox(height: 12),
                                              const Text("ADD UPI DETAILS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                            ],
                                          ),
                                        ),
                                      )
                                    else if (!isEditing)
                                      Column(
                                        children: [
                                          Container(
                                            width: double.infinity, padding: const EdgeInsets.all(20), margin: const EdgeInsets.only(bottom: 12),
                                            decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const Text("UPI ID", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                                const SizedBox(height: 6),
                                                Text(settings['upiId'], style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                              ],
                                            ),
                                          ),
                                          Container(
                                            width: double.infinity, padding: const EdgeInsets.all(20),
                                            decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const Text("RECEIVER NAME", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                                const SizedBox(height: 6),
                                                Text(settings['merchantName']?.toString().toUpperCase() ?? '', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                              ],
                                            ),
                                          ),
                                        ],
                                      )
                                    else
                                      // EDIT FORM
                                      Column(
                                        children: [
                                          Container(
                                            decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                            child: TextField(
                                              controller: _upiController,
                                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
                                              decoration: InputDecoration(hintText: "school@upi", hintStyle: TextStyle(color: textColorSecondary.withOpacity(0.5)), border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16)),
                                            ),
                                          ),
                                          const SizedBox(height: 12),
                                          Container(
                                            decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                            child: TextField(
                                              controller: _merchantController,
                                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
                                              decoration: InputDecoration(hintText: "Institution Name", hintStyle: TextStyle(color: textColorSecondary.withOpacity(0.5)), border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16)),
                                            ),
                                          ),
                                          const SizedBox(height: 20),
                                          GestureDetector(
                                            onTap: isUpdating ? null : _handleUpdateSettings,
                                            child: Container(
                                              width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 18),
                                              decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(25), boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 4))]),
                                              child: isUpdating 
                                                ? const Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)))
                                                : const Text("SAVE CHANGES", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                            ),
                                          )
                                        ],
                                      )
                                  ],
                                ),
                              ).animate().fadeIn().slideY(begin: 0.1),

                              const SizedBox(height: 32),

                              // 3. AUDIT FEED (PENDING VERIFICATIONS)
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text("PENDING SCREENSHOTS", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFFF43F5E), letterSpacing: 2, fontStyle: FontStyle.italic)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.2))),
                                    child: Row(
                                      children: [
                                        Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFFF43F5E), shape: BoxShape.circle)).animate(onPlay: (c) => c.repeat(reverse: true)).fade(begin: 1, end: 0.3),
                                        const SizedBox(width: 6),
                                        Text("${pendingVerifications.length} QUEUED", style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFFF43F5E), letterSpacing: 1)),
                                      ],
                                    ),
                                  )
                                ],
                              ),
                              const SizedBox(height: 16),

                              if (pendingVerifications.isEmpty)
                                Container(
                                  width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 40),
                                  decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(35), border: Border.all(color: cardBorder, style: BorderStyle.solid)),
                                  child: Column(
                                    children: [
                                      Icon(Icons.check_circle_outline, size: 40, color: textColorSecondary.withOpacity(0.3)),
                                      const SizedBox(height: 12),
                                      Text("ALL CLEAR", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 3)),
                                    ],
                                  ),
                                )
                              else
                                ...pendingVerifications.map((item) {
                                  return GestureDetector(
                                    onTap: () => _showSignalModal(item),
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 16),
                                      padding: const EdgeInsets.all(20),
                                      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(30), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.all(12),
                                                  decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
                                                  child: Icon(Icons.person, size: 20, color: textColorSecondary),
                                                ),
                                                const SizedBox(width: 16),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(item['student']?['name']?.toString().toUpperCase() ?? 'UNKNOWN', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                                      const SizedBox(height: 4),
                                                      Row(
                                                        children: [
                                                          Text("${item['student']?['grade'] ?? 'N/A'}", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1.5)),
                                                          Container(margin: const EdgeInsets.symmetric(horizontal: 6), width: 3, height: 3, decoration: BoxDecoration(color: textColorSecondary, shape: BoxShape.circle)),
                                                          Expanded(child: Text("${item['student']?['fatherName'] ?? 'No Signal'}", maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5))),
                                                        ],
                                                      )
                                                    ],
                                                  ),
                                                )
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Text("₹${NumberFormat('#,##,###').format(item['amountPaid'] ?? 0)}", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                              const SizedBox(height: 4),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.2))),
                                                child: const Text("PENDING", style: TextStyle(fontSize: 7, fontWeight: FontWeight.w900, color: Color(0xFFF59E0B), letterSpacing: 1)),
                                              )
                                            ],
                                          )
                                        ],
                                      ),
                                    ).animate().fadeIn().slideX(begin: 0.1),
                                  );
                                }),

                              const SizedBox(height: 32),

                              // 4. ONLINE PAYMENT HISTORY
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text("PAYMENT HISTORY", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                  
                                  // 🔥 SESSION GLASS DROPDOWN 🔥
                                  PopupMenuButton<String>(
                                    initialValue: activeSession,
                                    position: PopupMenuPosition.under,
                                    color: cardColor,
                                    elevation: 8,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    onSelected: (String newValue) {
                                      setState(() { activeSession = newValue; });
                                      _loadTerminal(sessionParam: newValue);
                                    },
                                    itemBuilder: (BuildContext context) {
                                      return availableSessions.map((String session) {
                                        return PopupMenuItem<String>(
                                          value: session,
                                          child: Text(session, style: TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: activeSession == session ? const Color(0xFF42A5F5) : textColorPrimary)),
                                        );
                                      }).toList();
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(color: const Color(0xFF42A5F5).withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF42A5F5).withOpacity(0.3))),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.history, color: Color(0xFF42A5F5), size: 12),
                                          const SizedBox(width: 4),
                                          Text(activeSession ?? '...', style: const TextStyle(color: Color(0xFF42A5F5), fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
                                          const Icon(Icons.arrow_drop_down, color: Color(0xFF42A5F5), size: 16),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              
                              if (resolvedSignals.isEmpty)
                                Container(
                                  width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 40),
                                  decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(35), border: Border.all(color: cardBorder, style: BorderStyle.solid)),
                                  child: Column(
                                    children: [
                                      Icon(Icons.history, size: 40, color: textColorSecondary.withOpacity(0.3)),
                                      const SizedBox(height: 12),
                                      Text("DATABASE EMPTY", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 3)),
                                    ],
                                  ),
                                )
                              else
                                ...resolvedSignals.map((item) {
                                  bool isVerified = item['status'] == 'Verified';
                                  
                                  // 🔥 Wrap kiya GestureDetector ke saath History Items ko 🔥
                                  return GestureDetector(
                                    onTap: () => _showSignalModal(item),
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 16),
                                      padding: const EdgeInsets.all(20),
                                      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(30), border: Border.all(color: cardBorder)),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.all(12),
                                                  decoration: BoxDecoration(color: isVerified ? const Color(0xFF10B981).withOpacity(0.1) : const Color(0xFFF43F5E).withOpacity(0.1), borderRadius: BorderRadius.circular(16), border: Border.all(color: isVerified ? const Color(0xFF10B981).withOpacity(0.2) : const Color(0xFFF43F5E).withOpacity(0.2))),
                                                  child: Icon(isVerified ? Icons.check_circle : Icons.close, size: 20, color: isVerified ? const Color(0xFF10B981) : const Color(0xFFF43F5E)),
                                                ),
                                                const SizedBox(width: 16),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(item['student']?['name']?.toString().toUpperCase() ?? 'UNKNOWN', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                                      const SizedBox(height: 4),
                                                      Row(
                                                        children: [
                                                          Text("REF: ${item['_id']?.toString().substring(item['_id'].length - 8).toUpperCase() ?? ''}", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                                          Container(margin: const EdgeInsets.symmetric(horizontal: 6), width: 3, height: 3, decoration: BoxDecoration(color: textColorSecondary, shape: BoxShape.circle)),
                                                          Text("${item['student']?['grade'] ?? ''}", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                                        ],
                                                      )
                                                    ],
                                                  ),
                                                )
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Text("₹${NumberFormat('#,##,###').format(item['amountPaid'] ?? 0)}", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                              const SizedBox(height: 4),
                                              Text(isVerified ? "CONFIRMED" : "REJECTED", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: isVerified ? const Color(0xFF10B981) : const Color(0xFFF43F5E), letterSpacing: 1)),
                                            ],
                                          )
                                        ],
                                      ),
                                    ).animate().fadeIn().slideX(begin: 0.1),
                                  );
                                }),

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
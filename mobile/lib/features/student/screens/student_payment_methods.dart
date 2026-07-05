import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

// 🔥 ConsumerStatefulWidget for theme listening
class StudentPaymentMethods extends ConsumerStatefulWidget {
  const StudentPaymentMethods({super.key});

  @override
  ConsumerState<StudentPaymentMethods> createState() => _StudentPaymentMethodsState();
}

class _StudentPaymentMethodsState extends ConsumerState<StudentPaymentMethods> {
  Map<String, dynamic>? summary;
  bool loading = true;
  bool isProcessing = false;

  String? paymentMode; // 'upi' or 'netbanking'
  String? selectedApp; // specific upi app

  File? screenshot;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final response = await ApiClient.dio.get('/fees/student-summary');
      setState(() {
        summary = response.data;
        loading = false;
      });
    } catch (e) {
      print("Payment Data Load Error: $e");
      setState(() => loading = false);
    }
  }

  Future<void> _pickImage() async {
    final pickedFile = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        screenshot = File(pickedFile.path);
      });
    }
  }

  void _showToast(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isError ? Icons.warning_amber_rounded : Icons.check_circle_outline, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 13))),
          ],
        ),
        backgroundColor: isError ? Colors.redAccent : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.only(bottom: 20, left: 20, right: 20),
      ),
    );
  }

  Future<void> _handleFinalSubmit() async {
    if (screenshot == null) {
      _showToast("Upload payment screenshot! 🛡️", isError: true);
      return;
    }

    setState(() => isProcessing = true);

    try {
      FormData formData = FormData.fromMap({
        'screenshot': await MultipartFile.fromFile(screenshot!.path),
        'amount': summary!['grandTotal'],
        'method': selectedApp,
      });

      await ApiClient.dio.post('/fees/capture-with-screenshot', data: formData);
      
      _showToast("Payment Submitted Successfully! 📡");
      
      // Delay and navigate back to fees
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) context.go('/student/fees'); // Replace state to fees
      });
    } catch (e) {
      _showToast("Upload Failed. Check network.", isError: true);
      setState(() => isProcessing = false);
    }
  }

  // --- SMART BACK NAVIGATION LOGIC ---
  void _handleBack() {
    if (selectedApp != null) {
      setState(() => selectedApp = null);
    } else if (paymentMode != null) {
      setState(() => paymentMode = null);
    } else {
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/student/checkout');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();
    if (summary == null) return const Scaffold(body: Center(child: Text("Error loading details.")));

    // Generate UPI Link
    final grandTotal = summary!['grandTotal'] ?? 0;
    final schoolPhone = summary!['schoolPhone'] ?? '';
    final schoolName = summary!['schoolName'] ?? 'EduFlowAI';
    final String upiLink = "upi://pay?pa=$schoolPhone&pn=$schoolName&am=$grandTotal&cu=INR";

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color scaffoldBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack(); // Hardware back button bhi UI layout ke hisaab se peeche jayega
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: scaffoldBg,
        child: Scaffold(
          backgroundColor: Colors.transparent, // Background se color lenge
          body: SafeArea(
            child: Stack(
              children: [
                SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  padding: const EdgeInsets.only(top: 40, bottom: 120, left: 24, right: 24),
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 400),
                    switchInCurve: Curves.easeOutBack,
                    switchOutCurve: Curves.easeIn,
                    transitionBuilder: (child, animation) {
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(
                          position: Tween<Offset>(begin: const Offset(0, 0.05), end: Offset.zero).animate(animation),
                          child: child,
                        ),
                      );
                    },
                    child: _buildCurrentState(upiLink, isDarkMode), // 🔥 isDarkMode pass kar diya
                  ),
                ),

                // --- FOOTER MESH ---
                Positioned(
                  bottom: 30,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.security, size: 14, color: isDarkMode ? Colors.white38 : Colors.black38),
                      const SizedBox(width: 8),
                      Text(
                        "NEURAL ENCRYPTED GATEWAY",
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isDarkMode ? Colors.white38 : Colors.black38, letterSpacing: 3),
                      ),
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

  // --- STATE MACHINE UI RENDERER ---
  Widget _buildCurrentState(String upiLink, bool isDarkMode) {
    // 🔥 DYNAMIC COLORS
    final Color cardBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color iconBgLight = isDarkMode ? const Color(0xFF0F172A) : Colors.blue.shade50;
    final Color subtleBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    // STEP 1: SELECT MODE
    if (paymentMode == null) {
      return Column(
        key: const ValueKey('step1_mode'),
        children: [
          // Header
          Row(
            children: [
              GestureDetector(
                onTap: _handleBack,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5, offset: Offset(0, 2))]),
                  child: const Icon(Icons.arrow_back, color: Color(0xFF42A5F5), size: 20),
                ),
              ),
              const SizedBox(width: 16),
              Text("Select gateway", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: textColorPrimary, letterSpacing: -0.5)),
            ],
          ),
          const SizedBox(height: 30),

          // UPI Button
          GestureDetector(
            onTap: () => setState(() => paymentMode = 'upi'),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(40), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
              child: Row(
                children: [
                  Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: iconBgLight, borderRadius: BorderRadius.circular(20)), child: const Icon(Icons.bolt, color: Color(0xFF42A5F5), size: 28)),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("UPI portal", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorPrimary)),
                        const SizedBox(height: 4),
                        Text("GPay, PhonePe, Paytm QR", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColorSecondary)),
                      ],
                    ),
                  ),
                  Icon(Icons.arrow_forward_ios, color: textColorSecondary, size: 18),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Net Banking Button (Disabled)
          GestureDetector(
            onTap: () => setState(() => paymentMode = 'netbanking'),
            child: Opacity(
              opacity: 0.6,
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(40), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
                child: Row(
                  children: [
                    Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(20)), child: Icon(Icons.account_balance, color: isDarkMode ? Colors.white38 : const Color(0xFFCBD5E1), size: 28)),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Net banking", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColorSecondary)),
                          const SizedBox(height: 4),
                          Text("Coming soon", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isDarkMode ? Colors.white24 : const Color(0xFFCBD5E1))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      );
    }

    // STEP 2: NETBANKING CONSTRUCTION
    if (paymentMode == 'netbanking') {
      return Column(
        key: const ValueKey('step2_netbank'),
        children: [
          GestureDetector(
            onTap: _handleBack,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.arrow_back, color: Color(0xFF42A5F5), size: 18),
                  SizedBox(width: 8),
                  Text("RETURN TO MODES", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5))),
                ],
              ),
            ),
          ),
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(55), border: Border.all(color: borderColor, width: 2, style: BorderStyle.solid)),
            child: const Icon(Icons.engineering, color: Color(0xFF42A5F5), size: 80).animate(onPlay: (c) => c.repeat(reverse: true)).slideY(begin: -0.1, end: 0.1, duration: 1.seconds),
          ),
          const SizedBox(height: 30),
          Text("Module under construction", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: textColorPrimary), textAlign: TextAlign.center),
          const SizedBox(height: 10),
          Text("Secure system protocol 130 is active", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColorSecondary)),
        ],
      );
    }

    // STEP 2: UPI APP SELECTION
    if (paymentMode == 'upi' && selectedApp == null) {
      return Column(
        key: const ValueKey('step2_upiapps'),
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: _handleBack,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5, offset: Offset(0, 2))]),
                  child: const Icon(Icons.arrow_back, color: Color(0xFF42A5F5), size: 20),
                ),
              ),
              const SizedBox(width: 16),
              Text("Select method", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: textColorPrimary, letterSpacing: -0.5)),
            ],
          ),
          const SizedBox(height: 30),
          
          ...['PhonePe', 'Google Pay', 'Paytm', 'Manual QR'].map((app) => GestureDetector(
            onTap: () => setState(() => selectedApp = app),
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(35), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(app, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: textColorPrimary)),
                  Container(
                    width: 12, height: 12, 
                    decoration: BoxDecoration(color: const Color(0xFF42A5F5), shape: BoxShape.circle, boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withValues(alpha: 0.4), blurRadius: 10, spreadRadius: 2)]),
                  ).animate(onPlay: (c) => c.repeat(reverse: true)).fade(begin: 0.5, end: 1),
                ],
              ),
            ),
          )),
        ],
      );
    }

    // STEP 3: QR & SCREENSHOT UPLOAD PANEL
    return Container(
      key: const ValueKey('step3_qr'),
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(55), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, 10))]),
      child: isProcessing 
        ? Column(
            children: [
              const SizedBox(height: 40),
              const SizedBox(width: 60, height: 60, child: CircularProgressIndicator(color: Color(0xFF42A5F5), strokeWidth: 5)),
              const SizedBox(height: 30),
              Text("Finalizing uplink", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: textColorPrimary)),
              const SizedBox(height: 10),
              Text("Uploading evidence to secure node...", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColorSecondary)),
              const SizedBox(height: 40),
            ],
          )
        : Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: _handleBack,
                    child: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderColor)), child: Icon(Icons.arrow_back, size: 18, color: textColorSecondary)),
                  ),
                  const Row(
                    children: [
                      Icon(Icons.verified_user, size: 16, color: Color(0xFF42A5F5)),
                      SizedBox(width: 6),
                      Text("SECURE CHECKOUT", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2)),
                    ],
                  ),
                  const SizedBox(width: 32), // Placeholder to balance row
                ],
              ),
              const SizedBox(height: 30),

             // QR Code Render (Force light background for better scanability)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white, // 🔥 QR hamesha white background pe rehna chahiye warna scan nahi hoga
                  borderRadius: BorderRadius.circular(40),
                  border: Border.all(color: isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA), width: 2),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFFE2E8F0), 
                      Colors.white, 
                    ],
                  ),
                ),
                child: summary!['schoolPhone'] != null
                    ? QrImageView(data: upiLink, version: QrVersions.auto, size: 180, foregroundColor: const Color(0xFF1E293B))
                    : Column(
                        children: [
                          const Icon(Icons.qr_code_scanner, size: 50, color: Color(0xFFCBD5E1)),
                          const SizedBox(height: 10),
                          Text("No QR available right now\nYou can try again later", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: isDarkMode ? Colors.black54 : const Color(0xFF94A3B8), letterSpacing: 1), textAlign: TextAlign.center),
                        ],
                      ),
              ),
              const SizedBox(height: 24),

              Text("₹${NumberFormat('#,##0').format(summary!['grandTotal'] ?? 0)}", style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: Color(0xFF42A5F5), letterSpacing: -1)),
              if (summary!['schoolPhone'] != null)
                Text("UPI ID: ${summary!['schoolPhone']}", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColorSecondary, letterSpacing: 2))
              else
                const Text("GATEWAY NOT CONFIGURED", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, color: Colors.redAccent, letterSpacing: 2)),
              
              const SizedBox(height: 30),

              // Upload Section
              if (summary!['schoolPhone'] != null) ...[
                if (screenshot == null)
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(30),
                      decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(35), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100, width: 2)),
                      child: Column(
                        children: [
                          const Icon(Icons.cloud_upload, color: Color(0xFF42A5F5), size: 36).animate(onPlay: (c) => c.repeat(reverse: true)).slideY(begin: -0.1, end: 0.1),
                          const SizedBox(height: 12),
                          const Text("Upload payment screenshot", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: Color(0xFF42A5F5))),
                        ],
                      ),
                    ),
                  )
                else
                  Column(
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Container(
                            width: double.infinity,
                            height: 180,
                            decoration: BoxDecoration(color: subtleBg, borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0xFF42A5F5).withValues(alpha: 0.3), width: 2)),
                            child: ClipRRect(borderRadius: BorderRadius.circular(22), child: Image.file(screenshot!, fit: BoxFit.contain)),
                          ),
                          Positioned(
                            top: -10, right: -10,
                            child: GestureDetector(
                              onTap: () => setState(() => screenshot = null),
                              child: Container(padding: const EdgeInsets.all(8), decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 5)]), child: const Icon(Icons.close, size: 16, color: Colors.white)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle, size: 18, color: Color(0xFF10B981)),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              "Screenshot captured successfully", 
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: Color(0xFF10B981)),
                              maxLines: 2,
                              overflow: TextOverflow.visible,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                
                // Final Submit Button
                if (screenshot != null)
                  GestureDetector(
                    onTap: _handleFinalSubmit,
                    child: Container(
                      margin: const EdgeInsets.only(top: 24),
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(35), boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 5))]),
                      child: const Text("PAYMENT COMPLETED", textAlign: TextAlign.center, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
                    ),
                  ).animate().fadeIn().slideY(begin: 0.2),
              ]
            ],
          ),
    );
  }
}
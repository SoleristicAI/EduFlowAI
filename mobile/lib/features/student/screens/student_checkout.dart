import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

class StudentCheckout extends ConsumerStatefulWidget {
  const StudentCheckout({super.key});

  @override
  ConsumerState<StudentCheckout> createState() => _StudentCheckoutState();
}

class _StudentCheckoutState extends ConsumerState<StudentCheckout> {
  Map<String, dynamic>? summary;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _fetchSummary();
  }

  Future<void> _fetchSummary() async {
    try {
      final response = await ApiClient.dio.get('/fees/student-summary');
      setState(() {
        summary = response.data;
        loading = false;
      });
    } catch (e) {
      print("Checkout Load Error: $e");
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();
    
    if (summary == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Checkout Error")),
        body: const Center(child: Text("Could not load checkout details.")),
      );
    }

    final double grandTotal = (summary?['grandTotal'] ?? 0).toDouble();

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS FOR DARK/LIGHT MODE 🔥
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    // final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color bgIconColor = isDarkMode ? Colors.white.withValues(alpha: 0.02) : Colors.black.withValues(alpha: 0.04);
    
    // Billing card ko dark mode mein thoda alag shade dene ke liye
    final Color billingCardColor = isDarkMode ? const Color(0xFF020617) : const Color(0xFF1E293B);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/');
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: bgColor,
        child: Scaffold(
          backgroundColor: Colors.transparent, // Transparent so AnimatedContainer shows through
          body: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 50),
            child: Column(
              children: [
                // ==========================================================
                // HEADER SECTION (Blue Gradient)
                // ==========================================================
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.only(top: 60, bottom: 80),
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
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Back Button
                        GestureDetector(
                          onTap: () {
                            if (context.canPop()) {
                              context.pop();
                            } else {
                              context.go('/');
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                          ),
                        ),
                        
                        // Center Title
                        Column(
                          children: [
                            const Text(
                              "Online Payment",
                              style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1),
                            ),
                            Text(
                              "SECURE FEE TRANSACTIONS",
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white.withValues(alpha: 0.8), letterSpacing: 2),
                            ),
                          ],
                        ),
                        
                        // Right Icon
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: const Icon(Icons.credit_card, color: Colors.white, size: 24),
                        ),
                      ],
                    ),
                  ),
                ),

                // ==========================================================
                // BODY CONTENT (Overlapping Header)
                // ==========================================================
                Transform.translate(
                  offset: const Offset(0, -50),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        // --- 1. STUDENT IDENTITY CARD ---
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          width: double.infinity,
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: cardColor,
                            borderRadius: BorderRadius.circular(40),
                            border: Border.all(color: borderColor),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))],
                          ),
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Positioned(
                                top: -10, right: -10,
                                child: Icon(Icons.person, size: 100, color: bgIconColor),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text("STUDENT IDENTIFICATION", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: 2)),
                                  const SizedBox(height: 24),
                                  
                                  // Grid of Details
                                  Column(
                                    children: [
                                      _buildDetailRow(Icons.person, "Student Name", summary?['studentName']?.toString().toLowerCase() ?? 'n/a', isDarkMode, isCapitalize: true),
                                      const SizedBox(height: 20),
                                      _buildDetailRow(Icons.tag, "Enrollment", summary?['enrollmentNo'] ?? 'n/a', isDarkMode, isUppercase: true),
                                      const SizedBox(height: 20),
                                      _buildDetailRow(Icons.person, "Father's Name", summary?['fatherName']?.toString().toLowerCase() ?? 'not assigned', isDarkMode, isCapitalize: true),
                                      const SizedBox(height: 20),
                                      _buildDetailRow(Icons.phone, "Mobile Number", summary?['mobile'] ?? 'N/A', isDarkMode),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),

                        const SizedBox(height: 24),

                        // --- 2. SCHOOL IDENTIFICATION CARD ---
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          width: double.infinity,
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: cardColor,
                            borderRadius: BorderRadius.circular(40),
                            border: Border.all(color: borderColor),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))],
                          ),
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Positioned(
                                top: -10, right: -10,
                                child: Icon(Icons.school, size: 100, color: const Color(0xFF42A5F5).withValues(alpha: 0.09)),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.school, size: 18, color: Color(0xFF94A3B8)),
                                      SizedBox(width: 8),
                                      Text("SCHOOL IDENTIFICATION", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: 2)),
                                    ],
                                  ),
                                  const SizedBox(height: 24),
                                  
                                  Column(
                                    children: [
                                      _buildDetailRow(Icons.school, "School Name", summary?['schoolName']?.toString().toLowerCase() ?? 'n/a', isDarkMode, isCapitalize: true, isGreyStyle: true),
                                      const SizedBox(height: 20),
                                      _buildDetailRow(Icons.tag, "Online Payment Number", summary?['schoolPhone'] ?? 'n/a', isDarkMode, isBlueHighlight: true, isGreyStyle: true),
                                      const SizedBox(height: 20),
                                      _buildDetailRow(Icons.person, "Admin Personnel", summary?['adminName']?.toString().toLowerCase() ?? 'n/a', isDarkMode, isCapitalize: true, isGreyStyle: true),
                                      const SizedBox(height: 20),
                                      _buildDetailRow(Icons.email, "Admin Email", summary?['adminEmail'] ?? 'n/a', isDarkMode, isLowercase: true, isGreyStyle: true),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 100.ms, duration: 400.ms).slideY(begin: 0.2),

                        const SizedBox(height: 24),

                        // --- 3. BILLING SUMMARY (Dark Theme Adapted) ---
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          width: double.infinity,
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: billingCardColor, 
                            borderRadius: BorderRadius.circular(45), 
                            border: Border.all(color: isDarkMode ? const Color(0xFF1E293B) : const Color(0xFF334155)), 
                            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, 10))],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("SETTLEMENT SUMMARY", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF42A5F5), letterSpacing: 2)),
                              const SizedBox(height: 24),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text("Net payable amount", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic)),
                                  Text(
                                    "₹${NumberFormat('#,##0').format(grandTotal)}",
                                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: -1),
                                  ).animate(onPlay: (c) => c.repeat(reverse: true)).fade(begin: 0.5, end: 1.0, duration: 1000.ms),
                                ],
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: 0.2),

                        const SizedBox(height: 32),

                        // --- 4. PAY NOW ACTION BUTTON ---
                        GestureDetector(
                          onTap: () => context.push('/student/payment-methods'), // Push to exact route
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            decoration: BoxDecoration(
                              color: const Color(0xFF42A5F5),
                              borderRadius: BorderRadius.circular(40),
                              boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 10))],
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.credit_card, color: Colors.white, size: 22),
                                SizedBox(width: 12),
                                Text("PROCEED TO PAY", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2)),
                                SizedBox(width: 12),
                                Icon(Icons.chevron_right, color: Colors.white, size: 22),
                              ],
                            ),
                          ),
                        ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),

                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- HELPER COMPONENT FOR ROWS ---
  Widget _buildDetailRow(IconData icon, String label, String value, bool isDarkMode, {
    bool isCapitalize = false, 
    bool isUppercase = false, 
    bool isLowercase = false, 
    bool isGreyStyle = false,
    bool isBlueHighlight = false
  }) {
    
    // Text Formatting logic
    String formattedValue = value;
    if (isCapitalize) {
      formattedValue = value.split(' ').map((str) => str.isNotEmpty ? str[0].toUpperCase() + str.substring(1) : '').join(' ');
    } else if (isUppercase) {
      formattedValue = value.toUpperCase();
    } else if (isLowercase) {
      formattedValue = value.toLowerCase();
    }

    // Dynamic color assignments
    final Color rowBgColor = isGreyStyle 
        ? (isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC)) 
        : (isDarkMode ? const Color(0xFF1E3A8A).withValues(alpha: 0.3) : const Color(0xFFEFF6FF));
    
    final Color rowBorderColor = isGreyStyle 
        ? (isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)) 
        : (isBlueHighlight ? (isDarkMode ? const Color(0xFF1E3A8A) : const Color(0xFFDBEAFE)) : Colors.transparent);
        
    final Color rowTextColor = isBlueHighlight 
        ? const Color(0xFF42A5F5) 
        : (isLowercase 
            ? (isDarkMode ? const Color(0xFFCBD5E1) : const Color(0xFF64748B)) 
            : (isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B)));

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: rowBgColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: rowBorderColor),
          ),
          child: Icon(icon, size: 20, color: isGreyStyle ? const Color(0xFF94A3B8) : const Color(0xFF42A5F5))
            // Pulse animation for the highlighted online payment number icon
            .animate(target: isBlueHighlight ? 1 : 0, onPlay: (c) => c.repeat(reverse: true)).fade(begin: 0.4, end: 1.0, duration: 800.ms), 
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label.toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: -0.5, height: 1)),
              const SizedBox(height: 4),
              Text(
                formattedValue, 
                style: TextStyle(
                  fontSize: 15, 
                  fontWeight: FontWeight.w900, 
                  color: rowTextColor,
                  letterSpacing: isBlueHighlight ? 2 : 0,
                )
              ),
            ],
          ),
        ),
      ],
    );
  }
}
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart';

class LibrarianSettings extends ConsumerStatefulWidget {
  const LibrarianSettings({super.key});

  @override
  ConsumerState<LibrarianSettings> createState() => _LibrarianSettingsState();
}

class _LibrarianSettingsState extends ConsumerState<LibrarianSettings> {
  bool _loading = true;
  bool _isSubmitting = false;
  
  final TextEditingController _dueDaysCtrl = TextEditingController();
  final TextEditingController _fineCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchSettings();
  }

  @override
  void dispose() {
    _dueDaysCtrl.dispose();
    _fineCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchSettings() async {
    try {
      final res = await ApiClient.dio.get('/library/settings');
      if (mounted) {
        setState(() {
          _dueDaysCtrl.text = (res.data['defaultDueDays'] ?? 7).toString();
          _fineCtrl.text = (res.data['finePerDay'] ?? 5).toString();
          _loading = false;
        });
      }
    } catch (e) {
      _showToast("Failed to fetch settings.", isError: true);
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleSave() async {
    if (_dueDaysCtrl.text.isEmpty || _fineCtrl.text.isEmpty) {
      _showToast("Fields cannot be empty!", isError: true);
      return;
    }

    setState(() => _isSubmitting = true);
    FocusScope.of(context).unfocus(); // Close keyboard

    try {
      await ApiClient.dio.put('/library/settings', data: {
        'defaultDueDays': int.parse(_dueDaysCtrl.text),
        'finePerDay': int.parse(_fineCtrl.text),
      });
      _showToast("Library rules updated successfully! ⚙️");
    } catch (e) {
      _showToast("Failed to save settings.", isError: true);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
      backgroundColor: isError ? Colors.redAccent : const Color(0xFF10B981),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const CustomLoader();

    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);
    final inputBg = isDarkMode ? const Color(0xFF0F172A) : Colors.blueGrey.shade50;

    return Scaffold(
      backgroundColor: bgColor,
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          children: [
            // 🔥 PREMIUM GRADIENT HEADER 🔥
            Container(
              width: double.infinity,
              padding: const EdgeInsets.only(top: 60, bottom: 40, left: 24, right: 24),
              decoration: BoxDecoration(
                color: const Color(0xFF42A5F5),
                gradient: LinearGradient(
                  colors: isDarkMode 
                      ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                      : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                  begin: Alignment.topCenter, end: Alignment.bottomCenter,
                ),
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned(right: -40, top: -10, child: Icon(Icons.settings_rounded, size: 200, color: Colors.white.withOpacity(0.1))),
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () {
                          if (context.canPop()) context.pop();
                          else context.go('/librarian/dashboard');
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                          child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("Rules", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                            Text("CONFIGURATION PANEL", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // --- FORM AREA ---
            Transform.translate(
              offset: const Offset(0, -25),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 20),
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(40),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDarkMode ? 0.2 : 0.05), blurRadius: 20, offset: const Offset(0, 10))],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF0F172A) : Colors.blueGrey.shade50, shape: BoxShape.circle),
                      child: const Icon(Icons.tune_rounded, size: 40, color: Colors.grey),
                    ).animate(onPlay: (controller) => controller.repeat(reverse: true)).shimmer(duration: 2.seconds),
                    
                    const SizedBox(height: 35),
                    
                    // Default Loan Duration
                    const Align(alignment: Alignment.centerLeft, child: Text("DEFAULT LOAN DURATION (DAYS)", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5))),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _dueDaysCtrl,
                      keyboardType: TextInputType.number,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColor),
                      decoration: InputDecoration(
                        filled: true, fillColor: inputBg,
                        prefixIcon: const Icon(Icons.access_time_filled_rounded, color: Color(0xFF42A5F5)),
                        contentPadding: const EdgeInsets.all(20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: Color(0xFF42A5F5), width: 2)),
                      ),
                    ),

                    const SizedBox(height: 25),

                    // Late Fine Per Day
                    const Align(alignment: Alignment.centerLeft, child: Text("LATE FINE PER DAY (₹)", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5))),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _fineCtrl,
                      keyboardType: TextInputType.number,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColor),
                      decoration: InputDecoration(
                        filled: true, fillColor: inputBg,
                        prefixIcon: const Icon(Icons.currency_rupee_rounded, color: Color(0xFF42A5F5)),
                        contentPadding: const EdgeInsets.all(20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: Color(0xFF42A5F5), width: 2)),
                      ),
                    ),

                    const SizedBox(height: 40),

                    // SAVE BUTTON
                    SizedBox(
                      width: double.infinity,
                      height: 60,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E293B), // Dark premium color
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          elevation: 10,
                          shadowColor: Colors.black26,
                        ),
                        onPressed: _isSubmitting ? null : _handleSave,
                        icon: _isSubmitting ? const SizedBox.shrink() : const Icon(Icons.save_rounded, color: Colors.white),
                        label: _isSubmitting 
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text("SAVE CONFIGURATION", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5)),
                      ),
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
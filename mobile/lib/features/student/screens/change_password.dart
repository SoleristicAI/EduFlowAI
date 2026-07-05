import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

class ChangePassword extends ConsumerStatefulWidget {
  const ChangePassword({super.key});

  @override
  ConsumerState<ChangePassword> createState() => _ChangePasswordState();
}

class _ChangePasswordState extends ConsumerState<ChangePassword> {
  final TextEditingController _oldPassCtrl = TextEditingController();
  final TextEditingController _newPassCtrl = TextEditingController();
  final TextEditingController _confirmPassCtrl = TextEditingController();

  bool showOld = false;
  bool showNew = false;
  bool showConfirm = false;

  bool loading = false; // Initial form state

  Future<void> _handleUpdate() async {
    // Dismiss keyboard
    FocusScope.of(context).unfocus();

    String oldPass = _oldPassCtrl.text;
    String newPass = _newPassCtrl.text;
    String confirmPass = _confirmPassCtrl.text;

    if (oldPass.isEmpty || newPass.isEmpty || confirmPass.isEmpty) {
      _showToast("All fields are required! ⚠️", isError: true);
      return;
    }

    if (newPass != confirmPass) {
      _showToast("Passwords do not match! 🛡️", isError: true);
      return;
    }

    setState(() => loading = true); // Trigger CustomLoader

    try {
      await ApiClient.dio.put('/auth/change-password', data: {
        'oldPassword': oldPass,
        'newPassword': newPass,
      });

      _showToast("Password changed successfully! 🛡️");

      // Wait a moment so user reads the toast, then navigate back
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/settings');
        }
      }
    } catch (err) {
      String errMsg = "Rotation failed";
      if (err is Map && err['response'] != null && err['response']['data'] != null) {
        errMsg = err['response']['data']['message'] ?? errMsg;
      }
      _showToast(errMsg, isError: true);
      if (mounted) setState(() => loading = false);
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isError ? Icons.bolt : Icons.security, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 13))),
          ],
        ),
        backgroundColor: isError ? const Color(0xFFF43F5E) : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.only(bottom: 20, left: 20, right: 20),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  void dispose() {
    _oldPassCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS FOR DARK/LIGHT MODE 🔥
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    // final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF334155);
    final Color labelColor = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final Color inputFieldBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color inputFieldBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final Color inputTextColor = isDarkMode ? const Color(0xFFE2E8F0) : const Color(0xFF334155);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) context.pop();
        else context.go('/settings');
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: bgColor,
        child: Scaffold(
          backgroundColor: Colors.transparent, // Background transparent for AnimatedContainer
          body: RefreshIndicator(
            color: const Color(0xFF42A5F5),
            backgroundColor: cardColor,
            onRefresh: () async {}, // Form page, no fetch refresh needed
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
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Positioned(
                              right: -40,
                              top: -10,
                              child: Icon(Icons.security, size: 200, color: Colors.white.withOpacity(0.1)),
                            ),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    if (context.canPop()) context.pop();
                                    else context.go('/settings');
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: Colors.white.withOpacity(0.3)),
                                    ),
                                    child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text("Security", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                      Text("CHANGE SECURITY PASSWORD", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // --- CONTENT AREA ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: loading
                              ? Container(
                                  height: 350,
                                  alignment: Alignment.center,
                                  child: const CustomLoader(),
                                )
                              : AnimatedContainer(
                                  duration: const Duration(milliseconds: 400),
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(32),
                                  decoration: BoxDecoration(
                                    color: cardColor,
                                    borderRadius: BorderRadius.circular(45),
                                    border: Border.all(color: borderColor),
                                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
                                  ),
                                  child: Column(
                                    children: [
                                      // Current Password
                                      _buildPasswordField(
                                        label: "CURRENT PASSWORD",
                                        icon: Icons.lock_outline,
                                        controller: _oldPassCtrl,
                                        isObscure: !showOld,
                                        onToggle: () => setState(() => showOld = !showOld),
                                        hintText: "Enter current password",
                                        labelColor: labelColor,
                                        inputFieldBg: inputFieldBg,
                                        inputFieldBorder: inputFieldBorder,
                                        inputTextColor: inputTextColor,
                                      ),
                                      const SizedBox(height: 24),

                                      // New Password
                                      _buildPasswordField(
                                        label: "NEW PASSWORD",
                                        icon: Icons.bolt,
                                        controller: _newPassCtrl,
                                        isObscure: !showNew,
                                        onToggle: () => setState(() => showNew = !showNew),
                                        hintText: "Enter new password",
                                        labelColor: labelColor,
                                        inputFieldBg: inputFieldBg,
                                        inputFieldBorder: inputFieldBorder,
                                        inputTextColor: inputTextColor,
                                      ),
                                      const SizedBox(height: 24),

                                      // Confirm Password
                                      _buildPasswordField(
                                        label: "CONFIRM NEW PASSWORD",
                                        icon: Icons.security,
                                        controller: _confirmPassCtrl,
                                        isObscure: !showConfirm,
                                        onToggle: () => setState(() => showConfirm = !showConfirm),
                                        hintText: "Confirm new password",
                                        labelColor: labelColor,
                                        inputFieldBg: inputFieldBg,
                                        inputFieldBorder: inputFieldBorder,
                                        inputTextColor: inputTextColor,
                                      ),
                                      const SizedBox(height: 32),

                                      // Submit Button
                                      GestureDetector(
                                        onTap: loading ? null : _handleUpdate,
                                        child: Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.symmetric(vertical: 20),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF42A5F5),
                                            borderRadius: BorderRadius.circular(30),
                                            boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
                                          ),
                                          alignment: Alignment.center,
                                          child: const Text("UPDATE PASSWORD", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: 2)),
                                        ),
                                      ).animate().scale(delay: 200.ms)
                                    ],
                                  ),
                                ).animate().fadeIn().slideY(begin: 0.1),
                        ),
                      ),
                      const SizedBox(height: 50), // Standard bottom padding
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

  Widget _buildPasswordField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required bool isObscure,
    required VoidCallback onToggle,
    required String hintText,
    required Color labelColor,
    required Color inputFieldBg,
    required Color inputFieldBorder,
    required Color inputTextColor,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16, bottom: 8),
          child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: labelColor, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
        ),
        AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          decoration: BoxDecoration(
            color: inputFieldBg,
            borderRadius: BorderRadius.circular(25),
            border: Border.all(color: inputFieldBorder),
          ),
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 20, right: 12),
                child: Icon(icon, color: const Color(0xFF94A3B8), size: 20),
              ),
              Expanded(
                child: TextField(
                  controller: controller,
                  obscureText: isObscure,
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: inputTextColor, fontStyle: FontStyle.italic),
                  decoration: InputDecoration(
                    hintText: hintText,
                    hintStyle: const TextStyle(color: Color(0xFFCBD5E1)),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 20),
                  ),
                ),
              ),
              GestureDetector(
                onTap: onToggle,
                child: Padding(
                  padding: const EdgeInsets.only(right: 20, left: 12),
                  child: Icon(isObscure ? Icons.visibility_off : Icons.visibility, color: const Color(0xFF94A3B8), size: 20),
                ),
              )
            ],
          ),
        ),
      ],
    );
  }
}
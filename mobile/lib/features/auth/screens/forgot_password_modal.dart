import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/auth_provider.dart';

class ForgotPasswordModal extends ConsumerStatefulWidget {
  const ForgotPasswordModal({super.key});

  @override
  ConsumerState<ForgotPasswordModal> createState() => _ForgotPasswordModalState();
}

class _ForgotPasswordModalState extends ConsumerState<ForgotPasswordModal> {
  int step = 1;
  final _identityController = TextEditingController(); // 🔥 EMAIL KI JAGAH IDENTITY
  final _otpController = TextEditingController();
  final _newPassController = TextEditingController();
  final _confirmPassController = TextEditingController();

  String message = '';
  bool isSuccessMsg = false;
  bool loading = false;
  bool _showPass = false;

  @override
  void dispose() {
    _identityController.dispose();
    _otpController.dispose();
    _newPassController.dispose();
    _confirmPassController.dispose();
    super.dispose();
  }

  void handleSendOtp() async {
    // 🔥 AUTO-SPACE FIX: .trim() use kiya
    final identity = _identityController.text.trim();
    if (identity.isEmpty) {
      setState(() { message = "Please enter your ID, Phone, or Email."; isSuccessMsg = false; });
      return;
    }

    setState(() { loading = true; message = ''; });
    
    // Auth provider ke through API call
    final error = await ref.read(authProvider.notifier).sendOtp(identity);
    
    if (mounted) {
      setState(() {
        loading = false;
        if (error == null) {
          step = 2;
          message = "OTP sent to your registered email! 📩";
          isSuccessMsg = true;
        } else {
          message = error;
          isSuccessMsg = false;
        }
      });
    }
  }

  void handleReset() async {
    final identity = _identityController.text.trim();
    final otp = _otpController.text.trim();
    final newPassword = _newPassController.text;
    final confirmPassword = _confirmPassController.text;

    if (otp.isEmpty || newPassword.isEmpty || confirmPassword.isEmpty) {
      setState(() { message = "Please fill all fields!"; isSuccessMsg = false; });
      return;
    }

    if (newPassword != confirmPassword) {
      setState(() { message = "Passwords do not match! ❌"; isSuccessMsg = false; });
      return;
    }

    if (newPassword.length < 6) {
      setState(() { message = "Password must be at least 6 characters long."; isSuccessMsg = false; });
      return;
    }

    setState(() { loading = true; message = ''; });
    
    // 🔥 IDENTITY BHEJI JA RAHI HAI 🔥
    final error = await ref.read(authProvider.notifier).resetPassword({
      'identity': identity, 
      'otp': otp, 
      'newPassword': newPassword
    });
    
    if (mounted) {
      setState(() => loading = false);
      if (error == null) {
        setState(() { message = "Password updated! Please log in. ✅"; isSuccessMsg = true; });
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) Navigator.pop(context); // 2 second baad automatic band
        });
      } else {
        setState(() { message = error; isSuccessMsg = false; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF42A5F5);

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 20, 
        top: 30, left: 24, right: 24
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(40))
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // --- HEADER ---
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: accent.withOpacity(0.1), shape: BoxShape.circle),
                child: const Icon(Icons.security, color: accent, size: 24),
              ),
              const SizedBox(width: 16),
              const Text("Password Reset", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: Color(0xFF1E293B))),
              const Spacer(),
              IconButton(icon: const Icon(Icons.close, color: Colors.grey), onPressed: () => Navigator.pop(context))
            ],
          ),
          const SizedBox(height: 24),
          
          // --- MESSAGE BOX ---
          if (message.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: isSuccessMsg ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isSuccessMsg ? Colors.green.withOpacity(0.3) : Colors.red.withOpacity(0.3))
              ),
              child: Row(
                children: [
                  Icon(isSuccessMsg ? Icons.check_circle : Icons.error, color: isSuccessMsg ? Colors.green : Colors.redAccent, size: 18),
                  const SizedBox(width: 10),
                  Expanded(child: Text(message, style: TextStyle(color: isSuccessMsg ? Colors.green : Colors.redAccent, fontWeight: FontWeight.w900, fontSize: 12, fontStyle: FontStyle.italic))),
                ],
              ),
            ).animate().fadeIn().slideY(begin: -0.1),

          // --- STEP 1: IDENTITY VERIFICATION ---
          if (step == 1) ...[
            _buildPremiumTextField(
              controller: _identityController,
              hint: "User ID / Phone / Email", // 🔥 UI Update
              icon: Icons.person_search_outlined,
              keyboardType: TextInputType.text,
            ),
            const SizedBox(height: 20),
            _buildPremiumButton(
              label: "REQUEST OTP",
              isLoading: loading,
              onTap: handleSendOtp,
              color: accent,
            )
          ] 
          
          // --- STEP 2: OTP & NEW PASSWORD ---
          else ...[
            _buildPremiumTextField(
              controller: _otpController,
              hint: "Enter 6-digit OTP",
              icon: Icons.pin_outlined,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            _buildPremiumTextField(
              controller: _newPassController,
              hint: "New Password",
              icon: Icons.lock_outline,
              isPassword: true,
            ),
            const SizedBox(height: 12),
            _buildPremiumTextField(
              controller: _confirmPassController,
              hint: "Confirm Password",
              icon: Icons.lock_reset,
              isPassword: true,
            ),
            const SizedBox(height: 16),
            _buildPremiumButton(
              label: "VERIFY & RESET",
              isLoading: loading,
              onTap: handleReset,
              color: const Color(0xFF10B981), // Green for success
            )
          ].animate().fadeIn().slideX(begin: 0.1),
        ],
      ),
    );
  }

  // --- PREMIUM TEXT FIELD WIDGET ---
  Widget _buildPremiumTextField({required TextEditingController controller, required String hint, required IconData icon, bool isPassword = false, TextInputType keyboardType = TextInputType.text}) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword && !_showPass,
        keyboardType: keyboardType,
        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontStyle: FontStyle.italic),
          prefixIcon: Icon(icon, color: const Color(0xFF42A5F5), size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          suffixIcon: isPassword ? IconButton(
            icon: Icon(_showPass ? Icons.visibility_off : Icons.visibility, color: const Color(0xFF94A3B8), size: 20),
            onPressed: () => setState(() => _showPass = !_showPass),
          ) : null,
        ),
      ),
    );
  }

  // --- PREMIUM BUTTON WIDGET ---
  Widget _buildPremiumButton({required String label, required bool isLoading, required VoidCallback onTap, required Color color}) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: color.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 5))],
        ),
        child: Center(
          child: isLoading 
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1.5)),
        ),
      ),
    );
  }
}
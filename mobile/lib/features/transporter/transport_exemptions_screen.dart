import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart';

class TransportExemptionsScreen extends ConsumerStatefulWidget {
  const TransportExemptionsScreen({super.key});

  @override
  ConsumerState<TransportExemptionsScreen> createState() => _TransportExemptionsScreenState();
}

class _TransportExemptionsScreenState extends ConsumerState<TransportExemptionsScreen> {
  bool isLoading = true;
  bool isProcessing = false;
  List<dynamic> exemptions = [];
  int? selectedMonthIndex;

  final int currentYear = DateTime.now().year;
  final List<String> months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  @override
  void initState() {
    super.initState();
    _fetchExemptions();
  }

  Future<void> _fetchExemptions() async {
    try {
      final response = await ApiClient.dio.get('/fees/settings/transport-exempt');
      if (mounted) {
        setState(() {
          exemptions = response.data ?? [];
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        _showToast("Failed to load exemptions", isError: true);
      }
    }
  }

  Future<void> _addExemption() async {
    if (selectedMonthIndex == null) {
      _showToast("Please select a month first!", isError: true);
      return;
    }

    setState(() => isProcessing = true);
    if (context.canPop()) context.pop(); // Close confirm dialog

    try {
      await ApiClient.dio.post('/fees/settings/transport-exempt', data: {
        'monthIndex': selectedMonthIndex,
        'year': currentYear,
      });
      _showToast("Transport fees disabled for selected month!", isError: false);
      setState(() => selectedMonthIndex = null);
      await _fetchExemptions();
    } catch (e) {
      _showToast("Operation failed or already exempt.", isError: true);
    } finally {
      if (mounted) setState(() => isProcessing = false);
    }
  }

  Future<void> _removeExemption(String id) async {
    setState(() => isProcessing = true);
    try {
      await ApiClient.dio.delete('/fees/settings/transport-exempt/$id');
      _showToast("Exemption reverted! Fees active again.", isError: false);
      await _fetchExemptions();
    } catch (e) {
      _showToast("24-Hour window expired or failed!", isError: true);
    } finally {
      if (mounted) setState(() => isProcessing = false);
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isError ? Icons.error_outline : Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 13, color: Colors.white))),
          ],
        ),
        backgroundColor: isError ? const Color(0xFFF43F5E) : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.all(20),
        elevation: 10,
      ),
    );
  }

  bool _isExpired(String createdAt) {
    final createdDate = DateTime.parse(createdAt);
    return DateTime.now().difference(createdDate).inHours > 24;
  }

  void _showMonthPickerBottomSheet(Color cardBg, Color textPrimary, Color borderColor, Color accentColor) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.5,
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 20)],
          ),
          child: Column(
            children: [
              Container(margin: const EdgeInsets.only(top: 10, bottom: 20), width: 50, height: 5, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(10))),
              Text("SELECT MONTH", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary, letterSpacing: 2, fontStyle: FontStyle.italic)),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  itemCount: months.length,
                  itemBuilder: (context, index) {
                    final isSelected = selectedMonthIndex == index;
                    return GestureDetector(
                      onTap: () {
                        setState(() => selectedMonthIndex = index);
                        context.pop();
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        decoration: BoxDecoration(
                          color: isSelected ? accentColor : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: isSelected ? accentColor : borderColor, width: 2),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("${months[index]} $currentYear", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: isSelected ? Colors.white : textPrimary)),
                            if (isSelected) const Icon(Icons.check_circle, color: Colors.white, size: 20).animate().scale(),
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

  void _showConfirmDialog(Color cardBg, Color textPrimary, Color textMuted) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Dialog(
          backgroundColor: Colors.transparent,
          elevation: 0,
          child: Container(
            padding: const EdgeInsets.all(30),
            decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(40), boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 30, offset: Offset(0, 10))]),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: const Color(0xFFFFF1F2), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 4), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)]),
                  child: const Icon(Icons.warning_amber_rounded, size: 40, color: Color(0xFFF43F5E)),
                ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
                const SizedBox(height: 20),
                Text("DISABLE FEES?", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textPrimary, fontStyle: FontStyle.italic, letterSpacing: 1)),
                const SizedBox(height: 12),
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textMuted, height: 1.5, fontFamily: 'Nunito'),
                    children: [
                      const TextSpan(text: "Turn off transport fees for "),
                      TextSpan(text: "${months[selectedMonthIndex!]} $currentYear", style: const TextStyle(color: Color(0xFFF43F5E), fontWeight: FontWeight.w900)),
                      const TextSpan(text: "? You can undo this within 24 hours."),
                    ],
                  ),
                ),
                const SizedBox(height: 30),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => context.pop(),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(color: Colors.grey.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                          alignment: Alignment.center,
                          child: const Text("CANCEL", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: _addExemption,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF43F5E), 
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [BoxShadow(color: const Color(0xFFF43F5E).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 5))]
                          ),
                          alignment: Alignment.center,
                          child: const Text("CONFIRM", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
                        ),
                      ),
                    ),
                  ],
                )
              ],
            ),
          ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1),
        ),
      ),
    );
  }

  void _handleBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    final scaffoldBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final textPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final textMuted = isDarkMode ? const Color(0xFF64748B) : const Color(0xFF94A3B8);
    final borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final innerBoxBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    const accentColor = Color(0xFF42A5F5);

    if (isLoading && exemptions.isEmpty) return const CustomLoader();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack();
      },
      child: Scaffold(
        backgroundColor: scaffoldBg,
        body: RefreshIndicator(
          color: accentColor,
          backgroundColor: cardBg,
          onRefresh: _fetchExemptions,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()),
            slivers: [
              // --- HEADER SECTION (Matched exactly with your design) ---
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: Container(
                    padding: const EdgeInsets.only(top: 60, bottom: 60, left: 24, right: 24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isDarkMode ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] : [const Color(0xFF64B5F6), accentColor],
                        begin: Alignment.topCenter, end: Alignment.bottomCenter,
                      ),
                      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: _handleBack,
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                            child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              const Text("FEE CONTROLLER", textAlign: TextAlign.center, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
                              Text("TRANSPORT EXEMPTIONS", textAlign: TextAlign.center, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                          child: const Icon(Icons.money_off, color: Colors.white, size: 24),
                        ),
                      ],
                    ),
                  ).animate().slideY(begin: -0.2, duration: 500.ms),
                ),
              ),

              // --- MAIN CONTENT ---
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      // 1. INFO BOX
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(35), border: Border.all(color: borderColor), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 5))]),
                        child: Row(
                          children: [
                            Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(20)), child: const Icon(Icons.shield, color: Color(0xFFF59E0B), size: 30)),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text("Exempt Specific Months", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary, fontStyle: FontStyle.italic)),
                                  const SizedBox(height: 6),
                                  Text("Turn off bus fees for specific months. You have a 24-hour window to undo this action.", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textMuted, height: 1.4)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

                      const SizedBox(height: 24),

                      // 2. SELECTOR & ACTION BUTTON (Fixed Overflow with Flex Expanded)
                      Row(
                        children: [
                          Expanded(
                            flex: 5, // Takes up 5 parts of the space
                            child: GestureDetector(
                              onTap: () => _showMonthPickerBottomSheet(cardBg, textPrimary, borderColor, accentColor),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                                decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(24), border: Border.all(color: selectedMonthIndex != null ? accentColor : borderColor, width: selectedMonthIndex != null ? 2 : 1)),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Row(
                                        children: [
                                          Icon(Icons.calendar_month, color: selectedMonthIndex != null ? accentColor : textMuted, size: 18),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              selectedMonthIndex != null ? "${months[selectedMonthIndex!]} $currentYear" : "Select Month...",
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: selectedMonthIndex != null ? textPrimary : textMuted),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Icon(Icons.keyboard_arrow_down, color: textMuted, size: 20),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 3, // Takes up 3 parts of the space to prevent overflowing
                            child: GestureDetector(
                              onTap: () {
                                if (selectedMonthIndex == null) {
                                  _showToast("Please select a month first!", isError: true);
                                } else {
                                  _showConfirmDialog(cardBg, textPrimary, textMuted);
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 20),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF1E293B),
                                  borderRadius: BorderRadius.circular(24),
                                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 4))]
                                ),
                                alignment: Alignment.center,
                                child: isProcessing
                                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                    : const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.add_circle, color: Colors.white, size: 16),
                                          SizedBox(width: 6),
                                          Text("DISABLE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
                                        ],
                                      ),
                              ),
                            ),
                          ),
                        ],
                      ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),

                      const SizedBox(height: 32),

                      // 3. ACTIVE EXEMPTIONS LOG
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(40), border: Border.all(color: borderColor)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.verified_user, color: accentColor, size: 20),
                                const SizedBox(width: 10),
                                Text("ACTIVE EXEMPTIONS LOG", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textMuted, letterSpacing: 1.5)),
                              ],
                            ),
                            const SizedBox(height: 20),
                            
                            if (exemptions.isEmpty)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 40),
                                child: Center(
                                  child: Column(
                                    children: [
                                      Icon(Icons.security, size: 48, color: borderColor),
                                      const SizedBox(height: 12),
                                      Text("No active exemptions found.", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textMuted, letterSpacing: 1)),
                                    ],
                                  ),
                                ),
                              )
                            else
                              ...exemptions.asMap().entries.map((entry) {
                                final idx = entry.key;
                                final ex = entry.value;
                                final isExpired = _isExpired(ex['createdAt']);
                                
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 16),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(color: innerBoxBg, borderRadius: BorderRadius.circular(24), border: Border.all(color: borderColor)),
                                  child: Row(
                                    children: [
                                      // Date Icon
                                      Container(
                                        width: 50, height: 50,
                                        decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)]),
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(ex['year'].toString(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textMuted)),
                                            Text(months[ex['monthIndex']].substring(0, 3).toUpperCase(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: accentColor)),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      // Info
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text("${months[ex['monthIndex']]} ${ex['year']}", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary, fontStyle: FontStyle.italic)),
                                            const SizedBox(height: 2),
                                            Text("APPLIED: ${ex['createdAt'].substring(0, 10)}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textMuted, letterSpacing: 1)),
                                          ],
                                        ),
                                      ),
                                      // Action Button
                                      isExpired
                                        ? Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                            decoration: BoxDecoration(color: Colors.grey.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                                            child: Row(
                                              children: [
                                                Icon(Icons.lock, size: 14, color: textMuted),
                                                const SizedBox(width: 4),
                                                Text("FIXED", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textMuted, letterSpacing: 1)),
                                              ],
                                            ),
                                          )
                                        : GestureDetector(
                                            onTap: () => _removeExemption(ex['_id']),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                              decoration: BoxDecoration(color: const Color(0xFFFFF1F2), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFFFE4E6))),
                                              child: Row(
                                                children: const [
                                                  Icon(Icons.delete_outline, size: 16, color: Color(0xFFF43F5E)),
                                                  SizedBox(width: 6),
                                                  Text("REVERT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFFF43F5E), letterSpacing: 1)),
                                                ],
                                              ),
                                            ),
                                          ),
                                    ],
                                  ),
                                ).animate().fadeIn(delay: Duration(milliseconds: 300 + (idx * 100))).slideX(begin: 0.1);
                              }).toList()
                          ],
                        ),
                      ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),
                      
                      const SizedBox(height: 50),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class StudentSupport extends ConsumerStatefulWidget {
  const StudentSupport({super.key});

  @override
  ConsumerState<StudentSupport> createState() => _StudentSupportState();
}

class _StudentSupportState extends ConsumerState<StudentSupport> {
  bool isInitialLoading = true;
  bool isSubmitting = false;
  bool isFormOpen = false;
  
  List<dynamic> tickets = [];

  // Form State
  final TextEditingController _subjectCtrl = TextEditingController();
  final TextEditingController _queryCtrl = TextEditingController();
  bool isUrgent = false;

  @override
  void initState() {
    super.initState();
    _fetchTickets();
  }

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _queryCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchTickets({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isInitialLoading = true);

    try {
      final response = await ApiClient.dio.get('/support/my-queries');
      if (mounted) {
        setState(() {
          tickets = response.data as List<dynamic>;
          isInitialLoading = false;
        });
      }
    } catch (err) {
      _showToast("Failed to load support signals.", isError: true);
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchTickets(isRefresh: true);
  }

  Future<void> _handleSubmit() async {
    if (_subjectCtrl.text.trim().isEmpty || _queryCtrl.text.trim().isEmpty) {
      _showToast("Please fill all details.", isError: true);
      return;
    }

    setState(() => isSubmitting = true);

    try {
      await ApiClient.dio.post('/support/ask', data: {
        'subject': _subjectCtrl.text.trim(),
        'query': _queryCtrl.text.trim(),
        'isUrgent': isUrgent
      });

      _showToast("Query sent to your Class Teacher. 🛰️");
      
      setState(() {
        isFormOpen = false;
        _subjectCtrl.clear();
        _queryCtrl.clear();
        isUrgent = false;
      });

      await _fetchTickets(isRefresh: true);

    } catch (err) {
      _showToast("Protocol Failure: Link interrupted. ⚠️", isError: true);
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
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
                            // Header Row (Icon hata diya gaya hai)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    if (context.canPop()) context.pop();
                                    else context.go('/');
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
                                    const Text("Student Support", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                    Text("ASK & CONNECT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: const Icon(Icons.support_agent, color: Colors.white, size: 24),
                                ), // Padding alignment preserve ke liye
                              ],
                            ),
                            const SizedBox(height: 24),
                            // Connected Status Card
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: Colors.white.withOpacity(0.2)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                                    child: const Icon(Icons.memory, color: Colors.white, size: 16).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(0.9, 0.9)),
                                  ),
                                  const SizedBox(width: 12),
                                  const Text("CONNECTED TO CLASS TEACHER", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                ],
                              ),
                            )
                          ],
                        ),
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      // --- CONTENT AREA ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              
                              // 🔥 NEW QUERY TOGGLE BUTTON (MOVED HERE) 🔥
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text("ACTIVE SUPPORT", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 3)),
                                  GestureDetector(
                                    onTap: () => setState(() => isFormOpen = !isFormOpen),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: isFormOpen ? const Color(0xFF42A5F5) : isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: isFormOpen ? const Color(0xFF42A5F5) : isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100)
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(isFormOpen ? Icons.close : Icons.add_comment, size: 14, color: isFormOpen ? Colors.white : const Color(0xFF42A5F5)),
                                          const SizedBox(width: 6),
                                          Text(isFormOpen ? "CLOSE" : "NEW QUERY", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: isFormOpen ? Colors.white : const Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1.5))
                                        ],
                                      ),
                                    ),
                                  )
                                ],
                              ),
                              const SizedBox(height: 20),

                              // --- NEW QUERY FORM (COLLAPSIBLE) ---
                              if (isFormOpen)
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 400),
                                  margin: const EdgeInsets.only(bottom: 30),
                                  padding: const EdgeInsets.all(28),
                                  decoration: BoxDecoration(
                                    color: cardColor,
                                    borderRadius: BorderRadius.circular(40),
                                    border: Border.all(color: cardBorder),
                                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.send, color: Color(0xFF42A5F5), size: 16),
                                          const SizedBox(width: 8),
                                          const Text("RAISE A NEW QUERY", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 2)),
                                        ],
                                      ),
                                      const SizedBox(height: 24),
                                      
                                      Text("• QUERY SUBJECT", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: 2)),
                                      const SizedBox(height: 8),
                                      _buildInput(_subjectCtrl, "e.g. Class doubt, Leave request", 1, inputBg, cardBorder, textColorPrimary, textColorSecondary),
                                      const SizedBox(height: 16),
                                      
                                      Text("• DETAILED DESCRIPTION", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: 2)),
                                      const SizedBox(height: 8),
                                      _buildInput(_queryCtrl, "Brief your teacher about the issue...", 4, inputBg, cardBorder, textColorPrimary, textColorSecondary),
                                      const SizedBox(height: 20),

                                      // Urgent Checkbox
                                      GestureDetector(
                                        onTap: () => setState(() => isUrgent = !isUrgent),
                                        child: Row(
                                          children: [
                                            Container(
                                              width: 20, height: 20,
                                              decoration: BoxDecoration(
                                                color: isUrgent ? const Color(0xFFF43F5E) : Colors.transparent,
                                                borderRadius: BorderRadius.circular(6),
                                                border: Border.all(color: isUrgent ? const Color(0xFFF43F5E) : cardBorder, width: 2)
                                              ),
                                              child: isUrgent ? const Icon(Icons.check, color: Colors.white, size: 14) : null,
                                            ),
                                            const SizedBox(width: 12),
                                            const Text("REQUEST URGENT SOLUTION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFFF43F5E), fontStyle: FontStyle.italic, letterSpacing: 1)),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 24),

                                      // Submit Button
                                      GestureDetector(
                                        onTap: isSubmitting ? null : _handleSubmit,
                                        child: Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.symmetric(vertical: 20),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF42A5F5),
                                            borderRadius: BorderRadius.circular(30),
                                            boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))]
                                          ),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              isSubmitting 
                                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                                : const Icon(Icons.near_me, color: Colors.white, size: 16),
                                              const SizedBox(width: 10),
                                              Text(isSubmitting ? "TRANSMITTING..." : "SEND QUERY NOW", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                            ],
                                          ),
                                        ),
                                      ).animate().scale(delay: 200.ms)
                                    ],
                                  ),
                                ).animate().fadeIn().slideY(begin: -0.1),

                              // --- TICKETS LIST ---
                              tickets.isEmpty 
                                ? _buildEmptyState(cardColor, cardBorder, textColorSecondary)
                                : _buildTicketsList(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary, inputBg),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 50), // 🔥 BOTTOM PADDING LOCKED
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

  // --- HELPER WIDGETS ---
  Widget _buildInput(TextEditingController ctrl, String hint, int lines, Color inputBg, Color cardBorder, Color textColorPrimary, Color textColorSecondary) {
    return Container(
      decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
      child: TextField(
        controller: ctrl,
        maxLines: lines,
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildEmptyState(Color cardColor, Color cardBorder, Color textColorSecondary) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 60),
      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder, style: BorderStyle.solid)),
      child: Column(
        children: [
          Icon(Icons.support_agent, size: 60, color: textColorSecondary.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text("NO SUPPORT SIGNALS FOUND", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic, letterSpacing: 1.5)),
        ],
      ),
    ).animate().fadeIn();
  }

  Widget _buildTicketsList(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary, Color inputBg) {
    return Column(
      children: tickets.asMap().entries.map((entry) {
        int idx = entry.key;
        var t = entry.value;

        bool isResolved = t['status'] == 'Resolved';
        Color statusColor = isResolved ? const Color(0xFF10B981) : const Color(0xFFF59E0B);
        Color statusBg = isDarkMode ? statusColor.withOpacity(0.2) : (isResolved ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7));

        return AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          margin: const EdgeInsets.only(bottom: 20),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(35),
            border: Border.all(color: cardBorder),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Query ID & Status Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("QUERY ID: #${(t['_id'] ?? '').toString().length > 6 ? (t['_id']).toString().substring((t['_id']).toString().length - 6).toUpperCase() : t['_id']}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: statusColor.withOpacity(0.3))),
                      child: Text((t['status'] ?? 'Pending').toString().toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: statusColor, letterSpacing: 1, fontStyle: FontStyle.italic)),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Subject & Query
              Text("• ${(t['subject'] ?? '').toString().toUpperCase()}", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
              const SizedBox(height: 8),
              Text("\"${t['query']}\"", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic, height: 1.5)),
              const SizedBox(height: 20),

              // Teacher Answer Box
              if (t['answer'] != null && t['answer'].toString().isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(bottom: 20),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.2) : Colors.blue.shade50.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade100),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.verified_user, color: Color(0xFF42A5F5), size: 14),
                          const SizedBox(width: 8),
                          const Text("FACULTY SOLUTION:", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 1.5)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text("\"${t['answer']}\"", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColorPrimary, fontStyle: FontStyle.italic, height: 1.4)),
                    ],
                  ),
                ),

              // Footer
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 12, color: textColorSecondary),
                      const SizedBox(width: 6),
                      Text(t['createdAt'] != null ? DateFormat('dd MMM').format(DateTime.parse(t['createdAt'])) : 'N/A', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorSecondary, fontStyle: FontStyle.italic)),
                    ],
                  ),
                  Row(
                    children: [
                      Icon(Icons.warning_rounded, size: 12, color: t['isUrgent'] == true ? const Color(0xFFF43F5E) : const Color(0xFFF59E0B)),
                      const SizedBox(width: 6),
                      Text(t['isUrgent'] == true ? "URGENT QUERY" : "STANDARD PRIORITY", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: t['isUrgent'] == true ? const Color(0xFFF43F5E) : const Color(0xFFF59E0B), fontStyle: FontStyle.italic, letterSpacing: 1)),
                    ],
                  ),
                ],
              )
            ],
          ),
        ).animate().fadeIn(delay: Duration(milliseconds: 100 * idx)).slideY(begin: 0.1);
      }).toList(),
    );
  }
}
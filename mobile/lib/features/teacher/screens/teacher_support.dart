import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class TeacherSupport extends ConsumerStatefulWidget {
  const TeacherSupport({super.key});

  @override
  ConsumerState<TeacherSupport> createState() => _TeacherSupportState();
}

class _TeacherSupportState extends ConsumerState<TeacherSupport> {
  bool isLoading = true;
  bool isResolving = false;
  List<dynamic> queries = [];
  
  // Controllers Map to handle multiple textareas safely without losing focus
  final Map<String, TextEditingController> _replyControllers = {};

  @override
  void initState() {
    super.initState();
    _fetchQueries();
  }

  @override
  void dispose() {
    for (var ctrl in _replyControllers.values) {
      ctrl.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchQueries({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isLoading = true);

    try {
      final response = await ApiClient.dio.get('/support/all-queries');
      if (mounted) {
        setState(() {
          queries = response.data ?? [];
          // Initialize controllers for pending queries
          for (var q in queries) {
            if (q['status'] == 'Pending' && !_replyControllers.containsKey(q['_id'])) {
              _replyControllers[q['_id']] = TextEditingController();
            }
          }
        });
      }
    } catch (e) {
      _showToast("Neural fetch error!", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _handleResolve(String id) async {
    final answer = _replyControllers[id]?.text.trim() ?? '';
    
    if (answer.isEmpty) {
      _showToast("Error: Enter resolution protocol! 🛡️", isError: true);
      return;
    }

    setState(() => isResolving = true);

    try {
      await ApiClient.dio.put('/support/resolve/$id', data: {'answer': answer});
      
      _showToast("Solution sent! Query closed. ✅");
      
      // Optimistic UI Update
      if (mounted) {
        setState(() {
          var queryIndex = queries.indexWhere((q) => q['_id'] == id);
          if (queryIndex != -1) {
            queries[queryIndex]['status'] = 'Resolved';
            queries[queryIndex]['answer'] = answer;
          }
          _replyControllers[id]?.clear();
        });
      }
    } catch (e) {
      _showToast("Transmission failed: Neural link unstable.", isError: true);
    } finally {
      if (mounted) setState(() => isResolving = false);
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
    if (isLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        
        // 🔥 SAFE BACK ROUTING LOGIC 🔥
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/teacher/home');
        }
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: cardColor,
          onRefresh: () => _fetchQueries(isRefresh: true),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()), // 🔥 NO RUBBER BANDING 🔥
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    // --- HEADER SECTION ---
                    Container(
                      padding: const EdgeInsets.only(top: 60, bottom: 40, left: 24, right: 24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isDarkMode 
                              ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                              : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                          begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: () {
                              if (context.canPop()) context.pop();
                              else context.go('/teacher/home');
                            },
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                              child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text("Class Support", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
                              Text("ASSIGNED CLASS QUERIES", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                            child: const Icon(Icons.help_outline, color: Colors.white, size: 24),
                          ),
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- MAIN QUERIES LIST ---
                    Transform.translate(
                      offset: const Offset(0, -20),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: queries.isEmpty
                            ? Container(
                                padding: const EdgeInsets.symmetric(vertical: 60),
                                width: double.infinity,
                                decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder, width: 2), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
                                child: Column(
                                  children: [
                                    const Icon(Icons.message, size: 60, color: Colors.grey).animate(onPlay: (c) => c.repeat(reverse: true)).slideY(begin: -0.1, end: 0.1, duration: 1.seconds),
                                    const SizedBox(height: 24),
                                    const Text("SYSTEM EQUILIBRIUM REACHED", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, fontStyle: FontStyle.italic, letterSpacing: 2)),
                                    const SizedBox(height: 8),
                                    const Text("No sector interrupts found.", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                                  ],
                                ),
                              ).animate().fadeIn()
                            : Column(
                                children: queries.map((q) {
                                  bool isPending = q['status'] == 'Pending';
                                  bool isUrgent = q['isUrgent'] == true;

                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 24),
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(
                                      color: cardColor,
                                      borderRadius: BorderRadius.circular(40),
                                      border: Border.all(color: cardBorder),
                                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))],
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        
                                        // 1. Student Info Header
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Row(
                                                children: [
                                                  Container(
                                                    padding: const EdgeInsets.all(12),
                                                    decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50, borderRadius: BorderRadius.circular(16)),
                                                    child: const Icon(Icons.person, color: Color(0xFF42A5F5), size: 24),
                                                  ),
                                                  const SizedBox(width: 16),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Container(
                                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                          decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                                                          child: const Text("ASSIGNED STUDENT", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF10B981), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                                        ),
                                                        const SizedBox(height: 8),
                                                        Text((q['student']?['name'] ?? 'Unknown').toString().toUpperCase(), style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                                        const SizedBox(height: 4),
                                                        Text("CLASS ${q['student']?['grade'] ?? 'N/A'}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColorSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                                      ],
                                                    ),
                                                  )
                                                ],
                                              ),
                                            ),
                                            if (isUrgent)
                                              Container(
                                                width: 12, height: 12,
                                                margin: const EdgeInsets.only(top: 8),
                                                decoration: BoxDecoration(color: const Color(0xFFF43F5E), shape: BoxShape.circle, boxShadow: [BoxShadow(color: const Color(0xFFF43F5E).withOpacity(0.5), blurRadius: 8)]),
                                              ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1, 1), end: const Offset(1.3, 1.3)),
                                          ],
                                        ),
                                        const SizedBox(height: 24),

                                        // 2. Query Text Box
                                        Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.all(20),
                                          decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(q['subject'].toString().toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textColorPrimary, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                              const SizedBox(height: 8),
                                              Text("\"${q['query']}\"", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColorSecondary, height: 1.5, fontStyle: FontStyle.italic)),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 24),

                                        // 3. Resolution Logic
                                        if (isPending) ...[
                                          Container(
                                            decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                            child: TextField(
                                              controller: _replyControllers[q['_id']],
                                              maxLines: 4,
                                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic),
                                              decoration: InputDecoration(
                                                hintText: "Type your solution here...",
                                                hintStyle: TextStyle(fontSize: 12, color: textColorSecondary.withOpacity(0.5)),
                                                border: InputBorder.none,
                                                contentPadding: const EdgeInsets.all(20),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 20),
                                          GestureDetector(
                                            onTap: isResolving ? null : () => _handleResolve(q['_id']),
                                            child: Container(
                                              width: double.infinity,
                                              padding: const EdgeInsets.symmetric(vertical: 18),
                                              decoration: BoxDecoration(
                                                color: isResolving ? Colors.grey : const Color(0xFF42A5F5),
                                                borderRadius: BorderRadius.circular(30),
                                                border: Border(bottom: BorderSide(color: isResolving ? Colors.grey.shade600 : const Color(0xFF1E88E5), width: 4)),
                                                boxShadow: isResolving ? [] : [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5))],
                                              ),
                                              child: Row(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  if (isResolving) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                                  else const Icon(Icons.send, color: Colors.white, size: 16),
                                                  const SizedBox(width: 10),
                                                  Text(isResolving ? "TRANSMITTING..." : "SEND SOLUTION", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2, fontStyle: FontStyle.italic)),
                                                ],
                                              ),
                                            ),
                                          )
                                        ] else ...[
                                          Container(
                                            width: double.infinity,
                                            padding: const EdgeInsets.all(20),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF10B981).withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(25),
                                              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3), style: BorderStyle.solid),
                                            ),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    const Icon(Icons.check_circle, size: 14, color: Color(0xFF10B981)),
                                                    const SizedBox(width: 8),
                                                    const Text("ARCHIVED SOLUTION SENT", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF10B981), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                                  ],
                                                ),
                                                const SizedBox(height: 10),
                                                Text("\"${q['answer']}\"", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
                                              ],
                                            ),
                                          )
                                        ]
                                      ],
                                    ),
                                  ).animate().fadeIn().slideY(begin: 0.1);
                                }).toList(),
                              ),
                      ),
                    ),
                    const SizedBox(height: 50), // 🔥 EXACT 50PX BOTTOM PADDING LOCKED 🔥
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
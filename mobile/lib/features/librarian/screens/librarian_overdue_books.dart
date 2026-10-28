import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../core/constants/app_config.dart';

class LibrarianOverdueBooks extends ConsumerStatefulWidget {
  const LibrarianOverdueBooks({super.key});

  @override
  ConsumerState<LibrarianOverdueBooks> createState() => _LibrarianOverdueBooksState();
}

class _LibrarianOverdueBooksState extends ConsumerState<LibrarianOverdueBooks> {
  bool _loading = true;
  bool _isSubmitting = false;
  List<dynamic> _transactions = [];
  String _searchQuery = '';
  int _finePerDay = 5;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      if (!mounted) return;
      setState(() => _loading = true);

      // Fetch Overdue list and Settings in parallel
      final results = await Future.wait([
        ApiClient.dio.get('/library/overdue'),
        ApiClient.dio.get('/library/settings')
      ]);

      if (mounted) {
        setState(() {
          _transactions = results[0].data;
          _finePerDay = results[1].data['finePerDay'] ?? 5;
          _loading = false;
        });
      }
    } catch (e) {
      _showToast("Failed to fetch overdue data.", isError: true);
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, int> _calculateDaysAndFine(String dueDateStr) {
    DateTime today = DateTime.now();
    DateTime due = DateTime.parse(dueDateStr);
    
    DateTime todayDate = DateTime(today.year, today.month, today.day);
    DateTime dueDate = DateTime(due.year, due.month, due.day);
    
    int diffDays = todayDate.difference(dueDate).inDays;
    diffDays = diffDays > 0 ? diffDays : 0; // Negative means not overdue yet, shouldn't happen here
    
    return {'days': diffDays, 'fine': diffDays * _finePerDay};
  }

  Future<void> _handleReturn(String transactionId) async {
    setState(() => _isSubmitting = true);
    try {
      await ApiClient.dio.put('/library/return/$transactionId');
      _showToast("Book returned and fine cleared! ✅");
      await _fetchData();
    } catch (e) {
      _showToast("Return failed.", isError: true);
    } finally {
      if (context.mounted) Navigator.pop(context); // Close Dialog
      setState(() => _isSubmitting = false);
    }
  }

  void _showConfirmDialog(Map<String, dynamic> tx, int fineAmt) {
    final isDarkMode = ref.read(themeProvider) == ThemeMode.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDarkMode ? const Color(0xFF1E293B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
        title: const Column(
          children: [
            Icon(Icons.check_circle, size: 50, color: Color(0xFF10B981)),
            SizedBox(height: 10),
            Text("Collect & Return?", style: TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
          ],
        ),
        content: Text("Collect fine of ₹$fineAmt and mark book as returned?", textAlign: TextAlign.center),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("CANCEL", style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
            onPressed: () => _handleReturn(tx['_id']),
            child: _isSubmitting 
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
              : const Text("YES, CONFIRM", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
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
    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);
    
    // Filter logic
    final filteredList = _transactions.where((tx) {
      final name = tx['studentId']?['name']?.toString().toLowerCase() ?? '';
      final enroll = tx['studentId']?['enrollmentNo']?.toString().toLowerCase() ?? '';
      final query = _searchQuery.toLowerCase();
      return name.contains(query) || enroll.contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: bgColor,
      body: Column(
        children: [
          // 🔥 PREMIUM GRADIENT HEADER 🔥
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(top: 60, bottom: 30, left: 24, right: 24),
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
                Positioned(right: -40, top: -10, child: Icon(Icons.warning_rounded, size: 200, color: Colors.white.withOpacity(0.1))),
                Column(
                  children: [
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
                              const Text("Defaulters", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                              Text("FINES & RECOVERY", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 25),
                    
                    // Search Bar Built into Header
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(25), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))]),
                      child: TextField(
                        onChanged: (val) => setState(() => _searchQuery = val),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                        decoration: InputDecoration(
                          hintText: "Search Name or ID...",
                          hintStyle: TextStyle(color: Colors.grey.shade400),
                          prefixIcon: const Icon(Icons.search, color: Color(0xFF42A5F5)),
                          border: InputBorder.none,
                        ),
                      ),
                    )
                  ],
                ),
              ],
            ),
          ),

          // --- MAIN CONTENT AREA ---
          Expanded(
            child: _loading 
              ? const CustomLoader() 
              : filteredList.isEmpty 
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle_outline, size: 80, color: Colors.green.withOpacity(0.4)),
                          const SizedBox(height: 20),
                          const Text("ALL CLEAR!", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.green, letterSpacing: -0.5)),
                          
                          // 🔥 FIX: Added SizedBox for margin instead of marginTop
                          const SizedBox(height: 5), 
                          
                          const Text("No overdue books right now.", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                        ],
                      ).animate().fadeIn(),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchData,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(20),
                        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                        itemCount: filteredList.length,
                        itemBuilder: (context, index) {
                          final tx = filteredList[index];
                          final student = tx['studentId'] ?? {};
                          final book = tx['bookId'] ?? {};
                          final calc = _calculateDaysAndFine(tx['dueDate']);
                          final int days = calc['days']!;
                          final int fine = calc['fine']!;
                          
                          final avatarUrl = student['avatar'] != null ? AppConfig.getAbsoluteUrl(student['avatar']) : null;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: cardBg, 
                              borderRadius: BorderRadius.circular(25), 
                              border: Border.all(color: Colors.redAccent.withOpacity(0.2)), // Reddish border for defaulters
                              boxShadow: [BoxShadow(color: Colors.redAccent.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))]
                            ),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(radius: 26, backgroundColor: Colors.red.withOpacity(0.1), backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null, child: avatarUrl == null ? const Icon(Icons.person, color: Colors.redAccent) : null),
                                    const SizedBox(width: 15),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(student['name']?.toString().toUpperCase() ?? 'UNKNOWN', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: textColor)),
                                          Text("${student['enrollmentNo']} | Class: ${student['grade']}", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1)),
                                          const SizedBox(height: 5),
                                          Text("📖 ${book['title']}", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 15),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 12),
                                        decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(15), border: Border.all(color: Colors.red.withOpacity(0.2))),
                                        child: Column(
                                          children: [
                                            const Text("LATE BY", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.redAccent, letterSpacing: 1)),
                                            Text("$days DAYS", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.red)),
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 12),
                                        decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(15), border: Border.all(color: Colors.orange.withOpacity(0.2))),
                                        child: Column(
                                          children: [
                                            const Text("PENDING FINE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.orange, letterSpacing: 1)),
                                            Text("₹$fine", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.deepOrange)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 15),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF1E293B), // Dark premium button
                                      padding: const EdgeInsets.symmetric(vertical: 15),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                                    ),
                                    onPressed: () => _showConfirmDialog(tx, fine),
                                    child: const Text("CLEAR FINE & RETURN", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
                                  ),
                                )
                              ],
                            ),
                          ).animate().fadeIn(delay: Duration(milliseconds: 50 * index)).slideY(begin: 0.1);
                        },
                      ),
                    ),
          ),
        ],
      ),
    );
  }
}
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart';

class StudentLibraryScreen extends ConsumerStatefulWidget {
  const StudentLibraryScreen({super.key});

  @override
  ConsumerState<StudentLibraryScreen> createState() => _StudentLibraryScreenState();
}

class _StudentLibraryScreenState extends ConsumerState<StudentLibraryScreen> {
  bool _loading = true;
  String _currentView = 'menu'; // 'menu', 'active', 'overdue', 'history'
  
  List<dynamic> activeLoans = [];
  List<dynamic> overdueLoans = [];
  List<dynamic> historyLoans = [];

  @override
  void initState() {
    super.initState();
    _fetchLibraryData();
  }

  Future<void> _fetchLibraryData() async {
    try {
      setState(() => _loading = true);
      final response = await ApiClient.dio.get('/library/my-books');
      
      setState(() {
        activeLoans = response.data['active'] ?? [];
        overdueLoans = response.data['overdue'] ?? [];
        historyLoans = response.data['history'] ?? [];
        _loading = false;
      });
    } catch (e) {
      _showToast("Failed to sync library portal.", isError: true);
      setState(() => _loading = false);
    }
  }

  Future<void> _handleRenew(String transactionId, String bookTitle, String dueDate) async {
    // Exact Midnight check logic ported from React
    DateTime today = DateTime.now();
    DateTime due = DateTime.parse(dueDate);
    DateTime todayMidnight = DateTime(today.year, today.month, today.day);
    DateTime dueMidnight = DateTime(due.year, due.month, due.day);

    if (todayMidnight.isAfter(dueMidnight) || todayMidnight.isAtSameMomentAs(dueMidnight)) {
      _showBlockedModal();
      return;
    }

    _showConfirmRenewModal(transactionId, bookTitle);
  }

  void _showConfirmRenewModal(String transactionId, String bookTitle) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        title: const Column(
          children: [
            Icon(Icons.autorenew, size: 50, color: Color(0xFF42A5F5)),
            SizedBox(height: 10),
            Text("Renew Book?", style: TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
          ],
        ),
        content: Text("Extend the due date for '$bookTitle' by 15 more days?", textAlign: TextAlign.center),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel", style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF42A5F5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                setState(() => _loading = true);
                final res = await ApiClient.dio.put('/library/renew/$transactionId');
                _showToast(res.data['message'] ?? "Book renewed!");
                _fetchLibraryData();
              } catch (e) {
                _showToast("Failed to renew or max limit reached.", isError: true);
                setState(() => _loading = false);
              }
            },
            child: const Text("Confirm", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showBlockedModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        title: const Column(
          children: [
            Icon(Icons.cancel, size: 50, color: Colors.redAccent),
            SizedBox(height: 10),
            Text("Renewal Blocked!", style: TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
          ],
        ),
        content: const Text("Today is your due date (or passed). You must renew at least 1 day before. Please return the book today.", textAlign: TextAlign.center),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Understood", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
        backgroundColor: isError ? Colors.redAccent : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  void _handleBack() {
    if (_currentView == 'menu') {
      if (context.canPop()) context.pop();
      else context.go('/');
    } else {
      setState(() => _currentView = 'menu');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const CustomLoader();

    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);
    final textMuted = isDarkMode ? Colors.white60 : Colors.grey.shade500;

    // Dynamic Header Color based on view
    Color headerColor = const Color(0xFF42A5F5); // Light Blue (Active/Menu)
    if (_currentView == 'overdue') headerColor = const Color(0xFFF43F5E); // Rose
    if (_currentView == 'history') headerColor = const Color(0xFF10B981); // Emerald

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack();
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: Column(
          children: [
            // --- HEADER ---
            AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              width: double.infinity,
              padding: const EdgeInsets.only(top: 60, bottom: 40),
              decoration: BoxDecoration(
                color: headerColor,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(50)),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const SizedBox(width: 20),
                      GestureDetector(
                        onTap: _handleBack,
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(15)),
                          child: const Icon(Icons.arrow_back, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _currentView == 'menu' ? 'MY LIBRARY' : _currentView == 'active' ? 'ACTIVE LOANS' : _currentView == 'overdue' ? 'DEFAULTERS' : 'PAST HISTORY',
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: 1),
                  ),
                  Text(
                    _currentView == 'menu' ? 'DIGITAL READING PORTAL' : 'VIEWING DETAILS',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white.withOpacity(0.8), letterSpacing: 2),
                  ),
                ],
              ),
            ),

            // --- CONTENT AREA ---
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                physics: const BouncingScrollPhysics(),
                child: _currentView == 'menu' 
                  ? _buildMenu(cardColor, textColor, textMuted, isDarkMode) 
                  : _buildList(cardColor, textColor, textMuted, isDarkMode),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 🔥 MAIN MENU CARDS (3 Premium Cards) 🔥
  Widget _buildMenu(Color cardBg, Color textPri, Color textMut, bool isDark) {
    return Column(
      children: [
        _menuCard(
          title: "Active Loans", subtitle: "Currently issued books", count: activeLoans.length,
          icon: Icons.menu_book, color: const Color(0xFF42A5F5), bg: cardBg, textPri: textPri, textMut: textMut, isDark: isDark,
          onTap: () => setState(() => _currentView = 'active'),
        ).animate().slideY(begin: 0.2, duration: 400.ms).fadeIn(),

        const SizedBox(height: 20),

        _menuCard(
          title: "Defaulters", subtitle: "Overdue & Fines", count: overdueLoans.length,
          icon: Icons.error_outline, color: const Color(0xFFF43F5E), bg: cardBg, textPri: textPri, textMut: textMut, isDark: isDark,
          pulse: overdueLoans.isNotEmpty,
          onTap: () => setState(() => _currentView = 'overdue'),
        ).animate().slideY(begin: 0.2, duration: 400.ms, delay: 100.ms).fadeIn(),

        const SizedBox(height: 20),

        _menuCard(
          title: "Past History", subtitle: "Returned books", count: historyLoans.length,
          icon: Icons.history, color: const Color(0xFF10B981), bg: cardBg, textPri: textPri, textMut: textMut, isDark: isDark,
          onTap: () => setState(() => _currentView = 'history'),
        ).animate().slideY(begin: 0.2, duration: 400.ms, delay: 200.ms).fadeIn(),
      ],
    );
  }

  Widget _menuCard({required String title, required String subtitle, required int count, required IconData icon, required Color color, required Color bg, required Color textPri, required Color textMut, required bool isDark, required VoidCallback onTap, bool pulse = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(35),
          border: Border.all(color: color.withOpacity(0.3), width: 2),
          boxShadow: [BoxShadow(color: color.withOpacity(isDark ? 0.1 : 0.05), blurRadius: 20, offset: const Offset(0, 10))],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, size: 40, color: color),
            ).animate(onPlay: (controller) => pulse ? controller.repeat(reverse: true) : null).scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1), duration: 1.seconds),
            const SizedBox(height: 15),
            Text(title.toUpperCase(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textPri, letterSpacing: -0.5)),
            Text(subtitle.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textMut, letterSpacing: 1)),
            const SizedBox(height: 15),
            Container(
              width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
              child: Text("$count RECORDS", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color, letterSpacing: 2)),
            )
          ],
        ),
      ),
    );
  }

  // 🔥 LIST VIEW HANDLER (Active / Overdue / History) 🔥
  Widget _buildList(Color cardBg, Color textPri, Color textMut, bool isDark) {
    List<dynamic> targetList = _currentView == 'active' ? activeLoans : _currentView == 'overdue' ? overdueLoans : historyLoans;

    if (targetList.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 50),
            Icon(_currentView == 'active' ? Icons.menu_book : _currentView == 'overdue' ? Icons.check_circle_outline : Icons.history, size: 80, color: Colors.grey.shade300),
            const SizedBox(height: 20),
            Text("NO RECORDS FOUND", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textMut, letterSpacing: 1)),
          ],
        ),
      ).animate().fadeIn();
    }

    return Column(
      children: targetList.asMap().entries.map((entry) {
        int idx = entry.key;
        var tx = entry.value;
        var book = tx['bookId'] ?? {};
        
        return Container(
          margin: const EdgeInsets.only(bottom: 20),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: cardBg, borderRadius: BorderRadius.circular(30),
            border: Border.all(color: _currentView == 'overdue' ? Colors.redAccent.withOpacity(0.3) : isDark ? Colors.white10 : Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: _currentView == 'overdue' ? Colors.red.withOpacity(0.1) : Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(15)),
                    child: Icon(Icons.book, color: _currentView == 'overdue' ? Colors.redAccent : const Color(0xFF42A5F5)),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(book['title']?.toString().toUpperCase() ?? 'UNKNOWN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPri)),
                        Text("by ${book['author']}", style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: textMut)),
                        const SizedBox(height: 5),
                        Text("ISBN: ${book['isbn']}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textMut)),
                      ],
                    ),
                  )
                ],
              ),
              const SizedBox(height: 20),
              
              if (_currentView == 'active') ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("RETURN BY", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textMut, letterSpacing: 1.5)),
                        Text(DateFormat('dd MMM yyyy').format(DateTime.parse(tx['dueDate'])), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5))),
                      ],
                    ),
                    (tx['renewalCount'] ?? 0) >= 3 
                    ? Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: const Text("MAX LIMIT", style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold)))
                    : ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1E293B), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
                        onPressed: () => _handleRenew(tx['_id'], book['title'], tx['dueDate']),
                        icon: const Icon(Icons.autorenew, size: 16, color: Colors.white),
                        label: const Text("Renew", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      )
                  ],
                )
              ],

              if (_currentView == 'overdue') ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("LATE BY", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textMut, letterSpacing: 1.5)),
                        Text("${tx['overdueDays']} DAYS", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.redAccent)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text("PENDING FINE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textMut, letterSpacing: 1.5)),
                        Text("₹${tx['pendingFine']}", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.amber)),
                      ],
                    ),
                  ],
                )
              ],

              if (_currentView == 'history') ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("RETURNED ON", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textMut, letterSpacing: 1.5)),
                        Text(tx['returnDate'] != null ? DateFormat('dd MMM yyyy').format(DateTime.parse(tx['returnDate'])) : 'N/A', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF10B981))),
                      ],
                    ),
                    const Icon(Icons.check_circle, color: Color(0xFF10B981)),
                  ],
                )
              ]

            ],
          ),
        ).animate().fadeIn(delay: Duration(milliseconds: 100 * idx)).slideY(begin: 0.1);
      }).toList(),
    );
  }
}
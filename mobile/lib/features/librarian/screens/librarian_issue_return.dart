import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../core/constants/app_config.dart';

class LibrarianIssueReturn extends ConsumerStatefulWidget {
  const LibrarianIssueReturn({super.key});

  @override
  ConsumerState<LibrarianIssueReturn> createState() => _LibrarianIssueReturnState();
}

class _LibrarianIssueReturnState extends ConsumerState<LibrarianIssueReturn> with SingleTickerProviderStateMixin {
  bool _loading = true;
  bool _isSubmitting = false;
  late TabController _tabController;

  // Search & Selections
  String _studentQuery = '';
  String _bookQuery = '';
  List<dynamic> _studentResults = [];
  List<dynamic> _bookResults = [];
  Map<String, dynamic>? _selectedStudent;
  Map<String, dynamic>? _selectedBook;

  DateTime _dueDate = DateTime.now().add(const Duration(days: 7));
  List<dynamic> _transactions = [];

  Timer? _studentDebounce;
  Timer? _bookDebounce;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initializeDesk();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _studentDebounce?.cancel();
    _bookDebounce?.cancel();
    super.dispose();
  }

  Future<void> _initializeDesk() async {
    try {
      final settingsRes = await ApiClient.dio.get('/library/settings');
      int defaultDays = settingsRes.data['defaultDueDays'] ?? 7;
      setState(() => _dueDate = DateTime.now().add(Duration(days: defaultDays)));
      await _fetchActiveTransactions();
    } catch (e) {
      _fetchActiveTransactions(); 
    }
  }

  Future<void> _fetchActiveTransactions() async {
    try {
      final res = await ApiClient.dio.get('/library/transactions/active');
      if (mounted) {
        setState(() {
          _transactions = res.data;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  // --- SEARCH LOGIC ---
  void _onStudentSearch(String val) {
    setState(() => _studentQuery = val);
    if (_studentDebounce?.isActive ?? false) _studentDebounce!.cancel();
    if (val.length < 2) {
      setState(() => _studentResults = []);
      return;
    }
    _studentDebounce = Timer(const Duration(milliseconds: 500), () async {
      try {
        final res = await ApiClient.dio.get('/library/search-students?q=$val');
        if (mounted) setState(() => _studentResults = res.data);
      } catch (e) {}
    });
  }

  void _onBookSearch(String val) {
    setState(() => _bookQuery = val);
    if (_bookDebounce?.isActive ?? false) _bookDebounce!.cancel();
    if (val.length < 2) {
      setState(() => _bookResults = []);
      return;
    }
    _bookDebounce = Timer(const Duration(milliseconds: 500), () async {
      try {
        final res = await ApiClient.dio.get('/library/search-books?q=$val');
        if (mounted) setState(() => _bookResults = res.data);
      } catch (e) {}
    });
  }

  // --- ACTIONS ---
  Future<void> _executeIssueBook() async {
    setState(() => _isSubmitting = true);
    try {
      await ApiClient.dio.post('/library/issue', data: {
        'studentId': _selectedStudent!['_id'],
        'bookId': _selectedBook!['_id'],
        'dueDate': _dueDate.toIso8601String().split('T')[0],
      });
      _showToast('Book issued successfully! 📖');
      
      setState(() {
        _selectedStudent = null;
        _selectedBook = null;
        _studentQuery = '';
        _bookQuery = '';
        _studentResults = [];
        _bookResults = [];
      });
      await _fetchActiveTransactions();
      _tabController.animateTo(1); 
    } catch (e) {
      _showToast(e.toString(), isError: true);
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _executeReturnBook(String transactionId) async {
    setState(() => _isSubmitting = true);
    try {
      await ApiClient.dio.put('/library/return/$transactionId');
      _showToast('Book returned to inventory! ✅');
      await _fetchActiveTransactions();
    } catch (e) {
      _showToast('Return failed.', isError: true);
    } finally {
      if (context.mounted) Navigator.pop(context); 
      setState(() => _isSubmitting = false);
    }
  }

  void _showReturnDialog(Map<String, dynamic> tx) {
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
            Text("Confirm Return?", style: TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
          ],
        ),
        content: Text("Mark '${tx['bookId']['title']}' as returned by ${tx['studentId']['name']}?", textAlign: TextAlign.center),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("CANCEL", style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
            onPressed: () => _executeReturnBook(tx['_id']),
            child: _isSubmitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text("YES, RETURN", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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

  bool _isOverdue(String date) {
    DateTime today = DateTime.now();
    DateTime due = DateTime.parse(date);
    return DateTime(today.year, today.month, today.day).isAfter(DateTime(due.year, due.month, due.day));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const CustomLoader();

    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);
    final borderColor = isDarkMode ? Colors.white10 : Colors.grey.shade200;

    return Scaffold(
      backgroundColor: bgColor,
      body: Column(
        children: [
          // 🔥 PREMIUM GRADIENT HEADER (Fixed!) 🔥
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(top: 60, bottom: 20, left: 24, right: 24),
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
                  child: Icon(Icons.sync_alt_rounded, size: 200, color: Colors.white.withOpacity(0.1)),
                ),
                Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        GestureDetector(
                          onTap: () {
                            if (context.canPop()) context.pop();
                            else context.go('/librarian/dashboard');
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
                              const Text("Circulation", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                              Text("ISSUE & RETURN DESK", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Tab Bar Inside the Header for premium look
                    TabBar(
                      controller: _tabController,
                      indicatorColor: Colors.white,
                      indicatorWeight: 4,
                      labelColor: Colors.white,
                      unselectedLabelColor: Colors.white60,
                      labelStyle: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
                      dividerColor: Colors.transparent,
                      tabs: const [Tab(text: "ISSUE BOOK"), Tab(text: "ACTIVE ISSUES")],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // --- TAB CONTENT ---
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildIssueTab(cardColor, textColor, borderColor, isDarkMode),
                _buildActiveIssuesTab(cardColor, textColor, borderColor),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 1: ISSUE BOOK
  // ==========================================
  Widget _buildIssueTab(Color cardBg, Color textColor, Color borderColor, bool isDarkMode) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. STUDENT SEARCH
          const Text("SELECT STUDENT", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
          const SizedBox(height: 8),
          _selectedStudent != null ? _buildSelectedCard(
            title: _selectedStudent!['name'], subtitle: "${_selectedStudent!['enrollmentNo']} | ${_selectedStudent!['grade']}", 
            avatar: _selectedStudent!['avatar'], onRemove: () => setState(() => _selectedStudent = null), cardBg: cardBg, borderColor: borderColor,
          ) : _buildSearchField("Search by Name or ID...", _studentQuery, _onStudentSearch, Icons.person, cardBg, borderColor),
          
          if (_selectedStudent == null && _studentResults.isNotEmpty) _buildStudentResults(cardBg, borderColor),

          const SizedBox(height: 25),

          // 2. BOOK SEARCH
          const Text("SELECT BOOK", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
          const SizedBox(height: 8),
          _selectedBook != null ? _buildSelectedCard(
            title: _selectedBook!['title'], subtitle: "ISBN: ${_selectedBook!['isbn']} | ${_selectedBook!['availableCopies']} Left", 
            icon: Icons.book, onRemove: () => setState(() => _selectedBook = null), cardBg: cardBg, borderColor: borderColor, isBook: true
          ) : _buildSearchField("Search Title or ISBN...", _bookQuery, _onBookSearch, Icons.search, cardBg, borderColor),

          if (_selectedBook == null && _bookResults.isNotEmpty) _buildBookResults(cardBg, borderColor),

          const SizedBox(height: 25),

          // 3. DATE PICKER
          const Text("EXPECTED RETURN DATE", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () async {
              DateTime? picked = await showDatePicker(
                context: context, initialDate: _dueDate, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)),
                builder: (context, child) => Theme(data: ThemeData.light().copyWith(colorScheme: const ColorScheme.light(primary: Color(0xFF42A5F5))), child: child!),
              );
              if (picked != null) setState(() => _dueDate = picked);
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: borderColor)),
              child: Row(
                children: [
                  const Icon(Icons.calendar_month, color: Color(0xFF42A5F5)),
                  const SizedBox(width: 15),
                  Text(DateFormat('dd MMM yyyy').format(_dueDate), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColor)),
                ],
              ),
            ),
          ),

          const SizedBox(height: 40),

          // SUBMIT BUTTON
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF42A5F5),
                disabledBackgroundColor: Colors.grey.shade400,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 5,
              ),
              onPressed: (_selectedStudent == null || _selectedBook == null || _isSubmitting) ? null : _executeIssueBook,
              icon: _isSubmitting ? const SizedBox.shrink() : const Icon(Icons.check_circle, color: Colors.white),
              label: _isSubmitting 
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text("REVIEW & ISSUE BOOK", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
            ),
          )
        ],
      ),
    );
  }

  // ==========================================
  // TAB 2: ACTIVE ISSUES
  // ==========================================
  Widget _buildActiveIssuesTab(Color cardBg, Color textColor, Color borderColor) {
    if (_transactions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.library_books, size: 80, color: Colors.grey.withOpacity(0.3)),
            const SizedBox(height: 20),
            const Text("NO ACTIVE ISSUES", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
          ],
        ).animate().fadeIn(),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      physics: const BouncingScrollPhysics(),
      itemCount: _transactions.length,
      itemBuilder: (context, index) {
        final tx = _transactions[index];
        final isOver = _isOverdue(tx['dueDate']);
        final student = tx['studentId'] ?? {};
        final book = tx['bookId'] ?? {};

        return Container(
          margin: const EdgeInsets.only(bottom: 15),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isOver ? Colors.red.withOpacity(0.05) : cardBg,
            borderRadius: BorderRadius.circular(25),
            border: Border.all(color: isOver ? Colors.redAccent.withOpacity(0.3) : borderColor),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  CircleAvatar(backgroundImage: student['avatar'] != null ? NetworkImage(AppConfig.getAbsoluteUrl(student['avatar'])) : null, radius: 24),
                  const SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(student['name']?.toString().toUpperCase() ?? 'UNKNOWN', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColor)),
                        Text(book['title']?.toString() ?? 'Unknown Book', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, fontStyle: FontStyle.italic)),
                      ],
                    ),
                  ),
                  if (isOver) Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: Colors.red.shade100, borderRadius: BorderRadius.circular(10)), child: const Text("OVERDUE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.red)))
                ],
              ),
              const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(height: 1)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("DUE DATE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                      Text(DateFormat('dd MMM yyyy').format(DateTime.parse(tx['dueDate'])), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: isOver ? Colors.redAccent : const Color(0xFF42A5F5))),
                    ],
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1E293B), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    onPressed: () => _showReturnDialog(tx),
                    child: const Text("RETURN", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
                  )
                ],
              )
            ],
          ),
        ).animate().fadeIn(delay: Duration(milliseconds: 50 * index)).slideY(begin: 0.1);
      },
    );
  }

  // --- HELPER WIDGETS ---
  Widget _buildSearchField(String hint, String val, Function(String) onChanged, IconData icon, Color bg, Color border) {
    return TextField(
      onChanged: onChanged,
      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: Colors.grey),
        filled: true, fillColor: bg,
        contentPadding: const EdgeInsets.all(16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: Color(0xFF42A5F5), width: 2)),
      ),
    );
  }

  Widget _buildSelectedCard({required String title, required String subtitle, String? avatar, IconData? icon, required VoidCallback onRemove, required Color cardBg, required Color borderColor, bool isBook = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: isBook ? Colors.blue.withOpacity(0.05) : Colors.green.withOpacity(0.05), borderRadius: BorderRadius.circular(20), border: Border.all(color: isBook ? Colors.blue.shade100 : Colors.green.shade100)),
      child: Row(
        children: [
          if (avatar != null) CircleAvatar(backgroundImage: NetworkImage(AppConfig.getAbsoluteUrl(avatar)))
          else if (icon != null) Container(padding: const EdgeInsets.all(10), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Icon(icon, color: const Color(0xFF42A5F5))),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title.toUpperCase(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                Text(subtitle, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
              ],
            ),
          ),
          IconButton(icon: const Icon(Icons.close, color: Colors.redAccent), onPressed: onRemove),
        ],
      ),
    ).animate().scale(begin: const Offset(0.9, 0.9)).fadeIn();
  }

  Widget _buildStudentResults(Color bg, Color border) {
    return Container(
      margin: const EdgeInsets.only(top: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: border)),
      child: ListView.separated(
        shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        itemCount: _studentResults.length > 3 ? 3 : _studentResults.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: border),
        itemBuilder: (ctx, i) {
          final stu = _studentResults[i];
          return ListTile(
            leading: CircleAvatar(backgroundImage: NetworkImage(AppConfig.getAbsoluteUrl(stu['avatar']))),
            title: Text(stu['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
            subtitle: Text("${stu['enrollmentNo']} | ${stu['grade']}", style: const TextStyle(fontSize: 10, color: Colors.grey)),
            onTap: () {
              setState(() { _selectedStudent = stu; _studentResults = []; _studentQuery = ''; });
              FocusScope.of(context).unfocus();
            },
          );
        },
      ),
    ).animate().fadeIn();
  }

  Widget _buildBookResults(Color bg, Color border) {
    return Container(
      margin: const EdgeInsets.only(top: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: border)),
      child: ListView.separated(
        shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        itemCount: _bookResults.length > 3 ? 3 : _bookResults.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: border),
        itemBuilder: (ctx, i) {
          final book = _bookResults[i];
          return ListTile(
            title: Text(book['title'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
            subtitle: Text("ISBN: ${book['isbn']}", style: const TextStyle(fontSize: 10, color: Colors.grey)),
            trailing: Text("${book['availableCopies']} Left", style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.green, fontSize: 10)),
            onTap: () {
              setState(() { _selectedBook = book; _bookResults = []; _bookQuery = ''; });
              FocusScope.of(context).unfocus();
            },
          );
        },
      ),
    ).animate().fadeIn();
  }
}
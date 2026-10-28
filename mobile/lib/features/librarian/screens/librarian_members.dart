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

class LibrarianMembers extends ConsumerStatefulWidget {
  const LibrarianMembers({super.key});

  @override
  ConsumerState<LibrarianMembers> createState() => _LibrarianMembersState();
}

class _LibrarianMembersState extends ConsumerState<LibrarianMembers> {
  String _searchQuery = '';
  List<dynamic> _searchResults = [];
  Map<String, dynamic>? _selectedStudent;
  Map<String, dynamic>? _cardData;

  bool _isLoadingSearch = false;
  bool _isLoadingCard = false;
  Timer? _debounce;

  // --- SEARCH LOGIC ---
  void _onSearchChanged(String val) {
    setState(() {
      _searchQuery = val;
      _selectedStudent = null; // Hide card if typing new search
      _cardData = null;
    });

    if (_debounce?.isActive ?? false) _debounce!.cancel();
    if (val.length < 2) {
      setState(() => _searchResults = []);
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 500), () async {
      setState(() => _isLoadingSearch = true);
      try {
        final res = await ApiClient.dio.get('/library/search-students?q=$val');
        if (mounted) setState(() => _searchResults = res.data);
      } catch (e) {
        debugPrint("Search failed: $e");
      } finally {
        if (mounted) setState(() => _isLoadingSearch = false);
      }
    });
  }

  // --- FETCH DIGITAL CARD ---
  Future<void> _fetchMemberCard(String studentId) async {
    FocusScope.of(context).unfocus(); // Close keyboard
    setState(() {
      _isLoadingCard = true;
      _searchResults = [];
      _searchQuery = '';
    });

    try {
      final res = await ApiClient.dio.get('/library/member/$studentId');
      if (mounted) {
        setState(() {
          _cardData = res.data;
          _selectedStudent = res.data['student'];
        });
      }
    } catch (e) {
      _showToast("Failed to fetch member card", isError: true);
    } finally {
      if (mounted) setState(() => _isLoadingCard = false);
    }
  }

  bool _isOverdue(Map<String, dynamic> tx) {
    if (tx['status'] == 'Returned') return false;
    if (tx['status'] == 'Overdue') return true;

    DateTime today = DateTime.now();
    DateTime due = DateTime.parse(tx['dueDate']);
    return DateTime(today.year, today.month, today.day)
        .isAfter(DateTime(due.year, due.month, due.day));
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message,
          style: const TextStyle(
              fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
      backgroundColor: isError ? Colors.redAccent : const Color(0xFF10B981),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ));
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor =
        isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);
    final borderColor = isDarkMode ? Colors.white10 : Colors.grey.shade200;

    return Scaffold(
      backgroundColor: bgColor,
      body: Column(
        children: [
          // 🔥 PREMIUM GRADIENT HEADER 🔥
          Container(
            width: double.infinity,
            padding:
                const EdgeInsets.only(top: 60, bottom: 30, left: 24, right: 24),
            decoration: BoxDecoration(
              color: const Color(0xFF42A5F5),
              gradient: LinearGradient(
                colors: isDarkMode
                    ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)]
                    : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius:
                  const BorderRadius.vertical(bottom: Radius.circular(55)),
              boxShadow: const [
                BoxShadow(
                    color: Colors.black12,
                    blurRadius: 15,
                    offset: Offset(0, 10))
              ],
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                    right: -40,
                    top: -10,
                    child: Icon(Icons.badge_rounded,
                        size: 200, color: Colors.white.withOpacity(0.1))),
                Column(
                  children: [
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () {
                            if (context.canPop())
                              context.pop();
                            else
                              context.go('/librarian/dashboard');
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.3))),
                            child: const Icon(Icons.arrow_back,
                                color: Colors.white, size: 22),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("Members",
                                  style: TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      fontStyle: FontStyle.italic,
                                      letterSpacing: -1)),
                              Text("DIGITAL IDENTITY CARDS",
                                  style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white.withOpacity(0.9),
                                      letterSpacing: 2)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 25),

                    // Search Bar Built into Header
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 5),
                      decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(25),
                          boxShadow: const [
                            BoxShadow(
                                color: Colors.black12,
                                blurRadius: 10,
                                offset: Offset(0, 5))
                          ]),
                      child: TextField(
                        controller: TextEditingController.fromValue(
                            TextEditingValue(
                                text: _searchQuery,
                                selection: TextSelection.collapsed(
                                    offset: _searchQuery.length))),
                        onChanged: _onSearchChanged,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: Colors.black87),
                        decoration: InputDecoration(
                          hintText: "Enter Name or Admission No...",
                          hintStyle: TextStyle(color: Colors.grey.shade400),
                          prefixIcon: _isLoadingSearch
                              ? const Padding(
                                  padding: EdgeInsets.all(12),
                                  child: SizedBox(
                                      width: 15,
                                      height: 15,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Color(0xFF42A5F5))))
                              : const Icon(Icons.search,
                                  color: Color(0xFF42A5F5)),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close,
                                      color: Colors.grey, size: 18),
                                  onPressed: () => _onSearchChanged(''))
                              : null,
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
            child: _isLoadingCard
                ? const CustomLoader()
                : _selectedStudent == null
                    ? _buildSearchResultsOrPlaceholder(
                        cardBg, borderColor, textColor)
                    : _buildDigitalCard(
                        cardBg, borderColor, textColor, isDarkMode),
          ),
        ],
      ),
    );
  }

  // --- SEARCH RESULTS LIST ---
  Widget _buildSearchResultsOrPlaceholder(
      Color cardBg, Color borderColor, Color textColor) {
    if (_searchQuery.isEmpty || _searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.how_to_reg_rounded,
                size: 80, color: Colors.grey.withOpacity(0.2)),
            const SizedBox(height: 20),
            const Text("SEARCH TO VIEW CARD",
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: Colors.grey,
                    letterSpacing: 1.5)),
            if (_searchQuery.isNotEmpty &&
                _searchResults.isEmpty &&
                !_isLoadingSearch)
              const Padding(
                padding: EdgeInsets.only(top: 10),
                child: Text("No members found.",
                    style: TextStyle(
                        fontSize: 11,
                        color: Colors.redAccent,
                        fontWeight: FontWeight.bold)),
              ),
          ],
        ).animate().fadeIn(),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      physics: const BouncingScrollPhysics(),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final stu = _searchResults[index];
        final avatarUrl = stu['avatar'] != null
            ? AppConfig.getAbsoluteUrl(stu['avatar'])
            : null;
        return GestureDetector(
          onTap: () => _fetchMemberCard(stu['_id']),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: borderColor)),
            child: Row(
              children: [
                CircleAvatar(
                    radius: 24,
                    backgroundColor: const Color(0xFF42A5F5).withOpacity(0.2),
                    backgroundImage:
                        avatarUrl != null ? NetworkImage(avatarUrl) : null,
                    child: avatarUrl == null
                        ? const Icon(Icons.person, color: Color(0xFF42A5F5))
                        : null),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(stu['name'].toString().toUpperCase(),
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: textColor)),
                      Text("${stu['enrollmentNo']} | Class: ${stu['grade']}",
                          style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey,
                              letterSpacing: 1)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: Colors.grey),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: Duration(milliseconds: 50 * index))
              .slideX(begin: 0.1),
        );
      },
    );
  }

  // --- DIGITAL ID CARD & HISTORY ---
  Widget _buildDigitalCard(
      Color cardBg, Color borderColor, Color textColor, bool isDarkMode) {
    if (_cardData == null) return const SizedBox.shrink();

    final history = _cardData!['history'] as List<dynamic>;
    final totalBorrowed = history.length;
    final totalReturned =
        history.where((h) => h['status'] == 'Returned').length;
    final totalDefaulters = history.where((h) => _isOverdue(h)).length;
    final avatarUrl = _selectedStudent!['avatar'] != null
        ? AppConfig.getAbsoluteUrl(_selectedStudent!['avatar'])
        : null;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. IDENTITY CARD
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDarkMode
                    ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)]
                    : [const Color(0xFF42A5F5), const Color(0xFF64B5F6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(35),
              boxShadow: [
                BoxShadow(
                    color: const Color(0xFF42A5F5).withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10))
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 4),
                      boxShadow: const [
                        BoxShadow(color: Colors.black26, blurRadius: 10)
                      ],
                      image: avatarUrl != null
                          ? DecorationImage(
                              image: NetworkImage(avatarUrl), fit: BoxFit.cover)
                          : null),
                  child: avatarUrl == null
                      ? const Icon(Icons.person, size: 40, color: Colors.white)
                      : null,
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_selectedStudent!['name'].toString().toUpperCase(),
                          style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              height: 1.1)),
                      const SizedBox(height: 5),
                      Text(
                          "${_selectedStudent!['enrollmentNo']} | Class: ${_selectedStudent!['grade']}",
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              color: Colors.white.withOpacity(0.9),
                              letterSpacing: 1)),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10)),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.verified, color: Colors.white, size: 14),
                            SizedBox(width: 5),
                            Text("VERIFIED MEMBER",
                                style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 1)),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ],
            ),
          ).animate().scale(begin: const Offset(0.9, 0.9)).fadeIn(),

          const SizedBox(height: 20),

          // 2. STATS GRID
          Row(
            children: [
              Expanded(
                  child: _buildStatCard(
                      "Total",
                      totalBorrowed.toString(),
                      Icons.menu_book,
                      const Color(0xFF42A5F5),
                      cardBg,
                      borderColor,
                      textColor)),
              const SizedBox(width: 12),
              Expanded(
                  child: _buildStatCard(
                      "Returned",
                      totalReturned.toString(),
                      Icons.bookmark_added,
                      const Color(0xFF10B981),
                      cardBg,
                      borderColor,
                      textColor)),
              const SizedBox(width: 12),
              Expanded(
                  child: _buildStatCard(
                      "Defaulter",
                      totalDefaulters.toString(),
                      Icons.warning_rounded,
                      const Color(0xFFF43F5E),
                      cardBg,
                      borderColor,
                      textColor)),
            ],
          ).animate().slideY(begin: 0.1, delay: 100.ms).fadeIn(),

          const SizedBox(height: 30),
          const Text("TRANSACTION HISTORY",
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Colors.grey,
                  letterSpacing: 2,
                  fontStyle: FontStyle.italic)),
          const SizedBox(height: 15),

          // 3. HISTORY LIST
          if (history.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(color: borderColor)),
              child: const Text("No transaction history.",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontWeight: FontWeight.bold, color: Colors.grey)),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: history.length,
              itemBuilder: (context, index) {
                final tx = history[index];
                final isLiveOverdue = _isOverdue(tx);
                final status = tx['status'] == 'Returned'
                    ? 'Returned'
                    : isLiveOverdue
                        ? 'Overdue'
                        : 'Issued';

                Color statusColor;
                Color statusBg;
                if (status == 'Returned') {
                  statusColor = const Color(0xFF10B981);
                  statusBg = const Color(0xFF10B981).withOpacity(0.1);
                } else if (status == 'Overdue') {
                  statusColor = const Color(0xFFF43F5E);
                  statusBg = const Color(0xFFF43F5E).withOpacity(0.1);
                } else {
                  statusColor = const Color(0xFF42A5F5);
                  statusBg = const Color(0xFF42A5F5).withOpacity(0.1);
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: borderColor)),
                  child: Row(
                    children: [
                      Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                              color: statusBg,
                              borderRadius: BorderRadius.circular(15)),
                          child:
                              Icon(Icons.book, color: statusColor, size: 24)),
                      const SizedBox(width: 15),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                                tx['bookId']?['title']
                                        ?.toString()
                                        .toUpperCase() ??
                                    'UNKNOWN',
                                style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    color: textColor)),
                            const SizedBox(height: 4),
                            Text(
                                "Issued: ${DateFormat('dd MMM yy').format(DateTime.parse(tx['issueDate']))}" +
                                    (isLiveOverdue
                                        ? " | Due: ${DateFormat('dd MMM').format(DateTime.parse(tx['dueDate']))}"
                                        : ""),
                                style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey,
                                    letterSpacing: 0.5)),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                            color: statusBg,
                            borderRadius: BorderRadius.circular(10)),
                        child: Text(status.toUpperCase(),
                            style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                color: statusColor,
                                letterSpacing: 1)),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(delay: Duration(milliseconds: 50 * index))
                    .slideX(begin: -0.1);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon,
      Color iconColor, Color cardBg, Color borderColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(25),
          border: Border.all(color: borderColor),
          boxShadow: const [
            BoxShadow(
                color: Colors.black12, blurRadius: 5, offset: Offset(0, 2))
          ]),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 8),
          Text(label.toUpperCase(),
              style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  color: Colors.grey,
                  letterSpacing: 1)),
          Text(value,
              style: TextStyle(
                  fontSize: 20, fontWeight: FontWeight.w900, color: textColor)),
        ],
      ),
    );
  }
}

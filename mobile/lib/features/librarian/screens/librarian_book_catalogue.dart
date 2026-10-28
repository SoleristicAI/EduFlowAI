import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart';

class LibrarianBookCatalogue extends ConsumerStatefulWidget {
  const LibrarianBookCatalogue({super.key});

  @override
  ConsumerState<LibrarianBookCatalogue> createState() => _LibrarianBookCatalogueState();
}

class _LibrarianBookCatalogueState extends ConsumerState<LibrarianBookCatalogue> {
  bool _loading = true;
  bool _isSubmitting = false;
  List<dynamic> _books = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchBooks();
  }

  Future<void> _fetchBooks() async {
    try {
      final response = await ApiClient.dio.get('/library/books');
      if (mounted) {
        setState(() {
          _books = response.data;
          _loading = false;
        });
      }
    } catch (e) {
      _showToast("Failed to fetch library catalogue.", isError: true);
      if (mounted) setState(() => _loading = false);
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

  // --- DELETE LOGIC ---
  Future<void> _confirmDelete(String bookId, String title) async {
    final isDarkMode = ref.read(themeProvider) == ThemeMode.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDarkMode ? const Color(0xFF1E293B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
        title: const Column(
          children: [
            Icon(Icons.warning_amber_rounded, size: 50, color: Color(0xFFF43F5E)),
            SizedBox(height: 10),
            Text("Delete Book?", style: TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
          ],
        ),
        content: Text("Are you sure you want to remove '$title' from the catalogue?", textAlign: TextAlign.center),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("CANCEL", style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF43F5E), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
            onPressed: () async {
              Navigator.pop(ctx);
              setState(() => _loading = true);
              try {
                await ApiClient.dio.delete('/library/books/$bookId');
                _showToast("Book removed successfully! 🗑️");
                _fetchBooks();
              } catch (e) {
                _showToast("Failed to delete book.", isError: true);
                setState(() => _loading = false);
              }
            },
            child: const Text("YES, DELETE", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // --- ADD / EDIT BOTTOM SHEET ---
  void _showBookFormModal({Map<String, dynamic>? book}) {
    final isEditing = book != null;
    final isDarkMode = ref.read(themeProvider) == ThemeMode.dark;
    final Color cardBg = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);

    final titleCtrl = TextEditingController(text: book?['title'] ?? '');
    final authorCtrl = TextEditingController(text: book?['author'] ?? '');
    final isbnCtrl = TextEditingController(text: book?['isbn'] ?? '');
    final categoryCtrl = TextEditingController(text: book?['category'] ?? '');
    final publisherCtrl = TextEditingController(text: book?['publisher'] ?? '');
    final rackCtrl = TextEditingController(text: book?['rackNumber'] ?? '');
    final copiesCtrl = TextEditingController(text: book?['totalCopies']?.toString() ?? '1');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.85,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: cardBg, borderRadius: const BorderRadius.vertical(top: Radius.circular(40))),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: Container(width: 50, height: 5, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(10)))),
                const SizedBox(height: 20),
                Text(isEditing ? "UPDATE BOOK DETAILS" : "ADD NEW BOOK", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textColor, fontStyle: FontStyle.italic, letterSpacing: -1)),
                const Text("ENTER PRECISE BOOK INFORMATION.", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5)),
                const SizedBox(height: 25),
                
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      children: [
                        _buildInput(titleCtrl, "Book Title *", Icons.menu_book, isDarkMode),
                        _buildInput(authorCtrl, "Author Name *", Icons.person, isDarkMode),
                        Row(
                          children: [
                            Expanded(child: _buildInput(isbnCtrl, "ISBN *", Icons.qr_code, isDarkMode)),
                            const SizedBox(width: 15),
                            Expanded(child: _buildInput(categoryCtrl, "Category *", Icons.layers, isDarkMode)),
                          ],
                        ),
                        _buildInput(publisherCtrl, "Publisher", Icons.business, isDarkMode),
                        Row(
                          children: [
                            Expanded(child: _buildInput(copiesCtrl, "Total Copies *", Icons.numbers, isDarkMode, isNumber: true)),
                            const SizedBox(width: 15),
                            Expanded(child: _buildInput(rackCtrl, "Rack No.", Icons.shelves, isDarkMode)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF42A5F5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                    onPressed: _isSubmitting ? null : () async {
                      if (titleCtrl.text.isEmpty || authorCtrl.text.isEmpty || isbnCtrl.text.isEmpty || categoryCtrl.text.isEmpty || copiesCtrl.text.isEmpty) {
                        _showToast("Please fill all required (*) fields.", isError: true);
                        return;
                      }

                      setModalState(() => _isSubmitting = true);
                      final payload = {
                        'title': titleCtrl.text, 'author': authorCtrl.text, 'isbn': isbnCtrl.text,
                        'category': categoryCtrl.text, 'publisher': publisherCtrl.text,
                        'totalCopies': int.tryParse(copiesCtrl.text) ?? 1, 'rackNumber': rackCtrl.text,
                      };

                      try {
                        if (isEditing) {
                          // ignore: unnecessary_non_null_assertion
                          await ApiClient.dio.put('/library/books/${book!['_id']}', data: payload);
                          _showToast("Book updated successfully! ✅");
                        } else {
                          await ApiClient.dio.post('/library/books', data: payload);
                          _showToast("New book added! 📚");
                        }
                        Navigator.pop(ctx);
                        setState(() => _loading = true);
                        _fetchBooks();
                      } catch (e) {
                        _showToast("Operation failed.", isError: true);
                      } finally {
                        setModalState(() => _isSubmitting = false);
                      }
                    },
                    child: _isSubmitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(isEditing ? "SAVE CHANGES" : "ADD TO CATALOGUE", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
                  ),
                ),
                SizedBox(height: MediaQuery.of(context).viewInsets.bottom), // Prevent keyboard overlap
              ],
            ),
          );
        }
      ),
    );
  }

  Widget _buildInput(TextEditingController ctrl, String label, IconData icon, bool isDark, {bool isNumber = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: TextField(
        controller: ctrl,
        keyboardType: isNumber ? TextInputType.number : TextInputType.text,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
          prefixIcon: Icon(icon, color: Colors.grey, size: 20),
          filled: true, fillColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade50,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: Color(0xFF42A5F5), width: 2)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const CustomLoader();

    final isDarkMode = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);
    final textMuted = isDarkMode ? Colors.white60 : Colors.grey.shade500;
    final borderColor = isDarkMode ? Colors.white10 : Colors.grey.shade200;

    final filteredBooks = _books.where((b) {
      final q = _searchQuery.toLowerCase();
      return (b['title']?.toLowerCase().contains(q) ?? false) ||
             (b['author']?.toLowerCase().contains(q) ?? false) ||
             (b['isbn']?.toLowerCase().contains(q) ?? false) ||
             (b['category']?.toLowerCase().contains(q) ?? false);
    }).toList();

    return Scaffold(
      backgroundColor: bgColor,
      // 🔥 FLOATING ACTION BUTTON (ADD NEW) 🔥
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF42A5F5),
        onPressed: () => _showBookFormModal(),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text("ADD NEW", style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
      ).animate().scale(delay: 500.ms),
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
                  child: Icon(Icons.library_books, size: 200, color: Colors.white.withOpacity(0.1)),
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
                              const Text("Catalogue", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                              Text("INVENTORY MANAGEMENT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 25),
                    // Search Bar inside Header
                    Container(
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                      child: TextField(
                        onChanged: (v) => setState(() => _searchQuery = v),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                        decoration: const InputDecoration(
                          hintText: "Search title, author, ISBN...",
                          hintStyle: TextStyle(color: Colors.grey),
                          prefixIcon: Icon(Icons.search, color: Colors.grey),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 15),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // --- BOOK LIST ---
          Expanded(
            child: filteredBooks.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.menu_book, size: 80, color: Colors.grey.withOpacity(0.3)),
                        const SizedBox(height: 15),
                        const Text("NO BOOKS FOUND", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                      ],
                    ).animate().fadeIn(),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(20),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filteredBooks.length,
                    itemBuilder: (context, index) {
                      final book = filteredBooks[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 15),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: cardColor,
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(color: borderColor),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDarkMode ? 0.2 : 0.02), blurRadius: 10, offset: const Offset(0, 4))],
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 60, height: 75,
                                  decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(15)),
                                  child: const Icon(Icons.menu_book, color: Color(0xFF42A5F5), size: 30),
                                ),
                                const SizedBox(width: 15),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(book['title'].toString().toUpperCase(), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColor, leadingDistribution: TextLeadingDistribution.even)),
                                      Text("by ${book['author']}", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textMuted, fontStyle: FontStyle.italic)),
                                      const SizedBox(height: 5),
                                      Wrap(
                                        spacing: 6, // Items ke beech ki horizontal jagah
                                        runSpacing: 6, // Jab next line me aaye toh vertical jagah
                                        children: [
                                          Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.grey.withOpacity(0.1), borderRadius: BorderRadius.circular(6)), child: Text("ISBN: ${book['isbn']}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textMuted))),
                                          Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(6)), child: Text(book['category'].toString().toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5)))),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  children: [
                                    IconButton(icon: const Icon(Icons.edit, color: Colors.grey, size: 20), onPressed: () => _showBookFormModal(book: book)),
                                    IconButton(icon: const Icon(Icons.delete, color: Color(0xFFF43F5E), size: 20), onPressed: () => _confirmDelete(book['_id'], book['title'])),
                                  ],
                                ),
                              ],
                            ),
                            const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(height: 1)),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("RACK NO.", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textMuted, letterSpacing: 1)),
                                    Text(book['rackNumber']?.toString().toUpperCase() ?? 'N/A', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColor)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text("AVAILABILITY", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textMuted, letterSpacing: 1)),
                                    Text.rich(
                                      TextSpan(
                                        children: [
                                          TextSpan(text: "${book['availableCopies']}", style: TextStyle(color: book['availableCopies'] > 0 ? const Color(0xFF10B981) : const Color(0xFFF43F5E))),
                                          TextSpan(text: " / ${book['totalCopies']}", style: TextStyle(color: textMuted)),
                                        ],
                                      ),
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: 0.1, delay: Duration(milliseconds: 50 * index)).fadeIn();
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../widgets/technical_support_modal.dart'; // 🔥 NAYA IMPORT FOR THEME
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

// 🔥 ConsumerStatefulWidget so it listens to theme changes
class Navbar extends ConsumerStatefulWidget {
  final String searchQuery;
  final Function(String) onSearchChanged;
  final VoidCallback onSupportClick;
  final VoidCallback onMenuClick;

  const Navbar({
    super.key,
    required this.searchQuery,
    required this.onSearchChanged,
    required this.onSupportClick,
    required this.onMenuClick,
  });

  @override
  ConsumerState<Navbar> createState() => _NavbarState();
}

class _NavbarState extends ConsumerState<Navbar> {
  Map<String, dynamic>? user;
  String greetingText = "Good Morning";
  String greetingEmoji = "☀️";
  int unreadCount = 0;
  Timer? _timer;
  Timer? _badgeTimer; // 🔥 NAYA TIMER

  @override
  void initState() {
    super.initState();
    _loadUser();
    _updateGreeting();
    _timer =
        Timer.periodic(const Duration(minutes: 15), (_) => _updateGreeting());

    // 🔥 APP START HOTE HI FETCH KAREGA, USKE BAAD HAR 5 SECOND MEIN 🔥
    _fetchUnreadCount();
    _badgeTimer =
        Timer.periodic(const Duration(seconds: 5), (_) => _fetchUnreadCount());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _badgeTimer?.cancel(); // 🔥 MEMORY LEAK BACHANE KE LIYE TIMER KILL KIYA
    super.dispose();
  }

 // 🔥 EXTRACT PATH CORRECTION IN NAVBAR 🔥
  Future<void> _fetchUnreadCount() async {
    try {
      // 🔴 REPLACED UNREAD-COUNT WITH ACTUAL ENDPOINT '/notices/my-notices'
      final response = await ApiClient.dio.get('/notices/my-notices');
      
      if (mounted && response.data != null) {
        // Response map ke andar se 'unreadCount' key nikal rahe hain
        final int fetchedCount = int.tryParse(response.data['unreadCount'].toString()) ?? 0;
        
        if (fetchedCount != unreadCount) {
          setState(() {
            unreadCount = fetchedCount;
          });
        }
      }
    } catch (e) {
      debugPrint("Silent Sync Interrupted: $e");
    }
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() => user = jsonDecode(userStr));
    }
  }

  void _updateGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      setState(() {
        greetingText = "Good Morning";
        greetingEmoji = "☀️";
      });
    } else if (hour < 17) {
      setState(() {
        greetingText = "Good Afternoon";
        greetingEmoji = "🌤️";
      });
    } else if (hour < 21) {
      setState(() {
        greetingText = "Good Evening";
        greetingEmoji = "👋";
      });
    } else {
      setState(() {
        greetingText = "Good Night";
        greetingEmoji = "🌙";
      });
    }
  }

  void _handleBellClick() {
    if (user?['role'] == 'superadmin') return;
    if (user?['role'] != 'admin' && unreadCount > 0) {
      setState(() => unreadCount = 0);
    }
    context.go('/notice-feed');
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final role = user?['role'] ?? 'student';
    final name = user?['name'] ?? 'Guest';
    final firstName = name.split(' ')[0];
    final capitalizedName = firstName.isNotEmpty
        ? firstName[0].toUpperCase() + firstName.substring(1).toLowerCase()
        : '';
    final capitalizedRole = role.isNotEmpty
        ? role[0].toUpperCase() + role.substring(1).toLowerCase()
        : '';

    return ClipRRect(
      borderRadius: const BorderRadius.only(
        bottomLeft: Radius.circular(40),
        bottomRight: Radius.circular(40),
      ),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500), // Smooth color transition
        padding:
            const EdgeInsets.only(top: 30, left: 20, right: 20, bottom: 15),
        decoration: BoxDecoration(
          // 🔥 DYNAMIC BACKGROUND: Light mode me Blue, Dark mode me Dark Slate/Blue
          color: isDarkMode ? const Color(0xFF1E293B) : const Color(0xFF42A5F5),
          boxShadow: [
            BoxShadow(
                color: isDarkMode ? Colors.black54 : Colors.black26,
                blurRadius: 10,
                offset: const Offset(0, 4)),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // --- 1. TOP MOVING ORANGE LINE ANIMATION ---
            Positioned(
              top: -55,
              left: -24,
              right: -24,
              child: Container(
                height: 4,
                width: double.infinity,
                color: Colors.red.withValues(alpha: 0.1),
                child: Stack(
                  children: [
                    Container(
                      width: 150,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.orangeAccent,
                            Colors.transparent
                          ],
                        ),
                      ),
                    ).animate(onPlay: (c) => c.repeat()).slideX(
                        begin: -5,
                        end: 5,
                        duration: 2.5.seconds,
                        curve: Curves.linear),
                  ],
                ),
              ),
            ),

            // --- MAIN CONTENT ---
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        GestureDetector(
                          onTap: widget.onMenuClick,
                          child: const Icon(Icons.menu,
                                  color: Colors.white, size: 26)
                              .animate()
                              .fadeIn()
                              .scale(),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.3)),
                          ),
                          child: const Icon(Icons.memory,
                                  color: Colors.white, size: 16)
                              .animate(onPlay: (c) => c.repeat())
                              .rotate(duration: 4.seconds),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          "EduFlowAI v2.0",
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              fontStyle: FontStyle.italic),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        if (role != 'superadmin')
                          GestureDetector(
                            onTap: _handleBellClick,
                            child: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                        color: Colors.white
                                            .withValues(alpha: 0.2)),
                                  ),
                                  child: const Icon(Icons.notifications_none,
                                      color: Colors.white, size: 20),
                                ),
                                // 🔥 YAHAN AUTO UPDATE HOGA BADGE JAISE HI unreadCount > 0 HOGA 🔥
                                if (role != 'admin' && unreadCount > 0)
                                  Positioned(
                                    top: -4,
                                    right: -4,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: Colors.redAccent,
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                            color: isDarkMode
                                                ? const Color(0xFF1E293B)
                                                : const Color(0xFF42A5F5),
                                            width: 2),
                                      ),
                                      child: Text(
                                        unreadCount.toString(),
                                        style: const TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white),
                                      ),
                                    )
                                        .animate(
                                            onPlay: (c) =>
                                                c.repeat(reverse: true))
                                        .scale(
                                            begin: const Offset(1, 1),
                                            end: const Offset(1.2, 1.2)),
                                  ),
                              ],
                            ),
                          ),
                        const SizedBox(width: 12),
                        if (role != 'superadmin')
                          GestureDetector(
                            onTap: () {
                              // 🔥 SEEDHA MODAL CALL HO RAHA HAI YAHAN SE 🔥
                              showDialog(
                                context: context,
                                barrierColor: Colors.transparent,
                                builder: (context) =>
                                    const TechnicalSupportModal(),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.2)),
                              ),
                              child: const Icon(Icons.headset_mic_outlined,
                                  color: Colors.white, size: 20),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 15),

                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    "$capitalizedRole Portal",
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 1,
                        fontStyle: FontStyle.italic),
                  ),
                ),
                const SizedBox(height: 8),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                          text: "$greetingText $greetingEmoji ",
                          style: const TextStyle(
                              color: Colors.white70,
                              fontWeight: FontWeight.bold)),
                      TextSpan(
                          text: capitalizedName,
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900)),
                    ],
                  ),
                  style: const TextStyle(
                      fontSize: 24, fontStyle: FontStyle.italic),
                ),
                const SizedBox(height: 8),

                // FIXED: Animated Search Bar with Clear Button
                _AnimatedSearchBar(
                  searchQuery: widget.searchQuery,
                  onSearchChanged: widget.onSearchChanged,
                  isDarkMode:
                      isDarkMode, // 🔥 Paasing theme state to search bar
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AnimatedSearchBar extends StatefulWidget {
  final String searchQuery;
  final Function(String) onSearchChanged;
  final bool isDarkMode; // 🔥 NAYA THEME STATE

  const _AnimatedSearchBar({
    required this.searchQuery,
    required this.onSearchChanged,
    required this.isDarkMode,
  });

  @override
  State<_AnimatedSearchBar> createState() => _AnimatedSearchBarState();
}

class _AnimatedSearchBarState extends State<_AnimatedSearchBar> {
  bool _isPressed = false;
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.searchQuery);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _clearSearch() {
    _controller.clear();
    widget.onSearchChanged(""); // Notify parent
    FocusScope.of(context).unfocus(); // Close keyboard
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 DYNAMIC COLORS FOR SEARCH BAR 🔥
    final Color barBg =
        widget.isDarkMode ? const Color(0xFF0F172A) : Colors.white;
    final Color textColor =
        widget.isDarkMode ? Colors.white : const Color(0xFF334155);
    final Color hintColor =
        widget.isDarkMode ? const Color(0xFF64748B) : const Color(0xFF94A3B8);

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOutBack,
        transform: Matrix4.identity()..scale(_isPressed ? 0.97 : 1.0),
        decoration: BoxDecoration(
          color: barBg,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: _isPressed ? 0.05 : 0.1),
              blurRadius: _isPressed ? 5 : 15,
              offset: const Offset(0, 5),
            )
          ],
        ),
        child: TextField(
          controller: _controller,
          onChanged: widget.onSearchChanged,
          style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
              color: textColor,
              fontStyle: FontStyle.italic),
          decoration: InputDecoration(
            hintText: "Search modules...",
            hintStyle: TextStyle(color: hintColor, fontWeight: FontWeight.bold),
            prefixIcon: Icon(Icons.search, color: hintColor, size: 20),

            // FIXED: Clear (Cross) Button Logic
            suffixIcon: widget.searchQuery.isNotEmpty
                ? IconButton(
                    icon: Icon(Icons.close, color: hintColor, size: 20),
                    onPressed: _clearSearch,
                  )
                : null,

            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 10),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT FOR THEME
import 'package:go_router/go_router.dart';
import 'navbar.dart';
import 'bottom_nav.dart';
import 'sidebar.dart';
import 'dart:ui';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

// 🔥 ConsumerStatefulWidget so it listens to theme changes
class LayoutWrapper extends ConsumerStatefulWidget {
  final Widget? child; // Admin/Finance ke static pages ke liye
  final Widget Function(String searchQuery)?
      childBuilder; // Student/Dashboard search ke liye
  final String role;

  const LayoutWrapper(
      {super.key, this.child, this.childBuilder, required this.role});

  @override
  ConsumerState<LayoutWrapper> createState() => _LayoutWrapperState();
}

class _LayoutWrapperState extends ConsumerState<LayoutWrapper> {
  String searchQuery = "";
  bool isSidebarOpen = false;

  @override
  void initState() {
    super.initState();
    
    // Naya logged-in user aate hi uski saved theme fetch karega
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(themeProvider.notifier).loadThemeForCurrentUser();
    });
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 800;

    // 🔥 GLOBAL THEME SE DARK MODE CHECK KAR RAHE HAIN 🔥
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC BACKGROUND COLOR 🔥
    final Color scaffoldBgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: scaffoldBgColor,

      // FIXED: CustomScrollView ke sath ClampingScrollPhysics.
      // Ab scroll karne par Navbar upar gayab hoga, aur top se neeche nahi khichega!
      body: Stack(
        children: [
          CustomScrollView(
            physics: const ClampingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Navbar(
                  searchQuery: searchQuery,
                  onSearchChanged: (val) => setState(() => searchQuery = val),
                  onSupportClick: () {},
                  onMenuClick: () {
                    setState(() {
                      isSidebarOpen = true;
                    });
                  },
                ),
              ),
              SliverToBoxAdapter(
                child: widget.childBuilder != null
                    ? widget.childBuilder!(searchQuery)
                    : widget.child!,
              ),
            ],
          ),

          if (widget.role == 'student' && isMobile)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: IgnorePointer(
                ignoring: isSidebarOpen,
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 300),
                  opacity: isSidebarOpen ? 0.3 : 1,
                  child: const BottomNav(),
                ),
              ),
            ),

          // Blur Overlay
          if (isSidebarOpen)
            Positioned.fill(
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    isSidebarOpen = false;
                  });
                },
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    // Dark mode ke liye overlay color adjust kar sakte hain, abhi standard hai
                    color: Colors.black.withValues(alpha: isDarkMode ? 0.3 : 0.15), 
                  ),
                ),
              ),
            ),

          // Premium Smooth Sidebar
          AnimatedPositioned(
            duration: const Duration(milliseconds: 650),
            curve: Curves.easeOutExpo,
            left: isSidebarOpen ? 0 : -MediaQuery.of(context).size.width * 0.72,
            top: 0,
            bottom: 0,
            child: const Sidebar(),
          ),
        ],
      ),
    );
  }
}
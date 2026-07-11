import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 THEME KE LIYE
import 'package:go_router/go_router.dart';
import '../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER (path check kar lena)

/// ============================================================
/// PREMIUM "Loading" LOADER — squash/stretch L & i untouched
/// (asli animation logic same rakha hai), upar se add kiya:
///   • Accent-color flying dot + soft glow
///   • Comet-style ghost trail peeche peeche
///   • Ambient breathing glow orb text ke peeche
///   • Subtle floating shadow neeche
///   • Slow shimmer sweep letters ke upar
///   • Landing impact ripple jab dot letter pe touch kare
/// ============================================================
class CustomLoader extends ConsumerStatefulWidget {
  const CustomLoader({super.key});

  @override
  ConsumerState<CustomLoader> createState() => _CustomLoaderState();
}

class _CustomLoaderState extends ConsumerState<CustomLoader>
    with TickerProviderStateMixin {
  late AnimationController _controller; // main 1800ms loop (L, i, dot)
  late AnimationController _ambientController; // slow breathing / shimmer

  // L ki height (36 se 0 aur wapas 36)
  late Animation<double> _lLineHeightAnim;

  // i ki stem ki stretch animation (0.35 to 2.125 scales)
  late Animation<double> _iStretchAnim;

  @override
  void initState() {
    super.initState();

    // Exact 1800ms loop
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();

    // Slow ambient breathing loop for glow + shimmer + soft scale
    _ambientController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..repeat(reverse: true);

    // 1. 'L' ki vertical line animation (Squash and Stretch)
    _lLineHeightAnim = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 36.0), weight: 45), // Rest
      TweenSequenceItem(
          tween: Tween(begin: 36.0, end: 9.0).chain(CurveTween(curve: Curves.easeOut)),
          weight: 4), // Squash
      TweenSequenceItem(tween: Tween(begin: 9.0, end: 4.5), weight: 1), // Max squash
      TweenSequenceItem(
          tween: Tween(begin: 4.5, end: 18.0).chain(CurveTween(curve: Curves.easeIn)),
          weight: 3), // Recovering
      TweenSequenceItem(tween: Tween(begin: 18.0, end: 36.0), weight: 7), // Full height
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 29.0), weight: 8), // Slight bounce
      TweenSequenceItem(tween: Tween(begin: 29.0, end: 36.0), weight: 2), // Settle
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 36.0), weight: 30), // Rest
    ]).animate(_controller);

    // 2. 'i' ki stem animation (Squash and Stretch)
    _iStretchAnim = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 0.35, end: 2.125).chain(CurveTween(curve: Curves.easeOutCubic)),
          weight: 8),
      TweenSequenceItem(tween: Tween(begin: 2.125, end: 2.125), weight: 20),
      TweenSequenceItem(
          tween: Tween(begin: 2.125, end: 0.875).chain(CurveTween(curve: Curves.easeInOut)),
          weight: 9),
      TweenSequenceItem(
          tween: Tween(begin: 0.875, end: 1.03).chain(CurveTween(curve: Curves.easeOut)),
          weight: 9),
      TweenSequenceItem(tween: Tween(begin: 1.03, end: 1.0), weight: 4),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.0), weight: 47),
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 0.35).chain(CurveTween(curve: Curves.easeIn)), weight: 3),
    ]).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    _ambientController.dispose();
    super.dispose();
  }

  // Parabolic trajectory helper for the dot (and its ghost trail)
  ({double x, double y}) _dotPosition(double t) {
    const double startX = 35.0; // Exact top of 'L'
    const double endX = 188.0; // Exact top of 'i' stem
    const double baseY = 18.0; // Standard resting height over 'i'
    const double jumpHeight = 35.0; // Height of the parabola

    final double progress = 0.5 - 0.5 * math.cos(t * math.pi * 2);
    final double x = startX + (endX - startX) * progress;
    final double y = baseY - (math.sin(t * math.pi * 2).abs() * jumpHeight);
    return (x: x, y: y);
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 GLOBAL THEME CHECK
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : Colors.white;
    final Color elementColor = isDarkMode ? Colors.white : Colors.black; // Text & L/i color
    final Color accent = isDarkMode ? const Color(0xFF5B9BFF) : const Color(0xFF2F6DF6);
    final Color accentSoft = isDarkMode ? const Color(0xFF9C6BFF) : const Color(0xFF7E57C2);

    final TextStyle textStyle = TextStyle(
      fontFamily: 'Roboto',
      fontSize: 55,
      fontWeight: FontWeight.w300,
      color: elementColor,
      height: 1.0,
    );

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/');
        }
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: Center(
          child: AnimatedBuilder(
            animation: _ambientController,
            builder: (context, child) {
              final breathe = _ambientController.value; // 0..1..0
              return Transform.scale(
                scale: 0.85 + (breathe * 0.012), // ultra-subtle premium breathing
                child: child,
              );
            },
            child: SizedBox(
              width: 320,
              height: 150,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  // --- 0a. AMBIENT BREATHING GLOW ORB (behind everything) ---
                  AnimatedBuilder(
                    animation: _ambientController,
                    builder: (context, child) {
                      final v = _ambientController.value;
                      return Positioned(
                        bottom: 10,
                        child: Container(
                          width: 260 + (v * 20),
                          height: 90 + (v * 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(100),
                            gradient: RadialGradient(
                              colors: [
                                accent.withValues(alpha: isDarkMode ? 0.16 : 0.08),
                                accentSoft.withValues(alpha: 0.0),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                  // --- 0b. SOFT FLOATING SHADOW BENEATH THE WORD ---
                  Positioned(
                    bottom: 4,
                    child: AnimatedBuilder(
                      animation: _ambientController,
                      builder: (context, child) {
                        final v = _ambientController.value;
                        return Container(
                          width: 190 + (v * 8),
                          height: 10,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(50),
                            color: (isDarkMode ? Colors.black : Colors.black)
                                .withValues(alpha: isDarkMode ? 0.35 : 0.08),
                            boxShadow: [
                              BoxShadow(
                                color: (isDarkMode ? Colors.black : Colors.black)
                                    .withValues(alpha: 0.15),
                                blurRadius: 12,
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),

                  // --- 1. OPTICAL DIVIDER ---
                  Positioned(
                    bottom: 12 + 20, // aligned with text baseline shift below
                    left: 175,
                    child: Container(
                      width: 45,
                      height: 15,
                      color: bgColor,
                    ),
                  ),

                  // --- 2. TEXT AND ANIMATED LETTERS (with slow shimmer sweep) ---
                  Positioned(
                    bottom: 20,
                    child: MediaQuery(
                      data: MediaQuery.of(context)
                          .copyWith(textScaler: const TextScaler.linear(1.0)),
                      child: AnimatedBuilder(
                        animation: _ambientController,
                        builder: (context, child) {
                          final t = _ambientController.value; // 0..1..0 (reverse loop)
                          return ShaderMask(
                            blendMode: BlendMode.srcATop,
                            shaderCallback: (bounds) {
                              return LinearGradient(
                                colors: [
                                  elementColor,
                                  elementColor,
                                  accent.withValues(alpha: isDarkMode ? 0.9 : 0.75),
                                  elementColor,
                                  elementColor,
                                ],
                                stops: [
                                  0.0,
                                  (0.35 * t).clamp(0.0, 1.0),
                                  (0.5 * t + 0.05).clamp(0.0, 1.0),
                                  (0.65 * t + 0.1).clamp(0.0, 1.0),
                                  1.0,
                                ],
                              ).createShader(bounds);
                            },
                            child: child,
                          );
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            // --- THE LETTER 'L' ---
                            SizedBox(
                              width: 25,
                              height: 55,
                              child: Stack(
                                alignment: Alignment.bottomLeft,
                                children: [
                                  Container(
                                    width: 25,
                                    height: 6.5,
                                    color: elementColor,
                                  ),
                                  AnimatedBuilder(
                                    animation: _lLineHeightAnim,
                                    builder: (context, child) {
                                      return Container(
                                        width: 6.5,
                                        height: _lLineHeightAnim.value + 6.5,
                                        color: elementColor,
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(width: 8),
                            Text('o', style: textStyle),
                            const SizedBox(width: 8),
                            Text('a', style: textStyle),
                            const SizedBox(width: 8),
                            Text('d', style: textStyle),
                            const SizedBox(width: 8),

                            // --- THE LETTER 'i' (no dot — the flying ball IS the dot) ---
                            SizedBox(
                              width: 15,
                              height: 55,
                              child: Align(
                                alignment: Alignment.bottomCenter,
                                child: AnimatedBuilder(
                                  animation: _iStretchAnim,
                                  builder: (context, child) {
                                    return Transform(
                                      alignment: Alignment.bottomCenter,
                                      transform: Matrix4.identity()
                                        ..scale(1.0, _iStretchAnim.value),
                                      child: Container(
                                        width: 6.5,
                                        height: 38,
                                        color: elementColor,
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),

                            const SizedBox(width: 8),
                            Text('n', style: textStyle),
                            const SizedBox(width: 8),
                            Text('g', style: textStyle),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // --- 3a. LANDING IMPACT RIPPLES (at L and i, pulse on touchdown) ---
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final t = _controller.value;
                      // proximity-to-ground factor: near 0 at t=0/0.5/1 (impacts)
                      final phase = (t * 2) % 1.0;
                      final impact = (1 - (phase < 0.5 ? phase * 2 : (1 - phase) * 2))
                          .clamp(0.0, 1.0);
                      final onlyNearImpact = impact > 0.82 ? (impact - 0.82) / 0.18 : 0.0;
                      final pos = _dotPosition(t);
                      return Positioned(
                        left: pos.x - 10,
                        top: 38, // baseline ring sits at letter top
                        child: Opacity(
                          opacity: onlyNearImpact * 0.5,
                          child: Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: accent.withValues(alpha: 0.7), width: 1.4),
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                  // --- 3b. COMET GHOST TRAIL (behind the flying dot) ---
                  ...List.generate(4, (i) {
                    final lag = (i + 1) * 0.035;
                    return AnimatedBuilder(
                      animation: _controller,
                      builder: (context, child) {
                        final t = (_controller.value - lag) % 1.0;
                        final tt = t < 0 ? t + 1.0 : t;
                        final pos = _dotPosition(tt);
                        final fade = 1.0 - (i + 1) / 5.0;
                        final size = 7.0 - (i + 1) * 1.1;
                        return Positioned(
                          left: pos.x,
                          top: pos.y,
                          child: Opacity(
                            opacity: fade * 0.45,
                            child: Container(
                              width: size,
                              height: size,
                              decoration: BoxDecoration(
                                color: accentSoft,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  }),

                  // --- 3c. THE FLYING DOT (accent color + glow) ---
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final t = _controller.value;
                      final pos = _dotPosition(t);
                      return Positioned(
                        left: pos.x,
                        top: pos.y,
                        child: Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: accent,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: accent.withValues(alpha: 0.85),
                                blurRadius: 10,
                                spreadRadius: 1.5,
                              ),
                              BoxShadow(
                                color: accentSoft.withValues(alpha: 0.4),
                                blurRadius: 18,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
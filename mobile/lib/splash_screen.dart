import 'dart:async';
import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

/// ============================================================
/// EDUFLOW AI — "MST BHAYANKAR" LIGHT PREMIUM SPLASH SCREEN
/// ============================================================
/// Light glassmorphism stage. Every letter flies in from a DIFFERENT
/// direction (top / bottom / left / right). The "E" crashes in on
/// its own with a big bounce, and right after it lands, a graduation
/// cap drops from above and sits on top of it (school branding).
/// "AI" gets its own shimmering gradient + glow treatment to stand
/// apart from the rest of the name.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController floatController;
  late AnimationController shimmerController;

  @override
  void initState() {
    super.initState();

    floatController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();

    Future.delayed(const Duration(milliseconds: 6200), () {
      if (mounted) context.go('/login');
    });
  }

  @override
  void dispose() {
    floatController.dispose();
    shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    const navy = Color(0xFF1E293B);
    const blue = Color(0xFF2F80FF);
    const purple = Color(0xFF9C6BFF);
    const gold = Color(0xFFFFB020);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          /// 1. PREMIUM LIGHT GRADIENT BASE
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFEFF6FF), Color(0xFFF8FAFC), Color(0xFFF3E8FF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                stops: [0.0, 0.5, 1.0],
              ),
            ),
          ),

          /// 2. BIG SOFT GLOW ORBS
          Positioned(
            top: -90,
            left: -60,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                  shape: BoxShape.circle, color: blue.withValues(alpha: 0.28)),
            )
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .scale(
                    duration: 5.seconds,
                    begin: const Offset(1, 1),
                    end: const Offset(1.35, 1.35))
                .moveX(begin: 0, end: 35, duration: 4.seconds),
          ),
          Positioned(
            bottom: -140,
            right: -90,
            child: Container(
              width: 380,
              height: 380,
              decoration: BoxDecoration(
                  shape: BoxShape.circle, color: purple.withValues(alpha: 0.24)),
            )
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .scale(
                    duration: 6.seconds,
                    begin: const Offset(1, 1),
                    end: const Offset(1.4, 1.4))
                .moveY(begin: 0, end: -35, duration: 5.seconds),
          ),
          Positioned(
            top: size.height * 0.35,
            right: -70,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                  shape: BoxShape.circle, color: gold.withValues(alpha: 0.18)),
            )
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .scale(
                    duration: 4.seconds,
                    begin: const Offset(1, 1),
                    end: const Offset(1.25, 1.25)),
          ),

          // Glass blur layer
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 45, sigmaY: 45),
              child: Container(color: Colors.white.withValues(alpha: 0.18)),
            ),
          ),

          /// 3. SPARKLE PARTICLES (floating + twinkling)
          ...List.generate(28, (index) {
            final double s = Random().nextDouble() * 5 + 2;
            return Positioned(
              left: Random().nextDouble() * size.width,
              top: Random().nextDouble() * size.height,
              child: Container(
                width: s,
                height: s,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  boxShadow: [BoxShadow(color: blue.withValues(alpha: 0.7), blurRadius: s * 2.5)],
                ),
              )
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .moveY(
                      begin: 0,
                      end: -45 - Random().nextDouble() * 55,
                      duration: (2000 + index * 130).ms,
                      curve: Curves.easeInOutSine)
                  .fadeIn(duration: 700.ms, delay: (index * 40).ms)
                  .then()
                  .fadeOut(delay: 1200.ms, duration: 600.ms)
                  .then()
                  .fadeIn(duration: 400.ms),
            );
          }),

          /// 4. SPINNING SPARKLE STARS AROUND THE LOGO ZONE (extra "wow")
          ...List.generate(6, (i) {
            final angle = (pi * 2 / 6) * i;
            const radius = 150.0;
            return Positioned(
              top: size.height * 0.42 + radius * sin(angle),
              left: size.width / 2 + radius * cos(angle) - 10,
              child: Icon(Icons.auto_awesome_rounded,
                      size: 16 + Random().nextInt(10).toDouble(),
                      color: [blue, purple, gold][i % 3].withValues(alpha: 0.8))
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .fadeIn(delay: (3800 + i * 150).ms, duration: 500.ms)
                  .scale(
                      begin: const Offset(0.4, 0.4),
                      end: const Offset(1.1, 1.1),
                      duration: 1200.ms)
                  .then()
                  .rotate(duration: 2.seconds, begin: 0, end: 0.15),
            );
          }),

          /// 5. THE LOGO STAGE — every letter enters from a different side
          Center(
            child: Padding(
              padding: EdgeInsets.only(top: size.height * 0.02),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  /// --- THE 'E' + GRADUATION CAP STACK ---
                  Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.center,
                    children: [
                      // The big E — crashes down from way above with a bounce
                      Text(
                        "E",
                        style: TextStyle(
                          fontSize: 88,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -2,
                          fontStyle: FontStyle.italic,
                          color: navy,
                          shadows: [
                            Shadow(color: blue.withValues(alpha: 0.35), blurRadius: 25),
                          ],
                        ),
                      )
                          .animate()
                          .fadeIn(duration: 400.ms)
                          .slideY(
                              begin: -3.5,
                              end: 0,
                              duration: 900.ms,
                              curve: Curves.bounceOut)
                          .then(delay: 100.ms)
                          .shake(duration: 350.ms, hz: 5, rotation: 0.03),

                      // Graduation cap — drops from above, lands on the E
                      Positioned(
                        top: -34,
                        child: Icon(Icons.school_rounded, size: 40, color: gold)
                            .animate()
                            .fadeIn(delay: 1250.ms, duration: 250.ms)
                            .slideY(
                                begin: -2.5,
                                end: 0,
                                delay: 1250.ms,
                                duration: 550.ms,
                                curve: Curves.bounceOut)
                            .rotate(
                                delay: 1250.ms,
                                begin: -0.3,
                                end: -0.08,
                                duration: 550.ms,
                                curve: Curves.easeOutBack)
                            .then()
                            .shimmer(
                                delay: 300.ms,
                                duration: 1200.ms,
                                color: Colors.white.withValues(alpha: 0.8)),
                      ),
                    ],
                  ),

                  /// --- "duFlow" — each letter flies in from a random direction
                  ...("duFlow".split('')).asMap().entries.map((entry) {
                    final i = entry.key;
                    final letter = entry.value;
                    // alternate entrance directions for chaos-but-controlled effect
                    final dirs = [
                      const Offset(0, -2.2), // from top
                      const Offset(0, 2.2), // from bottom
                      const Offset(-2.5, 0), // from left
                      const Offset(2.5, 0), // from right
                      const Offset(0, -2.2),
                      const Offset(0, 2.2),
                    ];
                    final dir = dirs[i % dirs.length];
                    return Text(
                      letter,
                      // 🔥 FIX: Hata diya 'const' kyunki 'size.width' runtime property hai
                      style: TextStyle(
                        fontSize: size.width * 0.155, 
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1,
                        fontStyle: FontStyle.italic,
                        color: navy,
                      ),
                    )
                        .animate()
                        .fadeIn(delay: (1600 + i * 120).ms, duration: 350.ms)
                        .slide(
                            begin: dir,
                            end: Offset.zero,
                            delay: (1600 + i * 120).ms,
                            duration: 450.ms,
                            curve: Curves.easeOutBack)
                        .then()
                        .shake(duration: 200.ms, hz: 4, rotation: 0.015);
                  }),

                  /// --- "AI" — distinct shimmering gradient treatment
                  AnimatedBuilder(
                    animation: shimmerController,
                    builder: (context, child) {
                      return ShaderMask(
                        shaderCallback: (bounds) {
                          final t = shimmerController.value;
                          return LinearGradient(
                            colors: const [blue, purple, gold, blue],
                            stops: const [0.0, 0.35, 0.65, 1.0],
                            begin: Alignment(-1 + 2 * t, 0),
                            end: Alignment(1 + 2 * t, 0),
                          ).createShader(bounds);
                        },
                        child: child,
                      );
                    },
                    // 🔥 FIX: Yaha se 'const' hata diya Text widget se
                    child: Text(
                      "AI",
                      style: TextStyle(
                        fontSize: size.width * 0.165,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1,
                        fontStyle: FontStyle.italic,
                        color: Colors.white, // masked by shader
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 2450.ms, duration: 300.ms)
                      .scale(
                          begin: const Offset(0.2, 0.2),
                          end: const Offset(1.25, 1.25),
                          delay: 2450.ms,
                          duration: 450.ms,
                          curve: Curves.easeOutBack)
                      .then()
                      .scale(
                          begin: const Offset(1.25, 1.25),
                          end: const Offset(1, 1),
                          duration: 200.ms)
                      .then()
                      .custom(
                        duration: 1000.ms,
                        builder: (context, value, child) => Container(
                          decoration: BoxDecoration(
                            boxShadow: [
                              BoxShadow(
                                  color: purple.withValues(alpha: 0.5 * value),
                                  blurRadius: 45 * value),
                            ],
                          ),
                          child: child,
                        ),
                      ),

                  // --- V2.0 BADGE
                  Container(
                    margin: const EdgeInsets.only(left: 8, top: 22),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: gold,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [BoxShadow(color: gold.withValues(alpha: 0.5), blurRadius: 12)],
                    ),
                    child: const Text(
                      "v2.0",
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          fontStyle: FontStyle.italic),
                    ),
                  ).animate().fadeIn(delay: 3100.ms).scale(curve: Curves.elasticOut),
                ],
              ),
            ),
          ),

          /// 6. LIGHT SWEEP ACROSS FULL LOGO ONCE EVERYTHING HAS LANDED
          Positioned.fill(
            child: Align(
              alignment: const Alignment(0, -0.06),
              child: Container(
                width: 6,
                height: 130,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  gradient: LinearGradient(colors: [
                    Colors.white.withValues(alpha: 0.0),
                    Colors.white.withValues(alpha: 0.95),
                    Colors.white.withValues(alpha: 0.0),
                  ]),
                  boxShadow: [BoxShadow(color: blue.withValues(alpha: 0.6), blurRadius: 18)],
                ),
              )
                  .animate()
                  .fadeIn(delay: 3300.ms, duration: 100.ms)
                  .moveX(
                      begin: -size.width / 2 - 60,
                      end: size.width / 2 + 60,
                      duration: 900.ms,
                      curve: Curves.easeInOutCubic)
                  .fadeOut(delay: 4150.ms, duration: 150.ms),
            ),
          ),

          /// 7. BOTTOM FEATURE ICONS
          Positioned(
            bottom: size.height * 0.16,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _bottomIcon(Icons.menu_book_rounded, navy, 4300.ms),
                const SizedBox(width: 36),
                _bottomIcon(Icons.auto_awesome_rounded, blue, 4450.ms, glow: blue),
                const SizedBox(width: 36),
                _bottomIcon(Icons.emoji_events_rounded, gold, 4600.ms),
              ],
            ),
          ),

          /// 8. TAGLINE
          Positioned(
            bottom: size.height * 0.08,
            left: 0,
            right: 0,
            child: const Center(
              child: Text(
                "SMART SCHOOL. SMART FUTURE.",
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF64748B),
                  fontStyle: FontStyle.italic,
                  letterSpacing: 3,
                ),
              ),
            )
                .animate()
                .fadeIn(delay: 5000.ms, duration: 500.ms)
                .slideY(begin: 1, end: 0, curve: Curves.easeOutBack),
          ),
        ],
      ),
    );
  }

  Widget _bottomIcon(IconData icon, Color color, Duration delay, {Color? glow}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
              color: (glow ?? Colors.black).withValues(alpha: glow != null ? 0.25 : 0.06),
              blurRadius: 14,
              offset: const Offset(0, 5)),
        ],
      ),
      child: Icon(icon, size: 24, color: color),
    )
        .animate()
        .fadeIn(delay: delay)
        .slideY(begin: 1, end: 0, curve: Curves.easeOutBack)
        .then()
        .scale(
            begin: const Offset(1, 1), end: const Offset(1.12, 1.12), duration: 300.ms)
        .then()
        .scale(begin: const Offset(1.12, 1.12), end: const Offset(1, 1), duration: 200.ms);
  }
}
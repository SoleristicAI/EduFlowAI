import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 THEME KE LIYE
import 'package:go_router/go_router.dart';
import '../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER (path check kar lena)

/// ============================================================
/// PREMIUM "Loading" LOADER — MAX CREATIVE EDITION
/// ============================================================
/// Word ki asli L/i squash-stretch animation bilkul untouched hai.
/// Ab word ke IRD-GIRD (letters se bilkul alag) 6 naye premium
/// layers add kiye hain:
///   1. Rotating gradient spinner-arc (tech ring) loader ke peeche
///   2. Orbiting satellite particles — 3 dots alag speed pe ghoomte
///   3. Randomly twinkling sparkle stars around the frame
///   4. Hue-cycling ambient glow (blue -> purple -> teal -> blue)
///   5. Tech-style corner focus brackets (camera-frame look)
///   6. Sequential bottom "status" loading dots
/// Plus pehle wale: comet trail, landing ripple, floating shadow,
/// shimmer sweep — sab intact hai.
class CustomLoader extends ConsumerStatefulWidget {
  const CustomLoader({super.key});

  @override
  ConsumerState<CustomLoader> createState() => _CustomLoaderState();
}

class _CustomLoaderState extends ConsumerState<CustomLoader>
    with TickerProviderStateMixin {
  late AnimationController _controller; // main 1800ms loop (L, i, dot)
  late AnimationController _ambientController; // breathing / shimmer
  late AnimationController _ringController; // spinner ring + orbit + sparkle
  late AnimationController _hueController; // slow color-cycling glow
  late AnimationController _statusDotsController; // bottom sequential dots

  late Animation<double> _lLineHeightAnim;
  late Animation<double> _iStretchAnim;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();

    _ambientController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..repeat(reverse: true);

    _ringController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    )..repeat();

    _hueController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 6000),
    )..repeat();

    _statusDotsController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _lLineHeightAnim = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 36.0), weight: 45),
      TweenSequenceItem(
          tween: Tween(begin: 36.0, end: 9.0).chain(CurveTween(curve: Curves.easeOut)),
          weight: 4),
      TweenSequenceItem(tween: Tween(begin: 9.0, end: 4.5), weight: 1),
      TweenSequenceItem(
          tween: Tween(begin: 4.5, end: 18.0).chain(CurveTween(curve: Curves.easeIn)),
          weight: 3),
      TweenSequenceItem(tween: Tween(begin: 18.0, end: 36.0), weight: 7),
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 29.0), weight: 8),
      TweenSequenceItem(tween: Tween(begin: 29.0, end: 36.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 36.0), weight: 30),
    ]).animate(_controller);

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
    _ringController.dispose();
    _hueController.dispose();
    _statusDotsController.dispose();
    super.dispose();
  }

  ({double x, double y}) _dotPosition(double t) {
    const double startX = 35.0;
    const double endX = 188.0;
    const double baseY = 18.0;
    const double jumpHeight = 35.0;

    final double progress = 0.5 - 0.5 * math.cos(t * math.pi * 2);
    final double x = startX + (endX - startX) * progress;
    final double y = baseY - (math.sin(t * math.pi * 2).abs() * jumpHeight);
    return (x: x, y: y);
  }

  Color _cycledColor(double hueT, {double offsetDeg = 0}) {
    // Cycles smoothly through a premium blue -> purple -> teal range
    final hue = (210 + offsetDeg + (60 * math.sin(hueT * math.pi * 2))) % 360;
    return HSVColor.fromAHSV(1.0, hue, 0.62, 0.95).toColor();
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : Colors.white;
    final Color elementColor = isDarkMode ? Colors.white : Colors.black;
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
              final breathe = _ambientController.value;
              return Transform.scale(
                scale: 0.85 + (breathe * 0.012),
                child: child,
              );
            },
            child: SizedBox(
              width: 340,
              height: 180,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  // --- (NEW) 0. TECH CORNER FOCUS BRACKETS ---
                  AnimatedBuilder(
                    animation: _ambientController,
                    builder: (context, child) {
                      final v = _ambientController.value;
                      final op = 0.18 + v * 0.22;
                      final c = accent.withValues(alpha: op);
                      return Stack(
                        children: [
                          Positioned(top: 6, left: 6, child: _corner(c, 0)),
                          Positioned(top: 6, right: 6, child: _corner(c, 1)),
                          Positioned(bottom: 6, left: 6, child: _corner(c, 2)),
                          Positioned(bottom: 6, right: 6, child: _corner(c, 3)),
                        ],
                      );
                    },
                  ),

                  // --- (NEW) 1. ROTATING GRADIENT SPINNER ARC ---
                  AnimatedBuilder(
                    animation: Listenable.merge([_ringController, _hueController]),
                    builder: (context, child) {
                      final angle = _ringController.value * 2 * math.pi;
                      final c1 = _cycledColor(_hueController.value);
                      final c2 = _cycledColor(_hueController.value, offsetDeg: 60);
                      return Transform.rotate(
                        angle: angle,
                        child: Container(
                          width: 210,
                          height: 210,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: SweepGradient(
                              colors: [
                                c1.withValues(alpha: 0.0),
                                c1.withValues(alpha: 0.0),
                                c2.withValues(alpha: isDarkMode ? 0.55 : 0.35),
                                c1.withValues(alpha: 0.0),
                              ],
                              stops: const [0.0, 0.62, 0.82, 1.0],
                            ),
                          ),
                          child: Center(
                            child: Container(
                              width: 202,
                              height: 202,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: bgColor,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                  // --- (NEW) 2. ORBITING SATELLITE PARTICLES ---
                  ...List.generate(3, (i) {
                    final radius = 118.0 + (i * 16);
                    final speed = 1.0 - (i * 0.22);
                    final phase = i * (math.pi * 2 / 3);
                    return AnimatedBuilder(
                      animation: _ringController,
                      builder: (context, child) {
                        final angle =
                            (_ringController.value * 2 * math.pi * speed) + phase;
                        final dx = radius * math.cos(angle);
                        final dy = radius * math.sin(angle) * 0.45; // flattened orbit
                        final c = i == 0 ? accent : (i == 1 ? accentSoft : accent);
                        return Positioned(
                          left: 170 + dx,
                          top: 90 + dy,
                          child: Container(
                            width: 5.0 - (i * 0.8),
                            height: 5.0 - (i * 0.8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: c.withValues(alpha: 0.75),
                              boxShadow: [
                                BoxShadow(color: c.withValues(alpha: 0.6), blurRadius: 6),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  }),

                  // --- (NEW) 3. RANDOM TWINKLING SPARKLES ---
                  ...List.generate(6, (i) {
                    final positions = [
                      const Offset(30, 20),
                      const Offset(300, 30),
                      const Offset(15, 130),
                      const Offset(310, 120),
                      const Offset(60, 150),
                      const Offset(270, 155),
                    ];
                    final pos = positions[i];
                    return AnimatedBuilder(
                      animation: _ringController,
                      builder: (context, child) {
                        final t = (_ringController.value + (i * 0.17)) % 1.0;
                        final twinkle = (math.sin(t * math.pi * 2) * 0.5 + 0.5);
                        return Positioned(
                          left: pos.dx,
                          top: pos.dy,
                          child: Opacity(
                            opacity: (twinkle * 0.8).clamp(0.0, 1.0),
                            child: Icon(
                              Icons.auto_awesome_rounded,
                              size: 8 + (twinkle * 5),
                              color: i.isEven ? accent : accentSoft,
                            ),
                          ),
                        );
                      },
                    );
                  }),

                  // --- (NEW) 4a. AMBIENT HUE-CYCLING GLOW ORB (behind word) ---
                  AnimatedBuilder(
                    animation: Listenable.merge([_ambientController, _hueController]),
                    builder: (context, child) {
                      final v = _ambientController.value;
                      final glowColor = _cycledColor(_hueController.value);
                      return Positioned(
                        bottom: 34,
                        child: Container(
                          width: 260 + (v * 20),
                          height: 90 + (v * 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(100),
                            gradient: RadialGradient(
                              colors: [
                                glowColor.withValues(alpha: isDarkMode ? 0.18 : 0.10),
                                glowColor.withValues(alpha: 0.0),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                  // --- 4b. SOFT FLOATING SHADOW BENEATH THE WORD ---
                  Positioned(
                    bottom: 28,
                    child: AnimatedBuilder(
                      animation: _ambientController,
                      builder: (context, child) {
                        final v = _ambientController.value;
                        return Container(
                          width: 190 + (v * 8),
                          height: 10,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(50),
                            color: Colors.black.withValues(alpha: isDarkMode ? 0.35 : 0.08),
                            boxShadow: [
                              BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.15), blurRadius: 12),
                            ],
                          ),
                        );
                      },
                    ),
                  ),

                  // --- 5. OPTICAL DIVIDER ---
                  Positioned(
                    bottom: 12 + 44,
                    left: 195,
                    child: Container(width: 45, height: 15, color: bgColor),
                  ),

                  // --- 6. TEXT AND ANIMATED LETTERS (shimmer sweep) ---
                  Positioned(
                    bottom: 44,
                    child: MediaQuery(
                      data: MediaQuery.of(context)
                          .copyWith(textScaler: const TextScaler.linear(1.0)),
                      child: AnimatedBuilder(
                        animation: _ambientController,
                        builder: (context, child) {
                          final t = _ambientController.value;
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
                            SizedBox(
                              width: 25,
                              height: 55,
                              child: Stack(
                                alignment: Alignment.bottomLeft,
                                children: [
                                  Container(width: 25, height: 6.5, color: elementColor),
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

                  // --- 7a. LANDING IMPACT RIPPLES ---
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final t = _controller.value;
                      final phase = (t * 2) % 1.0;
                      final impact =
                          (1 - (phase < 0.5 ? phase * 2 : (1 - phase) * 2)).clamp(0.0, 1.0);
                      final onlyNearImpact = impact > 0.82 ? (impact - 0.82) / 0.18 : 0.0;
                      final pos = _dotPosition(t);
                      return Positioned(
                        left: pos.x - 10,
                        top: 62,
                        child: Opacity(
                          opacity: onlyNearImpact * 0.5,
                          child: Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: accent.withValues(alpha: 0.7), width: 1.4),
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                  // --- 7b. COMET GHOST TRAIL ---
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
                          top: pos.y + 24,
                          child: Opacity(
                            opacity: fade * 0.45,
                            child: Container(
                              width: size,
                              height: size,
                              decoration: BoxDecoration(color: accentSoft, shape: BoxShape.circle),
                            ),
                          ),
                        );
                      },
                    );
                  }),

                  // --- 7c. THE FLYING DOT ---
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final t = _controller.value;
                      final pos = _dotPosition(t);
                      return Positioned(
                        left: pos.x,
                        top: pos.y + 24,
                        child: Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: accent,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(color: accent.withValues(alpha: 0.85), blurRadius: 10, spreadRadius: 1.5),
                              BoxShadow(color: accentSoft.withValues(alpha: 0.4), blurRadius: 18, spreadRadius: 2),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                  // --- (NEW) 8. SEQUENTIAL BOTTOM STATUS DOTS ---
                  Positioned(
                    bottom: 4,
                    child: AnimatedBuilder(
                      animation: _statusDotsController,
                      builder: (context, child) {
                        final t = _statusDotsController.value;
                        return Row(
                          mainAxisSize: MainAxisSize.min,
                          children: List.generate(3, (i) {
                            final localT = ((t - (i * 0.18)) % 1.0 + 1.0) % 1.0;
                            final bump = math.sin(localT * math.pi).clamp(0.0, 1.0);
                            return Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                              child: Container(
                                width: 5 + (bump * 3),
                                height: 5 + (bump * 3),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color.lerp(
                                      elementColor.withValues(alpha: 0.25), accent, bump),
                                ),
                              ),
                            );
                          }),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Small L-shaped tech corner bracket. quadrant: 0=TL,1=TR,2=BL,3=BR
  Widget _corner(Color color, int quadrant) {
    final bool flipX = quadrant == 1 || quadrant == 3;
    final bool flipY = quadrant == 2 || quadrant == 3;
    return Transform(
      alignment: Alignment.center,
      transform: Matrix4.identity()
        ..scale(flipX ? -1.0 : 1.0, flipY ? -1.0 : 1.0),
      child: CustomPaint(
        size: const Size(18, 18),
        painter: _CornerPainter(color),
      ),
    );
  }
}

class _CornerPainter extends CustomPainter {
  final Color color;
  _CornerPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset.zero, Offset(size.width, 0), paint);
    canvas.drawLine(Offset.zero, Offset(0, size.height), paint);
  }

  @override
  bool shouldRepaint(covariant _CornerPainter oldDelegate) => oldDelegate.color != color;
}

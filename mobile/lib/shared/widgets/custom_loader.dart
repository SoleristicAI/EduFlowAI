import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 THEME KE LIYE NAYA IMPORT
import '../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER (path check kar lena)

// 🔥 StatefulWidget ko ConsumerStatefulWidget mein badal diya
class CustomLoader extends ConsumerStatefulWidget {
  const CustomLoader({super.key});

  @override
  ConsumerState<CustomLoader> createState() => _CustomLoaderState();
}

class _CustomLoaderState extends ConsumerState<CustomLoader> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  
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

    // 1. 'L' ki vertical line animation (Squash and Stretch)
    // CSS logic: lineStretch keyframes (1 -> 0 -> 1 based on percentages)
    // Full height = 36px. We animate the height directly.
    _lLineHeightAnim = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 36.0), weight: 45),                     // Rest
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 9.0).chain(CurveTween(curve: Curves.easeOut)), weight: 4),   // Squash
      TweenSequenceItem(tween: Tween(begin: 9.0, end: 4.5), weight: 1),                        // Max squash
      TweenSequenceItem(tween: Tween(begin: 4.5, end: 18.0).chain(CurveTween(curve: Curves.easeIn)), weight: 3),   // Recovering
      TweenSequenceItem(tween: Tween(begin: 18.0, end: 36.0), weight: 7),                      // Full height
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 29.0), weight: 8),                      // Slight bounce
      TweenSequenceItem(tween: Tween(begin: 29.0, end: 36.0), weight: 2),                      // Settle
      TweenSequenceItem(tween: Tween(begin: 36.0, end: 36.0), weight: 30),                     // Rest
    ]).animate(_controller);

    // 2. 'i' ki stem animation (Squash and Stretch)
    // CSS logic: letterStretch keyframes
    _iStretchAnim = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.35, end: 2.125).chain(CurveTween(curve: Curves.easeOutCubic)), weight: 8), 
      TweenSequenceItem(tween: Tween(begin: 2.125, end: 2.125), weight: 20), 
      TweenSequenceItem(tween: Tween(begin: 2.125, end: 0.875).chain(CurveTween(curve: Curves.easeInOut)), weight: 9), 
      TweenSequenceItem(tween: Tween(begin: 0.875, end: 1.03).chain(CurveTween(curve: Curves.easeOut)), weight: 9), 
      TweenSequenceItem(tween: Tween(begin: 1.03, end: 1.0), weight: 4), 
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.0), weight: 47), 
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.35).chain(CurveTween(curve: Curves.easeIn)), weight: 3), 
    ]).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 GLOBAL THEME CHECK
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    // 🔥 DYNAMIC COLORS
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : Colors.white;
    final Color elementColor = isDarkMode ? Colors.white : Colors.black; // Text & Dot color

    final TextStyle textStyle = TextStyle(
      fontFamily: 'Roboto',
      fontSize: 55,
      fontWeight: FontWeight.w300,
      color: elementColor, // 🔥 Dynamic Text Color
      height: 1.0,
    );

    return Scaffold(
      backgroundColor: bgColor, // 🔥 Dynamic Background
      body: Center(
        child: Transform.scale(
          scale: 0.85,
          child: SizedBox(
            width: 320,
            height: 120,
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                
                // --- 1. OPTICAL DIVIDER (To hide lower parts if needed) ---
                Positioned(
                  bottom: 12,
                  left: 175,
                  child: Container(
                    width: 45,
                    height: 15,
                    color: bgColor, // 🔥 Divider background match karega
                  ),
                ),

                // --- 2. TEXT AND ANIMATED LETTERS ---
                Positioned(
                  bottom: 20,
                  child: MediaQuery(
                    data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(1.0)),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        
                        // --- THE LETTER 'L' ---
                        // Instead of a text mask, we draw the exact 'L' using containers.
                        SizedBox(
                          width: 25,
                          height: 55,
                          child: Stack(
                            alignment: Alignment.bottomLeft,
                            children: [
                              // The horizontal base of L
                              Container(
                                width: 25,
                                height: 4.5,
                                color: elementColor, // 🔥 Dynamic
                              ),
                              // The vertical animated stem of L
                              AnimatedBuilder(
                                animation: _lLineHeightAnim,
                                builder: (context, child) {
                                  return Container(
                                    width: 4.5,
                                    height: _lLineHeightAnim.value + 4.5, // Total height based on animation
                                    color: elementColor, // 🔥 Dynamic
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

                        // --- THE LETTER 'i' (Without the dot) ---
                        // Drawn custom so there is NO extra dot. The flying ball IS the dot.
                        SizedBox(
                          width: 15,
                          height: 55, // Fixed container height
                          child: Align(
                            alignment: Alignment.bottomCenter,
                            child: AnimatedBuilder(
                              animation: _iStretchAnim,
                              builder: (context, child) {
                                return Transform(
                                  alignment: Alignment.bottomCenter,
                                  transform: Matrix4.identity()..scale(1.0, _iStretchAnim.value),
                                  child: Container(
                                    width: 4.5,
                                    height: 38, // Base height of the stem
                                    color: elementColor, // 🔥 Dynamic
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

                // --- 3. THE FLYING DOT (The actual dot of the 'i') ---
                AnimatedBuilder(
                  animation: _controller,
                  builder: (context, child) {
                    double t = _controller.value;
                    
                    // X trajectory
                    const double startX = 35.0;     // Exact top of 'L'
                    const double endX = 188.0;      // Exact top of 'i' stem
                    
                    // Y trajectory
                    const double baseY = 18.0;      // Standard resting height over 'i'
                    const double jumpHeight = 35.0; // Height of the parabola
                    
                    // Math logic for parabolic bounce
                    double progress = 0.5 - 0.5 * math.cos(t * math.pi * 2);
                    double currentX = startX + (endX - startX) * progress;
                    double currentY = baseY - (math.sin(t * math.pi * 2).abs() * jumpHeight);

                    return Positioned(
                      left: currentX,
                      top: currentY,
                      child: Container(
                        width: 7, // Size of the 'i' dot
                        height: 7,
                        decoration: BoxDecoration(
                          color: elementColor, // 🔥 Dynamic
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  }
                ),

              ],
            ),
          ),
        ),
      ),
    );
  }
}
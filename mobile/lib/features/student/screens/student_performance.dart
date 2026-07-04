import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:visibility_detector/visibility_detector.dart'; // NAYA PACKAGE
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';

// ==========================================
// 1. CUSTOM UI COMPONENTS (CIRCULAR CHARTS)
// ==========================================

class RadialGaugePainter extends CustomPainter {
  final double percentage;
  final Color color;
  final bool withGlow;
  final double strokeWidth; // 🔥 NAYA: Line ki motai control karne ke liye

  RadialGaugePainter({
    required this.percentage, 
    required this.color, 
    this.withGlow = false,
    this.strokeWidth = 12.0, // Default 12 rakha hai bade walo ke liye
  });

  @override
  void paint(Canvas canvas, Size size) {
    Paint backgroundPaint = Paint()
      ..color = Colors.blue.shade50
      ..strokeWidth = strokeWidth // 🔥 Updated
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    Paint foregroundPaint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth // 🔥 Updated
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    if (withGlow) {
      foregroundPaint.imageFilter = ui.ImageFilter.blur(sigmaX: 4, sigmaY: 4);
    }

    Offset center = Offset(size.width / 2, size.height / 2);
    double radius = math.min(size.width / 2, size.height / 2) - (strokeWidth / 2); // Radius theek kiya

    // Background Circle
    canvas.drawCircle(center, radius, backgroundPaint);

    // Foreground Arc (Animated)
    double sweepAngle = 2 * math.pi * (percentage / 100);
    
    // Draw Glow
    if (withGlow) {
      canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -math.pi / 2, sweepAngle, false, foregroundPaint);
      foregroundPaint.imageFilter = null;
    }
    
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -math.pi / 2, sweepAngle, false, foregroundPaint);
  }

  @override
  bool shouldRepaint(covariant RadialGaugePainter oldDelegate) {
    return oldDelegate.percentage != percentage || 
           oldDelegate.color != color || 
           oldDelegate.strokeWidth != strokeWidth;
  }
}

// ==========================================
// 2. MAIN DASHBOARD COMPONENT
// ==========================================

class StudentPerformance extends StatefulWidget {
  const StudentPerformance({super.key});

  @override
  State<StudentPerformance> createState() => _StudentPerformanceState();
}

class _StudentPerformanceState extends State<StudentPerformance> {
  bool loading = true;
  Map<String, dynamic>? studentProfile;
  Map<String, dynamic>? analytics;

  // 🔥 NAYA STATE: Animation ko control karne ke liye
  bool _isSubjectGridVisible = false; 

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      studentProfile = jsonDecode(userStr);
    }
    await _fetchAndCalculatePerformance();
  }

  Future<void> _fetchAndCalculatePerformance() async {
    try {
      final response = await ApiClient.dio.get('/exam-results/my-performance');
      final rawData = response.data as List<dynamic>;

      if (rawData.isEmpty) {
        if (mounted) setState(() { analytics = null; loading = false; });
        return;
      }

      double totalMarksObtained = 0;
      double totalMaxMarks = 0;
      Map<String, Map<String, double>> subjectMap = {};

      for (var exam in rawData) {
        if (exam['subjects'] != null) {
          for (var sub in exam['subjects']) {
            double obt = double.tryParse(sub['marksObtained'].toString()) ?? 0;
            double max = double.tryParse(sub['maxMarks'].toString()) ?? 0;
            String subName = sub['subjectName'] ?? 'Unknown';

            totalMarksObtained += obt;
            totalMaxMarks += max;

            if (!subjectMap.containsKey(subName)) {
              subjectMap[subName] = {'obtained': 0, 'max': 0};
            }
            subjectMap[subName]!['obtained'] = subjectMap[subName]!['obtained']! + obt;
            subjectMap[subName]!['max'] = subjectMap[subName]!['max']! + max;
          }
        }
      }

      double overallPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

      List<Map<String, dynamic>> subjectAverages = [];
      subjectMap.forEach((key, value) {
        double avg = value['max']! > 0 ? (value['obtained']! / value['max']!) * 100 : 0;
        subjectAverages.add({'subject': key, 'avg': avg});
      });

      subjectAverages.sort((a, b) => b['avg'].compareTo(a['avg']));

      if (mounted) {
        setState(() {
          analytics = {
            'overallPercentage': overallPercentage,
            'totalExams': rawData.length,
            'subjectAverages': subjectAverages,
            'strongestSubject': subjectAverages.isNotEmpty ? subjectAverages.first : null,
            'weakestSubject': subjectAverages.isNotEmpty ? subjectAverages.last : null,
            'recentExams': rawData
          };
          loading = false;
        });
      }
    } catch (e) {
      _showToast("Failed to fetch real performance data.", isError: true);
      if (mounted) setState(() => loading = false);
    }
  }

  Color _getStatusColor(double percentage) {
    if (percentage < 40) return const Color(0xFFF43F5E); // Rose
    if (percentage < 70) return const Color(0xFFF59E0B); // Amber
    if (percentage < 85) return const Color(0xFF42A5F5); // Blue
    return const Color(0xFF10B981); // Emerald
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 13)),
        backgroundColor: isError ? Colors.redAccent : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.all(20),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) context.pop();
        else context.go('/');
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: Colors.white,
          onRefresh: _fetchAndCalculatePerformance,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 50),
            child: Column(
              children: [
                // --- EDUFLOW AI SIGNATURE HEADER ---
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.only(top: 60, bottom: 90),
                  decoration: const BoxDecoration(
                    color: Color(0xFF42A5F5),
                    gradient: LinearGradient(
                      colors: [Color(0xFF64B5F6), Color(0xFF42A5F5)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.vertical(bottom: Radius.circular(55)),
                    boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (context.canPop()) context.pop();
                                else context.go('/');
                              },
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.3)),
                                ),
                                child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                              ),
                            ),
                            Column(
                              children: [
                                const Text("My Progress", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                Text("ACADEMIC PERFORMANCE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white.withOpacity(0.3)),
                              ),
                              child: const Icon(Icons.book_outlined, color: Colors.white, size: 22),
                            ),
                          ],
                        ),
                        const SizedBox(height: 30),
                        
                        // Student Identity Badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(color: Colors.white.withOpacity(0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.account_circle, color: Colors.white, size: 18),
                              const SizedBox(width: 8),
                              Text((studentProfile?['name'] ?? 'Student').toString().toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                              Container(margin: const EdgeInsets.symmetric(horizontal: 10), width: 4, height: 4, decoration: BoxDecoration(color: Colors.white.withOpacity(0.5), shape: BoxShape.circle)),
                              Text("CLASS ${studentProfile?['grade'] ?? 'N/A'}", style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // --- CONTENT AREA ---
                Transform.translate(
                  offset: const Offset(0, -50),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: analytics != null
                        ? Column(
                            children: [
                              // 1. HERO METRICS GRID
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(32),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(45),
                                  border: Border.all(color: const Color(0xFFF1F5F9)),
                                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))],
                                ),
                                child: Column(
                                  children: [
                                    // Main Gauge Animated
                                    TweenAnimationBuilder<double>(
                                      tween: Tween<double>(begin: 0, end: analytics!['overallPercentage']),
                                      duration: const Duration(seconds: 2),
                                      curve: Curves.easeOutCubic,
                                      builder: (context, value, child) {
                                        return SizedBox(
                                          width: 180, height: 180,
                                          child: Stack(
                                            alignment: Alignment.center,
                                            children: [
                                              CustomPaint(
                                                size: const Size(180, 180),
                                                // Yahan badi line theek hai
                                                painter: RadialGaugePainter(percentage: value, color: _getStatusColor(value), withGlow: true, strokeWidth: 12.0),
                                              ),
                                              Column(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(value.toStringAsFixed(1), style: const TextStyle(fontSize: 38, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1.5, fontStyle: FontStyle.italic)),
                                                      const Padding(padding: EdgeInsets.only(top: 4), child: Text("%", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8)))),
                                                    ],
                                                  ),
                                                  const Text("TOTAL SCORE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2)),
                                                ],
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    ).animate().fadeIn(duration: 500.ms).scale(begin: const Offset(0.8, 0.8)),
                                    
                                    const SizedBox(height: 30),
                                    
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Container(
                                            padding: const EdgeInsets.all(16),
                                            decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(25), border: Border.all(color: Colors.blue.shade100)),
                                            child: Column(
                                              children: [
                                                Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.blue.shade100, shape: BoxShape.circle), child: const Icon(Icons.menu_book, color: Color(0xFF42A5F5), size: 20)),
                                                const SizedBox(height: 10),
                                                const Text("TOTAL EXAMS", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5)),
                                                Text(analytics!['totalExams'].toString(), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5))),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Container(
                                            padding: const EdgeInsets.all(16),
                                            decoration: BoxDecoration(color: const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(25), border: Border.all(color: const Color(0xFFD1FAE5))),
                                            child: Column(
                                              children: [
                                                Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: const Color(0xFFD1FAE5), shape: BoxShape.circle), child: const Icon(Icons.track_changes, color: Color(0xFF10B981), size: 20)),
                                                const SizedBox(height: 10),
                                                const Text("STATUS", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5)),
                                                Text(
                                                  analytics!['overallPercentage'] >= 85 ? 'EXCELLENT' : analytics!['overallPercentage'] >= 70 ? 'GOOD' : analytics!['overallPercentage'] >= 40 ? 'AVERAGE' : 'NEEDS HELP',
                                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF059669)),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ).animate().slideY(begin: 0.2).fadeIn(delay: 200.ms),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),

                              // 2. SMART ADVICE CARD
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(40), border: Border.all(color: const Color(0xFFF1F5F9)), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(18), border: Border.all(color: Colors.blue.shade100)), child: const Icon(Icons.psychology, color: Color(0xFF42A5F5), size: 28)),
                                        const SizedBox(width: 16),
                                        const Text("TEACHER'S INSIGHT", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF334155), letterSpacing: 1.5)),
                                      ],
                                    ),
                                    const SizedBox(height: 20),
                                    if (analytics!['strongestSubject'] != null)
                                      Container(
                                        padding: const EdgeInsets.all(16),
                                        margin: const EdgeInsets.only(bottom: 12),
                                        decoration: BoxDecoration(color: const Color(0xFFECFDF5).withOpacity(0.5), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFD1FAE5))),
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Icon(Icons.star, size: 16, color: Color(0xFF10B981)),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: RichText(
                                                text: TextSpan(
                                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569), fontStyle: FontStyle.italic, fontFamily: 'Nunito', height: 1.4),
                                                  children: [
                                                    const TextSpan(text: "You are doing great in "),
                                                    TextSpan(text: "${analytics!['strongestSubject']['subject']}".toUpperCase(), style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w900)),
                                                    TextSpan(text: " with ${analytics!['strongestSubject']['avg'].toStringAsFixed(1)}%. Keep up the good work!"),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    if (analytics!['weakestSubject'] != null && analytics!['weakestSubject']['avg'] < 70)
                                      Container(
                                        padding: const EdgeInsets.all(16),
                                        decoration: BoxDecoration(color: const Color(0xFFFFF1F2).withOpacity(0.5), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFFFE4E6))),
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Icon(Icons.error_outline, size: 16, color: Color(0xFFF43F5E)),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: RichText(
                                                text: TextSpan(
                                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569), fontStyle: FontStyle.italic, fontFamily: 'Nunito', height: 1.4),
                                                  children: [
                                                    const TextSpan(text: "Your marks in "),
                                                    TextSpan(text: "${analytics!['weakestSubject']['subject']}".toUpperCase(), style: const TextStyle(color: Color(0xFFE11D48), fontWeight: FontWeight.w900)),
                                                    const TextSpan(text: " are a bit low. You should focus more on this subject."),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                  ],
                                ),
                              ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1),
                              const SizedBox(height: 24),

                              // 3. SUBJECT PERFORMANCE GRID
                              Row(
                                children: [
                                  Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.show_chart, color: Color(0xFF42A5F5), size: 16)),
                                  const SizedBox(width: 10),
                                  const Text("SUBJECT PERFORMANCE", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF334155), letterSpacing: 1.5)),
                                ],
                              ),
                              const SizedBox(height: 16),
                              
                              // 🔥 JADOO: VisibilityDetector for Scroll Animation (React whileInView)
                              VisibilityDetector(
                                key: const Key('subject-grid-animation'),
                                onVisibilityChanged: (info) {
                                  // Agar 20% hissa bhi screen par aa gaya, toh ghoomna shuru kar do!
                                  if (info.visibleFraction > 0.2 && !_isSubjectGridVisible) {
                                    if (mounted) setState(() => _isSubjectGridVisible = true);
                                  }
                                },
                                child: Wrap(
                                  spacing: 12, runSpacing: 12, alignment: WrapAlignment.center,
                                  children: (analytics!['subjectAverages'] as List<dynamic>).asMap().entries.map((entry) {
                                    int idx = entry.key;
                                    var sub = entry.value;
                                    Color sColor = _getStatusColor(sub['avg']);
                                    
                                    return Container(
                                      width: (MediaQuery.of(context).size.width - 60) / 2, 
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(30), border: Border.all(color: const Color(0xFFF1F5F9)), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))]),
                                      child: Column(
                                        children: [
                                          TweenAnimationBuilder<double>(
                                            // 🔥 NAYA: Animation tab tak 0 rahegi jab tak screen par na aaye
                                            tween: Tween<double>(begin: 0, end: _isSubjectGridVisible ? sub['avg'] : 0),
                                            duration: const Duration(milliseconds: 1500),
                                            curve: Curves.easeOut,
                                            builder: (context, value, child) {
                                              return SizedBox(
                                                width: 70, height: 70,
                                                child: Stack(
                                                  alignment: Alignment.center,
                                                  children: [
                                                    CustomPaint(
                                                      size: const Size(70, 70), 
                                                      // 🔥 NAYA: Yahan line patli kardi medium size ke liye
                                                      painter: RadialGaugePainter(percentage: value, color: sColor, strokeWidth: 7.0)
                                                    ),
                                                    Text("${value.toStringAsFixed(0)}%", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF334155), fontStyle: FontStyle.italic)),
                                                  ],
                                                ),
                                              );
                                            },
                                          ),
                                          const SizedBox(height: 12),
                                          Container(
                                            width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                                            decoration: BoxDecoration(color: sColor.withOpacity(0.1), borderRadius: BorderRadius.circular(15)),
                                            child: Text(sub['subject'].toString().toUpperCase(), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: sColor, letterSpacing: 1.5)),
                                          )
                                        ],
                                      ),
                                    ).animate().scale(delay: Duration(milliseconds: 400 + (100 * idx))).fadeIn();
                                  }).toList(),
                                ),
                              ),
                              const SizedBox(height: 32),

                              // 4. EXAM RESULTS LIST
                              Row(
                                children: [
                                  Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.bolt, color: Color(0xFF6366F1), size: 16)),
                                  const SizedBox(width: 10),
                                  const Text("ALL EXAM RESULTS", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF334155), letterSpacing: 1.5)),
                                ],
                              ),
                              const SizedBox(height: 16),
                              ...analytics!['recentExams'].asMap().entries.map((entry) {
                                int idx = entry.key;
                                var exam = entry.value;
                                double obt = 0; double max = 0;
                                for (var s in exam['subjects']) { obt += (double.tryParse(s['marksObtained'].toString()) ?? 0); max += (double.tryParse(s['maxMarks'].toString()) ?? 0); }
                                double examAvg = max > 0 ? (obt / max) * 100 : 0;

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 20),
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(40), border: Border.all(color: const Color(0xFFF1F5F9)), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Exam Header
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(exam['examTitle']?.toString().toUpperCase() ?? 'EXAM', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), fontStyle: FontStyle.italic)),
                                                const SizedBox(height: 4),
                                                Text("DATE: ${exam['date'] ?? 'N/A'}", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5)),
                                              ],
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2E8F0))),
                                            child: Row(
                                              children: [
                                                Column(
                                                  crossAxisAlignment: CrossAxisAlignment.end,
                                                  children: [
                                                    const Text("SCORE", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1)),
                                                    Text("${examAvg.toStringAsFixed(1)}%", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic)),
                                                  ],
                                                ),
                                                const SizedBox(width: 8),
                                                // 🔥 NAYA: Yahan chhota dabba hai (24x24), toh strokeWidth sirf 3.5 rakhi hai, ab bilkul perfect GOL dikhega!
                                                SizedBox(width: 24, height: 24, child: CustomPaint(painter: RadialGaugePainter(percentage: examAvg, color: const Color(0xFF42A5F5), strokeWidth: 3.5))),
                                              ],
                                            ),
                                          )
                                        ],
                                      ),
                                      const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Divider(color: Color(0xFFF1F5F9), thickness: 1)),
                                      
                                      // Subject Breakdown
                                      Column(
                                        children: exam['subjects'].map<Widget>((sub) {
                                          double sObt = double.tryParse(sub['marksObtained'].toString()) ?? 0;
                                          double sMax = double.tryParse(sub['maxMarks'].toString()) ?? 0;
                                          double sPct = sMax > 0 ? (sObt / sMax) * 100 : 0;
                                          Color dColor = _getStatusColor(sPct);

                                          return Container(
                                            margin: const EdgeInsets.only(bottom: 8),
                                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFF1F5F9))),
                                            child: Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(sub['subjectName']?.toString().toUpperCase() ?? 'SUB', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF475569))),
                                                Row(
                                                  children: [
                                                    Text("$sObt", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                                                    Text(" / $sMax", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8))),
                                                    const SizedBox(width: 10),
                                                    Container(width: 8, height: 8, decoration: BoxDecoration(color: dColor, shape: BoxShape.circle)),
                                                  ],
                                                )
                                              ],
                                            ),
                                          );
                                        }).toList(),
                                      )
                                    ],
                                  ),
                                ).animate().fadeIn(delay: Duration(milliseconds: 500 + (100 * idx))).slideY(begin: 0.1);
                              })
                            ],
                          )
                        : Container(
                            width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 50, horizontal: 20),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(40), border: Border.all(color: const Color(0xFFE2E8F0)), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]),
                            child: Column(
                              children: [
                                Container(width: 70, height: 70, decoration: BoxDecoration(color: const Color(0xFFF8FAFC), shape: BoxShape.circle, border: Border.all(color: const Color(0xFFF1F5F9))), child: const Icon(Icons.warning_amber_rounded, size: 30, color: Color(0xFF94A3B8))),
                                const SizedBox(height: 20),
                                const Text("NO RESULTS YET", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF334155), letterSpacing: 2)),
                                const SizedBox(height: 8),
                                const Text("Waiting for your teachers to publish exam results.", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), fontStyle: FontStyle.italic)),
                              ],
                            ),
                          ).animate().fadeIn().scale(begin: const Offset(0.9, 0.9)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
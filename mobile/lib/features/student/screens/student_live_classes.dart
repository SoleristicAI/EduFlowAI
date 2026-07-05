import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';

class StudentLiveClass extends StatefulWidget {
  const StudentLiveClass({super.key});

  @override
  State<StudentLiveClass> createState() => _StudentLiveClassState();
}

class _StudentLiveClassState extends State<StudentLiveClass> {
  bool loading = true;
  List<dynamic> liveClasses = [];
  Map<String, dynamic>? studentProfile;

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
    await _fetchLiveClasses();
  }

  Future<void> _fetchLiveClasses() async {
    try {
      final response = await ApiClient.dio.get('/liveclass/student-classes');

      if (mounted) {
        setState(() {
          liveClasses = response.data as List<dynamic>;
          loading = false;
        });
      }
    } catch (e) {
      _showToast("Failed to load live classes.", isError: true);
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchLiveClasses();
  }

  // --- EXTERNAL LINK LAUNCHER ---
  Future<void> _launchURL(String urlString) async {
    if (urlString.isEmpty) {
      _showToast("Invalid class link", isError: true);
      return;
    }

    final Uri url = Uri.parse(urlString);
    if (await canLaunchUrl(url)) {
      await launchUrl(url,
          mode: LaunchMode.externalApplication); // Browser me khulega
    } else {
      _showToast("Could not launch class link", isError: true);
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message,
            style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontStyle: FontStyle.italic,
                fontSize: 13)),
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
        if (context.canPop())
          context.pop();
        else
          context.go('/');
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: Colors.white,
          onRefresh: _handleRefresh,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 50),
            child: Column(
              children: [
                // --- BLUE HEADER SECTION ---
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.only(top: 60, bottom: 80),
                  decoration: const BoxDecoration(
                    color: Color(0xFF42A5F5),
                    gradient: LinearGradient(
                      colors: [Color(0xFF64B5F6), Color(0xFF42A5F5)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius:
                        BorderRadius.vertical(bottom: Radius.circular(55)),
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black12,
                          blurRadius: 15,
                          offset: Offset(0, 10))
                    ],
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
                                if (context.canPop())
                                  context.pop();
                                else
                                  context.go('/');
                              },
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: Colors.white.withOpacity(0.3)),
                                ),
                                child: const Icon(Icons.arrow_back,
                                    color: Colors.white, size: 22),
                              ),
                            ),
                            Column(
                              children: [
                                const Text("Live Classes",
                                    style: TextStyle(
                                        fontSize: 32,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        fontStyle: FontStyle.italic,
                                        letterSpacing: -1)),
                                Text("DIGITAL CLASSROOMS",
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white.withOpacity(0.9),
                                        letterSpacing: 2)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.3)),
                              ),
                              child: const Icon(Icons.videocam,
                                  color: Colors.white, size: 22),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // --- CONTENT AREA ---
                Transform.translate(
                  offset: const Offset(0, -40),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        // Identity Badge
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(35),
                              border: Border.all(
                                  color: Colors.blue.shade50, width: 2),
                              boxShadow: const [
                                BoxShadow(
                                    color: Colors.black12,
                                    blurRadius: 15,
                                    offset: Offset(0, 5))
                              ]),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                          color: Colors.blue.shade50,
                                          borderRadius:
                                              BorderRadius.circular(20),
                                          border: Border.all(
                                              color: Colors.blue.shade100)),
                                      child: const Icon(Icons.live_tv,
                                          color: Color(0xFF42A5F5), size: 20)),
                                  const SizedBox(width: 16),
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text("ENROLLED CLASS",
                                          style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w900,
                                              color: Color(0xFF94A3B8),
                                              letterSpacing: 1.5)),
                                      const SizedBox(height: 2),
                                      Text(
                                          studentProfile?['grade']
                                                  ?.toString()
                                                  .toUpperCase() ??
                                              'LOADING...',
                                          style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w900,
                                              color: Color(0xFF1E3A8A),
                                              letterSpacing: 1.5)),
                                    ],
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(
                                    color: const Color(0xFFECFDF5),
                                    borderRadius: BorderRadius.circular(15),
                                    border: Border.all(
                                        color: const Color(0xFFD1FAE5))),
                                child: const Text("ACTIVE",
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF059669),
                                        letterSpacing: 1.5)),
                              )
                            ],
                          ),
                        ).animate().fadeIn().slideY(begin: 0.1),
                        const SizedBox(height: 24),

                        // Classes List
                        liveClasses.isEmpty
                            ? Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(
                                    vertical: 50, horizontal: 20),
                                decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(40),
                                    border: Border.all(
                                        color: const Color(0xFFE2E8F0),
                                        width: 2),
                                    boxShadow: const [
                                      BoxShadow(
                                          color: Colors.black12,
                                          blurRadius: 20,
                                          offset: Offset(0, 10))
                                    ]),
                                child: Column(
                                  children: [
                                    Container(
                                        width: 70,
                                        height: 70,
                                        decoration: BoxDecoration(
                                            color: const Color(0xFFF8FAFC),
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                                color:
                                                    const Color(0xFFF1F5F9))),
                                        child: const Icon(Icons.videocam_off,
                                            size: 30,
                                            color: Color(0xFF94A3B8))),
                                    const SizedBox(height: 20),
                                    const Text("NO LIVE CLASSES",
                                        style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w900,
                                            color: Color(0xFF334155),
                                            letterSpacing: 2)),
                                    const SizedBox(height: 8),
                                    const Text(
                                        "No live classes scheduled currently.",
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF94A3B8),
                                            fontStyle: FontStyle.italic)),
                                  ],
                                ),
                              )
                                .animate()
                                .fadeIn()
                                .scale(begin: const Offset(0.9, 0.9))
                            : Column(
                                children:
                                    liveClasses.asMap().entries.map((entry) {
                                  int idx = entry.key;
                                  var cls = entry.value;

                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 20),
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(40),
                                        border: Border.all(
                                            color: const Color(0xFFF1F5F9)),
                                        boxShadow: const [
                                          BoxShadow(
                                              color: Colors.black12,
                                              blurRadius: 15,
                                              offset: Offset(0, 5))
                                        ]),
                                    child: Column(
                                      children: [
                                        // Top Row (Subject & Platform Badge)
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                      cls['subjectName']
                                                              ?.toString()
                                                              .toUpperCase() ??
                                                          'SUBJECT',
                                                      style: const TextStyle(
                                                          fontSize: 18,
                                                          fontWeight:
                                                              FontWeight.w900,
                                                          color:
                                                              Color(0xFF1E293B),
                                                          fontStyle:
                                                              FontStyle.italic,
                                                          height: 1.1)),
                                                  const SizedBox(height: 8),
                                                  Row(
                                                    children: [
                                                      const Icon(Icons.person,
                                                          size: 14,
                                                          color: Color(
                                                              0xFF42A5F5)),
                                                      const SizedBox(width: 6),
                                                      Expanded(
                                                          child: Text(
                                                              "BY ${cls['proposerName']?.toString().toUpperCase() ?? 'TEACHER'}",
                                                              maxLines: 1,
                                                              overflow:
                                                                  TextOverflow
                                                                      .ellipsis,
                                                              style: const TextStyle(
                                                                  fontSize: 10,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .w900,
                                                                  color: Color(
                                                                      0xFF94A3B8),
                                                                  letterSpacing:
                                                                      1.5))),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Container(
                                              width: 36,
                                              height: 36,
                                              decoration: BoxDecoration(
                                                  color: Colors.blue.shade50,
                                                  shape: BoxShape.circle,
                                                  border: Border.all(
                                                      color: Colors
                                                          .blue.shade100)),
                                              alignment: Alignment.center,
                                              child: Text(
                                                  cls['platform'] == 'Zoom'
                                                      ? 'Z'
                                                      : 'GM',
                                                  style: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color:
                                                          Color(0xFF42A5F5))),
                                            )
                                          ],
                                        ),
                                        const SizedBox(height: 20),

                                        // Timing Box
                                        Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(
                                              color: Colors.blue.shade50
                                                  .withOpacity(0.5),
                                              borderRadius:
                                                  BorderRadius.circular(20),
                                              border: Border.all(
                                                  color: Colors.blue.shade100)),
                                          child: Column(
                                            children: [
                                              Row(
                                                children: [
                                                  const Icon(
                                                      Icons.calendar_today,
                                                      size: 16,
                                                      color: Color(0xFF42A5F5)),
                                                  const SizedBox(width: 10),
                                                  Text(cls['date'] ?? 'N/A',
                                                      style: const TextStyle(
                                                          fontSize: 12,
                                                          fontWeight:
                                                              FontWeight.w900,
                                                          color:
                                                              Color(0xFF334155),
                                                          letterSpacing: 1.5)),
                                                ],
                                              ),
                                              const Padding(
                                                  padding: EdgeInsets.symmetric(
                                                      vertical: 8),
                                                  child: Divider(
                                                      color: Colors.white,
                                                      thickness: 1)),
                                              Row(
                                                children: [
                                                  const Icon(Icons.access_time,
                                                      size: 16,
                                                      color: Color(0xFF42A5F5)),
                                                  const SizedBox(width: 10),
                                                  Text(
                                                      "${cls['startTime']} - ${cls['endTime']}",
                                                      style: const TextStyle(
                                                          fontSize: 12,
                                                          fontWeight:
                                                              FontWeight.w900,
                                                          color:
                                                              Color(0xFF334155),
                                                          letterSpacing: 1.5)),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 20),

                                        // Join Button
                                        GestureDetector(
                                          onTap: () => _launchURL(
                                              cls['studentLink'] ?? ''),
                                          child: Container(
                                            width: double.infinity,
                                            padding: const EdgeInsets.symmetric(
                                                vertical: 18),
                                            decoration: BoxDecoration(
                                                color: const Color(0xFF42A5F5),
                                                borderRadius:
                                                    BorderRadius.circular(25),
                                                border: const Border(
                                                    bottom: BorderSide(
                                                        color:
                                                            Color(0xFF1D4ED8),
                                                        width:
                                                            4)), // border-b-4 border-blue-700 from tailwind
                                                boxShadow: [
                                                  BoxShadow(
                                                      color: const Color(
                                                              0xFF42A5F5)
                                                          .withOpacity(0.4),
                                                      blurRadius: 15,
                                                      offset:
                                                          const Offset(0, 5))
                                                ]),
                                            child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                const Icon(Icons.link,
                                                    color: Colors.white,
                                                    size: 18),
                                                const SizedBox(width: 8),
                                                Text(
                                                    "JOIN CLASS (${(cls['platform'] ?? 'LINK').toString().toUpperCase()})",
                                                    style: const TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w900,
                                                        color: Colors.white,
                                                        letterSpacing: 2)),
                                              ],
                                            ),
                                          ),
                                        )
                                      ],
                                    ),
                                  )
                                      .animate()
                                      .fadeIn(
                                          delay:
                                              Duration(milliseconds: 100 * idx))
                                      .slideY(begin: 0.1);
                                }).toList(),
                              )
                      ],
                    ),
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

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class AssignTransportScreen extends ConsumerStatefulWidget {
  const AssignTransportScreen({super.key});

  @override
  ConsumerState<AssignTransportScreen> createState() => _AssignTransportScreenState();
}

class _AssignTransportScreenState extends ConsumerState<AssignTransportScreen> {
  int step = 1; // 1: Routes, 2: Classes, 3: Students
  List<dynamic> routes = [];
  List<dynamic> classes = [];
  List<dynamic> students = [];
  bool isLoadingStudents = false;

  Map<String, dynamic>? selectedRoute;
  String selectedClass = '';
  String searchQuery = '';

  Map<String, Map<String, dynamic>> pendingAssignments = {}; 
  
  // 🔥 PERSISTENT STATES 🔥
  List<String> completedRoutes = [];
  Map<String, List<String>> completedClasses = {}; 

  Map<String, dynamic>? activeStudent;
  Map<String, dynamic>? selectedStop;
  bool isUpdating = false;

  @override
  void initState() {
    super.initState();
    _loadSavedStates(); // 🔥 App khulte hi purana green state wapas aayega
    fetchRoutes();
    fetchClasses();
  }

  // ==========================================
  // 🔥 SHARED PREFERENCES LOGIC 🔥
  // ==========================================
  Future<void> _loadSavedStates() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      completedRoutes = prefs.getStringList('transport_completed_routes') ?? [];
      final classesStr = prefs.getString('transport_completed_classes');
      if (classesStr != null) {
        final Map<String, dynamic> decoded = jsonDecode(classesStr);
        completedClasses = decoded.map((k, v) => MapEntry(k, List<String>.from(v)));
      }
    });
  }

  Future<void> _saveRouteState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('transport_completed_routes', completedRoutes);
  }

  Future<void> _saveClassState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('transport_completed_classes', jsonEncode(completedClasses));
  }
  // ==========================================

  Future<void> fetchRoutes() async {
    try {
      final res = await ApiClient.dio.get('/transport/routes');
      if (mounted) setState(() => routes = res.data);
    } catch (e) {
      debugPrint("Error fetching routes: $e");
    }
  }

  Future<void> fetchClasses() async {
    try {
      final res = await ApiClient.dio.get('/users/grades/all');
      if (mounted) setState(() => classes = res.data);
    } catch (e) {
      debugPrint("Error fetching classes: $e");
    }
  }

  Future<void> fetchStudents() async {
    setState(() {
      isLoadingStudents = true;
      students = [];
    });
    try {
      final res = await ApiClient.dio.get('/users/students/${Uri.encodeComponent(selectedClass)}');
      if (mounted) setState(() => students = res.data);
    } catch (e) {
      debugPrint("Error fetching students: $e");
    } finally {
      if (mounted) setState(() => isLoadingStudents = false);
    }
  }

  Future<void> handleGlobalUpdate() async {
    final assignmentArray = pendingAssignments.keys.map((studentId) => {
      'studentId': studentId,
      'stopName': pendingAssignments[studentId]!['stopName'],
      'stopPrice': pendingAssignments[studentId]!['price'],
    }).toList();

    if (assignmentArray.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("No new changes to save!")));
      return;
    }

    setState(() => isUpdating = true);
    try {
      await ApiClient.dio.put('/transport/assign-students', data: {
        'routeId': selectedRoute!['_id'],
        'assignments': assignmentArray,
      });

      setState(() {
        final routeId = selectedRoute!['_id'];
        final currentClasses = completedClasses[routeId] ?? [];
        if (!currentClasses.contains(selectedClass)) {
          currentClasses.add(selectedClass);
        }
        completedClasses[routeId] = currentClasses;
        _saveClassState(); // 🔥 State saved permanently

        pendingAssignments.clear();
        searchQuery = '';
        step = 2;
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Saved successfully! ✅")));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Failed to save details.")));
    } finally {
      if (mounted) setState(() => isUpdating = false);
    }
  }

  void handleFinalizeRoute() {
    setState(() {
      if (selectedRoute != null) {
        if (!completedRoutes.contains(selectedRoute!['_id'])) {
          completedRoutes.add(selectedRoute!['_id']);
          _saveRouteState(); // 🔥 Route state saved permanently
        }
      }
      searchQuery = '';
      selectedClass = '';
      selectedRoute = null;
      step = 1;
    });
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 DARK MODE THEME VARIABLES 🔥
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final textPrimary = isDark ? Colors.white : const Color(0xFF1E293B);
    final textSec = isDark ? const Color(0xFF94A3B8) : Colors.grey;
    final inputBg = isDark ? const Color(0xFF0F172A) : Colors.white;

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.fromLTRB(20, 60, 20, 40),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFF42A5F5),
                    borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(36), bottomRight: Radius.circular(36)),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () {
                          if (step > 1) {
                            setState(() => step--);
                          } else {
                            context.pop();
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
                          child: const Icon(Icons.arrow_back, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Setup Transport", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                          Text("ADD STUDENTS TO BUSES", style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  step == 1 ? 'Select a bus route' : step == 2 ? 'Choose a class' : 'Select bus stop',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary),
                                ),
                                Text(
                                  step == 1 ? 'Choose active route' : step == 2 ? 'Route: ${selectedRoute?['routeName']}' : 'Class: $selectedClass',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textSec),
                                ),
                              ],
                            ),
                          ),
                          if (step == 2 && (completedClasses[selectedRoute?['_id']] ?? []).isNotEmpty)
                            ElevatedButton(
                              onPressed: () => _showRouteConfirmDialog(isDark, cardColor, textPrimary, textSec),
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                              child: const Text("Done with Route", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900)),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    TextField(
                      onChanged: (val) => setState(() => searchQuery = val),
                      style: TextStyle(color: textPrimary, fontWeight: FontWeight.bold),
                      decoration: InputDecoration(
                        hintText: step == 1 ? 'Search routes...' : step == 2 ? 'Search classes...' : 'Search students...',
                        hintStyle: TextStyle(color: textSec),
                        prefixIcon: Icon(Icons.search, color: textSec),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 16),

                    if (step == 1) ..._buildRouteList(isDark, cardColor, cardBorder, textPrimary, textSec),
                    if (step == 2) ..._buildClassList(isDark, cardColor, cardBorder, textPrimary, textSec),
                    if (step == 3) ..._buildStudentList(isDark, cardColor, cardBorder, textPrimary, textSec),

                    const SizedBox(height: 100),
                  ]),
                ),
              ),
            ],
          ),

          if (step == 3 && pendingAssignments.isNotEmpty)
            Positioned(
              left: 20, right: 20, bottom: 20,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(24), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text("${pendingAssignments.length} Students Selected", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: textPrimary)),
                          Text("Ready to save!", style: TextStyle(color: textSec, fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: isUpdating ? null : handleGlobalUpdate,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF42A5F5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                      child: Text(isUpdating ? 'Saving...' : 'Save & Go Back', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _buildRouteList(bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec) {
    final filtered = routes.where((r) => r['routeName'].toLowerCase().contains(searchQuery.toLowerCase())).toList();
    if (filtered.isEmpty) return [Center(child: Padding(padding: const EdgeInsets.all(40), child: Text("No Routes Found", style: TextStyle(color: textSec))))];

    return filtered.map((route) {
      final isSelected = selectedRoute?['_id'] == route['_id'];
      final isCompleted = completedRoutes.contains(route['_id']);
      return GestureDetector(
        onTap: () {
          setState(() {
            selectedRoute = route;
            step = 2;
            searchQuery = '';
          });
        },
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected && !isDark ? const Color(0xFFEFF6FF) : cardColor,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isSelected ? const Color(0xFF42A5F5) : isCompleted ? const Color(0xFF10B981) : cardBorder, width: 2),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: isCompleted ? Colors.green.withValues(alpha: 0.1) : const Color(0xFF42A5F5).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
                child: Icon(Icons.map, color: isCompleted ? Colors.green : const Color(0xFF42A5F5)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(route['routeName'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: isCompleted ? Colors.green : textPrimary)),
                    Text(isCompleted ? 'Setup Done' : 'Stops: ${route['stops']?.length ?? 0}', style: TextStyle(fontSize: 10, color: isCompleted ? Colors.green : textSec, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: textSec),
            ],
          ),
        ),
      );
    }).toList();
  }

  List<Widget> _buildClassList(bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec) {
    final filtered = classes.where((c) => c.toLowerCase().contains(searchQuery.toLowerCase())).toList();
    if (filtered.isEmpty) return [Center(child: Padding(padding: const EdgeInsets.all(40), child: Text("No Classes Found", style: TextStyle(color: textSec))))];

    return [
      GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.3),
        itemCount: filtered.length,
        itemBuilder: (context, index) {
          final cls = filtered[index];
          final isCompleted = (completedClasses[selectedRoute?['_id']] ?? []).contains(cls);
          return GestureDetector(
            onTap: () {
              setState(() {
                selectedClass = cls;
                step = 3;
                searchQuery = '';
              });
              fetchStudents(); 
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isCompleted ? Colors.green : cardBorder, width: 2),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.people, color: isCompleted ? Colors.green : const Color(0xFF42A5F5), size: 28),
                  const SizedBox(height: 8),
                  Text(cls, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isCompleted ? Colors.green : textPrimary)),
                  if (isCompleted) const Text("Completed", style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.green)),
                ],
              ),
            ),
          );
        },
      )
    ];
  }

  List<Widget> _buildStudentList(bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec) {
    if (isLoadingStudents) return [const Padding(padding: EdgeInsets.all(40), child: CustomLoader())];
    
    final filtered = students.where((s) => s['name'].toLowerCase().contains(searchQuery.toLowerCase())).toList();
    if (filtered.isEmpty) return [Center(child: Padding(padding: const EdgeInsets.all(40), child: Text("No Students Found", style: TextStyle(color: textSec))))];

    return filtered.map((student) {
      final pending = pendingAssignments[student['_id']];
      final existing = student['transportRoute'];
      final isAssignedHere = existing != null && existing['_id'] == selectedRoute?['_id'];

      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: pending != null ? Colors.green : cardBorder),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(student['name'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                  const SizedBox(height: 4),
                  if (pending != null)
                    Text("Ready to save: ${pending['stopName']}", style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold))
                  else if (existing != null)
                    Text(isAssignedHere ? "Already in this bus: ${student['transportStop']?['stopName']}" : "In other bus", style: const TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.bold))
                  else
                    Text(student['address']?['fullAddress'] ?? 'No Address', style: TextStyle(color: textSec, fontSize: 10, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: () => _showStopSelectionModal(student, isDark, cardColor, textPrimary, textSec),
              style: ElevatedButton.styleFrom(backgroundColor: pending != null ? Colors.green : const Color(0xFF42A5F5), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: Text(pending != null ? 'Added' : 'Add to Bus', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      );
    }).toList();
  }

  void _showStopSelectionModal(Map<String, dynamic> student, bool isDark, Color cardColor, Color textPrimary, Color textSec) {
    showModalBottomSheet(
      context: context,
      backgroundColor: cardColor,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) {
        final stops = selectedRoute?['stops'] as List? ?? [];
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Select Bus Stop", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textPrimary)),
              Text("For: ${student['name']}", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF42A5F5))),
              const SizedBox(height: 16),
              SizedBox(
                height: 250,
                child: ListView.builder(
                  itemCount: stops.length,
                  itemBuilder: (context, index) {
                    final stop = stops[index];
                    return ListTile(
                      title: Text(stop['stopName'], style: TextStyle(fontWeight: FontWeight.w900, color: textPrimary)),
                      trailing: Text("₹${stop['monthlyPrice'] ?? stop['monthlyFee'] ?? 0}", style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF42A5F5))),
                      onTap: () {
                        setState(() {
                          pendingAssignments[student['_id']] = {
                            'stopName': stop['stopName'],
                            'price': stop['monthlyPrice'] ?? stop['monthlyFee'] ?? 0,
                          };
                        });
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showRouteConfirmDialog(bool isDark, Color cardColor, Color textPrimary, Color textSec) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: cardColor,
        title: Text("Done with this Route?", style: TextStyle(fontWeight: FontWeight.w900, color: textPrimary)),
        content: Text("Mark ${selectedRoute?['routeName']} as completely assigned?", style: TextStyle(color: textSec)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text("No", style: TextStyle(color: textSec))),
          ElevatedButton(
            onPressed: handleFinalizeRoute,
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text("Yes, I'm Done", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
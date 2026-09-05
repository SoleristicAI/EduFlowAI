import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class RouteStudentsScreen extends ConsumerStatefulWidget {
  const RouteStudentsScreen({super.key});

  @override
  ConsumerState<RouteStudentsScreen> createState() => _RouteStudentsScreenState();
}

class _RouteStudentsScreenState extends ConsumerState<RouteStudentsScreen> {
  List<dynamic> routes = [];
  List<dynamic> students = [];
  Map<String, dynamic>? selectedRoute;
  Map<String, dynamic>? selectedStudent;
  String searchQuery = '';
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    fetchRoutes();
  }

  Future<void> fetchRoutes() async {
    try {
      final res = await ApiClient.dio.get('/transport/routes');
      if (mounted) setState(() => routes = res.data);
    } catch (e) {
      debugPrint("Error fetching routes: $e");
    }
  }

  Future<void> fetchStudentsForRoute(Map<String, dynamic> route) async {
    setState(() {
      selectedRoute = route;
      searchQuery = '';
      isLoading = true;
    });
    try {
      final res = await ApiClient.dio.get('/transport/routes/${route['_id']}/students');
      if (mounted) setState(() => students = res.data);
    } catch (e) {
      debugPrint("Error fetching students: $e");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
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

    final filteredRoutes = routes.where((r) => r['routeName'].toLowerCase().contains(searchQuery.toLowerCase())).toList();
    final filteredStudents = students.where((s) => s['name'].toLowerCase().contains(searchQuery.toLowerCase())).toList();

    return Scaffold(
      backgroundColor: bgColor,
      body: CustomScrollView(
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
                      if (selectedRoute != null) {
                        setState(() => selectedRoute = null);
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
                      Text("Route Directory", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                      Text("STUDENT BOARDING DETAILS", style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(selectedRoute == null ? 'All Active Routes' : '${selectedRoute!['routeName']} Students', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                      Text(selectedRoute == null ? 'Select a route to view details' : '${students.length} Students Assigned', style: TextStyle(fontSize: 10, color: textSec, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                TextField(
                  onChanged: (val) => setState(() => searchQuery = val),
                  style: TextStyle(color: textPrimary, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: selectedRoute == null ? 'Search routes...' : 'Search students...',
                    hintStyle: TextStyle(color: textSec),
                    prefixIcon: Icon(Icons.search, color: textSec),
                    filled: true,
                    fillColor: inputBg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),

                if (selectedRoute == null) ...filteredRoutes.map((route) {
                  return GestureDetector(
                    onTap: () => fetchStudentsForRoute(route),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: const Color(0xFF42A5F5).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
                            child: const Icon(Icons.map, color: Color(0xFF42A5F5)),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(route['routeName'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                                Text('Stops: ${route['stops']?.length ?? 0}', style: TextStyle(fontSize: 10, color: textSec, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right, color: textSec),
                        ],
                      ),
                    ),
                  );
                }),

                if (selectedRoute != null) ...[
                  if (isLoading)
                    const Padding(padding: EdgeInsets.all(40), child: CustomLoader())
                  else if (filteredStudents.isEmpty)
                    Center(child: Padding(padding: const EdgeInsets.all(40), child: Text("No students assigned to this route.", style: TextStyle(color: textSec))))
                  else
                    ...filteredStudents.map((student) {
                      return GestureDetector(
                        onTap: () => _showStudentDetailsModal(student, isDark, cardColor, textPrimary, textSec),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundImage: NetworkImage(student['avatar'] ?? 'https://cdn-icons-png.flaticon.com/512/149/149071.png'),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(student['name'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                                    Text('Class: ${student['grade']}', style: const TextStyle(fontSize: 10, color: Color(0xFF42A5F5), fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                child: Text(student['transportStop']?['stopName'] ?? '', style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.w900)),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
                const SizedBox(height: 100),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  void _showStudentDetailsModal(Map<String, dynamic> student, bool isDark, Color cardColor, Color textPrimary, Color textSec) {
    showModalBottomSheet(
      context: context,
      backgroundColor: cardColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(radius: 40, backgroundImage: NetworkImage(student['avatar'] ?? 'https://cdn-icons-png.flaticon.com/512/149/149071.png')),
              const SizedBox(height: 12),
              Text(student['name'], style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textPrimary)),
              Text("ID: ${student['enrollmentNo'] ?? 'N/A'}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textSec)),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20)),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.school, color: Color(0xFF42A5F5)),
                      title: Text("Academic Class", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textSec)),
                      subtitle: Text(student['grade'] ?? 'N/A', style: TextStyle(fontWeight: FontWeight.w900, color: textPrimary)),
                    ),
                    ListTile(
                      leading: const Icon(Icons.location_on, color: Colors.green),
                      title: Text("Assigned Stop", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textSec)),
                      subtitle: Text(student['transportStop']?['stopName'] ?? 'N/A', style: TextStyle(fontWeight: FontWeight.w900, color: textPrimary)),
                    ),
                    ListTile(
                      leading: const Icon(Icons.currency_rupee, color: Colors.amber),
                      title: Text("Monthly Fee", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textSec)),
                      subtitle: Text("₹${student['transportStop']?['price'] ?? 0} / month", style: TextStyle(fontWeight: FontWeight.w900, color: textPrimary)),
                    ),
                    ListTile(
                      leading: const Icon(Icons.home, color: Colors.purple),
                      title: Text("Full Address", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textSec)),
                      subtitle: Text(student['address']?['fullAddress'] ?? 'Not registered', style: TextStyle(fontWeight: FontWeight.w900, color: textPrimary)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class BusAttendanceScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> extraData; // Data from DriverHome

  const BusAttendanceScreen({super.key, required this.extraData});

  @override
  ConsumerState<BusAttendanceScreen> createState() =>
      _BusAttendanceScreenState();
}

class _BusAttendanceScreenState extends ConsumerState<BusAttendanceScreen> {
  bool isLoading = true;
  List<dynamic> groupedStops = [];

  // State to hold attendance: { studentId: 'Present' / 'Absent' }
  Map<String, String> attendanceState = {};

  // State to track loading for individual save buttons
  Map<String, bool> savingStops = {};
  List<String> completedStops = []; // Stops marked as done

  late String routeId;
  late String tripId;
  late String tripType;

  @override
  void initState() {
    super.initState();
    routeId = widget.extraData['routeId'];
    tripId = widget.extraData['tripId'];
    tripType = widget.extraData['tripType'];
    _fetchBoardingList();
  }

  Future<void> _fetchBoardingList() async {
    try {
      final res = await ApiClient.dio.get(
        '/transport/driver/attendance-list/$routeId',
        queryParameters: {'tripType': tripType},
      );

      if (mounted) {
        setState(() {
          groupedStops = res.data['groupedData'];

          // Server se check karo ki aaj kaunse stop already save ho chuke hain
          for (var stop in groupedStops) {
            if (stop['isSavedToday'] == true) {
              if (!completedStops.contains(stop['stopName'])) {
                completedStops.add(stop['stopName']);
              }
              // Purane saved records restore karo (Present/Absent)
              for (var record in stop['savedRecords']) {
                attendanceState[record['studentId']] = record['status'];
              }
            } else {
              // By default bacchon ko Present mark karo agar pehle se save nahi hai
              for (var student in stop['students']) {
                attendanceState[student['_id']] ??= 'Present';
              }
            }
          }
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Failed to load roster!")));
      }
    }
  }

  Future<void> _saveStopAttendance(
      String stopName, List<dynamic> students) async {
    if (students.isEmpty) return;

    setState(() => savingStops[stopName] = true);

    List<Map<String, String>> records = [];
    for (var s in students) {
      records.add({
        'studentId': s['_id'],
        'status': attendanceState[s['_id']] ?? 'Present'
      });
    }

    try {
      await ApiClient.dio.post('/transport/driver/save-attendance', data: {
        'tripId': tripId,
        'routeId': routeId,
        'tripType': tripType, // 🔥 Trip Type zaroor bhejo
        'stopName': stopName,
        'records': records
      });

      setState(() {
        if (!completedStops.contains(stopName)) completedStops.add(stopName);
      });

      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            backgroundColor: Colors.green,
            content: Text("Saved for $stopName! ✅")));
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            backgroundColor: Colors.red, content: Text("Failed to save!")));
    } finally {
      setState(() => savingStops[stopName] = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final textPrimary = isDark ? Colors.white : const Color(0xFF1E293B);
    final textSec = isDark ? const Color(0xFF94A3B8) : Colors.grey;

    if (isLoading)
      return Scaffold(backgroundColor: bgColor, body: const CustomLoader());

    return Scaffold(
      backgroundColor: bgColor,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 60, 20, 40),
              decoration: BoxDecoration(
                color: tripType == 'MORNING'
                    ? const Color(0xFFF59E0B)
                    : const Color(0xFF6366F1),
                borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(36),
                    bottomRight: Radius.circular(36)),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(16)),
                      child: const Icon(Icons.arrow_back, color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Student Boarding",
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              fontStyle: FontStyle.italic)),
                      Text(
                        "${DateFormat('dd MMM yyyy').format(DateTime.now()).toUpperCase()} • $tripType ROSTER",
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final stop = groupedStops[index];
                  final students = stop['students'] as List<dynamic>;
                  final isSaving = savingStops[stop['stopName']] ?? false;
                  final isDone = completedStops.contains(stop['stopName']);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    decoration: BoxDecoration(
                        color: cardColor,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                            color: isDone
                                ? Colors.green
                                : isDark
                                    ? const Color(0xFF334155)
                                    : const Color(0xFFF1F5F9),
                            width: isDone ? 2 : 1),
                        boxShadow: const [
                          BoxShadow(
                              color: Colors.black12,
                              blurRadius: 10,
                              offset: Offset(0, 5))
                        ]),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Stop Header
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                              color: isDone
                                  ? Colors.green.withValues(alpha: 0.1)
                                  : isDark
                                      ? const Color(0xFF0F172A)
                                      : const Color(0xFFF8FAFC),
                              borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(24))),
                          child: Row(
                            children: [
                              Icon(Icons.location_on,
                                  color: isDone
                                      ? Colors.green
                                      : const Color(0xFF42A5F5),
                                  size: 24),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(stop['stopName'],
                                        style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w900,
                                            color: textPrimary)),
                                    const SizedBox(height: 4),
                                    Text(
                                        "Time: ${tripType == 'MORNING' ? stop['pickupTime'] : stop['dropTime']} • ${students.length} Students",
                                        style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: textSec)),
                                  ],
                                ),
                              ),
                              if (isDone)
                                const Icon(Icons.check_circle,
                                    color: Colors.green)
                            ],
                          ),
                        ),

                        // Students List
                        if (students.isEmpty)
                          Padding(
                              padding: const EdgeInsets.all(20),
                              child: Center(
                                  child: Text("No students from this stop",
                                      style: TextStyle(
                                          color: textSec,
                                          fontStyle: FontStyle.italic))))
                        else
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: students.map((student) {
                                final sId = student['_id'];
                                final status = attendanceState[sId];

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                          radius: 20,
                                          backgroundImage: NetworkImage(student[
                                                  'avatar'] ??
                                              'https://cdn-icons-png.flaticon.com/512/149/149071.png')),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(student['name'],
                                                style: TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w900,
                                                    color: textPrimary)),
                                            Text(
                                                "ID: ${student['enrollmentNo']}",
                                                style: TextStyle(
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.bold,
                                                    color: textSec)),
                                          ],
                                        ),
                                      ),
                                      // P / A Toggles
                                      Row(
                                        children: [
                                          GestureDetector(
                                            onTap: () => setState(() =>
                                                attendanceState[sId] =
                                                    'Present'),
                                            child: Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 14,
                                                      vertical: 8),
                                              decoration: BoxDecoration(
                                                  color: status == 'Present'
                                                      ? Colors.green
                                                      : isDark
                                                          ? const Color(
                                                              0xFF0F172A)
                                                          : const Color(
                                                              0xFFF1F5F9),
                                                  borderRadius:
                                                      const BorderRadius
                                                          .horizontal(
                                                          left: Radius.circular(
                                                              12))),
                                              child: Text("P",
                                                  style: TextStyle(
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: status == 'Present'
                                                          ? Colors.white
                                                          : textSec)),
                                            ),
                                          ),
                                          GestureDetector(
                                            onTap: () => setState(() =>
                                                attendanceState[sId] =
                                                    'Absent'),
                                            child: Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 14,
                                                      vertical: 8),
                                              decoration: BoxDecoration(
                                                  color: status == 'Absent'
                                                      ? Colors.redAccent
                                                      : isDark
                                                          ? const Color(
                                                              0xFF0F172A)
                                                          : const Color(
                                                              0xFFF1F5F9),
                                                  borderRadius:
                                                      const BorderRadius
                                                          .horizontal(
                                                          right:
                                                              Radius.circular(
                                                                  12))),
                                              child: Text("A",
                                                  style: TextStyle(
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: status == 'Absent'
                                                          ? Colors.white
                                                          : textSec)),
                                            ),
                                          ),
                                        ],
                                      )
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          ),

                        // Save Button Per Stop
                        if (students.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            child: ElevatedButton(
                              onPressed: isSaving
                                  ? null
                                  : () => _saveStopAttendance(
                                      stop['stopName'], students),
                              style: ElevatedButton.styleFrom(
                                  backgroundColor: isDone
                                      ? Colors.green
                                      : const Color(0xFF42A5F5),
                                  minimumSize: const Size(double.infinity, 50),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16))),
                              child: isSaving
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                          color: Colors.white, strokeWidth: 2))
                                  : Text(isDone ? "SAVED" : "SAVE THIS STOP",
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 1)),
                            ),
                          )
                      ],
                    ),
                  ).animate().fadeIn().slideX(
                      begin: 0.05, delay: Duration(milliseconds: index * 100));
                },
                childCount: groupedStops.length,
              ),
            ),
          )
        ],
      ),
    );
  }
}

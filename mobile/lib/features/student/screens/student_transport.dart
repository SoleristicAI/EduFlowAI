import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart'; // 🔥 PHONE CALL LAGANE KE LIYE
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/network/socket_service.dart';

class StudentTransportScreen extends ConsumerStatefulWidget {
  const StudentTransportScreen({super.key});

  @override
  ConsumerState<StudentTransportScreen> createState() => _StudentTransportScreenState();
}

class _StudentTransportScreenState extends ConsumerState<StudentTransportScreen> {
  int activeTab = 0; // 0 = HOME, 1 = ATTENDANCE, 2 = BUS
  bool isLoading = true;
  
  Map<String, dynamic>? busData;
  Map<String, dynamic>? attendanceData;
  DateTime currentMonth = DateTime.now();

  // Live Location State
  double? currentLat;
  double? currentLng;
  double speed = 0.0;
  bool isMapFullscreen = false;

  final SocketService _socketService = SocketService();
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _fetchBusDetails();
  }

  @override
  void dispose() {
    _socketService.offReceiveLocation();
    _socketService.disconnect();
    super.dispose();
  }

  // 🔥 PULL TO REFRESH LOGIC 🔥
  Future<void> _handleRefresh() async {
    if (activeTab == 1) {
      await _fetchAttendance();
    } else {
      await _fetchBusDetails();
      if (activeTab == 2) {
        _startLiveTracking(); // Re-sync location
      }
    }
  }

  Future<void> _fetchBusDetails() async {
    try {
      final res = await ApiClient.dio.get('/transport/student/my-bus');
      if (mounted) setState(() => busData = res.data);
    } catch (e) {
      debugPrint("No Bus Assigned: $e");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _fetchAttendance() async {
    setState(() => isLoading = true);
    try {
      String monthStr = DateFormat('yyyy-MM').format(currentMonth);
      final res = await ApiClient.dio.get('/transport/student/my-attendance?month=$monthStr');
      if (mounted) setState(() => attendanceData = res.data);
    } catch (e) {
      debugPrint("Attendance Fetch Error: $e");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _startLiveTracking() {
    if (busData == null || busData!['vehicle'] == null) return;
    _socketService.initSocket();
    _socketService.joinBusRoom(busData!['vehicle']['_id']);
    _socketService.onReceiveLocation((data) {
      if (mounted) {
        setState(() {
          currentLat = data['latitude'];
          currentLng = data['longitude'];
          speed = (data['speed'] ?? 0) * 3.6; 
        });
        if (currentLat != null && currentLng != null) {
          _mapController.move(LatLng(currentLat!, currentLng!), _mapController.camera.zoom);
        }
      }
    });
  }

  void _changeMonth(int offset) {
    setState(() {
      currentMonth = DateTime(currentMonth.year, currentMonth.month + offset, 1);
      attendanceData = null;
    });
    _fetchAttendance();
  }

  String? _getStatusForDate(int day) {
    if (attendanceData == null || attendanceData!['history'] == null) return null;
    String dateStr = DateFormat('yyyy-MM-dd').format(DateTime(currentMonth.year, currentMonth.month, day));
    List logs = attendanceData!['history'].where((log) => log['date'] == dateStr).toList();
    if (logs.isEmpty) return null;
    var morningLog = logs.firstWhere((l) => l['tripType'] == 'MORNING', orElse: () => null);
    return morningLog != null ? morningLog['status'] : logs[0]['status'];
  }

  void _handleBack() {
    if (isMapFullscreen) {
      setState(() => isMapFullscreen = false);
    } else if (activeTab != 0) {
      if (activeTab == 2) {
        _socketService.offReceiveLocation();
        _socketService.disconnect();
      }
      setState(() => activeTab = 0);
    } else {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading && activeTab == 0) return const CustomLoader();

    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final textPrimary = isDark ? Colors.white : const Color(0xFF1E293B);
    final textSec = isDark ? const Color(0xFF94A3B8) : Colors.grey;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: bgColor,
        child: Scaffold(
          backgroundColor: Colors.transparent, // Inherit background from AnimatedContainer
          body: Stack(
            children: [
              // 🔥 PULL TO REFRESH ADDED HERE 🔥
              RefreshIndicator(
                color: const Color(0xFF42A5F5),
                backgroundColor: cardColor,
                onRefresh: _handleRefresh,
                child: CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(), // Scroll chalu rahega hamesha for refresh
                  slivers: [
                    // --- PREMIUM CENTERED HEADER ---
                    SliverToBoxAdapter(
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.only(top: 60, bottom: 90),
                        decoration: BoxDecoration(
                          color: const Color(0xFF42A5F5),
                          gradient: LinearGradient(
                            colors: isDark 
                                ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                                : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              GestureDetector(
                                onTap: _handleBack,
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
                                  Text(
                                    activeTab == 0 ? "Transport" : activeTab == 1 ? "Attendance" : "My Bus", 
                                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)
                                  ),
                                  Text(
                                    activeTab == 0 ? "STUDENT PORTAL" : activeTab == 1 ? "MONTHLY RECORD" : "LIVE TRACKING", 
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.3)),
                                ),
                                child: const Icon(Icons.directions_bus_outlined, color: Colors.white, size: 22),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // --- CONTENT AREA ---
                    SliverToBoxAdapter(
                      child: Transform.translate(
                        offset: const Offset(0, 10), // Box upar aayega (overlap effect)
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Column(
                            children: [
                              // ==================== HOME TAB (VERTICAL BUTTONS) ====================
                              if (activeTab == 0) ...[
                                GestureDetector(
                                  onTap: () {
                                    setState(() => activeTab = 1);
                                    _fetchAttendance();
                                  },
                                  child: Container(
                                    width: double.infinity,
                                    height: 160,
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF1E3A8A).withOpacity(0.3) : Colors.blue.shade50, 
                                      borderRadius: BorderRadius.circular(40), 
                                      border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : Colors.blue.shade200, width: 2),
                                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5))]
                                    ),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Container(padding: const EdgeInsets.all(16), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: const Icon(Icons.calendar_month, color: Color(0xFF42A5F5), size: 36)),
                                        const SizedBox(height: 16),
                                        const Text("BUS ATTENDANCE RECORD", textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF42A5F5), fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                                      ],
                                    ),
                                  ),
                                ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
                                
                                const SizedBox(height: 20), // Spacing between buttons
                                
                                GestureDetector(
                                  onTap: () {
                                    setState(() => activeTab = 2);
                                    _startLiveTracking();
                                  },
                                  child: Container(
                                    width: double.infinity,
                                    height: 160,
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5), 
                                      borderRadius: BorderRadius.circular(40), 
                                      border: Border.all(color: isDark ? const Color(0xFF047857) : const Color(0xFFA7F3D0), width: 2),
                                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5))]
                                    ),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Container(padding: const EdgeInsets.all(16), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: const Icon(Icons.directions_bus, color: Colors.teal, size: 36)),
                                        const SizedBox(height: 16),
                                        const Text("TRACK MY BUS LIVE", textAlign: TextAlign.center, style: TextStyle(color: Colors.teal, fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                                      ],
                                    ),
                                  ),
                                ).animate().fadeIn(delay: 100.ms, duration: 400.ms).slideY(begin: 0.1),
                              ],

                              // ==================== ATTENDANCE TAB ====================
                              if (activeTab == 1) ...[
                                if (isLoading) const Padding(padding: EdgeInsets.all(40), child: CustomLoader()),
                                if (!isLoading) ...[
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(color: isDark ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFECFDF5), border: Border.all(color: isDark ? const Color(0xFF047857) : const Color(0xFFD1FAE5)), borderRadius: BorderRadius.circular(24)),
                                          child: Row(
                                            children: [
                                              Container(padding: const EdgeInsets.all(8), decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle), child: const Icon(Icons.check, color: Colors.white, size: 16)),
                                              const SizedBox(width: 12),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  const Text("Present", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.green, letterSpacing: 1)),
                                                  Text("${attendanceData?['presentDays'] ?? 0}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.green)),
                                                ],
                                              )
                                            ],
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(color: isDark ? const Color(0xFF881337).withOpacity(0.3) : const Color(0xFFFFF1F2), border: Border.all(color: isDark ? const Color(0xFF9F1239) : const Color(0xFFFFE4E6)), borderRadius: BorderRadius.circular(24)),
                                          child: Row(
                                            children: [
                                              Container(padding: const EdgeInsets.all(8), decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle), child: const Icon(Icons.close, color: Colors.white, size: 16)),
                                              const SizedBox(width: 12),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  const Text("Absent", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.redAccent, letterSpacing: 1)),
                                                  Text("${attendanceData?['absentDays'] ?? 0}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.redAccent)),
                                                ],
                                              )
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
                                  const SizedBox(height: 20),

                                  Container(
                                    padding: const EdgeInsets.all(20),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder)),
                                    child: Column(
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            GestureDetector(onTap: () => _changeMonth(-1), child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), shape: BoxShape.circle), child: Icon(Icons.chevron_left, color: textSec))),
                                            Text(DateFormat('MMMM yyyy').format(currentMonth).toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary, letterSpacing: 1.5)),
                                            GestureDetector(onTap: () => _changeMonth(1), child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), shape: BoxShape.circle), child: Icon(Icons.chevron_right, color: textSec))),
                                          ],
                                        ),
                                        const SizedBox(height: 20),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                                          children: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((d) => SizedBox(width: 30, child: Text(d, textAlign: TextAlign.center, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSec)))).toList(),
                                        ),
                                        const SizedBox(height: 12),
                                        GridView.builder(
                                          shrinkWrap: true,
                                          physics: const NeverScrollableScrollPhysics(),
                                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, childAspectRatio: 1, mainAxisSpacing: 8, crossAxisSpacing: 8),
                                          itemCount: DateTime(currentMonth.year, currentMonth.month + 1, 0).day + DateTime(currentMonth.year, currentMonth.month, 1).weekday - 1,
                                          itemBuilder: (context, index) {
                                            int offset = DateTime(currentMonth.year, currentMonth.month, 1).weekday - 1;
                                            if (index < offset) return const SizedBox();
                                            int day = index - offset + 1;
                                            String? status = _getStatusForDate(day);
                                            
                                            Color cellBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
                                            Color cellText = textSec;
                                            Color borderCol = cardBorder;
                                            
                                            if (status == 'Present') { cellBg = isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5); cellText = Colors.green; borderCol = isDark ? const Color(0xFF047857) : const Color(0xFFD1FAE5); } 
                                            else if (status == 'Absent') { cellBg = isDark ? const Color(0xFF4C0519) : const Color(0xFFFFF1F2); cellText = Colors.redAccent; borderCol = isDark ? const Color(0xFF9F1239) : const Color(0xFFFFE4E6); }

                                            return Container(
                                              decoration: BoxDecoration(color: cellBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderCol)),
                                              child: Stack(
                                                alignment: Alignment.center,
                                                children: [
                                                  Text(day.toString(), style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: cellText)),
                                                  if (status != null) Positioned(bottom: 4, child: Container(width: 4, height: 4, decoration: BoxDecoration(shape: BoxShape.circle, color: status == 'Present' ? Colors.green : Colors.redAccent)))
                                                ],
                                              ),
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),
                                ]
                              ],

                              // ==================== MY BUS TAB ====================
                              if (activeTab == 2) ...[
                                if (busData == null)
                                  Container(
                                    padding: const EdgeInsets.all(40),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder)),
                                    child: Column(
                                      children: [
                                        Icon(Icons.block, size: 50, color: Colors.red.withOpacity(0.5)),
                                        const SizedBox(height: 16),
                                        Text("NO BUS ASSIGNED", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                                        Text("Contact administration for transport queries.", textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: textSec, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ).animate().fadeIn()
                                else ...[
                                  // Driver & Vehicle Card
                                  Container(
                                    padding: const EdgeInsets.all(20),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder)),
                                    child: Column(
                                      children: [
                                        Row(
                                          children: [
                                            Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), shape: BoxShape.circle), child: const Icon(Icons.directions_bus, color: Colors.blue, size: 28)),
                                            const SizedBox(width: 16),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text("Assigned Vehicle", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSec, letterSpacing: 1.5)),
                                                  Text(busData!['vehicle']['vehicleNumber'].toString().toUpperCase(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textPrimary)),
                                                ],
                                              ),
                                            )
                                          ],
                                        ),
                                        const SizedBox(height: 20),
                                        // 🔥 DRIVER INFO WITH PHONE & DIALER 🔥
                                        Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.person, color: Colors.teal),
                                              const SizedBox(width: 12),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text("Driver Name", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSec, letterSpacing: 1.5)),
                                                    Text((busData!['driver']?['name'] ?? 'Unknown').toString().toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary)),
                                                    const SizedBox(height: 2),
                                                    // Driver Phone Number Shown Here
                                                    Text((busData!['driver']?['phone'] ?? 'No Number Provided').toString(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                                                  ],
                                                ),
                                              ),
                                              // DIALER BUTTON
                                              if (busData!['driver']?['phone'] != null && busData!['driver']['phone'].toString().isNotEmpty)
                                                GestureDetector(
                                                  onTap: () async {
                                                    final Uri url = Uri.parse('tel:${busData!['driver']['phone']}');
                                                    if (await canLaunchUrl(url)) {
                                                      await launchUrl(url);
                                                    } else {
                                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch dialer.')));
                                                    }
                                                  },
                                                  child: Container(
                                                    padding: const EdgeInsets.all(12),
                                                    decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle),
                                                    child: const Icon(Icons.phone, color: Colors.white, size: 20),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.location_on, color: Colors.purple),
                                              const SizedBox(width: 12),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text("Your Stop", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSec, letterSpacing: 1.5)),
                                                    Text((busData!['stop']?['stopName'] ?? 'Not Assigned').toString().toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary)),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
                                  const SizedBox(height: 20),

                                  // Mini Map Preview
                                  GestureDetector(
                                    onTap: () => setState(() => isMapFullscreen = true),
                                    child: Container(
                                      height: 300,
                                      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder)),
                                      child: Stack(
                                        children: [
                                          ClipRRect(
                                            borderRadius: BorderRadius.circular(40),
                                            child: currentLat == null ? 
                                              Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.location_off, color: textSec, size: 40), const SizedBox(height: 10), Text("Waiting for GPS", style: TextStyle(color: textSec, fontWeight: FontWeight.bold))])) :
                                              IgnorePointer(
                                                child: FlutterMap(
                                                  mapController: _mapController,
                                                  options: MapOptions(
                                                    initialCenter: LatLng(currentLat!, currentLng!),
                                                    initialZoom: 17,
                                                    maxZoom: 22,
                                                  ),
                                                  children: [
                                                    TileLayer(
                                                      urlTemplate: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                                                      maxZoom: 22, maxNativeZoom: 20,
                                                    ),
                                                    MarkerLayer(
                                                      markers: [
                                                        Marker(
                                                          point: LatLng(currentLat!, currentLng!),
                                                          width: 50, height: 50,
                                                          child: Image.network('https://cdn-icons-png.flaticon.com/512/3448/3448339.png'), // Standard Bus Icon
                                                        )
                                                      ]
                                                    )
                                                  ],
                                                ),
                                              ),
                                          ),
                                          Positioned(
                                            top: 20, right: 20,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                              decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                                              child: const Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(Icons.open_in_full, color: Colors.white, size: 12),
                                                  SizedBox(width: 6),
                                                  Text("TAP TO EXPAND", style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
                                                ],
                                              ),
                                            ),
                                          )
                                        ],
                                      ),
                                    ),
                                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),
                                ]
                              ],

                              const SizedBox(height: 100),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // ==================== FULLSCREEN MAP OVERLAY ====================
              if (isMapFullscreen && currentLat != null)
                Positioned.fill(
                  child: Container(
                    color: bgColor,
                    child: Stack(
                      children: [
                        FlutterMap(
                          mapController: _mapController,
                          options: MapOptions(
                            initialCenter: LatLng(currentLat!, currentLng!),
                            initialZoom: 18,
                            maxZoom: 22,
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                              maxZoom: 22, maxNativeZoom: 20,
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: LatLng(currentLat!, currentLng!),
                                  width: 60, height: 60,
                                  child: AnimatedContainer(
                                    duration: const Duration(seconds: 5), // Smooth glide
                                    child: Image.network('https://cdn-icons-png.flaticon.com/512/3448/3448339.png'),
                                  ),
                                )
                              ]
                            )
                          ],
                        ),
                        Positioned(
                          top: 60, left: 20,
                          child: GestureDetector(
                            onTap: () => setState(() => isMapFullscreen = false),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
                              child: Icon(Icons.close, color: textPrimary),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 40, left: 20, right: 20,
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(color: cardColor.withOpacity(0.9), borderRadius: BorderRadius.circular(30), border: Border.all(color: cardBorder)),
                            child: Row(
                              children: [
                                const Icon(Icons.speed, color: Colors.blue),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text("Live Speed", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey)),
                                      Text("${speed.toStringAsFixed(1)} km/h", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textPrimary)),
                                    ],
                                  ),
                                )
                              ],
                            ),
                          ),
                        )
                      ],
                    ),
                  ).animate().fadeIn().slideY(begin: 1.0),
                )
            ],
          ),
        ),
      ),
    );
  }
}
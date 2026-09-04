import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart'; // 🔥 API CLIENT IMPORTED
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart'; // 🔥 LOADER IMPORTED
import '../../../core/network/socket_service.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:async'; // Timer ke liye
import 'package:dio/dio.dart';

class DriverHome extends ConsumerStatefulWidget {
  const DriverHome({super.key});

  @override
  ConsumerState<DriverHome> createState() => _DriverHomeState();
}

class _DriverHomeState extends ConsumerState<DriverHome> {
  Map<String, dynamic>? user;

  // 🔥 NAYE VARIABLES LIVE DATA KE LIYE 🔥
  Map<String, dynamic>? vehicleData;
  Map<String, dynamic>? routeData;
  bool isLoading = true;
  bool isSubmitting = false;

  bool isTripActive = false;
  String tripType = ''; // 'MORNING' or 'EVENING'

  // 🔥 SOCKET SERVICE INSTANCE 🔥
  final SocketService _socketService = SocketService();
  Timer? _locationTimer;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _fetchMyAssignment();
    _socketService.initSocket(); // 🔥 App khulte hi socket initialize hoga
  }

  @override
  void dispose() {
    _socketService.disconnect(); // 🔥 Memory leak se bachane ke liye
    super.dispose();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() => user = jsonDecode(userStr));
    }
  }

  // 🔥 LIVE GPS BROADCASTING ENGINE 🔥
  void _startLocationBroadcasting() {
    // Har 5 second mein location utha kar socket se bhejega
    _locationTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      if (!isTripActive || vehicleData == null) {
        timer.cancel();
        return;
      }

      try {
        // 1. Permission check karo
        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
          if (permission == LocationPermission.denied) return;
        }

        // 2. Current GPS Position nikalo
        Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );

        // 3. Socket service ke through server ko phek do
        _socketService.sendLocation(
          vehicleId: vehicleData!['_id'],
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed,
        );

        debugPrint(
            "📍 GPS Broadcasted -> Lat: ${position.latitude}, Lng: ${position.longitude}");
      } catch (e) {
        debugPrint("GPS Broadcast Error: $e");
      }
    });
  }

  Future<void> _fetchMyAssignment() async {
    try {
      final res = await ApiClient.dio.get('/transport/driver/my-assignment');
      if (mounted) {
        setState(() {
          vehicleData = res.data['vehicle'];
          routeData = res.data['route'];
          
          // 🔥 SMART RESUME SYSTEM: Agar backend par trip active hai, toh app mein bhi active kar do
          if (res.data['activeTrip'] != null) {
            isTripActive = true;
            tripType = res.data['activeTrip']['tripType'];
            activeTripId = res.data['activeTrip']['_id'];
            
            // Socket aur GPS ko bhi dubara zinda kar do
            _socketService.joinBusRoom(vehicleData!['_id']);
            _startLocationBroadcasting();
          }
          
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          vehicleData = null;
          routeData = null;
          isLoading = false;
        });
      }
    }
  }

// 🔥 TRIP START / END API INTEGRATION 🔥
  String? activeTripId; // Trip ki ID store karne ke liye

  void _toggleTrip(String type) async {
    if (vehicleData == null || routeData == null) {
      _showToast(
          "You need an active Bus & Route assignment to start a trip! ⚠️",
          isError: true);
      return;
    }

    // Agar trip pehle se active hai, toh END karne ka dialog
    if (isTripActive) {
      _confirmEndTrip();
      return;
    }

    // Agar trip shuru karni hai, toh START API hit karo
    setState(() => isSubmitting = true);
    try {
      final res = await ApiClient.dio.post('/transport/trips/start', data: {
        'vehicleId': vehicleData!['_id'],
        'routeId': routeData!['_id'],
        'tripType': type,
      });

      if (mounted) {
        setState(() {
          isTripActive = true;
          tripType = type;
          activeTripId = res.data['trip']['_id'];
          isSubmitting = false;
        });

        _socketService.joinBusRoom(vehicleData!['_id']);
        _startLocationBroadcasting(); // 🔥 Yahan se GPS loop chalu ho jayega!
        _showToast("$type Trip Started Successfully! 🚀");
      }
    } catch (e) {
      if (mounted) {
        setState(() => isSubmitting = false);
        // 🔥 FIX: DioException mein cast kar diya taaki .response error na de
        String errorMsg = "Failed to start trip! 🛡️";
        if (e is DioException) {
          errorMsg = e.response?.data['message'] ?? errorMsg;
        }
        _showToast(errorMsg, isError: true);
      }
    }
  }

  void _confirmEndTrip() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text("END TRIP?",
            style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontStyle: FontStyle.italic)),
        content: const Text(
            "Are you sure you want to end the current trip? Location sharing will stop.",
            style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child:
                  const Text("CANCEL", style: TextStyle(color: Colors.grey))),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              setState(() => isSubmitting = true);
              try {
                if (activeTripId != null) {
              await ApiClient.dio.put('/transport/trips/end/$activeTripId');
            }
            if (mounted) {
              _locationTimer?.cancel(); // 🔥 Trip khatam hote hi GPS timer rok do!
              _socketService.disconnect();
              setState(() {
                isTripActive = false;
                tripType = '';
                activeTripId = null;
                isSubmitting = false;
              });
              _showToast("Trip Ended Successfully! ✅");
            }
              } catch (e) {
                if (mounted) {
                  setState(() => isSubmitting = false);
                  _showToast("Failed to end trip! 🛡️", isError: true);
                }
              }
            },
            child: const Text("END TRIP",
                style: TextStyle(
                    color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _triggerSOS() {
    _showToast("SOS ALERT SENT TO MANAGER! 🚨", isError: true);
  }

  void _showToast(String message, {bool isError = false}) {
    final overlay = Overlay.of(context);
    late OverlayEntry overlayEntry;
    overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 20,
        left: 20,
        right: 20,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color:
                  isError ? const Color(0xFFF43F5E) : const Color(0xFF10B981),
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                    color: Colors.black26, blurRadius: 10, offset: Offset(0, 5))
              ],
            ),
            child: Row(
              children: [
                Icon(isError ? Icons.error : Icons.check_circle,
                    color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                    child: Text(message,
                        style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            fontSize: 12,
                            color: Colors.white))),
              ],
            ),
          )
              .animate()
              .fadeIn(duration: 300.ms)
              .slideY(begin: -0.5, end: 0, curve: Curves.easeOutBack),
        ),
      ),
    );
    overlay.insert(overlayEntry);
    Future.delayed(const Duration(seconds: 3), () {
      if (overlayEntry.mounted) overlayEntry.remove();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading)
      return const CustomLoader(); // 🔥 JAB TAK API DATA NAHI LAATI, LOADER DIKHEGA

    final themeMode = ref.watch(themeProvider);
    final bool isDark = themeMode == ThemeMode.dark;

    final Color cardColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final Color textPrimary = isDark ? Colors.white : const Color(0xFF1E293B);
    final Color textSec =
        isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color activeColor = const Color(0xFF10B981);
    final Color inactiveColor = vehicleData == null
        ? Colors.redAccent
        : const Color(0xFF42A5F5); // Agar bus nahi hai toh laal rang

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
      child: Column(
        children: [
          // --- LIVE STATUS CARD (NOW DYNAMIC) ---
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isTripActive ? activeColor : inactiveColor,
              borderRadius: BorderRadius.circular(30),
              boxShadow: [
                BoxShadow(
                    color: (isTripActive ? activeColor : inactiveColor)
                        .withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10))
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                              vehicleData == null
                                  ? "NO ASSIGNMENT FOUND"
                                  : "TODAY'S ASSIGNMENT",
                              style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.directions_bus,
                                  color: Colors.white, size: 18),
                              const SizedBox(width: 8),
                              Flexible(
                                  child: Text(
                                      vehicleData == null
                                          ? "BUS: NOT ASSIGNED"
                                          : "BUS: ${vehicleData!['vehicleNumber']}"
                                              .toUpperCase(),
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 18,
                                          fontWeight: FontWeight.w900))),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(Icons.navigation,
                                  color: Colors.white.withValues(alpha: 0.8),
                                  size: 14),
                              const SizedBox(width: 8),
                              Flexible(
                                  child: Text(
                                      routeData == null
                                          ? "ROUTE: PENDING"
                                          : "ROUTE: ${routeData!['routeName']}"
                                              .toUpperCase(),
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                          color: Colors.white
                                              .withValues(alpha: 0.9),
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold))),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (isTripActive)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20)),
                        child: Row(
                          children: [
                            const Icon(Icons.circle,
                                    color: Color(0xFF10B981), size: 10)
                                .animate(onPlay: (c) => c.repeat(reverse: true))
                                .fadeOut(),
                            const SizedBox(width: 6),
                            const Text("LIVE",
                                style: TextStyle(
                                    color: Color(0xFF10B981),
                                    fontWeight: FontWeight.w900,
                                    fontSize: 12)),
                          ],
                        ),
                      )
                  ],
                ),
              ],
            ),
          ).animate().slideY(begin: -0.1),

          const SizedBox(height: 30),

          // --- DRIVER CONTROLS ---
          if (vehicleData == null || routeData == null) ...[
            // 🔥 AGAR BUS ASSIGN NAHI HAI TOH YE MESSAGE DIKHEGA 🔥
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: cardBorderColor(isDark))),
              child: Column(
                children: [
                  Icon(Icons.block,
                      size: 50, color: Colors.redAccent.withValues(alpha: 0.5)),
                  const SizedBox(height: 16),
                  Text("NO TRIP AVAILABLE",
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: textPrimary)),
                  const SizedBox(height: 8),
                  Text(
                      "Please contact your Transport Manager to get a bus and route assigned for today.",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 12,
                          color: textSec,
                          fontWeight: FontWeight.bold)),
                ],
              ),
            ).animate().fadeIn(),
          ] else if (!isTripActive) ...[
            _buildBigButton(
                "MORNING PICKUPS",
                "Start Home to School Trip",
                Icons.wb_sunny,
                const Color(0xFFF59E0B),
                () => _toggleTrip('MORNING'),
                cardColor),
            const SizedBox(height: 20),
            _buildBigButton(
                "EVENING DROPS",
                "Start School to Home Trip",
                Icons.nights_stay,
                const Color(0xFF6366F1),
                () => _toggleTrip('EVENING'),
                cardColor),
          ] else ...[
            Text("TRIP IN PROGRESS: $tripType",
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: textPrimary,
                    letterSpacing: 1)),
            const SizedBox(height: 8),
            Text("GPS Location is broadcasting to School & Parents",
                style: TextStyle(fontSize: 12, color: textSec),
                textAlign: TextAlign.center),
            const SizedBox(height: 40),
            GestureDetector(
              onTap: () {
                // TODO: Navigate to Attendance Screen
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 30),
                decoration: BoxDecoration(
                    color: const Color(0xFF42A5F5),
                    borderRadius: BorderRadius.circular(35),
                    boxShadow: [
                      BoxShadow(
                          color: const Color(0xFF42A5F5).withValues(alpha: 0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 8))
                    ]),
                child: const Column(
                  children: [
                    Icon(Icons.people_alt, color: Colors.white, size: 40),
                    SizedBox(height: 12),
                    Text("STUDENT ATTENDANCE",
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1)),
                  ],
                ),
              ),
            ).animate().scale(curve: Curves.easeOutBack),
            const SizedBox(height: 30),
            GestureDetector(
              onTap: () => _toggleTrip(tripType),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 20),
                decoration: BoxDecoration(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: Colors.redAccent, width: 2)),
                child: const Text("END TRIP",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: Colors.redAccent,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1)),
              ),
            ),
          ],

          const SizedBox(height: 40),

          // --- EMERGENCY SOS BUTTON ---
          GestureDetector(
            onLongPress: _triggerSOS,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(
                  color: Colors.redAccent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: Colors.redAccent.withValues(alpha: 0.3))),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.redAccent),
                  SizedBox(width: 10),
                  Text("LONG PRESS FOR SOS",
                      style: TextStyle(
                          color: Colors.redAccent,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2)),
                ],
              ),
            ),
          ),

          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Color cardBorderColor(bool isDark) =>
      isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9);

  Widget _buildBigButton(String title, String subtitle, IconData icon,
      Color color, VoidCallback onTap, Color cardColor) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: color.withValues(alpha: 0.3), width: 2),
          boxShadow: [
            BoxShadow(
                color: color.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4))
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: color,
                          fontStyle: FontStyle.italic)),
                  const SizedBox(height: 4),
                  Text(subtitle,
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey)),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: color, size: 18),
          ],
        ),
      ),
    ).animate().fadeIn().slideX(begin: 0.1);
  }
}

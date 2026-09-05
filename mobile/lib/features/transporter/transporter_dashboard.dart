import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';

class TransporterDashboard extends ConsumerStatefulWidget {
  const TransporterDashboard({super.key});

  @override
  ConsumerState<TransporterDashboard> createState() => _TransporterDashboardState();
}

class _TransporterDashboardState extends ConsumerState<TransporterDashboard> {
  bool isLoading = true;
  List<dynamic> activeTrips = [];
  int totalActiveBuses = 0;

  @override
  void initState() {
    super.initState();
    _fetchLiveDashboardData();
  }

  Future<void> _fetchLiveDashboardData() async {
    try {
      final res = await ApiClient.dio.get('/transport/trips/active');
      if (mounted) {
        setState(() {
          // Backend se trips aayengi
          activeTrips = res.data['trips'] ?? [];
          totalActiveBuses = activeTrips.length;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        // 🔥 ERROR TOAST: Agar backend fail hoga toh ab screen par error dikhega
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("API Error: ${e.toString()}"), backgroundColor: Colors.red),
        );
        debugPrint("Failed to fetch dashboard data: $e");
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF42A5F5);

    if (isLoading) return const CustomLoader();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          
          // --- FLEET OPERATIONS BUTTONS ---
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              // 1. Manage Fleet Button
              GestureDetector(
                onTap: () => context.push('/transporter/manage'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0)), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))]),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.settings, color: Color(0xFF475569), size: 14),
                      SizedBox(width: 6),
                      Text("MANAGE", style: TextStyle(color: Color(0xFF475569), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // 2. Assign Students Button
              GestureDetector(
                onTap: () => context.push('/transport/assign'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: const Color(0xFF42A5F5).withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4))]),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.person_add, color: Colors.white, size: 14),
                      SizedBox(width: 6),
                      Text("ASSIGN", style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // 3. Route Directory Button
              GestureDetector(
                onTap: () => context.push('/transport/route-students'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.green.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4))]),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.menu_book, color: Colors.white, size: 14),
                      SizedBox(width: 6),
                      Text("DIRECTORY", style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // --- LIVE STATS GRID ---
          Row(
            children: [
              _buildStatCard("Active\nBuses", totalActiveBuses.toString().padLeft(2, '0'), Icons.directions_bus, Colors.teal),
              const SizedBox(width: 12),
              // Students Boarded abhi static hai jab tak attendance ready na ho
              _buildStatCard("Students\nBoarded", "--", Icons.people_alt, accent),
              const SizedBox(width: 12),
              _buildStatCard("Alerts\nIssues", "00", Icons.warning_amber_rounded, Colors.amber),
            ],
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),

          const SizedBox(height: 24),

          // --- LIVE MAP OVERVIEW (Standby) ---
          Container(
            height: 220,
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(32),
              boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.2), blurRadius: 20, offset: const Offset(0, 10))],
            ),
            child: Stack(
              children: [
                Positioned.fill(child: Opacity(opacity: 0.1, child: CustomPaint(painter: GridPainter()))),
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: accent, width: 2)),
                        child: const Icon(Icons.satellite_alt, color: accent, size: 32).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(0.9, 0.9), end: const Offset(1.1, 1.1)),
                      ),
                      const SizedBox(height: 12),
                      const Text("Global Fleet Tracker Standby", style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
                    ],
                  ),
                ),
                Positioned(
                  top: 20, right: 20,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.teal.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                    child: const Row(
                      children: [
                        Icon(Icons.circle, color: Colors.tealAccent, size: 8),
                        SizedBox(width: 6),
                        Text("SYSTEM READY", style: TextStyle(color: Colors.tealAccent, fontSize: 9, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                )
              ],
            ),
          ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: 0.2),

          const SizedBox(height: 32),

          // --- DYNAMIC ACTIVE ROUTES LIST ---
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("ACTIVE ROUTES", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5)),
              GestureDetector(
                onTap: _fetchLiveDashboardData, // Refresh button
                child: const Icon(Icons.refresh, color: Color(0xFF94A3B8), size: 18),
              )
            ],
          ),
          const SizedBox(height: 12),

          if (activeTrips.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Column(
                  children: [
                    Icon(Icons.local_parking, size: 40, color: Colors.grey.withValues(alpha: 0.3)),
                    const SizedBox(height: 10),
                    const Text("All buses are currently parked.", style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            )
          else
            ...activeTrips.map((trip) {
              // 🔥 CRASH-PROOF LOGIC: Agar tiip data mein vehicle ya route missing ho toh app crash nahi hogi
              final vehicle = trip['vehicle'];
              final route = trip['route'];
              
              // Agar koi gadbad hai toh wo card hide kar do
              if (vehicle == null || route == null) return const SizedBox.shrink();

              final vehicleName = vehicle['vehicleNumber'] ?? 'Unknown Bus';
              final vehicleId = vehicle['_id'];
              final routeName = route['routeName'] ?? 'Unknown Route';

              return _buildRouteCard(
                vehicleName, 
                routeName, 
                "Live Tracking", 
                "Live", 
                1.0, 
                const Color(0xFF10B981),
                () {
                  context.push('/transport/live-tracking', extra: {
                    'vehicleId': vehicleId,
                    'vehicleNumber': vehicleName,
                  });
                }
              );
            }),
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
            Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), height: 1.2)),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteCard(String busId, String route, String subtitle, String status, double progress, Color statusColor, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0xFFF1F5F9))),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
              child: Icon(Icons.directions_bus, color: statusColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(busId, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                  Text(route, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Icon(Icons.gps_fixed, color: statusColor, size: 20),
                const SizedBox(height: 4),
                const Text("TRACK", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8))),
              ],
            )
          ],
        ),
      ).animate().fadeIn(delay: 400.ms).slideX(begin: 0.1),
    );
  }
}

class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white..strokeWidth = 1;
    for (double i = 0; i < size.width; i += 20) canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    for (double i = 0; i < size.height; i += 20) canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
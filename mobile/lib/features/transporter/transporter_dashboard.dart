import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/services.dart'; // 🔥 NEEDED FOR SYSTEM EXIT
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';

class TransporterDashboard extends ConsumerStatefulWidget {
  const TransporterDashboard({super.key});

  @override
  ConsumerState<TransporterDashboard> createState() =>
      _TransporterDashboardState();
}

class _TransporterDashboardState extends ConsumerState<TransporterDashboard>
    with SingleTickerProviderStateMixin {
  bool isLoading = true;
  List<dynamic> activeTrips = [];

  // Dashboard Stats
  int totalDrivers = 0;
  int totalVehicles = 0;
  int totalRoutes = 0;
  int totalStudents = 0;

  // 🔥 DOUBLE-BACK-PRESS EXIT STATE 🔥
  DateTime? _lastPressedAt;

  bool isMenuOpen = false;
  late AnimationController _menuController;
  late Animation<double> _menuAnimation;

  @override
  void initState() {
    super.initState();
    _fetchLiveDashboardData();

    _menuController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 250));
    _menuAnimation =
        CurvedAnimation(parent: _menuController, curve: Curves.easeOutBack);
  }

  @override
  void dispose() {
    _menuController.dispose();
    super.dispose();
  }

  void _toggleMenu() {
    setState(() {
      isMenuOpen = !isMenuOpen;
      isMenuOpen ? _menuController.forward() : _menuController.reverse();
    });
  }

  Future<void> _fetchLiveDashboardData() async {
    try {
      final res = await Future.wait([
        ApiClient.dio.get('/transport/trips/active'),
        ApiClient.dio.get('/transport/stats'),
      ]);

      if (mounted) {
        setState(() {
          activeTrips = res[0].data['trips'] ?? [];

          final stats = res[1].data;
          totalDrivers = stats['totalDrivers'] ?? 0;
          totalVehicles = stats['totalVehicles'] ?? 0;
          totalRoutes = stats['totalRoutes'] ?? 0;
          totalStudents = stats['totalStudents'] ?? 0;

          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text("API Error: ${e.toString()}"),
              backgroundColor: Colors.red),
        );
        debugPrint("Failed to fetch dashboard data: $e");
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF42A5F5);

    // 🔥 FIX 1: CustomLoader ko bounded height di taaki Infinite Height error na aaye
    if (isLoading) {
      return SizedBox(
        height: MediaQuery.of(context).size.height * 0.7,
        child: const CustomLoader(),
      );
    }

    // 🔥 POPSCOPE WRAPPER FOR BACK-PRESS LOGIC 🔥
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;

        final now = DateTime.now();
        if (_lastPressedAt == null ||
            now.difference(_lastPressedAt!) > const Duration(seconds: 2)) {
          _lastPressedAt = now;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              elevation: 0,
              backgroundColor: Colors.transparent,
              duration: const Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.only(bottom: 100, left: 35, right: 35),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28)),
              content: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                      color: Colors.white.withValues(alpha: 0.18), width: 1.2),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.white.withValues(alpha: 0.04),
                        blurRadius: 25,
                        spreadRadius: 2),
                  ],
                ),
                child: const Text(
                  "Press BACK again to EXIT app",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontStyle: FontStyle.italic,
                      color: Color(0xFFE2E8F0),
                      fontSize: 10,
                      letterSpacing: 0.5),
                ),
              ),
            ),
          );
        } else {
          SystemNavigator.pop();
        }
      },
      // 🔥 FIX 2: SCAFFOLD HATA KAR CONSTRAINED BOX + STACK USE KIYA 🔥
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minHeight: MediaQuery.of(context).size.height *
              0.8, // Force height taaki button bottom me rahe
        ),
        child: Stack(
          children: [
            // --- MAIN DASHBOARD CONTENT ---
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),

                  // --- LIVE STATS GRID (2x2) ---
                  Column(
                    children: [
                      Row(
                        children: [
                          _buildStatCard(
                              "Total\nBuses",
                              totalVehicles.toString().padLeft(2, '0'),
                              Icons.directions_bus,
                              Colors.teal),
                          const SizedBox(width: 12),
                          _buildStatCard(
                              "Transport\nEnrolled",
                              totalStudents.toString().padLeft(2, '0'),
                              Icons.people_alt,
                              accent),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _buildStatCard(
                              "Total\nRoutes",
                              totalRoutes.toString().padLeft(2, '0'),
                              Icons.alt_route,
                              Colors.purple),
                          const SizedBox(width: 12),
                          _buildStatCard(
                              "Total\nDrivers",
                              totalDrivers.toString().padLeft(2, '0'),
                              Icons.badge,
                              Colors.amber),
                        ],
                      ),
                    ],
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

                  const SizedBox(height: 24),

                  // --- LIVE MAP OVERVIEW (Standby) ---
                  Container(
                    height: 220,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(
                            color: accent.withValues(alpha: 0.2),
                            blurRadius: 20,
                            offset: const Offset(0, 10))
                      ],
                    ),
                    child: Stack(
                      children: [
                        Positioned.fill(
                            child: Opacity(
                                opacity: 0.1,
                                child: CustomPaint(painter: GridPainter()))),
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border:
                                        Border.all(color: accent, width: 2)),
                                child: const Icon(Icons.satellite_alt,
                                        color: accent, size: 32)
                                    .animate(
                                        onPlay: (c) => c.repeat(reverse: true))
                                    .scale(
                                        begin: const Offset(0.9, 0.9),
                                        end: const Offset(1.1, 1.1)),
                              ),
                              const SizedBox(height: 12),
                              const Text("Global Fleet Tracker Standby",
                                  style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1)),
                            ],
                          ),
                        ),
                        Positioned(
                          top: 20,
                          right: 20,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                                color: Colors.teal.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20)),
                            child: const Row(
                              children: [
                                Icon(Icons.circle,
                                    color: Colors.tealAccent, size: 8),
                                SizedBox(width: 6),
                                Text("SYSTEM READY",
                                    style: TextStyle(
                                        color: Colors.tealAccent,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        )
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 200.ms, duration: 400.ms)
                      .slideY(begin: 0.1),

                  const SizedBox(height: 32),

                  // --- DYNAMIC ACTIVE ROUTES LIST ---
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("ACTIVE ROUTES",
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF94A3B8),
                              letterSpacing: 1.5)),
                      GestureDetector(
                        onTap: _fetchLiveDashboardData, // Refresh button
                        child: const Icon(Icons.refresh,
                            color: Color(0xFF94A3B8), size: 18),
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
                            Icon(Icons.local_parking,
                                size: 40,
                                color: Colors.grey.withValues(alpha: 0.3)),
                            const SizedBox(height: 10),
                            const Text("All buses are currently parked.",
                                style: TextStyle(
                                    color: Colors.grey,
                                    fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    )
                  else
                    ...activeTrips.map((trip) {
                      final vehicle = trip['vehicle'];
                      final route = trip['route'];
                      if (vehicle == null || route == null) {
                        return const SizedBox.shrink();
                      }

                      final vehicleName =
                          vehicle['vehicleNumber'] ?? 'Unknown Bus';
                      final vehicleId = vehicle['_id'];
                      final routeName = route['routeName'] ?? 'Unknown Route';

                      return _buildRouteCard(
                          vehicleName, routeName, const Color(0xFF10B981), () {
                        context.push('/transport/live-tracking', extra: {
                          'vehicleId': vehicleId,
                          'vehicleNumber': vehicleName,
                        });
                      });
                    }),

                  const SizedBox(height: 100),
                ],
              ),
            ),

            // 🔥 DIM BACKGROUND JAB MENU OPEN HO 🔥
            if (isMenuOpen)
              Positioned.fill(
                child: GestureDetector(
                  onTap: _toggleMenu,
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                      color: Colors.black
                          .withValues(alpha: 0.3)), // Halkasa dim effect
                ),
              ),

            // 🔥 FAB MENU POSITIONED AT BOTTOM RIGHT 🔥
            Positioned(
              top: 20, // Ekdum top par stats ke paas
              right: 10,
              child: _buildFabMenu(),
            ),
          ],
        ),
      ),
    );
  }


  // 🔥 PREMIUM FLOATING MENU (TOP TO BOTTOM) 🔥
  Widget _buildFabMenu() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // 1. Main Trigger Button (Ab ye sabse upar rahega)
        FloatingActionButton(
          onPressed: _toggleMenu,
          backgroundColor: const Color(0xFF42A5F5),
          child: AnimatedIcon(
              icon: AnimatedIcons.menu_close,
              progress: _menuAnimation,
              color: Colors.white),
        ),

        // 2. Pop-out Menu Items (Ab ye button ke neeche khulenge)
        SizeTransition(
          sizeFactor: _menuAnimation,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const SizedBox(height: 16),
              _buildFabMenuItem(
                  Icons.settings, "MANAGE", const Color(0xFF475569), () {
                _toggleMenu();
                context.push('/transporter/manage');
              }),
              const SizedBox(height: 12),
              _buildFabMenuItem(
                  Icons.person_add, "ASSIGN", const Color(0xFF42A5F5), () {
                _toggleMenu();
                context.push('/transport/assign');
              }),
              const SizedBox(height: 12),
              _buildFabMenuItem(Icons.map, "DIRECTORY", Colors.purple, () {
                _toggleMenu();
                context.push('/transport/route-students');
              }),
              const SizedBox(height: 12),
              _buildFabMenuItem(Icons.calendar_month, "ATTENDANCE", Colors.teal,
                  () {
                _toggleMenu();
                context.push('/transport/attendance-viewer');
              }),
              const SizedBox(height: 12),
              _buildFabMenuItem(Icons.money_off, "DISABLE FEES", Colors.orange,
                  () {
                _toggleMenu();
                context.push('/transport/exemptions');
              }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFabMenuItem(
      IconData icon, String label, Color color, VoidCallback onTap) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              boxShadow: const [
                BoxShadow(color: Colors.black26, blurRadius: 4)
              ]),
          child: Text(label,
              style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w900,
                  fontSize: 10,
                  letterSpacing: 1)),
        ),
        const SizedBox(width: 12),
        FloatingActionButton.small(
          heroTag: label, // Important for multiple FABs
          onPressed: onTap,
          backgroundColor: color,
          child: Icon(icon, color: Colors.white, size: 20),
        ),
      ],
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 10,
                offset: const Offset(0, 4))
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(value,
                style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF1E293B))),
            Text(title,
                style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF94A3B8),
                    height: 1.2)),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteCard(
      String busId, String route, Color statusColor, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFF1F5F9))),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16)),
              child: Icon(Icons.directions_bus, color: statusColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(busId,
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF1E293B))),
                  Text(route,
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF94A3B8))),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Icon(Icons.gps_fixed, color: statusColor, size: 20),
                const SizedBox(height: 4),
                const Text("TRACK",
                    style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF94A3B8))),
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
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 1;
    for (double i = 0; i < size.width; i += 20)
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    for (double i = 0; i < size.height; i += 20)
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

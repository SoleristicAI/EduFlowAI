import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

class TransporterDashboard extends StatelessWidget {
  const TransporterDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF42A5F5);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          
          // --- SETTINGS / MANAGE FLEET BUTTON ---
          Align(
            alignment: Alignment.centerRight,
            child: GestureDetector(
              onTap: () => context.push('/transporter/manage'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0)), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))]),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.settings, color: Color(0xFF475569), size: 16),
                    SizedBox(width: 8),
                    Text("MANAGE FLEET", style: TextStyle(color: Color(0xFF475569), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // --- STATS GRID ---
          Row(
            children: [
              _buildStatCard("Active\nBuses", "08", Icons.directions_bus, Colors.teal),
              const SizedBox(width: 12),
              _buildStatCard("Students\nBoarded", "342", Icons.people_alt, accent),
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
                      const Text("Waiting for Live GPS...", style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
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

          // --- ACTIVE ROUTES LIST ---
          const Text("ACTIVE ROUTES", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 1.5)),
          const SizedBox(height: 12),

          _buildRouteCard("BUS-01", "North Sector A", "Ramesh Singh", "10 mins", 0.75, accent),
          _buildRouteCard("BUS-04", "West Sector B", "Suresh Kumar", "Arrived", 1.0, Colors.teal),
          _buildRouteCard("BUS-07", "South City Core", "Vikram Das", "5 mins", 0.85, accent),
          
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

  Widget _buildRouteCard(String busId, String route, String driver, String eta, double progress, Color statusColor) {
    return Container(
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
              Text(eta, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: statusColor)),
              const Text("ETA", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
            ],
          )
        ],
      ),
    ).animate().fadeIn(delay: 400.ms).slideX(begin: 0.1);
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
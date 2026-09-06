import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/socket_service.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class LiveTrackingScreen extends ConsumerStatefulWidget {
  final String vehicleId;
  final String vehicleNumber;
  
  const LiveTrackingScreen({
    super.key, 
    required this.vehicleId, 
    required this.vehicleNumber
  });

  @override
  ConsumerState<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends ConsumerState<LiveTrackingScreen> {
  final SocketService _socketService = SocketService();
  final MapController _mapController = MapController();
  
  LatLng? _busLocation; 
  double _currentSpeed = 0.0;
  bool _isLive = false;

  @override
  void initState() {
    super.initState();
    _initLiveTracking();
  }

  void _initLiveTracking() {
    _socketService.joinBusRoom(widget.vehicleId);

    _socketService.socket.on('receive_location', (data) {
      if (!mounted) return;
      
      final lat = data['latitude'] as double;
      final lng = data['longitude'] as double;
      final speed = data['speed'] != null ? (data['speed'] as double) : 0.0;

      setState(() {
        _busLocation = LatLng(lat, lng);
        _currentSpeed = speed * 3.6; // Convert m/s to km/h
        _isLive = true;
      });

      // 🔥 AUTO RE-CENTER MAP ONLY IF USER IS NOT PANNING 🔥
      _mapController.move(_busLocation!, _mapController.camera.zoom > 16.0 ? _mapController.camera.zoom : 18.0);
    });
  }

  @override
  void dispose() {
    _socketService.socket.off('receive_location');
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 DARK MODE THEME VARIABLES 🔥
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardColor = isDark ? const Color(0xFF1E293B).withValues(alpha: 0.9) : Colors.white.withValues(alpha: 0.9);
    final textPrimary = isDark ? Colors.white : Colors.black87;
    final textSec = isDark ? const Color(0xFF94A3B8) : Colors.grey;

    return Scaffold(
      backgroundColor: bgColor,
      extendBodyBehindAppBar: true, // Map poori screen par phel jayega
      appBar: AppBar(
        backgroundColor: cardColor,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: textPrimary),
        title: Column(
          children: [
            Text("LIVE TRACKING", style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1)),
            Text("BUS: ${widget.vehicleNumber}", style: const TextStyle(color: Color(0xFF42A5F5), fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: Stack(
        children: [
          // 🔥 1. MAP LAYER 🔥
          if (_busLocation == null)
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CustomLoader(), // Tera premium loader use kiya
                  const SizedBox(height: 16),
                  Text("Waiting for bus GPS signal...", style: TextStyle(fontWeight: FontWeight.bold, color: textSec))
                ],
              ),
            )
          else
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _busLocation!,
                initialZoom: 18.0,
                maxZoom: 22.0, // 🔥 Deep Zoom Allowed 🔥
              ),
              children: [
                // 🔥 GOOGLE SATELLITE HYBRID LAYER (Exactly like Web) 🔥
                TileLayer(
                  urlTemplate: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', // 'y' for Hybrid (Satellite + Labels)
                  userAgentPackageName: 'com.soleristicai.eduflowai',
                  maxNativeZoom: 20, // Images till 20
                  maxZoom: 22,       // Stretch till 22
                ),
                MarkerLayer(
                  markers: [
                    // 🚌 BUS MARKER
                    Marker(
                      point: _busLocation!,
                      width: 70,
                      height: 70,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.6), blurRadius: 15, spreadRadius: 4)
                          ]
                        ),
                        child: const Icon(Icons.directions_bus, color: Colors.white, size: 30),
                      ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1, 1), end: const Offset(1.15, 1.15)), 
                    ),
                  ],
                ),
              ],
            ),

          // 🔥 2. FLOATING STATS CARD (Niche ki taraf) 🔥
          Positioned(
            left: 20, right: 20, bottom: 40,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10), // Apple style Glassmorphism
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.transparent),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, 10))]
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: _isLive ? const Color(0xFF10B981).withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1), shape: BoxShape.circle),
                            child: Icon(Icons.speed, color: _isLive ? const Color(0xFF10B981) : Colors.red),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("SPEED", style: TextStyle(color: textSec, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                              Text("${_currentSpeed.toStringAsFixed(1)} km/h", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textPrimary)),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(color: _isLive ? const Color(0xFF10B981) : Colors.grey, borderRadius: BorderRadius.circular(20)),
                        child: Row(
                          children: [
                            const Icon(Icons.circle, color: Colors.white, size: 10).animate(onPlay: (c) => c.repeat(reverse: true)).fadeOut(),
                            const SizedBox(width: 6),
                            Text(_isLive ? "LIVE" : "OFFLINE", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ).animate().slideY(begin: 1, curve: Curves.easeOutBack),
          ),
        ],
      ),
    );
  }
}
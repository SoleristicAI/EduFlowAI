import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/network/socket_service.dart';

class LiveTrackingScreen extends StatefulWidget {
  final String vehicleId;
  final String vehicleNumber;
  
  const LiveTrackingScreen({
    super.key, 
    required this.vehicleId, 
    required this.vehicleNumber
  });

  @override
  State<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends State<LiveTrackingScreen> {
  final SocketService _socketService = SocketService();
  final MapController _mapController = MapController();
  
  LatLng? _busLocation; // Bus ki current location
  double _currentSpeed = 0.0;
  bool _isLive = false;

  @override
  void initState() {
    super.initState();
    _initLiveTracking();
  }

  void _initLiveTracking() {
    // 1. Bus ke socket room mein join karo
    _socketService.joinBusRoom(widget.vehicleId);

    // 2. Server se aane wali live location suno
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

      // Map ko automatically bus ki nayi location par center kar do
      _mapController.move(_busLocation!, 16.0);
    });
  }

  @override
  void dispose() {
    // Screen band hone par socket listener hata do
    _socketService.socket.off('receive_location');
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: Column(
          children: [
            Text("LIVE TRACKING", style: const TextStyle(color: Colors.black87, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1)),
            Text("BUS: ${widget.vehicleNumber}", style: const TextStyle(color: Color(0xFF4A90E2), fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: Stack(
        children: [
          // 🔥 1. OPENSTREETMAP LAYER 🔥
          if (_busLocation == null)
            const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Color(0xFF4A90E2)),
                  SizedBox(height: 16),
                  Text("Waiting for bus GPS signal...", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))
                ],
              ),
            )
          else
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _busLocation!,
                initialZoom: 16.0,
                maxZoom: 19.0, // Kitna zoom in kar sakte hain
              ),
              children: [
                TileLayer(
                  // Ye free tile server hai, bilkul Google Maps jaisa dikhega
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.soleristicai.eduflowai',
                ),
                MarkerLayer(
                  markers: [
                    // 🚌 BUS MARKER
                    Marker(
                      point: _busLocation!,
                      width: 60,
                      height: 60,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.4), blurRadius: 10, spreadRadius: 2)
                          ]
                        ),
                        child: const Icon(Icons.directions_bus, color: Colors.white, size: 30),
                      ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1)), // Halki si dhadkan (pulse) aayegi live feel dene ke liye
                    ),
                  ],
                ),
              ],
            ),

          // 🔥 2. FLOATING STATS CARD (Niche ki taraf) 🔥
          Positioned(
            left: 20, right: 20, bottom: 40,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
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
                          const Text("SPEED", style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                          Text("${_currentSpeed.toStringAsFixed(1)} km/h", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: _isLive ? const Color(0xFF10B981) : Colors.grey, borderRadius: BorderRadius.circular(20)),
                    child: Row(
                      children: [
                        Icon(Icons.circle, color: Colors.white, size: 10).animate(onPlay: (c) => c.repeat(reverse: true)).fadeOut(),
                        const SizedBox(width: 6),
                        Text(_isLive ? "LIVE" : "OFFLINE", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                      ],
                    ),
                  )
                ],
              ),
            ).animate().slideY(begin: 1, curve: Curves.easeOutBack),
          ),
        ],
      ),
    );
  }
}
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../constants/app_config.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  late IO.Socket socket;

  void initSocket() {
    // AppConfig se base URL uthayega (jaise tera backend render ya localhost par hai)
    String baseUrl = AppConfig.baseUrl.replaceAll('/api', ''); 

    socket = IO.io(baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket.connect();

    socket.onConnect((_) {
      print('⚡ Connected to WebSocket Server: ${socket.id}');
    });

    socket.onDisconnect((_) {
      print('🔌 Disconnected from WebSocket Server');
    });
  }

  // Bus room join karne ke liye
  void joinBusRoom(String vehicleId) {
    socket.emit('join_bus_room', vehicleId);
    print('🚌 Joined room for bus: $vehicleId');
  }

  // Live Location bhejne ke liye
  void sendLocation({
    required String vehicleId,
    required double latitude,
    required double longitude,
    required double speed,
  }) {
    socket.emit('send_location', {
      'vehicleId': vehicleId,
      'latitude': latitude,
      'longitude': longitude,
      'speed': speed,
    });
  }

  void disconnect() {
    socket.disconnect();
  }
}
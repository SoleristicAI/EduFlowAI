class AppConfig {
  // 🔥 TERA CURRENT IP (Hotspot ya WiFi badle toh bas ise change karna)
  static const String currentIp = "192.168.20.122";
  
  // ---------------------------------------------------------
  // 🟢 DEVELOPMENT ENVIRONMENT 
  // ---------------------------------------------------------
  static const String baseUrl = "http://$currentIp:5000/api";
  static const String mediaBaseUrl = "http://$currentIp:5000";

  // ---------------------------------------------------------
  // 🚀 PRODUCTION ENVIRONMENT (For Play Store / App Store)
  // ---------------------------------------------------------
  // static const String baseUrl = "https://your-live-domain.com/api";
  // static const String mediaBaseUrl = "https://your-live-domain.com";

  // 🔥 UNIVERSAL HELPER FUNCTION FOR ALL UPLOADS (Avatars, Leaves, Tech Issues)
  static String getAbsoluteUrl(String path) {
    if (path.isEmpty) return "";
    
    // Agar path pehle se http/https hai (jaise Google Profile pic), toh wahi return kar do
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path; 
    }
    
    // Agar path mein shuru mein '/' nahi hai toh laga do, taaki URL sahi bane
    if (!path.startsWith('/')) {
      path = '/$path';
    }
    
    return "$mediaBaseUrl$path";
  }
}
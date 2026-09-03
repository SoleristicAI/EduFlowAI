class AppConfig {
  // =========================================================
  // 🚀 PRODUCTION ENVIRONMENT (For Play Store / App Store)
  // (Jab app final live karni ho, tab inko UNCOMMENT karna)
  // =========================================================
  // static const String baseUrl = "https://eduflowai-3a47.onrender.com/api";
  // static const String mediaBaseUrl = "https://eduflowai-3a47.onrender.com";

  // =========================================================
  // 🛠️ LOCAL DEVELOPMENT ENVIRONMENT (For Phone/WiFi Testing)
  // (Abhi inko active rakha hai. Live karte time inko COMMENT kar dena)
  // =========================================================
  static const String baseUrl = "http://192.168.31.129:5000/api";
  static const String mediaBaseUrl = "http://192.168.31.129:5000";

  // 🔥 UNIVERSAL HELPER FUNCTION FOR ALL UPLOADS (Avatars, Leaves, Tech Issues)
  static String getAbsoluteUrl(String path) {
    if (path.isEmpty) return "";
    
    // Agar path pehle se http/https hai (jaise Google Profile pic ya Cloudinary), toh wahi return kar do
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
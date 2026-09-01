class AppConfig {
  // ---------------------------------------------------------
  // 🚀 PRODUCTION ENVIRONMENT (For Play Store / App Store)
  // ---------------------------------------------------------
  // 🔥 RENDER LIVE BACKEND URL 🔥
  static const String baseUrl = "https://eduflowai-3a47.onrender.com/api";
  static const String mediaBaseUrl = "https://eduflowai-3a47.onrender.com";

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
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/theme_provider.dart';
import 'core/network/api_client.dart';
import 'routes/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiClient.init(); // Load saved token
  runApp(const ProviderScope(child: EduFlowApp())); 
}

// 🔥 1. StatelessWidget ki jagah ConsumerWidget lagana hai
class EduFlowApp extends ConsumerWidget {
  const EduFlowApp({super.key});

  // 🔥 2. build method mein 'WidgetRef ref' add karna padta hai
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    
    // 🔥 3. Global theme state ko yahan listen karna hai
    final themeMode = ref.watch(themeProvider);

    return MaterialApp.router(
      title: 'EduFlowAI',
      debugShowCheckedModeBanner: false,
      
      // 🔥 4. Yahan App ko batana hai ki kaunsa mode chalana hai
      themeMode: themeMode, 
      
      // Light Theme
      theme: ThemeData(
        primarySwatch: Colors.blue, 
        fontFamily: 'sans-serif',
        scaffoldBackgroundColor: const Color(0xFFF8FAFC), 
      ),
      
      // Dark Theme
      darkTheme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0F172A), 
      ),
      
      routerConfig: appRouter,
    );
  }
}
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.light) {
    _loadThemeForUser();
  }

  // App start hone par User ID check karke uska theme fetch karega
  Future<void> _loadThemeForUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    
    if (userStr != null) {
      final user = jsonDecode(userStr);
      final userId = user['_id'] ?? 'default';
      
      // Har user ka theme alag key se save hoga
      final isDark = prefs.getBool('theme_$userId') ?? false;
      state = isDark ? ThemeMode.dark : ThemeMode.light;
    }
  }

  // Toggle dabane par State + Database dono update honge
  Future<void> toggleTheme() async {
    state = state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    
    if (userStr != null) {
      final user = jsonDecode(userStr);
      final userId = user['_id'] ?? 'default';
      
      await prefs.setBool('theme_$userId', state == ThemeMode.dark);
    }
  }
}

// Global Provider jisko poori app access karegi
final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  return ThemeNotifier();
});
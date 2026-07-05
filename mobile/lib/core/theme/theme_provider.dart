import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.light) {
    loadThemeForCurrentUser(); // App start hone par chalega
  }

  // 🔥 NAYA METHOD: Jab bhi naya banda login karega, ye uski ID ka theme load karega
  Future<void> loadThemeForCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    
    if (userStr != null) {
      final user = jsonDecode(userStr);
      final userId = user['_id'] ?? 'default';
      
      final isDark = prefs.getBool('theme_$userId') ?? false;
      state = isDark ? ThemeMode.dark : ThemeMode.light;
    } else {
      state = ThemeMode.light; // Agar koi logged in nahi hai to default light
    }
  }

  // 🔥 NAYA METHOD: Logout ke waqt theme ko wapas default light par lane ke liye
  void resetTheme() {
    state = ThemeMode.light;
  }

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

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  return ThemeNotifier();
});
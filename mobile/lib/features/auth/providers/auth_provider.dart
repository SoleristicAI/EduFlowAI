import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';

class AuthState {
  final bool isLoading;
  final String? error;
  AuthState({this.isLoading = false, this.error});
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState());

  Future<bool> login(String email, String password, BuildContext context) async {
    state = AuthState(isLoading: true, error: null);
    try {
      final response = await ApiClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final prefs = await SharedPreferences.getInstance();
      
      // Multi-Account Array Fetch ya Initialize
      String? accountsJson = prefs.getString('saved_accounts');
      List<dynamic> accountsList = accountsJson != null ? jsonDecode(accountsJson) : [];

      Map<String, dynamic> newAccount = Map<String, dynamic>.from(response.data);
      String newUserId = newAccount['_id'] ?? newAccount['id'] ?? email;

      // Agar account pehle se saved hai toh use update kar do, warna add kar do
      int existingIndex = accountsList.indexWhere((acc) => (acc['_id'] ?? acc['id'] ?? acc['email']) == newUserId);
      if (existingIndex != -1) {
        accountsList[existingIndex] = newAccount;
      } else {
        accountsList.add(newAccount);
      }

      // Save updated accounts array & active user
      await prefs.setString('saved_accounts', jsonEncode(accountsList));
      await prefs.setString('user', jsonEncode(newAccount));

      // 🔥 FIX: NAYA TOKEN API CLIENT KO DO! 🔥
      if (newAccount['token'] != null) {
        ApiClient.dio.options.headers['Authorization'] = 'Bearer ${newAccount['token']}';
      }

      state = AuthState(isLoading: false);
      return true; // Login success
    } on DioException catch (e) {
      String errorMessage = "Login failed! Check your credentials.";
      if (e.response != null && e.response?.data != null) {
        errorMessage = e.response?.data['message'] ?? errorMessage;
      }
      state = AuthState(isLoading: false, error: errorMessage);
      return false; // Login failed
    } catch (e) {
      state = AuthState(isLoading: false, error: "System error occurred.");
      return false;
    }
  }

  // 🔥 UNIVERSAL OTP LOGIC 🔥
  Future<String?> sendOtp(String identity) async {
    try {
      // 1. Backend ko 'email' ki jagah 'identity' bhejna hai
      await ApiClient.dio.post('/auth/send-otp', data: {'identity': identity});
      return null; 
    } on DioException catch (e) {
      // 2. Hardcoded "Invalid email" hata diya. Ab jo backend bolega wahi error aayega!
      return e.response?.data['message'] ?? "System error. Try again.";
    }
  }

  Future<String?> resetPassword(Map<String, dynamic> data) async {
    try {
      await ApiClient.dio.post('/auth/reset-password', data: data);
      return null;
    } on DioException catch (e) {
      return e.response?.data['message'] ?? "Reset Failed";
    }
  }

  // 🔥 ACCOUNT SWITCH LOGIC 🔥
  Future<void> switchAccount(Map<String, dynamic> accountData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user', jsonEncode(accountData));

    // 🔥 FIX: SWITCH KARTE WAQT BHI API CLIENT KO NAYA TOKEN DO! 🔥
    if (accountData['token'] != null) {
      ApiClient.dio.options.headers['Authorization'] = 'Bearer ${accountData['token']}';
    }
  }

  // 🔥 ACCOUNT REMOVE LOGIC 🔥
  Future<void> removeAccount(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    String? accountsJson = prefs.getString('saved_accounts');
    if (accountsJson != null) {
      List<dynamic> accountsList = jsonDecode(accountsJson);
      accountsList.removeWhere((acc) => (acc['_id'] ?? acc['id'] ?? acc['email']) == userId);
      await prefs.setString('saved_accounts', jsonEncode(accountsList));

      if (accountsList.isNotEmpty) {
        final nextUser = accountsList.first;
        await prefs.setString('user', jsonEncode(nextUser));
        
        // 🔥 FIX: REMOVE HONE KE BAAD AGLA JO USER BANA HAI, USKA TOKEN BHI DO 🔥
        if (nextUser['token'] != null) {
          ApiClient.dio.options.headers['Authorization'] = 'Bearer ${nextUser['token']}';
        }
      } else {
        await prefs.remove('user');
        ApiClient.dio.options.headers.remove('Authorization');
      }
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class MyAccount extends ConsumerStatefulWidget {
  const MyAccount({super.key});

  @override
  ConsumerState<MyAccount> createState() => _MyAccountState();
}

class _NavbarHeader extends StatelessWidget {
  final VoidCallback onBackPressed;
  final String title;

  const _NavbarHeader({required this.onBackPressed, required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(top: 60, bottom: 80, left: 24, right: 24),
      decoration: const BoxDecoration(
        color: Color(0xFF42A5F5),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(55)),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: onBackPressed,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _MyAccountState extends ConsumerState<MyAccount> {
  bool isInitialLoading = true;
  bool isUploading = false;
  Map<String, dynamic>? user;
  Map<String, dynamic>? schoolData;
  String? avatarPreview;

  // 🔥 REGIONAL NETWORK BALANCER IP 🔥
  final String currentLaptopIP = "10.163.134.38";

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isInitialLoading = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      
      if (userStr != null) {
        user = jsonDecode(userStr);
        _sanitizeAvatarPath();
      }

      if (user?['role'] == 'admin') {
        final response = await ApiClient.dio.get('/school/subscription-status');
        if (response.data != null) {
          schoolData = response.data['school'];
        }
      }
    } catch (e) {
      debugPrint("Institutional Node Context Retrieval Interrupted: $e");
    } finally {
      if (mounted) {
        setState(() {
          isInitialLoading = false;
        });
      }
    }
  }

  void _sanitizeAvatarPath() {
    if (user?['avatar'] != null) {
      String avatar = user!['avatar'].toString();
      if (avatar.startsWith('http')) {
        avatarPreview = avatar.replaceAll('localhost', currentLaptopIP).replaceAll('127.0.0.1', currentLaptopIP);
      } else {
        avatarPreview = "http://$currentLaptopIP:5000$avatar";
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _loadProfileData(isRefresh: true);
  }

Future<void> _handleImagePick() async {
    final ImagePicker picker = ImagePicker();
    final XFile? file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 60);
    
    if (file == null) return;

    setState(() => isUploading = true);

    try {
      String fileName = file.name;
      if (!fileName.contains('.')) fileName = '$fileName.jpg';

      FormData formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(file.path, filename: fileName),
      });

      final response = await ApiClient.dio.put('/auth/update-profile', data: formData);
      
      if (response.data != null && response.data['avatar'] != null) {
        final prefs = await SharedPreferences.getInstance();
        user!['avatar'] = response.data['avatar'];
        await prefs.setString('user', jsonEncode(user));

        setState(() {
          _sanitizeAvatarPath();
        });
        _showToast("Profile Photo Updated! 🧬");
      }
    } catch (e) {
      _showToast("Upload failed. ⚠️", isError: true);
    } finally {
      if (mounted) setState(() => isUploading = false);
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return "N/A";
    try {
      final parsed = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy').format(parsed);
    } catch (_) {
      return "N/A";
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isError ? Icons.error : Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 12))),
          ],
        ),
        backgroundColor: isError ? const Color(0xFFF43F5E) : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.all(20),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isInitialLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color boxBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    final String role = user?['role'] ?? 'student';
    final bool isAdmin = role == 'admin';

    String computedProfileName = "Guest Terminal";
    if (isAdmin) {
      computedProfileName = schoolData?['schoolName'] ?? user?['name'] ?? "Institution Node";
    } else {
      computedProfileName = user?['name'] ?? "System Client";
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) context.pop();
        else context.go('/');
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        color: bgColor,
        child: Scaffold(
          backgroundColor: Colors.transparent,
          body: RefreshIndicator(
            color: const Color(0xFF42A5F5),
            backgroundColor: cardColor,
            onRefresh: _handleRefresh,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      _NavbarHeader(
                        onBackPressed: () {
                          if (context.canPop()) context.pop();
                          else context.go('/');
                        },
                        title: isAdmin ? 'Institutional information' : 'Personal information',
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      // --- CARD ENVELOPE ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 400),
                            padding: const EdgeInsets.all(28),
                            decoration: BoxDecoration(
                              color: cardColor,
                              borderRadius: BorderRadius.circular(45),
                              border: Border.all(color: cardBorder),
                              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))]
                            ),
                            child: Column(
                              children: [
                                // --- PROFILE ARCHITECTURE ---
                                Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Container(
                                      width: 120, height: 120,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: boxBg,
                                        border: Border.all(color: cardColor, width: 4),
                                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 8))]
                                      ),
                                      child: isUploading 
                                        ? const Center(child: CircularProgressIndicator(color: Color(0xFF42A5F5)))
                                        : ClipOval(
                                            child: avatarPreview != null
                                              ? Image.network(avatarPreview!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Icon(Icons.account_circle, size: 100, color: textColorSecondary.withOpacity(0.4)))
                                              : Icon(Icons.account_circle, size: 100, color: textColorSecondary.withOpacity(0.4)),
                                          ),
                                    ),
                                    Positioned(
                                      bottom: 0, right: 0,
                                      child: GestureDetector(
                                        onTap: isUploading ? null : _handleImagePick,
                                        child: Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(color: const Color(0xFF42A5F5), shape: BoxShape.circle, border: Border.all(color: cardColor, width: 3)),
                                          child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                                        ),
                                      ),
                                    )
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  computedProfileName.toUpperCase(),
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: -0.5),
                                ),
                                const SizedBox(height: 12),

                                // --- BADGES DISAMBIGUATION ---
                                Wrap(
                                  spacing: 8, runSpacing: 8,
                                  alignment: WrapAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                      decoration: BoxDecoration(color: const Color(0xFF42A5F5).withOpacity(0.1), borderRadius: BorderRadius.circular(25), border: Border.all(color: const Color(0xFF42A5F5).withOpacity(0.2))),
                                      child: Text(
                                        isAdmin ? 'MASTER NODE AUTHORIZED' : role == 'student' ? 'CLASS: ${user?['grade'] ?? 'N/A'}' : 'FACULTY MEMBER',
                                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic),
                                      ),
                                    ),
                                    if (!isAdmin)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                        decoration: BoxDecoration(color: const Color(0xFF42A5F5).withOpacity(0.1), borderRadius: BorderRadius.circular(25), border: Border.all(color: const Color(0xFF42A5F5).withOpacity(0.2))),
                                        child: Text(
                                          (role == 'student' ? (user?['enrollmentNo'] ?? 'N/A') : (user?['employeeId'] ?? 'N/A')).toString().toUpperCase(),
                                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1),
                                        ),
                                      ),
                                    if (role == 'teacher' && user?['assignedClass'] != null)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                        decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.1), borderRadius: BorderRadius.circular(25), border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2))),
                                        child: Text(
                                          "ASSIGNED CLASS: ${user?['assignedClass']}".toUpperCase(),
                                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF10B981), fontStyle: FontStyle.italic),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 32),

                                // --- SUB-METRIC LABEL ---
                                Row(
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.only(left: 8, bottom: 12),
                                      child: Text(isAdmin ? 'ACCOUNT CREDENTIALS' : 'PROFILE DETAILS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 3, fontStyle: FontStyle.italic)),
                                    ),
                                  ],
                                ),
                                
                                // --- CONDITIONAL SEGMENT BLOCK ---
                                Column(
                                  children: isAdmin 
                                    ? _buildAdminFields(textColorPrimary, textColorSecondary, boxBg, cardBorder)
                                    : _buildClientFields(role, isDarkMode, textColorPrimary, textColorSecondary, boxBg, cardBorder),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 50), // 🔥 BOTTOM PADDING 50 LOCKED
                    ],
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- RENDERING NODE: ADMINISTRATOR ---
  List<Widget> _buildAdminFields(Color textPrimary, Color textSecondary, Color boxBg, Color cardBorder) {
    return [
      _buildDataRow(Icons.tag, "AFFILIATION CIPHER", (schoolData?['affiliationNo'] ?? user?['schoolId']?['affiliationNo'] ?? "N/A").toString().toUpperCase(), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      _buildDataRow(Icons.person_outline, "PRIMARY OPERATOR", (schoolData?['adminDetails']?['fullName'] ?? user?['name'] ?? "N/A").toString().toUpperCase(), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      _buildDataRow(Icons.phone_android, "CONTACT NO.", (schoolData?['adminDetails']?['mobile'] ?? user?['phone'] ?? "N/A").toString(), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      _buildDataRow(Icons.alternate_email, "EMAIL", (schoolData?['adminDetails']?['email'] ?? user?['email'] ?? "N/A").toString().toLowerCase(), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      _buildAddressBox(boxBg, cardBorder, textSecondary),
    ];
  }

  // --- RENDERING NODE: CLIENT (STUDENT/TEACHER) ---
  List<Widget> _buildClientFields(String role, bool isDarkMode, Color textPrimary, Color textSecondary, Color boxBg, Color cardBorder) {
    return [
      if (role == 'student') ...[
        _buildDataRow(Icons.tag, "ADMISSION NUMBER", (user?['admissionNo'] ?? "NOT_LOGGED").toString().toUpperCase(), isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.2) : const Color(0xFFEFF6FF), isDarkMode ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE), const Color(0xFF42A5F5), textSecondary),
        const SizedBox(height: 16),
      ],
      _buildDataRow(Icons.person_4_outlined, "FATHER'S NAME", (user?['fatherName'] ?? "UNSPECIFIED").toString().toUpperCase(), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      _buildDataRow(Icons.favorite_border, "MOTHER'S NAME", (user?['motherName'] ?? "UNSPECIFIED").toString().toUpperCase(), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      _buildDataRow(Icons.calendar_today, "DATE OF BIRTH", _formatDate(user?['dob']), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      _buildDataRow(Icons.face_retouching_natural, "GENDER", (user?['gender'] ?? "N/A").toString().toUpperCase(), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      _buildDataRow(Icons.phone_android, "CONTACT NO.", (user?['phone'] ?? "N/A").toString(), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      _buildDataRow(Icons.verified_user_outlined, "RELIGION", (user?['religion'] ?? "N/A").toString().toUpperCase(), boxBg, cardBorder, textPrimary, textSecondary),
      const SizedBox(height: 16),
      
      if (role == 'teacher') ...[
        _buildTeacherSubjectsBox(isDarkMode, boxBg, cardBorder, textPrimary, textSecondary),
        const SizedBox(height: 16),
      ] else ...[
        _buildDataRow(Icons.alternate_email, "REGISTERED EMAIL", (user?['email'] ?? "N/A").toString().toLowerCase(), boxBg, cardBorder, textPrimary, textSecondary),
        const SizedBox(height: 16),
      ],
      
      _buildAddressBox(boxBg, cardBorder, textSecondary),
    ];
  }

  // --- 🔥 FIXED: Bounding box removed around the entire row layout. Only icon box is styled now 🔥 ---
  Widget _buildDataRow(IconData icon, String label, String val, Color fill, Color border, Color textPrimary, Color textSecondary) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          // Icon retains its neat background styling box
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: fill, 
              borderRadius: BorderRadius.circular(16), 
              border: Border.all(color: border)
            ),
            child: Icon(icon, color: const Color(0xFF42A5F5), size: 22),
          ),
          const SizedBox(width: 16),
          // Details fields text are fully exposed without any outer box wrapper
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                const SizedBox(height: 4),
                Text(val, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary, fontStyle: FontStyle.italic)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildTeacherSubjectsBox(bool isDarkMode, Color boxBg, Color cardBorder, Color textPrimary, Color textSecondary) {
    List<dynamic> subjects = user?['subjects'] ?? [];
    String subStr = subjects.isNotEmpty ? subjects.join(', ').toUpperCase() : "NO SUBJECTS ASSIGNED";
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A).withOpacity(0.1) : const Color(0xFFEFF6FF).withOpacity(0.5), borderRadius: BorderRadius.circular(25), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("ASSIGNED SUBJECTS", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: const Color(0xFF42A5F5), letterSpacing: 1.5, fontStyle: FontStyle.italic)),
          const SizedBox(height: 4),
          Text(subStr, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textPrimary, fontStyle: FontStyle.italic)),
          const SizedBox(height: 12),
          Text("REGISTERED EMAIL", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
          const SizedBox(height: 4),
          Text((user?['email'] ?? 'N/A').toString().toLowerCase(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }

  Widget _buildAddressBox(Color boxBg, Color cardBorder, Color textSecondary) {
    String fullAddress = (user?['address']?['fullAddress'] ?? 'N/A').toString().toUpperCase();
    String district = (user?['address']?['district'] ?? '').toString().toUpperCase();
    String state = (user?['address']?['state'] ?? '').toString().toUpperCase();
    String pincode = (user?['address']?['pincode'] ?? '').toString();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: boxBg, 
              borderRadius: BorderRadius.circular(16), 
              border: Border.all(color: cardBorder)
            ),
            child: const Icon(Icons.map, color: Color(0xFF42A5F5), size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("HOME ADDRESS", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSecondary, letterSpacing: 2, fontStyle: FontStyle.italic)),
                const SizedBox(height: 6),
                Text("$fullAddress\n$district, $state - $pincode", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textSecondary, height: 1.4, fontStyle: FontStyle.italic)),
              ],
            ),
          )
        ],
      ),
    );
  }
}
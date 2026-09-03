import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class ManageFleetScreen extends ConsumerStatefulWidget {
  const ManageFleetScreen({super.key});

  @override
  ConsumerState<ManageFleetScreen> createState() => _ManageFleetScreenState();
}

class _ManageFleetScreenState extends ConsumerState<ManageFleetScreen> {
  bool isLoading = true;
  bool isSubmitting = false;
  int _activeTabIndex = 0; // 0: DRIVERS, 1: BUSES, 2: ROUTES

  String _driverSearch = '';
  String _busSearch = '';
  String _routeSearch = '';

  List<dynamic> drivers = [];
  List<dynamic> vehicles = [];
  List<dynamic> routes = [];

  @override
  void initState() {
    super.initState();
    _initData();
  }

  // ==========================================
  // 🔥 REAL BACKEND API LOGIC 🔥
  // ==========================================
  Future<void> _initData({bool isRefresh = false}) async {
    if (!isRefresh && mounted) setState(() => isLoading = true);

    try {
      final res = await Future.wait([
        ApiClient.dio.get('/transport/drivers'),
        ApiClient.dio.get('/transport/vehicles'),
        ApiClient.dio.get('/transport/routes'),
      ]);
      
      if (mounted) {
        setState(() {
          drivers = res[0].data ?? [];
          vehicles = res[1].data ?? [];
          routes = res[2].data ?? [];
        });
      }
    } catch (e) {
      _showToast("Failed to sync fleet data! 🛡️", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _confirmDelete(String type, String id) async {
    if (!mounted) return;
    Navigator.pop(context); // Close modal
    setState(() => isLoading = true);
    
    try {
      String endpoint = '';
      if (type == 'DRIVER') endpoint = '/transport/drivers/$id';
      if (type == 'VEHICLE') endpoint = '/transport/vehicles/$id';
      if (type == 'ROUTE') endpoint = '/transport/routes/$id';

      await ApiClient.dio.delete(endpoint);
      _showToast("$type deleted successfully! 🗑️");
      _initData(isRefresh: true);
    } catch (e) {
      _showToast("Cannot delete! Assigned elsewhere. ⚠️", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
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

  void _handleBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/transporter/dashboard');
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================
  int _calculateAge(String? dob) {
    if (dob == null || dob.isEmpty) return 0;
    try {
      final birthDate = DateTime.parse(dob);
      final today = DateTime.now();
      int age = today.year - birthDate.year;
      if (today.month < birthDate.month || (today.month == birthDate.month && today.day < birthDate.day)) age--;
      return age;
    } catch (e) {
      return 0;
    }
  }

  String _getDriverName(dynamic driverData) {
    if (driverData == null) return 'No Driver Assigned';
    if (driverData is Map) return driverData['name']?.toString() ?? 'Unknown';
    if (driverData is String) {
      final d = drivers.firstWhere((element) => element['_id'] == driverData, orElse: () => null);
      return d != null ? d['name'] : 'Unknown';
    }
    return 'Unknown';
  }

  Map<String, dynamic>? _getDriverObj(dynamic driverData) {
    if (driverData == null) return null;
    
    // Agar backend ne poora object (Map) bheja hai
    if (driverData is Map) {
      return Map<String, dynamic>.from(driverData);
    }
    
    // Agar backend ne sirf ID (String) bheji hai
    if (driverData is String) {
      final matches = drivers.where((element) => element['_id'] == driverData);
      if (matches.isNotEmpty) return matches.first;
    }
    
    return null;
  }

  String _getVehicleNumber(dynamic vehicleData) {
    if (vehicleData == null) return 'Not Assigned';
    if (vehicleData is Map) return vehicleData['vehicleNumber']?.toString() ?? 'Unknown';
    if (vehicleData is String) {
      final v = vehicles.firstWhere((element) => element['_id'] == vehicleData, orElse: () => null);
      return v != null ? v['vehicleNumber'] : 'Unknown';
    }
    return 'Unknown';
  }

  // ==========================================
  // MAIN BUILD
  // ==========================================
  @override
  Widget build(BuildContext context) {
    if (isLoading && drivers.isEmpty && vehicles.isEmpty) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8);
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    const Color accent = Color(0xFF42A5F5);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack();
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: accent,
          backgroundColor: cardColor,
          onRefresh: () => _initData(isRefresh: true),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()),
            slivers: [
              // --- PREMIUM GRADIENT HEADER ---
              SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.only(top: 60, bottom: 40, left: 24, right: 24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDarkMode ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] : [const Color(0xFF64B5F6), accent],
                      begin: Alignment.topCenter, end: Alignment.bottomCenter,
                    ),
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: _handleBack,
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withValues(alpha: 0.3))),
                              child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                            ),
                          ),
                          Column(
                            children: [
                              const Text("SETUP MANAGER", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
                              Text("DRIVERS, BUSES & ROUTES", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withValues(alpha: 0.9), letterSpacing: 2)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withValues(alpha: 0.3))),
                            child: const Icon(Icons.directions_bus, color: Colors.white, size: 24),
                          ),
                        ],
                      ),
                    ],
                  ),
                ).animate().slideY(begin: -0.2, duration: 500.ms),
              ),

              // --- 3 TABS (SEGMENTED CONTROL) ---
              SliverToBoxAdapter(
                child: Transform.translate(
                  offset: const Offset(0, -25),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      height: 60,
                      decoration: BoxDecoration(
                        color: cardColor,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
                      ),
                      child: Stack(
                        children: [
                          AnimatedPositioned(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOut,
                            top: 4, bottom: 4,
                            left: 4 + (_activeTabIndex * ((MediaQuery.of(context).size.width - 48 - 8) / 3)),
                            width: (MediaQuery.of(context).size.width - 48 - 8) / 3,
                            child: Container(
                              decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(26)),
                            ),
                          ),
                          Row(
                            children: [
                              _buildTabItem(0, "DRIVERS", Icons.people_alt, textColorSecondary),
                              _buildTabItem(1, "BUSES", Icons.directions_bus, textColorSecondary),
                              _buildTabItem(2, "ROUTES", Icons.map, textColorSecondary),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // --- DYNAMIC CONTENT BASED ON TAB ---
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (_activeTabIndex == 0) return _buildDriversTab(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary, inputBg);
                      if (_activeTabIndex == 1) return _buildVehiclesTab(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary, inputBg);
                      if (_activeTabIndex == 2) return _buildRoutesTab(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary, inputBg);
                      return const SizedBox();
                    },
                    childCount: 1,
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================
  // TAB BUILDERS
  // ==========================================
  Widget _buildTabItem(int index, String title, IconData icon, Color textColorSecondary) {
    final isSelected = _activeTabIndex == index;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => setState(() => _activeTabIndex = index),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: isSelected ? Colors.white : textColorSecondary),
              const SizedBox(width: 6),
              Text(title, style: TextStyle(
                color: isSelected ? Colors.white : textColorSecondary,
                fontSize: 10, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, letterSpacing: 1
              )),
            ],
          ),
        ),
      ),
    );
  }

  // 🔥 DRIVERS TAB 🔥
  Widget _buildDriversTab(bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec, Color inputBg) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader("Drivers List", "Total Drivers: ${drivers.length}", "Add Driver", () => _showDriverSheet(null, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), cardColor, cardBorder, textPrimary, textSec),
        _buildSearchBar("Search driver...", (val) => setState(() => _driverSearch = val), cardColor, cardBorder, textPrimary, textSec),
        
        ...drivers.where((d) => d['name'].toString().toLowerCase().contains(_driverSearch.toLowerCase()) || d['phone'].toString().contains(_driverSearch)).map((drv) {
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(24), border: Border.all(color: cardBorder)),
            child: Row(
              children: [
                Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)), child: Icon(Icons.person, color: textSec)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(drv['name'].toString().toUpperCase(), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(drv['phone'], style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textSec)),
                          Text(" • ", style: TextStyle(color: cardBorder)),
                          Text("AGE: ${_calculateAge(drv['dob'])}", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.teal)),
                        ],
                      )
                    ],
                  ),
                ),
                _buildActionButtons(() => _showDriverSheet(drv, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), () => _showDeleteConfirmModal('DRIVER', drv['_id'])),
              ],
            ),
          ).animate().fadeIn().slideX(begin: 0.05);
        }),
      ],
    );
  }

  // 🔥 VEHICLES TAB 🔥
  Widget _buildVehiclesTab(bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec, Color inputBg) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader("School Buses", "Total Buses: ${vehicles.length}", "Add Bus", () => _showBusSheet(null, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), cardColor, cardBorder, textPrimary, textSec, btnColor: Colors.teal),
        _buildSearchBar("Search bus number...", (val) => setState(() => _busSearch = val), cardColor, cardBorder, textPrimary, textSec),

        ...vehicles.where((v) => v['vehicleNumber'].toString().toLowerCase().contains(_busSearch.toLowerCase())).map((bus) {
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(24), border: Border.all(color: cardBorder)),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.3) : const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(20)), child: const Icon(Icons.directions_bus, color: Color(0xFF42A5F5))),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(bus['vehicleNumber'].toString().toUpperCase(), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                          const SizedBox(height: 4),
                          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: Colors.teal.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)), child: Text("CAPACITY: ${bus['seatingCapacity']}", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.teal))),
                        ],
                      ),
                    ),
                    _buildActionButtons(() => _showBusSheet(bus, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), () => _showDeleteConfirmModal('VEHICLE', bus['_id'])),
                  ],
                ),
                Padding(padding: const EdgeInsets.symmetric(vertical: 12), child: Divider(height: 1, color: cardBorder)),
                Row(
                  children: [
                    Icon(Icons.person, size: 14, color: textSec),
                    const SizedBox(width: 6),
                    Text("DRIVER: ", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textSec)),
                    Text(_getDriverName(bus['driver']).toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textPrimary)),
                  ],
                )
              ],
            ),
          ).animate().fadeIn().slideX(begin: 0.05);
        }),
      ],
    );
  }

  // 🔥 ROUTES TAB 🔥
  Widget _buildRoutesTab(bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec, Color inputBg) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader("Bus Routes", "Total Routes: ${routes.length}", "Create Route", () => _showRouteSheet(null, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), cardColor, cardBorder, textPrimary, textSec),
        _buildSearchBar("Search route name...", (val) => setState(() => _routeSearch = val), cardColor, cardBorder, textPrimary, textSec),

        ...routes.where((r) => r['routeName'].toString().toLowerCase().contains(_routeSearch.toLowerCase())).map((route) {
          final busObj = vehicles.firstWhere((v) => v['_id'] == (route['vehicle'] is Map ? route['vehicle']['_id'] : route['vehicle']), orElse: () => null);
          final driverObj = _getDriverObj(busObj?['driver'] is Map ? busObj['driver']['_id'] : busObj?['driver']);

          return Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(24), border: Border.all(color: cardBorder)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.indigo.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)), child: const Icon(Icons.navigation, color: Colors.indigo)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(route['routeName'].toString().toUpperCase(), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                          const SizedBox(height: 6),
                          Row(children: [const Icon(Icons.directions_bus, size: 12, color: Color(0xFF42A5F5)), const SizedBox(width: 4), Text("BUS: ${_getVehicleNumber(route['vehicle'])}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textPrimary))]),
                          if (driverObj != null) ...[
                            const SizedBox(height: 4),
                            Row(children: [const Icon(Icons.person, size: 12, color: Colors.teal), const SizedBox(width: 4), Text("DRIVER: ${driverObj['name']} • ${driverObj['phone']}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textPrimary))]),
                          ]
                        ],
                      ),
                    ),
                    _buildActionButtons(() => _showRouteSheet(route, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), () => _showDeleteConfirmModal('ROUTE', route['_id'])),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.only(left: 16),
                  decoration: BoxDecoration(border: Border(left: BorderSide(color: cardBorder, width: 2))),
                  child: Column(
                    children: (route['stops'] as List).map((stop) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(stop['stopName'].toString().toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textPrimary)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.currency_rupee, size: 10, color: Colors.teal), Text("${stop['monthlyFee']}/mo  ", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.teal)),
                              Icon(Icons.access_time, size: 10, color: textSec), Text(" P: ${stop['pickupTime']}  ", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textSec)),
                              Icon(Icons.access_time, size: 10, color: textSec), Text(" D: ${stop['dropTime']}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textSec)),
                            ],
                          )
                        ],
                      ),
                    )).toList(),
                  ),
                )
              ],
            ),
          ).animate().fadeIn().slideX(begin: 0.05);
        }),
      ],
    );
  }

  // ==========================================
  // REUSABLE UI WIDGETS
  // ==========================================
  Widget _buildSectionHeader(String title, String subtitle, String btnText, VoidCallback onBtnTap, Color cardColor, Color cardBorder, Color textPrimary, Color textSec, {Color btnColor = const Color(0xFF42A5F5)}) {
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(24), border: Border.all(color: cardBorder)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title.toUpperCase(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textPrimary)),
              Text(subtitle.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSec, letterSpacing: 1)),
            ],
          ),
          GestureDetector(
            onTap: onBtnTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(color: btnColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
              child: Row(
                children: [
                  Icon(Icons.add, color: btnColor, size: 16),
                  const SizedBox(width: 4),
                  Text(btnText.toUpperCase(), style: TextStyle(color: btnColor, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildSearchBar(String hint, Function(String) onChanged, Color cardColor, Color cardBorder, Color textPrimary, Color textSec) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(24), border: Border.all(color: cardBorder)),
      child: TextField(
        onChanged: onChanged,
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textPrimary),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: textSec),
          prefixIcon: Icon(Icons.search, color: textSec),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Widget _buildActionButtons(VoidCallback onEdit, VoidCallback onDelete) {
    return Row(
      children: [
        GestureDetector(onTap: onEdit, child: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: const Color(0xFF42A5F5).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.edit, size: 16, color: Color(0xFF42A5F5)))),
        const SizedBox(width: 8),
        GestureDetector(onTap: onDelete, child: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.redAccent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent))),
      ],
    );
  }

  Widget _buildLabel(String text, Color textSec) {
    return Padding(padding: const EdgeInsets.only(left: 8, bottom: 8, top: 16), child: Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textSec, letterSpacing: 1)));
  }

  Widget _buildTextField(TextEditingController ctrl, String hint, Color inputBg, Color cardBorder, Color textPrimary, Color textSec, {bool isNumber = false, bool isPassword = false, bool enabled = true}) {
    return Container(
      decoration: BoxDecoration(color: enabled ? inputBg : inputBg.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
      child: TextField(
        controller: ctrl,
        obscureText: isPassword,
        enabled: enabled,
        keyboardType: isNumber ? TextInputType.number : TextInputType.text,
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: enabled ? textPrimary : textSec),
        decoration: InputDecoration(hintText: hint, hintStyle: TextStyle(color: textSec), border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16)),
      ),
    );
  }

  // ==========================================
  // MODALS (BOTTOM SHEETS)
  // ==========================================
  
  void _showDeleteConfirmModal(String type, String id) {
    final isDark = ref.read(themeProvider) == ThemeMode.dark;
    
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Action',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, _, __) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              GestureDetector(onTap: () => Navigator.pop(ctx), child: Container(color: Colors.black.withValues(alpha: 0.6))),
              Center(
                child: Container(
                  width: MediaQuery.of(context).size.width * 0.85,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(color: isDark ? const Color(0xFF1E293B) : Colors.white, borderRadius: BorderRadius.circular(40)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(Icons.delete, color: Colors.red, size: 40)),
                      const SizedBox(height: 24),
                      Text("DELETE $type?", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: isDark ? Colors.white : Colors.black)),
                      const SizedBox(height: 12),
                      const Text("This action is permanent and cannot be undone.", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, height: 1.5)),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.pop(ctx),
                              child: Container(padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)), child: Text("CANCEL", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black, letterSpacing: 1.5))),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _confirmDelete(type, id),
                              child: Container(padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(20)), child: const Text("YES, DELETE", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.5))),
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                ).animate().scale(curve: Curves.easeOutBack),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showDriverSheet(Map<String, dynamic>? driver, bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec, Color inputBg) {
    final nameCtrl = TextEditingController(text: driver?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: driver?['phone'] ?? '');
    final customIdCtrl = TextEditingController(text: driver?['customId'] ?? '');
    final emailCtrl = TextEditingController(text: driver?['email'] ?? '');
    final addressCtrl = TextEditingController(text: driver?['address']?['fullAddress'] ?? '');
    final passCtrl = TextEditingController();
    
    DateTime selectedDob = driver?['dob'] != null ? DateTime.parse(driver!['dob']) : DateTime(1990);
    String gender = driver?['gender'] ?? 'Male';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.9,
          decoration: BoxDecoration(color: cardColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(40))),
          padding: EdgeInsets.only(left: 24, right: 24, top: 32, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(driver == null ? "ADD DRIVER" : "EDIT DRIVER", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textPrimary)),
              const SizedBox(height: 24),
              Expanded(
                child: ListView(
                  children: [
                    _buildLabel("FULL NAME", textSec), _buildTextField(nameCtrl, "e.g. Ramesh Singh", inputBg, cardBorder, textPrimary, textSec),
                    _buildLabel("PHONE NUMBER", textSec), _buildTextField(phoneCtrl, "10 Digit Number", inputBg, cardBorder, textPrimary, textSec, isNumber: true),
                    
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel("DATE OF BIRTH", textSec),
                              GestureDetector(
                                onTap: () async {
                                  final DateTime? picked = await showDatePicker(
                                    context: context,
                                    initialDate: selectedDob,
                                    firstDate: DateTime(1950),
                                    lastDate: DateTime.now(),
                                  );
                                  if (picked != null) setModalState(() => selectedDob = picked);
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(DateFormat('dd MMM yyyy').format(selectedDob), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textPrimary)),
                                      const Icon(Icons.calendar_today, size: 16, color: Color(0xFF42A5F5)),
                                    ],
                                  ),
                                ),
                              )
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel("GENDER", textSec),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    isExpanded: true,
                                    value: gender,
                                    dropdownColor: cardColor,
                                    items: ['Male', 'Female', 'Other'].map((g) => DropdownMenuItem(value: g, child: Text(g, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textPrimary)))).toList(),
                                    onChanged: (val) => setModalState(() => gender = val!),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                      ],
                    ),

                    const SizedBox(height: 16),
                    _buildLabel("EMAIL ADDRESS", textSec), _buildTextField(emailCtrl, "abc@gmail.com", inputBg, cardBorder, textPrimary, textSec),
                    _buildLabel("HOME ADDRESS", textSec), _buildTextField(addressCtrl, "Full Address", inputBg, cardBorder, textPrimary, textSec),

                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: const Color(0xFF42A5F5).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFF42A5F5).withValues(alpha: 0.3))),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("LOGIN CREDENTIALS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 1)),
                          const SizedBox(height: 12),
                          _buildLabel("CUSTOM LOGIN ID", textSec), _buildTextField(customIdCtrl, "e.g. driver_ramesh", inputBg, cardBorder, textPrimary, textSec, enabled: driver == null),
                          if (driver == null) ...[
                             _buildLabel("PASSWORD", textSec), _buildTextField(passCtrl, "••••••••", inputBg, cardBorder, textPrimary, textSec, isPassword: true),
                          ],
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),
                    GestureDetector(
                      onTap: () async {
                        if (nameCtrl.text.isEmpty || phoneCtrl.text.isEmpty || customIdCtrl.text.isEmpty) {
                          return _showToast("Please fill all required fields! ⚠️", isError: true);
                        }
                        if (driver == null && passCtrl.text.isEmpty) {
                          return _showToast("Password is required for new driver! ⚠️", isError: true);
                        }

                        setState(() => isSubmitting = true);
                        Map<String, dynamic> payload = {
                          'name': nameCtrl.text,
                          'phone': phoneCtrl.text,
                          'dob': DateFormat('yyyy-MM-dd').format(selectedDob),
                          'gender': gender,
                          'email': emailCtrl.text.toLowerCase(),
                          'address': addressCtrl.text,
                          'customId': customIdCtrl.text.replaceAll(' ', '').toLowerCase(),
                        };
                        if (driver == null) payload['password'] = passCtrl.text;

                        try {
                          if (driver == null) {
                            await ApiClient.dio.post('/transport/drivers', data: payload);
                            _showToast("Driver added! 👤");
                          } else {
                            await ApiClient.dio.put('/transport/drivers/${driver['_id']}', data: payload);
                            _showToast("Driver updated! ✅");
                          }
                          if (context.mounted) Navigator.pop(context);
                          _initData(isRefresh: true);
                        } catch (e) {
                          _showToast("Operation Failed! 🛡️", isError: true);
                        } finally {
                          setState(() => isSubmitting = false);
                        }
                      },
                      child: Container(width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(24)), child: Center(child: isSubmitting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text("SAVE DRIVER", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)))),
                    )
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  void _showBusSheet(Map<String, dynamic>? bus, bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec, Color inputBg) {
    final vehicleCtrl = TextEditingController(text: bus?['vehicleNumber'] ?? '');
    final capCtrl = TextEditingController(text: bus?['seatingCapacity']?.toString() ?? '');
    String? selectedDriver = bus?['driver'] is Map ? bus!['driver']['_id'] : bus?['driver'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: BoxDecoration(color: cardColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(40))),
          padding: EdgeInsets.only(left: 24, right: 24, top: 32, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(bus == null ? "ADD BUS" : "EDIT BUS", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textPrimary)),
              const SizedBox(height: 24),
              Expanded(
                child: ListView(
                  children: [
                    _buildLabel("BUS NUMBER PLATE", textSec), _buildTextField(vehicleCtrl, "e.g. DL10AB1234", inputBg, cardBorder, textPrimary, textSec),
                    _buildLabel("TOTAL SEATS", textSec), _buildTextField(capCtrl, "e.g. 50", inputBg, cardBorder, textPrimary, textSec, isNumber: true),
                    _buildLabel("ASSIGN DRIVER (OPTIONAL)", textSec),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          isExpanded: true,
                          dropdownColor: cardColor,
                          value: selectedDriver,
                          hint: Text("SELECT DRIVER", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textSec)),
                          items: drivers.map((d) {
                            // Find if driver is busy
                            final otherBus = vehicles.firstWhere((v) => v['driver'] == d['_id'] && v['_id'] != bus?['_id'], orElse: () => null);
                            String dLabel = "${d['name']} - Available";
                            if (otherBus != null) dLabel = "${d['name']} - Swap w/ ${otherBus['vehicleNumber']}";
                            return DropdownMenuItem(value: d['_id'].toString(), child: Text(dLabel, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textPrimary)));
                          }).toList(),
                          onChanged: (val) => setModalState(() => selectedDriver = val),
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    GestureDetector(
                      onTap: () async {
                        if (vehicleCtrl.text.isEmpty || capCtrl.text.isEmpty) {
                          return _showToast("Bus Number and Capacity required! ⚠️", isError: true);
                        }
                        setState(() => isSubmitting = true);
                        try {
                          Map<String, dynamic> payload = {
                            'vehicleNumber': vehicleCtrl.text.replaceAll(' ', '').toUpperCase(),
                            'seatingCapacity': capCtrl.text,
                            'driverId': selectedDriver
                          };
                          
                          if (bus == null) {
                            await ApiClient.dio.post('/transport/vehicles', data: payload);
                            _showToast("Bus added! 🚌");
                          } else {
                            await ApiClient.dio.put('/transport/vehicles/${bus['_id']}', data: payload);
                            _showToast("Bus updated! ✅");
                          }
                          if (context.mounted) Navigator.pop(context);
                          _initData(isRefresh: true);
                        } catch (e) {
                          _showToast("Operation Failed! 🛡️", isError: true);
                        } finally {
                          setState(() => isSubmitting = false);
                        }
                      },
                      child: Container(width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: Colors.teal, borderRadius: BorderRadius.circular(24)), child: Center(child: isSubmitting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text("SAVE BUS", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)))),
                    )
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  void _showRouteSheet(Map<String, dynamic>? route, bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec, Color inputBg) {
    final nameCtrl = TextEditingController(text: route?['routeName'] ?? '');
    String? selectedVehicle = route?['vehicle'] is Map ? route!['vehicle']['_id'] : route?['vehicle'];
    
    // Parse existing stops or initialize with one empty stop
    List<Map<String, dynamic>> stopsList = [];
    if (route != null && route['stops'] != null) {
      for (var s in route['stops']) {
        stopsList.add({
          'stopName': TextEditingController(text: s['stopName']),
          'monthlyFee': TextEditingController(text: s['monthlyFee']?.toString()),
          'pickupTime': s['pickupTime'] ?? '08:00 AM',
          'dropTime': s['dropTime'] ?? '02:00 PM',
        });
      }
    }
    if (stopsList.isEmpty) {
      stopsList.add({'stopName': TextEditingController(), 'monthlyFee': TextEditingController(), 'pickupTime': '08:00 AM', 'dropTime': '02:00 PM'});
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.9,
          decoration: BoxDecoration(color: cardColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(40))),
          padding: EdgeInsets.only(left: 24, right: 24, top: 32, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(route == null ? "CREATE ROUTE" : "EDIT ROUTE", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: textPrimary)),
              const SizedBox(height: 24),
              Expanded(
                child: ListView(
                  children: [
                    _buildLabel("ROUTE NAME", textSec), _buildTextField(nameCtrl, "e.g. ABC to XYZ", inputBg, cardBorder, textPrimary, textSec),
                    _buildLabel("ASSIGN BUS", textSec),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          isExpanded: true,
                          dropdownColor: cardColor,
                          value: selectedVehicle,
                          hint: Text("SELECT BUS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textSec)),
                          items: vehicles.map((v) => DropdownMenuItem(value: v['_id'].toString(), child: Text("${v['vehicleNumber']} (Seats: ${v['seatingCapacity']})", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textPrimary)))).toList(),
                          onChanged: (val) => setModalState(() => selectedVehicle = val),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("BUS STOPS", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary, letterSpacing: 1)),
                        GestureDetector(
                          onTap: () => setModalState(() => stopsList.add({'stopName': TextEditingController(), 'monthlyFee': TextEditingController(), 'pickupTime': '08:00 AM', 'dropTime': '02:00 PM'})),
                          child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: const Color(0xFF42A5F5).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: const Text("+ ADD STOP", style: TextStyle(color: Color(0xFF42A5F5), fontSize: 10, fontWeight: FontWeight.w900))),
                        )
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    ...stopsList.asMap().entries.map((entry) {
                      int idx = entry.key;
                      var stop = entry.value;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(24), border: Border.all(color: cardBorder)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("STOP ${idx + 1}", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5))),
                                if (stopsList.length > 1)
                                  GestureDetector(onTap: () => setModalState(() => stopsList.removeAt(idx)), child: const Icon(Icons.delete, color: Colors.redAccent, size: 16))
                              ],
                            ),
                            const SizedBox(height: 8),
                            _buildTextField(stop['stopName'], "Stop Name", cardColor, cardBorder, textPrimary, textSec),
                            const SizedBox(height: 8),
                            _buildTextField(stop['monthlyFee'], "Monthly Fee (₹)", cardColor, cardBorder, textPrimary, textSec, isNumber: true),
                          ],
                        ),
                      );
                    }),

                    const SizedBox(height: 32),
                    GestureDetector(
                      onTap: () async {
                        if (nameCtrl.text.isEmpty || selectedVehicle == null || stopsList.isEmpty) {
                          return _showToast("Route name, bus, and at least 1 stop required! ⚠️", isError: true);
                        }
                        
                        List<Map<String, dynamic>> finalStops = [];
                        for (var s in stopsList) {
                          if (s['stopName'].text.isEmpty || s['monthlyFee'].text.isEmpty) return _showToast("Stop details incomplete! ⚠️", isError: true);
                          finalStops.add({
                            'stopName': s['stopName'].text.toUpperCase(),
                            'monthlyFee': s['monthlyFee'].text,
                            'pickupTime': s['pickupTime'],
                            'dropTime': s['dropTime'],
                          });
                        }

                        setState(() => isSubmitting = true);
                        try {
                          Map<String, dynamic> payload = {
                            'routeName': nameCtrl.text.toUpperCase(),
                            'vehicleId': selectedVehicle,
                            'stops': finalStops
                          };
                          
                          if (route == null) {
                            await ApiClient.dio.post('/transport/routes', data: payload);
                            _showToast("Route created! 🗺️");
                          } else {
                            await ApiClient.dio.put('/transport/routes/${route['_id']}', data: payload);
                            _showToast("Route updated! ✅");
                          }
                          if (context.mounted) Navigator.pop(context);
                          _initData(isRefresh: true);
                        } catch (e) {
                          _showToast("Operation Failed! 🛡️", isError: true);
                        } finally {
                          setState(() => isSubmitting = false);
                        }
                      },
                      child: Container(width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 16), decoration: BoxDecoration(color: const Color(0xFF42A5F5), borderRadius: BorderRadius.circular(24)), child: Center(child: isSubmitting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text("SAVE ROUTE", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)))),
                    )
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
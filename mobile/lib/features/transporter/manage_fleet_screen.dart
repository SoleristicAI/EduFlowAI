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
    // 1. Screen ka sabse top-most layer (Overlay) nikaalo
    final overlay = Overlay.of(context);
    late OverlayEntry overlayEntry;

    // 2. Custom Toast Design banao jo humesha aage rahega
    overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 20, // Status bar ke theek neeche
        left: 20,
        right: 20,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isError ? const Color(0xFFF43F5E) : const Color(0xFF10B981),
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 5))],
            ),
            child: Row(
              children: [
                Icon(isError ? Icons.error : Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    message, 
                    style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 12, color: Colors.white)
                  )
                ),
              ],
            ),
          ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.5, end: 0, curve: Curves.easeOutBack), // Premium Drop Animation
        ),
      ),
    );

    // 3. Toast ko screen par dikhao
    overlay.insert(overlayEntry);

    // 4. 3 second baad automatically hat jao
    Future.delayed(const Duration(seconds: 3), () {
      if (overlayEntry.mounted) {
        overlayEntry.remove();
      }
    });
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
    if (driverData is Map) return Map<String, dynamic>.from(driverData);
    if (driverData is String) {
      final matches = drivers.where((element) => element['_id'] == driverData);
      if (matches.isNotEmpty) return matches.first;
    }
    return null;
  }

  String _getVehicleId(dynamic vehicleData) {
    if (vehicleData == null) return '';
    if (vehicleData is Map) return vehicleData['_id'].toString();
    return vehicleData.toString();
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

  Future<void> _pickTime(BuildContext context, String current, Function(String) onPicked) async {
    TimeOfDay initialTime = TimeOfDay.now();
    try {
      final format = DateFormat.jm();
      initialTime = TimeOfDay.fromDateTime(format.parse(current));
    } catch (_) {}

    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
      builder: (context, child) {
        final isDark = ref.read(themeProvider) == ThemeMode.dark;
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: ColorScheme.light(
              primary: const Color(0xFF42A5F5),
              onPrimary: Colors.white,
              surface: isDark ? const Color(0xFF1E293B) : Colors.white,
              onSurface: isDark ? Colors.white : Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && context.mounted) {
      final now = DateTime.now();
      final dt = DateTime(now.year, now.month, now.day, picked.hour, picked.minute);
      onPicked(DateFormat('hh:mm a').format(dt));
    }
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
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.bottomCenter,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(bottom: 30),
                        padding: const EdgeInsets.only(top: 60, bottom: 60, left: 24, right: 24),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: isDarkMode ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] : [const Color(0xFF64B5F6), accent],
                            begin: Alignment.topCenter, end: Alignment.bottomCenter,
                          ),
                          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                        ),
                        child: Row(
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
                            Expanded(
                              child: Column(
                                children: [
                                  const Text("SETUP MANAGER", textAlign: TextAlign.center, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -0.5)),
                                  Text("DRIVERS, BUSES & ROUTES", textAlign: TextAlign.center, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white.withValues(alpha: 0.9), letterSpacing: 2)),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withValues(alpha: 0.3))),
                              child: const Icon(Icons.directions_bus, color: Colors.white, size: 24),
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      Positioned(
                        bottom: 0,
                        left: 24,
                        right: 24,
                        child: Container(
                          height: 60,
                          decoration: BoxDecoration(
                            color: cardColor,
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
                          ),
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final tabWidth = (constraints.maxWidth - 8) / 3;
                              return Stack(
                                children: [
                                  AnimatedPositioned(
                                    duration: const Duration(milliseconds: 300),
                                    curve: Curves.easeOut,
                                    top: 4, bottom: 4,
                                    left: 4 + (_activeTabIndex * tabWidth),
                                    width: tabWidth,
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
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

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
              Icon(icon, size: 14, color: isSelected ? Colors.white : textColorSecondary),
              const SizedBox(width: 4),
              Flexible(
                child: Text(title, overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(
                  color: isSelected ? Colors.white : textColorSecondary,
                  fontSize: 10, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, letterSpacing: 1
                )),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message, Color textSec) {
    return Padding(
      padding: const EdgeInsets.only(top: 40, bottom: 20),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.search_off, size: 40, color: textSec.withValues(alpha: 0.5)),
            const SizedBox(height: 12),
            Text(message.toUpperCase(), textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textSec, letterSpacing: 1)),
          ],
        ),
      ),
    ).animate().fadeIn();
  }

  // 🔥 DRIVERS TAB 🔥
  Widget _buildDriversTab(bool isDark, Color cardColor, Color cardBorder, Color textPrimary, Color textSec, Color inputBg) {
    final filteredDrivers = drivers.where((d) => d['name'].toString().toLowerCase().contains(_driverSearch.toLowerCase()) || d['phone'].toString().contains(_driverSearch)).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader("Drivers List", "Total Drivers: ${drivers.length}", "Add Driver", () => _showDriverSheet(null, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), cardColor, cardBorder, textPrimary, textSec),
        _buildSearchBar("Search driver...", (val) => setState(() => _driverSearch = val), cardColor, cardBorder, textPrimary, textSec),
        
        if (filteredDrivers.isEmpty) _buildEmptyState("NO DRIVER FOUND", textSec),
        
        ...filteredDrivers.map((drv) {
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
                      Text(drv['name'].toString().toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary)),
                      const SizedBox(height: 6),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(drv['phone'], style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textSec)),
                          Padding(padding: const EdgeInsets.symmetric(horizontal: 4), child: Text("•", style: TextStyle(color: cardBorder))),
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
    final filteredVehicles = vehicles.where((v) => v['vehicleNumber'].toString().toLowerCase().contains(_busSearch.toLowerCase())).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader("School Buses", "Total Buses: ${vehicles.length}", "Add Bus", () => _showBusSheet(null, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), cardColor, cardBorder, textPrimary, textSec, btnColor: Colors.teal),
        _buildSearchBar("Search bus number...", (val) => setState(() => _busSearch = val), cardColor, cardBorder, textPrimary, textSec),

        if (filteredVehicles.isEmpty) _buildEmptyState("NO BUS FOUND", textSec),

        ...filteredVehicles.map((bus) {
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
                          Text(bus['vehicleNumber'].toString().toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary)),
                          const SizedBox(height: 4),
                          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: Colors.teal.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)), child: Text("CAPACITY: ${bus['seatingCapacity']}", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.teal))),
                        ],
                      ),
                    ),
                    _buildActionButtons(() => _showBusSheet(bus, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), () => _showDeleteConfirmModal('VEHICLE', bus['_id'])),
                  ],
                ),
                Padding(padding: const EdgeInsets.symmetric(vertical: 12), child: Divider(height: 1, color: cardBorder)),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.person, size: 14, color: textSec),
                    const SizedBox(width: 6),
                    Text("DRIVER: ", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textSec)),
                    Expanded(
                      child: Text(_getDriverName(bus['driver']).toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textPrimary)),
                    ),
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
    final filteredRoutes = routes.where((r) => r['routeName'].toString().toLowerCase().contains(_routeSearch.toLowerCase())).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader("Bus Routes", "Total Routes: ${routes.length}", "Create Route", () => _showRouteSheet(null, isDark, cardColor, cardBorder, textPrimary, textSec, inputBg), cardColor, cardBorder, textPrimary, textSec),
        _buildSearchBar("Search route name...", (val) => setState(() => _routeSearch = val), cardColor, cardBorder, textPrimary, textSec),

        if (filteredRoutes.isEmpty) _buildEmptyState("NO ROUTE FOUND", textSec),

        ...filteredRoutes.map((route) {
          final busObj = vehicles.firstWhere((v) => v['_id'] == _getVehicleId(route['vehicle']), orElse: () => null);
          final driverObj = _getDriverObj(busObj?['driver']);

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
                          Text(route['routeName'].toString().toUpperCase(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary)),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 8, runSpacing: 4,
                            children: [
                              Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [const Icon(Icons.directions_bus, size: 12, color: Color(0xFF42A5F5)), const SizedBox(width: 4), Flexible(child: Text("BUS: ${_getVehicleNumber(route['vehicle'])}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textPrimary)))]),
                              if (driverObj != null) 
                                Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [const Icon(Icons.person, size: 12, color: Colors.teal), const SizedBox(width: 4), Flexible(child: Text("DRIVER: ${driverObj['name']}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textPrimary)))]),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
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
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 8, runSpacing: 4,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Row(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.currency_rupee, size: 10, color: Colors.teal), const SizedBox(width: 2), Text("${stop['monthlyFee']}/mo", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.teal))]),
                              Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.access_time, size: 10, color: textSec), const SizedBox(width: 2), Text("P: ${stop['pickupTime']}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textSec))]),
                              Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.access_time, size: 10, color: textSec), const SizedBox(width: 2), Text("D: ${stop['dropTime']}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textSec))]),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title.toUpperCase(), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary)),
                const SizedBox(height: 2),
                Text(subtitle.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textSec, letterSpacing: 1)),
              ],
            ),
          ),
          const SizedBox(width: 12),
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
      mainAxisSize: MainAxisSize.min,
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

  // 🔥 CUSTOM UNIVERSAL BOTTOM SHEET DROPDOWN 🔥
  void _showOptionsSheet(String title, List<Map<String, String>> options, Function(String) onSelect, Color cardColor, Color cardBorder, Color textPrimary, Color textSec) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.5,
        decoration: BoxDecoration(color: cardColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(40))),
        padding: const EdgeInsets.only(left: 24, right: 24, top: 32, bottom: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: cardBorder, borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 24),
            Text("SELECT $title", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary, letterSpacing: 1)),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: options.length,
                itemBuilder: (context, index) {
                  return GestureDetector(
                    onTap: () {
                      onSelect(options[index]['value']!);
                      Navigator.pop(context);
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                      child: Text(options[index]['label']!.toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textPrimary)),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
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
    final confirmPassCtrl = TextEditingController();
    bool obscurePass = true;
    bool obscureConfirmPass = true;
    
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
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                  decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Flexible(child: Text(DateFormat('dd MMM yyyy').format(selectedDob), overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textPrimary))),
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
                              GestureDetector(
                                onTap: () => _showOptionsSheet("GENDER", [
                                  {'label': 'Male', 'value': 'Male'},
                                  {'label': 'Female', 'value': 'Female'},
                                  {'label': 'Other', 'value': 'Other'},
                                ], (val) => setModalState(() => gender = val), cardColor, cardBorder, textPrimary, textSec),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                  decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(gender.toUpperCase(), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: textPrimary)),
                                      const Icon(Icons.keyboard_arrow_down, color: Color(0xFF42A5F5), size: 16),
                                    ],
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
                             _buildLabel("PASSWORD", textSec), 
                             Container(
                               decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                               child: TextField(
                                 controller: passCtrl,
                                 obscureText: obscurePass,
                                 onChanged: (val) => setModalState(() {}), // UI update on type
                                 style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textPrimary),
                                 decoration: InputDecoration(
                                   hintText: "••••••••", hintStyle: TextStyle(color: textSec), border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                   suffixIcon: IconButton(
                                     icon: Icon(obscurePass ? Icons.visibility_off : Icons.visibility, color: textSec, size: 18),
                                     onPressed: () => setModalState(() => obscurePass = !obscurePass),
                                   ),
                                 ),
                               ),
                             ),
                             const SizedBox(height: 12),
                             _buildLabel("CONFIRM PASSWORD", textSec), 
                             Container(
                               decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                               child: TextField(
                                 controller: confirmPassCtrl,
                                 obscureText: obscureConfirmPass,
                                 onChanged: (val) => setModalState(() {}), // UI update on type
                                 style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textPrimary),
                                 decoration: InputDecoration(
                                   hintText: "••••••••", hintStyle: TextStyle(color: textSec), border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                   suffixIcon: IconButton(
                                     icon: Icon(obscureConfirmPass ? Icons.visibility_off : Icons.visibility, color: textSec, size: 18),
                                     onPressed: () => setModalState(() => obscureConfirmPass = !obscureConfirmPass),
                                   ),
                                 ),
                               ),
                             ),
                             // 🔥 Password Mismatch Error Label 🔥
                             if (passCtrl.text.isNotEmpty && confirmPassCtrl.text.isNotEmpty && passCtrl.text != confirmPassCtrl.text)
                               const Padding(
                                 padding: EdgeInsets.only(top: 8, left: 12),
                                 child: Text("Passwords do not match! ❌", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.redAccent)),
                               ),
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
                        if (driver == null) {
                          if (passCtrl.text.isEmpty || confirmPassCtrl.text.isEmpty) {
                            return _showToast("Password fields cannot be empty! ⚠️", isError: true);
                          }
                          if (passCtrl.text != confirmPassCtrl.text) {
                            return _showToast("Passwords do not match! ⚠️", isError: true);
                          }
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
    String? selectedDriverId = bus?['driver'] is Map ? bus!['driver']['_id'] : bus?['driver'];

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
                   _buildLabel("ASSIGN DRIVER ", textSec),
                    GestureDetector(
                      onTap: () {
                        List<Map<String, String>> options = []; 
                        for (var d in drivers) {
                          
                          // 🔥 NAYA LOGIC: Agar EDIT mode hai aur ye driver issi bus ka hai, toh usko list mein mat dikhao
                          if (bus != null) {
                            String currentDriverId = bus['driver'] is Map ? bus['driver']['_id'] : bus['driver']?.toString() ?? '';
                            if (currentDriverId == d['_id'].toString()) {
                              continue; // Is driver ko list mein add mat karo (Skip)
                            }
                          }

                          // Baaki drivers ke liye check karo ki wo free hain ya kisi aur bus mein hain
                          final otherBus = vehicles.firstWhere((v) => v['driver'] != null && (v['driver'] is Map ? v['driver']['_id'] : v['driver'].toString()) == d['_id'].toString() && v['_id'] != bus?['_id'], orElse: () => null);
                          
                          String label = "${d['name']} - Not Assigned";
                          if (otherBus != null) label = "${d['name']} - Swap w/ ${otherBus['vehicleNumber']}";
                          
                          options.add({'label': label, 'value': d['_id'].toString()});
                        }
                        
                        _showOptionsSheet("DRIVER", options, (val) => setModalState(() => selectedDriverId = val), cardColor, cardBorder, textPrimary, textSec);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(child: Text(selectedDriverId == null ? "SELECT DRIVER" : _getDriverName(selectedDriverId).toUpperCase(), overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: selectedDriverId == null ? textSec : textPrimary))),
                            const Icon(Icons.keyboard_arrow_down, color: Color(0xFF42A5F5), size: 16),
                          ],
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
                            'driverId': selectedDriverId
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
    String? selectedVehicleId = route?['vehicle'] is Map ? route!['vehicle']['_id'] : route?['vehicle'];
    
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

    // 🔥 BULLETPROOF TIME PARSING & SORTING (Bina kisi DateFormat plugin ke error ke) 🔥
    void sortStops() {
      stopsList.sort((a, b) {
        int timeToMinutes(String t) {
          try {
            final parts = t.split(' ');
            final timeParts = parts[0].split(':');
            int h = int.parse(timeParts[0]);
            int m = int.parse(timeParts[1]);
            if (parts[1].toUpperCase() == 'PM' && h != 12) h += 12;
            if (parts[1].toUpperCase() == 'AM' && h == 12) h = 0;
            return (h * 60) + m;
          } catch (_) { return 0; }
        }
        return timeToMinutes(a['pickupTime']).compareTo(timeToMinutes(b['pickupTime']));
      });
    }

    // Khulte hi ek baar sort kar do (agar edit mode hai)
    sortStops();

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
                    GestureDetector(
                      onTap: () {
                        List<Map<String, String>> options = []; 
                        for (var v in vehicles) {
                          if (route != null) {
                            String currentVehicleId = route['vehicle'] is Map ? route['vehicle']['_id'] : route['vehicle']?.toString() ?? '';
                            if (currentVehicleId == v['_id'].toString()) continue; 
                          }

                          final assignedRoute = routes.firstWhere((r) => _getVehicleId(r['vehicle']) == v['_id'].toString() && r['_id'] != route?['_id'], orElse: () => null);
                          String label = "${v['vehicleNumber']} (Seats: ${v['seatingCapacity']}) - Not Assigned";
                          if (assignedRoute != null) label = "${v['vehicleNumber']} - Assigned to ${assignedRoute['routeName']}";
                          options.add({'label': label, 'value': v['_id'].toString()});
                        }
                        _showOptionsSheet("BUS", options, (val) => setModalState(() => selectedVehicleId = val), cardColor, cardBorder, textPrimary, textSec);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(child: Text(selectedVehicleId == null ? "SELECT BUS" : _getVehicleNumber(selectedVehicleId).toUpperCase(), overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: selectedVehicleId == null ? textSec : textPrimary))),
                            const Icon(Icons.keyboard_arrow_down, color: Color(0xFF42A5F5), size: 16),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("BUS STOPS", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary, letterSpacing: 1)),
                        GestureDetector(
                          onTap: () => setModalState(() {
                            stopsList.add({'stopName': TextEditingController(), 'monthlyFee': TextEditingController(), 'pickupTime': '08:00 AM', 'dropTime': '02:00 PM'});
                            sortStops(); // 🔥 NEW STOP ADD HOTE HI SORT KAREGA
                          }),
                          child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: const Color(0xFF42A5F5).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: const Text("+ ADD STOP", style: TextStyle(color: Color(0xFF42A5F5), fontSize: 10, fontWeight: FontWeight.w900))),
                        )
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    ...stopsList.asMap().entries.map((entry) {
                      int idx = entry.key;
                      var stop = entry.value;
                      return Container(
                        key: ObjectKey(stop), // 🔥 MAGICAL FIX: Iske bina list update hone par text fields mix ho jate hain
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
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => _pickTime(context, stop['pickupTime'], (t) => setModalState(() {
                                      stop['pickupTime'] = t;
                                      sortStops(); // 🔥 TIME PICK HOTE HI AUTO-SLIDE/SORT HOGA 🔥
                                    })),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                                      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.access_time, size: 12, color: textSec),
                                          const SizedBox(width: 4),
                                          Text("P: ${stop['pickupTime']}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textPrimary)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => _pickTime(context, stop['dropTime'], (t) => setModalState(() => stop['dropTime'] = t)),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                                      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: cardBorder)),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.access_time, size: 12, color: textSec),
                                          const SizedBox(width: 4),
                                          Text("D: ${stop['dropTime']}", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textPrimary)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            )
                          ],
                        ),
                      );
                    }),

                    const SizedBox(height: 32),
                    GestureDetector(
                      onTap: () async {
                        if (nameCtrl.text.isEmpty || selectedVehicleId == null || stopsList.isEmpty) {
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

                        // 🔥 Backend Submit se pehle bhi final sort taaki Database hamesha clean rahe 🔥
                        finalStops.sort((a, b) {
                          try {
                            final partsA = a['pickupTime'].split(' ');
                            final timePartsA = partsA[0].split(':');
                            int hA = int.parse(timePartsA[0]), mA = int.parse(timePartsA[1]);
                            if (partsA[1].toUpperCase() == 'PM' && hA != 12) hA += 12;
                            if (partsA[1].toUpperCase() == 'AM' && hA == 12) hA = 0;

                            final partsB = b['pickupTime'].split(' ');
                            final timePartsB = partsB[0].split(':');
                            int hB = int.parse(timePartsB[0]), mB = int.parse(timePartsB[1]);
                            if (partsB[1].toUpperCase() == 'PM' && hB != 12) hB += 12;
                            if (partsB[1].toUpperCase() == 'AM' && hB == 12) hB = 0;

                            return ((hA * 60) + mA).compareTo((hB * 60) + mB);
                          } catch (_) { return 0; }
                        });

                        setState(() => isSubmitting = true);
                        try {
                          Map<String, dynamic> payload = {
                            'routeName': nameCtrl.text.toUpperCase(),
                            'vehicleId': selectedVehicleId,
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
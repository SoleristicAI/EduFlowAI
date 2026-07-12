import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class FinanceFeeSetup extends ConsumerStatefulWidget {
  const FinanceFeeSetup({super.key});

  @override
  ConsumerState<FinanceFeeSetup> createState() => _FinanceFeeSetupState();
}

class _FinanceFeeSetupState extends ConsumerState<FinanceFeeSetup> {
  bool isInitialLoading = true;
  bool isSaving = false;

  String selectedClass = '';
  bool isEditMode = true;
  List<dynamic> configuredList = [];

  final List<Map<String, dynamic>> feeCategories = [
    {
      'key': 'admissionFees',
      'label': '1. Admission fees',
      'desc': 'One-time fee at joining'
    },
    {
      'key': 'registrationFees',
      'label': '2. Registration fees',
      'desc': 'Paid while applying admission'
    },
    {
      'key': 'securityFees',
      'label': '3. Security fees',
      'desc': 'Refundable deposit'
    },
    {
      'key': 'tuitionFees',
      'label': '4. Tuition fees',
      'desc': 'Main academic fee (monthly)'
    },
    {
      'key': 'examinationFees',
      'label': '6. Examination fees',
      'desc': 'Charged during exams'
    },
    {
      'key': 'libraryFees',
      'label': '7. Library fees',
      'desc': 'Library resources'
    },
    {
      'key': 'laboratoryFees',
      'label': '8. Laboratory fees',
      'desc': 'Science/Computer labs'
    },
    {
      'key': 'activityFees',
      'label': '9. Activity fees',
      'desc': 'Sports, events, etc.'
    },
    {
      'key': 'developmentFees',
      'label': '10. Development fees',
      'desc': 'Infrastructure'
    },
    {
      'key': 'annualCharges',
      'label': '11. Annual charges',
      'desc': 'Yearly maintenance'
    },
    {
      'key': 'smartClassFees',
      'label': '12. Smart class fees',
      'desc': 'Digital learning'
    },
    {
      'key': 'uniformFees',
      'label': '13. Uniform fees',
      'desc': 'School uniform'
    },
    {
      'key': 'booksStationeryFees',
      'label': '14. Books & stationery',
      'desc': 'Study material'
    },
    {
      'key': 'idCardFees',
      'label': '15. Id card fees',
      'desc': 'Student identification'
    },
    {
      'key': 'lateFees',
      'label': '16. Late fees / Fine',
      'desc': 'Delayed payment charge'
    },
    {
      'key': 'readmissionFees',
      'label': '17. Re-admission fees',
      'desc': 'Rejoining student'
    },
    {
      'key': 'miscellaneousCharges',
      'label': '18. Miscellaneous charges',
      'desc': 'Extra trips, etc.'
    }
  ];

  Map<String, dynamic> feeData = {};

  final List<String> allClassList = [
    'Nursery',
    'LKG',
    'UKG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
    'Class 11',
    'Class 12'
  ];

  @override
  void initState() {
    super.initState();
    _resetFeeData();
    _fetchConfiguredList();
  }

  void _resetFeeData() {
    Map<String, dynamic> initial = {};
    for (var cat in feeCategories) {
      bool isDefaultMonthly = [
        'tuitionFees',
        'libraryFees',
        'laboratoryFees',
        'activityFees',
        'smartClassFees'
      ].contains(cat['key']);
      initial[cat['key']] = {
        'amount': 0,
        'isNone': false,
        'billingCycle': isDefaultMonthly ? 'monthly' : 'one-time'
      };
    }
    setState(() => feeData = initial);
  }

  Future<void> _fetchConfiguredList({bool hideLoader = false}) async {
    if (!hideLoader) setState(() => isInitialLoading = true);
    try {
      final res = await ApiClient.dio.get('/fees/structure/list/all');
      
      if (mounted) {
        List<dynamic> rawList = res.data ?? [];

        // 🔥 SMART SORTING LOGIC FOR CONFIGURED CLASSES 🔥
        rawList.sort((a, b) {
          String g1 = a['className'].toString().trim();
          String g2 = b['className'].toString().trim();

          int getWeight(String grade) {
            String g = grade.toLowerCase();
            if (g.contains('play') || g.contains('pre')) return -4;
            if (g.contains('nur')) return -3;
            if (g.contains('lkg') || g.contains('kg1')) return -2;
            if (g.contains('ukg') || g.contains('kg2')) return -1;
            
            final match = RegExp(r'\d+').firstMatch(g);
            if (match != null) return int.parse(match.group(0)!);
            return 999;
          }

          int w1 = getWeight(g1);
          int w2 = getWeight(g2);
          if (w1 != w2) return w1.compareTo(w2);
          return g1.compareTo(g2);
        });

        setState(() => configuredList = rawList);
      }
    } catch (e) {
      _showToast("List fetch error", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _fetchStructure(String className, {bool editMode = true}) async {
    setState(() {
      selectedClass = className;
      isEditMode = editMode;
      isInitialLoading = true;
    });

    try {
      final res = await ApiClient.dio.get('/fees/structure/$className');
      if (res.data['notFound'] == null || res.data['notFound'] == false) {
        if (mounted) setState(() => feeData = res.data['fees']);
      } else {
        _resetFeeData();
        if (mounted) setState(() => isEditMode = true);
      }
    } catch (e) {
      _showToast("Fetch structure error", isError: true);
      _resetFeeData();
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchConfiguredList(hideLoader: true);
    if (selectedClass.isNotEmpty) {
      await _fetchStructure(selectedClass, editMode: isEditMode);
    }
  }

  Future<void> _handleSave() async {
    if (selectedClass.isEmpty)
      return _showToast("Select class first! ⚠️", isError: true);
    setState(() => isSaving = true);
    try {
      await ApiClient.dio.post('/fees/structure/update',
          data: {'className': selectedClass, 'fees': feeData});
      _showToast("$selectedClass Structure locked! ⚡");
      setState(() => selectedClass = '');
      _resetFeeData();
      _fetchConfiguredList(hideLoader: true);
    } catch (e) {
      _showToast("Sync failed ❌", isError: true);
    } finally {
      setState(() => isSaving = false);
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(isError ? Icons.error : Icons.check_circle,
                color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
                child: Text(message,
                    style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontStyle: FontStyle.italic,
                        fontSize: 12))),
          ],
        ),
        backgroundColor:
            isError ? const Color(0xFFF43F5E) : const Color(0xFF10B981),
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

    final Color bgColor =
        isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder =
        isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary =
        isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary =
        isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color inputBg =
        isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (selectedClass.isNotEmpty) {
          setState(() {
            selectedClass = '';
            _resetFeeData();
          });
        } else {
          if (context.canPop())
            context.pop();
          else
            context.go('/finance/dashboard');
        }
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
              // 🔥 BouncingScrollPhysics ki jagah ClampingScrollPhysics lagana hai 🔥
              physics: const AlwaysScrollableScrollPhysics(
                  parent: ClampingScrollPhysics()),
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      // --- EXACT COPY OF YOUR PREMIUM HEADER ---
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.only(
                            top: 60, bottom: 80, left: 24, right: 24),
                        decoration: BoxDecoration(
                          color: const Color(0xFF42A5F5),
                          gradient: LinearGradient(
                            colors: isDarkMode
                                ? [
                                    const Color(0xFF1E3A8A),
                                    const Color(0xFF3B82F6)
                                  ]
                                : [
                                    const Color(0xFF64B5F6),
                                    const Color(0xFF42A5F5)
                                  ],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          borderRadius: const BorderRadius.vertical(
                              bottom: Radius.circular(55)),
                          boxShadow: const [
                            BoxShadow(
                                color: Colors.black12,
                                blurRadius: 15,
                                offset: Offset(0, 10))
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (selectedClass.isNotEmpty) {
                                  setState(() {
                                    selectedClass = '';
                                    _resetFeeData();
                                  });
                                } else {
                                  if (context.canPop())
                                    context.pop();
                                  else
                                    context.go('/finance/dashboard');
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: Colors.white.withOpacity(0.3)),
                                ),
                                child: const Icon(Icons.arrow_back,
                                    color: Colors.white, size: 24),
                              ),
                            ),
                            Column(
                              children: [
                                const Text("Fee Setup",
                                    style: TextStyle(
                                        fontSize: 26,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        fontStyle: FontStyle.italic,
                                        letterSpacing: -1)),
                                Text("FINANCIAL STRUCTURE",
                                    style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white.withOpacity(0.9),
                                        letterSpacing: 2)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.3)),
                              ),
                              child: const Icon(Icons.settings,
                                  color: Colors.white, size: 24),
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      // --- DYNAMIC BODY CONTENT ---
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: selectedClass.isEmpty
                              ? _buildSelectionView(
                                  isDarkMode,
                                  cardColor,
                                  cardBorder,
                                  textColorPrimary,
                                  textColorSecondary,
                                  inputBg)
                              : _buildConfigView(
                                  isDarkMode,
                                  cardColor,
                                  cardBorder,
                                  textColorPrimary,
                                  textColorSecondary,
                                  inputBg),
                        ),
                      ),
                      const SizedBox(height: 100), // Bottom Buffer
                    ],
                  ),
                ),
              ],
            ),
          ),

          // FLOATING SAVE BUTTON (Only in config mode)
          floatingActionButton: (selectedClass.isNotEmpty && isEditMode)
              ? SizedBox(
                  width: MediaQuery.of(context).size.width - 48,
                  height: 60, // 🔥 FIXED HEIGHT (Isse UI kabhi crash nahi hoga)
                  child: FloatingActionButton.extended(
                    onPressed: isSaving ? () {} : _handleSave, // Prevent double click
                    backgroundColor: const Color(0xFF42A5F5),
                    elevation: 10,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    label: isSaving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 3))
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.save, color: Colors.white, size: 18),
                              SizedBox(width: 8),
                              Text("CONFIRM SETUP",
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      letterSpacing: 2,
                                      fontStyle: FontStyle.italic)),
                            ],
                          ),
                  ),
                )
              : null,
          floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
        ),
      ),
    );
  }

  // ==========================================
  // VIEW 1: SELECTION AND CONFIGURED LIST
  // ==========================================
  Widget _buildSelectionView(bool isDarkMode, Color cardColor, Color cardBorder,
      Color textColorPrimary, Color textColorSecondary, Color inputBg) {
    return Column(
      key: const ValueKey('SelectionView'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. CREATE NEW CLASS STRUCTURE CARD
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
              color: const Color(0xFF42A5F5),
              borderRadius: BorderRadius.circular(40),
              boxShadow: [
                BoxShadow(
                    color: const Color(0xFF42A5F5).withOpacity(0.4),
                    blurRadius: 15,
                    offset: const Offset(0, 5))
              ]),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("CREATE FEE STRUCTURE",
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: Colors.white.withOpacity(0.8),
                      letterSpacing: 2,
                      fontStyle: FontStyle.italic)),
              const SizedBox(height: 20),
              GestureDetector(
                onTap: () => _showClassPickerBottomSheet(isDarkMode),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Choose class...",
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF94A3B8),
                              fontStyle: FontStyle.italic)),
                      const Icon(Icons.keyboard_arrow_down,
                          color: Color(0xFF42A5F5)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ).animate().fadeIn().slideY(begin: 0.1),

        const SizedBox(height: 32),
        Text("ACTIVE CONFIGURED CLASSES",
            style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: const Color(0xFF42A5F5),
                letterSpacing: 2,
                fontStyle: FontStyle.italic)),
        const SizedBox(height: 16),

        // 2. LIST OF ALREADY CONFIGURED CLASSES
        if (configuredList.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40),
            decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(35),
                border:
                    Border.all(color: cardBorder, style: BorderStyle.solid)),
            child: Column(
              children: [
                Icon(Icons.layers_clear,
                    size: 40, color: textColorSecondary.withOpacity(0.5)),
                const SizedBox(height: 12),
                Text("No classes defined yet",
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: textColorSecondary,
                        letterSpacing: 1.5)),
              ],
            ),
          )
        else
          ...configuredList.map((item) {
            String cName = item['className']?.toString() ?? 'Unknown';
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(35),
                  border: Border.all(color: cardBorder),
                  boxShadow: const [
                    BoxShadow(
                        color: Colors.black12,
                        blurRadius: 10,
                        offset: Offset(0, 4))
                  ]),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => _fetchStructure(cName, editMode: false),
                      child: Row(
                        children: [
                          Container(
                              padding: const EdgeInsets.all(12),
                              decoration: const BoxDecoration(
                                  color: Color(0xFF42A5F5),
                                  shape: BoxShape.circle),
                              child: const Icon(Icons.layers,
                                  size: 18, color: Colors.white)),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(cName.toUpperCase(),
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w900,
                                      color: textColorPrimary,
                                      fontStyle: FontStyle.italic)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.visibility,
                                      size: 12, color: Color(0xFF10B981)),
                                  const SizedBox(width: 4),
                                  const Text("View live structure",
                                      style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF10B981),
                                          letterSpacing: 1)),
                                ],
                              )
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _fetchStructure(cName, editMode: true),
                    child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                            color: isDarkMode
                                ? const Color(0xFF0F172A)
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: cardBorder)),
                        child: const Icon(Icons.edit,
                            size: 18, color: Color(0xFF42A5F5))),
                  ),
                ],
              ),
            ).animate().fadeIn().slideY(begin: 0.1);
          })
      ],
    );
  }

  // ==========================================
  // VIEW 2: CONFIGURATION EDITOR VIEW
  // ==========================================
  Widget _buildConfigView(bool isDarkMode, Color cardColor, Color cardBorder,
      Color textColorPrimary, Color textColorSecondary, Color inputBg) {
    return Column(
      key: const ValueKey('ConfigView'),
      children: [
        // 1. STATUS HEADER
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
              color: isEditMode
                  ? const Color(0xFF42A5F5)
                  : (isDarkMode
                      ? const Color(0xFF0F172A)
                      : const Color(0xFF1E293B)),
              borderRadius: BorderRadius.circular(35),
              boxShadow: isEditMode
                  ? [
                      BoxShadow(
                          color: const Color(0xFF42A5F5).withOpacity(0.4),
                          blurRadius: 15,
                          offset: const Offset(0, 5))
                    ]
                  : []),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(isEditMode ? Icons.edit : Icons.lock,
                      color: Colors.white, size: 24),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(selectedClass.toUpperCase(),
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              fontStyle: FontStyle.italic)),
                      const SizedBox(height: 4),
                      Text(isEditMode ? "EDIT MODE ACTIVE" : "READ-ONLY MODE",
                          style: TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              color: Colors.white.withOpacity(0.8),
                              letterSpacing: 2)),
                    ],
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  setState(() {
                    selectedClass = '';
                    _resetFeeData();
                  });
                },
                child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle),
                    child:
                        const Icon(Icons.close, size: 16, color: Colors.white)),
              )
            ],
          ),
        ).animate().fadeIn().slideX(begin: 0.1),
        const SizedBox(height: 24),

        // 2. FEE CATEGORY NODES
        ...feeCategories.map((cat) {
          String key = cat['key'];
          bool isNone = feeData[key]['isNone'];
          String cycle = feeData[key]['billingCycle'];

          return Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
                color: isNone ? inputBg : cardColor,
                borderRadius: BorderRadius.circular(35),
                border: Border.all(
                    color: isNone
                        ? cardBorder
                        : (isEditMode
                            ? const Color(0xFF42A5F5).withOpacity(0.3)
                            : cardBorder)),
                boxShadow: isNone
                    ? []
                    : const [
                        BoxShadow(
                            color: Colors.black12,
                            blurRadius: 10,
                            offset: Offset(0, 4))
                      ]),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category Title & Controls
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(cat['label'].toString().toUpperCase(),
                              style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                  color: isNone
                                      ? textColorSecondary
                                      : textColorPrimary,
                                  fontStyle: FontStyle.italic)),
                          const SizedBox(height: 4),
                          Text(cat['desc'].toString(),
                              style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: textColorSecondary,
                                  fontStyle: FontStyle.italic)),
                        ],
                      ),
                    ),

                    // Controls (Cycle & Checkbox)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                          color: isDarkMode
                              ? const Color(0xFF1E3A8A).withOpacity(0.2)
                              : Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: isDarkMode
                                  ? const Color(0xFF1E3A8A)
                                  : Colors.blue.shade100)),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: (!isEditMode || isNone)
                                ? null
                                : () => _showCyclePickerBottomSheet(
                                    key, isDarkMode),
                            child: Row(
                              children: [
                                Text(
                                    cycle == 'monthly'
                                        ? "PER MONTH"
                                        : "ONE TIME",
                                    style: TextStyle(
                                        fontSize: 8,
                                        fontWeight: FontWeight.w900,
                                        color: isNone
                                            ? textColorSecondary
                                            : const Color(0xFF42A5F5),
                                        letterSpacing: 1)),
                                const SizedBox(width: 4),
                                Icon(Icons.keyboard_arrow_down,
                                    size: 12,
                                    color: isNone
                                        ? textColorSecondary
                                        : const Color(0xFF42A5F5))
                              ],
                            ),
                          ),
                          Container(
                              height: 12,
                              width: 1,
                              color: isDarkMode
                                  ? const Color(0xFF1E3A8A)
                                  : Colors.blue.shade200,
                              margin:
                                  const EdgeInsets.symmetric(horizontal: 8)),
                          Row(
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: Checkbox(
                                  value: isNone,
                                  onChanged: isEditMode
                                      ? (val) {
                                          setState(() {
                                            feeData[key]['isNone'] = val;
                                            if (val == true)
                                              feeData[key]['amount'] = 0;
                                          });
                                        }
                                      : null,
                                  activeColor: const Color(0xFF42A5F5),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(4)),
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Text("NONE",
                                  style: TextStyle(
                                      fontSize: 8,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF94A3B8),
                                      letterSpacing: 1)),
                            ],
                          )
                        ],
                      ),
                    )
                  ],
                ),

                const SizedBox(height: 16),

                // Amount Input
                Container(
                  decoration: BoxDecoration(
                      color: isNone ? cardColor : inputBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: cardBorder)),
                  child: TextField(
                    keyboardType: TextInputType.number,
                    enabled: isEditMode && !isNone,
                    style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: isNone ? textColorSecondary : textColorPrimary,
                        fontStyle: FontStyle.italic),
                    decoration: InputDecoration(
                      prefixIcon: Padding(
                          padding: const EdgeInsets.only(left: 20, right: 10),
                          child: Icon(Icons.currency_rupee,
                              color: isNone
                                  ? textColorSecondary
                                  : const Color(0xFF42A5F5),
                              size: 24)),
                      prefixIconConstraints:
                          const BoxConstraints(minWidth: 0, minHeight: 0),
                      hintText: "0",
                      hintStyle: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: textColorSecondary.withOpacity(0.5)),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 20),
                    ),
                    controller: TextEditingController(
                        text: feeData[key]['amount'] == 0
                            ? ''
                            : feeData[key]['amount'].toString())
                      ..selection = TextSelection.collapsed(
                          offset: feeData[key]['amount'] == 0
                              ? 0
                              : feeData[key]['amount'].toString().length),
                    onChanged: (val) {
                      feeData[key]['amount'] =
                          val.isEmpty ? 0 : num.tryParse(val) ?? 0;
                    },
                  ),
                )
              ],
            ),
          ).animate().fadeIn().slideY(begin: 0.1);
        }),
      ],
    );
  }

  // --- BOTTOM SHEETS ---
  void _showClassPickerBottomSheet(bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.5,
          padding:
              const EdgeInsets.only(top: 12, left: 24, right: 24, bottom: 24),
          decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(40)),
              border: Border(
                  top: BorderSide(
                      color: isDark
                          ? const Color(0xFF334155)
                          : const Color(0xFFDDE3EA),
                      width: 2))),
          child: Column(
            children: [
              Container(
                  width: 50,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF334155)
                          : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(10))),
              const Text("SELECT CLASS",
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF42A5F5),
                      fontStyle: FontStyle.italic,
                      letterSpacing: 1)),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  itemCount: allClassList.length,
                  itemBuilder: (context, index) {
                    return GestureDetector(
                      onTap: () {
                        Navigator.pop(context);
                        _fetchStructure(allClassList[index], editMode: true);
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 16),
                        decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF0F172A)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                                color: isDark
                                    ? const Color(0xFF334155)
                                    : const Color(0xFFE2E8F0))),
                        child: Text(allClassList[index].toUpperCase(),
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                color: isDark ? Colors.white : Colors.black87,
                                letterSpacing: 1.5)),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showCyclePickerBottomSheet(String key, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding:
              const EdgeInsets.only(top: 12, left: 24, right: 24, bottom: 40),
          decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(40)),
              border: Border(
                  top: BorderSide(
                      color: isDark
                          ? const Color(0xFF334155)
                          : const Color(0xFFDDE3EA),
                      width: 2))),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                  width: 50,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF334155)
                          : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(10))),
              const Text("BILLING FREQUENCY",
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF42A5F5),
                      fontStyle: FontStyle.italic,
                      letterSpacing: 1)),
              const SizedBox(height: 24),
              GestureDetector(
                onTap: () {
                  setState(() => feeData[key]['billingCycle'] = 'one-time');
                  Navigator.pop(context);
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                      color: feeData[key]['billingCycle'] == 'one-time'
                          ? const Color(0xFF42A5F5).withOpacity(0.1)
                          : (isDark
                              ? const Color(0xFF0F172A)
                              : const Color(0xFFF1F5F9)),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: feeData[key]['billingCycle'] == 'one-time'
                              ? const Color(0xFF42A5F5)
                              : (isDark
                                  ? const Color(0xFF334155)
                                  : const Color(0xFFE2E8F0)))),
                  child: Text("ONE TIME PAYMENT",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: feeData[key]['billingCycle'] == 'one-time'
                              ? const Color(0xFF42A5F5)
                              : (isDark ? Colors.white : Colors.black87),
                          letterSpacing: 1.5)),
                ),
              ),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: () {
                  setState(() => feeData[key]['billingCycle'] = 'monthly');
                  Navigator.pop(context);
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                      color: feeData[key]['billingCycle'] == 'monthly'
                          ? const Color(0xFF42A5F5).withOpacity(0.1)
                          : (isDark
                              ? const Color(0xFF0F172A)
                              : const Color(0xFFF1F5F9)),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: feeData[key]['billingCycle'] == 'monthly'
                              ? const Color(0xFF42A5F5)
                              : (isDark
                                  ? const Color(0xFF334155)
                                  : const Color(0xFFE2E8F0)))),
                  child: Text("MONTHLY PAYMENT",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: feeData[key]['billingCycle'] == 'monthly'
                              ? const Color(0xFF42A5F5)
                              : (isDark ? Colors.white : Colors.black87),
                          letterSpacing: 1.5)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

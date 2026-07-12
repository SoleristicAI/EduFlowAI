import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class FinanceAddPayment extends ConsumerStatefulWidget {
  const FinanceAddPayment({super.key});

  @override
  ConsumerState<FinanceAddPayment> createState() => _FinanceAddPaymentState();
}

class _FinanceAddPaymentState extends ConsumerState<FinanceAddPayment> {
  bool isInitialLoading = true;
  bool isSubmitting = false;

  List<dynamic> classes = [];
  List<dynamic> students = [];

  // Form State
  String selectedGrade = '';
  String selectedEnrollmentNo = '';
  String paymentMode = 'Cash';
  String amountPaid = '';

  late String day;
  late String month;
  late String year;

  final List<String> monthList = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  @override
  void initState() {
    super.initState();
    final DateTime now = DateTime.now();
    day = now.day.toString().padLeft(2, '0');
    month = monthList[now.month - 1];
    year = now.year.toString();

    _fetchClasses();
  }

  Future<void> _fetchClasses() async {
    try {
      final res = await ApiClient.dio.get('/fees/setup/classes');
      if (mounted) {
        List<dynamic> rawGrades = res.data ?? [];

        // 🔥 SMART SORTING LOGIC FOR CLASSES 🔥
        rawGrades.sort((a, b) {
          String g1 = a.toString().trim();
          String g2 = b.toString().trim();

          // Har class ko ek numerical "weight" assign karenge
          int getWeight(String grade) {
            String g = grade.toLowerCase();
            if (g.contains('play') || g.contains('pre')) return -4;
            if (g.contains('nur')) return -3;
            if (g.contains('lkg') || g.contains('kg1')) return -2;
            if (g.contains('ukg') || g.contains('kg2')) return -1;

            // Agar number hai (e.g. "1", "9-A", "12th"), toh wahi number nikaalo
            final match = RegExp(r'\d+').firstMatch(g);
            if (match != null) return int.parse(match.group(0)!);

            return 999; // Agar kuch aur ulta-seedha hai toh sabse last mein daal do
          }

          int weight1 = getWeight(g1);
          int weight2 = getWeight(g2);

          // Agar dono ka weight alag hai, toh chote se bada sort karo (Ascending)
          if (weight1 != weight2) {
            return weight1.compareTo(weight2);
          }
          // Agar dono ka weight same hai (e.g. "10-A" aur "10-B"), toh alphabetically sort karo
          return g1.compareTo(g2);
        });

        setState(() => classes = rawGrades);
      }
    } catch (e) {
      _showToast("Failed to load classes", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  // 🔥 NATIVE REFRESH LOGIC 🔥
  Future<void> _handleRefresh() async {
    await _fetchClasses();
    if (selectedGrade.isNotEmpty) {
      await _handleClassChange(selectedGrade, hideLoader: true);
    }
  }

  Future<void> _handleClassChange(String grade,
      {bool hideLoader = false}) async {
    setState(() {
      selectedGrade = grade;
      selectedEnrollmentNo = '';
      students = [];
      if (!hideLoader) isInitialLoading = true;
    });

    try {
      final res = await ApiClient.dio.get('/fees/setup/students/$grade');
      if (mounted) setState(() => students = res.data ?? []);
    } catch (e) {
      _showToast("Failed to load students", isError: true);
    } finally {
      if (mounted) setState(() => isInitialLoading = false);
    }
  }

  Future<void> _handleSubmit() async {
    if (selectedGrade.isEmpty ||
        selectedEnrollmentNo.isEmpty ||
        amountPaid.isEmpty) {
      return _showToast("Please fill all mandatory fields! 🛡️", isError: true);
    }

    setState(() => isSubmitting = true);
    try {
      final res = await ApiClient.dio.post('/users/finance/add-payment', data: {
        'grade': selectedGrade,
        'enrollmentNo': selectedEnrollmentNo,
        'paymentMode': paymentMode,
        'feeCategory': 'ALL', // Hardcoded fallback for now
        'amountPaid': double.tryParse(amountPaid) ?? 0,
        'day': int.tryParse(day) ?? DateTime.now().day,
        'month': month,
        'year': int.tryParse(year) ?? DateTime.now().year,
        'remarks': 'Manual Payment Entry'
      });

      _showToast("Payment Synchronized! ✅");

      final recordId = res.data['feeRecord']?['_id'];
      if (recordId != null) {
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) context.push('/finance/receipt/$recordId');
        });
      } else {
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) context.pop();
        });
      }
    } catch (e) {
      _showToast("Failed to log payment ❌", isError: true);
    } finally {
      if (mounted) setState(() => isSubmitting = false);
    }
  }

  // 🔥 NAYA FUNCTION: CONFIRMATION MODAL 🔥
  void _showConfirmModal() {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Confirm Payment',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, _, __) {
        final themeMode = ref.watch(themeProvider);
        final bool isDark = themeMode == ThemeMode.dark;

        // Student ka naam nikaalne ke liye
        String studentName = "this student";
        try {
          studentName = students
              .firstWhere(
                  (s) => s['enrollmentNo'] == selectedEnrollmentNo)['name']
              .toString()
              .toUpperCase();
        } catch (e) {}

        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            children: [
              GestureDetector(
                  onTap: () => Navigator.pop(ctx),
                  child: Container(color: Colors.black.withOpacity(0.6))),
              Center(
                child: Container(
                  width: MediaQuery.of(context).size.width * 0.85,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      borderRadius: BorderRadius.circular(40)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                          padding: const EdgeInsets.all(20),
                          decoration: const BoxDecoration(
                              color: Color(0xFFFFFBEB), shape: BoxShape.circle),
                          child: const Icon(Icons.warning_amber_rounded,
                              color: Colors.amber, size: 40)),
                      const SizedBox(height: 24),
                      const Text("CONFIRM PAYMENT",
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              fontStyle: FontStyle.italic)),
                      const SizedBox(height: 12),
                      Text(
                          "Are you sure you want to record ₹$amountPaid for $studentName?",
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey,
                              height: 1.5)),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.pop(ctx),
                              child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                  decoration: BoxDecoration(
                                      color: isDark
                                          ? const Color(0xFF0F172A)
                                          : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(20)),
                                  child: Text("CANCEL",
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: isDark
                                              ? Colors.white
                                              : Colors.black,
                                          letterSpacing: 1.5))),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                Navigator.pop(ctx); // Modal band karo
                                _handleSubmit(); // Phir actual API call karo
                              },
                              child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                  decoration: BoxDecoration(
                                      color: const Color(0xFF42A5F5),
                                      borderRadius: BorderRadius.circular(20)),
                                  child: const Text("YES, RECORD",
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                          letterSpacing: 1.5))),
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
    if (isInitialLoading) return const CustomLoader(); // 🔥 TERA LOADER LOGIC

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
        if (context.canPop()) {
          context.pop();
        } else {
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
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      // --- PERFECT HEADER WALI COPY ---
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
                            // LEFT: BACK BUTTON
                            GestureDetector(
                              onTap: () {
                                if (context.canPop())
                                  context.pop();
                                else
                                  context.go('/finance/dashboard');
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

                            // CENTER: TITLE & SUBTITLE
                            Column(
                              children: [
                                const Text("Add Payment",
                                    style: TextStyle(
                                        fontSize: 26, // Scaled down
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        fontStyle: FontStyle.italic,
                                        letterSpacing: -1)),
                                Text("TRANSACTION LOG",
                                    style: TextStyle(
                                        fontSize: 9, // Scaled down
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white.withOpacity(0.9),
                                        letterSpacing: 2)),
                              ],
                            ),

                            // RIGHT: ICON
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.3)),
                              ),
                              child: const Icon(Icons.receipt_long,
                                  color: Colors.white, size: 24),
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: -0.2, duration: 500.ms),

                      // --- BODY CONTENT ---
                      Transform.translate(
                        offset: const Offset(0, -40), // Overlay on Header
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            children: [
                              // STEP 1: CLASS SELECTION
                              _buildFormBox(
                                  title: "1. Select Class",
                                  icon: Icons.layers,
                                  isDarkMode: isDarkMode,
                                  cardColor: cardColor,
                                  cardBorder: cardBorder,
                                  textColorSecondary: textColorSecondary,
                                  child: GestureDetector(
                                    onTap: () => _showListBottomSheet(
                                        "CLASS",
                                        classes,
                                        (val) => _handleClassChange(val),
                                        isDarkMode),
                                    child: _buildSelectorBox(
                                        selectedGrade.isEmpty
                                            ? "Choose class"
                                            : selectedGrade,
                                        isDarkMode,
                                        inputBg,
                                        cardBorder,
                                        textColorPrimary),
                                  )).animate().fadeIn().slideY(begin: 0.1),
                              const SizedBox(height: 16),

                              if (selectedGrade.isNotEmpty) ...[
                                // STEP 2: STUDENT SELECTION
                                _buildFormBox(
                                    title: "2. Select Student",
                                    icon: Icons.person,
                                    isDarkMode: isDarkMode,
                                    cardColor: cardColor,
                                    cardBorder: cardBorder,
                                    textColorSecondary: textColorSecondary,
                                    child: GestureDetector(
                                      onTap: () =>
                                          _showStudentBottomSheet(isDarkMode),
                                      child: _buildSelectorBox(
                                          selectedEnrollmentNo.isEmpty
                                              ? "Choose student"
                                              : students
                                                  .firstWhere(
                                                      (s) =>
                                                          s['enrollmentNo'] ==
                                                          selectedEnrollmentNo,
                                                      orElse: () => {
                                                            'name': 'Unknown'
                                                          })['name']
                                                  .toString()
                                                  .toUpperCase(),
                                          isDarkMode,
                                          inputBg,
                                          cardBorder,
                                          textColorPrimary),
                                    )).animate().fadeIn().slideY(begin: 0.1),
                                const SizedBox(height: 16),

                                // STEP 3: PAYMENT MODE
                                _buildFormBox(
                                    title: "3. Payment Method",
                                    icon: Icons.credit_card,
                                    isDarkMode: isDarkMode,
                                    cardColor: cardColor,
                                    cardBorder: cardBorder,
                                    textColorSecondary: textColorSecondary,
                                    child: Row(
                                      children: ['Cash', 'Online', 'Bank']
                                          .map((mode) {
                                        bool isSelected = paymentMode == mode;
                                        return Expanded(
                                          child: GestureDetector(
                                            onTap: () => setState(
                                                () => paymentMode = mode),
                                            child: AnimatedContainer(
                                              duration: const Duration(
                                                  milliseconds: 300),
                                              margin:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 4),
                                              padding: const EdgeInsets
                                                  .symmetric(
                                                  vertical:
                                                      14), // Smaller padding
                                              decoration: BoxDecoration(
                                                  color: isSelected
                                                      ? const Color(0xFF42A5F5)
                                                      : inputBg,
                                                  borderRadius:
                                                      BorderRadius.circular(16),
                                                  border: Border.all(
                                                      color: isSelected
                                                          ? const Color(
                                                              0xFF42A5F5)
                                                          : cardBorder)),
                                              child: Text(mode.toUpperCase(),
                                                  textAlign: TextAlign.center,
                                                  style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: isSelected
                                                          ? Colors.white
                                                          : textColorSecondary,
                                                      letterSpacing: 1)),
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    )).animate().fadeIn().slideY(begin: 0.1),
                                const SizedBox(height: 16),

                                // STEP 4: AMOUNT (BUG FIXED HERE)
                                _buildFormBox(
                                  title: "4. Amount To Be Paid",
                                  icon: Icons.flash_on,
                                  isDarkMode: isDarkMode,
                                  cardColor: cardColor,
                                  cardBorder: cardBorder,
                                  textColorSecondary: textColorSecondary,
                                  child: Container(
                                    // 🔥 BUG FIX: Offset(0, inset: true) hataya, simple blurBox diya 🔥
                                    decoration: BoxDecoration(
                                        color: inputBg,
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: cardBorder),
                                        boxShadow: [
                                          BoxShadow(
                                              color: Colors.black
                                                  .withOpacity(0.03),
                                              blurRadius: 10,
                                              offset: const Offset(0, 4))
                                        ]),
                                    child: TextField(
                                      keyboardType: TextInputType.number,
                                      style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w900,
                                          color:
                                              textColorPrimary), // Font reduced
                                      decoration: InputDecoration(
                                        prefixIcon: const Padding(
                                            padding: EdgeInsets.only(
                                                left: 16, right: 10),
                                            child: Icon(Icons.currency_rupee,
                                                color: Color(0xFF42A5F5),
                                                size: 20)),
                                        prefixIconConstraints:
                                            const BoxConstraints(
                                                minWidth: 0, minHeight: 0),
                                        hintText: "Enter amount",
                                        hintStyle: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w900,
                                            color: textColorSecondary
                                                .withOpacity(0.5)),
                                        border: InputBorder.none,
                                        contentPadding:
                                            const EdgeInsets.symmetric(
                                                vertical: 16),
                                      ),
                                      onChanged: (val) => amountPaid = val,
                                    ),
                                  ),
                                ).animate().fadeIn().slideY(begin: 0.1),
                                const SizedBox(height: 16),

                                // STEP 5: DATE LOGISTICS
                                Row(
                                  children: [
                                    Expanded(
                                      flex: 2,
                                      child: Container(
                                        decoration: BoxDecoration(
                                            color: cardColor,
                                            borderRadius:
                                                BorderRadius.circular(20),
                                            border:
                                                Border.all(color: cardBorder)),
                                        child: TextField(
                                          keyboardType: TextInputType.number,
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w900,
                                              color: textColorPrimary),
                                          decoration: InputDecoration(
                                              hintText: "Day",
                                              hintStyle: TextStyle(
                                                  color: textColorSecondary),
                                              border: InputBorder.none,
                                              contentPadding:
                                                  const EdgeInsets.symmetric(
                                                      vertical: 14)),
                                          controller:
                                              TextEditingController(text: day)
                                                ..selection =
                                                    TextSelection.collapsed(
                                                        offset: day.length),
                                          onChanged: (val) => day = val,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      flex: 4,
                                      child: GestureDetector(
                                        onTap: () => _showListBottomSheet(
                                            "MONTH",
                                            monthList,
                                            (val) =>
                                                setState(() => month = val),
                                            isDarkMode),
                                        child: _buildSelectorBox(
                                            month,
                                            isDarkMode,
                                            cardColor,
                                            cardBorder,
                                            textColorPrimary),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      flex: 3,
                                      child: Container(
                                        decoration: BoxDecoration(
                                            color: cardColor,
                                            borderRadius:
                                                BorderRadius.circular(20),
                                            border:
                                                Border.all(color: cardBorder)),
                                        child: TextField(
                                          keyboardType: TextInputType.number,
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w900,
                                              color: textColorPrimary),
                                          decoration: InputDecoration(
                                              hintText: "Year",
                                              hintStyle: TextStyle(
                                                  color: textColorSecondary),
                                              border: InputBorder.none,
                                              contentPadding:
                                                  const EdgeInsets.symmetric(
                                                      vertical: 14)),
                                          controller:
                                              TextEditingController(text: year)
                                                ..selection =
                                                    TextSelection.collapsed(
                                                        offset: year.length),
                                          onChanged: (val) => year = val,
                                        ),
                                      ),
                                    ),
                                  ],
                                ).animate().fadeIn().slideY(begin: 0.1),
                                const SizedBox(height: 24),

                                // SUBMIT BUTTON
                                // SUBMIT BUTTON
                                GestureDetector(
                                  onTap: isSubmitting
                                      ? null
                                      : () {
                                          // Pehle check karo form poora bhara hai ya nahi
                                          if (selectedGrade.isEmpty ||
                                              selectedEnrollmentNo.isEmpty ||
                                              amountPaid.isEmpty) {
                                            _showToast(
                                                "Please fill all mandatory fields! 🛡️",
                                                isError: true);
                                            return;
                                          }
                                          // Agar bhara hai, toh direct submit mat karo, pehle modal dikhao
                                          _showConfirmModal();
                                        },
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 18),
                                    decoration: BoxDecoration(
                                        color: const Color(0xFF42A5F5),
                                        borderRadius: BorderRadius.circular(30),
                                        boxShadow: [
                                          BoxShadow(
                                              color: const Color(0xFF42A5F5)
                                                  .withOpacity(0.4),
                                              blurRadius: 15,
                                              offset: const Offset(0, 5))
                                        ]),
                                    child: isSubmitting
                                        ? const Center(
                                            child: SizedBox(
                                                width: 18,
                                                height: 18,
                                                child:
                                                    CircularProgressIndicator(
                                                        color: Colors.white,
                                                        strokeWidth: 3)))
                                        : const Text("RECORD PAYMENT",
                                            textAlign: TextAlign.center,
                                            style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w900,
                                                color: Colors.white,
                                                letterSpacing: 2,
                                                fontStyle: FontStyle.italic)),
                                  ),
                                ).animate().scale(delay: 200.ms),
                              ]
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 50), // 🔥 BOTTOM 50px LOCKED 🔥
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- COMPACT FORM BUILDERS ---
  Widget _buildFormBox(
      {required String title,
      required IconData icon,
      required bool isDarkMode,
      required Color cardColor,
      required Color cardBorder,
      required Color textColorSecondary,
      required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: cardBorder),
          boxShadow: const [
            BoxShadow(
                color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))
          ]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: textColorSecondary, size: 14),
              const SizedBox(width: 8),
              Text(title.toUpperCase(),
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: textColorSecondary,
                      letterSpacing: 1.5,
                      fontStyle: FontStyle.italic)),
            ],
          ),
          const SizedBox(height: 12),
          child
        ],
      ),
    );
  }

  Widget _buildSelectorBox(
      String text, bool isDarkMode, Color bg, Color border, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: border)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
              child: Text(text,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: text.contains("Choose") ? Colors.grey : textColor,
                      fontStyle: FontStyle.italic))),
          const Icon(Icons.keyboard_arrow_down,
              color: Color(0xFF42A5F5), size: 18),
        ],
      ),
    );
  }

  // --- BOTTOM SHEETS ---
  void _showListBottomSheet(String title, List<dynamic> items,
      Function(String) onSelect, bool isDark) {
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
              Text("SELECT $title",
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF42A5F5),
                      fontStyle: FontStyle.italic,
                      letterSpacing: 1)),
              const SizedBox(height: 16),
              Expanded(
                child: items.isEmpty
                    ? Center(
                        child: Text("NO DATA FOUND",
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: Colors.grey.shade400,
                                letterSpacing: 1.5)))
                    : ListView.builder(
                        physics: const BouncingScrollPhysics(),
                        itemCount: items.length,
                        itemBuilder: (context, index) {
                          return GestureDetector(
                            onTap: () {
                              onSelect(items[index].toString());
                              Navigator.pop(context);
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
                              child: Text(items[index].toString().toUpperCase(),
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      color: isDark
                                          ? Colors.white
                                          : Colors.black87,
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

  void _showStudentBottomSheet(bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.6,
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
              const Text("SELECT STUDENT",
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF42A5F5),
                      fontStyle: FontStyle.italic,
                      letterSpacing: 1)),
              const SizedBox(height: 16),
              Expanded(
                child: students.isEmpty
                    ? Center(
                        child: Text("NO STUDENTS IN THIS CLASS",
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: Colors.grey.shade400,
                                letterSpacing: 1.5)))
                    : ListView.builder(
                        physics: const BouncingScrollPhysics(),
                        itemCount: students.length,
                        itemBuilder: (context, index) {
                          final student = students[index];
                          bool isSelected =
                              selectedEnrollmentNo == student['enrollmentNo'];
                          return GestureDetector(
                            onTap: () {
                              setState(() => selectedEnrollmentNo =
                                  student['enrollmentNo']);
                              Navigator.pop(context);
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF42A5F5).withOpacity(0.1)
                                      : (isDark
                                          ? const Color(0xFF0F172A)
                                          : const Color(0xFFF1F5F9)),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: isSelected
                                          ? const Color(0xFF42A5F5)
                                          : (isDark
                                              ? const Color(0xFF334155)
                                              : const Color(0xFFE2E8F0)))),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                            student['name']
                                                .toString()
                                                .toUpperCase(),
                                            style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w900,
                                                color: isSelected
                                                    ? const Color(0xFF42A5F5)
                                                    : (isDark
                                                        ? Colors.white
                                                        : Colors.black87))),
                                        const SizedBox(height: 4),
                                        Text(student['enrollmentNo'],
                                            style: TextStyle(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w900,
                                                color: Colors.grey.shade500,
                                                letterSpacing: 2)),
                                      ],
                                    ),
                                  ),
                                  if (isSelected)
                                    const Icon(Icons.check_circle,
                                        color: Color(0xFF42A5F5), size: 18)
                                ],
                              ),
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
}

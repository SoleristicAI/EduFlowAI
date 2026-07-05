import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // 🔥 NAYA IMPORT
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_loader.dart';
import '../../../core/theme/theme_provider.dart'; // 🔥 APNA GLOBAL THEME PROVIDER

class StudentAcademicCalendar extends ConsumerStatefulWidget {
  const StudentAcademicCalendar({super.key});

  @override
  ConsumerState<StudentAcademicCalendar> createState() => _StudentAcademicCalendarState();
}

class _StudentAcademicCalendarState extends ConsumerState<StudentAcademicCalendar> {
  bool loading = true;
  List<dynamic> events = [];
  Map<String, dynamic> eventMap = {};
  
  late DateTime today;
  late DateTime viewDate;
  Map<String, dynamic>? selectedEvent;

  @override
  void initState() {
    super.initState();
    today = DateTime.now();
    today = DateTime(today.year, today.month, today.day);
    viewDate = DateTime(today.year, today.month, 1);
    _fetchCalendarEvents();
  }

  Future<void> _fetchCalendarEvents() async {
    try {
      final response = await ApiClient.dio.get('/academic-calendar/all-events');
      final data = response.data as List<dynamic>;
      
      if (mounted) {
        setState(() {
          events = data;
          _processEventsForCalendar(data);
          loading = false;
        });
      }
    } catch (e) {
      _showToast("Failed to load calendar updates.", isError: true);
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _handleRefresh() async {
    await _fetchCalendarEvents();
  }

  // --- SMART PARSER FOR MULTIPLE DAYS ---
  void _processEventsForCalendar(List<dynamic> apiEvents) {
    Map<String, dynamic> map = {};
    for (var evt in apiEvents) {
      String evtDateStr = evt['date'] ?? '';
      map[evtDateStr] = evt;

      String desc = evt['description'] ?? '';
      RegExp exp = RegExp(r'Duration: From (\d{2}-\d{2}-\d{4}) To (\d{2}-\d{2}-\d{4})');
      var match = exp.firstMatch(desc);

      if (match != null) {
        String startStr = match.group(1)!;
        String endStr = match.group(2)!;

        DateTime parseDt(String s) {
          var p = s.split('-');
          return DateTime(int.parse(p[2]), int.parse(p[1]), int.parse(p[0]));
        }

        DateTime startDt = parseDt(startStr);
        DateTime endDt = parseDt(endStr);

        DateTime currentDt = startDt;
        while (currentDt.isBefore(endDt) || currentDt.isAtSameMomentAs(endDt)) {
          String d = currentDt.day.toString().padLeft(2, '0');
          String m = currentDt.month.toString().padLeft(2, '0');
          String y = currentDt.year.toString();
          map['$d-$m-$y'] = evt;
          currentDt = currentDt.add(const Duration(days: 1));
        }
      }
    }
    setState(() { eventMap = map; });
  }

  void _handleDateClick(String dateStr, bool isPast) {
    if (isPast) return;
    
    DateTime clickedDate = DateFormat('dd-MM-yyyy').parse(dateStr);
    bool isSunday = clickedDate.weekday == DateTime.sunday; 

    setState(() {
      if (eventMap.containsKey(dateStr)) {
        selectedEvent = Map<String, dynamic>.from(eventMap[dateStr]);
        selectedEvent!['isEmpty'] = false;
      } else {
        selectedEvent = {
          'isEmpty': true,
          'date': dateStr,
          'isSunday': isSunday,
        };
      }
    });
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, fontSize: 13)),
        backgroundColor: isError ? Colors.redAccent : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: const EdgeInsets.all(20),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const CustomLoader();

    bool canGoPrev = viewDate.year > today.year || (viewDate.year == today.year && viewDate.month > today.month);

    // 🔥 THEME LOGIC START
    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final Color borderColor = isDarkMode ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
    final Color subtleBgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    // Dynamic Color Legends Theme
    final Map<String, Map<String, Color>> eventThemeMap = {
      'Holiday': {
        'badgeBg': isDarkMode ? const Color(0xFF7F1D1D).withOpacity(0.3) : const Color(0xFFFEE2E2), 
        'badgeText': isDarkMode ? const Color(0xFFFCA5A5) : const Color(0xFFDC2626), 
        'badgeBorder': isDarkMode ? const Color(0xFF7F1D1D) : const Color(0xFFFECACA), 
        'dot': isDarkMode ? const Color(0xFFEF4444) : const Color(0xFFEF4444), 
        'bg': isDarkMode ? const Color(0xFF450A0A).withOpacity(0.3) : const Color(0xFFFEF2F2)
      },
      'Exam': {
        'badgeBg': isDarkMode ? const Color(0xFF78350F).withOpacity(0.3) : const Color(0xFFFEF3C7), 
        'badgeText': isDarkMode ? const Color(0xFFFCD34D) : const Color(0xFFD97706), 
        'badgeBorder': isDarkMode ? const Color(0xFF78350F) : const Color(0xFFFDE68A), 
        'dot': isDarkMode ? const Color(0xFFF59E0B) : const Color(0xFFF59E0B), 
        'bg': isDarkMode ? const Color(0xFF451A03).withOpacity(0.3) : const Color(0xFFFFFBEB)
      },
      'PTM': {
        'badgeBg': isDarkMode ? const Color(0xFF312E81).withOpacity(0.3) : const Color(0xFFE0E7FF), 
        'badgeText': isDarkMode ? const Color(0xFFA5B4FC) : const Color(0xFF4F46E5), 
        'badgeBorder': isDarkMode ? const Color(0xFF312E81) : const Color(0xFFC7D2FE), 
        'dot': isDarkMode ? const Color(0xFF6366F1) : const Color(0xFF6366F1), 
        'bg': isDarkMode ? const Color(0xFF1E1B4B).withOpacity(0.3) : const Color(0xFFEEF2FF)
      },
      'Event': {
        'badgeBg': isDarkMode ? const Color(0xFF064E3B).withOpacity(0.3) : const Color(0xFFD1FAE5), 
        'badgeText': isDarkMode ? const Color(0xFF6EE7B7) : const Color(0xFF059669), 
        'badgeBorder': isDarkMode ? const Color(0xFF064E3B) : const Color(0xFFA7F3D0), 
        'dot': isDarkMode ? const Color(0xFF10B981) : const Color(0xFF10B981), 
        'bg': isDarkMode ? const Color(0xFF022C22).withOpacity(0.3) : const Color(0xFFECFDF5)
      }
    };
    // 🔥 THEME LOGIC END

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
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: 50),
              child: Column(
                children: [
                  // --- BLUE HEADER SECTION ---
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.only(top: 60, bottom: 80),
                    decoration: BoxDecoration(
                      color: const Color(0xFF42A5F5),
                      gradient: LinearGradient(
                        colors: isDarkMode 
                            ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                            : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              GestureDetector(
                                onTap: () {
                                  if (context.canPop()) context.pop();
                                  else context.go('/');
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                                ),
                              ),
                              Column(
                                children: [
                                  const Text("Calendar", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                                  Text("HOLIDAYS & EVENTS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.9), letterSpacing: 2)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.3)),
                                ),
                                child: const Icon(Icons.calendar_month, color: Colors.white, size: 22),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // --- CONTENT AREA ---
                  Transform.translate(
                    offset: const Offset(0, -40),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: [
                          // 1. LEGENDS BAR
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 400),
                            width: double.infinity,
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(35), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
                            child: Wrap(
                              alignment: WrapAlignment.center, spacing: 16, runSpacing: 10,
                              children: eventThemeMap.keys.map((type) {
                                return Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(width: 10, height: 10, decoration: BoxDecoration(color: eventThemeMap[type]!['dot'], shape: BoxShape.circle)),
                                    const SizedBox(width: 6),
                                    Text(type.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                  ],
                                );
                              }).toList(),
                            ),
                          ).animate().fadeIn().slideY(begin: 0.1),
                          const SizedBox(height: 24),

                          // 2. CALENDAR BOARD
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 400),
                            width: double.infinity,
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(45), border: Border.all(color: borderColor), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 5))]),
                            child: Column(
                              children: [
                                // Header Controls
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 400),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(30), border: Border.all(color: borderColor)),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      GestureDetector(
                                        onTap: canGoPrev ? () {
                                          setState(() {
                                            viewDate = DateTime(viewDate.year, viewDate.month - 1, 1);
                                            selectedEvent = null;
                                          });
                                        } : null,
                                        child: Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(color: canGoPrev ? cardColor : Colors.transparent, shape: BoxShape.circle, boxShadow: canGoPrev ? const [BoxShadow(color: Colors.black12, blurRadius: 5)] : []),
                                          child: Icon(Icons.arrow_back_ios_new, size: 16, color: canGoPrev ? textColorPrimary : (isDarkMode ? const Color(0xFF475569) : const Color(0xFFCBD5E1))),
                                        ),
                                      ),
                                      Text(DateFormat('MMMM yyyy').format(viewDate).toUpperCase(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), letterSpacing: 2)),
                                      GestureDetector(
                                        onTap: () {
                                          setState(() {
                                            viewDate = DateTime(viewDate.year, viewDate.month + 1, 1);
                                            selectedEvent = null;
                                          });
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(color: cardColor, shape: BoxShape.circle, boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5)]),
                                          child: Icon(Icons.arrow_forward_ios, size: 16, color: textColorPrimary),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 24),

                                // Days Header
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                                  children: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((d) {
                                    return SizedBox(width: 35, child: Text(d, textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isDarkMode ? const Color(0xFF64748B) : const Color(0xFF94A3B8), letterSpacing: 1)));
                                  }).toList(),
                                ),
                                const SizedBox(height: 16),

                                // Dates Grid
                                GridView.builder(
                                  physics: const NeverScrollableScrollPhysics(),
                                  shrinkWrap: true,
                                  padding: EdgeInsets.zero,
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, mainAxisSpacing: 8, crossAxisSpacing: 8),
                                  itemCount: _calculateGridItemsCount(),
                                  itemBuilder: (context, index) {
                                    int year = viewDate.year;
                                    int month = viewDate.month;
                                    DateTime firstDay = DateTime(year, month, 1);
                                    int lastDate = DateTime(year, month + 1, 0).day;
                                    
                                    int startDay = firstDay.weekday - 1; 

                                    if (index < startDay) return const SizedBox.shrink(); 

                                    int dayNum = index - startDay + 1;
                                    if (dayNum > lastDate) return const SizedBox.shrink(); 

                                    DateTime tempDate = DateTime(year, month, dayNum);
                                    bool isPast = tempDate.isBefore(today);
                                    
                                    String formattedVal = DateFormat('dd-MM-yyyy').format(tempDate);
                                    var hasEvent = eventMap[formattedVal];
                                    
                                    bool isSelected = false;
                                    if (selectedEvent != null) {
                                      if (selectedEvent!['isEmpty'] == true) {
                                        isSelected = selectedEvent!['date'] == formattedVal;
                                      } else if (hasEvent != null) {
                                        if (selectedEvent!['_id'] != null && hasEvent['_id'] != null) {
                                          isSelected = selectedEvent!['_id'] == hasEvent['_id'];
                                        } else {
                                          isSelected = selectedEvent!['title'] == hasEvent['title'];
                                        }
                                      }
                                    }

                                    // Default Box Styles (Dynamic Theme)
                                    Color boxBg = subtleBgColor;
                                    Color boxBorder = borderColor;
                                    Color textColor = isDarkMode ? const Color(0xFFCBD5E1) : const Color(0xFF334155);
                                    Color? dotColor;

                                    if (isPast) {
                                      textColor = isDarkMode ? const Color(0xFF475569) : const Color(0xFFCBD5E1);
                                    } else if (hasEvent != null) {
                                      String type = hasEvent['eventType'];
                                      boxBg = eventThemeMap[type]!['bg']!;
                                      textColor = eventThemeMap[type]!['dot']!;
                                      dotColor = eventThemeMap[type]!['dot'];
                                    }

                                    if (isSelected && !isPast) {
                                      boxBorder = const Color(0xFF42A5F5); 
                                      boxBg = cardColor;
                                    }

                                    return GestureDetector(
                                      onTap: () => _handleDateClick(formattedVal, isPast),
                                      child: AnimatedContainer(
                                        duration: const Duration(milliseconds: 200),
                                        decoration: BoxDecoration(
                                          color: boxBg,
                                          borderRadius: BorderRadius.circular(15),
                                          border: Border.all(color: boxBorder, width: isSelected ? 2 : 1),
                                          boxShadow: isSelected ? const [BoxShadow(color: Colors.black12, blurRadius: 5)] : [],
                                        ),
                                        child: Stack(
                                          alignment: Alignment.center,
                                          children: [
                                            Text(dayNum.toString(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColor)),
                                            if (dotColor != null && !isPast)
                                              Positioned(bottom: 4, child: Container(width: 4, height: 4, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle))),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                )
                              ],
                            ),
                          ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1),
                          const SizedBox(height: 24),

                          // 3. SELECTED EVENT DETAILS CARDS
                          if (selectedEvent != null)
                            selectedEvent!['isEmpty'] == true
                                ? AnimatedContainer(
                                    duration: const Duration(milliseconds: 400),
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade50, width: 4), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))]),
                                    child: Column(
                                      children: [
                                        Container(
                                          width: 60, height: 60, 
                                          decoration: BoxDecoration(color: subtleBgColor, shape: BoxShape.circle, border: Border.all(color: borderColor)), 
                                          child: Icon(selectedEvent!['isSunday'] == true ? Icons.weekend : Icons.calendar_today, size: 24, color: textColorSecondary)
                                        ),
                                        const SizedBox(height: 16),
                                        Text("DATE: ${selectedEvent!['date']}", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 2)),
                                        const SizedBox(height: 4),
                                        
                                        Text(
                                          selectedEvent!['isSunday'] == true ? "SUNDAY" : "REGULAR DAY", 
                                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, letterSpacing: 1)
                                        ),
                                        const SizedBox(height: 12),
                                        
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), 
                                          decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(20)), 
                                          child: Text(
                                            selectedEvent!['isSunday'] == true 
                                                ? "It's the weekend! Relax, recharge, and enjoy your day off." 
                                                : "No holidays, exams, or special events scheduled.", 
                                            textAlign: TextAlign.center, 
                                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic)
                                          )
                                        ),
                                      ],
                                    ),
                                  ).animate().fadeIn().scale(begin: const Offset(0.9, 0.9))
                                : AnimatedContainer(
                                    duration: const Duration(milliseconds: 400),
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(32),
                                    decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.blue.shade50, width: 4), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))]),
                                    child: Stack(
                                      clipBehavior: Clip.none,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                  decoration: BoxDecoration(color: eventThemeMap[selectedEvent!['eventType']]!['badgeBg'], borderRadius: BorderRadius.circular(20), border: Border.all(color: eventThemeMap[selectedEvent!['eventType']]!['badgeBorder']!)),
                                                  child: Text(selectedEvent!['eventType'].toString().toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: eventThemeMap[selectedEvent!['eventType']]!['badgeText'], letterSpacing: 1.5)),
                                                ),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                  decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(20)),
                                                  child: Row(
                                                    children: [
                                                      Icon(selectedEvent!['description']?.contains('Duration:') == true ? Icons.date_range : Icons.access_time, size: 12, color: textColorSecondary),
                                                      const SizedBox(width: 4),
                                                      Text(selectedEvent!['description']?.contains('Duration:') == true ? "MULTIPLE DAYS" : "SINGLE DAY", style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                                    ],
                                                  ),
                                                )
                                              ],
                                            ),
                                            const SizedBox(height: 20),
                                            Text(selectedEvent!['title']?.toString().toUpperCase() ?? 'EVENT', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic, height: 1.1)),
                                            const SizedBox(height: 24),
                                            
                                            Container(
                                              padding: const EdgeInsets.all(16),
                                              decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: borderColor)),
                                              child: Row(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  const Icon(Icons.calendar_month, size: 18, color: Color(0xFF42A5F5)),
                                                  const SizedBox(width: 12),
                                                  Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text("SCHEDULED DATE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                                      const SizedBox(height: 2),
                                                      Text(selectedEvent!['date'] ?? '', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: textColorPrimary)),
                                                    ],
                                                  )
                                                ],
                                              ),
                                            ),
                                            
                                            if (selectedEvent!['description'] != null && selectedEvent!['description'].toString().isNotEmpty)
                                              Container(
                                                margin: const EdgeInsets.only(top: 12),
                                                padding: const EdgeInsets.all(16),
                                                decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: borderColor)),
                                                child: Row(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    const Icon(Icons.format_align_left, size: 18, color: Color(0xFF42A5F5)),
                                                    const SizedBox(width: 12),
                                                    Expanded(
                                                      child: Column(
                                                        crossAxisAlignment: CrossAxisAlignment.start,
                                                        children: [
                                                          Text("CONTEXT & INSTRUCTIONS", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5)),
                                                          const SizedBox(height: 4),
                                                          Text(selectedEvent!['description'].toString().replaceAll(RegExp(r'\| Duration:.*'), ''), style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic, height: 1.4)),
                                                        ],
                                                      ),
                                                    )
                                                  ],
                                                ),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ).animate().fadeIn().slideY(begin: 0.1),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  int _calculateGridItemsCount() {
    int year = viewDate.year;
    int month = viewDate.month;
    DateTime firstDay = DateTime(year, month, 1);
    int lastDate = DateTime(year, month + 1, 0).day;
    int startDay = firstDay.weekday - 1; 
    int totalBoxes = startDay + lastDate;
    return (totalBoxes / 7).ceil() * 7; 
  }
}
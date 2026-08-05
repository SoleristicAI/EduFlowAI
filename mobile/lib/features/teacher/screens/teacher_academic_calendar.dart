import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/custom_loader.dart';

class TeacherAcademicCalendar extends ConsumerStatefulWidget {
  const TeacherAcademicCalendar({super.key});

  @override
  ConsumerState<TeacherAcademicCalendar> createState() => _TeacherAcademicCalendarState();
}

class _TeacherAcademicCalendarState extends ConsumerState<TeacherAcademicCalendar> {
  bool isLoading = true;
  List<dynamic> rawEvents = [];
  Map<String, dynamic> eventMap = {};
  
  DateTime today = DateTime.now();
  late DateTime viewDate;
  Map<String, dynamic>? selectedEvent;

  // 🔥 SESSION STATES 🔥
  String? activeSession;
  List<String> availableSessions = [];

  final Map<String, Map<String, Color>> eventThemeMap = {
    'Holiday': {'badgeBg': const Color(0xFFFEE2E2), 'badgeText': const Color(0xFFDC2626), 'dot': const Color(0xFFEF4444)},
    'Exam': {'badgeBg': const Color(0xFFFEF3C7), 'badgeText': const Color(0xFFD97706), 'dot': const Color(0xFFF59E0B)},
    'PTM': {'badgeBg': const Color(0xFFE0E7FF), 'badgeText': const Color(0xFF4F46E5), 'dot': const Color(0xFF6366F1)},
    'Event': {'badgeBg': const Color(0xFFD1FAE5), 'badgeText': const Color(0xFF059669), 'dot': const Color(0xFF10B981)},
  };

  @override
  void initState() {
    super.initState();
    today = DateTime(today.year, today.month, today.day);
    viewDate = DateTime(today.year, today.month, 1);
    _initSessionData();
  }

  Future<void> _initSessionData() async {
    try {
      final sessionRes = await ApiClient.dio.get('/users/general/session-info');
      if (mounted) {
        setState(() {
          activeSession = sessionRes.data['activeSession'];
          availableSessions = List<String>.from(sessionRes.data['allAvailableSessions'] ?? []);
        });
        _fetchCalendarEvents(activeSession);
      }
    } catch (e) {
      _showToast("Session Error.", isError: true);
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _fetchCalendarEvents(String? sessionParam, {bool isRefresh = false}) async {
    if (sessionParam == null) return;
    if (!isRefresh && mounted) setState(() => isLoading = true);

    try {
      final response = await ApiClient.dio.get('/academic-calendar/all-events?session=$sessionParam');
      if (mounted) {
        setState(() {
          rawEvents = response.data ?? [];
          _processEventsForCalendar(rawEvents);
        });
      }
    } catch (e) {
      _showToast("Failed to load calendar updates.", isError: true);
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _processEventsForCalendar(List<dynamic> apiEvents) {
    final Map<String, dynamic> map = {};
    final RegExp multiDayRegex = RegExp(r'Duration: From (\d{2}-\d{2}-\d{4}) To (\d{2}-\d{2}-\d{4})');

    for (var evt in apiEvents) {
      map[evt['date']] = evt;

      final desc = evt['description']?.toString() ?? '';
      final match = multiDayRegex.firstMatch(desc);

      if (match != null) {
        String startStr = match.group(1)!;
        String endStr = match.group(2)!;

        DateTime startDt = DateFormat('dd-MM-yyyy').parse(startStr);
        DateTime endDt = DateFormat('dd-MM-yyyy').parse(endStr);

        DateTime currentDt = startDt;
        while (currentDt.isBefore(endDt) || currentDt.isAtSameMomentAs(endDt)) {
          String formattedDate = DateFormat('dd-MM-yyyy').format(currentDt);
          map[formattedDate] = evt;
          currentDt = currentDt.add(const Duration(days: 1));
        }
      }
    }
    eventMap = map;
  }

  void _handleDateClick(String dateStr, bool isPast, bool isSunday) {
    // 🔥 FIX: isPast return hata diya
    setState(() {
      if (eventMap.containsKey(dateStr)) {
        selectedEvent = Map<String, dynamic>.from(eventMap[dateStr]); 
        selectedEvent!['isEmpty'] = false;
        selectedEvent!['isSunday'] = isSunday; 
      } else {
        selectedEvent = {'isEmpty': true, 'date': dateStr, 'isSunday': isSunday};
      }
    });
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
    if (isLoading) return const CustomLoader();

    final themeMode = ref.watch(themeProvider);
    final bool isDarkMode = themeMode == ThemeMode.dark;

    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color cardBorder = isDarkMode ? const Color(0xFF334155) : const Color(0xFFDDE3EA);
    final Color textColorPrimary = isDarkMode ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B);
    final Color textColorSecondary = isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    final Color inputBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    bool canGoPrev = true;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/teacher/home');
        }
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: RefreshIndicator(
          color: const Color(0xFF42A5F5),
          backgroundColor: cardColor,
          onRefresh: () => _fetchCalendarEvents(activeSession, isRefresh: true),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: ClampingScrollPhysics()), 
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    // --- HEADER SECTION ---
                    Container(
                      padding: const EdgeInsets.only(top: 60, bottom: 40, left: 24, right: 24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isDarkMode 
                              ? [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)] 
                              : [const Color(0xFF64B5F6), const Color(0xFF42A5F5)],
                          begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(55)),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 10))],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: () {
                              if (context.canPop()) context.pop();
                              else context.go('/teacher/home');
                            },
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                              child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
                            ),
                          ),
                          
                          // 🔥 CENTER: TITLE + DROPDOWN 🔥
                          Column(
                            children: [
                              const Text("Calendar", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, fontStyle: FontStyle.italic, letterSpacing: -1)),
                              const SizedBox(height: 4),
                              // 🔥 FIX: NAYA POPUP MENU WITH POSITION UNDER 🔥
                              PopupMenuButton<String>(
                                initialValue: activeSession,
                                position: PopupMenuPosition.under, // 👉 FIX: Button ke theek neeche khulega
                                offset: const Offset(0, 8), // 👉 FIX: Thoda sa gap dega button aur menu ke beech
                                color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.white,
                                elevation: 12,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                onSelected: (String newValue) {
                                  setState(() { activeSession = newValue; isLoading = true; });
                                  _fetchCalendarEvents(newValue);
                                },
                                itemBuilder: (BuildContext context) {
                                  return availableSessions.map((String session) {
                                    return PopupMenuItem<String>(
                                      value: session,
                                      child: Text(
                                        session, 
                                        style: TextStyle(
                                          fontWeight: FontWeight.w900, 
                                          fontStyle: FontStyle.italic,
                                          color: activeSession == session ? const Color(0xFF42A5F5) : (isDarkMode ? Colors.white : Colors.black87), 
                                        )
                                      ),
                                    );
                                  }).toList();
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2), 
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.history, color: Colors.white, size: 14),
                                      const SizedBox(width: 6),
                                      Text(activeSession ?? 'Loading...', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.arrow_drop_down, color: Colors.white, size: 18),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),

                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.3))),
                            child: const Icon(Icons.calendar_month, color: Colors.white, size: 24),
                          ),
                        ],
                      ),
                    ).animate().slideY(begin: -0.2, duration: 500.ms),

                    // --- MAIN CALENDAR AREA ---
                    Transform.translate(
                      offset: const Offset(0, -20),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          children: [
                            // 1. LEGENDS BAR
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(30), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)]),
                              child: Wrap(
                                alignment: WrapAlignment.center,
                                spacing: 16, runSpacing: 10,
                                children: eventThemeMap.keys.map((type) {
                                  return Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(width: 10, height: 10, decoration: BoxDecoration(color: eventThemeMap[type]!['dot'], shape: BoxShape.circle)),
                                      const SizedBox(width: 6),
                                      Text(type.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                                    ],
                                  );
                                }).toList(),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // 2. CALENDAR BOARD
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
                              child: Column(
                                children: [
                                  // Controls
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                    decoration: BoxDecoration(color: inputBg, borderRadius: BorderRadius.circular(25), border: Border.all(color: cardBorder)),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        GestureDetector(
                                          // ignore: dead_code
                                          onTap: canGoPrev ? () => setState(() { viewDate = DateTime(viewDate.year, viewDate.month - 1, 1); selectedEvent = null; }) : null,
                                          child: Container(
                                            padding: const EdgeInsets.all(12),
                                            // ignore: dead_code
                                            decoration: BoxDecoration(color: canGoPrev ? (isDarkMode ? const Color(0xFF1E3A8A) : Colors.white) : Colors.transparent, shape: BoxShape.circle, boxShadow: canGoPrev ? const [BoxShadow(color: Colors.black12, blurRadius: 5)] : []),
                                            // ignore: dead_code
                                            child: Icon(Icons.arrow_back_ios_new, size: 14, color: canGoPrev ? const Color(0xFF42A5F5) : textColorSecondary.withOpacity(0.3)),
                                          ),
                                        ),
                                        Text(DateFormat('MMMM yyyy').format(viewDate).toUpperCase(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF42A5F5), fontStyle: FontStyle.italic, letterSpacing: 2)),
                                        GestureDetector(
                                          onTap: () => setState(() { viewDate = DateTime(viewDate.year, viewDate.month + 1, 1); selectedEvent = null; }),
                                          child: Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(color: isDarkMode ? const Color(0xFF1E3A8A) : Colors.white, shape: BoxShape.circle, boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 5)]),
                                            child: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF42A5F5)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 20),

                                  // Days Header
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                                    children: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => SizedBox(width: 30, child: Text(d, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: textColorSecondary, letterSpacing: 1)))).toList(),
                                  ),
                                  const SizedBox(height: 16),

                                  // Grid
                                  _buildCalendarGrid(isDarkMode, textColorPrimary),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // 3. SELECTED EVENT DETAILS CARDS
                            AnimatedSize(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                              child: selectedEvent != null ? _buildEventCard(isDarkMode, cardColor, cardBorder, textColorPrimary, textColorSecondary, inputBg) : const SizedBox.shrink(),
                            ),

                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 50),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCalendarGrid(bool isDarkMode, Color textColorPrimary) {
    int year = viewDate.year;
    int month = viewDate.month;
    DateTime firstDay = DateTime(year, month, 1);
    int lastDate = DateTime(year, month + 1, 0).day;
    int startDay = firstDay.weekday; 
    
    List<Widget> days = [];
    for (int i = 1; i < startDay; i++) {
      days.add(const SizedBox());
    }

    for (int d = 1; d <= lastDate; d++) {
      DateTime tempDate = DateTime(year, month, d);
      bool isPast = tempDate.isBefore(today);
      bool isSunday = tempDate.weekday == DateTime.sunday; 
      String formattedVal = DateFormat('dd-MM-yyyy').format(tempDate);
      
      var hasEvent = eventMap[formattedVal];
      bool isSelected = selectedEvent != null && selectedEvent!['isEmpty'] == false && selectedEvent!['_id'] == hasEvent?['_id'];
      bool isSelectedEmpty = selectedEvent != null && selectedEvent!['isEmpty'] == true && selectedEvent!['date'] == formattedVal;

     Color cellBg = isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
      Color cellText = textColorPrimary;
      Color? dotColor;
      bool hasBorder = false;

      // 🔥 FIX: Event ko pehle check karo
      if (hasEvent != null) {
        cellBg = eventThemeMap[hasEvent['eventType']]!['badgeBg']!.withOpacity(isDarkMode ? 0.2 : 1);
        cellText = eventThemeMap[hasEvent['eventType']]!['dot']!;
        dotColor = eventThemeMap[hasEvent['eventType']]!['dot'];
        if (isPast) {
          cellBg = cellBg.withOpacity(0.5); // Thoda fade for past events
        }
      } else if (isPast) {
        cellText = textColorPrimary.withOpacity(0.3);
      } else if (isSunday) { 
        cellText = const Color(0xFFF43F5E); 
      }

      if (isSelected || isSelectedEmpty) { // !isPast hata diya
        hasBorder = true;
      }

      days.add(
        GestureDetector(
          // 🔥 FIX: onTap hamesha allow kardo
          onTap: () => _handleDateClick(formattedVal, isPast, isSunday), 
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: cellBg,
              borderRadius: BorderRadius.circular(14),
              border: hasBorder ? Border.all(color: const Color(0xFF42A5F5), width: 2) : Border.all(color: Colors.transparent, width: 2),
              boxShadow: hasBorder ? [BoxShadow(color: const Color(0xFF42A5F5).withOpacity(0.3), blurRadius: 8)] : [],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Text(d.toString(), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: cellText)),
                if (dotColor != null && !isPast)
                  Positioned(bottom: 2, child: Container(width: 4, height: 4, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle))),
              ],
            ),
          ),
        ),
      );
    }

    return GridView.count(
      shrinkWrap: true,
      crossAxisCount: 7,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      physics: const NeverScrollableScrollPhysics(),
      children: days,
    );
  }

  Widget _buildEventCard(bool isDarkMode, Color cardColor, Color cardBorder, Color textColorPrimary, Color textColorSecondary, Color subtleBgColor) {
    if (selectedEvent!['isEmpty'] == true) {
      bool isSunday = selectedEvent!['isSunday'] == true;

      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(30),
        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: cardBorder), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 15, offset: Offset(0, 5))]),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16), 
              decoration: BoxDecoration(color: subtleBgColor, shape: BoxShape.circle, border: Border.all(color: cardBorder)), 
              child: Icon(isSunday ? Icons.weekend : Icons.calendar_today, size: 32, color: isSunday ? const Color(0xFF42A5F5) : Colors.grey)
            ),
            const SizedBox(height: 16),
            Text("DATE: ${selectedEvent!['date']}", style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2, fontStyle: FontStyle.italic)),
            const SizedBox(height: 8),
            Text(isSunday ? "SUNDAY HOLIDAY" : "REGULAR DAY", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: isSunday ? const Color(0xFF42A5F5) : textColorPrimary, fontStyle: FontStyle.italic)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), 
              decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(20)), 
              child: Text(
                isSunday 
                  ? "It's the weekend! Relax, recharge, and enjoy your day off." 
                  : "No holidays, exams, or special events scheduled.", 
                textAlign: TextAlign.center, 
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColorSecondary, fontStyle: FontStyle.italic)
              )
            ),
          ],
        ),
      ).animate().fadeIn().slideY(begin: 0.1);
    }

    var theme = eventThemeMap[selectedEvent!['eventType']];
    bool isMultiDay = selectedEvent!['description'].toString().contains('Duration:');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(40), border: Border.all(color: theme!['dot']!.withOpacity(0.5), width: 2), boxShadow: [BoxShadow(color: theme['dot']!.withOpacity(0.1), blurRadius: 20)]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6), decoration: BoxDecoration(color: theme['badgeBg']!.withOpacity(isDarkMode ? 0.2 : 1), borderRadius: BorderRadius.circular(20)), child: Text(selectedEvent!['eventType'].toString().toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: theme['dot'], letterSpacing: 2, fontStyle: FontStyle.italic))),
              Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(20)), child: Row(children: [Icon(isMultiDay ? Icons.date_range : Icons.access_time, size: 12, color: Colors.grey), const SizedBox(width: 6), Text(isMultiDay ? "MULTIPLE DAYS" : "SINGLE DAY", style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5))])),
            ],
          ),
          const SizedBox(height: 20),
          Text(selectedEvent!['title'].toString().toUpperCase(), style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textColorPrimary, fontStyle: FontStyle.italic)),
          const SizedBox(height: 24),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
            child: Row(
              children: [
                const Icon(Icons.calendar_month, color: Color(0xFF42A5F5), size: 24),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("SCHEDULED DATE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                    const SizedBox(height: 4),
                    Text(selectedEvent!['date'], style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColorSecondary)),
                  ],
                )
              ],
            ),
          ),
          
          if (selectedEvent!['description'] != null) ...[
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: subtleBgColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: cardBorder)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.align_vertical_bottom, color: Color(0xFF42A5F5), size: 24),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("CONTEXT & INSTRUCTIONS", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5, fontStyle: FontStyle.italic)),
                        const SizedBox(height: 8),
                        Text(selectedEvent!['description'].toString().replaceAll(RegExp(r'\| Duration:.*'), '').trim(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColorSecondary, height: 1.5)),
                      ],
                    ),
                  )
                ],
              ),
            ),
          ]
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1);
  }
}
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/customer_api.dart';
import '../../core/session/session_controller.dart';
import '../booking/booking_screen.dart';
import '../courts/branches_screen.dart';
import '../history/history_screen.dart';
import '../profile/profile_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    final customerApi = CustomerApi(session.apiClient);
    final pages = [
      BranchesScreen(api: customerApi),
      BookingScreen(api: customerApi),
      HistoryScreen(api: customerApi),
      ProfileScreen(api: customerApi),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(_title),
        actions: [
          IconButton(
            tooltip: 'Logout',
            onPressed: session.logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.storefront_outlined),
            selectedIcon: Icon(Icons.storefront),
            label: 'Branches',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month),
            label: 'Book',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'History',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  String get _title {
    return switch (_index) {
      0 => 'Branches',
      1 => 'Book a court',
      2 => 'History',
      _ => 'Profile',
    };
  }
}

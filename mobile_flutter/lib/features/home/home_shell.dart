import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/customer_api.dart';
import '../../core/session/session_controller.dart';
import '../../shared/widgets/formatters.dart';
import '../booking/booking_screen.dart';
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
      _HomeDashboard(
        api: customerApi,
        onBookTap: () => setState(() => _index = 1),
        onHistoryTap: () => setState(() => _index = 2),
        onProfileTap: () => setState(() => _index = 3),
      ),
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
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: SafeArea(child: pages[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.sports_tennis_outlined),
            selectedIcon: Icon(Icons.sports_tennis),
            label: 'Book',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history),
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
      0 => 'SportSG',
      1 => 'Book a court',
      2 => 'History',
      _ => 'Profile',
    };
  }
}

class _HomeDashboard extends StatelessWidget {
  const _HomeDashboard({
    required this.api,
    required this.onBookTap,
    required this.onHistoryTap,
    required this.onProfileTap,
  });

  final CustomerApi api;
  final VoidCallback onBookTap;
  final VoidCallback onHistoryTap;
  final VoidCallback onProfileTap;

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    final user = session.user;
    final name = session.claims?.username ?? 'Player';

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        _HeroPanel(
          name: name,
          balanceText: formatMoney(user?.balance ?? 0),
          onBookTap: onBookTap,
        ),
        const SizedBox(height: 20),
        _QuickActions(
          onBookTap: onBookTap,
          onHistoryTap: onHistoryTap,
          onProfileTap: onProfileTap,
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Explore',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            TextButton(
              onPressed: onBookTap,
              child: const Text('Book now'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        FutureBuilder(
          future: api.getBranches(),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (snapshot.hasError) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Text(
                  'Khong tai duoc danh sach chi nhanh. Hay thu lai sau.',
                  style: const TextStyle(color: Color(0xFF6B7280)),
                ),
              );
            }
            final branches = snapshot.data ?? const [];
            if (branches.isEmpty) {
              return const Text('No branch available.');
            }
            return SizedBox(
              height: 190,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: branches.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final branch = branches[index];
                  return _BranchCard(
                    name: branch.name,
                    location: branch.location,
                    onTap: onBookTap,
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }
}

class _HeroPanel extends StatelessWidget {
  const _HeroPanel({
    required this.name,
    required this.balanceText,
    required this.onBookTap,
  });

  final String name;
  final String balanceText;
  final VoidCallback onBookTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF003527), Color(0xFF086052), Color(0xFF0D9488)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x24003527),
            blurRadius: 28,
            offset: Offset(0, 14),
          ),
        ],
      ),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello, $name',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Ready for your next match?',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.76),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white24),
                ),
                child: const Icon(Icons.sports_tennis, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white24),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.account_balance_wallet_outlined,
                  color: Color(0xFF86F2E4),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Active balance',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        balanceText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                FilledButton.icon(
                  onPressed: onBookTap,
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF003527),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Book'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({
    required this.onBookTap,
    required this.onHistoryTap,
    required this.onProfileTap,
  });

  final VoidCallback onBookTap;
  final VoidCallback onHistoryTap;
  final VoidCallback onProfileTap;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.45,
      children: [
        _QuickActionCard(
          icon: Icons.sports_tennis,
          label: 'Book Court',
          onTap: onBookTap,
        ),
        _QuickActionCard(
          icon: Icons.history,
          label: 'History',
          onTap: onHistoryTap,
        ),
        _QuickActionCard(
          icon: Icons.person,
          label: 'Profile',
          onTap: onProfileTap,
        ),
        _QuickActionCard(
          icon: Icons.payments,
          label: 'Top-up',
          onTap: onProfileTap,
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE5E7EB)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x08000000),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 23,
                backgroundColor: const Color(0xFFE8F5F1),
                child: Icon(icon, color: const Color(0xFF003527)),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BranchCard extends StatelessWidget {
  const _BranchCard({
    required this.name,
    required this.location,
    required this.onTap,
  });

  final String name;
  final String location;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 240,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    gradient: LinearGradient(
                      colors: [Color(0xFF003527), Color(0xFF0D9488)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  child: Align(
                    alignment: Alignment.topLeft,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Branch',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      location,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Color(0xFF4B5563)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

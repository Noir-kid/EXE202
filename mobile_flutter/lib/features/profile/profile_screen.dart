import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/customer_api.dart';
import '../../core/session/session_controller.dart';
import '../../shared/models/user.dart';
import '../../shared/widgets/async_state.dart';
import '../../shared/widgets/formatters.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.api});

  final CustomerApi api;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<UserDetail?> _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final userId = context.read<SessionController>().userId ?? '';
    _future = widget.api.getUserDetail(userId);
  }

  void _reload() {
    final userId = context.read<SessionController>().userId ?? '';
    setState(() => _future = widget.api.getUserDetail(userId));
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    final account = session.user;
    return FutureBuilder<UserDetail?>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const LoadingView(message: 'Loading profile...');
        }
        if (snapshot.hasError) {
          return ErrorStateView(message: '${snapshot.error}', onRetry: _reload);
        }
        final detail = snapshot.data;
        final displayName = detail?.fullName.isNotEmpty == true
            ? detail!.fullName
            : session.claims?.username ?? 'User';
        final avatarText = displayName.characters.first.toUpperCase();

        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          children: [
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF003527), Color(0xFF064E3B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white.withValues(alpha: 0.16),
                    child: Text(
                      avatarText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          session.claims?.role ?? '',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _InfoCard(
              children: [
                _Line(label: 'Email', value: detail?.email ?? '-'),
                _Line(label: 'Phone', value: detail?.phone ?? '-'),
                _Line(label: 'Balance', value: formatMoney(account?.balance ?? 0)),
              ],
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () async {
                await session.refreshUser();
                _reload();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh profile'),
            ),
          ],
        );
      },
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: children,
        ),
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          SizedBox(
            width: 90,
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

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
            FilledButton.icon(
              onPressed: () => _showBuyBalance(context),
              icon: const Icon(Icons.add_card),
              label: const Text('Buy balance'),
            ),
            const SizedBox(height: 10),
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

  Future<void> _showBuyBalance(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BuyBalanceSheet(api: widget.api),
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

class _BuyBalanceSheet extends StatefulWidget {
  const _BuyBalanceSheet({required this.api});

  final CustomerApi api;

  @override
  State<_BuyBalanceSheet> createState() => _BuyBalanceSheetState();
}

class _BuyBalanceSheetState extends State<_BuyBalanceSheet> {
  final _amount = TextEditingController(text: '100000');
  int _method = 1;
  bool _loading = false;

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final session = context.read<SessionController>();
    final userId = session.userId;
    final amount = int.tryParse(_amount.text.trim());
    if (userId == null || amount == null || amount < 10000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Minimum amount is 10000.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final url = await widget.api.createBuyBalanceUrl(
        userId: userId,
        amount: amount,
        method: _method,
      );
      await widget.api.openPaymentUrl(url);
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment opened. Return here and refresh profile.'),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      final message = session.apiClient.messageFromError(error);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFF8F9FA),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Buy balance', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          TextField(
            controller: _amount,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Amount',
              prefixIcon: Icon(Icons.payments_outlined),
            ),
          ),
          const SizedBox(height: 12),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 1, label: Text('VNPay')),
              ButtonSegment(value: 2, label: Text('MoMo')),
            ],
            selected: {_method},
            onSelectionChanged: (value) {
              setState(() => _method = value.first);
            },
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _loading ? null : _submit,
            icon: _loading
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.open_in_new),
            label: const Text('Open payment'),
          ),
        ],
      ),
    );
  }
}

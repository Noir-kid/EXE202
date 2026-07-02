import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/customer_api.dart';
import '../../core/session/session_controller.dart';
import '../../shared/models/branch.dart';
import '../../shared/models/court.dart';
import '../../shared/models/slot.dart';
import '../../shared/widgets/async_state.dart';
import '../../shared/widgets/formatters.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key, required this.api});

  final CustomerApi api;

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  List<Branch> _branches = [];
  List<Court> _courts = [];
  List<BookedSlot> _slots = [];
  Branch? _branch;
  Court? _court;
  DateTime _date = DateTime.now().add(const Duration(days: 1));
  int _start = 7;
  int _end = 8;
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBranches();
  }

  Future<void> _loadBranches() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final branches = await widget.api.getBranches();
      setState(() {
        _branches = branches.where((branch) => branch.isActive).toList();
        _branch = _branches.isNotEmpty ? _branches.first : null;
      });
      if (_branch != null) await _loadCourts(_branch!);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadCourts(Branch branch) async {
    final courts = await widget.api.getCourtsByBranch(branch.id);
    setState(() {
      _courts = courts.where((court) => court.isActive).toList();
      _court = _courts.isNotEmpty ? _courts.first : null;
      _slots = [];
    });
    if (_court != null) await _loadSlots(_court!);
  }

  Future<void> _loadSlots(Court court) async {
    final slots = await widget.api.getSlotsByCourt(court.id, _date);
    setState(() => _slots = slots);
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 120)),
      initialDate: _date,
    );
    if (picked != null) {
      setState(() => _date = picked);
      final court = _court;
      if (court != null) await _loadSlots(court);
    }
  }

  Future<void> _submit() async {
    final session = context.read<SessionController>();
    final userId = session.userId;
    final court = _court;
    if (userId == null || court == null) return;
    setState(() => _submitting = true);
    try {
      final booking = await widget.api.createBooking(
        userId: userId,
        courtId: court.id,
        date: _date,
        start: _start,
        end: _end,
      );
      final paymentUrl = await widget.api.createPayOSPaymentUrl(bookingId: booking.id);
      await widget.api.openPaymentUrl(paymentUrl);
      await session.refreshUser();
      await _loadSlots(court);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('PayOS checkout opened. Complete payment to confirm your booking.')),
      );
    } catch (error) {
      if (!mounted) return;
      final message = session.apiClient.messageFromError(error);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView(message: 'Preparing booking...');
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _loadBranches);
    }

    final sameDaySlots = _slots.where((slot) {
      return slot.date.year == _date.year &&
          slot.date.month == _date.month &&
          slot.date.day == _date.day;
    }).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        _BalanceCard(),
        const SizedBox(height: 20),
        _SectionTitle(
          title: 'Book a court',
          subtitle: 'Pick your branch, time and confirm instantly.',
        ),
        const SizedBox(height: 16),
        _FieldCard(
          child: Column(
            children: [
              DropdownButtonFormField<Branch>(
                initialValue: _branch,
                decoration: const InputDecoration(
                  labelText: 'Branch',
                  prefixIcon: Icon(Icons.storefront_outlined),
                ),
                items: _branches
                    .map(
                      (branch) => DropdownMenuItem(
                        value: branch,
                        child: Text(branch.name),
                      ),
                    )
                    .toList(),
                onChanged: (branch) async {
                  if (branch == null) return;
                  setState(() => _branch = branch);
                  await _loadCourts(branch);
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<Court>(
                initialValue: _court,
                decoration: const InputDecoration(
                  labelText: 'Court',
                  prefixIcon: Icon(Icons.sports_tennis),
                ),
                items: _courts
                    .map(
                      (court) => DropdownMenuItem(
                        value: court,
                        child: Text('${court.name} - ${formatMoney(court.price)}'),
                      ),
                    )
                    .toList(),
                onChanged: (court) async {
                  if (court == null) return;
                  setState(() => _court = court);
                  await _loadSlots(court);
                },
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _pickDate,
                icon: const Icon(Icons.event),
                label: Text(formatDate(_date)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _FieldCard(
                child: DropdownButtonFormField<int>(
                  initialValue: _start,
                  decoration: const InputDecoration(labelText: 'Start'),
                  items: _hours
                      .map(
                        (hour) => DropdownMenuItem(
                          value: hour,
                          child: Text('$hour:00'),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      _start = value;
                      if (_end <= _start) _end = _start + 1;
                    });
                  },
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _FieldCard(
                child: DropdownButtonFormField<int>(
                  initialValue: _end,
                  decoration: const InputDecoration(labelText: 'End'),
                  items: _hours
                      .where((hour) => hour > _start)
                      .map(
                        (hour) => DropdownMenuItem(
                          value: hour,
                          child: Text('$hour:00'),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value != null) setState(() => _end = value);
                  },
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Available slots on this day',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            Text(
              '${sameDaySlots.length} slots',
              style: const TextStyle(color: Color(0xFF6B7280)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (sameDaySlots.isEmpty)
          const _EmptyState(text: 'No available slot for selected court/date.')
        else
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: sameDaySlots.map(
              (slot) {
                final selected = slot.start == _start && slot.end == _end;
                return _SlotChip(
                  slot: slot,
                  selected: selected,
                  onTap: () {
                    setState(() {
                      _start = slot.start;
                      _end = slot.end;
                    });
                  },
                );
              },
            ).toList(),
          ),
        const SizedBox(height: 24),
        _BookingSummary(
          court: _court,
          date: _date,
          start: _start,
          end: _end,
          submitting: _submitting,
          onSubmit: _court == null ? null : _submit,
        ),
      ],
    );
  }
}

class _BalanceCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final user = context.watch<SessionController>().user;
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF003527), Color(0xFF0D9488)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(26),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F003527),
            blurRadius: 24,
            offset: Offset(0, 12),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 24,
            backgroundColor: Colors.white24,
            child: Icon(Icons.account_balance_wallet_outlined, color: Colors.white),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'E-wallet balance',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.8),
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  formatMoney(user?.balance ?? 0),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 4),
        Text(subtitle, style: const TextStyle(color: Color(0xFF4B5563))),
      ],
    );
  }
}

class _FieldCard extends StatelessWidget {
  const _FieldCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: child,
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Text(text, textAlign: TextAlign.center),
    );
  }
}

class _SlotChip extends StatelessWidget {
  const _SlotChip({
    required this.slot,
    required this.selected,
    required this.onTap,
  });

  final BookedSlot slot;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? const Color(0xFF003527) : Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          width: 104,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? const Color(0xFF003527) : const Color(0xFFD1D5DB),
            ),
          ),
          child: Column(
            children: [
              Icon(
                Icons.schedule,
                size: 18,
                color: selected ? Colors.white : const Color(0xFF0D9488),
              ),
              const SizedBox(height: 6),
              Text(
                '${slot.start}:00',
                style: TextStyle(
                  color: selected ? Colors.white : const Color(0xFF111827),
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                '${slot.end}:00',
                style: TextStyle(
                  color: selected
                      ? Colors.white.withValues(alpha: 0.72)
                      : const Color(0xFF6B7280),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingSummary extends StatelessWidget {
  const _BookingSummary({
    required this.court,
    required this.date,
    required this.start,
    required this.end,
    required this.submitting,
    required this.onSubmit,
  });

  final Court? court;
  final DateTime date;
  final int start;
  final int end;
  final bool submitting;
  final VoidCallback? onSubmit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: Color(0xFFE8F5F1),
                child: Icon(Icons.sports_tennis, color: Color(0xFF003527)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      court?.name ?? 'Select a court',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${formatDate(date)}  |  $start:00 - $end:00',
                      style: const TextStyle(color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: submitting ? null : onSubmit,
            icon: submitting
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.check),
            label: const Text('Confirm booking'),
          ),
        ],
      ),
    );
  }
}

const _hours = [
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
];

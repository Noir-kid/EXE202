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
    final slots = await widget.api.getSlotsByCourt(court.id);
    setState(() => _slots = slots);
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 120)),
      initialDate: _date,
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _submit() async {
    final session = context.read<SessionController>();
    final userId = session.userId;
    final court = _court;
    if (userId == null || court == null) return;
    setState(() => _submitting = true);
    try {
      await widget.api.bookByBalance(
        userId: userId,
        courtId: court.id,
        date: _date,
        start: _start,
        end: _end,
      );
      await session.refreshUser();
      await _loadSlots(court);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking created successfully.')),
      );
    } catch (error) {
      if (!mounted) return;
      final message = session.apiClient.messageFromError(error);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
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
      padding: const EdgeInsets.all(16),
      children: [
        _BalanceCard(),
        const SizedBox(height: 12),
        DropdownButtonFormField<Branch>(
          initialValue: _branch,
          decoration: const InputDecoration(
            labelText: 'Branch',
            prefixIcon: Icon(Icons.storefront_outlined),
          ),
          items: _branches
              .map(
                (branch) =>
                    DropdownMenuItem(value: branch, child: Text(branch.name)),
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
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
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
            const SizedBox(width: 12),
            Expanded(
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
          ],
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: _submitting || _court == null ? null : _submit,
          icon: _submitting
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.check),
          label: const Text('Book by balance'),
        ),
        const SizedBox(height: 20),
        Text(
          'Booked slots on this day',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        if (sameDaySlots.isEmpty)
          const Text('No booked slot for selected court/date.')
        else
          ...sameDaySlots.map(
            (slot) => Card(
              child: ListTile(
                leading: const Icon(Icons.schedule),
                title: Text('${slot.start}:00 - ${slot.end}:00'),
                subtitle: Text('Booking ${slot.bookingId}'),
              ),
            ),
          ),
      ],
    );
  }
}

class _BalanceCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final user = context.watch<SessionController>().user;
    return Card(
      child: ListTile(
        leading: const Icon(Icons.account_balance_wallet_outlined),
        title: const Text('Current balance'),
        subtitle: Text(formatMoney(user?.balance ?? 0)),
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

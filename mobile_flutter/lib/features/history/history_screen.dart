import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/customer_api.dart';
import '../../core/session/session_controller.dart';
import '../../shared/models/booking.dart';
import '../../shared/models/payment.dart';
import '../../shared/widgets/async_state.dart';
import '../../shared/widgets/formatters.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key, required this.api});

  final CustomerApi api;

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController = TabController(length: 2, vsync: this);

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final userId = context.watch<SessionController>().userId;
    if (userId == null) return const Center(child: Text('Please login again.'));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Bookings'),
              Tab(text: 'Payments'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _BookingsList(api: widget.api, userId: userId),
              _PaymentsList(api: widget.api, userId: userId),
            ],
          ),
        ),
      ],
    );
  }
}

class _BookingsList extends StatefulWidget {
  const _BookingsList({required this.api, required this.userId});

  final CustomerApi api;
  final String userId;

  @override
  State<_BookingsList> createState() => _BookingsListState();
}

class _BookingsListState extends State<_BookingsList> {
  late Future<List<Booking>> _future = widget.api.getBookings(widget.userId);

  void _reload() {
    setState(() => _future = widget.api.getBookings(widget.userId));
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Booking>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const LoadingView(message: 'Loading bookings...');
        }
        if (snapshot.hasError) {
          return ErrorStateView(message: '${snapshot.error}', onRetry: _reload);
        }
        final bookings = snapshot.data ?? [];
        if (bookings.isEmpty) {
          return const _EmptyState(message: 'No booking yet.');
        }
        return RefreshIndicator(
          onRefresh: () async => _reload(),
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            itemCount: bookings.length,
            itemBuilder: (context, index) {
              final booking = bookings[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _BookingCard(booking: booking),
              );
            },
          ),
        );
      },
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({required this.booking});

  final Booking booking;

  @override
  Widget build(BuildContext context) {
    final active = !booking.isDeleted;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 20,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: active ? const Color(0xFFE8F5F1) : const Color(0xFFFFE6E3),
          child: Icon(
            active ? Icons.event_available_outlined : Icons.cancel_outlined,
            color: active ? const Color(0xFF003527) : const Color(0xFFBA1A1A),
          ),
        ),
        title: Text(
          booking.id,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          '${formatDateTime(booking.date)}\n${formatMoney(booking.amount)}',
        ),
        trailing: _BookingTypePill(type: booking.type),
      ),
    );
  }
}

class _BookingTypePill extends StatelessWidget {
  const _BookingTypePill({required this.type});

  final int type;

  @override
  Widget build(BuildContext context) {
    final label = switch (type) {
      1 => 'Once',
      2 => 'Fixed',
      _ => 'Other',
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5F1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: Color(0xFF003527),
        ),
      ),
    );
  }
}

class _PaymentsList extends StatefulWidget {
  const _PaymentsList({required this.api, required this.userId});

  final CustomerApi api;
  final String userId;

  @override
  State<_PaymentsList> createState() => _PaymentsListState();
}

class _PaymentsListState extends State<_PaymentsList> {
  late Future<List<PaymentRecord>> _future = widget.api.getPayments(widget.userId);

  void _reload() {
    setState(() => _future = widget.api.getPayments(widget.userId));
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<PaymentRecord>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const LoadingView(message: 'Loading payments...');
        }
        if (snapshot.hasError) {
          return ErrorStateView(message: '${snapshot.error}', onRetry: _reload);
        }
        final payments = snapshot.data ?? [];
        if (payments.isEmpty) {
          return const _EmptyState(message: 'No payment yet.');
        }
        return RefreshIndicator(
          onRefresh: () async => _reload(),
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            itemCount: payments.length,
            itemBuilder: (context, index) {
              final payment = payments[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _PaymentCard(payment: payment),
              );
            },
          ),
        );
      },
    );
  }
}

class _PaymentCard extends StatelessWidget {
  const _PaymentCard({required this.payment});

  final PaymentRecord payment;

  @override
  Widget build(BuildContext context) {
    final momo = payment.method == 2;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 20,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: momo ? const Color(0xFFFEEAD5) : const Color(0xFFE8F5F1),
          child: Icon(
            momo ? Icons.account_balance_wallet : Icons.payments_outlined,
            color: momo ? const Color(0xFFF97316) : const Color(0xFF003527),
          ),
        ),
        title: Text(
          formatMoney(payment.amount),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          '${formatDateTime(payment.date)}\nTransaction: ${payment.transactionId}',
        ),
        trailing: _PaymentTypePill(label: momo ? 'MoMo' : 'VNPay'),
      ),
    );
  }
}

class _PaymentTypePill extends StatelessWidget {
  const _PaymentTypePill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: Color(0xFF374151),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Text(message, textAlign: TextAlign.center),
        ),
      ),
    );
  }
}

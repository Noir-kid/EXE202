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
  late final TabController _tabController = TabController(
    length: 2,
    vsync: this,
  );

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
        TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Bookings'),
            Tab(text: 'Payments'),
          ],
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
        if (bookings.isEmpty) return const Center(child: Text('No booking.'));
        return RefreshIndicator(
          onRefresh: () async => _reload(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: bookings.length,
            itemBuilder: (context, index) {
              final booking = bookings[index];
              return Card(
                child: ListTile(
                  leading: Icon(
                    booking.isDeleted
                        ? Icons.cancel_outlined
                        : Icons.event_available_outlined,
                  ),
                  title: Text(booking.id),
                  subtitle: Text(
                    '${formatDateTime(booking.date)}\n'
                    '${formatMoney(booking.amount)}',
                  ),
                  trailing: Text(_bookingType(booking.type)),
                ),
              );
            },
          ),
        );
      },
    );
  }

  String _bookingType(int type) {
    return switch (type) {
      1 => 'Once',
      2 => 'Fixed',
      _ => 'Other',
    };
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
  late Future<List<PaymentRecord>> _future = widget.api.getPayments(
    widget.userId,
  );

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
        if (payments.isEmpty) return const Center(child: Text('No payment.'));
        return RefreshIndicator(
          onRefresh: () async => _reload(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: payments.length,
            itemBuilder: (context, index) {
              final payment = payments[index];
              return Card(
                child: ListTile(
                  leading: Icon(
                    payment.method == 2
                        ? Icons.account_balance_wallet
                        : Icons.payments_outlined,
                  ),
                  title: Text(formatMoney(payment.amount)),
                  subtitle: Text(
                    '${formatDateTime(payment.date)}\n'
                    'Transaction: ${payment.transactionId}',
                  ),
                  trailing: Text(payment.method == 2 ? 'MoMo' : 'VNPay'),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

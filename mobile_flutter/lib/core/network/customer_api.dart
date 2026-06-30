import 'package:url_launcher/url_launcher.dart';

import '../../shared/models/booking.dart';
import '../../shared/models/branch.dart';
import '../../shared/models/court.dart';
import '../../shared/models/feedback_item.dart';
import '../../shared/models/payment.dart';
import '../../shared/models/slot.dart';
import '../../shared/models/user.dart';
import 'api_client.dart';

class CustomerApi {
  CustomerApi(this._client);

  final ApiClient _client;

  Future<List<Branch>> getBranches() async {
    final response = await _client.dio.get<dynamic>('/api/branches');
    return _listFromResponse(response.data)
        .whereType<Map>()
        .map((item) => Branch.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<List<Court>> getCourtsByBranch(String branchId) async {
    final response = await _client.dio.get<dynamic>(
      '/api/courts',
      queryParameters: {'branchId': branchId},
    );
    return _listFromResponse(response.data)
        .whereType<Map>()
        .map((item) => Court.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<List<BookedSlot>> getSlotsByCourt(String courtId, DateTime date) async {
    final response = await _client.dio.get<List<dynamic>>(
      '/api/bookings/availability',
      queryParameters: {'courtId': courtId, 'date': _dateOnly(date)},
    );
    return (response.data ?? [])
        .map((item) => _slotFromAvailability(item, courtId, date))
        .toList();
  }

  Future<void> bookByBalance({
    required String userId,
    required String courtId,
    required DateTime date,
    required int start,
    required int end,
  }) async {
    await _client.dio.post(
      '/api/bookings',
      data: {
        'courtId': courtId,
        'bookingDate': _dateOnly(date),
        'startTime': _hourOnly(start),
        'endTime': _hourOnly(end),
        'note': null,
        'promoCode': null,
      },
    );
  }

  Future<List<Booking>> getBookings(String userId) async {
    final response = await _client.dio.get<dynamic>(
      '/api/bookings',
      queryParameters: {'page': 1, 'pageSize': 100},
    );
    return _listFromResponse(response.data)
        .whereType<Map>()
        .map((item) => Booking.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<List<PaymentRecord>> getPayments(String userId) async {
    final response = await _client.dio.get<dynamic>(
      '/api/payments',
      queryParameters: {'page': 1, 'pageSize': 100},
    );
    return _listFromResponse(response.data)
        .whereType<Map>()
        .map((item) => PaymentRecord.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<UserDetail?> getUserDetail(String userId) async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      '/api/users/me',
    );
    final data = response.data;
    return data == null ? null : UserDetail.fromJson(data);
  }

  Future<List<FeedbackItem>> getFeedbacksByBranch(String branchId) async {
    final courts = await getCourtsByBranch(branchId);
    final courtIds = courts.map((court) => court.id).toSet();
    final response = await _client.dio.get<dynamic>('/api/reviews');
    return _listFromResponse(response.data)
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .where((item) => courtIds.contains((item['courtId'] ?? item['CourtId']).toString()))
        .map(FeedbackItem.fromJson)
        .toList();
  }

  Future<void> postFeedback({
    required String userId,
    required String branchId,
    required int rating,
    required String content,
  }) async {
    throw UnsupportedError(
      'Backend moi yeu cau BookingId de tao review. Hay gui feedback tu mot booking da hoan tat.',
    );
  }

  Future<Uri> createBuyBalanceUrl({
    required String userId,
    required int amount,
    required int method,
  }) async {
    throw UnsupportedError(
      'Backend moi khong con endpoint nap balance. Thanh toan hien duoc tao tu booking qua /api/payments/initiate.',
    );
  }

  Future<void> openPaymentUrl(Uri url) async {
    final opened = await launchUrl(url, mode: LaunchMode.externalApplication);
    if (!opened) throw Exception('Cannot open payment URL');
  }

  String _dateOnly(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  String _hourOnly(int hour) => '${hour.toString().padLeft(2, '0')}:00:00';

  List<dynamic> _listFromResponse(dynamic data) {
    if (data is List) return data;
    if (data is Map) {
      for (final key in ['items', 'Items', 'data', 'Data', 'results', 'Results']) {
        final value = data[key];
        if (value is List) return value;
      }
    }
    return const [];
  }

  BookedSlot _slotFromAvailability(dynamic value, String courtId, DateTime date) {
    final raw = value.toString();
    final hour = int.tryParse(raw.split(':').first) ?? 0;
    return BookedSlot(
      id: '$courtId-${_dateOnly(date)}-$hour',
      bookingId: 'available',
      courtId: courtId,
      date: DateTime(date.year, date.month, date.day),
      start: hour,
      end: hour + 1,
    );
  }
}

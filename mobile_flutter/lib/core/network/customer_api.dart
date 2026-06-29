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
    final response = await _client.dio.get<List<dynamic>>('/Branch/GetAll');
    return (response.data ?? [])
        .whereType<Map>()
        .map((item) => Branch.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<List<Court>> getCourtsByBranch(String branchId) async {
    final response = await _client.dio.get<List<dynamic>>(
      '/Court/GetByBranch',
      queryParameters: {'id': branchId},
    );
    return (response.data ?? [])
        .whereType<Map>()
        .map((item) => Court.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<List<BookedSlot>> getSlotsByCourt(String courtId) async {
    final response = await _client.dio.get<List<dynamic>>(
      '/Slot/GetByDemand',
      queryParameters: {'courtId': courtId},
    );
    return (response.data ?? [])
        .whereType<Map>()
        .map((item) => BookedSlot.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<void> bookByBalance({
    required String userId,
    required String courtId,
    required DateTime date,
    required int start,
    required int end,
  }) async {
    // Chuyển sang dùng 'data' để gửi Body JSON
    await _client.dio.post(
      '/Slot/BookingByBalance',
      data: {
        'date': _dateOnly(date),
        'start': start,
        'end': end,
        'courtId': courtId,
        'userId': userId,
      },
    );
  }

  Future<List<Booking>> getBookings(String userId) async {
    final response = await _client.dio.get<List<dynamic>>(
      '/Booking/GetByUser',
      queryParameters: {'id': userId},
    );
    return (response.data ?? [])
        .whereType<Map>()
        .map((item) => Booking.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<List<PaymentRecord>> getPayments(String userId) async {
    final response = await _client.dio.get<List<dynamic>>(
      '/Payment/GetByUser',
      queryParameters: {'id': userId},
    );
    return (response.data ?? [])
        .whereType<Map>()
        .map((item) => PaymentRecord.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<UserDetail?> getUserDetail(String userId) async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      '/UserDetail/GetById',
      queryParameters: {'id': userId},
    );
    final data = response.data;
    return data == null ? null : UserDetail.fromJson(data);
  }

  Future<List<FeedbackItem>> getFeedbacksByBranch(String branchId) async {
    final response = await _client.dio.get<List<dynamic>>(
      '/Feedback/GetByBranch',
      queryParameters: {'id': branchId},
    );
    return (response.data ?? [])
        .whereType<Map>()
        .map((item) => FeedbackItem.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<void> postFeedback({
    required String userId,
    required String branchId,
    required int rating,
    required String content,
  }) async {
    // Chuyển sang dùng 'data'
    await _client.dio.post(
      '/Feedback/Post',
      data: {
        'rate': rating,
        'content': content,
        'branchId': branchId,
        'userId': userId,
      },
    );
  }

  Future<Uri> createBuyBalanceUrl({
    required String userId,
    required int amount,
    required int method,
  }) async {
    // Chuyển sang dùng 'data'
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/Booking/TransactionProcess',
      data: {
        'Method': method,
        'UserId': userId,
        'Type': 'buyTime',
        'Amount': amount,
      },
    );
    final raw = response.data?['url']?.toString();
    if (raw == null || raw.isEmpty) {
      throw Exception('Payment URL is empty');
    }
    return Uri.parse(raw);
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
}

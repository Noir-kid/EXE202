class PaymentRecord {
  PaymentRecord({
    required this.id,
    required this.userId,
    required this.bookingId,
    required this.amount,
    required this.method,
    required this.transactionId,
    required this.date,
  });

  final String id;
  final String userId;
  final String bookingId;
  final double amount;
  final int method;
  final String transactionId;
  final DateTime? date;

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    return PaymentRecord(
      id: _read(json, 'paymentId'),
      userId: _read(json, 'userId'),
      bookingId: _read(json, 'bookingId'),
      amount: double.tryParse(_read(json, 'amount', fallback: '0')) ?? 0,
      method: _readPaymentMethod(json),
      transactionId: _readAny(json, ['transactionRef', 'transactionId']),
      date: DateTime.tryParse(_readAny(json, ['paidAt', 'createdAt', 'date'])),
    );
  }
}

String _read(Map<String, dynamic> json, String key, {String fallback = ''}) {
  final pascal = key[0].toUpperCase() + key.substring(1);
  return (json[key] ?? json[pascal] ?? fallback).toString();
}

String _readAny(
  Map<String, dynamic> json,
  List<String> keys, {
  String fallback = '',
}) {
  for (final key in keys) {
    final value = _read(json, key);
    if (value.isNotEmpty) return value;
  }
  return fallback;
}

int _readPaymentMethod(Map<String, dynamic> json) {
  final raw = _read(json, 'method', fallback: '0');
  final number = int.tryParse(raw);
  if (number != null) return number;
  return switch (raw.toLowerCase()) {
    'momo' => 2,
    'vnpay' => 1,
    'cash' => 3,
    'wallet' => 4,
    'payos' => 5,
    _ => 0,
  };
}

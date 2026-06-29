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
      method: int.tryParse(_read(json, 'method', fallback: '0')) ?? 0,
      transactionId: _read(json, 'transactionId'),
      date: DateTime.tryParse(_read(json, 'date')),
    );
  }
}

String _read(Map<String, dynamic> json, String key, {String fallback = ''}) {
  final pascal = key[0].toUpperCase() + key.substring(1);
  return (json[key] ?? json[pascal] ?? fallback).toString();
}

class Booking {
  Booking({
    required this.id,
    required this.userId,
    required this.amount,
    required this.type,
    required this.date,
    required this.isDeleted,
  });

  final String id;
  final String userId;
  final double amount;
  final int type;
  final DateTime? date;
  final bool isDeleted;

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: _read(json, 'bookingId'),
      userId: _readAny(json, ['userId', 'customerId']),
      amount: double.tryParse(_readAny(json, ['totalAmount', 'amount'], fallback: '0')) ?? 0,
      type: _readBookingType(json),
      date: DateTime.tryParse(_read(json, 'bookingDate')),
      isDeleted: _readStatus(json).toLowerCase() == 'cancelled' ||
          _read(json, 'isDeleted', fallback: 'false').toLowerCase() == 'true',
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

String _readStatus(Map<String, dynamic> json) {
  return _read(json, 'status', fallback: 'Pending');
}

int _readBookingType(Map<String, dynamic> json) {
  final legacyType = int.tryParse(_read(json, 'bookingType'));
  if (legacyType != null) return legacyType;
  return _readStatus(json).toLowerCase() == 'cancelled' ? 0 : 1;
}

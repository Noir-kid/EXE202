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
      userId: _read(json, 'userId'),
      amount: double.tryParse(_read(json, 'amount', fallback: '0')) ?? 0,
      type: int.tryParse(_read(json, 'bookingType', fallback: '0')) ?? 0,
      date: DateTime.tryParse(_read(json, 'bookingDate')),
      isDeleted:
          _read(json, 'isDeleted', fallback: 'false').toLowerCase() == 'true',
    );
  }
}

String _read(Map<String, dynamic> json, String key, {String fallback = ''}) {
  final pascal = key[0].toUpperCase() + key.substring(1);
  return (json[key] ?? json[pascal] ?? fallback).toString();
}

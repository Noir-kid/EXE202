class BookedSlot {
  BookedSlot({
    required this.id,
    required this.bookingId,
    required this.courtId,
    required this.date,
    required this.start,
    required this.end,
  });

  final String id;
  final String bookingId;
  final String courtId;
  final DateTime date;
  final int start;
  final int end;

  factory BookedSlot.fromJson(Map<String, dynamic> json) {
    return BookedSlot(
      id: _read(json, 'bookedSlotId', fallback: _read(json, 'slotId')),
      bookingId: _read(json, 'bookingId'),
      courtId: _read(json, 'courtId'),
      date: DateTime.tryParse(_read(json, 'date')) ?? DateTime(1900),
      start: int.tryParse(_read(json, 'start', fallback: '0')) ?? 0,
      end: int.tryParse(_read(json, 'end', fallback: '0')) ?? 0,
    );
  }
}

String _read(Map<String, dynamic> json, String key, {String fallback = ''}) {
  final pascal = key[0].toUpperCase() + key.substring(1);
  return (json[key] ?? json[pascal] ?? fallback).toString();
}

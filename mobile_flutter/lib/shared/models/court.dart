class Court {
  Court({
    required this.id,
    required this.branchId,
    required this.name,
    required this.description,
    required this.price,
    required this.isActive,
    required this.image,
  });

  final String id;
  final String branchId;
  final String name;
  final String description;
  final double price;
  final bool isActive;
  final String image;

  factory Court.fromJson(Map<String, dynamic> json) {
    return Court(
      id: _read(json, 'courtId'),
      branchId: _read(json, 'branchId'),
      name: _readAny(json, ['name', 'courtName'], fallback: 'Court'),
      description: _read(json, 'description'),
      price: double.tryParse(_readAny(json, ['basePrice', 'price'], fallback: '0')) ?? 0,
      isActive: _readCourtStatus(json),
      image: _firstImage(_readAny(json, ['imageUrl', 'courtImg'])),
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

bool _readCourtStatus(Map<String, dynamic> json) {
  final raw = _readAny(json, ['status', 'courtStatus'], fallback: 'Active');
  final number = int.tryParse(raw);
  if (number != null) return number == 0;
  final normalized = raw.toLowerCase();
  return normalized == 'active' || normalized == 'true';
}

String _firstImage(String src) {
  if (src.isEmpty) return '';
  return src.split('|').first.trim();
}

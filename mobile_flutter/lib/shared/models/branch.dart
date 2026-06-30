class Branch {
  Branch({
    required this.id,
    required this.name,
    required this.location,
    required this.phone,
    required this.status,
    required this.image,
    required this.mapUrl,
  });

  final String id;
  final String name;
  final String location;
  final String phone;
  final int status;
  final String image;
  final String mapUrl;

  bool get isActive => status == 1;

  factory Branch.fromJson(Map<String, dynamic> json) {
    return Branch(
      id: _read(json, 'branchId'),
      name: _readAny(json, ['name', 'branchName'], fallback: 'Unnamed branch'),
      location: _readAny(json, ['address', 'location', 'city']),
      phone: _readAny(json, ['phone', 'branchPhone']),
      status: _readStatus(json),
      image: _firstImage(_readAny(json, ['imageUrl', 'branchImg'])),
      mapUrl: _read(json, 'mapUrl'),
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

int _readStatus(Map<String, dynamic> json) {
  final raw = _readAny(json, ['status', 'branchStatus'], fallback: 'Active');
  final number = int.tryParse(raw);
  if (number != null) return number == 0 ? 1 : number;
  return raw.toLowerCase() == 'active' ? 1 : 0;
}

String _firstImage(String src) {
  if (src.isEmpty) return '';
  return src.split('|').first.trim();
}

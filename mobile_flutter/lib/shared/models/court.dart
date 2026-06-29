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
      name: _read(json, 'courtName', fallback: 'Court'),
      description: _read(json, 'description'),
      price: double.tryParse(_read(json, 'price', fallback: '0')) ?? 0,
      isActive:
          _read(json, 'courtStatus', fallback: 'true').toLowerCase() == 'true',
      image: _firstImage(_read(json, 'courtImg')),
    );
  }
}

String _read(Map<String, dynamic> json, String key, {String fallback = ''}) {
  final pascal = key[0].toUpperCase() + key.substring(1);
  return (json[key] ?? json[pascal] ?? fallback).toString();
}

String _firstImage(String src) {
  if (src.isEmpty) return '';
  return src.split('|').first.trim();
}

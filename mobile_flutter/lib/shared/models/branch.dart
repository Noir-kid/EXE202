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
      name: _read(json, 'branchName', fallback: 'Unnamed branch'),
      location: _read(json, 'location'),
      phone: _read(json, 'branchPhone'),
      status: int.tryParse(_read(json, 'branchStatus', fallback: '1')) ?? 1,
      image: _firstImage(_read(json, 'branchImg')),
      mapUrl: _read(json, 'mapUrl'),
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

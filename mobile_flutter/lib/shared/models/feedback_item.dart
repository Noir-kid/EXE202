class FeedbackItem {
  FeedbackItem({
    required this.id,
    required this.userId,
    required this.branchId,
    required this.rating,
    required this.content,
    required this.period,
  });

  final String id;
  final String userId;
  final String branchId;
  final int rating;
  final String content;
  final DateTime? period;

  factory FeedbackItem.fromJson(Map<String, dynamic> json) {
    return FeedbackItem(
      id: _readAny(json, ['reviewId', 'feedbackId']),
      userId: _read(json, 'userId'),
      branchId: _readAny(json, ['branchId', 'courtId']),
      rating: int.tryParse(_read(json, 'rating', fallback: '0')) ?? 0,
      content: _readAny(json, ['comment', 'content']),
      period: DateTime.tryParse(_readAny(json, ['createdAt', 'period'])),
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

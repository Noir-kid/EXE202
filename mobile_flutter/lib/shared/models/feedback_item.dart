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
      id: _read(json, 'feedbackId'),
      userId: _read(json, 'userId'),
      branchId: _read(json, 'branchId'),
      rating: int.tryParse(_read(json, 'rating', fallback: '0')) ?? 0,
      content: _read(json, 'content'),
      period: DateTime.tryParse(_read(json, 'period')),
    );
  }
}

String _read(Map<String, dynamic> json, String key, {String fallback = ''}) {
  final pascal = key[0].toUpperCase() + key.substring(1);
  return (json[key] ?? json[pascal] ?? fallback).toString();
}

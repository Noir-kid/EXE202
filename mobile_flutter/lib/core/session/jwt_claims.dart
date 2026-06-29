import 'dart:convert';

class JwtClaims {
  JwtClaims({
    required this.userId,
    required this.username,
    required this.role,
    required this.expiresAt,
  });

  final String userId;
  final String username;
  final String role;
  final DateTime? expiresAt;

  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);

  static JwtClaims? fromToken(String token) {
    final parts = token.split('.');
    if (parts.length < 2) return null;
    final payload = utf8.decode(
      base64Url.decode(base64Url.normalize(parts[1])),
    );
    final json = jsonDecode(payload) as Map<String, dynamic>;
    final exp = json['exp'];
    return JwtClaims(
      userId: json['UserId']?.toString() ?? '',
      username: json['Username']?.toString() ?? '',
      role: json['Role']?.toString() ?? '',
      expiresAt: exp is num
          ? DateTime.fromMillisecondsSinceEpoch(exp.toInt() * 1000)
          : null,
    );
  }
}

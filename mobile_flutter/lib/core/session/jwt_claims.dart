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
      userId: _readClaim(
        json,
        [
          'userId',
          'UserId',
          'nameid',
          'sub',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
        ],
      ),
      username: _readClaim(
        json,
        [
          'username',
          'Username',
          'fullName',
          'FullName',
          'email',
          'Email',
          'name',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
        ],
      ),
      role: _readClaim(
        json,
        [
          'role',
          'Role',
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
        ],
      ),
      expiresAt: exp is num
          ? DateTime.fromMillisecondsSinceEpoch(exp.toInt() * 1000)
          : null,
    );
  }
}

String _readClaim(Map<String, dynamic> json, List<String> keys) {
  for (final key in keys) {
    final value = json[key];
    if (value != null && value.toString().isNotEmpty) return value.toString();
  }
  return '';
}

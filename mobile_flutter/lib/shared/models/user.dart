class UserAccount {
  UserAccount({
    required this.id,
    required this.username,
    required this.roleId,
    required this.branchId,
    required this.balance,
    required this.activeStatus,
  });

  final String id;
  final String username;
  final String roleId;
  final String branchId;
  final double balance;
  final bool activeStatus;

  factory UserAccount.fromJson(Map<String, dynamic> json) {
    return UserAccount(
      id: _readAny(json, ['userId', 'id']),
      username: _readAny(json, ['userName', 'username', 'fullName', 'email']),
      roleId: _readAny(json, ['roleId', 'role', 'roleCode']),
      branchId: _read(json, 'branchId'),
      balance: double.tryParse(_read(json, 'balance', fallback: '0')) ?? 0,
      activeStatus: _readAny(
            json,
            ['activeStatus', 'isActive'],
            fallback: 'false',
          ).toLowerCase() ==
          'true',
    );
  }
}

class UserDetail {
  UserDetail({
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.image,
  });

  final String userId;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String image;

  String get fullName => '$firstName $lastName'.trim();

  factory UserDetail.fromJson(Map<String, dynamic> json) {
    return UserDetail(
      userId: _readAny(json, ['userId', 'id']),
      firstName: _read(json, 'firstName'),
      lastName: _read(json, 'lastName'),
      email: _read(json, 'email'),
      phone: _read(json, 'phone'),
      image: _readAny(json, ['avatarUrl', 'imageUrl', 'img']),
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

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
      id: _read(json, 'userId'),
      username: _read(json, 'userName'),
      roleId: _read(json, 'roleId'),
      branchId: _read(json, 'branchId'),
      balance: double.tryParse(_read(json, 'balance', fallback: '0')) ?? 0,
      activeStatus:
          _read(json, 'activeStatus', fallback: 'false').toLowerCase() ==
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
      userId: _read(json, 'userId'),
      firstName: _read(json, 'firstName'),
      lastName: _read(json, 'lastName'),
      email: _read(json, 'email'),
      phone: _read(json, 'phone'),
      image: _read(json, 'img'),
    );
  }
}

String _read(Map<String, dynamic> json, String key, {String fallback = ''}) {
  final pascal = key[0].toUpperCase() + key.substring(1);
  return (json[key] ?? json[pascal] ?? fallback).toString();
}

import 'package:flutter/foundation.dart';

import '../../shared/models/user.dart';
import '../network/api_client.dart';
import '../storage/token_storage.dart';
import 'jwt_claims.dart';

class SessionController extends ChangeNotifier {
  SessionController({required this.apiClient, required this.tokenStorage});

  final ApiClient apiClient;
  final TokenStorage tokenStorage;

  bool _isReady = false;
  String? _token;
  JwtClaims? _claims;
  UserAccount? _user;

  bool get isReady => _isReady;
  bool get isAuthenticated => _token != null && _claims != null;
  String? get token => _token;
  JwtClaims? get claims => _claims;
  UserAccount? get user => _user;
  String? get userId => _claims?.userId;

  Future<void> restore() async {
    if (_isReady) return;
    final saved = await tokenStorage.readToken();
    if (saved != null) {
      final parsed = JwtClaims.fromToken(saved);
      if (parsed != null && !parsed.isExpired) {
        _token = saved;
        _claims = parsed;
        await refreshUser();
      } else {
        await tokenStorage.clear();
      }
    }
    _isReady = true;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/api/auth/login',
      data: {'email': email, 'password': password},
    );
    final data = response.data ?? const {};
    final token = (data['accessToken'] ?? data['AccessToken'] ?? data['token'])
        ?.toString();
    if (token == null || token.isEmpty) {
      throw Exception('Login response does not contain access token');
    }
    final parsed = JwtClaims.fromToken(token);
    if (parsed == null || parsed.userId.isEmpty) {
      throw Exception('Invalid token');
    }
    _token = token;
    _claims = parsed;
    await tokenStorage.saveToken(token);
    final rawUser = data['user'] ?? data['User'];
    if (rawUser is Map) {
      _user = UserAccount.fromJson(Map<String, dynamic>.from(rawUser));
    } else {
      await refreshUser();
    }
    notifyListeners();
  }

  Future<void> register({
    required String password,
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
  }) async {
    await apiClient.dio.post(
      '/api/auth/register',
      data: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        'phone': phone,
      },
    );
  }

  Future<void> refreshUser() async {
    final id = _claims?.userId;
    if (id == null || id.isEmpty) return;
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/api/users/me',
    );
    if (response.data != null) {
      _user = UserAccount.fromJson(response.data!);
    }
  }

  Future<void> logout() async {
    _token = null;
    _claims = null;
    _user = null;
    await tokenStorage.clear();
    notifyListeners();
  }
}

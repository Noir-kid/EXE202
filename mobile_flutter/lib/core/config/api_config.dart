class ApiConfig {
  ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.sportsg.online',
  );

  static const String webPaySuccessUrl = 'https://sportsg.online/paySuccess';
}

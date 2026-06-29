class ApiConfig {
  ApiConfig._();

  // Android emulator reaches the host machine through 10.0.2.2.
  // For a physical phone, replace this with the host LAN IP, for example:
  // https://192.168.1.10:7233
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://10.0.2.2:7233',
  );

  // The current backend redirects VNPay/MoMo to the React web success page.
  // Phase 1 opens payment in the browser and refreshes history after returning.
  static const String webPaySuccessUrl = 'http://localhost:7233/paySuccess';
}

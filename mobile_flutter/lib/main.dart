import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'core/session/session_controller.dart';
import 'core/storage/token_storage.dart';
import 'features/auth/auth_screen.dart';
import 'features/home/home_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final tokenStorage = TokenStorage();
  final apiClient = ApiClient(tokenStorage);
  runApp(
    SportSgMobileApp(
      session: SessionController(
        apiClient: apiClient,
        tokenStorage: tokenStorage,
      ),
    ),
  );
}

class SportSgMobileApp extends StatelessWidget {
  const SportSgMobileApp({super.key, required this.session});

  final SessionController session;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: session..restore(),
      child: MaterialApp(
        title: 'SportSG Mobile',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF0F766E),
            brightness: Brightness.light,
          ),
          scaffoldBackgroundColor: const Color(0xFFF7FAF9),
          cardTheme: CardThemeData(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
              side: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
        ),
        home: const AppGate(),
      ),
    );
  }
}

class AppGate extends StatelessWidget {
  const AppGate({super.key});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    if (!session.isReady) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return session.isAuthenticated ? const HomeShell() : const AuthScreen();
  }
}

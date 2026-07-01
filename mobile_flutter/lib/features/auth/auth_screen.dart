import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/session/session_controller.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _phone = TextEditingController();
  bool _registerMode = false;
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final session = context.read<SessionController>();
    try {
      if (_registerMode) {
        await session.register(
          password: _password.text,
          firstName: _firstName.text.trim(),
          lastName: _lastName.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Check your email to activate account.'),
          ),
        );
        setState(() => _registerMode = false);
      } else {
        await session.login(_email.text.trim(), _password.text);
      }
    } catch (error) {
      if (!mounted) return;
      final message = session.apiClient.messageFromError(error);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFF8F9FA), Color(0xFFF3F4F6)],
            ),
          ),
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x0F000000),
                        blurRadius: 24,
                        offset: Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF003527), Color(0xFF064E3B)],
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.sports_tennis,
                            color: Colors.white,
                            size: 34,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _registerMode ? 'Create SportSG account' : 'Welcome back',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _registerMode
                              ? 'Register to book courts and manage your e-wallet.'
                              : 'Sign in to continue booking your next match.',
                          style: const TextStyle(color: Color(0xFF4B5563)),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        if (_registerMode) ...[
                          TextFormField(
                            controller: _firstName,
                            decoration: const InputDecoration(
                              labelText: 'First name',
                              prefixIcon: Icon(Icons.badge_outlined),
                            ),
                            validator: _required,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _lastName,
                            decoration: const InputDecoration(
                              labelText: 'Last name',
                              prefixIcon: Icon(Icons.badge),
                            ),
                            validator: _required,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _phone,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              labelText: 'Phone',
                              prefixIcon: Icon(Icons.phone_outlined),
                            ),
                            validator: _required,
                          ),
                          const SizedBox(height: 12),
                        ],
                        TextFormField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.mail_outline),
                          ),
                          validator: _required,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _password,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Password',
                            prefixIcon: Icon(Icons.lock_outline),
                          ),
                          validator: _required,
                        ),
                        const SizedBox(height: 18),
                        FilledButton.icon(
                          onPressed: _loading ? null : _submit,
                          icon: _loading
                              ? const SizedBox.square(
                                  dimension: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Icon(
                                  _registerMode ? Icons.person_add_alt : Icons.login,
                                ),
                          label: Text(_registerMode ? 'Register' : 'Login'),
                        ),
                        TextButton(
                          onPressed: _loading
                              ? null
                              : () => setState(() => _registerMode = !_registerMode),
                          child: Text(
                            _registerMode
                                ? 'Already have an account? Login'
                                : 'Need an account? Register',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) return 'Required';
    return null;
  }
}

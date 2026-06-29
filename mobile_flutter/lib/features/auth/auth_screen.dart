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
  final _username = TextEditingController();
  final _password = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  bool _registerMode = false;
  bool _loading = false;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
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
          username: _username.text.trim(),
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
        await session.login(_username.text.trim(), _password.text);
      }
    } catch (error) {
      if (!mounted) return;
      final message = session.apiClient.messageFromError(error);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(Icons.sports_tennis, size: 58),
                    const SizedBox(height: 12),
                    Text(
                      _registerMode ? 'Create SportSG account' : 'SportSG',
                      style: Theme.of(context).textTheme.headlineMedium,
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
                      controller: _username,
                      decoration: const InputDecoration(
                        labelText: 'Username',
                        prefixIcon: Icon(Icons.person_outline),
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
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _loading ? null : _submit,
                      icon: _loading
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Icon(
                              _registerMode
                                  ? Icons.person_add_alt
                                  : Icons.login,
                            ),
                      label: Text(_registerMode ? 'Register' : 'Login'),
                    ),
                    TextButton(
                      onPressed: _loading
                          ? null
                          : () =>
                                setState(() => _registerMode = !_registerMode),
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
    );
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) return 'Required';
    return null;
  }
}

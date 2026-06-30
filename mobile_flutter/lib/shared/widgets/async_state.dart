import 'package:flutter/material.dart';

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.message = 'Loading...'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox.square(
              dimension: 28,
              child: CircularProgressIndicator(strokeWidth: 3),
            ),
            const SizedBox(height: 14),
            Text(
              message,
              style: const TextStyle(
                color: Color(0xFF4B5563),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ErrorStateView extends StatelessWidget {
  const ErrorStateView({
    super.key,
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final friendlyMessage = _friendlyMessage(message);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFE8F5F1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.wifi_off_rounded,
                  size: 34,
                  color: Color(0xFF003527),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Khong tai duoc du lieu',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                friendlyMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF6B7280)),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Try again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _friendlyMessage(String message) {
  final normalized = message.toLowerCase();
  if (normalized.contains('404')) {
    return 'May chu chua co du lieu phu hop hoac dia chi API khong kha dung.';
  }
  if (normalized.contains('401') || normalized.contains('unauthorized')) {
    return 'Phien dang nhap het han. Vui long dang nhap lai.';
  }
  if (normalized.contains('connection') || normalized.contains('timeout')) {
    return 'Kiem tra ket noi mang roi thu lai.';
  }
  return 'Co loi xay ra. Vui long thu lai sau.';
}

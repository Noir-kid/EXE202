import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/customer_api.dart';
import '../../core/session/session_controller.dart';
import '../../shared/models/branch.dart';
import '../../shared/models/feedback_item.dart';
import '../../shared/widgets/async_state.dart';
import '../../shared/widgets/formatters.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key, required this.api, required this.branch});

  final CustomerApi api;
  final Branch branch;

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _content = TextEditingController();
  int _rating = 5;
  bool _posting = false;
  late Future<List<FeedbackItem>> _future = widget.api.getFeedbacksByBranch(
    widget.branch.id,
  );

  @override
  void dispose() {
    _content.dispose();
    super.dispose();
  }

  void _reload() {
    setState(() => _future = widget.api.getFeedbacksByBranch(widget.branch.id));
  }

  Future<void> _post() async {
    final session = context.read<SessionController>();
    final userId = session.userId;
    if (userId == null || _content.text.trim().isEmpty) return;
    setState(() => _posting = true);
    try {
      await widget.api.postFeedback(
        userId: userId,
        branchId: widget.branch.id,
        rating: _rating,
        content: _content.text.trim(),
      );
      _content.clear();
      _reload();
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Feedback submitted.')));
    } catch (error) {
      if (!mounted) return;
      final message = session.apiClient.messageFromError(error);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Feedback - ${widget.branch.name}')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Write feedback',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  SegmentedButton<int>(
                    segments: const [
                      ButtonSegment(value: 1, label: Text('1')),
                      ButtonSegment(value: 2, label: Text('2')),
                      ButtonSegment(value: 3, label: Text('3')),
                      ButtonSegment(value: 4, label: Text('4')),
                      ButtonSegment(value: 5, label: Text('5')),
                    ],
                    selected: {_rating},
                    onSelectionChanged: (value) {
                      setState(() => _rating = value.first);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _content,
                    minLines: 3,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      labelText: 'Content',
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _posting ? null : _post,
                    icon: _posting
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send),
                    label: const Text('Submit'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Recent feedback',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          FutureBuilder<List<FeedbackItem>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              if (snapshot.hasError) {
                return ErrorStateView(
                  message: '${snapshot.error}',
                  onRetry: _reload,
                );
              }
              final items = snapshot.data ?? [];
              if (items.isEmpty) return const Text('No feedback yet.');
              return Column(
                children: items
                    .map(
                      (item) => Card(
                        child: ListTile(
                          leading: CircleAvatar(child: Text('${item.rating}')),
                          title: Text(item.content),
                          subtitle: Text(formatDateTime(item.period)),
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

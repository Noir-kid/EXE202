import 'package:flutter/material.dart';
import '../../core/network/customer_api.dart';
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
  late Future<List<FeedbackItem>> _future = widget.api.getFeedbacksByBranch(
    widget.branch.id,
  );

  void _reload() {
    setState(() => _future = widget.api.getFeedbacksByBranch(widget.branch.id));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Feedback - ${widget.branch.name}')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Reviews',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Backend hiện tạo review từ booking đã hoàn tất. Màn này chỉ hiển thị review hiện có của chi nhánh.',
                  style: TextStyle(color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent feedback',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              Text(
                widget.branch.name,
                style: const TextStyle(color: Color(0xFF6B7280)),
              ),
            ],
          ),
          const SizedBox(height: 10),
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
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: const Color(0xFFE8F5F1),
                              child: Text(
                                '${item.rating}',
                                style: const TextStyle(
                                  color: Color(0xFF003527),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            title: Text(
                              item.content,
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            subtitle: Text(formatDateTime(item.period)),
                          ),
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

import 'package:flutter/material.dart';

import '../../core/network/customer_api.dart';
import '../../shared/models/branch.dart';
import '../../shared/models/court.dart';
import '../../shared/widgets/async_state.dart';
import '../../shared/widgets/formatters.dart';
import '../../shared/widgets/info_card.dart';
import '../feedback/feedback_screen.dart';

class BranchesScreen extends StatefulWidget {
  const BranchesScreen({super.key, required this.api});

  final CustomerApi api;

  @override
  State<BranchesScreen> createState() => _BranchesScreenState();
}

class _BranchesScreenState extends State<BranchesScreen> {
  late Future<List<Branch>> _future = widget.api.getBranches();

  void _reload() => setState(() => _future = widget.api.getBranches());

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Branch>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const LoadingView(message: 'Loading branches...');
        }
        if (snapshot.hasError) {
          return ErrorStateView(message: '${snapshot.error}', onRetry: _reload);
        }
        final branches = snapshot.data ?? [];
        if (branches.isEmpty) {
          return const Center(child: Text('No branch available.'));
        }
        return RefreshIndicator(
          onRefresh: () async => _reload(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: branches.length,
            itemBuilder: (context, index) {
              final branch = branches[index];
              return InfoCard(
                title: branch.name,
                subtitle: '${branch.location}\n${branch.phone}',
                leading: CircleAvatar(
                  child: Text(branch.name.isEmpty ? '?' : branch.name[0]),
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) =>
                        BranchDetailScreen(api: widget.api, branch: branch),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class BranchDetailScreen extends StatefulWidget {
  const BranchDetailScreen({
    super.key,
    required this.api,
    required this.branch,
  });

  final CustomerApi api;
  final Branch branch;

  @override
  State<BranchDetailScreen> createState() => _BranchDetailScreenState();
}

class _BranchDetailScreenState extends State<BranchDetailScreen> {
  late Future<List<Court>> _future = widget.api.getCourtsByBranch(
    widget.branch.id,
  );

  void _reload() {
    setState(() => _future = widget.api.getCourtsByBranch(widget.branch.id));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.branch.name)),
      body: FutureBuilder<List<Court>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const LoadingView(message: 'Loading courts...');
          }
          if (snapshot.hasError) {
            return ErrorStateView(
              message: '${snapshot.error}',
              onRetry: _reload,
            );
          }
          final courts = snapshot.data ?? [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.branch.location,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(widget.branch.phone),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => FeedbackScreen(
                              api: widget.api,
                              branch: widget.branch,
                            ),
                          ),
                        ),
                        icon: const Icon(Icons.rate_review_outlined),
                        label: const Text('Feedback'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text('Courts', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              if (courts.isEmpty)
                const Text('No court in this branch.')
              else
                ...courts.map(
                  (court) => InfoCard(
                    title: court.name,
                    subtitle:
                        '${formatMoney(court.price)} / hour\n${court.description}',
                    leading: Icon(
                      court.isActive
                          ? Icons.check_circle_outline
                          : Icons.pause_circle_outline,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

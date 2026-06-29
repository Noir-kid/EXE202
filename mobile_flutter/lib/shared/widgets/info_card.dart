import 'package:flutter/material.dart';

class InfoCard extends StatelessWidget {
  const InfoCard({
    super.key,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.leading,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final Widget? trailing;
  final Widget? leading;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: leading,
        title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis),
        trailing: trailing,
        onTap: onTap,
      ),
    );
  }
}

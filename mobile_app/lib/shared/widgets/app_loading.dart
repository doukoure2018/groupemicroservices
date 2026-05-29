import 'package:flutter/material.dart';

/// Spinner centré avec label optionnel. À utiliser comme état "loading" plein
/// écran (FutureBuilder.loading, premier paint d'une page liste, etc.).
class AppLoading extends StatelessWidget {
  final String? label;

  const AppLoading({super.key, this.label});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          if (label != null) ...[
            const SizedBox(height: 12),
            Text(label!, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ],
      ),
    );
  }
}

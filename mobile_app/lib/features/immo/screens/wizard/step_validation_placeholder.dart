import 'package:flutter/material.dart';

import '../../../../shared/theme/app_colors.dart';

/// Placeholder de l'étape 4 (Validation + Publication) — branchera materialiser
/// + upload boucle + publier en Phase 15.2e-4.
class StepValidationPlaceholder extends StatelessWidget {
  const StepValidationPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.check_circle_outline, size: 64, color: AppColors.onBackground),
            const SizedBox(height: 16),
            Text('Étape 4 — Validation',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'À implémenter en 15.2e-4 (materialiser + upload + publier).',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

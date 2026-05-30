import 'package:flutter/material.dart';

import '../../../../shared/theme/app_colors.dart';

/// Placeholder de l'étape 3 (Photos) — branchera image_picker + galerie locale
/// + copie ApplicationDocumentsDirectory en Phase 15.2e-3.
class StepPhotosPlaceholder extends StatelessWidget {
  const StepPhotosPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.photo_library_outlined, size: 64, color: AppColors.onBackground),
            const SizedBox(height: 16),
            Text('Étape 3 — Photos',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'À implémenter en 15.2e-3 (image_picker + persistance).',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:io';

import 'package:flutter/material.dart';

import '../../../../shared/http/api_exception.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/utils/currency_formatter.dart';
import '../../models/local_photo.dart';
import '../../models/photo.dart';
import '../../models/propriete.dart';
import '../../services/brouillon_service.dart';
import '../../services/local_photo_storage_service.dart';
import '../../services/photo_upload_service.dart';
import '../../services/propriete_publication_service.dart';

/// Étape 4 du wizard publication — Validation + Publication.
///
/// Affiche un récap (preview de l'annonce) + checkbox "termes" + bouton
/// "Publier l'annonce". Le clic déclenche la séquence (B' simple) :
///   1. materialiser brouillon → Propriete BROUILLON (le brouillon backend est
///      automatiquement DELETE par la transaction côté Java)
///   2. boucle upload photos avec retry inline sur erreur (Réessayer / Continuer
///      sans cette photo / Retour aux photos si 0 uploadées)
///   3. definirCouverture si la photo cover locale n'est pas la 1ère uploadée
///      (best-effort)
///   4. reordonner si >1 photo (best-effort)
///   5. publier → BROUILLON → EN_ATTENTE (modération admin avant PUBLIE)
///   6. cleanup fichiers locaux post-success
///   7. dialog succès "EN_ATTENTE" + retour recherche
///
/// Sur erreur publier (étape 5) : dialog honnête "annonce sauvegardée en
/// brouillon, finaliser plus tard via Mes annonces (à venir)" + retour
/// recherche. La Propriete BROUILLON reste orpheline UI tant que 15.2f
/// n'est pas implémenté (dette tracée).
class StepValidationPublication extends StatefulWidget {
  final String? brouillonUuid;
  final Map<String, dynamic> donneesJson;

  /// Callback notifié quand la publication est terminée (succès OU décision
  /// "retour à la recherche" sur erreur). Le coordinateur ferme alors le
  /// wizard via Navigator.pop.
  final VoidCallback onCompleted;

  /// Callback pour revenir à l'étape Photos (utilisé si retry "0 uploadée"
  /// et user choisit "Retour aux photos").
  final VoidCallback onRetourPhotos;

  const StepValidationPublication({
    super.key,
    required this.brouillonUuid,
    required this.donneesJson,
    required this.onCompleted,
    required this.onRetourPhotos,
  });

  @override
  State<StepValidationPublication> createState() => _StepValidationPublicationState();
}

class _StepValidationPublicationState extends State<StepValidationPublication>
    with AutomaticKeepAliveClientMixin {
  final _brouillonService = BrouillonService();
  final _photoUploadService = PhotoUploadService();
  final _publicationService = ProprietePublicationService();
  final _storage = LocalPhotoStorageService();

  bool _termsAccepted = false;
  bool _publishing = false;
  String _publishStatus = '';
  double? _photoProgress;
  int _skippedPhotos = 0;

  @override
  bool get wantKeepAlive => true;

  // ============================================================
  // Build
  // ============================================================

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_publishing) {
      return _PublishingView(status: _publishStatus, progress: _photoProgress);
    }
    return _buildRecap();
  }

  /// Aplatit les 4 étapes structurées (contrat backend) en une seule map pour
  /// les helpers de rendu (qui n'ont pas besoin de connaître la séparation
  /// étape1/2/3/4). Pas utilisé pour le POST backend — uniquement preview UI.
  Map<String, dynamic> _flatInfos() {
    final d = widget.donneesJson;
    return {
      ...?(d['etape1'] as Map<String, dynamic>?),
      ...?(d['etape2'] as Map<String, dynamic>?),
      ...?(d['etape3'] as Map<String, dynamic>?),
      ...?(d['etape4'] as Map<String, dynamic>?),
    };
  }

  Widget _buildRecap() {
    final infos = _flatInfos();
    final photosRaw = (widget.donneesJson['photos'] as List<dynamic>?) ?? const [];
    final photos = photosRaw
        .map((e) => LocalPhoto.fromJson(e as Map<String, dynamic>))
        .toList();
    final cover = photos.where((p) => p.estCouverture).firstOrNull
        ?? (photos.isNotEmpty ? photos.first : null);
    final isLocation = infos['typeAnnonce'] == 'LOCATION';
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Vérifiez votre annonce', style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Avant publication, contrôlez les informations ci-dessous. Vous pourrez les modifier en revenant aux étapes précédentes.',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 16),

          // Carte preview annonce
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppColors.divider),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (cover != null)
                  AspectRatio(
                    aspectRatio: 16 / 10,
                    child: Image.file(
                      File(cover.path),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: AppColors.divider,
                        alignment: Alignment.center,
                        child: const Icon(Icons.broken_image_outlined, size: 48, color: AppColors.onBackground),
                      ),
                    ),
                  )
                else
                  Container(
                    height: 160,
                    color: AppColors.divider,
                    alignment: Alignment.center,
                    child: const Icon(Icons.image_not_supported_outlined, size: 48, color: AppColors.onBackground),
                  ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isLocation ? AppColors.secondary : AppColors.success,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            isLocation ? 'LOCATION' : 'VENTE',
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _formatPrix(infos),
                            style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.end,
                          ),
                        ),
                      ]),
                      const SizedBox(height: 8),
                      Text(
                        (infos['titre'] as String?) ?? '(sans titre)',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      _SpecsRow(infos: infos),
                      if (infos['adresseComplete'] != null) ...[
                        const SizedBox(height: 6),
                        Row(children: [
                          const Icon(Icons.place_outlined, size: 14, color: AppColors.onBackground),
                          const SizedBox(width: 4),
                          Expanded(child: Text(infos['adresseComplete'] as String, style: theme.textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis)),
                        ]),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),
          _CountersRow(
            nbPhotos: photos.length,
            nbCommodites: (infos['commoditesCodes'] as List<dynamic>?)?.length ?? 0,
          ),

          const SizedBox(height: 24),
          Text(
            'Avant publication',
            style: theme.textTheme.titleSmall,
          ),
          const SizedBox(height: 4),
          Text(
            'Votre annonce sera vérifiée par notre équipe avant d\'être visible publiquement. Vous serez notifié(e) à la validation.',
            style: theme.textTheme.bodySmall,
          ),

          const SizedBox(height: 12),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            value: _termsAccepted,
            onChanged: (v) => setState(() => _termsAccepted = v ?? false),
            title: const Text(
              'Je certifie que les informations sont exactes et que je suis autorisé(e) à publier cette annonce.',
            ),
          ),

          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: (_termsAccepted && widget.brouillonUuid != null) ? _publish : null,
            icon: const Icon(Icons.publish_outlined),
            label: const Text('Publier l\'annonce'),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          ),
        ],
      ),
    );
  }

  String _formatPrix(Map<String, dynamic> infos) {
    if (infos['prixSurDemande'] == true) return 'Sur demande';
    final prix = (infos['prix'] as num?)?.toDouble() ?? 0;
    final devise = infos['devise'] as String? ?? 'GNF';
    final montant = CurrencyFormatter.format(prix, devise);
    if (infos['typeAnnonce'] == 'LOCATION' && infos['periode'] != null) {
      return '$montant ${_periodeLabel(infos['periode'] as String)}';
    }
    return montant;
  }

  String _periodeLabel(String code) {
    switch (code) {
      case 'PAR_MOIS': return '/mois';
      case 'PAR_JOUR': return '/jour';
      case 'PAR_AN': return '/an';
      default: return '';
    }
  }

  // ============================================================
  // Séquence Publier
  // ============================================================

  Future<void> _publish() async {
    if (widget.brouillonUuid == null) return;
    setState(() {
      _publishing = true;
      _publishStatus = 'Création de l\'annonce…';
      _photoProgress = null;
      _skippedPhotos = 0;
    });

    // === 1. Materialiser brouillon → Propriete BROUILLON ===
    Propriete? propriete;
    try {
      propriete = await _brouillonService.materialiser(widget.brouillonUuid!);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _publishing = false);
      await _showErrorDialog(
        title: 'Création annonce échouée',
        message: e.message,
        retry: true,
      );
      return;
    }
    final proprieteUuid = propriete.proprieteUuid;

    // === 2. Boucle upload photos ===
    final photosRaw = (widget.donneesJson['photos'] as List<dynamic>?) ?? const [];
    final localPhotos = photosRaw
        .map((e) => LocalPhoto.fromJson(e as Map<String, dynamic>))
        .toList();
    final uploadedPhotos = <Photo>[];
    String? coverUploadedPhotoUuid;
    final total = localPhotos.length;

    for (var i = 0; i < total; i++) {
      if (!mounted) return;
      final local = localPhotos[i];
      setState(() {
        _publishStatus = 'Photo ${i + 1} sur $total…';
        _photoProgress = 0;
      });

      var resolved = false;
      while (!resolved && mounted) {
        try {
          final uploaded = await _photoUploadService.uploadPhoto(
            proprieteUuid,
            File(local.path),
            onProgress: (p) {
              if (mounted) setState(() => _photoProgress = p);
            },
          );
          uploadedPhotos.add(uploaded);
          if (local.estCouverture) coverUploadedPhotoUuid = uploaded.photoUuid;
          resolved = true;
        } on AppException catch (e) {
          if (!mounted) return;
          setState(() => _photoProgress = null);
          final action = await _askPhotoRetryDialog(
            num: i + 1,
            total: total,
            uploadedCount: uploadedPhotos.length,
            errorMessage: e.message,
          );
          switch (action) {
            case _PhotoRetryAction.retry:
              break;
            case _PhotoRetryAction.skip:
              _skippedPhotos += 1;
              resolved = true;
              break;
            case _PhotoRetryAction.backToPhotos:
              setState(() => _publishing = false);
              widget.onRetourPhotos();
              return;
          }
        }
      }
    }

    // === 3. definirCouverture (best-effort, ne bloque pas le publier) ===
    if (coverUploadedPhotoUuid != null &&
        uploadedPhotos.isNotEmpty &&
        uploadedPhotos.first.photoUuid != coverUploadedPhotoUuid) {
      if (!mounted) return;
      setState(() {
        _publishStatus = 'Définition de la couverture…';
        _photoProgress = null;
      });
      try {
        await _publicationService.definirCouverture(coverUploadedPhotoUuid);
      } on AppException {
        // best-effort silencieux ; n'empêche pas le publier
      }
    }

    // === 4. Reorder (best-effort) ===
    if (uploadedPhotos.length > 1) {
      if (!mounted) return;
      setState(() => _publishStatus = 'Organisation des photos…');
      try {
        await _publicationService.reordonner(
          proprieteUuid,
          uploadedPhotos.map((p) => p.photoUuid).toList(),
        );
      } on AppException {
        // best-effort silencieux
      }
    }

    // === 5. Publier (BROUILLON → EN_ATTENTE) ===
    if (!mounted) return;
    setState(() {
      _publishStatus = 'Publication…';
      _photoProgress = null;
    });

    try {
      await _publicationService.publier(proprieteUuid);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _publishing = false);
      await _showPublishFailedDialog(e.message);
      widget.onCompleted();
      return;
    }

    // === 6. Cleanup fichiers locaux ===
    for (final p in localPhotos) {
      await _storage.deletePhoto(p.path);
    }

    // === 7. Dialog succès EN_ATTENTE ===
    if (!mounted) return;
    setState(() => _publishing = false);
    await _showSuccessDialog();
    widget.onCompleted();
  }

  // ============================================================
  // Dialogs
  // ============================================================

  Future<_PhotoRetryAction> _askPhotoRetryDialog({
    required int num,
    required int total,
    required int uploadedCount,
    required String errorMessage,
  }) async {
    final isFirstAttempt = uploadedCount == 0;
    final result = await showDialog<_PhotoRetryAction>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text('Photo $num sur $total a échoué'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(errorMessage),
            const SizedBox(height: 8),
            Text(
              isFirstAttempt
                  ? 'Aucune photo n\'a encore été uploadée.'
                  : '$uploadedCount photo(s) déjà uploadée(s).',
              style: Theme.of(ctx).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          if (isFirstAttempt)
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(_PhotoRetryAction.backToPhotos),
              child: const Text('Retour aux photos'),
            )
          else
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(_PhotoRetryAction.skip),
              child: const Text('Continuer sans cette photo'),
            ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(_PhotoRetryAction.retry),
            child: const Text('Réessayer'),
          ),
        ],
      ),
    );
    return result ?? _PhotoRetryAction.retry; // dismiss = retry par défaut
  }

  Future<void> _showErrorDialog({
    required String title,
    required String message,
    required bool retry,
  }) async {
    final shouldRetry = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          if (retry)
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Réessayer'),
            ),
        ],
      ),
    );
    if (shouldRetry == true && mounted) {
      _publish();
    }
  }

  Future<void> _showPublishFailedDialog(String backendMessage) async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Publication échouée'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(backendMessage),
            const SizedBox(height: 12),
            const Text(
              'Votre annonce est sauvegardée en brouillon. Vous pourrez la finaliser plus tard depuis Mes annonces (à venir).',
            ),
          ],
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Retour à la recherche'),
          ),
        ],
      ),
    );
  }

  Future<void> _showSuccessDialog() async {
    final extra = _skippedPhotos > 0
        ? ' ($_skippedPhotos photo(s) ignorée(s) à cause d\'erreurs réseau)'
        : '';
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Annonce soumise'),
        content: Text(
          'Votre annonce a été soumise et sera publiée après validation par notre équipe$extra.',
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Retour à la recherche'),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// Widgets privés
// ============================================================

class _PublishingView extends StatelessWidget {
  final String status;
  final double? progress;
  const _PublishingView({required this.status, required this.progress});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(status,
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center),
            if (progress != null) ...[
              const SizedBox(height: 24),
              SizedBox(
                width: 240,
                child: LinearProgressIndicator(value: progress!.clamp(0.0, 1.0)),
              ),
              const SizedBox(height: 4),
              Text('${(progress! * 100).clamp(0, 100).toStringAsFixed(0)} %',
                  style: Theme.of(context).textTheme.bodySmall),
            ],
          ],
        ),
      ),
    );
  }
}

class _SpecsRow extends StatelessWidget {
  final Map<String, dynamic> infos;
  const _SpecsRow({required this.infos});

  @override
  Widget build(BuildContext context) {
    final items = <(IconData, String)>[];
    final ch = infos['nombreChambres'];
    final sdb = infos['nombreSallesBain'];
    final surf = infos['surfaceM2'];
    if (ch is int && ch > 0) items.add((Icons.bed_outlined, '$ch ch.'));
    if (sdb is int && sdb > 0) items.add((Icons.bathtub_outlined, '$sdb sdb'));
    if (surf is num) items.add((Icons.crop_outlined, '${surf.toStringAsFixed(0)} m²'));
    if (items.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 16,
      children: items
          .map((s) => Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(s.$1, size: 16, color: AppColors.onBackground),
                const SizedBox(width: 4),
                Text(s.$2, style: Theme.of(context).textTheme.bodySmall),
              ]))
          .toList(),
    );
  }
}

class _CountersRow extends StatelessWidget {
  final int nbPhotos;
  final int nbCommodites;
  const _CountersRow({required this.nbPhotos, required this.nbCommodites});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _Counter(icon: Icons.photo_library_outlined, label: '$nbPhotos photo(s)'),
        const SizedBox(width: 12),
        _Counter(icon: Icons.check_circle_outline, label: '$nbCommodites commodité(s)'),
      ],
    );
  }
}

class _Counter extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Counter({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.primaryContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

enum _PhotoRetryAction { retry, skip, backToPhotos }

import 'package:flutter/material.dart';

import '../../../config/app_config.dart';
import '../../../shared/theme/app_colors.dart';
import '../models/brouillon.dart';
import '../models/propriete.dart';

/// Card unifiée pour l'écran Mes annonces — gère 2 sources :
/// - [Brouillon] : icône draft + titre depuis donneesJson + "Étape N/6"
/// - [Propriete] : photo cover + titre + badge statut + prix
///
/// Tap → l'onTap callback est fourni par le parent qui sait quel écran ouvrir
/// selon le statut.
class MesAnnonceCard extends StatelessWidget {
  final VoidCallback onTap;

  /// Source A : brouillon (renseigné si propriete == null)
  final Brouillon? brouillon;

  /// Source B : propriete (renseigné si brouillon == null)
  final Propriete? propriete;

  const MesAnnonceCard.brouillon({
    super.key,
    required Brouillon this.brouillon,
    required this.onTap,
  }) : propriete = null;

  const MesAnnonceCard.propriete({
    super.key,
    required Propriete this.propriete,
    required this.onTap,
  }) : brouillon = null;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.divider),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: brouillon != null
              ? _buildBrouillonRow(context, brouillon!)
              : _buildProprieteRow(context, propriete!),
        ),
      ),
    );
  }

  Widget _buildBrouillonRow(BuildContext context, Brouillon b) {
    final theme = Theme.of(context);
    final titre = (b.donneesJson['titre'] as String?)?.trim();
    final displayTitre = (titre != null && titre.isNotEmpty)
        ? titre
        : '(Annonce sans titre)';

    return Row(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.edit_note, color: AppColors.primary, size: 32),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                displayTitre,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Brouillon · Étape ${b.etapeActuelle}/6',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.onBackground,
                ),
              ),
            ],
          ),
        ),
        const Icon(Icons.chevron_right, color: AppColors.onBackground),
      ],
    );
  }

  Widget _buildProprieteRow(BuildContext context, Propriete p) {
    final theme = Theme.of(context);
    final cover = p.photoCouverture ?? (p.photos.isNotEmpty ? p.photos.first : null);
    final imageUrl = cover != null ? _resolvePhotoUrl(cover.url) : null;

    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: imageUrl != null
              ? Image.network(
                  imageUrl,
                  width: 64,
                  height: 64,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _noPhoto(),
                )
              : _noPhoto(),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                p.titre,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              _statutBadge(p.statut),
              const SizedBox(height: 4),
              Text(
                _formatPrix(p),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.onBackground,
                ),
              ),
            ],
          ),
        ),
        const Icon(Icons.chevron_right, color: AppColors.onBackground),
      ],
    );
  }

  /// Cf step_photos._resolvePhotoUrl pour la rationale (URL parfois absolue).
  String _resolvePhotoUrl(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return '${AppConfig.apiBaseUrl}$url';
  }

  Widget _noPhoto() => Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: AppColors.divider,
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.image_not_supported_outlined,
            size: 28, color: AppColors.onBackground),
      );

  Widget _statutBadge(String statut) {
    final (label, color) = switch (statut) {
      'EN_ATTENTE_VALIDATION' => ('En attente de validation', AppColors.warning),
      'PUBLIE' => ('Publiée', AppColors.success),
      'RESERVE' => ('Réservée', AppColors.info),
      'RETIRE' => ('Rejetée', AppColors.error),
      _ => (statut, AppColors.onBackground),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }

  String _formatPrix(Propriete p) {
    if (p.prixSurDemande) return 'Prix sur demande';
    if (p.prix == 0) return 'Prix non renseigné';
    final s = p.prix.toStringAsFixed(0);
    final formatted = s.replaceAllMapped(
        RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ' ');
    return '$formatted ${p.devise}${p.periode != null ? ' / ${p.periode}' : ''}';
  }
}

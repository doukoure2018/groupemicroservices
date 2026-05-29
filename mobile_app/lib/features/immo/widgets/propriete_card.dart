import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../shared/theme/app_colors.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../models/propriete.dart';
import '../models/type_bien.dart';

/// Card d'une propriété dans la liste de recherche.
/// - Photo couverture (CachedNetworkImage) ou placeholder gris si null.
/// - Badge LOCATION / VENTE coloré.
/// - Prix formaté FR (devise + période si LOCATION).
/// - Specs : chambres / salles de bain / surface (icônes + valeurs).
/// - Adresse si fournie.
class ProprieteCard extends StatelessWidget {
  final Propriete propriete;

  /// Lookup typeBienId → TypeBien (passé par le parent qui charge le ref une fois).
  final TypeBien? typeBien;

  final VoidCallback? onTap;

  const ProprieteCard({
    super.key,
    required this.propriete,
    this.typeBien,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLocation = propriete.typeAnnonce == 'LOCATION';
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.divider),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Photo couverture (height: 180 — validé Q2)
            _cover(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _badge(isLocation),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _formatPrix(),
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.end,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    propriete.titre,
                    style: theme.textTheme.titleMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  _specs(theme),
                  if (propriete.adresseComplete != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.place_outlined, size: 14, color: AppColors.onBackground),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            propriete.adresseComplete!,
                            style: theme.textTheme.bodySmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (typeBien != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      typeBien!.libelle,
                      style: theme.textTheme.bodySmall?.copyWith(color: AppColors.onBackground),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _cover() {
    final url = propriete.photoCouverture?.urlThumbnail ??
        propriete.photoCouverture?.url ??
        (propriete.photos.isNotEmpty ? propriete.photos.first.urlThumbnail : null);
    if (url == null) {
      return Container(
        height: 180,
        color: AppColors.divider,
        alignment: Alignment.center,
        child: const Icon(Icons.image_not_supported_outlined, size: 32, color: AppColors.onBackground),
      );
    }
    return CachedNetworkImage(
      imageUrl: url,
      height: 180,
      fit: BoxFit.cover,
      placeholder: (_, __) => Container(
        height: 180,
        color: AppColors.divider,
      ),
      errorWidget: (_, __, ___) => Container(
        height: 180,
        color: AppColors.divider,
        alignment: Alignment.center,
        child: const Icon(Icons.broken_image_outlined, size: 32, color: AppColors.onBackground),
      ),
    );
  }

  Widget _badge(bool isLocation) {
    final color = isLocation ? AppColors.secondary : AppColors.success;
    final label = isLocation ? 'LOCATION' : 'VENTE';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  String _formatPrix() {
    if (propriete.prixSurDemande) return 'Sur demande';
    final montant = CurrencyFormatter.format(propriete.prix, propriete.devise);
    if (propriete.typeAnnonce == 'LOCATION' && propriete.periode != null) {
      return '$montant ${_periodeLabel(propriete.periode!)}';
    }
    return montant;
  }

  String _periodeLabel(String code) {
    switch (code) {
      case 'PAR_MOIS':
        return '/mois';
      case 'PAR_JOUR':
        return '/jour';
      case 'PAR_AN':
        return '/an';
      default:
        return '';
    }
  }

  Widget _specs(ThemeData theme) {
    final items = <_SpecItem>[];
    if (propriete.nombreChambres != null) {
      items.add(_SpecItem(Icons.bed_outlined, '${propriete.nombreChambres}'));
    }
    if (propriete.nombreSallesBain != null) {
      items.add(_SpecItem(Icons.bathtub_outlined, '${propriete.nombreSallesBain}'));
    }
    if (propriete.surfaceM2 != null) {
      items.add(_SpecItem(Icons.crop_outlined, '${propriete.surfaceM2!.toStringAsFixed(0)} m²'));
    }
    if (items.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 16,
      children: items
          .map((s) => Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(s.icon, size: 16, color: AppColors.onBackground),
                  const SizedBox(width: 4),
                  Text(s.label, style: theme.textTheme.bodySmall),
                ],
              ))
          .toList(),
    );
  }
}

class _SpecItem {
  final IconData icon;
  final String label;
  const _SpecItem(this.icon, this.label);
}

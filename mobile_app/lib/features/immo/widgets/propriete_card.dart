import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../shared/theme/app_colors.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../models/propriete.dart';
import '../models/type_bien.dart';
import 'favori_star_button.dart';

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

  /// Notifié quand l'utilisateur toggle l'étoile sur la card. Le parent (ex:
  /// RechercheScreen) doit patcher l'item dans sa liste locale pour refléter
  /// le nouvel état sans refetch — `propriete.isFavorite` est immuable, on
  /// récrée l'objet via copy logique côté parent.
  final ValueChanged<bool>? onFavoriToggled;

  const ProprieteCard({
    super.key,
    required this.propriete,
    this.typeBien,
    this.onTap,
    this.onFavoriToggled,
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
                        if (propriete.distanceM != null) ...[
                          const SizedBox(width: 6),
                          Text(
                            '· ${_formatDistance(propriete.distanceM!)}',
                            style: theme.textTheme.bodySmall?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                        ],
                      ],
                    ),
                  ] else if (propriete.distanceM != null) ...[
                    // Pas d'adresse mais distance disponible : afficher seule.
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.place_outlined, size: 14, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Text(
                          _formatDistance(propriete.distanceM!),
                          style: theme.textTheme.bodySmall?.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w500,
                              ),
                        ),
                      ],
                    ),
                  ],
                  // Compteur de vues façade — masqué si 0 vue (évite
                  // d'encombrer les nouvelles annonces). nombre_vues vient du
                  // SELECT p.* de la recherche.
                  if (propriete.nombreVues > 0) ...[
                    const SizedBox(height: 6),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.visibility_outlined,
                            size: 12, color: AppColors.primary),
                        const SizedBox(width: 3),
                        Text(
                          '${propriete.nombreVues} vue${propriete.nombreVues > 1 ? 's' : ''}',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.onBackground.withValues(alpha: 0.6),
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
    // Image PLEINE résolution (pas la miniature) : la carte est pleine largeur,
    // la miniature était trop basse définition → rendu flou. memCacheWidth
    // downsample en mémoire pour garder la RAM/perf raisonnables.
    final url = propriete.photoCouverture?.url ??
        propriete.photoCouverture?.urlThumbnail ??
        (propriete.photos.isNotEmpty ? propriete.photos.first.url : null);
    // Stack pour permettre l'overlay étoile favoris top-right sur la photo.
    // L'IconButton du FavoriStarButton consomme le tap → ne bubble pas vers
    // l'InkWell card (pas d'ouverture fiche par erreur).
    return SizedBox(
      height: 180,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (url == null)
            Container(
              color: AppColors.divider,
              alignment: Alignment.center,
              child: const Icon(Icons.image_not_supported_outlined, size: 32, color: AppColors.onBackground),
            )
          else
            CachedNetworkImage(
              imageUrl: url,
              fit: BoxFit.cover,
              memCacheWidth: 1080,
              placeholder: (_, __) => Container(color: AppColors.divider),
              errorWidget: (_, __, ___) => Container(
                color: AppColors.divider,
                alignment: Alignment.center,
                child: const Icon(Icons.broken_image_outlined, size: 32, color: AppColors.onBackground),
              ),
            ),
          Positioned(
            top: 8,
            right: 8,
            child: FavoriStarButton(
              proprieteUuid: propriete.proprieteUuid,
              isFavorite: propriete.isFavorite ?? false,
              light: true,
              compact: true,
              onChanged: onFavoriToggled,
            ),
          ),
        ],
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

/// Format distance adaptatif (Géoloc-2B) : "à 500m" si < 1000m, sinon
/// "à 1.5 km" avec 1 décimale.
String _formatDistance(double meters) {
  if (meters < 1000) {
    return 'à ${meters.toStringAsFixed(0)} m';
  }
  return 'à ${(meters / 1000).toStringAsFixed(1)} km';
}

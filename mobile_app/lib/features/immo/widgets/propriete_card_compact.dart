import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../shared/theme/app_colors.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../models/propriete.dart';
import 'favori_star_button.dart';

/// Card compacte horizontale pour sections "Recommandées" / "À proximité".
/// Spec brand SIRA mobile (sarcelle + corail) :
///   - Image cover top, border-radius 16 sur le HAUT seulement
///   - Badge LOCATION/VENTE corail overlay top-left
///   - Favori coeur overlay top-right
///   - Bloc texte : titre + ville + prix gros corail
class ProprieteCardCompact extends StatelessWidget {
  final Propriete propriete;
  final VoidCallback? onTap;
  final ValueChanged<bool>? onFavoriToggled;

  static const double cardWidth = 210;
  static const double imageHeight = 140;

  const ProprieteCardCompact({
    super.key,
    required this.propriete,
    this.onTap,
    this.onFavoriToggled,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLocation = propriete.typeAnnonce == 'LOCATION';

    return SizedBox(
      width: cardWidth,
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        elevation: 0,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _cover(isLocation),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        propriete.titre,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (propriete.adresseComplete != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.place_outlined,
                                size: 12, color: AppColors.primary),
                            const SizedBox(width: 2),
                            Expanded(
                              child: Text(
                                propriete.adresseComplete!,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: AppColors.onBackground
                                      .withValues(alpha: 0.7),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                      // Compteur de vues façade — masqué si 0 vue (évite
                      // d'encombrer les nouvelles annonces). nombre_vues vient
                      // du SELECT p.* de la recherche.
                      if (propriete.nombreVues > 0) ...[
                        const SizedBox(height: 4),
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
                                color: AppColors.onBackground
                                    .withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        _formatPrix(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.secondary,
                          height: 1.1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _cover(bool isLocation) {
    // Image PLEINE résolution (pas la miniature) pour un rendu net ;
    // memCacheWidth borne la RAM (carte compacte, largeur ~260px).
    final url = propriete.photoCouverture?.url ??
        propriete.photoCouverture?.urlThumbnail ??
        (propriete.photos.isNotEmpty
            ? propriete.photos.first.url
            : null);
    // border-radius 16 uniquement sur le haut.
    const radius = BorderRadius.vertical(top: Radius.circular(16));
    return ClipRRect(
      borderRadius: radius,
      child: SizedBox(
        height: imageHeight,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (url == null)
              Container(
                color: AppColors.divider,
                alignment: Alignment.center,
                child: const Icon(Icons.image_not_supported_outlined,
                    size: 28, color: AppColors.onBackground),
              )
            else
              CachedNetworkImage(
                imageUrl: url,
                fit: BoxFit.cover,
                memCacheWidth: 720,
                placeholder: (_, __) => Container(color: AppColors.divider),
                errorWidget: (_, __, ___) => Container(
                  color: AppColors.divider,
                  alignment: Alignment.center,
                  child: const Icon(Icons.broken_image_outlined,
                      size: 28, color: AppColors.onBackground),
                ),
              ),
            Positioned(
              top: 8,
              left: 8,
              child: _badge(isLocation),
            ),
            Positioned(
              top: 4,
              right: 4,
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
      ),
    );
  }

  Widget _badge(bool isLocation) {
    // Spec : badge corail (secondary) pour les 2 modes (uniforme, visuel
    // brand). Différenciation faite par le label.
    final label = isLocation ? 'LOCATION' : 'VENTE';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.secondary,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.onSecondary,
          fontSize: 10,
          fontWeight: FontWeight.w800,
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
}

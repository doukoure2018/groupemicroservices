import '../../../config/app_config.dart';

/// Photo d'une propriété immobilière. Modélise le payload retourné par
/// le backend dans `Propriete.photos[]` (et `photoCouverture`) sur la
/// fiche détail (`GET /immo/proprietes/{uuid}`). Vide en search.
///
/// Champs backend ignorés en 15.2b (à ajouter si un usage UI les requiert) :
/// photoId, proprieteId, objectKey, objectKeyThumbnail, tailleOctets,
/// typeMime, largeur, hauteur, createdAt.
class Photo {
  final String photoUuid;
  final String url;
  final String urlThumbnail;
  final int ordreAffichage;
  final bool estCouverture;

  const Photo({
    required this.photoUuid,
    required this.url,
    required this.urlThumbnail,
    required this.ordreAffichage,
    required this.estCouverture,
  });

  factory Photo.fromJson(Map<String, dynamic> json) => Photo(
        photoUuid: json['photoUuid'] as String,
        url: _absolutize(json['url'] as String),
        urlThumbnail: _absolutize(json['urlThumbnail'] as String),
        ordreAffichage: json['ordreAffichage'] as int? ?? 0,
        estCouverture: json['estCouverture'] as bool? ?? false,
      );

  /// Si le backend renvoie une URL relative (`/immo/photos/{uuid}`), la
  /// préfixe avec l'apiBaseUrl du client (gateway public en prod, host
  /// loopback en dev). Si déjà absolue (legacy MinIO localhost:9100), la
  /// laisse telle quelle — CachedNetworkImage échouera mais affichera son
  /// errorWidget proprement.
  static String _absolutize(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    final base = AppConfig.apiBaseUrl;
    final trimmedBase = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    return trimmedBase + url;
  }
}

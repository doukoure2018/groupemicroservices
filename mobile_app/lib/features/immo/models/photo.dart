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
        url: json['url'] as String,
        urlThumbnail: json['urlThumbnail'] as String,
        ordreAffichage: json['ordreAffichage'] as int? ?? 0,
        estCouverture: json['estCouverture'] as bool? ?? false,
      );
}

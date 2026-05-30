/// Brouillon de propriété persisté entre les étapes du wizard publication.
///
/// `donneesJson` est volontairement libre (JSONB côté Postgres) : le frontend
/// y range les champs sérialisés à sa convenance, le backend ne valide rien
/// avant la matérialisation (`POST /immo/brouillons/{uuid}/materialiser`).
///
/// Structure conseillée (cf. backend doc) :
/// ```
/// {
///   "etape1": { typeAnnonce, dureeLocation, typeBienCode, ... },
///   "etape2": { localisationUuid, adresseComplete, lat, lng, ... },
///   "etape3": { prix, devise, periode, chambres, sdb, surface, commodites, ... },
///   "etape4": { description, nomContactPublic, telephoneContact },
///   "photos": [{ "localPath": "/app/docs/wizard/...jpg", "ordre": 0, "estCouverture": true }]
/// }
/// ```
///
/// Champs backend ignorés en 15.2e-1 (à ajouter si UI requise) :
/// brouillonId, userId, proprieteId (NULL tant que pas matérialisé),
/// derniereModification.
class Brouillon {
  final String brouillonUuid;
  final int etapeActuelle;
  final Map<String, dynamic> donneesJson;
  final String? createdAt;

  const Brouillon({
    required this.brouillonUuid,
    required this.etapeActuelle,
    required this.donneesJson,
    this.createdAt,
  });

  factory Brouillon.fromJson(Map<String, dynamic> json) => Brouillon(
        brouillonUuid: json['brouillonUuid'] as String,
        etapeActuelle: json['etapeActuelle'] as int,
        donneesJson: (json['donneesJson'] as Map<String, dynamic>?) ?? const {},
        createdAt: json['createdAt'] as String?,
      );
}

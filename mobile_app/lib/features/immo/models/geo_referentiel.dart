/// Référentiel géographique minimal pour « Déclarer mon besoin ».
///
/// Exposé par le service billetterie (`/billetterie/communes`,
/// `/billetterie/quartiers`) — même schéma BDD que l'immobilier : les ids
/// Long retournés ici sont exactement ceux attendus par `POST /immo/demandes`.
class CommuneRef {
  final int communeId;
  final String communeUuid;
  final String libelle;
  final String? villeLibelle;
  final String? regionLibelle;

  const CommuneRef({
    required this.communeId,
    required this.communeUuid,
    required this.libelle,
    this.villeLibelle,
    this.regionLibelle,
  });

  factory CommuneRef.fromJson(Map<String, dynamic> json) => CommuneRef(
        communeId: json['communeId'] as int,
        communeUuid: json['communeUuid'] as String,
        libelle: json['libelle'] as String,
        villeLibelle: json['villeLibelle'] as String?,
        regionLibelle: json['regionLibelle'] as String?,
      );
}

class QuartierRef {
  final int quartierId;
  final String quartierUuid;
  final String libelle;

  const QuartierRef({
    required this.quartierId,
    required this.quartierUuid,
    required this.libelle,
  });

  factory QuartierRef.fromJson(Map<String, dynamic> json) => QuartierRef(
        quartierId: json['quartierId'] as int,
        quartierUuid: json['quartierUuid'] as String,
        libelle: json['libelle'] as String,
      );
}

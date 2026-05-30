/// Commodité associée à une propriété (CLIMATISATION, PARKING, etc.).
///
/// Renvoyée par le backend dans `Propriete.commodites[]` sur la fiche détail
/// (`GET /immo/proprietes/{uuid}`). Vide en search.
///
/// Champs backend ignorés en 15.2d (à ajouter si un usage UI les requiert) :
/// commoditeId, commoditeUuid, categorie, ordreAffichage, actif,
/// createdAt, updatedAt.
class Commodite {
  final String code;
  final String libelle;
  final String? icone;

  const Commodite({
    required this.code,
    required this.libelle,
    this.icone,
  });

  factory Commodite.fromJson(Map<String, dynamic> json) => Commodite(
        code: json['code'] as String,
        libelle: json['libelle'] as String,
        icone: json['icone'] as String?,
      );
}

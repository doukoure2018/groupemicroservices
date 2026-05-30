/// Commodité associée à une propriété (CLIMATISATION, PARKING, etc.).
///
/// Renvoyée par le backend :
///   - `Propriete.commodites[]` sur la fiche détail (vide en search)
///   - Liste référentielle complète via `GET /immo/commodites` (wizard
///     publication 15.2e-2 — l'utilisateur coche celles qui s'appliquent)
///
/// `categorie` (ajouté 15.2e-2) sert à regrouper les chips dans le wizard :
/// CONFORT | SECURITE | EXTERIEUR. Optionnel — fallback "Autres" si null.
///
/// Champs backend ignorés (à ajouter si UI requise) :
/// commoditeId, commoditeUuid, ordreAffichage, actif, createdAt, updatedAt.
class Commodite {
  final String code;
  final String libelle;
  final String? icone;
  final String? categorie;

  const Commodite({
    required this.code,
    required this.libelle,
    this.icone,
    this.categorie,
  });

  factory Commodite.fromJson(Map<String, dynamic> json) => Commodite(
        code: json['code'] as String,
        libelle: json['libelle'] as String,
        icone: json['icone'] as String?,
        categorie: json['categorie'] as String?,
      );
}

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
/// `commoditeId` (ajouté pour « Déclarer mon besoin ») : le backend
/// `POST /immo/demandes` attend des ids Long, pas des codes. Nullable car
/// absent dans `Propriete.commodites[]` de certaines réponses détail.
///
/// Champs backend ignorés (à ajouter si UI requise) :
/// commoditeUuid, ordreAffichage, actif, createdAt, updatedAt.
class Commodite {
  final int? commoditeId;
  final String code;
  final String libelle;
  final String? icone;
  final String? categorie;

  const Commodite({
    this.commoditeId,
    required this.code,
    required this.libelle,
    this.icone,
    this.categorie,
  });

  factory Commodite.fromJson(Map<String, dynamic> json) => Commodite(
        commoditeId: json['commoditeId'] as int?,
        code: json['code'] as String,
        libelle: json['libelle'] as String,
        icone: json['icone'] as String?,
        categorie: json['categorie'] as String?,
      );
}

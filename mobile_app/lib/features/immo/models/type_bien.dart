/// Type de bien immobilier (référentiel). Backend : `GET /immo/types-bien`
/// retourne `{data: {types: [{...}]}}`. Le `code` (MAISON, APPARTEMENT, ...)
/// est l'identifiant logique stable utilisé pour filtrer côté search.
/// `icone` est un nom Material Icons (ex: "home", "apartment").
///
/// Champs backend ignorés en 15.2b : typeBienUuid, ordreAffichage, actif,
/// createdAt, updatedAt.
class TypeBien {
  final int typeBienId;
  final String code;
  final String libelle;
  final String? description;
  final String? icone;

  const TypeBien({
    required this.typeBienId,
    required this.code,
    required this.libelle,
    this.description,
    this.icone,
  });

  factory TypeBien.fromJson(Map<String, dynamic> json) => TypeBien(
        typeBienId: json['typeBienId'] as int,
        code: json['code'] as String,
        libelle: json['libelle'] as String,
        description: json['description'] as String?,
        icone: json['icone'] as String?,
      );
}

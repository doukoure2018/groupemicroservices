import 'photo.dart';

/// Annonce immobilière. Modèle commun pour les deux formes que le backend
/// renvoie :
///   - search shape (`GET /immo/proprietes/recherche`) : objets nested
///     (`photos`, `photoCouverture`, `commodites`, `typeBien`) sont **null**.
///   - fiche shape (`GET /immo/proprietes/{uuid}`) : nested populés (sauf
///     `typeBien` qui reste null aujourd'hui — résolu côté client via
///     `typeBienId → /immo/types-bien`).
///
/// `datePublication` reste en String ISO 8601 — parsé via DateTime.parse()
/// au moment du display pour éviter une conversion locale prématurée.
///
/// Champs backend ignorés en 15.2b (à ajouter si un usage UI les requiert) :
/// proprieteId, profilId, agenceId, nombreEtages, etageSituation,
/// anneeConstruction, moisCaution/Avance/Honoraire, localisationId,
/// afficherAdresseExacte, dateDisponibilite, dateExpiration,
/// nombreRenouvellements, motifRejet, nomContactPublic, telephoneContact,
/// premium, datePremiumFin, createdAt, updatedAt,
/// rappelExpirationEnvoyeAt, commodites, distanceM, isFavorite,
/// typeBien (toujours null aujourd'hui).
class Propriete {
  final String proprieteUuid;
  final String reference;
  final String typeAnnonce;
  final String? dureeLocation;
  final int typeBienId;
  final String titre;
  final String? description;
  final double prix;
  final String devise;
  final String? periode;
  final bool prixSurDemande;
  final bool prixNegociable;
  final int? nombreChambres;
  final int? nombreSallesBain;
  final double? surfaceM2;
  final String? adresseComplete;
  final double? latitude;
  final double? longitude;
  final String statut;
  final String? datePublication;
  final int nombreVues;
  final int nombreFavoris;
  final int nombreContacts;
  final List<Photo> photos;
  final Photo? photoCouverture;

  const Propriete({
    required this.proprieteUuid,
    required this.reference,
    required this.typeAnnonce,
    this.dureeLocation,
    required this.typeBienId,
    required this.titre,
    this.description,
    required this.prix,
    required this.devise,
    this.periode,
    required this.prixSurDemande,
    required this.prixNegociable,
    this.nombreChambres,
    this.nombreSallesBain,
    this.surfaceM2,
    this.adresseComplete,
    this.latitude,
    this.longitude,
    required this.statut,
    this.datePublication,
    required this.nombreVues,
    required this.nombreFavoris,
    required this.nombreContacts,
    this.photos = const [],
    this.photoCouverture,
  });

  factory Propriete.fromJson(Map<String, dynamic> json) => Propriete(
        proprieteUuid: json['proprieteUuid'] as String,
        reference: json['reference'] as String,
        typeAnnonce: json['typeAnnonce'] as String,
        dureeLocation: json['dureeLocation'] as String?,
        typeBienId: json['typeBienId'] as int,
        titre: json['titre'] as String,
        description: json['description'] as String?,
        prix: (json['prix'] as num).toDouble(),
        devise: json['devise'] as String,
        periode: json['periode'] as String?,
        prixSurDemande: json['prixSurDemande'] as bool? ?? false,
        prixNegociable: json['prixNegociable'] as bool? ?? false,
        nombreChambres: json['nombreChambres'] as int?,
        nombreSallesBain: json['nombreSallesBain'] as int?,
        surfaceM2: (json['surfaceM2'] as num?)?.toDouble(),
        adresseComplete: json['adresseComplete'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        statut: json['statut'] as String,
        datePublication: json['datePublication'] as String?,
        nombreVues: json['nombreVues'] as int? ?? 0,
        nombreFavoris: json['nombreFavoris'] as int? ?? 0,
        nombreContacts: json['nombreContacts'] as int? ?? 0,
        photos: (json['photos'] as List<dynamic>?)
                ?.map((e) => Photo.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        photoCouverture: json['photoCouverture'] != null
            ? Photo.fromJson(json['photoCouverture'] as Map<String, dynamic>)
            : null,
      );
}

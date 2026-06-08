import 'commodite.dart';
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
/// `nomContactPublic` exposé en 15.2d pour la section "Vendeur" de la fiche
/// (téléphone/email PAS exposés direct — passe par bottom sheets Contact/Visite,
/// RGPD).
///
/// `isFavorite` (ajouté Phase Favoris) — tri-état théorique côté backend :
/// `null` = requête anonyme (pas de JWT), `true`/`false` = user connecté.
/// L'app mobile actuelle force le login avant HubScreen, donc `null` n'est
/// jamais reçu en pratique. UI traite `null` comme `false` par défaut.
///
/// `distanceM` (ajouté Phase Géoloc-2B) — distance en mètres à la position
/// utilisateur si la recherche embarquait lat/lng (filtre rayon). Null sinon.
/// Affichage adaptatif sur ProprieteCard : "à 500m" / "à 1.5 km".
///
/// Champs backend ignorés (à ajouter si un usage UI les requiert) :
/// proprieteId, profilId, agenceId, nombreEtages, etageSituation,
/// anneeConstruction, moisCaution/Avance/Honoraire, localisationId,
/// afficherAdresseExacte, dateDisponibilite, dateExpiration,
/// nombreRenouvellements, motifRejet, telephoneContact,
/// premium, datePremiumFin, createdAt, updatedAt,
/// rappelExpirationEnvoyeAt,
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
  final String? nomContactPublic;
  final List<Photo> photos;
  final Photo? photoCouverture;
  final List<Commodite> commodites;
  final bool? isFavorite;
  final double? distanceM;
  /// Renseigné quand un admin rejette l'annonce (statut RETIRE). Null sinon.
  /// Affiché sur l'écran "Mes annonces" pour permettre au vendeur de corriger.
  final String? motifRejet;

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
    this.nomContactPublic,
    this.photos = const [],
    this.photoCouverture,
    this.commodites = const [],
    this.isFavorite,
    this.distanceM,
    this.motifRejet,
  });

  /// Retourne une copie de la propriété avec `isFavorite` patché. Utilisé
  /// par les écrans pour propager un toggle local sans refetch — tous les
  /// autres champs sont préservés.
  Propriete withFavorite(bool? newValue) => Propriete(
        proprieteUuid: proprieteUuid,
        reference: reference,
        typeAnnonce: typeAnnonce,
        dureeLocation: dureeLocation,
        typeBienId: typeBienId,
        titre: titre,
        description: description,
        prix: prix,
        devise: devise,
        periode: periode,
        prixSurDemande: prixSurDemande,
        prixNegociable: prixNegociable,
        nombreChambres: nombreChambres,
        nombreSallesBain: nombreSallesBain,
        surfaceM2: surfaceM2,
        adresseComplete: adresseComplete,
        latitude: latitude,
        longitude: longitude,
        statut: statut,
        datePublication: datePublication,
        nombreVues: nombreVues,
        nombreFavoris: nombreFavoris,
        nombreContacts: nombreContacts,
        nomContactPublic: nomContactPublic,
        photos: photos,
        photoCouverture: photoCouverture,
        commodites: commodites,
        isFavorite: newValue,
        distanceM: distanceM,
        motifRejet: motifRejet,
      );

  factory Propriete.fromJson(Map<String, dynamic> json) => Propriete(
        proprieteUuid: json['proprieteUuid'] as String,
        reference: json['reference'] as String,
        typeAnnonce: json['typeAnnonce'] as String,
        dureeLocation: json['dureeLocation'] as String?,
        typeBienId: json['typeBienId'] as int,
        titre: json['titre'] as String,
        description: json['description'] as String?,
        // Fallback 0.0 si prix null : cas brouillon matérialisé sans prix
        // renseigné côté wizard. Évite TypeError Dart non-catchable qui hang
        // le wizard sur "Création annonce…". Cf dette
        // mobile-brouillon-prix-null-fallback-zero pour fix racine (double?).
        prix: (json['prix'] as num?)?.toDouble() ?? 0.0,
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
        nomContactPublic: json['nomContactPublic'] as String?,
        photos: (json['photos'] as List<dynamic>?)
                ?.map((e) => Photo.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        photoCouverture: json['photoCouverture'] != null
            ? Photo.fromJson(json['photoCouverture'] as Map<String, dynamic>)
            : null,
        commodites: (json['commodites'] as List<dynamic>?)
                ?.map((e) => Commodite.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        isFavorite: json['isFavorite'] as bool?,
        distanceM: (json['distanceM'] as num?)?.toDouble(),
        motifRejet: json['motifRejet'] as String?,
      );
}

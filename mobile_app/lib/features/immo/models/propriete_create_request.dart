/// DTO de requête pour `POST /immo/proprietes` (création directe sans brouillon).
///
/// En 15.2e, on N'utilise PAS cet endpoint directement — le wizard passe par
/// `POST /immo/brouillons/{uuid}/materialiser` qui crée la `Propriete` depuis
/// le brouillon. Ce DTO est néanmoins modélisé ici pour :
///   1. typer ce qu'on range dans `Brouillon.donneesJson` (cohérence)
///   2. permettre une création directe plus tard (admin import, etc.)
///
/// Conforme à `ProprieteCreateRequest.java` côté backend (24 champs).
/// `typeAnnonce`, `typeBienCode` requis ; `dureeLocation` requis si LOCATION ;
/// `prix` requis si !prixSurDemande ; `devise` défaut GNF ; champs numériques
/// avec contraintes Min/Max côté backend (chambres 0-50, sdb 0-50, etc.).
class ProprieteCreateRequest {
  final String typeAnnonce;          // LOCATION | VENTE
  final String? dureeLocation;       // COURT_SEJOUR | LONG_SEJOUR (si LOCATION)
  final String typeBienCode;         // MAISON | APPARTEMENT | ...

  final String? titre;
  final String? description;

  // Prix
  final double? prix;
  final String devise;               // GNF | USD | EUR (défaut GNF)
  final String? periode;             // PAR_MOIS | PAR_AN | UNIQUE
  final bool prixSurDemande;
  final bool prixNegociable;

  // Caractéristiques
  final int nombreChambres;
  final int nombreSallesBain;
  final double? surfaceM2;
  final int? nombreEtages;
  final int? etageSituation;
  final int? anneeConstruction;

  // Conditions location
  final int? moisCaution;
  final int? moisAvance;
  final int? moisHonoraire;

  // Localisation
  final String? localisationUuid;
  final String? adresseComplete;
  final double? latitude;
  final double? longitude;
  final bool afficherAdresseExacte;

  final DateTime? dateDisponibilite;

  // Contact public
  final String? nomContactPublic;
  final String? telephoneContact;

  // Commodités (codes)
  final List<String> commoditesCodes;

  const ProprieteCreateRequest({
    required this.typeAnnonce,
    this.dureeLocation,
    required this.typeBienCode,
    this.titre,
    this.description,
    this.prix,
    this.devise = 'GNF',
    this.periode,
    this.prixSurDemande = false,
    this.prixNegociable = false,
    this.nombreChambres = 0,
    this.nombreSallesBain = 1,
    this.surfaceM2,
    this.nombreEtages,
    this.etageSituation,
    this.anneeConstruction,
    this.moisCaution,
    this.moisAvance,
    this.moisHonoraire,
    this.localisationUuid,
    this.adresseComplete,
    this.latitude,
    this.longitude,
    this.afficherAdresseExacte = false,
    this.dateDisponibilite,
    this.nomContactPublic,
    this.telephoneContact,
    this.commoditesCodes = const [],
  });

  Map<String, dynamic> toJson() => {
        'typeAnnonce': typeAnnonce,
        if (dureeLocation != null) 'dureeLocation': dureeLocation,
        'typeBienCode': typeBienCode,
        if (titre != null && titre!.isNotEmpty) 'titre': titre,
        if (description != null && description!.isNotEmpty) 'description': description,
        if (prix != null) 'prix': prix,
        'devise': devise,
        if (periode != null) 'periode': periode,
        'prixSurDemande': prixSurDemande,
        'prixNegociable': prixNegociable,
        'nombreChambres': nombreChambres,
        'nombreSallesBain': nombreSallesBain,
        if (surfaceM2 != null) 'surfaceM2': surfaceM2,
        if (nombreEtages != null) 'nombreEtages': nombreEtages,
        if (etageSituation != null) 'etageSituation': etageSituation,
        if (anneeConstruction != null) 'anneeConstruction': anneeConstruction,
        if (moisCaution != null) 'moisCaution': moisCaution,
        if (moisAvance != null) 'moisAvance': moisAvance,
        if (moisHonoraire != null) 'moisHonoraire': moisHonoraire,
        if (localisationUuid != null) 'localisationUuid': localisationUuid,
        if (adresseComplete != null && adresseComplete!.isNotEmpty)
          'adresseComplete': adresseComplete,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        'afficherAdresseExacte': afficherAdresseExacte,
        if (dateDisponibilite != null)
          'dateDisponibilite': _formatDate(dateDisponibilite!),
        if (nomContactPublic != null && nomContactPublic!.isNotEmpty)
          'nomContactPublic': nomContactPublic,
        if (telephoneContact != null && telephoneContact!.isNotEmpty)
          'telephoneContact': telephoneContact,
        if (commoditesCodes.isNotEmpty) 'commoditesCodes': commoditesCodes,
      };

  static String _formatDate(DateTime d) {
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }
}

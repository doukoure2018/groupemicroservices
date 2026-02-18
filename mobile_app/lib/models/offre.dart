class Offre {
  final String offreUuid;
  final String? tokenOffre;
  final String? trajetLibelle;
  final int? trajetDureeMinutes;
  final String? departLibelle;
  final String? siteDepart;
  final String? villeDepartLibelle;
  final String? villeDepartUuid;
  final String? arriveeLibelle;
  final String? siteArrivee;
  final String? villeArriveeLibelle;
  final String? villeArriveeUuid;
  final String? dateDepart;
  final String? heureDepart;
  final String? heureArriveeEstimee;
  final int nombrePlacesDisponibles;
  final int nombrePlacesTotal;
  final double montant;
  final double? montantPromotion;
  final String? devise;
  final String? vehiculeImmatriculation;
  final String? vehiculeMarque;
  final String? vehiculeModele;
  final bool vehiculeClimatise;
  final String? typeVehiculeLibelle;
  final String? nomChauffeur;
  final String? contactChauffeur;
  final double? noteMoyenne;
  final int? nombreAvis;
  final String? statut;
  final String? pointRendezvous;
  final String? conditions;
  final bool annulationAutorisee;
  final int? delaiAnnulationHeures;

  Offre({
    required this.offreUuid,
    this.tokenOffre,
    this.trajetLibelle,
    this.trajetDureeMinutes,
    this.departLibelle,
    this.siteDepart,
    this.villeDepartLibelle,
    this.villeDepartUuid,
    this.arriveeLibelle,
    this.siteArrivee,
    this.villeArriveeLibelle,
    this.villeArriveeUuid,
    this.dateDepart,
    this.heureDepart,
    this.heureArriveeEstimee,
    this.nombrePlacesDisponibles = 0,
    this.nombrePlacesTotal = 0,
    this.montant = 0,
    this.montantPromotion,
    this.devise,
    this.vehiculeImmatriculation,
    this.vehiculeMarque,
    this.vehiculeModele,
    this.vehiculeClimatise = false,
    this.typeVehiculeLibelle,
    this.nomChauffeur,
    this.contactChauffeur,
    this.noteMoyenne,
    this.nombreAvis,
    this.statut,
    this.pointRendezvous,
    this.conditions,
    this.annulationAutorisee = true,
    this.delaiAnnulationHeures,
  });

  double get montantEffectif =>
      (montantPromotion != null && montantPromotion! > 0)
          ? montantPromotion!
          : montant;

  bool get hasPromotion =>
      montantPromotion != null &&
      montantPromotion! > 0 &&
      montantPromotion! < montant;

  String get vehiculeDescription {
    if (vehiculeMarque != null && vehiculeModele != null) {
      return '$vehiculeMarque $vehiculeModele';
    }
    return typeVehiculeLibelle ?? 'Véhicule';
  }

  String get durationFormatted {
    if (trajetDureeMinutes == null) return '';
    final h = trajetDureeMinutes! ~/ 60;
    final m = trajetDureeMinutes! % 60;
    if (h > 0 && m > 0) return '${h}h${m.toString().padLeft(2, '0')}';
    if (h > 0) return '${h}h';
    return '${m}min';
  }

  String get heuresDepartFormatted =>
      heureDepart?.substring(0, 5) ?? '';

  String get heuresArriveeFormatted =>
      heureArriveeEstimee?.substring(0, 5) ?? '';

  factory Offre.fromJson(Map<String, dynamic> json) {
    return Offre(
      offreUuid: json['offreUuid'] ?? '',
      tokenOffre: json['tokenOffre'],
      trajetLibelle: json['trajetLibelle'],
      trajetDureeMinutes: json['trajetDureeMinutes'],
      departLibelle: json['departLibelle'],
      siteDepart: json['siteDepart'],
      villeDepartLibelle: json['villeDepartLibelle'],
      villeDepartUuid: json['villeDepartUuid'],
      arriveeLibelle: json['arriveeLibelle'],
      siteArrivee: json['siteArrivee'],
      villeArriveeLibelle: json['villeArriveeLibelle'],
      villeArriveeUuid: json['villeArriveeUuid'],
      dateDepart: json['dateDepart'],
      heureDepart: json['heureDepart'],
      heureArriveeEstimee: json['heureArriveeEstimee'],
      nombrePlacesDisponibles: json['nombrePlacesDisponibles'] ?? 0,
      nombrePlacesTotal: json['nombrePlacesTotal'] ?? 0,
      montant: (json['montant'] ?? 0).toDouble(),
      montantPromotion: json['montantPromotion']?.toDouble(),
      devise: json['devise'],
      vehiculeImmatriculation: json['vehiculeImmatriculation'],
      vehiculeMarque: json['vehiculeMarque'],
      vehiculeModele: json['vehiculeModele'],
      vehiculeClimatise: json['vehiculeClimatise'] ?? false,
      typeVehiculeLibelle: json['typeVehiculeLibelle'],
      nomChauffeur: json['nomChauffeur'],
      contactChauffeur: json['contactChauffeur'],
      noteMoyenne: json['noteMoyenne']?.toDouble(),
      nombreAvis: json['nombreAvis'],
      statut: json['statut'],
      pointRendezvous: json['pointRendezvous'],
      conditions: json['conditions'],
      annulationAutorisee: json['annulationAutorisee'] ?? true,
      delaiAnnulationHeures: json['delaiAnnulationHeures'],
    );
  }
}

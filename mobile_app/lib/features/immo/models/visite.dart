/// Demande de visite créée — modèle de RÉPONSE après POST.
///
/// Modélise le payload backend `{"visite": {...}}` retourné par
/// `POST /immo/proprietes/{uuid}/visites` (201 Created).
///
/// Volontairement minimal en 15.2d-1 (cf. [Contact]).
/// `dateVisite` et `heureVisite` restent en String ISO — parsing au moment
/// du display dans les futures phases (mes-demandes côté visiteur).
///
/// Champs backend ignorés (à ajouter si UI requise) :
/// visiteId, proprieteId, visiteurUserId, notesVendeur, motifAnnulation,
/// updatedAt.
class Visite {
  final String visiteUuid;
  final String dateVisite;       // "yyyy-MM-dd"
  final String? heureVisite;     // "HH:mm:ss" ou null
  final String statut;           // DEMANDEE | CONFIRMEE | EFFECTUEE | ANNULEE
  final String? notesVisiteur;
  final String? createdAt;

  const Visite({
    required this.visiteUuid,
    required this.dateVisite,
    this.heureVisite,
    required this.statut,
    this.notesVisiteur,
    this.createdAt,
  });

  factory Visite.fromJson(Map<String, dynamic> json) => Visite(
        visiteUuid: json['visiteUuid'] as String,
        dateVisite: json['dateVisite'] as String,
        heureVisite: json['heureVisite'] as String?,
        statut: json['statut'] as String,
        notesVisiteur: json['notesVisiteur'] as String?,
        createdAt: json['createdAt'] as String?,
      );
}

/// Demande de contact créée — modèle de RÉPONSE après POST.
///
/// Modélise le payload backend `{"contact": {...}}` retourné par
/// `POST /immo/proprietes/{uuid}/contact` (201 Created).
///
/// Volontairement minimal en 15.2d-1 : on n'affiche pas l'historique
/// des contacts envoyés (Phase ultérieure). Le strict nécessaire pour
/// confirmer côté UI qu'un POST a abouti.
///
/// Champs backend ignorés (à ajouter si UI requise) :
/// contactId, proprieteId, demandeurUserId, nomDemandeur,
/// telephoneDemandeur, emailDemandeur (snapshots), statut, vuParVendeur.
class Contact {
  final String contactUuid;
  final String message;
  final String typeDemande;
  final String? createdAt;

  const Contact({
    required this.contactUuid,
    required this.message,
    required this.typeDemande,
    this.createdAt,
  });

  factory Contact.fromJson(Map<String, dynamic> json) => Contact(
        contactUuid: json['contactUuid'] as String,
        message: json['message'] as String? ?? '',
        typeDemande: json['typeDemande'] as String,
        createdAt: json['createdAt'] as String?,
      );
}

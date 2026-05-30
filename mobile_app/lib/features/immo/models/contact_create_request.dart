/// DTO de requête pour `POST /immo/proprietes/{uuid}/contact`.
///
/// Conforme à `ContactCreateRequest.java` côté backend :
/// - `message` : non-blank, ≤2000 chars
/// - `typeDemande` : INFO | VISITE | OFFRE (défaut INFO)
///
/// PAS de champs nom/téléphone/email — déduits du JWT côté backend pour
/// éviter le spoofing (cf. ContactCreateRequest doc Java).
class ContactCreateRequest {
  final String message;
  final String typeDemande;

  const ContactCreateRequest({
    required this.message,
    this.typeDemande = 'INFO',
  });

  Map<String, dynamic> toJson() => {
        'message': message,
        'typeDemande': typeDemande,
      };
}

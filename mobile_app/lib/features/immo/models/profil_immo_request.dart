/// DTO de requête pour `POST /immo/profils` et `PUT /immo/profils/{uuid}`.
///
/// Conforme à `ProfilImmoRequest.java` côté backend :
/// - typeProfil : PROPRIETAIRE_SIMPLE | DEMARCHEUR | AGENT_AGENCE (NotBlank)
/// - agenceUuid : requis SI typeProfil=AGENT_AGENCE (non utilisé en 15.2e-1,
///   AGENT_AGENCE hors scope MVP)
/// - bio : ≤2000 chars
/// - telephoneContact : ≤20 chars
class ProfilImmoRequest {
  final String typeProfil;
  final String? agenceUuid;
  final String? bio;
  final String? telephoneContact;

  const ProfilImmoRequest({
    required this.typeProfil,
    this.agenceUuid,
    this.bio,
    this.telephoneContact,
  });

  Map<String, dynamic> toJson() => {
        'typeProfil': typeProfil,
        if (agenceUuid != null) 'agenceUuid': agenceUuid,
        if (bio != null && bio!.isNotEmpty) 'bio': bio,
        if (telephoneContact != null && telephoneContact!.isNotEmpty)
          'telephoneContact': telephoneContact,
      };
}

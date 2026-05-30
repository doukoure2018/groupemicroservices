/// Profil immobilier de l'utilisateur (vendeur/propriétaire). Renvoyé par
/// `GET /immo/profils/me` après création via `POST /immo/profils`.
///
/// 3 types de profil supportés backend :
///   - PROPRIETAIRE_SIMPLE : particulier qui vend/loue son bien
///   - DEMARCHEUR : intermédiaire indépendant
///   - AGENT_AGENCE : rattaché à une agence (agenceUuid requis)
///
/// `statutVerification` : EN_ATTENTE (défaut à la création) → VERIFIE / REJETE
/// après modération admin. Pas bloquant pour publier des annonces (à vérifier
/// en 15.2e-4 si besoin), juste affiché comme badge "Vérifié" côté fiche.
///
/// Champs backend ignorés en 15.2e-1 (à ajouter si UI requise) :
/// profilId, agenceId (Long), documentsKycUrl, noteMoyenne, nombreAvis,
/// nombreProprietesActives, actif, updatedAt.
class ProfilImmo {
  final String profilUuid;
  final int userId;
  final String typeProfil;
  final String statutVerification;
  final String? bio;
  final String? telephoneContact;
  final String? createdAt;

  const ProfilImmo({
    required this.profilUuid,
    required this.userId,
    required this.typeProfil,
    required this.statutVerification,
    this.bio,
    this.telephoneContact,
    this.createdAt,
  });

  factory ProfilImmo.fromJson(Map<String, dynamic> json) => ProfilImmo(
        profilUuid: json['profilUuid'] as String,
        userId: json['userId'] as int,
        typeProfil: json['typeProfil'] as String,
        statutVerification: json['statutVerification'] as String,
        bio: json['bio'] as String?,
        telephoneContact: json['telephoneContact'] as String?,
        createdAt: json['createdAt'] as String?,
      );
}

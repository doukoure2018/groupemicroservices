/// Profil utilisateur complet (userservice `GET /user/profile` → data.user).
///
/// Sous-ensemble utile au gate de complétion post-login (tél + adresse) et
/// aux champs préservés lors du `PATCH /user/update`. Les noms JSON sont en
/// camelCase (sérialisation Jackson du model User) ; fallback snake_case par
/// sécurité.
class UserProfile {
  final String? userUuid;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? phone;
  final String? address;

  const UserProfile({
    this.userUuid,
    this.firstName,
    this.lastName,
    this.email,
    this.phone,
    this.address,
  });

  /// Profil "complet" pour accéder à l'app : téléphone ET adresse renseignés.
  bool get isComplete =>
      (phone?.trim().isNotEmpty ?? false) &&
      (address?.trim().isNotEmpty ?? false);

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        userUuid: json['userUuid'] as String? ?? json['user_uuid'] as String?,
        firstName:
            json['firstName'] as String? ?? json['first_name'] as String?,
        lastName: json['lastName'] as String? ?? json['last_name'] as String?,
        email: json['email'] as String?,
        phone: json['phone'] as String?,
        address: json['address'] as String?,
      );
}

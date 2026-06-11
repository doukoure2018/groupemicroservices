import '../models/user_profile.dart';
import '../shared/http/api_client.dart';

/// Accès au profil utilisateur (userservice via gateway). JWT posé par
/// l'intercepteur d'[ApiClient].
class UserService {
  final ApiClient _api;
  UserService({ApiClient? api}) : _api = api ?? ApiClient();

  /// `GET /user/profile` → profil de l'utilisateur authentifié (avec
  /// téléphone + adresse, utilisés par le gate de complétion).
  Future<UserProfile> getProfile() async {
    final res = await _api.get('/user/profile');
    final data = res.data['data'] as Map<String, dynamic>;
    return UserProfile.fromJson(data['user'] as Map<String, dynamic>);
  }

  /// `PATCH /user/update`. On renvoie firstName/lastName/email existants en
  /// plus de phone+address : le backend fait du COALESCE, mais rester
  /// explicite évite toute perte si la sémantique change.
  Future<UserProfile> updateContact({
    required UserProfile current,
    required String phone,
    required String address,
  }) async {
    final res = await _api.patch('/user/update', data: {
      'firstName': current.firstName,
      'lastName': current.lastName,
      'email': current.email,
      'phone': phone,
      'address': address,
    });
    final data = res.data['data'] as Map<String, dynamic>;
    return UserProfile.fromJson(data['user'] as Map<String, dynamic>);
  }
}

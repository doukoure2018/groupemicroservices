import '../../../shared/http/api_client.dart';
import '../../../shared/http/api_exception.dart';
import '../models/profil_immo.dart';
import '../models/profil_immo_request.dart';

/// Service HTTP pour le profil immobilier vendeur.
///
/// JWT obligatoire — l'auth est posée par l'intercepteur [ApiClient].
class ProfilImmoService {
  final ApiClient _api;

  ProfilImmoService({ApiClient? api}) : _api = api ?? ApiClient();

  /// `POST /immo/profils` — crée un profil pour l'utilisateur courant.
  /// Le backend déduit le userId du JWT.
  Future<ProfilImmo> creer(ProfilImmoRequest request) async {
    final response = await _api.post('/immo/profils', data: request.toJson());
    final data = response.data['data'] as Map<String, dynamic>;
    return ProfilImmo.fromJson(data['profil'] as Map<String, dynamic>);
  }

  /// `GET /immo/profils/me` — récupère le profil de l'utilisateur courant.
  ///
  /// Retourne `null` si l'utilisateur n'a pas (encore) de profil — équivalent
  /// d'un 404 backend. Le caller utilise ce null pour décider de proposer la
  /// création (étape 1 du wizard 15.2e-2).
  ///
  /// Toute autre erreur (réseau, 5xx) remonte en [AppException].
  Future<ProfilImmo?> getMien() async {
    try {
      final response = await _api.get('/immo/profils/me');
      final data = response.data['data'] as Map<String, dynamic>;
      return ProfilImmo.fromJson(data['profil'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }
}

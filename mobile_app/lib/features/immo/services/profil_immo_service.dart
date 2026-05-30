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
  /// Retourne `null` si l'utilisateur n'a pas (encore) de profil. Le caller
  /// (StepProfil) utilise ce null pour déclencher la création silencieuse.
  ///
  /// Détection "pas de profil" :
  ///   - 404 (cas conforme REST)
  ///   - 400 + message contenant "aucun profil" (dette backend : l'endpoint
  ///     lève une ApiException métier mappée à BAD_REQUEST par le
  ///     GlobalExceptionHandler immobilierservice — devrait être 404).
  ///
  /// Toute autre erreur (réseau, 5xx, 400 sur autre cause) remonte en
  /// [AppException].
  Future<ProfilImmo?> getMien() async {
    try {
      final response = await _api.get('/immo/profils/me');
      final data = response.data['data'] as Map<String, dynamic>;
      return ProfilImmo.fromJson(data['profil'] as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      if (e.statusCode == 400 && e.message.toLowerCase().contains('aucun profil')) {
        return null;
      }
      rethrow;
    }
  }
}

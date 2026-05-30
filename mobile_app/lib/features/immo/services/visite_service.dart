import '../../../shared/http/api_client.dart';
import '../models/visite.dart';
import '../models/visite_create_request.dart';

/// Service HTTP pour les demandes de visite. Tape `POST /immo/proprietes/{uuid}/visites`
/// via [ApiClient] (qui gère le refresh token).
///
/// JWT obligatoire. Le backend valide :
/// - dateVisite ≥ aujourd'hui (FutureOrPresent) → 400 sinon
/// - unicité (DEMANDEE/CONFIRMEE) sur (propriete, visiteur) → 409 si doublon
class VisiteService {
  final ApiClient _api;

  VisiteService({ApiClient? api}) : _api = api ?? ApiClient();

  /// Demande une visite sur la propriété [proprieteUuid].
  ///
  /// Throw [AppException] sur erreur réseau ou serveur. 201 attendu en cas de succès.
  Future<Visite> demander(String proprieteUuid, VisiteCreateRequest request) async {
    final response = await _api.post(
      '/immo/proprietes/$proprieteUuid/visites',
      data: request.toJson(),
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return Visite.fromJson(data['visite'] as Map<String, dynamic>);
  }
}

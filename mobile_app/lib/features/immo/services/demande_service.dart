import '../../../shared/http/api_client.dart';
import '../models/demande_besoin.dart';
import '../models/geo_referentiel.dart';

/// Déclarations de besoin (V32) : création, suivi et annulation côté client,
/// plus le référentiel géographique (communes/quartiers via billetterie).
class DemandeService {
  final ApiClient _api;

  DemandeService({ApiClient? api}) : _api = api ?? ApiClient();

  /// POST /immo/demandes — la demande est diffusée par email aux agences
  /// vérifiées de la zone (commune → région → toutes).
  Future<DemandeBesoin> creer(DemandeCreateRequest request) async {
    final response = await _api.post('/immo/demandes', data: request.toJson());
    final data = response.data['data'] as Map<String, dynamic>;
    return DemandeBesoin.fromJson(data['demande'] as Map<String, dynamic>);
  }

  /// GET /immo/demandes/mes-demandes
  Future<List<DemandeBesoin>> mesDemandes() async {
    final response = await _api.get('/immo/demandes/mes-demandes');
    final data = response.data['data'] as Map<String, dynamic>;
    return (data['demandes'] as List<dynamic>)
        .map((e) => DemandeBesoin.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// PATCH /immo/demandes/{uuid}/annuler
  Future<DemandeBesoin> annuler(String demandeUuid) async {
    final response = await _api.patch('/immo/demandes/$demandeUuid/annuler');
    final data = response.data['data'] as Map<String, dynamic>;
    return DemandeBesoin.fromJson(data['demande'] as Map<String, dynamic>);
  }

  // ---------- Référentiel géographique (service billetterie) ----------

  /// GET /billetterie/communes/active — ids compatibles avec la demande immo.
  Future<List<CommuneRef>> communesActives() async {
    final response = await _api.get('/billetterie/communes/active');
    final data = response.data['data'] as Map<String, dynamic>;
    return (data['communes'] as List<dynamic>)
        .map((e) => CommuneRef.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /billetterie/quartiers/commune/{communeUuid}/active
  Future<List<QuartierRef>> quartiersDeCommune(String communeUuid) async {
    final response = await _api.get('/billetterie/quartiers/commune/$communeUuid/active');
    final data = response.data['data'] as Map<String, dynamic>;
    return (data['quartiers'] as List<dynamic>)
        .map((e) => QuartierRef.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

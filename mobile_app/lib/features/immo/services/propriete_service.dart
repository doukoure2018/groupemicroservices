import '../../../shared/http/api_client.dart';
import '../../../shared/models/paged_result.dart';
import '../models/propriete.dart';
import '../models/type_bien.dart';

/// Service HTTP pour les annonces immobilières. Tape les endpoints derrière
/// le gateway (`/immo/...`) via [ApiClient] (qui gère le refresh token).
///
/// Toutes les méthodes throw [AppException] sur erreur réseau ou serveur —
/// le caller (écran 15.2c+) capture et affiche via shared/widgets/AppError.
class ProprieteService {
  final ApiClient _api;

  ProprieteService({ApiClient? api}) : _api = api ?? ApiClient();

  /// `GET /immo/proprietes/recherche` — search paginée.
  ///
  /// En 15.2b, expose seulement `limit`, `offset`, `q`. Les filtres
  /// (typeAnnonce, prix, chambres, géoloc, etc.) seront ajoutés en 15.2c
  /// quand l'UI les exposera.
  Future<PagedResult<Propriete>> rechercher({
    int limit = 20,
    int offset = 0,
    String? q,
  }) async {
    final response = await _api.get(
      '/immo/proprietes/recherche',
      queryParameters: {
        'limit': limit,
        'offset': offset,
        if (q != null && q.isNotEmpty) 'q': q,
      },
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return PagedResult.fromJson(data, 'proprietes', Propriete.fromJson);
  }

  /// `GET /immo/proprietes/{uuid}` — fiche détail (photos populées).
  Future<Propriete> findByUuid(String proprieteUuid) async {
    final response = await _api.get('/immo/proprietes/$proprieteUuid');
    final data = response.data['data'] as Map<String, dynamic>;
    return Propriete.fromJson(data['propriete'] as Map<String, dynamic>);
  }

  /// `GET /immo/types-bien` — référentiel des types (MAISON, APPARTEMENT, ...).
  /// Données stables — un cache mémoire au niveau de l'écran suffira en 15.2c.
  Future<List<TypeBien>> listTypesBien() async {
    final response = await _api.get('/immo/types-bien');
    final data = response.data['data'] as Map<String, dynamic>;
    return (data['types'] as List<dynamic>)
        .map((e) => TypeBien.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

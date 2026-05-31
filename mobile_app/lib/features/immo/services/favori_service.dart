import '../../../shared/http/api_client.dart';
import '../../../shared/models/paged_result.dart';
import '../models/propriete.dart';

/// Service HTTP pour les favoris (Phase 10a backend).
///
/// JWT obligatoire — l'auth est posée par l'intercepteur [ApiClient]. Sans
/// token, le backend renvoie 401 → AuthException remontée au caller. L'app
/// mobile actuelle exige le login pour accéder à HubScreen, donc le cas
/// anonyme n'est jamais atteint en pratique.
class FavoriService {
  final ApiClient _api;

  FavoriService({ApiClient? api}) : _api = api ?? ApiClient();

  /// `POST /immo/favoris/{uuid}` — idempotent.
  /// Retourne `true` si le favori a été créé maintenant, `false` s'il existait
  /// déjà. Utile pour distinguer "ajouté" de "déjà présent" côté UI.
  Future<bool> ajouter(String proprieteUuid) async {
    final response = await _api.post('/immo/favoris/$proprieteUuid');
    final data = response.data['data'] as Map<String, dynamic>;
    return data['ajouteCetteFois'] as bool? ?? false;
  }

  /// `DELETE /immo/favoris/{uuid}` — idempotent.
  /// Retourne `true` si retiré maintenant, `false` s'il n'existait pas.
  Future<bool> retirer(String proprieteUuid) async {
    final response = await _api.delete('/immo/favoris/$proprieteUuid');
    final data = response.data['data'] as Map<String, dynamic>;
    return data['retire'] as bool? ?? false;
  }

  /// `GET /immo/favoris/check?proprieteUuid=X` — état actuel.
  /// Utilisé sur la fiche détail pour avoir l'état frais (le GET
  /// /immo/proprietes/{uuid} ne fait PAS le JOIN favoris, contrairement à la
  /// recherche). Appelé en parallèle de findByUuid au load fiche.
  Future<bool> check(String proprieteUuid) async {
    final response = await _api.get(
      '/immo/favoris/check',
      queryParameters: {'proprieteUuid': proprieteUuid},
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return data['isFavorite'] as bool? ?? false;
  }

  /// `GET /immo/favoris/mes-favoris?limit&offset` — liste paginée. Chaque
  /// `Propriete` retournée a `isFavorite=true` forcé par le backend.
  Future<PagedResult<Propriete>> mesFavoris({int limit = 20, int offset = 0}) async {
    final response = await _api.get(
      '/immo/favoris/mes-favoris',
      queryParameters: {'limit': limit, 'offset': offset},
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return PagedResult.fromJson(data, 'proprietes', Propriete.fromJson);
  }
}

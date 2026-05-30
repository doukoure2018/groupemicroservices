import '../../../shared/http/api_client.dart';
import '../../../shared/models/paged_result.dart';
import '../models/commodite.dart';
import '../models/propriete.dart';
import '../models/recherche_filtres.dart';
import '../models/type_bien.dart';

/// Service HTTP pour les annonces immobilières. Tape les endpoints derrière
/// le gateway (`/immo/...`) via [ApiClient] (qui gère le refresh token).
///
/// Toutes les méthodes throw [AppException] sur erreur réseau ou serveur —
/// le caller (écran 15.2c+) capture et affiche via shared/widgets/AppError.
class ProprieteService {
  final ApiClient _api;

  ProprieteService({ApiClient? api}) : _api = api ?? ApiClient();

  /// `GET /immo/proprietes/recherche` — search paginée + filtrée.
  ///
  /// Les 5 filtres user-facing de 15.2c sont portés par [RechercheFiltres].
  /// Les autres params backend (devise, surfaceMin, commodites, géoloc, etc.)
  /// seront ajoutés dans des phases ultérieures avec leur UI dédiée.
  Future<PagedResult<Propriete>> rechercher({
    int limit = 20,
    int offset = 0,
    RechercheFiltres? filtres,
  }) async {
    final f = filtres ?? const RechercheFiltres();
    final response = await _api.get(
      '/immo/proprietes/recherche',
      queryParameters: {
        'limit': limit,
        'offset': offset,
        if (f.typeAnnonce != null) 'typeAnnonce': f.typeAnnonce,
        if (f.typeBienCodes.isNotEmpty) 'typeBienCodes': f.typeBienCodes,
        if (f.prixMin != null) 'prixMin': f.prixMin,
        if (f.prixMax != null) 'prixMax': f.prixMax,
        if (f.chambresMin != null) 'chambresMin': f.chambresMin,
        if (f.q != null && f.q!.trim().isNotEmpty) 'q': f.q!.trim(),
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

  /// `GET /immo/commodites` — référentiel des commodités actives groupables
  /// par catégorie (CONFORT / SECURITE / EXTERIEUR). Utilisé par le wizard
  /// 15.2e-2 pour la sélection multi-chip.
  Future<List<Commodite>> listCommodites() async {
    final response = await _api.get('/immo/commodites');
    final data = response.data['data'] as Map<String, dynamic>;
    return (data['commodites'] as List<dynamic>)
        .map((e) => Commodite.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

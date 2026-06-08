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
        // Géoloc-2B : les 3 ensemble (geoActive) activent ST_DWithin +
        // tri DISTANCE_ASC auto côté backend.
        if (f.lat != null) 'lat': f.lat,
        if (f.lng != null) 'lng': f.lng,
        if (f.rayonKm != null) 'rayonKm': f.rayonKm,
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

  /// `GET /immo/proprietes/mes-proprietes` — liste TOUTES les propriétés du
  /// user (tous statuts confondus). Le filtrage par statut est fait côté
  /// mobile sur l'écran Mes annonces.
  Future<List<Propriete>> mesProprietes({int limit = 50, int offset = 0}) async {
    final response = await _api.get(
      '/immo/proprietes/mes-proprietes',
      queryParameters: {'limit': limit, 'offset': offset},
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return (data['proprietes'] as List<dynamic>)
        .map((e) => Propriete.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// `PUT /immo/proprietes/{uuid}` puis `POST /immo/proprietes/{uuid}/publier`
  /// — utilisé pour la re-soumission d'une annonce rejetée (RETIRE → EN_ATTENTE
  /// ou PUBLIE selon modération hybride).
  ///
  /// ⚠️ Non-atomique : si PUT réussit mais POST publier échoue (réseau coupé
  /// entre les 2), l'annonce reste éditée en RETIRE. L'user peut retry. Cf
  /// dette mobile-rejet-republier-2-step-not-atomic — fix futur backend =
  /// endpoint unique POST /proprietes/{uuid}/edit-et-publier transactionnel.
  Future<Propriete> updateAndPublier(
    String proprieteUuid,
    Map<String, dynamic> updatePayload,
  ) async {
    await _api.put('/immo/proprietes/$proprieteUuid', data: updatePayload);
    // PATCH (pas POST) — cf ProprieteResource @PatchMapping("/{uuid}/publier").
    final response = await _api.patch('/immo/proprietes/$proprieteUuid/publier');
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

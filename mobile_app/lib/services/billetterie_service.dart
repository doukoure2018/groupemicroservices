import '../models/avis.dart';
import '../models/commande.dart';
import '../models/offre.dart';
import 'api_service.dart';

class BilletterieService {
  final ApiService _api = ApiService();

  static const String _basePath = '/billetterie';

  /// GET /billetterie/sites/actifs
  Future<List<Map<String, dynamic>>> getActiveSites() async {
    final response = await _api.get('$_basePath/sites/actifs');
    final data = response.data['data'];
    final sites = data['sites'] as List;
    return sites.cast<Map<String, dynamic>>();
  }

  /// GET /billetterie/villes/active
  Future<List<Map<String, dynamic>>> getActiveVilles() async {
    final response = await _api.get('$_basePath/villes/active');
    final data = response.data['data'];
    final villes = data['villes'] as List;
    return villes.cast<Map<String, dynamic>>();
  }

  /// GET /billetterie/offres/recherche
  Future<List<Offre>> searchOffres({
    required String villeDepartUuid,
    required String villeArriveeUuid,
    String? dateDepart,
    int passagers = 1,
  }) async {
    final params = <String, dynamic>{
      'villeDepartUuid': villeDepartUuid,
      'villeArriveeUuid': villeArriveeUuid,
    };
    if (dateDepart != null) params['dateDepart'] = dateDepart;

    final response = await _api.get(
      '$_basePath/offres/recherche',
      queryParameters: params,
    );

    final data = response.data['data'];
    final offres = (data['offres'] as List)
        .map((json) => Offre.fromJson(json as Map<String, dynamic>))
        .toList();

    // Filter by available seats client-side
    if (passagers > 1) {
      return offres
          .where((o) => o.nombrePlacesDisponibles >= passagers)
          .toList();
    }
    return offres;
  }

  /// GET /billetterie/offres/{offreUuid}/avis
  Future<List<Avis>> getAvisByOffre(String offreUuid) async {
    final response = await _api.get('$_basePath/offres/$offreUuid/avis');
    final data = response.data['data'];
    final avisList = (data['avis'] as List)
        .map((json) => Avis.fromJson(json as Map<String, dynamic>))
        .toList();
    return avisList;
  }

  /// GET /billetterie/commandes/{uuid} - Récupérer une commande avec billets
  Future<Map<String, dynamic>> getCommandeByUuid(String commandeUuid) async {
    final response = await _api.get('$_basePath/commandes/$commandeUuid');
    final data = response.data['data'];
    return data['commande'] as Map<String, dynamic>;
  }

  /// GET /billetterie/commandes/mes-commandes - Mes commandes avec billets
  Future<List<Commande>> getMesCommandes() async {
    final response = await _api.get('$_basePath/commandes/mes-commandes');
    final data = response.data['data'];
    return (data['commandes'] as List)
        .map((json) => Commande.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// PUT /billetterie/commandes/{uuid}/annuler - Annuler une commande
  Future<void> annulerCommande(String commandeUuid) async {
    await _api.put('$_basePath/commandes/$commandeUuid/annuler');
  }

  /// POST /billetterie/commandes - Créer commande + billets + paiement
  Future<Map<String, dynamic>> createCommande({
    required String offreUuid,
    required List<Map<String, String>> passagers,
    required String modeReglementCode,
    required int montantTotal,
  }) async {
    final response = await _api.post(
      '$_basePath/commandes',
      data: {
        'offreUuid': offreUuid,
        'passagers': passagers,
        'modeReglementCode': modeReglementCode,
        'montantTotal': montantTotal,
      },
    );
    final data = response.data['data'];
    return data['commande'] as Map<String, dynamic>;
  }
}

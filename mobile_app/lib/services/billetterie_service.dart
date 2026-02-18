import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../models/offre.dart';

class BilletterieService {
  late final Dio _dio;

  static const String _basePath = '/billetterie';

  BilletterieService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
  }

  /// GET /billetterie/sites/actifs — public endpoint
  Future<List<Map<String, dynamic>>> getActiveSites() async {
    final response = await _dio.get('$_basePath/sites/actifs');
    final data = response.data['data'];
    final sites = data['sites'] as List;
    return sites.cast<Map<String, dynamic>>();
  }

  /// GET /billetterie/villes/active — public endpoint
  Future<List<Map<String, dynamic>>> getActiveVilles() async {
    final response = await _dio.get('$_basePath/villes/active');
    final data = response.data['data'];
    final villes = data['villes'] as List;
    return villes.cast<Map<String, dynamic>>();
  }

  /// GET /billetterie/offres/recherche — public endpoint
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

    final response = await _dio.get(
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
}

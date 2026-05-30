import '../../../shared/http/api_client.dart';
import '../models/propriete.dart';

/// Service HTTP pour les transitions de statut + gestion ordre/couverture
/// post-création d'une propriété (étape finale du wizard 15.2e-4).
///
/// JWT obligatoire ; backend vérifie owner sur chaque endpoint.
class ProprietePublicationService {
  final ApiClient _api;

  ProprietePublicationService({ApiClient? api}) : _api = api ?? ApiClient();

  /// `PATCH /immo/proprietes/{uuid}/publier` — bascule BROUILLON → EN_ATTENTE
  /// (modération admin requise avant PUBLIE et visible en search).
  Future<Propriete> publier(String proprieteUuid) async {
    final response = await _api.patch('/immo/proprietes/$proprieteUuid/publier');
    final data = response.data['data'] as Map<String, dynamic>;
    return Propriete.fromJson(data['propriete'] as Map<String, dynamic>);
  }

  /// `PATCH /immo/photos/{photoUuid}/couverture` — désigne LA photo couverture
  /// (les autres deviennent automatiquement non-couverture côté backend, via
  /// l'index unique `WHERE est_couverture = true`).
  Future<void> definirCouverture(String photoUuid) async {
    await _api.patch('/immo/photos/$photoUuid/couverture');
  }

  /// `PATCH /immo/proprietes/{uuid}/photos/ordre` — réordonne les photos.
  /// [photoUuidsEnOrdre] est la liste dans l'ordre voulu (index 0 = première).
  Future<void> reordonner(String proprieteUuid, List<String> photoUuidsEnOrdre) async {
    await _api.patch(
      '/immo/proprietes/$proprieteUuid/photos/ordre',
      data: {'photoUuidsEnOrdre': photoUuidsEnOrdre},
    );
  }
}

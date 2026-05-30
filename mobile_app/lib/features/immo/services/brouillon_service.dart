import '../../../shared/http/api_client.dart';
import '../models/brouillon.dart';
import '../models/brouillon_save_request.dart';
import '../models/propriete.dart';

/// Service HTTP pour les brouillons de propriété (wizard publication).
///
/// JWT obligatoire — les brouillons sont scoped au userId du JWT (le backend
/// filtre `WHERE user_id = currentUser`).
class BrouillonService {
  final ApiClient _api;

  BrouillonService({ApiClient? api}) : _api = api ?? ApiClient();

  /// `POST /immo/brouillons` — crée un nouveau brouillon vide.
  Future<Brouillon> creer(BrouillonSaveRequest request) async {
    final response = await _api.post('/immo/brouillons', data: request.toJson());
    final data = response.data['data'] as Map<String, dynamic>;
    return Brouillon.fromJson(data['brouillon'] as Map<String, dynamic>);
  }

  /// `PUT /immo/brouillons/{uuid}` — met à jour etapeActuelle + donneesJson.
  Future<Brouillon> maj(String brouillonUuid, BrouillonSaveRequest request) async {
    final response = await _api.put(
      '/immo/brouillons/$brouillonUuid',
      data: request.toJson(),
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return Brouillon.fromJson(data['brouillon'] as Map<String, dynamic>);
  }

  /// `GET /immo/brouillons` — liste les brouillons de l'utilisateur courant.
  ///
  /// Au lancement du wizard, le frontend regarde cette liste pour proposer
  /// "Reprendre votre brouillon" ou "Nouveau".
  Future<List<Brouillon>> mes() async {
    final response = await _api.get('/immo/brouillons');
    final data = response.data['data'] as Map<String, dynamic>;
    return (data['brouillons'] as List<dynamic>)
        .map((e) => Brouillon.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// `GET /immo/brouillons/{uuid}` — récupère un brouillon spécifique.
  Future<Brouillon> getByUuid(String brouillonUuid) async {
    final response = await _api.get('/immo/brouillons/$brouillonUuid');
    final data = response.data['data'] as Map<String, dynamic>;
    return Brouillon.fromJson(data['brouillon'] as Map<String, dynamic>);
  }

  /// `DELETE /immo/brouillons/{uuid}` — supprime un brouillon abandonné.
  Future<void> supprimer(String brouillonUuid) async {
    await _api.delete('/immo/brouillons/$brouillonUuid');
  }

  /// `POST /immo/brouillons/{uuid}/materialiser` — convertit le brouillon en
  /// `Propriete` (statut=BROUILLON côté backend). Le caller doit ensuite
  /// uploader les photos et appeler `publier()` pour finaliser.
  Future<Propriete> materialiser(String brouillonUuid) async {
    final response = await _api.post('/immo/brouillons/$brouillonUuid/materialiser');
    final data = response.data['data'] as Map<String, dynamic>;
    return Propriete.fromJson(data['propriete'] as Map<String, dynamic>);
  }
}

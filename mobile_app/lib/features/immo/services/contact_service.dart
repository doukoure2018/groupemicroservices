import '../../../shared/http/api_client.dart';
import '../models/contact.dart';
import '../models/contact_create_request.dart';

/// Service HTTP pour les demandes de contact. Tape `POST /immo/proprietes/{uuid}/contact`
/// via [ApiClient] (qui gère le refresh token).
///
/// JWT obligatoire — l'auth est posée par l'intercepteur ApiClient. Sans token,
/// le backend renvoie 401 → AuthException remontée au caller.
class ContactService {
  final ApiClient _api;

  ContactService({ApiClient? api}) : _api = api ?? ApiClient();

  /// Crée une demande de contact sur la propriété [proprieteUuid].
  ///
  /// Throw [AppException] sur erreur réseau ou serveur. 201 attendu en cas de succès.
  Future<Contact> creer(String proprieteUuid, ContactCreateRequest request) async {
    final response = await _api.post(
      '/immo/proprietes/$proprieteUuid/contact',
      data: request.toJson(),
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return Contact.fromJson(data['contact'] as Map<String, dynamic>);
  }
}

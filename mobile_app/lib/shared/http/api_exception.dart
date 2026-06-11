/// Erreurs typées pour les appels API (lib/shared/http/api_client.dart).
///
/// Tous les services métier de YIGUI doivent capturer [AppException] et
/// présenter [AppException.message] tel quel à l'utilisateur (déjà localisé FR).
sealed class AppException implements Exception {
  final String message;
  final int? statusCode;
  const AppException(this.message, {this.statusCode});

  @override
  String toString() => 'AppException($statusCode): $message';
}

/// Pas de réseau / DNS échoue / timeout TCP. Réessayable.
class NetworkException extends AppException {
  const NetworkException(super.message);
}

/// Backend a renvoyé 5xx. Réessayable, mais souvent côté serveur.
class ServerException extends AppException {
  const ServerException(super.message, {required super.statusCode});
}

/// Backend a renvoyé une erreur métier (4xx hors auth). Message à afficher.
class ApiException extends AppException {
  final String? developerMessage;

  /// Code d'erreur structuré renvoyé par le backend (ex "NO_IMMO_PROFILE").
  /// Permet un match fiable côté caller au lieu de parser le message FR.
  /// Null si le backend n'a pas fourni de code.
  final String? code;

  const ApiException(
    super.message, {
    required super.statusCode,
    this.developerMessage,
    this.code,
  });
}

/// 401 / 403. Le caller doit déclencher un refresh ou rediriger vers login.
/// L'interceptor d'[ApiClient] tente d'abord un refresh automatique ; cette
/// exception remonte uniquement si le refresh a échoué.
class AuthException extends AppException {
  const AuthException(super.message, {super.statusCode = 401});
}

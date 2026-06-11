import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../config/app_config.dart';
import '../../services/auth_service.dart';
import 'api_exception.dart';

/// Client HTTP partagé pour les futures features YIGUI (immo, hub, etc.).
///
/// Coexiste avec [ApiService] (lib/services/api_service.dart) qui reste utilisé
/// par billetterie. Les deux pointent sur la même base URL et s'appuient sur
/// la MÊME instance d'[AuthService] : refresh token partagé entre les deux
/// clients, l'utilisateur ne se voit jamais déconnecté à mi-écran.
///
/// Convertit toutes les [DioException] en [AppException] typées.
class ApiClient {
  final Dio _dio;
  final AuthService _authService;

  /// Callback déclenché si refresh échoue (session vraiment morte).
  /// Le caller (main.dart en 15.2) connecte ça à AuthProvider.logout().
  static VoidCallback? onSessionExpired;

  ApiClient({AuthService? authService})
      : _authService = authService ?? AuthService(),
        _dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          // 15s : tolère retransmission TCP 3G Conakry (ping 200-400ms + jitter)
          // sans hang trop long si serveur down. 30s historique = trop long UX.
          connectTimeout: const Duration(seconds: 15),
          // 60s : upload multipart 1-3MB sur 3G à 50-100 KB/s = ~10-30s normal,
          // ×2 marge pour pics d'instabilité. Sans ce timeout (default = infini)
          // Dio hang sans erreur si la connexion drop pendant un upload photo.
          // Cf dette dio-multipart-no-receive-timeout-debt (fermée par ce commit).
          sendTimeout: const Duration(seconds: 60),
          receiveTimeout: const Duration(seconds: 30),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _authService.getValidAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          try {
            final newTokens = await _authService.refreshToken();
            if (newTokens != null) {
              final options = error.requestOptions;
              options.headers['Authorization'] = 'Bearer ${newTokens.accessToken}';
              final response = await _dio.fetch(options);
              return handler.resolve(response);
            }
          } catch (_) {
            // tombe dans onSessionExpired plus bas
          }
          onSessionExpired?.call();
        }
        return handler.next(error);
      },
    ));
  }

  /// Expose Dio pour les usages avancés (upload multipart, streaming, etc.).
  /// Les méthodes [get]/[post]/etc. suffisent pour les CRUD classiques.
  Dio get dio => _dio;

  Future<Response<dynamic>> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Response<dynamic>> post(String path, {Object? data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.post(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Response<dynamic>> put(String path, {Object? data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.put(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Response<dynamic>> patch(String path, {Object? data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.patch(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Response<dynamic>> delete(String path, {Object? data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.delete(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  AppException _mapError(DioException e) {
    final code = e.response?.statusCode;
    final backendMessage = _extractBackendMessage(e.response?.data);

    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.connectionError) {
      return NetworkException(backendMessage ?? 'Connexion impossible. Vérifiez votre réseau.');
    }

    if (code == 401 || code == 403) {
      return AuthException(backendMessage ?? 'Session expirée, veuillez vous reconnecter.', statusCode: code!);
    }

    if (code != null && code >= 500) {
      return ServerException(
        backendMessage ?? 'Erreur serveur, réessayez plus tard.',
        statusCode: code,
      );
    }

    return ApiException(
      backendMessage ?? 'Une erreur est survenue.',
      statusCode: code ?? 0,
      developerMessage: e.message,
      code: _extractBackendCode(e.response?.data),
    );
  }

  String? _extractBackendMessage(dynamic body) {
    if (body is Map<String, dynamic>) {
      final m = body['message'];
      if (m is String && m.isNotEmpty) return m;
      final err = body['error'];
      if (err is String && err.isNotEmpty) return err;
    }
    return null;
  }

  /// Code d'erreur structuré backend (`body['code']`, ex "NO_IMMO_PROFILE").
  String? _extractBackendCode(dynamic body) {
    if (body is Map<String, dynamic>) {
      final c = body['code'];
      if (c is String && c.isNotEmpty) return c;
    }
    return null;
  }
}

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class ApiService {
  late final Dio _dio;
  final AuthService _authService = AuthService();

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptor for authentication
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _authService.getValidAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
            debugPrint('ApiService: Token sent for ${options.path} (${token.substring(0, 20)}...)');
          } else {
            debugPrint('ApiService: NO TOKEN for ${options.path}');
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          debugPrint('ApiService: ${error.response?.statusCode} on ${error.requestOptions.path}');
          if (error.response?.statusCode == 401) {
            debugPrint('ApiService: 401 - attempting token refresh...');
            try {
              final newTokens = await _authService.refreshToken();
              if (newTokens != null) {
                debugPrint('ApiService: Refresh OK, retrying request');
                final options = error.requestOptions;
                options.headers['Authorization'] =
                    'Bearer ${newTokens.accessToken}';
                final response = await _dio.fetch(options);
                return handler.resolve(response);
              } else {
                debugPrint('ApiService: Refresh returned null');
              }
            } catch (e) {
              debugPrint('ApiService: Refresh failed: $e');
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  // GET request
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return await _dio.get(path, queryParameters: queryParameters);
  }

  // POST request
  Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }

  // PUT request
  Future<Response> put(String path, {dynamic data}) async {
    return await _dio.put(path, data: data);
  }

  // DELETE request
  Future<Response> delete(String path) async {
    return await _dio.delete(path);
  }

  // PATCH request
  Future<Response> patch(String path, {dynamic data}) async {
    return await _dio.patch(path, data: data);
  }
}

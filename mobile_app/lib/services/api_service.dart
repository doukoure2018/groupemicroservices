import 'package:dio/dio.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class ApiService {
  late final Dio _dio;
  final AuthService _authService = AuthService();

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptor for authentication
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add access token to requests
        final token = await _authService.getValidAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.statusCode == 401) {
          try {
            final newTokens = await _authService.refreshToken();
            if (newTokens != null) {
              // Retry the request with new token
              final options = error.requestOptions;
              options.headers['Authorization'] = 'Bearer ${newTokens.accessToken}';
              final response = await _dio.fetch(options);
              return handler.resolve(response);
            }
          } catch (e) {
            // Refresh failed, logout will happen in auth service
          }
        }
        return handler.next(error);
      },
    ));
  }

  // GET request
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
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

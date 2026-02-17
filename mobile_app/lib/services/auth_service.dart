import 'dart:convert';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';
import '../config/app_config.dart';
import '../models/auth_tokens.dart';
import '../models/user.dart';

class AuthService {
  final FlutterAppAuth _appAuth = const FlutterAppAuth();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _idTokenKey = 'id_token';
  static const String _expirationKey = 'token_expiration';

  // ========== DIRECT LOGIN (email/password) ==========

  Future<AuthTokens?> loginWithCredentials(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse(AppConfig.loginUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode == 200 && body['status'] == 'success') {
        final tokens = AuthTokens(
          accessToken: body['access_token'],
          refreshToken: body['refresh_token'],
          idToken: body['id_token'],
          accessTokenExpirationDateTime:
              DateTime.now().add(Duration(seconds: body['expires_in'] ?? 3600)),
        );
        await _saveTokens(tokens);
        return tokens;
      } else {
        throw Exception(body['message'] ?? 'Échec de la connexion');
      }
    } catch (e) {
      if (e is Exception && e.toString().contains('Exception:')) {
        rethrow;
      }
      throw Exception('Erreur de connexion. Vérifiez votre connexion internet.');
    }
  }

  // ========== REGISTRATION ==========

  Future<String> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(AppConfig.registerUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'password': password,
          'confirmPassword': password,
          'phone': phone,
        }),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode == 201 && body['status'] == 'success') {
        return body['message'] ?? 'Compte créé avec succès';
      } else {
        throw Exception(body['message'] ?? "Échec de l'inscription");
      }
    } catch (e) {
      if (e is Exception && e.toString().contains('Exception:')) {
        rethrow;
      }
      throw Exception("Erreur d'inscription. Vérifiez votre connexion internet.");
    }
  }

  // ========== GOOGLE LOGIN ==========

  Future<AuthTokens?> loginWithGoogle(String googleIdToken) async {
    try {
      final response = await http.post(
        Uri.parse(AppConfig.googleLoginUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'idToken': googleIdToken}),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode == 200 && body['status'] == 'success') {
        final tokens = AuthTokens(
          accessToken: body['access_token'],
          refreshToken: body['refresh_token'],
          idToken: body['id_token'],
          accessTokenExpirationDateTime:
              DateTime.now().add(Duration(seconds: body['expires_in'] ?? 3600)),
        );
        await _saveTokens(tokens);
        return tokens;
      } else {
        throw Exception(body['message'] ?? 'Échec de la connexion Google');
      }
    } catch (e) {
      if (e is Exception && e.toString().contains('Exception:')) {
        rethrow;
      }
      throw Exception('Erreur de connexion Google.');
    }
  }

  // ========== OAUTH2 PKCE LOGIN (fallback) ==========

  Future<AuthTokens?> login() async {
    try {
      final AuthorizationTokenResponse? result =
          await _appAuth.authorizeAndExchangeCode(
        AuthorizationTokenRequest(
          AppConfig.clientId,
          AppConfig.redirectUri,
          serviceConfiguration: const AuthorizationServiceConfiguration(
            authorizationEndpoint: AppConfig.authorizationEndpoint,
            tokenEndpoint: AppConfig.tokenEndpoint,
            endSessionEndpoint: AppConfig.endSessionEndpoint,
          ),
          scopes: AppConfig.scopes,
          promptValues: ['login'],
          preferEphemeralSession: false,
          allowInsecureConnections: AppConfig.allowInsecureConnections,
        ),
      );

      if (result != null) {
        final tokens = AuthTokens(
          accessToken: result.accessToken!,
          refreshToken: result.refreshToken,
          idToken: result.idToken,
          accessTokenExpirationDateTime: result.accessTokenExpirationDateTime,
        );

        await _saveTokens(tokens);
        return tokens;
      }
      return null;
    } catch (e) {
      print('Login error: $e');
      rethrow;
    }
  }

  // ========== REFRESH TOKEN ==========

  Future<AuthTokens?> refreshToken() async {
    try {
      final storedRefreshToken = await _secureStorage.read(key: _refreshTokenKey);
      if (storedRefreshToken == null) return null;

      // Try REST refresh first
      try {
        final response = await http.post(
          Uri.parse(AppConfig.refreshUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'refreshToken': storedRefreshToken}),
        );

        final body = jsonDecode(response.body);

        if (response.statusCode == 200 && body['status'] == 'success') {
          final tokens = AuthTokens(
            accessToken: body['access_token'],
            refreshToken: body['refresh_token'],
            idToken: body['id_token'],
            accessTokenExpirationDateTime:
                DateTime.now().add(Duration(seconds: body['expires_in'] ?? 3600)),
          );
          await _saveTokens(tokens);
          return tokens;
        }
      } catch (_) {
        // Fallback to OAuth2 refresh
      }

      // Fallback: OAuth2 token refresh
      final TokenResponse? result = await _appAuth.token(
        TokenRequest(
          AppConfig.clientId,
          AppConfig.redirectUri,
          serviceConfiguration: const AuthorizationServiceConfiguration(
            authorizationEndpoint: AppConfig.authorizationEndpoint,
            tokenEndpoint: AppConfig.tokenEndpoint,
          ),
          refreshToken: storedRefreshToken,
          scopes: AppConfig.scopes,
          allowInsecureConnections: AppConfig.allowInsecureConnections,
        ),
      );

      if (result != null) {
        final tokens = AuthTokens(
          accessToken: result.accessToken!,
          refreshToken: result.refreshToken ?? storedRefreshToken,
          idToken: result.idToken,
          accessTokenExpirationDateTime: result.accessTokenExpirationDateTime,
        );

        await _saveTokens(tokens);
        return tokens;
      }
      return null;
    } catch (e) {
      print('Refresh token error: $e');
      await logout();
      return null;
    }
  }

  // ========== LOGOUT ==========

  Future<void> logout() async {
    try {
      final idToken = await _secureStorage.read(key: _idTokenKey);

      if (idToken != null) {
        try {
          await _appAuth.endSession(
            EndSessionRequest(
              idTokenHint: idToken,
              postLogoutRedirectUrl: AppConfig.postLogoutRedirectUri,
              serviceConfiguration: const AuthorizationServiceConfiguration(
                authorizationEndpoint: AppConfig.authorizationEndpoint,
                tokenEndpoint: AppConfig.tokenEndpoint,
                endSessionEndpoint: AppConfig.endSessionEndpoint,
              ),
            ),
          );
        } catch (e) {
          print('End session error (continuing with local logout): $e');
        }
      }
    } finally {
      await _clearTokens();
    }
  }

  // ========== TOKEN MANAGEMENT ==========

  Future<AuthTokens?> getTokens() async {
    final accessToken = await _secureStorage.read(key: _accessTokenKey);
    if (accessToken == null) return null;

    final refreshTokenVal = await _secureStorage.read(key: _refreshTokenKey);
    final idToken = await _secureStorage.read(key: _idTokenKey);
    final expirationStr = await _secureStorage.read(key: _expirationKey);

    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshTokenVal,
      idToken: idToken,
      accessTokenExpirationDateTime:
          expirationStr != null ? DateTime.parse(expirationStr) : null,
    );
  }

  Future<String?> getValidAccessToken() async {
    final tokens = await getTokens();
    if (tokens == null) return null;

    if (tokens.needsRefresh && tokens.refreshToken != null) {
      final newTokens = await refreshToken();
      return newTokens?.accessToken;
    }

    return tokens.accessToken;
  }

  Future<User?> getUserFromIdToken() async {
    final idToken = await _secureStorage.read(key: _idTokenKey);
    if (idToken == null) return null;

    try {
      final Map<String, dynamic> decodedToken = JwtDecoder.decode(idToken);
      return User.fromIdToken(decodedToken);
    } catch (e) {
      print('Error decoding ID token: $e');
      return null;
    }
  }

  Future<bool> isAuthenticated() async {
    final tokens = await getTokens();
    if (tokens == null) return false;

    if (tokens.isAccessTokenExpired) {
      if (tokens.refreshToken != null) {
        final newTokens = await refreshToken();
        return newTokens != null;
      }
      return false;
    }

    return true;
  }

  Future<void> _saveTokens(AuthTokens tokens) async {
    await _secureStorage.write(key: _accessTokenKey, value: tokens.accessToken);
    if (tokens.refreshToken != null) {
      await _secureStorage.write(key: _refreshTokenKey, value: tokens.refreshToken);
    }
    if (tokens.idToken != null) {
      await _secureStorage.write(key: _idTokenKey, value: tokens.idToken);
    }
    if (tokens.accessTokenExpirationDateTime != null) {
      await _secureStorage.write(
        key: _expirationKey,
        value: tokens.accessTokenExpirationDateTime!.toIso8601String(),
      );
    }
  }

  Future<void> _clearTokens() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _idTokenKey);
    await _secureStorage.delete(key: _expirationKey);
  }
}

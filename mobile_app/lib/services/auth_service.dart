import 'dart:convert';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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

  // Login with OAuth2 Authorization Code + PKCE
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
          // IMPORTANT: false pour permettre la persistence des cookies/sessions
          // true causerait un mode "incognito" qui empêche OAuth de fonctionner
          preferEphemeralSession: false,
          allowInsecureConnections: true, // Allow HTTP for local dev
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

  // Refresh access token
  Future<AuthTokens?> refreshToken() async {
    try {
      final storedRefreshToken = await _secureStorage.read(key: _refreshTokenKey);
      if (storedRefreshToken == null) return null;

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
          allowInsecureConnections: true, // Allow HTTP for local dev
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
      // If refresh fails, clear tokens and require re-login
      await logout();
      return null;
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      final idToken = await _secureStorage.read(key: _idTokenKey);

      // Try to end session on server
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
      // Always clear local tokens
      await _clearTokens();
    }
  }

  // Get current tokens
  Future<AuthTokens?> getTokens() async {
    final accessToken = await _secureStorage.read(key: _accessTokenKey);
    if (accessToken == null) return null;

    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    final idToken = await _secureStorage.read(key: _idTokenKey);
    final expirationStr = await _secureStorage.read(key: _expirationKey);

    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      idToken: idToken,
      accessTokenExpirationDateTime:
          expirationStr != null ? DateTime.parse(expirationStr) : null,
    );
  }

  // Get valid access token (refreshing if needed)
  Future<String?> getValidAccessToken() async {
    final tokens = await getTokens();
    if (tokens == null) return null;

    if (tokens.needsRefresh && tokens.refreshToken != null) {
      final newTokens = await refreshToken();
      return newTokens?.accessToken;
    }

    return tokens.accessToken;
  }

  // Get user from ID token
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

  // Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final tokens = await getTokens();
    if (tokens == null) return false;

    // If token is expired and we can't refresh, user is not authenticated
    if (tokens.isAccessTokenExpired) {
      if (tokens.refreshToken != null) {
        final newTokens = await refreshToken();
        return newTokens != null;
      }
      return false;
    }

    return true;
  }

  // Save tokens to secure storage
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

  // Clear tokens from secure storage
  Future<void> _clearTokens() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _idTokenKey);
    await _secureStorage.delete(key: _expirationKey);
  }
}

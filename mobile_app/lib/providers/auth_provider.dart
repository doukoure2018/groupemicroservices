import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../models/auth_tokens.dart';
import '../services/auth_service.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  AuthStatus _status = AuthStatus.initial;
  User? _user;
  AuthTokens? _tokens;
  String? _errorMessage;

  AuthStatus get status => _status;
  User? get user => _user;
  AuthTokens? get tokens => _tokens;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  // Initialize - check if user is already logged in
  Future<void> initialize() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      final isAuth = await _authService.isAuthenticated();
      if (isAuth) {
        _tokens = await _authService.getTokens();
        _user = await _authService.getUserFromIdToken();
        _status = AuthStatus.authenticated;
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (e) {
      _status = AuthStatus.unauthenticated;
      _errorMessage = e.toString();
    }

    notifyListeners();
  }

  // Login with email/password (REST)
  Future<bool> loginWithCredentials(String email, String password) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final tokens = await _authService.loginWithCredentials(email, password);
      if (tokens != null) {
        _tokens = tokens;
        _user = await _authService.getUserFromIdToken();
        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      } else {
        _status = AuthStatus.unauthenticated;
        _errorMessage = 'Échec de la connexion';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _status = AuthStatus.error;
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // Register new account (REST)
  Future<String?> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
  }) async {
    _errorMessage = null;
    notifyListeners();

    try {
      final message = await _authService.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        phone: phone,
      );
      return message;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return null;
    }
  }

  // Login with Google ID token (REST)
  Future<bool> loginWithGoogle(String googleIdToken) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final tokens = await _authService.loginWithGoogle(googleIdToken);
      if (tokens != null) {
        _tokens = tokens;
        _user = await _authService.getUserFromIdToken();
        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      } else {
        _status = AuthStatus.unauthenticated;
        _errorMessage = 'Échec de la connexion Google';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _status = AuthStatus.error;
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // Login via OAuth2 PKCE (fallback)
  Future<bool> login() async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final tokens = await _authService.login();
      if (tokens != null) {
        _tokens = tokens;
        _user = await _authService.getUserFromIdToken();
        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      } else {
        _status = AuthStatus.unauthenticated;
        _errorMessage = 'Authentification annulée';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _status = AuthStatus.error;
      _errorMessage = 'Erreur de connexion: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      await _authService.logout();
    } catch (e) {
      print('Logout error: $e');
    } finally {
      _user = null;
      _tokens = null;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }

  // Refresh token
  Future<bool> refreshToken() async {
    try {
      final newTokens = await _authService.refreshToken();
      if (newTokens != null) {
        _tokens = newTokens;
        return true;
      }
      // If refresh failed, logout
      await logout();
      return false;
    } catch (e) {
      await logout();
      return false;
    }
  }

  // Get valid access token for API calls
  Future<String?> getAccessToken() async {
    return await _authService.getValidAccessToken();
  }

  // Reset status to unauthenticated (useful after error)
  void resetToUnauthenticated() {
    _status = AuthStatus.unauthenticated;
    _errorMessage = null;
    notifyListeners();
  }

  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

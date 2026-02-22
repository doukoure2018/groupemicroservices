class AppConfig {
  // Environment flag - set to true for production builds
  static const bool isProduction = true;

  // OAuth2 Configuration
  static const String authorizationEndpoint = isProduction
      ? 'https://api.guidipress-io.com/authorization/oauth2/authorize'
      : 'http://10.13.229.58:8090/oauth2/authorize';

  static const String tokenEndpoint = isProduction
      ? 'https://api.guidipress-io.com/authorization/oauth2/token'
      : 'http://10.13.229.58:8090/oauth2/token';

  static const String endSessionEndpoint = isProduction
      ? 'https://api.guidipress-io.com/authorization/logout'
      : 'http://10.13.229.58:8090/logout';

  static const String userInfoEndpoint = isProduction
      ? 'https://api.guidipress-io.com/authorization/userinfo'
      : 'http://10.13.229.58:8090/userinfo';

  static const String clientId = 'mobile-app-client';
  static const String redirectUri = 'com.billetterie.gn://oauth2redirect';
  static const String postLogoutRedirectUri =
      'com.billetterie.gn://oauth2redirect';

  static const List<String> scopes = ['openid', 'profile', 'email'];

  // API Base URL (through gateway)
  static const String apiBaseUrl = isProduction
      ? 'https://api.guidipress-io.com'
      : 'http://10.13.229.58:9000';

  // Issuer (for discovery)
  static const String issuer = isProduction
      ? 'https://api.guidipress-io.com/authorization'
      : 'http://10.13.229.58:8090';

  // Allow insecure connections only in dev
  static const bool allowInsecureConnections = !isProduction;

  // Mobile Auth REST endpoints (direct login, no browser redirect)
  static const String authBaseUrl = isProduction
      ? 'https://api.guidipress-io.com/authorization/api/auth'
      : 'http://10.13.229.58:8090/api/auth';

  static const String loginUrl = '$authBaseUrl/token';
  static const String registerUrl = '$authBaseUrl/register';
  static const String googleLoginUrl = '$authBaseUrl/google';
  static const String refreshUrl = '$authBaseUrl/refresh';
}

class AppConfig {
  // OAuth2 Configuration - Port 8090
  static const String authorizationEndpoint = 'http://10.0.2.2:8090/oauth2/authorize';
  static const String tokenEndpoint = 'http://10.0.2.2:8090/oauth2/token';
  static const String endSessionEndpoint = 'http://10.0.2.2:8090/logout';
  static const String userInfoEndpoint = 'http://10.0.2.2:8090/userinfo';

  // For production, use your actual server URL
  // static const String authorizationEndpoint = 'https://auth.digi-creditrural-io.com/oauth2/authorize';
  // static const String tokenEndpoint = 'https://auth.digi-creditrural-io.com/oauth2/token';
  // static const String endSessionEndpoint = 'https://auth.digi-creditrural-io.com/logout';
  // static const String userInfoEndpoint = 'https://auth.digi-creditrural-io.com/userinfo';

  static const String clientId = 'mobile-app-client';
  static const String redirectUri = 'com.billetterie.gn://oauth2redirect';
  static const String postLogoutRedirectUri = 'com.billetterie.gn://oauth2redirect';

  static const List<String> scopes = ['openid', 'profile', 'email'];

  // API Base URL - Port 8090
  static const String apiBaseUrl = 'http://10.0.2.2:8090/api';
  // For production:
  // static const String apiBaseUrl = 'https://api.digi-creditrural-io.com/api';

  // Issuer (for discovery) - Port 8090
  static const String issuer = 'http://10.0.2.2:8090';
  // For production:
  // static const String issuer = 'https://auth.digi-creditrural-io.com';
}

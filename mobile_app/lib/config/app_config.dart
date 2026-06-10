/// Configuration mobile SIRA Guinée — sélection de l'environnement par
/// `--dart-define=ENV=...` au build/run.
///
/// 3 environnements supportés :
///   - `dev`  : développement local (Mac IP LAN, HTTP, OAuth localhost)
///   - `test` : env TEST SIRA Guinée CI/CD (test.sira-guinee.com, HTTPS)
///   - `prod` : env PRODUCTION SIRA Guinée (sira-guinee.com, HTTPS) — DÉFAUT
///
/// Exemples d'usage :
///
///   # APK release prod (défaut, pas besoin de --dart-define)
///   flutter build apk --release
///
///   # APK release TEST (smoke tests sur test.sira-guinee.com avant publier)
///   flutter build apk --release --dart-define=ENV=test
///
///   # Run sur émulateur/phone pointant vers Mac LAN (dev local)
///   flutter run --dart-define=ENV=dev
///
/// Ferme la dette [[mobile-apibaseurl-dart-define]] : plus aucune URL
/// hardcodée à patcher manuellement par env, on switche via une seule var.
class AppConfig {
  // Lecture de l'env depuis `--dart-define=ENV=test`, défaut `prod`.
  static const String env = String.fromEnvironment('ENV', defaultValue: 'prod');

  // Flags dérivés (rétrocompat avec ancien code qui lit isProduction).
  static const bool isProduction = env == 'prod';
  static const bool isTest = env == 'test';
  static const bool isDev = env == 'dev';

  // ===========================================================================
  // Bases — UNE URL par env, le reste est dérivé
  // ===========================================================================
  // IP LAN Mac dev : à adapter au besoin (ifconfig en0 → inet ...). Pour MVP,
  // cette valeur n'a pas vocation à changer souvent (réseau WiFi maison).
  static const String _devApiBase = 'http://172.20.10.6:9000';
  static const String _devAuthBase = 'http://172.20.10.6:8090';

  static const String _testApiBase = 'https://api-test.sira-guinee.com';
  // En test/prod, le authorizationserver est routé via la gateway :
  //   - api-test.sira-guinee.com/authorization/** → authorizationserver
  static const String _testAuthBase = 'https://api-test.sira-guinee.com/authorization';

  static const String _prodApiBase = 'https://api.sira-guinee.com';
  static const String _prodAuthBase = 'https://api.sira-guinee.com/authorization';

  // ===========================================================================
  // Endpoints actifs (ternaires const, résolus à compile-time)
  // ===========================================================================
  static const String apiBaseUrl = isProduction
      ? _prodApiBase
      : (isTest ? _testApiBase : _devApiBase);

  static const String issuer = isProduction
      ? _prodAuthBase
      : (isTest ? _testAuthBase : _devAuthBase);

  static const String authorizationEndpoint = isProduction
      ? '$_prodAuthBase/oauth2/authorize'
      : (isTest ? '$_testAuthBase/oauth2/authorize' : '$_devAuthBase/oauth2/authorize');

  static const String tokenEndpoint = isProduction
      ? '$_prodAuthBase/oauth2/token'
      : (isTest ? '$_testAuthBase/oauth2/token' : '$_devAuthBase/oauth2/token');

  static const String endSessionEndpoint = isProduction
      ? '$_prodAuthBase/logout'
      : (isTest ? '$_testAuthBase/logout' : '$_devAuthBase/logout');

  static const String userInfoEndpoint = isProduction
      ? '$_prodAuthBase/userinfo'
      : (isTest ? '$_testAuthBase/userinfo' : '$_devAuthBase/userinfo');

  // Mobile Auth REST endpoints (direct login email/password, pas le flow OAuth2)
  static const String authBaseUrl = isProduction
      ? '$_prodAuthBase/api/auth'
      : (isTest ? '$_testAuthBase/api/auth' : '$_devAuthBase/api/auth');

  static const String loginUrl = '$authBaseUrl/token';
  static const String registerUrl = '$authBaseUrl/register';
  static const String googleLoginUrl = '$authBaseUrl/google';
  static const String refreshUrl = '$authBaseUrl/refresh';

  // ===========================================================================
  // OAuth2 client + scheme custom
  // ===========================================================================
  static const String clientId = 'mobile-app-client';

  // Scheme custom rebrand SIRA Guinée (yigui:// matche le Sender ID Orange
  // actuel et la config OAuth2 backend Java V23+). Doit aussi être déclaré
  // dans :
  //   - mobile_app/android/app/src/main/AndroidManifest.xml (data android:scheme)
  //   - mobile_app/ios/Runner/Info.plist (CFBundleURLSchemes)
  static const String redirectUri = 'yigui://oauth2redirect';
  static const String postLogoutRedirectUri = 'yigui://oauth2redirect';

  static const List<String> scopes = ['openid', 'profile', 'email'];

  // ===========================================================================
  // Misc
  // ===========================================================================
  // HTTP autorisé seulement en dev (localhost LAN). HTTPS strict en test/prod.
  static const bool allowInsecureConnections = isDev;

  // ===========================================================================
  // Feature flags
  // ===========================================================================
  // Google Sign-In activé en dev + test uniquement (smoke test avant prod).
  // PROD reste false tant que : (1) smoke test TEST validé, (2) secret prod
  // GOOGLE_CLIENT_ID rotaté du placeholder __GOOGLE_DISABLED__ vers le vrai
  // Web Client ID SIRA (GitHub Actions), (3) backend redéployé avec la
  // vérification idToken (commit 9794442). Cf dette
  // backend-google-idtoken-no-verification.
  static const bool enableGoogleSignIn = isDev || isTest;
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'models/user_profile.dart';
import 'screens/splash_screen.dart';
import 'screens/welcome_screen.dart';
import 'screens/complete_profile_screen.dart';
import 'features/hub/hub_screen.dart';
import 'presentation/resource/color_manager.dart';
import 'services/api_service.dart';
import 'services/user_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(
        title: 'SIRA Guinée',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: ColorManager.accent),
          useMaterial3: true,
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  @override
  void initState() {
    super.initState();
    // When API gets 401 + refresh fails, force logout to redirect to login
    ApiService.onSessionExpired = () {
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isAuthenticated) {
        authProvider.logout();
      }
    };
    // Lancer l'init auth UNE SEULE FOIS ici (post-frame pour éviter un
    // notifyListeners pendant le build). Avant, initialize() était déclenché
    // par SplashScreen.initState — or SplashScreen est réutilisé (AuthWrapper +
    // _ProfileGate), donc il se relançait et provoquait le flash Welcome→profil.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        switch (authProvider.status) {
          case AuthStatus.initial:
          case AuthStatus.loading:
            return const SplashScreen();
          case AuthStatus.authenticated:
            // Gate : profil complet (tél + adresse) requis avant le Hub.
            return const _ProfileGate();
          case AuthStatus.unauthenticated:
          case AuthStatus.error:
            return const WelcomeScreen();
        }
      },
    );
  }
}

/// Gate post-login : vérifie que le profil a tél + adresse. Sinon →
/// [CompleteProfileScreen] bloquant avant le [HubScreen]. Fail-open sur erreur
/// réseau (ne verrouille pas l'user ; re-check au prochain lancement).
class _ProfileGate extends StatefulWidget {
  const _ProfileGate();

  @override
  State<_ProfileGate> createState() => _ProfileGateState();
}

class _ProfileGateState extends State<_ProfileGate> {
  final _userService = UserService();
  UserProfile? _profile;
  bool _loading = true;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    try {
      final p = await _userService.getProfile();
      if (!mounted) return;
      setState(() {
        _profile = p;
        _loading = false;
      });
    } catch (_) {
      // Fail-open : erreur réseau transitoire ne doit pas bloquer l'accès.
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Loader NEUTRE (pas SplashScreen) : SplashScreen ne doit plus être réutilisé
    // ici, sinon il re-déclenchait l'init et causait le flash.
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!_completed && _profile != null && !_profile!.isComplete) {
      return CompleteProfileScreen(
        profile: _profile!,
        onCompleted: () => setState(() => _completed = true),
      );
    }
    return const HubScreen();
  }
}

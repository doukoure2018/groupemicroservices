import 'package:flutter/material.dart';
import '../../screens/home_screen.dart';
import '../../screens/login_screen.dart';
import '../../screens/splash_screen.dart';

class Routes {
  static const String splash = "/";
  static const String login = "/login";
  static const String register = "/register";
  static const String home = "/home";
  static const String dashboard = "/dashboard";
  static const String profile = "/profile";
  static const String settings = "/settings";
  static const String notifications = "/notifications";
}

class RouteGenerator {
  static Route<dynamic> getRoute(RouteSettings settings) {
    switch (settings.name) {
      case Routes.splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case Routes.login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case Routes.home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      default:
        return unDefinedRoute();
    }
  }

  static Route<dynamic> unDefinedRoute() {
    return MaterialPageRoute(
      builder: (_) => Scaffold(
        appBar: AppBar(
          title: const Text("Page non trouvée"),
        ),
        body: const Center(
          child: Text("Route non définie"),
        ),
      ),
    );
  }
}

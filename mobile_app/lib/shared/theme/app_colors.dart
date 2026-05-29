import 'package:flutter/material.dart';

/// Palette YIGUI — variante "Pro Airbnb" (validée 2026-05-29).
///
/// Distincte des couleurs billetterie héritées
/// (lib/presentation/resource/color_manager.dart) qui restent en place pour
/// les écrans existants. Cette palette n'est utilisée que par les écrans
/// construits sur lib/shared/ — hub d'accueil (15.2) et features immo.
class AppColors {
  AppColors._();

  // Marque
  static const Color primary = Color(0xFF1F6F8B); // sarcelle profonde
  static const Color primaryContainer = Color(0xFFE0EFF4); // sarcelle pâle
  static const Color secondary = Color(0xFFF26430); // corail CTA

  // Surfaces
  static const Color background = Color(0xFFFAFAFA);
  static const Color surface = Color(0xFFFFFFFF);

  // Textes
  static const Color onBackground = Color(0xFF1A1A1A);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color onSurface = Color(0xFF1A1A1A);

  // Séparation
  static const Color divider = Color(0xFFE5E5E5);

  // Sémantique
  static const Color success = Color(0xFF10803E);
  static const Color warning = Color(0xFFD97706);
  static const Color error = Color(0xFFDC2626);
  static const Color info = Color(0xFF2563EB);
}

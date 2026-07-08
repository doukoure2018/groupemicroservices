import 'package:flutter/material.dart';

/// Palette SYNERGIA mobile — vert forêt #16451F (primary) + or #F2A900 (accent).
/// Rebranding 2026-07-08 (logo SYNERGIA IMMO TRANS GUINEE).
///
/// Utilisée par les écrans construits sur lib/shared/ — hub d'accueil et
/// features immo. Alignée sur ColorManager (billetterie) désormais rebrandé.
class AppColors {
  AppColors._();

  // Marque
  static const Color primary = Color(0xFF16451F); // vert forêt SYNERGIA
  static const Color primaryContainer = Color(0xFFE6F0E8); // vert pâle
  static const Color secondary = Color(0xFFF2A900); // or SYNERGIA (accent)
  static const Color secondaryContainer = Color(0xFFFFF3D6); // or pâle (badges, hover)

  // Surfaces
  static const Color background = Color(0xFFFAFAFA);
  static const Color surface = Color(0xFFFFFFFF);

  // Textes
  static const Color onBackground = Color(0xFF1A1A1A);
  static const Color onPrimary = Color(0xFFFFFFFF);
  // Texte/icône sur l'or : vert forêt foncé (l'or est trop clair pour du blanc).
  static const Color onSecondary = Color(0xFF16451F);
  static const Color onSurface = Color(0xFF1A1A1A);

  // Séparation
  static const Color divider = Color(0xFFE5E5E5);

  // Sémantique
  static const Color success = Color(0xFF10803E);
  static const Color warning = Color(0xFFD97706);
  static const Color error = Color(0xFFDC2626);
  static const Color info = Color(0xFF2563EB);
}

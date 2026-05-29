import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Typographie YIGUI — Inter (déjà disponible via google_fonts dans pubspec).
/// Inter est très lisible aux petites tailles mobile, neutre, et largement
/// utilisée dans les apps "pro" (Linear, Vercel, Stripe, etc.).
class AppTypography {
  AppTypography._();

  /// Applique Inter à toutes les variantes du TextTheme fourni (light ou dark).
  static TextTheme apply(TextTheme base) {
    return GoogleFonts.interTextTheme(base);
  }
}

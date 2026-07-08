import 'package:flutter/material.dart';

class ColorManager {
  // Primary Colors - Vert forêt SYNERGIA (logo)
  static const Color primary = Color(0xFF16451F);
  static const Color primaryDark = Color(0xFF0F3019);
  static const Color primaryLight = Color(0xFF2A6B3A);
  static const Color primaryOpacity = Color(0x3316451F);
  static const Color primarySurface = Color(0xFFE6F0E8);

  // Secondary/Dark Green
  static const Color secondary = Color(0xFF0B2412);
  static const Color secondaryLight = Color(0xFF16451F);

  // Accent Colors - Or SYNERGIA (logo #F2A900)
  static const Color accent = Color(0xFFF2A900);
  static const Color accentLight = Color(0xFFFFC233);
  static const Color accentDark = Color(0xFFD99400);

  // Background Colors
  static const Color background = Color(0xFFF5F7FA);
  static const Color backgroundDark = Color(0xFFEDF0F5);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF8FAFC);

  // Text Colors
  static const Color textPrimary = Color(0xFF16451F);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textTertiary = Color(0xFF94A3B8);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // Grey Scale
  static const Color grey = Color(0xFF64748B);
  static const Color grey1 = Color(0xFFE2E8F0);
  static const Color grey2 = Color(0xFFCBD5E1);
  static const Color darkGrey = Color(0xFF475569);
  static const Color lightGrey = Color(0xFFF1F5F9);

  // Status Colors
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFFDBEAFE);

  // Basic Colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color transparent = Colors.transparent;

  // Card & Border Colors
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color cardBorder = Color(0xFFE2E8F0);
  static const Color divider = Color(0xFFE2E8F0);
  static const Color inputBorder = Color(0xFFE5E7EB);
  static const Color inputBackground = Color(0xFFFAFAFA);

  // Transport/Trip specific colors
  static const Color departurePin = Color(0xFF16451F);
  static const Color arrivalPin = Color(0xFFEF4444);
  static const Color busIcon = Color(0xFFF2A900);
  static const Color starRating = Color(0xFFFBBF24);
  static const Color climatisation = Color(0xFF3B82F6);

  // Payment method colors
  static const Color orangeMoney = Color(0xFFF97316);
  static const Color mtnMomo = Color(0xFFFBBF24);
  static const Color creditMoney = Color(0xFF22C55E);

  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryDark],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient splashGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFE6F0E8)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF16451F), Color(0xFF0F3019)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFF2A900), Color(0xFFD99400)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

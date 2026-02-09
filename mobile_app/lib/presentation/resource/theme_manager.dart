import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'color_manager.dart';
import 'font_manager.dart';
import 'styles_manager.dart';
import 'values_manager.dart';

ThemeData getApplicationTheme() {
  return ThemeData(
    // Main Colors
    primaryColor: ColorManager.primary,
    primaryColorLight: ColorManager.primaryLight,
    primaryColorDark: ColorManager.primaryDark,
    disabledColor: ColorManager.grey1,
    splashColor: ColorManager.primaryOpacity,
    scaffoldBackgroundColor: ColorManager.background,

    // Color Scheme
    colorScheme: const ColorScheme.light(
      primary: ColorManager.primary,
      secondary: ColorManager.secondary,
      surface: ColorManager.surface,
      error: ColorManager.error,
      onPrimary: ColorManager.white,
      onSecondary: ColorManager.white,
      onSurface: ColorManager.textPrimary,
      onError: ColorManager.white,
    ),

    // Card Theme
    cardTheme: CardThemeData(
      color: ColorManager.cardBackground,
      shadowColor: ColorManager.grey.withOpacity(0.1),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.r16),
      ),
    ),

    // AppBar Theme
    appBarTheme: AppBarTheme(
      centerTitle: true,
      color: ColorManager.white,
      elevation: 0,
      shadowColor: ColorManager.grey.withOpacity(0.1),
      systemOverlayStyle: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
      titleTextStyle: getSemiBoldStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s18,
      ),
      iconTheme: const IconThemeData(
        color: ColorManager.textPrimary,
        size: AppSize.s24,
      ),
    ),

    // Button Theme
    buttonTheme: const ButtonThemeData(
      shape: StadiumBorder(),
      disabledColor: ColorManager.grey1,
      buttonColor: ColorManager.primary,
      splashColor: ColorManager.primaryLight,
    ),

    // Elevated Button Theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        textStyle: getSemiBoldStyle(
          color: ColorManager.white,
          fontSize: FontSize.s16,
        ),
        backgroundColor: ColorManager.primary,
        foregroundColor: ColorManager.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.r12),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppPadding.p24,
          vertical: AppPadding.p14,
        ),
        elevation: 0,
      ),
    ),

    // Outlined Button Theme
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        textStyle: getSemiBoldStyle(
          color: ColorManager.primary,
          fontSize: FontSize.s16,
        ),
        foregroundColor: ColorManager.primary,
        side: const BorderSide(color: ColorManager.primary, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.r12),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppPadding.p24,
          vertical: AppPadding.p14,
        ),
      ),
    ),

    // Text Button Theme
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        textStyle: getMediumStyle(
          color: ColorManager.primary,
          fontSize: FontSize.s14,
        ),
        foregroundColor: ColorManager.primary,
      ),
    ),

    // Text Theme
    textTheme: TextTheme(
      displayLarge: getBoldStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s32,
      ),
      displayMedium: getBoldStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s28,
      ),
      displaySmall: getSemiBoldStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s24,
      ),
      headlineLarge: getSemiBoldStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s22,
      ),
      headlineMedium: getSemiBoldStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s20,
      ),
      headlineSmall: getMediumStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s18,
      ),
      titleLarge: getSemiBoldStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s16,
      ),
      titleMedium: getMediumStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s14,
      ),
      titleSmall: getMediumStyle(
        color: ColorManager.textSecondary,
        fontSize: FontSize.s12,
      ),
      bodyLarge: getRegularStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s16,
      ),
      bodyMedium: getRegularStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s14,
      ),
      bodySmall: getRegularStyle(
        color: ColorManager.textSecondary,
        fontSize: FontSize.s12,
      ),
      labelLarge: getMediumStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s14,
      ),
      labelMedium: getRegularStyle(
        color: ColorManager.textSecondary,
        fontSize: FontSize.s12,
      ),
      labelSmall: getRegularStyle(
        color: ColorManager.textTertiary,
        fontSize: FontSize.s10,
      ),
    ),

    // Input Decoration Theme
    inputDecorationTheme: InputDecorationTheme(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppPadding.p16,
        vertical: AppPadding.p14,
      ),
      hintStyle: getRegularStyle(
        color: ColorManager.textTertiary,
        fontSize: FontSize.s14,
      ),
      labelStyle: getMediumStyle(
        color: ColorManager.textSecondary,
        fontSize: FontSize.s14,
      ),
      errorStyle: getRegularStyle(
        color: ColorManager.error,
        fontSize: FontSize.s12,
      ),
      enabledBorder: OutlineInputBorder(
        borderSide: const BorderSide(
          color: ColorManager.grey1,
          width: AppSize.s1_5,
        ),
        borderRadius: BorderRadius.circular(AppRadius.r12),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: const BorderSide(
          color: ColorManager.primary,
          width: AppSize.s1_5,
        ),
        borderRadius: BorderRadius.circular(AppRadius.r12),
      ),
      errorBorder: OutlineInputBorder(
        borderSide: const BorderSide(
          color: ColorManager.error,
          width: AppSize.s1_5,
        ),
        borderRadius: BorderRadius.circular(AppRadius.r12),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderSide: const BorderSide(
          color: ColorManager.error,
          width: AppSize.s1_5,
        ),
        borderRadius: BorderRadius.circular(AppRadius.r12),
      ),
      filled: true,
      fillColor: ColorManager.white,
    ),

    // Divider Theme
    dividerTheme: const DividerThemeData(
      color: ColorManager.divider,
      thickness: 1,
      space: AppSize.s1,
    ),

    // Bottom Navigation Bar Theme
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: ColorManager.white,
      selectedItemColor: ColorManager.primary,
      unselectedItemColor: ColorManager.grey,
      selectedLabelStyle: getMediumStyle(
        color: ColorManager.primary,
        fontSize: FontSize.s12,
      ),
      unselectedLabelStyle: getRegularStyle(
        color: ColorManager.grey,
        fontSize: FontSize.s12,
      ),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),

    // Floating Action Button Theme
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: ColorManager.primary,
      foregroundColor: ColorManager.white,
      elevation: 4,
      shape: CircleBorder(),
    ),

    // Icon Theme
    iconTheme: const IconThemeData(
      color: ColorManager.textSecondary,
      size: AppSize.s24,
    ),

    // Checkbox Theme
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return ColorManager.primary;
        }
        return ColorManager.white;
      }),
      checkColor: WidgetStateProperty.all(ColorManager.white),
      side: const BorderSide(color: ColorManager.grey1, width: 1.5),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.r4),
      ),
    ),

    // Switch Theme
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return ColorManager.white;
        }
        return ColorManager.grey;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return ColorManager.primary;
        }
        return ColorManager.grey1;
      }),
    ),

    // Progress Indicator Theme
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: ColorManager.primary,
      linearTrackColor: ColorManager.grey1,
      circularTrackColor: ColorManager.grey1,
    ),

    // Snackbar Theme
    snackBarTheme: SnackBarThemeData(
      backgroundColor: ColorManager.textPrimary,
      contentTextStyle: getRegularStyle(
        color: ColorManager.white,
        fontSize: FontSize.s14,
      ),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.r8),
      ),
    ),

    // Dialog Theme
    dialogTheme: DialogThemeData(
      backgroundColor: ColorManager.white,
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.r20),
      ),
      titleTextStyle: getSemiBoldStyle(
        color: ColorManager.textPrimary,
        fontSize: FontSize.s18,
      ),
      contentTextStyle: getRegularStyle(
        color: ColorManager.textSecondary,
        fontSize: FontSize.s14,
      ),
    ),

    // Bottom Sheet Theme
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: ColorManager.white,
      modalBackgroundColor: ColorManager.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppRadius.r24),
        ),
      ),
    ),
  );
}

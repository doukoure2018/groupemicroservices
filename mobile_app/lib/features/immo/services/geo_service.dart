import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../../shared/theme/app_colors.dart';

/// Service de géolocalisation partagé (Phase Géoloc-2A).
///
/// Extrait la logique GPS dupliquée que Géoloc-1 (`step_infos.dart`) avait
/// implémentée en interne. Factorisé maintenant que 3 callers sont prévus :
///   - Wizard étape 2 : auto-fill lat/lng (`step_infos.dart`)
///   - Filtres recherche : section Distance (`filtres_sheet.dart`, Géoloc-2B)
///   - Raccourci AppBar (`recherche_screen.dart`, Géoloc-2B)
///
/// Pattern just-in-time prompt (décision UX Phase Géoloc-1 option B) :
/// l'utilisateur ne voit le prompt système que quand il sollicite la
/// localisation (tap bouton/chip). Refus = pas de catastrophe, fallback
/// possible (saisie manuelle wizard, ou pas de filtre distance).
///
/// Retourne :
///   - `Position` valide → caller exploite lat/lng/accuracy
///   - `null` → service OFF, permission refusée, ou timeout — un SnackBar
///     contextualisé a été affiché côté UI via [context]
///
/// Le caller utilise `if (position == null) return;` pour savoir que ça n'a
/// pas marché sans avoir à inspecter le type d'erreur.
class GeoService {
  /// Tente d'obtenir la position courante avec gestion complète des 3+1 cas
  /// refus et affichage SnackBar contextualisé.
  static Future<Position?> getCurrentPosition(BuildContext context) async {
    try {
      // === 1. Service location activé OS ? ===
      if (!await Geolocator.isLocationServiceEnabled()) {
        if (context.mounted) _showLocationServiceDisabled(context);
        return null;
      }

      // === 2. Permission ===
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (!context.mounted) return null;
      if (permission == LocationPermission.deniedForever) {
        _showPermissionDeniedForever(context);
        return null;
      }
      if (permission == LocationPermission.denied) {
        _showPermissionDenied(context);
        return null;
      }

      // === 3. Récupérer position avec timeout ===
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      return pos;
    } on TimeoutException {
      if (context.mounted) _showTimeout(context);
      return null;
    } catch (e) {
      if (context.mounted) _showGenericError(context, e.toString());
      return null;
    }
  }

  // ============================================================
  // SnackBars (4 cas)
  // ============================================================

  static void _showLocationServiceDisabled(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: const Text('La localisation est désactivée sur votre appareil.'),
      backgroundColor: AppColors.error,
      duration: const Duration(seconds: 6),
      action: SnackBarAction(
        label: 'Activer',
        onPressed: () => Geolocator.openLocationSettings(),
      ),
    ));
  }

  static void _showPermissionDenied(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text(
        'Permission refusée. Cliquez à nouveau pour réessayer.',
      ),
      backgroundColor: AppColors.error,
      duration: Duration(seconds: 5),
    ));
  }

  static void _showPermissionDeniedForever(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: const Text(
        'Permission refusée définitivement. Activez la géoloc dans les paramètres de l\'app.',
      ),
      backgroundColor: AppColors.error,
      duration: const Duration(seconds: 6),
      action: SnackBarAction(
        label: 'Paramètres',
        onPressed: () => Geolocator.openAppSettings(),
      ),
    ));
  }

  static void _showTimeout(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text(
        'Impossible d\'obtenir la position (timeout). Réessayez.',
      ),
      backgroundColor: AppColors.error,
    ));
  }

  static void _showGenericError(BuildContext context, String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('Erreur GPS : $msg'),
      backgroundColor: AppColors.error,
    ));
  }
}

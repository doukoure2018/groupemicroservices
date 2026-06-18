import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'billetterie_service.dart';
import '../screens/rate_trip_sheet.dart';

/// Clé de navigation globale : permet d'ouvrir un écran (ex notation) suite au
/// tap sur une push, sans BuildContext local.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Handler des messages reçus app en arrière-plan / fermée.
/// Top-level + @pragma requis par firebase_messaging. Le système affiche
/// automatiquement la bannière (payload `notification`) ; rien à faire ici.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {}

/// Gère les notifications push FCM/APNs : permission, enregistrement du token
/// device côté backend, et navigation au tap (DEMANDE_AVIS → écran de notation).
class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final BilletterieService _billetterieService = BilletterieService();
  bool _started = false;

  /// À appeler une fois l'utilisateur authentifié (l'enregistrement du token
  /// backend exige le JWT). Idempotent.
  Future<void> start() async {
    if (_started) return;
    _started = true;
    try {
      await _messaging.requestPermission(alert: true, badge: true, sound: true);
      await _registerToken();
      _messaging.onTokenRefresh.listen(_sendToken);
      FirebaseMessaging.onMessageOpenedApp.listen(_handleTap);
      // App lancée depuis une push (état terminé) :
      final initial = await _messaging.getInitialMessage();
      if (initial != null) _handleTap(initial);
    } catch (_) {
      // Push indisponible (ex iOS sans plist/APNs) : dégradation silencieuse,
      // on pourra retenter au prochain lancement.
      _started = false;
    }
  }

  Future<void> _registerToken() async {
    final token = await _messaging.getToken();
    if (token != null) await _sendToken(token);
  }

  Future<void> _sendToken(String token) async {
    final platform = Platform.isIOS ? 'IOS' : 'ANDROID';
    try {
      await _billetterieService.registerDeviceToken(
          token: token, platform: platform);
    } catch (_) {
      // réseau / 401 transitoire : retenté au prochain start()/onTokenRefresh.
    }
  }

  void _handleTap(RemoteMessage message) {
    final data = message.data;
    if (data['categorie'] == 'DEMANDE_AVIS') {
      final uuid = data['commandeUuid'];
      final ctx = navigatorKey.currentContext;
      if (uuid is String && uuid.isNotEmpty && ctx != null) {
        RateTripSheet.show(ctx, commandeUuid: uuid);
      }
    }
  }
}

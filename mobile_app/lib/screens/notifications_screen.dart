import 'package:flutter/material.dart';
import '../models/app_notification.dart';
import '../services/billetterie_service.dart';
import 'rate_trip_sheet.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

/// Centre de notifications in-app (billetterie).
/// Consomme GET /billetterie/notifications. Une notification DEMANDE_AVIS
/// ouvre directement la feuille de notation au tap (via metadata.commandeUuid).
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final BilletterieService _service = BilletterieService();
  bool _isLoading = true;
  String? _errorMessage;
  List<AppNotification> _notifications = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final items = await _service.getNotifications();
      if (!mounted) return;
      setState(() {
        _notifications = items;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage =
            'Impossible de charger vos notifications. Vérifiez votre connexion.';
        _isLoading = false;
      });
    }
  }

  Future<void> _markAllAsRead() async {
    final hasUnread = _notifications.any((n) => !n.lue);
    if (!hasUnread) return;
    try {
      await _service.markAllNotificationsAsRead();
      if (!mounted) return;
      setState(() {
        _notifications = _notifications
            .map((n) => n.lue ? n : _copyRead(n))
            .toList();
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Action impossible pour le moment.'),
          backgroundColor: ColorManager.error,
        ),
      );
    }
  }

  AppNotification _copyRead(AppNotification n) => AppNotification(
        notificationId: n.notificationId,
        notificationUuid: n.notificationUuid,
        typeNotification: n.typeNotification,
        categorie: n.categorie,
        titre: n.titre,
        message: n.message,
        lue: true,
        referenceId: n.referenceId,
        referenceType: n.referenceType,
        metadata: n.metadata,
        createdAt: n.createdAt,
      );

  Future<void> _onTap(AppNotification notif) async {
    // Marque comme lue (optimiste) côté serveur + UI.
    if (!notif.lue) {
      _service.markNotificationAsRead(notif.notificationId).catchError((_) {});
      setState(() {
        final i = _notifications.indexWhere(
            (n) => n.notificationId == notif.notificationId);
        if (i != -1) _notifications[i] = _copyRead(notif);
      });
    }

    // Demande d'avis → ouvre directement la notation.
    if (notif.isDemandeAvis && notif.commandeUuid != null) {
      final rated = await RateTripSheet.show(
        context,
        commandeUuid: notif.commandeUuid!,
        routeLabel: _routeFromMessage(notif),
      );
      if (rated == true) {
        _load(); // rafraîchit (la demande disparaîtra côté serveur une fois notée)
      }
    }
  }

  /// Extrait "Ville → Ville" du message si présent (best-effort cosmétique).
  String? _routeFromMessage(AppNotification notif) {
    final msg = notif.message;
    final start = msg.indexOf('voyage ');
    final arrow = msg.indexOf('→');
    if (start != -1 && arrow != -1) {
      final after = msg.substring(arrow + 1);
      final end = after.indexOf(' est');
      final dest = end != -1 ? after.substring(0, end) : after;
      final from = msg.substring(start + 7, arrow);
      return '${from.trim()} → ${dest.trim()}';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      appBar: AppBar(
        backgroundColor: ColorManager.white,
        elevation: 0,
        title: Text(
          'Notifications',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s20,
          ),
        ),
        actions: [
          if (_notifications.any((n) => !n.lue))
            TextButton(
              onPressed: _markAllAsRead,
              child: Text(
                'Tout lire',
                style: getMediumStyle(
                  color: ColorManager.primary,
                  fontSize: FontSize.s13,
                ),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        color: ColorManager.primary,
        onRefresh: _load,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: ColorManager.primary),
      );
    }
    if (_errorMessage != null) {
      return _buildError();
    }
    if (_notifications.isEmpty) {
      return _buildEmpty();
    }
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppPadding.p16),
      itemCount: _notifications.length,
      itemBuilder: (_, i) => _buildCard(_notifications[i]),
      separatorBuilder: (_, __) => const SizedBox(height: AppSize.s8),
    );
  }

  Widget _buildCard(AppNotification notif) {
    final unread = !notif.lue;
    return GestureDetector(
      onTap: () => _onTap(notif),
      child: Container(
        padding: const EdgeInsets.all(AppPadding.p14),
        decoration: BoxDecoration(
          color: unread ? ColorManager.infoLight : ColorManager.white,
          borderRadius: BorderRadius.circular(AppRadius.r12),
          border: Border.all(
            color: unread ? ColorManager.primary.withValues(alpha: 0.25)
                          : ColorManager.grey1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildLeading(notif),
            const SizedBox(width: AppSize.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notif.titre ?? 'Notification',
                          style: unread
                              ? getSemiBoldStyle(
                                  color: ColorManager.textPrimary,
                                  fontSize: FontSize.s14)
                              : getMediumStyle(
                                  color: ColorManager.textPrimary,
                                  fontSize: FontSize.s14),
                        ),
                      ),
                      if (unread)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(left: 6, top: 4),
                          decoration: const BoxDecoration(
                            color: ColorManager.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notif.message,
                    style: getRegularStyle(
                      color: ColorManager.textSecondary,
                      fontSize: FontSize.s13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        notif.relativeTime,
                        style: getRegularStyle(
                          color: ColorManager.textTertiary,
                          fontSize: FontSize.s11,
                        ),
                      ),
                      if (notif.isDemandeAvis && notif.commandeUuid != null)
                        Row(
                          children: [
                            const Icon(Icons.star_rounded,
                                size: 14, color: ColorManager.starRating),
                            const SizedBox(width: 4),
                            Text(
                              'Noter',
                              style: getMediumStyle(
                                color: ColorManager.accentDark,
                                fontSize: FontSize.s12,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeading(AppNotification notif) {
    IconData icon;
    Color color;
    switch (notif.categorie) {
      case 'DEMANDE_AVIS':
        icon = Icons.star_outline_rounded;
        color = ColorManager.starRating;
        break;
      case 'RAPPEL_J1':
      case 'RAPPEL_H2':
        icon = Icons.alarm;
        color = ColorManager.accent;
        break;
      case 'REMPLISSAGE_50':
      case 'REMPLISSAGE_75':
      case 'REMPLISSAGE_100':
        icon = Icons.people_outline;
        color = ColorManager.primary;
        break;
      case 'COMMANDE_CONFIRMEE':
        icon = Icons.check_circle_outline;
        color = ColorManager.success;
        break;
      default:
        icon = Icons.notifications_outlined;
        color = ColorManager.primary;
    }
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.r8),
      ),
      child: Icon(icon, size: 20, color: color),
    );
  }

  Widget _buildEmpty() {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 120, horizontal: 32),
        child: Column(
          children: [
            const Icon(Icons.notifications_none,
                size: 56, color: ColorManager.textTertiary),
            const SizedBox(height: 16),
            Text(
              'Aucune notification',
              style: getMediumStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Vos notifications de voyage apparaîtront ici.',
              textAlign: TextAlign.center,
              style: getRegularStyle(
                color: ColorManager.textTertiary,
                fontSize: FontSize.s14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 120, horizontal: 32),
        child: Column(
          children: [
            const Icon(Icons.error_outline,
                size: 48, color: ColorManager.textTertiary),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: getRegularStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s14,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _load,
              style: ElevatedButton.styleFrom(
                backgroundColor: ColorManager.primary,
                foregroundColor: ColorManager.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                ),
              ),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }
}

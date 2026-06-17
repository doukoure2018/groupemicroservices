import 'dart:convert';

/// Notification in-app (centre de notifications billetterie).
/// Mappe la réponse de GET /billetterie/notifications.
class AppNotification {
  final int notificationId;
  final String notificationUuid;
  final String typeNotification;
  final String? categorie;
  final String? titre;
  final String message;
  final bool lue;
  final int? referenceId;
  final String? referenceType;
  final Map<String, dynamic> metadata;
  final DateTime? createdAt;

  AppNotification({
    required this.notificationId,
    required this.notificationUuid,
    required this.typeNotification,
    this.categorie,
    this.titre,
    required this.message,
    required this.lue,
    this.referenceId,
    this.referenceType,
    this.metadata = const {},
    this.createdAt,
  });

  /// commandeUuid stocké en metadata par le backend (notif DEMANDE_AVIS),
  /// utilisé pour ouvrir directement l'écran de notation.
  String? get commandeUuid => metadata['commandeUuid'] as String?;

  bool get isDemandeAvis => categorie == 'DEMANDE_AVIS';

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      notificationId: (json['notificationId'] as num?)?.toInt() ?? 0,
      notificationUuid: json['notificationUuid'] ?? '',
      typeNotification: json['typeNotification'] ?? '',
      categorie: json['categorie'],
      titre: json['titre'],
      message: json['message'] ?? '',
      lue: json['lue'] == true,
      referenceId: (json['referenceId'] as num?)?.toInt(),
      referenceType: json['referenceType'],
      metadata: _parseMetadata(json['metadata']),
      createdAt: _parseDateTime(json['createdAt']),
    );
  }

  /// metadata peut arriver en String JSON (jsonb::text) ou déjà en Map.
  static Map<String, dynamic> _parseMetadata(dynamic value) {
    if (value == null) return const {};
    if (value is Map<String, dynamic>) return value;
    if (value is String && value.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is Map<String, dynamic>) return decoded;
      } catch (_) {}
    }
    return const {};
  }

  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is String) return DateTime.tryParse(value);
    if (value is num) {
      final ms = value > 1e12 ? value.toInt() : (value * 1000).toInt();
      return DateTime.fromMillisecondsSinceEpoch(ms);
    }
    if (value is List && value.length >= 3) {
      int at(int i) => i < value.length ? (value[i] as num).toInt() : 0;
      return DateTime(at(0), at(1), at(2), at(3), at(4), at(5));
    }
    return null;
  }

  /// Date relative courte ("À l'instant", "il y a 3h", "il y a 2j") sinon date.
  String get relativeTime {
    if (createdAt == null) return '';
    final diff = DateTime.now().difference(createdAt!);
    if (diff.inMinutes < 1) return "À l'instant";
    if (diff.inMinutes < 60) return 'il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'il y a ${diff.inHours} h';
    if (diff.inDays < 7) return 'il y a ${diff.inDays} j';
    final d = createdAt!;
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }
}

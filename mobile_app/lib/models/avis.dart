class Avis {
  final String avisUuid;
  final int note;
  final String? commentaire;
  final String? reponse;
  final String userFullName;
  final String? createdAt;

  Avis({
    required this.avisUuid,
    required this.note,
    this.commentaire,
    this.reponse,
    required this.userFullName,
    this.createdAt,
  });

  factory Avis.fromJson(Map<String, dynamic> json) {
    return Avis(
      avisUuid: json['avisUuid'] ?? '',
      note: json['note'] ?? 0,
      commentaire: json['commentaire'],
      reponse: json['reponse'],
      userFullName: json['userFullName'] ?? 'Anonyme',
      createdAt: _parseDateTime(json['createdAt']),
    );
  }

  /// Formats the createdAt into a readable date string.
  String get dateFormatted {
    if (createdAt == null) return '';
    try {
      final dt = DateTime.parse(createdAt!);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return '';
    }
  }

  /// Parses createdAt which may be a numeric epoch (seconds) or a string.
  static String? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is String) return value;
    if (value is num) {
      final ms = value > 1e12 ? value.toInt() : (value * 1000).toInt();
      return DateTime.fromMillisecondsSinceEpoch(ms).toIso8601String();
    }
    return value.toString();
  }
}

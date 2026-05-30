/// DTO de requête pour `POST /immo/proprietes/{uuid}/visites`.
///
/// Conforme à `VisiteCreateRequest.java` côté backend :
/// - `dateVisite` : LocalDate FutureOrPresent (aujourd'hui ou plus tard)
/// - `heureVisite` : LocalTime optionnel
/// - `notesVisiteur` : ≤1000 chars optionnel
///
/// Formats sérialisés :
/// - dateVisite : "yyyy-MM-dd" (ISO LocalDate)
/// - heureVisite : "HH:mm:ss" (ISO LocalTime) si non-null
class VisiteCreateRequest {
  final DateTime dateVisite;
  final String? heureVisite;     // "HH:mm:ss" ou null
  final String? notesVisiteur;

  const VisiteCreateRequest({
    required this.dateVisite,
    this.heureVisite,
    this.notesVisiteur,
  });

  Map<String, dynamic> toJson() => {
        'dateVisite': _formatDate(dateVisite),
        if (heureVisite != null) 'heureVisite': heureVisite,
        if (notesVisiteur != null && notesVisiteur!.isNotEmpty)
          'notesVisiteur': notesVisiteur,
      };

  static String _formatDate(DateTime d) {
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }
}

/// Formatage des dates en français — sans dépendance au package `intl` pour
/// éviter une modif pubspec en 15.1. Si on ajoute `intl` plus tard pour i18n,
/// migrer vers DateFormat (les signatures publiques de cette classe restent valides).
class DateFormatter {
  DateFormatter._();

  static const List<String> _moisLong = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];

  /// `15 juin 2026`.
  static String long(DateTime date) {
    return '${date.day} ${_moisLong[date.month - 1]} ${date.year}';
  }

  /// `15/06/2026`.
  static String short(DateTime date) {
    final d = date.day.toString().padLeft(2, '0');
    final m = date.month.toString().padLeft(2, '0');
    return '$d/$m/${date.year}';
  }

  /// `15h30`.
  static String time(DateTime date) {
    final h = date.hour.toString().padLeft(2, '0');
    final m = date.minute.toString().padLeft(2, '0');
    return '${h}h$m';
  }

  /// `15 juin 2026 à 15h30`.
  static String longWithTime(DateTime date) => '${long(date)} à ${time(date)}';

  /// Relatif au présent : `à l'instant`, `il y a 5 min`, `il y a 3 j`.
  /// Au-delà de 7 jours, retombe sur [short]. Passer [now] pour les tests.
  static String relative(DateTime date, {DateTime? now}) {
    final reference = now ?? DateTime.now();
    final diff = reference.difference(date);
    final seconds = diff.inSeconds.abs();
    if (seconds < 60) return "à l'instant";
    final minutes = diff.inMinutes.abs();
    if (minutes < 60) return 'il y a $minutes min';
    final hours = diff.inHours.abs();
    if (hours < 24) return 'il y a $hours h';
    final days = diff.inDays.abs();
    if (days < 7) return 'il y a $days j';
    return short(date);
  }
}

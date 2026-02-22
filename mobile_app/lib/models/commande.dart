import 'billet.dart';

class Commande {
  final String commandeUuid;
  final String numeroCommande;
  final int nombrePlaces;
  final double montantTotal;
  final double montantPaye;
  final String devise;
  final String statut;
  final String? referencePaiement;
  final String? offreUuid;
  final DateTime dateDepart;
  final String heureDepart;
  final String villeDepartLibelle;
  final String villeArriveeLibelle;
  final String? siteDepart;
  final String? siteArrivee;
  final String? vehiculeImmatriculation;
  final String? nomChauffeur;
  final String? contactChauffeur;
  final List<Billet> billets;
  final String? createdAt;

  Commande({
    required this.commandeUuid,
    required this.numeroCommande,
    required this.nombrePlaces,
    required this.montantTotal,
    required this.montantPaye,
    required this.devise,
    required this.statut,
    this.referencePaiement,
    this.offreUuid,
    required this.dateDepart,
    required this.heureDepart,
    required this.villeDepartLibelle,
    required this.villeArriveeLibelle,
    this.siteDepart,
    this.siteArrivee,
    this.vehiculeImmatriculation,
    this.nomChauffeur,
    this.contactChauffeur,
    this.billets = const [],
    this.createdAt,
  });

  bool get isCancelled => statut == 'ANNULEE' || statut == 'REMBOURSEE';

  bool get isActive {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final isUpcomingDate =
        dateDepart.isAtSameMomentAs(today) || dateDepart.isAfter(today);
    final isActiveStatut =
        statut == 'CONFIRMEE' || statut == 'PAYEE' || statut == 'EN_ATTENTE';
    return isUpcomingDate && isActiveStatut && !isCancelled;
  }

  bool get isPast => !isActive && !isCancelled;

  bool get canCancel {
    if (createdAt == null) return false;
    final created = DateTime.tryParse(createdAt!);
    if (created == null) return false;
    return isActive && DateTime.now().difference(created).inHours < 48;
  }

  static DateTime _parseDate(dynamic value) {
    if (value is String) return DateTime.tryParse(value) ?? DateTime.now();
    if (value is List && value.length >= 3) {
      return DateTime(value[0] as int, value[1] as int, value[2] as int);
    }
    return DateTime.now();
  }

  static String? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is String) return value;
    if (value is List && value.length >= 3) {
      final y = value[0] as int;
      final m = (value[1] as int).toString().padLeft(2, '0');
      final d = (value[2] as int).toString().padLeft(2, '0');
      final h = value.length > 3 ? (value[3] as int).toString().padLeft(2, '0') : '00';
      final min = value.length > 4 ? (value[4] as int).toString().padLeft(2, '0') : '00';
      final s = value.length > 5 ? (value[5] as int).toString().padLeft(2, '0') : '00';
      return '$y-$m-${d}T$h:$min:$s';
    }
    return value.toString();
  }

  static String _parseTime(dynamic value) {
    if (value is String) {
      return value.length >= 5 ? value.substring(0, 5) : value;
    }
    if (value is List && value.length >= 2) {
      final h = value[0].toString().padLeft(2, '0');
      final m = value[1].toString().padLeft(2, '0');
      return '$h:$m';
    }
    return '00:00';
  }

  factory Commande.fromJson(Map<String, dynamic> json) {
    final billetsJson = json['billets'] as List<dynamic>? ?? [];
    return Commande(
      commandeUuid: json['commandeUuid'] ?? '',
      numeroCommande: json['numeroCommande'] ?? '',
      nombrePlaces: json['nombrePlaces'] ?? 1,
      montantTotal: (json['montantTotal'] is num)
          ? (json['montantTotal'] as num).toDouble()
          : double.tryParse(json['montantTotal']?.toString() ?? '0') ?? 0,
      montantPaye: (json['montantPaye'] is num)
          ? (json['montantPaye'] as num).toDouble()
          : double.tryParse(json['montantPaye']?.toString() ?? '0') ?? 0,
      devise: json['devise'] ?? 'GNF',
      statut: json['statut'] ?? 'EN_ATTENTE',
      referencePaiement: json['referencePaiement'],
      offreUuid: json['offreUuid'],
      dateDepart: _parseDate(json['dateDepart']),
      heureDepart: _parseTime(json['heureDepart']),
      villeDepartLibelle: json['villeDepartLibelle'] ?? '',
      villeArriveeLibelle: json['villeArriveeLibelle'] ?? '',
      siteDepart: json['siteDepart'],
      siteArrivee: json['siteArrivee'],
      vehiculeImmatriculation: json['vehiculeImmatriculation'],
      nomChauffeur: json['nomChauffeur'],
      contactChauffeur: json['contactChauffeur'],
      billets: billetsJson
          .map((b) => Billet.fromJson(b as Map<String, dynamic>))
          .toList(),
      createdAt: _parseDateTime(json['createdAt']),
    );
  }
}

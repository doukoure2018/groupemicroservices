/// Déclaration de besoin d'un client (V32 backend).
///
/// Créée via `POST /immo/demandes`, diffusée par email aux agences vérifiées
/// de la zone (commune → région → toutes) et consultable côté client via
/// `GET /immo/demandes/mes-demandes`.
class DemandeBesoin {
  final String demandeUuid;
  final String reference; // DEM-YYYYMMDD-XXXX
  final String typeAnnonce; // LOCATION | ACHAT
  final int? typeBienId;
  final int? communeId; // null si commune saisie librement (V34)
  final int? quartierId;
  final num? budgetMin;
  final num? budgetMax;
  final String devise;
  final int? nbChambresMin;
  final String? description;
  final String? contactTelephone;
  final String? contactWhatsapp;
  final String statut; // ACTIVE | POURVUE | ANNULEE | EXPIREE
  final DateTime? createdAt;

  // Libellés enrichis par le backend (jointures référentiel)
  final String? communeLibelle;
  final String? quartierLibelle;
  final String? typeBienLibelle;
  final String? regionLibelle;

  const DemandeBesoin({
    required this.demandeUuid,
    required this.reference,
    required this.typeAnnonce,
    this.typeBienId,
    this.communeId,
    this.quartierId,
    this.budgetMin,
    this.budgetMax,
    required this.devise,
    this.nbChambresMin,
    this.description,
    this.contactTelephone,
    this.contactWhatsapp,
    required this.statut,
    this.createdAt,
    this.communeLibelle,
    this.quartierLibelle,
    this.typeBienLibelle,
    this.regionLibelle,
  });

  factory DemandeBesoin.fromJson(Map<String, dynamic> json) => DemandeBesoin(
        demandeUuid: json['demandeUuid'] as String,
        reference: json['reference'] as String? ?? '',
        typeAnnonce: json['typeAnnonce'] as String,
        typeBienId: json['typeBienId'] as int?,
        communeId: json['communeId'] as int?,
        quartierId: json['quartierId'] as int?,
        budgetMin: json['budgetMin'] as num?,
        budgetMax: json['budgetMax'] as num?,
        devise: json['devise'] as String? ?? 'GNF',
        nbChambresMin: json['nbChambresMin'] as int?,
        description: json['description'] as String?,
        contactTelephone: json['contactTelephone'] as String?,
        contactWhatsapp: json['contactWhatsapp'] as String?,
        statut: json['statut'] as String? ?? 'ACTIVE',
        createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null,
        communeLibelle: json['communeLibelle'] as String?,
        quartierLibelle: json['quartierLibelle'] as String?,
        typeBienLibelle: json['typeBienLibelle'] as String?,
        regionLibelle: json['regionLibelle'] as String?,
      );

  bool get estActive => statut == 'ACTIVE';

  /// Zone lisible : « Nongo, Ratoma » ou « Ratoma ».
  String get zoneLibelle {
    final commune = communeLibelle ?? '';
    final quartier = quartierLibelle;
    return quartier != null && quartier.isNotEmpty ? '$quartier, $commune' : commune;
  }
}

/// Body de `POST /immo/demandes` — miroir du DTO backend DemandeCreateRequest.
/// V34 : commune/quartier soit par id (référentiel), soit en texte libre.
class DemandeCreateRequest {
  final String typeAnnonce; // LOCATION | ACHAT (⚠️ pas VENTE)
  final int? typeBienId;
  final int? communeId;
  final String? communeTexte; // requis si communeId absent
  final int? quartierId;
  final String? quartierTexte;
  final num? budgetMin;
  final num? budgetMax;
  final int? nbChambresMin;
  final List<int> commoditeIds;
  final String? description;
  final String? contactTelephone;
  final String? contactWhatsapp;

  const DemandeCreateRequest({
    required this.typeAnnonce,
    this.typeBienId,
    this.communeId,
    this.communeTexte,
    this.quartierId,
    this.quartierTexte,
    this.budgetMin,
    this.budgetMax,
    this.nbChambresMin,
    this.commoditeIds = const [],
    this.description,
    this.contactTelephone,
    this.contactWhatsapp,
  });

  Map<String, dynamic> toJson() => {
        'typeAnnonce': typeAnnonce,
        if (typeBienId != null) 'typeBienId': typeBienId,
        if (communeId != null) 'communeId': communeId,
        if (communeTexte != null && communeTexte!.isNotEmpty) 'communeTexte': communeTexte,
        if (quartierId != null) 'quartierId': quartierId,
        if (quartierTexte != null && quartierTexte!.isNotEmpty) 'quartierTexte': quartierTexte,
        if (budgetMin != null) 'budgetMin': budgetMin,
        if (budgetMax != null) 'budgetMax': budgetMax,
        if (nbChambresMin != null) 'nbChambresMin': nbChambresMin,
        if (commoditeIds.isNotEmpty) 'commoditeIds': commoditeIds,
        if (description != null && description!.isNotEmpty) 'description': description,
        if (contactTelephone != null && contactTelephone!.isNotEmpty) 'contactTelephone': contactTelephone,
        if (contactWhatsapp != null && contactWhatsapp!.isNotEmpty) 'contactWhatsapp': contactWhatsapp,
      };
}

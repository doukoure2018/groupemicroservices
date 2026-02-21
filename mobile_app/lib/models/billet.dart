class Billet {
  final String? billetUuid;
  final String codeBillet;
  final String? numeroSiege;
  final String nomPassager;
  final String? telephonePassager;
  final String? pieceIdentite;
  final String statut;
  final String? qrCodeData;
  final String? createdAt;

  Billet({
    this.billetUuid,
    required this.codeBillet,
    this.numeroSiege,
    required this.nomPassager,
    this.telephonePassager,
    this.pieceIdentite,
    this.statut = 'ACTIF',
    this.qrCodeData,
    this.createdAt,
  });

  /// Data to encode in QR code: qrCodeData if set by backend, otherwise codeBillet.
  String get qrContent =>
      qrCodeData?.isNotEmpty == true ? qrCodeData! : codeBillet;

  factory Billet.fromJson(Map<String, dynamic> json) {
    return Billet(
      billetUuid: json['billetUuid'],
      codeBillet: json['codeBillet'] ?? '',
      numeroSiege: json['numeroSiege'],
      nomPassager: json['nomPassager'] ?? '',
      telephonePassager: json['telephonePassager'],
      pieceIdentite: json['pieceIdentite'],
      statut: json['statut'] ?? 'ACTIF',
      qrCodeData: json['qrCodeData'],
      createdAt: json['createdAt']?.toString(),
    );
  }
}

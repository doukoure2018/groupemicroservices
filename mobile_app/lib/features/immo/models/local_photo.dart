/// Photo locale pickée pendant le wizard publication, AVANT upload MinIO.
///
/// Fichier persisté dans `ApplicationDocumentsDirectory/wizard_photos/` —
/// survit au kill app + reprise brouillon (décision option b, cf.
/// [[wizard-publication-photo-persistence]] en mémoire).
///
/// [estCouverture] est un FLAG, PAS une fonction de l'index. Le reorder de
/// la liste ne touche QUE l'ordre — la couverture reste sur la même photo,
/// pas sur la photo à l'index 0. C'est explicite par design en 15.2e-3 pour
/// éviter le bug classique où drag-drop redéfinit la couverture par erreur.
class LocalPhoto {
  final String path;
  final int ordre;
  final bool estCouverture;
  final int pickedAtMillis;

  const LocalPhoto({
    required this.path,
    required this.ordre,
    required this.estCouverture,
    required this.pickedAtMillis,
  });

  LocalPhoto copyWith({int? ordre, bool? estCouverture}) => LocalPhoto(
        path: path,
        ordre: ordre ?? this.ordre,
        estCouverture: estCouverture ?? this.estCouverture,
        pickedAtMillis: pickedAtMillis,
      );

  factory LocalPhoto.fromJson(Map<String, dynamic> json) => LocalPhoto(
        path: json['path'] as String,
        ordre: json['ordre'] as int? ?? 0,
        estCouverture: json['estCouverture'] as bool? ?? false,
        pickedAtMillis: json['pickedAtMillis'] as int? ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'path': path,
        'ordre': ordre,
        'estCouverture': estCouverture,
        'pickedAtMillis': pickedAtMillis,
      };
}

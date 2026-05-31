/// État immuable des filtres de recherche immo (15.2c + Géoloc-2B).
///
/// Backend expose 17 params ; surface actuellement (Géoloc-2B comprise) :
///   - typeAnnonce (LOCATION / VENTE / null = tous)
///   - typeBienCodes (multi-select sur MAISON/APPARTEMENT/...)
///   - prixMin / prixMax (intervalle GNF)
///   - chambresMin (entier 1/2/3+)
///   - q (recherche libre)
///   - lat / lng / rayonKm (filtre distance, Géoloc-2B). geoActive = les 3
///     ensemble. Backend auto-sélectionne tri DISTANCE_ASC si lat+lng.
///
/// Les autres params backend (devise, surfaceMin, commodites, villeUuid/
/// communeUuid/quartierUuid, dureeLocation, trier) seront ajoutés dans des
/// phases ultérieures avec leur UI dédiée.
class RechercheFiltres {
  final String? typeAnnonce;
  final List<String> typeBienCodes;
  final int? prixMin;
  final int? prixMax;
  final int? chambresMin;
  final String? q;
  final double? lat;
  final double? lng;
  final int? rayonKm;

  const RechercheFiltres({
    this.typeAnnonce,
    this.typeBienCodes = const [],
    this.prixMin,
    this.prixMax,
    this.chambresMin,
    this.q,
    this.lat,
    this.lng,
    this.rayonKm,
  });

  RechercheFiltres copyWith({
    Object? typeAnnonce = _sentinel,
    List<String>? typeBienCodes,
    Object? prixMin = _sentinel,
    Object? prixMax = _sentinel,
    Object? chambresMin = _sentinel,
    Object? q = _sentinel,
    Object? lat = _sentinel,
    Object? lng = _sentinel,
    Object? rayonKm = _sentinel,
  }) {
    return RechercheFiltres(
      typeAnnonce: typeAnnonce == _sentinel ? this.typeAnnonce : typeAnnonce as String?,
      typeBienCodes: typeBienCodes ?? this.typeBienCodes,
      prixMin: prixMin == _sentinel ? this.prixMin : prixMin as int?,
      prixMax: prixMax == _sentinel ? this.prixMax : prixMax as int?,
      chambresMin: chambresMin == _sentinel ? this.chambresMin : chambresMin as int?,
      q: q == _sentinel ? this.q : q as String?,
      lat: lat == _sentinel ? this.lat : lat as double?,
      lng: lng == _sentinel ? this.lng : lng as double?,
      rayonKm: rayonKm == _sentinel ? this.rayonKm : rayonKm as int?,
    );
  }

  static const _sentinel = Object();

  /// Géolocalisation active : les 3 champs présents simultanément. C'est
  /// la condition pour que le backend applique ST_DWithin + tri
  /// DISTANCE_ASC.
  bool get geoActive => lat != null && lng != null && rayonKm != null;

  /// Nombre de groupes de filtres actifs (typeAnnonce + types + prix range +
  /// chambres + q + geo comptent chacun 1, même si plusieurs typeBienCodes).
  ///
  /// Géoloc-2B : `geoActive` ajoute 1 au compteur. Le badge "Filtres (N)"
  /// inclut donc TOUT — le raccourci AppBar "Près de moi" reste un toggle
  /// visuellement neutre (pas d'indicateur d'état) pour éviter le
  /// double-affichage de l'info.
  int get activeCount {
    var n = 0;
    if (typeAnnonce != null) n++;
    if (typeBienCodes.isNotEmpty) n++;
    if (prixMin != null || prixMax != null) n++;
    if (chambresMin != null) n++;
    if (q != null && q!.trim().isNotEmpty) n++;
    if (geoActive) n++;
    return n;
  }

  bool get isEmpty => activeCount == 0;
}

/// État immuable des filtres de recherche immo (15.2c).
///
/// Backend expose 17 params ; 15.2c en surface 5 :
///   - typeAnnonce (LOCATION / VENTE / null = tous)
///   - typeBienCodes (multi-select sur MAISON/APPARTEMENT/...)
///   - prixMin / prixMax (intervalle GNF)
///   - chambresMin (entier 1/2/3+)
///   - q (recherche libre)
///
/// Les autres params backend (devise, surfaceMin, commodites, lat/lng/rayon,
/// villeUuid/communeUuid/quartierUuid, dureeLocation, trier) seront ajoutés
/// dans des phases ultérieures avec leur UI dédiée.
class RechercheFiltres {
  final String? typeAnnonce;
  final List<String> typeBienCodes;
  final int? prixMin;
  final int? prixMax;
  final int? chambresMin;
  final String? q;

  const RechercheFiltres({
    this.typeAnnonce,
    this.typeBienCodes = const [],
    this.prixMin,
    this.prixMax,
    this.chambresMin,
    this.q,
  });

  RechercheFiltres copyWith({
    Object? typeAnnonce = _sentinel,
    List<String>? typeBienCodes,
    Object? prixMin = _sentinel,
    Object? prixMax = _sentinel,
    Object? chambresMin = _sentinel,
    Object? q = _sentinel,
  }) {
    return RechercheFiltres(
      typeAnnonce: typeAnnonce == _sentinel ? this.typeAnnonce : typeAnnonce as String?,
      typeBienCodes: typeBienCodes ?? this.typeBienCodes,
      prixMin: prixMin == _sentinel ? this.prixMin : prixMin as int?,
      prixMax: prixMax == _sentinel ? this.prixMax : prixMax as int?,
      chambresMin: chambresMin == _sentinel ? this.chambresMin : chambresMin as int?,
      q: q == _sentinel ? this.q : q as String?,
    );
  }

  static const _sentinel = Object();

  /// Nombre de groupes de filtres actifs (typeAnnonce + types + prix range +
  /// chambres + q comptent chacun 1, même si plusieurs typeBienCodes).
  int get activeCount {
    var n = 0;
    if (typeAnnonce != null) n++;
    if (typeBienCodes.isNotEmpty) n++;
    if (prixMin != null || prixMax != null) n++;
    if (chambresMin != null) n++;
    if (q != null && q!.trim().isNotEmpty) n++;
    return n;
  }

  bool get isEmpty => activeCount == 0;
}

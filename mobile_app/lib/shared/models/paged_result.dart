/// Wrapper pagination cohérent avec les endpoints listants côté backend
/// (limit/offset typés, total renvoyé).
///
/// Le nom de la clé de la liste varie selon l'endpoint
/// ("contacts", "visites", "proprietes", etc.) — passé en paramètre à [fromJson].
class PagedResult<T> {
  final List<T> items;
  final int total;
  final int limit;
  final int offset;

  const PagedResult({
    required this.items,
    required this.total,
    required this.limit,
    required this.offset,
  });

  bool get hasMore => offset + items.length < total;

  factory PagedResult.fromJson(
    Map<String, dynamic> json,
    String itemsKey,
    T Function(Map<String, dynamic>) itemParser,
  ) {
    final rawList = (json[itemsKey] as List<dynamic>?) ?? const [];
    final items = rawList.map((e) => itemParser(e as Map<String, dynamic>)).toList();
    return PagedResult<T>(
      items: items,
      total: (json['total'] as num?)?.toInt() ?? items.length,
      limit: (json['limit'] as num?)?.toInt() ?? items.length,
      offset: (json['offset'] as num?)?.toInt() ?? 0,
    );
  }
}

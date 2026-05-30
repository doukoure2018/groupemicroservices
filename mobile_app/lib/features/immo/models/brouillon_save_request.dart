/// DTO de requête pour `POST /immo/brouillons` et `PUT /immo/brouillons/{uuid}`.
///
/// Conforme à `BrouillonSaveRequest.java` côté backend :
/// - etapeActuelle : 1..4 (NotNull, Min 1 Max 4)
/// - donneesJson : Map libre (NotNull, mais peut être {})
class BrouillonSaveRequest {
  final int etapeActuelle;
  final Map<String, dynamic> donneesJson;

  const BrouillonSaveRequest({
    required this.etapeActuelle,
    required this.donneesJson,
  });

  Map<String, dynamic> toJson() => {
        'etapeActuelle': etapeActuelle,
        'donneesJson': donneesJson,
      };
}

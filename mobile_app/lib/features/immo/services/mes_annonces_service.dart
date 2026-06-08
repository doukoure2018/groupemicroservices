import '../models/brouillon.dart';
import '../models/propriete.dart';
import 'brouillon_service.dart';
import 'propriete_service.dart';

/// Conteneur des 3 listes affichées sur l'écran Mes annonces.
/// Tri intra-liste : created_at DESC côté backend.
class MesAnnoncesData {
  final List<Brouillon> brouillons;
  final List<Propriete> enCours; // EN_ATTENTE_VALIDATION + PUBLIE + RESERVE
  final List<Propriete> rejetees; // RETIRE avec motifRejet renseigné

  const MesAnnoncesData({
    required this.brouillons,
    required this.enCours,
    required this.rejetees,
  });

  int get total => brouillons.length + enCours.length + rejetees.length;

  /// Liste vide pour l'état initial / erreur (avant load).
  static const empty = MesAnnoncesData(
    brouillons: [],
    enCours: [],
    rejetees: [],
  );
}

/// Agrège les 2 sources backend (brouillons + mes-proprietes) en 3 sections
/// pour l'écran Mes annonces. Le filtrage statut → section se fait ici, le
/// backend ne supporte pas de filtre statut côté `mesProprietes`.
class MesAnnoncesService {
  final BrouillonService _brouillonService;
  final ProprieteService _proprieteService;

  MesAnnoncesService({
    BrouillonService? brouillonService,
    ProprieteService? proprieteService,
  })  : _brouillonService = brouillonService ?? BrouillonService(),
        _proprieteService = proprieteService ?? ProprieteService();

  /// Fetch parallèle des 2 sources puis bucketing par statut.
  Future<MesAnnoncesData> fetchAll() async {
    final results = await Future.wait([
      _brouillonService.mes(),
      _proprieteService.mesProprietes(),
    ]);
    final brouillons = results[0] as List<Brouillon>;
    final proprietes = results[1] as List<Propriete>;

    final enCours = <Propriete>[];
    final rejetees = <Propriete>[];
    for (final p in proprietes) {
      switch (p.statut) {
        case 'EN_ATTENTE_VALIDATION':
        case 'PUBLIE':
        case 'RESERVE':
          enCours.add(p);
          break;
        case 'RETIRE':
          rejetees.add(p);
          break;
        // Autres statuts (BROUILLON côté Propriete = brouillon matérialisé
        // mais non encore publié) : skip MVP — il sera traité par section
        // "Brouillons" si on a aussi un Brouillon associé, sinon orphelin
        // (dette wizard-publication-brouillon-orpheline-debt).
      }
    }

    return MesAnnoncesData(
      brouillons: brouillons,
      enCours: enCours,
      rejetees: rejetees,
    );
  }
}

import 'package:flutter/material.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/app_empty_state.dart';
import '../../../shared/widgets/app_error.dart';
import '../../../shared/widgets/app_loading.dart';
import '../models/propriete.dart';
import '../models/recherche_filtres.dart';
import '../models/type_bien.dart';
import '../services/geo_service.dart';
import '../services/propriete_service.dart';
import '../widgets/filtres_sheet.dart';
import '../widgets/propriete_card.dart';
import '../widgets/propriete_card_compact.dart';
import 'fiche_propriete_screen.dart';

/// Écran de recherche immobilier — refonte design SIRA Phase A (2026-06-09).
///
/// Spec layout :
///   1. Header : "Localisation" petit + ville gros + dropdown + cloche notif
///      + bouton Filtres (tune) corail — recherche texte supprimée 2026-06-14.
///   2. 4 catégories rondes (Maison/Villa/Appartement/Bungalow)
///   4. Section "Recommandées" horizontal scroll (10 dernières publiées)
///   5. Section "À proximité" horizontal scroll (si geoActive) ou CTA activer
///   6. Liste "Toutes les annonces" verticale paginée
///
/// Palette : sarcelle #1F6F8B (primary) + corail #F26430 (secondary CTA).
class RechercheScreen extends StatefulWidget {
  const RechercheScreen({super.key});

  @override
  State<RechercheScreen> createState() => _RechercheScreenState();
}

class _RechercheScreenState extends State<RechercheScreen> {
  static const int _pageSize = 20;
  static const int _highlightSize = 10;
  // MVP : ville statique pour l'header. Selector réel = dette
  // mobile-recherche-ville-selector-future.
  static const String _villeAffichee = 'Conakry';

  final _service = ProprieteService();
  final _scrollController = ScrollController();

  bool _initialLoading = true;
  bool _loadingMore = false;
  AppException? _error;
  final List<Propriete> _items = [];
  int _total = 0;
  RechercheFiltres _filtres = const RechercheFiltres();
  Map<int, TypeBien> _typesById = const {};

  List<Propriete> _recommandees = const [];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadInitial();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final current = _scrollController.position.pixels;
    if (maxScroll - current < 300 &&
        !_loadingMore &&
        _items.length < _total) {
      _loadMore();
    }
  }

  Future<void> _loadInitial() async {
    setState(() {
      _initialLoading = true;
      _error = null;
      _items.clear();
      _total = 0;
    });
    try {
      final results = await Future.wait([
        _service.rechercher(limit: _pageSize, offset: 0, filtres: _filtres),
        if (_typesById.isEmpty) _service.listTypesBien(),
      ]);
      final paged = results[0] as dynamic;
      if (results.length > 1) {
        final types = results[1] as List<TypeBien>;
        _typesById = {for (final t in types) t.typeBienId: t};
      }
      if (!mounted) return;
      setState(() {
        _items.addAll(paged.items as List<Propriete>);
        _total = paged.total as int;
        _initialLoading = false;
      });
      _loadHighlights();
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _initialLoading = false;
      });
    }
  }

  /// Charge les "Recommandées" — 10 dernières annonces publiées (tri
   /// `date_publication DESC` côté backend, query existante). Best-effort :
   /// un échec n'invalide pas l'écran principal (`_items` déjà chargé).
  Future<void> _loadHighlights() async {
    try {
      final paged = await _service.rechercher(
        limit: _highlightSize,
        offset: 0,
        filtres: const RechercheFiltres(),
      );
      if (!mounted) return;
      setState(() => _recommandees = paged.items);
    } on AppException {
      // Best-effort : on garde _recommandees vide, la section ne s'affiche
      // pas (condition `if (_recommandees.isNotEmpty)` côté build).
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _items.length >= _total) return;
    setState(() => _loadingMore = true);
    try {
      final paged = await _service.rechercher(
        limit: _pageSize,
        offset: _items.length,
        filtres: _filtres,
      );
      if (!mounted) return;
      setState(() {
        _items.addAll(paged.items);
        _loadingMore = false;
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Erreur pagination : ${e.message}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  /// Toggle filtre catégorie typeBienCode. Combinable avec les autres filtres.
  /// Tap deux fois sur la même = retire le filtre.
  void _toggleCategorie(String code) {
    final current = List<String>.from(_filtres.typeBienCodes);
    if (current.contains(code)) {
      current.remove(code);
    } else {
      current.clear(); // mono-select MVP — UX plus lisible
      current.add(code);
    }
    setState(() => _filtres = _filtres.copyWith(typeBienCodes: current));
    _loadInitial();
  }

  Future<void> _openFilters() async {
    if (_typesById.isEmpty) {
      try {
        final types = await _service.listTypesBien();
        _typesById = {for (final t in types) t.typeBienId: t};
      } on AppException catch (_) {}
    }
    if (!mounted) return;
    final result = await showModalBottomSheet<RechercheFiltres>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => FiltresSheet(
        initial: _filtres,
        typesBien: _typesById.values.toList()
          ..sort((a, b) => a.libelle.compareTo(b.libelle)),
      ),
    );
    if (result != null && mounted) {
      setState(() => _filtres = result);
      _loadInitial();
    }
  }

  void _resetFiltres() {
    setState(() => _filtres = const RechercheFiltres());
    _loadInitial();
  }

  Future<void> _onTapCard(Propriete p) async {
    final result = await Navigator.of(context).push<bool?>(MaterialPageRoute(
      builder: (_) => FicheProprieteScreen(
        proprieteUuid: p.proprieteUuid,
        initialIsFavorite: p.isFavorite,
      ),
    ));
    if (result != null && mounted) {
      _patchFavori(p.proprieteUuid, result);
    }
  }

  void _onFavoriToggledFromCard(Propriete p, bool nouveau) {
    _patchFavori(p.proprieteUuid, nouveau);
  }

  void _patchFavori(String uuid, bool isFavorite) {
    void patch(List<Propriete> list) {
      final idx = list.indexWhere((e) => e.proprieteUuid == uuid);
      if (idx >= 0) list[idx] = list[idx].withFavorite(isFavorite);
    }

    setState(() {
      patch(_items);
      _recommandees = List<Propriete>.from(_recommandees);
      patch(_recommandees);
    });
  }

  /// Toggle géoloc piloté par l'icône header (T5). Activer = demande la
   /// position et applique lat/lng/rayonKm=5 sur les filtres. Désactiver =
   /// reset les 3 champs → la liste revient à "toutes annonces sans filtre
   /// distance". Rayon hardcodé 5km MVP (dette
   /// [[geoloc-rayon-user-configurable]]).
  Future<void> _toggleProximite() async {
    if (_filtres.geoActive) {
      setState(() => _filtres = _filtres.copyWith(
            lat: null,
            lng: null,
            rayonKm: null,
          ));
      _loadInitial();
      return;
    }
    final pos = await GeoService.getCurrentPosition(context);
    if (!mounted || pos == null) return;
    setState(() {
      _filtres = _filtres.copyWith(
        lat: pos.latitude,
        lng: pos.longitude,
        rayonKm: 5,
      );
    });
    _loadInitial();
  }

  void _voirToutRecommandees() {
    // MVP : juste scroll vers la section "Toutes les annonces" en bas.
    // Vrai écran dédié = dette mobile-recherche-voir-tout-section-screen.
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_initialLoading) {
      return const AppLoading(label: 'Chargement…');
    }
    if (_error != null) {
      return AppError(message: _error!.message, onRetry: _loadInitial);
    }
    return RefreshIndicator(
      onRefresh: _loadInitial,
      color: AppColors.secondary,
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverToBoxAdapter(child: _buildHeaderLocation()),
          SliverToBoxAdapter(child: _buildCategoriesRow()),
          if (_recommandees.isNotEmpty)
            SliverToBoxAdapter(
              child: _buildSectionHeader('Recommandées', _voirToutRecommandees),
            ),
          if (_recommandees.isNotEmpty)
            SliverToBoxAdapter(child: _buildHorizontalList(_recommandees)),
          SliverToBoxAdapter(child: _buildToutesTitle()),
          if (_items.isEmpty)
            SliverToBoxAdapter(
              child: SizedBox(height: 300, child: _buildEmptyState()),
            ),
          if (_items.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    if (index >= _items.length) return _buildPaginationFooter();
                    final p = _items[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ProprieteCard(
                        propriete: p,
                        typeBien: _typesById[p.typeBienId],
                        onTap: () => _onTapCard(p),
                        onFavoriToggled: (n) =>
                            _onFavoriToggledFromCard(p, n),
                      ),
                    );
                  },
                  childCount: _items.length + 1,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // -------------------- Header location --------------------

  Widget _buildHeaderLocation() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 16, 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Localisation',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.onBackground.withValues(alpha: 0.6),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      _villeAffichee,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.keyboard_arrow_down_rounded,
                        color: AppColors.primary, size: 20),
                  ],
                ),
              ],
            ),
          ),
          // Bouton géoloc — toggle filtre distance sur "Toutes les annonces".
          // Sarcelle si inactif, corail filled si actif. SnackBars de refus
          // géoloc / service off déjà gérés par GeoService.
          _headerCircleButton(
            icon: _filtres.geoActive
                ? Icons.my_location
                : Icons.my_location_outlined,
            color: _filtres.geoActive
                ? AppColors.secondary
                : AppColors.primary,
            onTap: _toggleProximite,
          ),
          const SizedBox(width: 10),
          // Cloche notification — visuel pour MVP (dette
          // [[mobile-notifications-bell-future]] pour la vraie feature).
          _headerCircleButton(
            icon: Icons.notifications_outlined,
            color: AppColors.primary,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Notifications — bientôt disponible'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
          const SizedBox(width: 10),
          // Bouton Filtres — remplace la barre de recherche supprimée. Corail
          // si des filtres sont actifs (+ badge du nombre). Ouvre FiltresSheet.
          _headerCircleButton(
            icon: Icons.tune,
            color: _filtres.isEmpty ? AppColors.primary : AppColors.secondary,
            onTap: _openFilters,
            badgeCount: _filtres.activeCount,
          ),
        ],
      ),
    );
  }

  /// Bouton rond blanc + ombre douce, icône colorée — utilisé pour les
   /// actions du header (géoloc, cloche).
  Widget _headerCircleButton({
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    int badgeCount = 0,
  }) {
    final button = Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(11),
            child: Icon(icon, color: color, size: 22),
          ),
        ),
      ),
    );
    if (badgeCount <= 0) return button;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        button,
        Positioned(
          top: -2,
          right: -2,
          child: Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: AppColors.secondary,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.surface, width: 1.5),
            ),
            constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
            child: Text(
              '$badgeCount',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 9,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // -------------------- 4 catégories rondes scrollable --------------------

  Widget _buildCategoriesRow() {
    // 7 types réels alignés sur la table immo_type_bien (BD vérifiée
    // 2026-06-11). Codes = typeBienCode du filtre backend (multi-select).
    final cats = <_Categorie>[
      _Categorie('Maison', 'MAISON', Icons.home_outlined),
      _Categorie('Appartement', 'APPARTEMENT', Icons.apartment_outlined),
      _Categorie('Immeuble', 'IMMEUBLE', Icons.location_city_outlined),
      _Categorie('Terrain', 'TERRAIN', Icons.landscape_outlined),
      _Categorie('Bureau', 'BUREAU', Icons.business_center_outlined),
      _Categorie('Boutique', 'BOUTIQUE', Icons.storefront_outlined),
      _Categorie('Chambre', 'CHAMBRE', Icons.bed_outlined),
    ];
    // 7 catégories → ListView horizontale scrollable (un Row ne tiendrait pas
    // sur la largeur téléphone). Toggle/sélection inchangés (_buildCategorieCircle).
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 18, 0, 8),
      child: SizedBox(
        height: 82,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: cats.length,
          separatorBuilder: (_, __) => const SizedBox(width: 20),
          itemBuilder: (_, i) {
            final c = cats[i];
            return _buildCategorieCircle(
                c, _filtres.typeBienCodes.contains(c.code));
          },
        ),
      ),
    );
  }

  Widget _buildCategorieCircle(_Categorie c, bool isSelected) {
    return GestureDetector(
      onTap: () => _toggleCategorie(c.code),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isSelected
                  ? AppColors.primary
                  : AppColors.primaryContainer,
              border: isSelected
                  ? Border.all(color: AppColors.primary, width: 2)
                  : null,
            ),
            child: Icon(
              c.icon,
              size: 24,
              color: isSelected ? Colors.white : AppColors.primary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            c.label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  // -------------------- Section header --------------------

  Widget _buildSectionHeader(
    String title,
    VoidCallback? onAction, {
    String? actionLabel = 'Voir tout',
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
            ),
          ),
          if (onAction != null && actionLabel != null)
            InkWell(
              onTap: onAction,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Text(
                  actionLabel,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    // Lien en vert (lisible sur blanc ; l'or clair manque de contraste).
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHorizontalList(List<Propriete> list) {
    return SizedBox(
      // 274 (vs 254) : la ligne compteur de vues ajoutée sous l'adresse de
      // ProprieteCardCompact a besoin de ~20px verticaux supplémentaires.
      height: 274,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: list.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final p = list[i];
          return ProprieteCardCompact(
            propriete: p,
            onTap: () => _onTapCard(p),
            onFavoriToggled: (n) => _onFavoriToggledFromCard(p, n),
          );
        },
      ),
    );
  }

  Widget _buildToutesTitle() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 12),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Toutes les annonces',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
            ),
          ),
          if (_total > 0)
            Text(
              '$_total résultat${_total > 1 ? 's' : ''}',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.onBackground,
                fontWeight: FontWeight.w500,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    if (_filtres.isEmpty) {
      return const AppEmptyState(
        icon: Icons.apartment_outlined,
        title: 'Aucune annonce disponible',
        subtitle: 'Revenez plus tard ou ajustez vos critères.',
      );
    }
    return AppEmptyState(
      icon: Icons.filter_alt_off_outlined,
      title: 'Aucun résultat',
      subtitle: 'Essayez d\'élargir vos filtres.',
      action: FilledButton.tonal(
        onPressed: _resetFiltres,
        child: const Text('Effacer les filtres'),
      ),
    );
  }

  Widget _buildPaginationFooter() {
    if (_loadingMore) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (_items.length < _total) {
      return const SizedBox(height: 16);
    }
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Center(
        child: Text(
          '${_items.length} sur $_total',
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.onBackground,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class _Categorie {
  final String label;
  final String code;
  final IconData icon;
  const _Categorie(this.label, this.code, this.icon);
}

import 'package:flutter/material.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/app_empty_state.dart';
import '../../../shared/widgets/app_error.dart';
import '../../../shared/widgets/app_loading.dart';
import '../models/propriete.dart';
import '../models/recherche_filtres.dart';
import '../models/type_bien.dart';
import '../services/propriete_service.dart';
import '../widgets/filtres_sheet.dart';
import '../widgets/propriete_card.dart';
import 'fiche_propriete_screen.dart';

/// Écran de recherche immobilier (15.2c). Liste de [Propriete] paginée avec
/// filtres exposés via bottom sheet ([FiltresSheet]).
///
/// State pattern : StatefulWidget + setState (cohérent legacy billetterie).
/// Pagination infinite scroll : `_loadMore()` déclenché à ~300 px du bottom.
class RechercheScreen extends StatefulWidget {
  const RechercheScreen({super.key});

  @override
  State<RechercheScreen> createState() => _RechercheScreenState();
}

class _RechercheScreenState extends State<RechercheScreen> {
  static const int _pageSize = 20;

  final _service = ProprieteService();
  final _scrollController = ScrollController();

  bool _initialLoading = true;
  bool _loadingMore = false;
  AppException? _error;
  final List<Propriete> _items = [];
  int _total = 0;
  RechercheFiltres _filtres = const RechercheFiltres();
  Map<int, TypeBien> _typesById = const {};

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
      // Charge types-bien en parallèle de la 1ère page recherche (1 RTT au lieu de 2).
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
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _initialLoading = false;
      });
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

  Future<void> _openFilters() async {
    if (_typesById.isEmpty) {
      // Charger les types si l'écran n'a pas encore eu une 1ère réponse OK.
      try {
        final types = await _service.listTypesBien();
        _typesById = {for (final t in types) t.typeBienId: t};
      } on AppException catch (_) {
        // Tant pis — on ouvre la sheet sans les types (le bloc "Type de bien" sera vide).
      }
    }
    if (!mounted) return;
    final result = await showModalBottomSheet<RechercheFiltres>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
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

  void _onTapCard(Propriete p) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => FicheProprieteScreen(proprieteUuid: p.proprieteUuid),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Immobilier'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: TextButton.icon(
              onPressed: _openFilters,
              icon: const Icon(Icons.tune),
              label: Text(_filtres.isEmpty
                  ? 'Filtres'
                  : 'Filtres (${_filtres.activeCount})'),
            ),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_initialLoading) {
      return const AppLoading(label: 'Chargement…');
    }
    if (_error != null) {
      return AppError(message: _error!.message, onRetry: _loadInitial);
    }
    if (_items.isEmpty) {
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
    return RefreshIndicator(
      onRefresh: _loadInitial,
      child: ListView.separated(
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        itemCount: _items.length + 1, // +1 pour le footer
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          if (index == _items.length) {
            // Footer : spinner si pagination en cours, ou compteur "N sur M".
            if (_loadingMore) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (_items.length < _total) {
              // Reached end of current items but more available — sera fetch
              // automatiquement par _onScroll quand l'utilisateur tire.
              return const SizedBox(height: 16);
            }
            return Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Center(
                child: Text(
                  '${_items.length} sur $_total',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            );
          }
          final p = _items[index];
          return ProprieteCard(
            propriete: p,
            typeBien: _typesById[p.typeBienId],
            onTap: () => _onTapCard(p),
          );
        },
      ),
    );
  }
}

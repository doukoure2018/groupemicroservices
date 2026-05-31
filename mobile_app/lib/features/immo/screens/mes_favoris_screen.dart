import 'package:flutter/material.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/app_empty_state.dart';
import '../../../shared/widgets/app_error.dart';
import '../../../shared/widgets/app_loading.dart';
import '../models/propriete.dart';
import '../models/type_bien.dart';
import '../services/favori_service.dart';
import '../services/propriete_service.dart';
import '../widgets/propriete_card.dart';
import 'fiche_propriete_screen.dart';

/// Écran "Mes favoris" — liste paginée des propriétés que l'utilisateur a
/// favoritées (Phase Favoris).
///
/// Pattern volontairement aligné sur [RechercheScreen] (mêmes infinite scroll,
/// AppError, AppEmptyState). Différences :
///   - Pas de filtres (pas de FiltresSheet)
///   - Pas de FAB Publier
///   - Toggle off l'étoile depuis une card retire l'item de la liste
///     (cohérent avec le sens "Mes favoris")
class MesFavorisScreen extends StatefulWidget {
  const MesFavorisScreen({super.key});

  @override
  State<MesFavorisScreen> createState() => _MesFavorisScreenState();
}

class _MesFavorisScreenState extends State<MesFavorisScreen> {
  static const int _pageSize = 20;

  final _favoriService = FavoriService();
  final _proprieteService = ProprieteService();
  final _scrollController = ScrollController();

  bool _initialLoading = true;
  bool _loadingMore = false;
  AppException? _error;
  final List<Propriete> _items = [];
  int _total = 0;
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
      // types-bien en parallèle pour libellé sur la card
      final results = await Future.wait([
        _favoriService.mesFavoris(limit: _pageSize, offset: 0),
        if (_typesById.isEmpty) _proprieteService.listTypesBien(),
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
      final paged = await _favoriService.mesFavoris(
        limit: _pageSize,
        offset: _items.length,
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

  Future<void> _onTapCard(Propriete p) async {
    final result = await Navigator.of(context).push<bool?>(MaterialPageRoute(
      builder: (_) => FicheProprieteScreen(
        proprieteUuid: p.proprieteUuid,
        initialIsFavorite: true, // on est dans Mes favoris, c'est garanti
      ),
    ));
    if (result == false && mounted) {
      // L'utilisateur a retiré le favori depuis la fiche → on retire l'item
      // de la liste pour rester cohérent avec le sens "Mes favoris".
      setState(() {
        _items.removeWhere((e) => e.proprieteUuid == p.proprieteUuid);
        _total = (_total - 1).clamp(0, _total);
      });
    } else if (result == true && mounted) {
      // Re-favori (cas rare : user a toggle off puis on dans la fiche).
      // Pas de changement de liste — l'item reste.
    }
  }

  void _onFavoriToggledFromCard(Propriete p, bool nouveau) {
    if (!nouveau) {
      // Toggle OFF depuis la card de Mes favoris = retrait immédiat de la liste.
      setState(() {
        _items.removeWhere((e) => e.proprieteUuid == p.proprieteUuid);
        _total = (_total - 1).clamp(0, _total);
      });
    }
    // (nouveau=true ne devrait pas arriver — l'item est déjà favori, le
    // toggle l'aurait passé à false. Sécurité défensive.)
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes favoris')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_initialLoading) return const AppLoading(label: 'Chargement…');
    if (_error != null) {
      return AppError(message: _error!.message, onRetry: _loadInitial);
    }
    if (_items.isEmpty) {
      return const AppEmptyState(
        icon: Icons.favorite_outline,
        title: 'Aucun favori',
        subtitle: 'Tapez ❤ sur une annonce dans la recherche pour l\'ajouter ici.',
      );
    }
    return RefreshIndicator(
      onRefresh: _loadInitial,
      child: ListView.separated(
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        itemCount: _items.length + 1,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          if (index == _items.length) {
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
            onFavoriToggled: (nouveau) => _onFavoriToggledFromCard(p, nouveau),
          );
        },
      ),
    );
  }
}

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../../../shared/widgets/app_error.dart';
import '../../../shared/widgets/app_loading.dart';
import '../models/commodite.dart';
import '../models/photo.dart';
import '../models/propriete.dart';
import '../models/type_bien.dart';
import '../services/favori_service.dart';
import '../services/propriete_service.dart';
import '../widgets/contacter_sheet.dart';
import '../widgets/favori_star_button.dart';
import '../widgets/share_button.dart';
import '../widgets/visite_sheet.dart';

/// Écran fiche détaillée d'une propriété (Phase 15.2d, finalisée en 15.2d-3).
///
/// Layout CustomScrollView + SliverAppBar pinné (expandedHeight 280) :
///   - Galerie photos en arrière-plan SliverAppBar (PageView + indicateur)
///   - Sections successives (Prix, Specs, Adresse, Description, Commodités, Vendeur)
///   - BottomAppBar sticky avec 2 actions : Contacter (OutlinedButton) + Visiter
///     (FilledButton, hiérarchie visuelle visiteur > contact). Affiché seulement
///     quand la fiche est chargée (pas pendant loading/error).
///
/// Tap sur une photo → ouvre [_FullscreenGallery] avec swipe horizontal + zoom
/// pinch via `photo_view`.
///
/// Sheets [ContacterSheet] et [VisiteSheet] renvoient `true` via Navigator.pop
/// quand le POST réussit (201). Le caller affiche un SnackBar succès. Sur
/// AppException, l'erreur s'affiche INLINE dans la sheet et la saisie est
/// préservée — l'utilisateur n'a pas à retaper après un timeout.
class FicheProprieteScreen extends StatefulWidget {
  final String proprieteUuid;

  /// État favori hérité de la card recherche (si on arrive depuis une liste).
  /// Permet d'afficher l'étoile correcte AVANT le retour du check() parallèle
  /// — pas de flicker. Si null (deep-link futur), on attend le check.
  final bool? initialIsFavorite;

  const FicheProprieteScreen({
    super.key,
    required this.proprieteUuid,
    this.initialIsFavorite,
  });

  @override
  State<FicheProprieteScreen> createState() => _FicheProprieteScreenState();
}

class _FicheProprieteScreenState extends State<FicheProprieteScreen>
    with SingleTickerProviderStateMixin {
  final _service = ProprieteService();
  final _favoriService = FavoriService();

  bool _loading = true;
  AppException? _error;
  Propriete? _propriete;
  Map<int, TypeBien> _typesById = const {};
  bool? _isFavorite;

  // Onglets fiche (B1) : index 0 = Aperçu, 1 = Galerie. Avis EXCLUS Phase B.
  late final TabController _tabController;

  // Contrôleur + index courant du PageView héro, remontés au parent (B3) pour
  // synchroniser le strip de mini-thumbnails avec le swipe de la photo héro.
  // ValueNotifier → seuls le strip et l'indicateur "N/M" se rebuildent au
  // swipe, pas tout le NestedScrollView.
  final PageController _photoController = PageController();
  final ValueNotifier<int> _photoIndex = ValueNotifier<int>(0);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _isFavorite = widget.initialIsFavorite; // valeur héritée, sera resync
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _photoController.dispose();
    _photoIndex.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // 3 requêtes parallèles : fiche détail + référentiel types-bien +
      // état favori frais. Le check() compense que GET /immo/proprietes/{uuid}
      // ne fait PAS le JOIN immo_favori (contrairement à la recherche).
      // Robuste aux deep-links futurs (WhatsApp share) où on n'a pas
      // initialIsFavorite.
      final results = await Future.wait([
        _service.findByUuid(widget.proprieteUuid),
        _service.listTypesBien(),
        _favoriService.check(widget.proprieteUuid).catchError((_) => false),
      ]);
      if (!mounted) return;
      setState(() {
        _propriete = results[0] as Propriete;
        final types = results[1] as List<TypeBien>;
        _typesById = {for (final t in types) t.typeBienId: t};
        _isFavorite = results[2] as bool;
        _loading = false;
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: AppLoading(label: 'Chargement…'));
    }
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(),
        body: AppError(message: _error!.message, onRetry: _load),
      );
    }
    final p = _propriete!;
    final typeBien = _typesById[p.typeBienId];
    return PopScope(
      // Quand l'utilisateur pop la fiche, on retourne l'état favori final
      // au caller (RechercheScreen ou MesFavorisScreen) pour patch local
      // sans refetch.
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {
        // didPop true = pop déjà effectué par le système. On ne peut plus
        // injecter un résultat ici. On gère via Navigator.pop explicite plus
        // bas si besoin — ici PopScope sert juste de hook pour la sémantique.
      },
      child: Scaffold(
        body: NestedScrollView(
          // B1 : héro dans le header, TabBar épinglée via `bottom:` du
          // SliverAppBar (pattern canonique NestedScrollView + onglets). Le
          // corps = TabBarView Aperçu/Galerie. Les sections existantes sont
          // déplacées telles quelles dans Aperçu (filet de sécurité — pas de
          // modif visuelle en B1). Strip thumbnails (B3) et en-tête regroupé
          // (B4) viendront s'insérer dans le header ensuite.
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverAppBar(
              expandedHeight: 280,
              pinned: true,
              backgroundColor: AppColors.surface,
              automaticallyImplyLeading: false,
              // B2 : overlays flottants sur la photo héro (retour / share /
              // favori) en pastilles circulaires noires 0.35 + icône blanche.
              // Titre retiré de la toolbar — il rejoint l'en-tête au-dessus des
              // tabs en B4, et reste affiché dans l'onglet Aperçu en attendant.
              leadingWidth: 56,
              leading: Center(
                child: Material(
                  color: Colors.black.withValues(alpha: 0.35),
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: () => Navigator.of(context).pop<bool?>(_isFavorite),
                    child: const Padding(
                      padding: EdgeInsets.all(8),
                      child: Icon(
                        Icons.arrow_back,
                        color: Colors.white,
                        size: 24,
                        shadows: [
                          Shadow(
                            color: Colors.black54,
                            blurRadius: 6,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              actions: [
                ShareButton(propriete: p, light: true),
                const SizedBox(width: 8),
                FavoriStarButton(
                  proprieteUuid: p.proprieteUuid,
                  isFavorite: _isFavorite ?? false,
                  light: true,
                  onChanged: (nouveau) {
                    // Met à jour le state local pour que le pop retourne la
                    // dernière valeur.
                    if (mounted) setState(() => _isFavorite = nouveau);
                  },
                ),
                const SizedBox(width: 12),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: _GalerieHeader(
                  photos: p.photos,
                  controller: _photoController,
                  indexNotifier: _photoIndex,
                ),
              ),
            ),
            // B3 : strip mini-thumbnails sous le héro (masqué si < 2 photos —
            // inutile pour une photo unique). Synchronisé au PageView héro via
            // _photoIndex ; tap → animateToPage.
            if (p.photos.length >= 2)
              SliverToBoxAdapter(
                child: _HeroThumbnailStrip(
                  photos: p.photos,
                  indexNotifier: _photoIndex,
                  onTap: (i) => _photoController.animateToPage(
                    i,
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeOut,
                  ),
                ),
              ),
            // B4 : en-tête (badge type + titre + adresse) entre le strip et les
            // tabs. Scrolle avec le contenu ; seule la TabBar reste épinglée.
            SliverToBoxAdapter(child: _SectionEnTete(propriete: p)),
            // TabBar sortie du `bottom:` du SliverAppBar (B3) pour laisser le
            // strip s'intercaler entre héro et tabs. Épinglée via délégué.
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabBarHeaderDelegate(
                TabBar(
                  controller: _tabController,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.onBackground,
                  indicatorColor: AppColors.secondary,
                  tabs: const [
                    Tab(text: 'Aperçu'),
                    Tab(text: 'Galerie'),
                  ],
                ),
              ),
            ),
          ],
          body: TabBarView(
            controller: _tabController,
            children: [_buildApercu(p, typeBien), _buildGalerie(p)],
          ),
        ),
        // B7 : barre CTA en Container (pas BottomAppBar, qui imposait une
        // hauteur fixe → overflow). Se dimensionne au contenu via mainAxisSize
        // .min ; SafeArea(top:false) gère l'inset de la nav gestuelle ; ombre
        // haute pour la séparation. Prix (ligne 1, sarcelle, + "Négociable" si
        // applicable) puis les 2 CTA Contacter/Visiter (ligne 2). Visiter
        // conservé — couplage fonctionnel existant préservé (décision Phase B).
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 8,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          _formatPrix(p),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                        ),
                      ),
                      if (p.prixNegociable) ...[
                        const SizedBox(width: 8),
                        Text(
                          'Négociable',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppColors.onBackground),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _openContacterSheet,
                          icon: const Icon(Icons.email_outlined),
                          label: const Text('Contacter'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(48),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _openVisiteSheet,
                          icon: const Icon(Icons.event_outlined),
                          label: const Text('Visiter'),
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(48),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openContacterSheet() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => ContacterSheet(
        proprieteUuid: widget.proprieteUuid,
        titreFiche: _propriete!.titre,
      ),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Demande de contact envoyée'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  Future<void> _openVisiteSheet() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => VisiteSheet(
        proprieteUuid: widget.proprieteUuid,
        titreFiche: _propriete!.titre,
      ),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Demande de visite envoyée'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  // -------------------- Onglet Aperçu (B1) --------------------
  // Reprend à l'identique l'ordre et les sections de l'ex-SliverList. Aucune
  // modif visuelle en B1 — restyle réparti sur B4..B6.
  Widget _buildApercu(Propriete p, TypeBien? typeBien) {
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        _SectionMeta(propriete: p),
        const _Divider(),
        _SectionSpecs(propriete: p, typeBien: typeBien),
        if (p.description != null && p.description!.trim().isNotEmpty) ...[
          const _Divider(),
          _SectionDescription(description: p.description!),
        ],
        if (p.commodites.isNotEmpty) ...[
          const _Divider(),
          _SectionCommodites(commodites: p.commodites),
        ],
        if (p.latitude != null && p.longitude != null) ...[
          const _Divider(),
          _SectionCarte(latitude: p.latitude!, longitude: p.longitude!),
        ],
        const _Divider(),
        _SectionVendeur(nomContactPublic: p.nomContactPublic),
        const SizedBox(height: 16),
      ],
    );
  }

  // -------------------- Onglet Galerie (B8) --------------------
  // Grille responsive : SliverGridDelegateWithMaxCrossAxisExtent (tuile cible
  // ~200px) → 2 colonnes sur téléphone, 3+ sur tablette, automatiquement.
  // Tuiles carrées, coins arrondis, tap → _FullscreenGallery existant
  // (affiche l'URL pleine résolution + pinch-zoom).
  Widget _buildGalerie(Propriete p) {
    if (p.photos.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.photo_library_outlined,
                  size: 48, color: AppColors.onBackground),
              SizedBox(height: 12),
              Text('Aucune photo disponible'),
            ],
          ),
        ),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 200,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 1,
      ),
      itemCount: p.photos.length,
      itemBuilder: (_, i) {
        final photo = p.photos[i];
        return GestureDetector(
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  _FullscreenGallery(photos: p.photos, initialIndex: i),
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: CachedNetworkImage(
              // Original (net en grille 200px) décodé à ~500px pour limiter la RAM.
              imageUrl: photo.url,
              fit: BoxFit.cover,
              filterQuality: FilterQuality.high,
              memCacheWidth: 500,
              placeholder: (_, __) => Container(color: AppColors.divider),
              errorWidget: (_, __, ___) => Container(
                color: AppColors.divider,
                alignment: Alignment.center,
                child: const Icon(
                  Icons.broken_image_outlined,
                  color: AppColors.onBackground,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

// ============================================================================
// Galerie photos (header SliverAppBar)
// ============================================================================

/// Header photo héro. B3 : state (PageController + index) remonté au parent
/// pour synchro avec le strip de thumbnails — ce widget devient stateless.
class _GalerieHeader extends StatelessWidget {
  final List<Photo> photos;
  final PageController controller;
  final ValueNotifier<int> indexNotifier;
  const _GalerieHeader({
    required this.photos,
    required this.controller,
    required this.indexNotifier,
  });

  @override
  Widget build(BuildContext context) {
    if (photos.isEmpty) {
      return Container(
        color: AppColors.divider,
        alignment: Alignment.center,
        child: const Icon(
          Icons.image_not_supported_outlined,
          size: 48,
          color: AppColors.onBackground,
        ),
      );
    }
    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          controller: controller,
          itemCount: photos.length,
          onPageChanged: (i) => indexNotifier.value = i,
          itemBuilder: (_, i) {
            final p = photos[i];
            return GestureDetector(
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      _FullscreenGallery(photos: photos, initialIndex: i),
                ),
              ),
              child: CachedNetworkImage(
                imageUrl: p.url,
                fit: BoxFit.cover,
                filterQuality: FilterQuality.high,
                fadeInDuration: const Duration(milliseconds: 200),
                placeholder: (_, __) => Container(color: AppColors.divider),
                errorWidget: (_, __, ___) => Container(
                  color: AppColors.divider,
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.broken_image_outlined,
                    size: 48,
                    color: AppColors.onBackground,
                  ),
                ),
              ),
            );
          },
        ),
        // Indicateur "N / M" — caché si une seule photo (esthétique). Se
        // rebuild seul via le notifier au swipe.
        if (photos.length >= 2)
          Positioned(
            right: 16,
            bottom: 16,
            child: ValueListenableBuilder<int>(
              valueListenable: indexNotifier,
              builder: (_, idx, __) => Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${idx + 1} / ${photos.length}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Strip horizontal de mini-thumbnails sous le héro (B3). Surligne la photo
/// courante (bordure corail) et synchronise le PageView héro au tap.
class _HeroThumbnailStrip extends StatelessWidget {
  final List<Photo> photos;
  final ValueNotifier<int> indexNotifier;
  final ValueChanged<int> onTap;
  const _HeroThumbnailStrip({
    required this.photos,
    required this.indexNotifier,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72,
      color: AppColors.surface,
      child: ValueListenableBuilder<int>(
        valueListenable: indexNotifier,
        builder: (_, current, __) => ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          itemCount: photos.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, i) {
            final selected = i == current;
            return GestureDetector(
              onTap: () => onTap(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 64,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: selected ? AppColors.secondary : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: CachedNetworkImage(
                    imageUrl: photos[i].urlThumbnail,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: AppColors.divider),
                    errorWidget: (_, __, ___) => Container(
                      color: AppColors.divider,
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.broken_image_outlined,
                        size: 20,
                        color: AppColors.onBackground,
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

/// Délégué pour épingler la TabBar dans le NestedScrollView (B3). Hauteur
/// fixe = preferredSize de la TabBar, fond surface pour rester opaque au
/// scroll.
class _TabBarHeaderDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  _TabBarHeaderDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(color: AppColors.surface, child: tabBar);
  }

  @override
  bool shouldRebuild(_TabBarHeaderDelegate oldDelegate) =>
      tabBar != oldDelegate.tabBar;
}

class _FullscreenGallery extends StatefulWidget {
  final List<Photo> photos;
  final int initialIndex;
  const _FullscreenGallery({required this.photos, required this.initialIndex});

  @override
  State<_FullscreenGallery> createState() => _FullscreenGalleryState();
}

class _FullscreenGalleryState extends State<_FullscreenGallery> {
  late int _index = widget.initialIndex;
  late final _controller = PageController(initialPage: widget.initialIndex);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
        title: Text('${_index + 1} / ${widget.photos.length}'),
      ),
      body: PhotoViewGallery.builder(
        pageController: _controller,
        itemCount: widget.photos.length,
        backgroundDecoration: const BoxDecoration(color: Colors.black),
        onPageChanged: (i) => setState(() => _index = i),
        builder: (_, i) => PhotoViewGalleryPageOptions(
          imageProvider: CachedNetworkImageProvider(widget.photos[i].url),
          minScale: PhotoViewComputedScale.contained,
          maxScale: PhotoViewComputedScale.covered * 3,
          filterQuality: FilterQuality.high,
        ),
      ),
    );
  }
}

// ============================================================================
// Sections (widgets privés au fichier)
// ============================================================================

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) =>
      const Divider(height: 1, thickness: 1, color: AppColors.divider);
}

/// En-tête fiche (B4), affiché au-dessus des tabs : badge type (VENTE/LOCATION)
/// + réf + titre + adresse. PAS de prix (déplacé vers le CTA bas en B7) et PAS
/// de rating étoile (aucune donnée backend avis — dette tracée).
class _SectionEnTete extends StatelessWidget {
  final Propriete propriete;
  const _SectionEnTete({required this.propriete});

  @override
  Widget build(BuildContext context) {
    final isLocation = propriete.typeAnnonce == 'LOCATION';
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isLocation ? AppColors.secondary : AppColors.success,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isLocation ? 'LOCATION' : 'VENTE',
                  style: TextStyle(
                    // Texte foncé sur l'or (LOCATION), blanc sur le vert (VENTE) — lisibilité.
                    color: isLocation ? AppColors.primary : Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Réf. ${propriete.reference}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            propriete.titre,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
          if (propriete.adresseComplete != null) ...[
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.place_outlined,
                  size: 18,
                  color: AppColors.onBackground,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    propriete.adresseComplete!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// Helpers prix partagés en-tête/CTA (extraits de l'ex-_SectionPrixTitre).
// Duplication volontaire de _formatPrix depuis ProprieteCard (15.2c) — à
// factoriser dans lib/features/immo/utils/prix_formatter.dart au 3e usage.
String _formatPrix(Propriete p) {
  if (p.prixSurDemande) return 'Sur demande';
  final montant = CurrencyFormatter.format(p.prix, p.devise);
  if (p.typeAnnonce == 'LOCATION' && p.periode != null) {
    return '$montant ${_periodeLabel(p.periode!)}';
  }
  return montant;
}

String _periodeLabel(String code) {
  switch (code) {
    case 'PAR_MOIS':
      return '/mois';
    case 'PAR_JOUR':
      return '/jour';
    case 'PAR_AN':
      return '/an';
    default:
      return '';
  }
}

class _SectionMeta extends StatelessWidget {
  final Propriete propriete;
  const _SectionMeta({required this.propriete});

  @override
  Widget build(BuildContext context) {
    // Compteur de vues affiché en lecture pure. Backend : incrément naïf
    // monotone à chaque GET /immo/proprietes/{uuid}, pas de dédup par
    // user/IP (dette MVP tracée).
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          const Icon(
            Icons.visibility_outlined,
            size: 16,
            color: AppColors.onBackground,
          ),
          const SizedBox(width: 6),
          Text(
            '${propriete.nombreVues} vue${propriete.nombreVues > 1 ? 's' : ''}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(width: 16),
          const Icon(
            Icons.favorite_outline,
            size: 16,
            color: AppColors.onBackground,
          ),
          const SizedBox(width: 6),
          Text(
            '${propriete.nombreFavoris}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _SectionSpecs extends StatelessWidget {
  final Propriete propriete;
  final TypeBien? typeBien;
  const _SectionSpecs({required this.propriete, required this.typeBien});

  @override
  Widget build(BuildContext context) {
    final items = <_SpecItem>[];
    if (typeBien != null) {
      items.add(_SpecItem(Icons.home_work_outlined, typeBien!.libelle));
    }
    // Masqué quand 0 (terrain / local sans pièces) — on n'affiche pas "0 ch.".
    if ((propriete.nombreChambres ?? 0) > 0) {
      items.add(
        _SpecItem(Icons.bed_outlined, '${propriete.nombreChambres} ch.'),
      );
    }
    if ((propriete.nombreSallesBain ?? 0) > 0) {
      items.add(
        _SpecItem(Icons.bathtub_outlined, '${propriete.nombreSallesBain} sdb'),
      );
    }
    if (propriete.surfaceM2 != null) {
      items.add(
        _SpecItem(
          Icons.crop_outlined,
          '${propriete.surfaceM2!.toStringAsFixed(0)} m²',
        ),
      );
    }
    if (items.isEmpty) return const SizedBox.shrink();
    // Row de cellules Expanded : chaque spec occupe une fraction égale de la
    // largeur → overflow horizontal structurellement impossible (la cellule
    // rétrécit, le libellé s'ellipse au pire). Garde-fou <360dp respecté sans
    // fallback Wrap. Séparateurs verticaux étirés via IntrinsicHeight.
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (int i = 0; i < items.length; i++) ...[
              if (i > 0)
                const VerticalDivider(
                  width: 1,
                  thickness: 1,
                  color: AppColors.divider,
                ),
              Expanded(child: _SpecCell(item: items[i])),
            ],
          ],
        ),
      ),
    );
  }
}

class _SpecItem {
  final IconData icon;
  final String label;
  const _SpecItem(this.icon, this.label);
}

/// Cellule d'une spec (icône sarcelle + libellé), centrée, ellipse sur 1 ligne
/// pour ne jamais déborder même sur écran très étroit.
class _SpecCell extends StatelessWidget {
  final _SpecItem item;
  const _SpecCell({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(item.icon, size: 22, color: AppColors.primary),
          const SizedBox(height: 6),
          Text(
            item.label,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _SectionDescription extends StatefulWidget {
  final String description;
  const _SectionDescription({required this.description});

  @override
  State<_SectionDescription> createState() => _SectionDescriptionState();
}

class _SectionDescriptionState extends State<_SectionDescription> {
  static const _collapsedMaxLines = 4;
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final textStyle = Theme.of(context).textTheme.bodyMedium;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Description', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          LayoutBuilder(
            builder: (context, constraints) {
              // Mesure si le texte dépasse _collapsedMaxLines à cette largeur :
              // le toggle "Lire plus" n'est rendu que dans ce cas.
              final tp = TextPainter(
                text: TextSpan(text: widget.description, style: textStyle),
                maxLines: _collapsedMaxLines,
                textDirection: TextDirection.ltr,
              )..layout(maxWidth: constraints.maxWidth);
              final isOverflowing = tp.didExceedMaxLines;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AnimatedSize(
                    duration: const Duration(milliseconds: 200),
                    alignment: Alignment.topCenter,
                    child: Text(
                      widget.description,
                      maxLines: _expanded ? null : _collapsedMaxLines,
                      overflow: _expanded
                          ? TextOverflow.clip
                          : TextOverflow.ellipsis,
                      style: textStyle,
                    ),
                  ),
                  if (isOverflowing) ...[
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: () => setState(() => _expanded = !_expanded),
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(
                          _expanded ? 'Lire moins' : 'Lire plus',
                          style: textStyle?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _SectionCommodites extends StatelessWidget {
  final List<Commodite> commodites;
  const _SectionCommodites({required this.commodites});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Commodités', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: commodites.map((c) {
              return Chip(
                avatar: Icon(
                  _iconeFromCode(c.code),
                  size: 18,
                  color: AppColors.primary,
                ),
                label: Text(c.libelle),
                backgroundColor: AppColors.primaryContainer,
                side: BorderSide.none,
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  /// Mapping minimal des codes connus dans le seed actuel. Fallback Icons.check
  /// pour les codes non mappés (ex : PISCINE, JARDIN, ASCENSEUR, ...).
  /// À étoffer au fil des nouvelles commodités exposées en BD.
  IconData _iconeFromCode(String code) {
    switch (code) {
      case 'CLIMATISATION':
        return Icons.ac_unit;
      case 'PARKING':
        return Icons.local_parking;
      case 'CHAUFFE_EAU':
        return Icons.hot_tub_outlined;
      case 'RESERVOIR_EAU':
        return Icons.water_outlined;
      case 'PISCINE':
        return Icons.pool;
      case 'JARDIN':
        return Icons.park_outlined;
      case 'ASCENSEUR':
        return Icons.elevator_outlined;
      case 'INTERNET':
        return Icons.wifi;
      default:
        return Icons.check_circle_outline;
    }
  }
}

/// Mini-carte fiche propriété (Géoloc-3, readonly).
///
/// Affichée seulement si la propriete a lat+lng. Tiles OpenStreetMap
/// (license libre, attribution requise affichée en bas-droite). Marker
/// fixe sur la position, pinch-zoom et pan activés.
class _SectionCarte extends StatelessWidget {
  final double latitude;
  final double longitude;
  const _SectionCarte({required this.latitude, required this.longitude});

  @override
  Widget build(BuildContext context) {
    final point = LatLng(latitude, longitude);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Localisation', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          SizedBox(
            height: 200,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: point,
                  initialZoom: 15,
                  // L'utilisateur peut explorer mais la fiche est en lecture
                  // seule — pas de drag du marker, pas de tap = move.
                  interactionOptions: const InteractionOptions(
                    flags:
                        InteractiveFlag.pinchZoom |
                        InteractiveFlag.drag |
                        InteractiveFlag.doubleTapZoom,
                  ),
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.billetterie.gn',
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: point,
                        width: 40,
                        height: 40,
                        child: const Icon(
                          Icons.location_pin,
                          color: AppColors.primary,
                          size: 40,
                        ),
                      ),
                    ],
                  ),
                  const RichAttributionWidget(
                    attributions: [
                      TextSourceAttribution('© OpenStreetMap contributors'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Position approximative — ±30m typique',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.onBackground,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionVendeur extends StatelessWidget {
  final String? nomContactPublic;
  const _SectionVendeur({required this.nomContactPublic});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Vendeur', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Row(
            children: [
              const CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.primaryContainer,
                child: Icon(Icons.person_outline, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  nomContactPublic ?? 'Non renseigné',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Téléphone/email PAS exposés direct (RGPD) — les actions
          // Contacter / Visiter passent par la BottomAppBar de la fiche.
          Text(
            'Contactez le vendeur via les boutons en bas de l\'écran.',
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.onBackground),
          ),
        ],
      ),
    );
  }
}

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
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
import '../services/propriete_service.dart';

/// Écran fiche détaillée d'une propriété (Phase 15.2d-2, read-only).
///
/// Layout CustomScrollView + SliverAppBar pinné (expandedHeight 280) :
///   - Galerie photos en arrière-plan SliverAppBar (PageView + indicateur)
///   - Sections successives (Prix, Specs, Adresse, Description, Commodités, Vendeur)
///
/// Les actions Contact + Visite arrivent en 15.2d-3 via BottomAppBar FAB sticky.
/// La section Vendeur affiche un hint désactivé "Contactez via les boutons
/// (à venir 15.2d-3)" en attendant.
///
/// Tap sur une photo → ouvre [_FullscreenGallery] avec swipe horizontal + zoom
/// pinch via `photo_view`.
class FicheProprieteScreen extends StatefulWidget {
  final String proprieteUuid;

  const FicheProprieteScreen({super.key, required this.proprieteUuid});

  @override
  State<FicheProprieteScreen> createState() => _FicheProprieteScreenState();
}

class _FicheProprieteScreenState extends State<FicheProprieteScreen> {
  final _service = ProprieteService();

  bool _loading = true;
  AppException? _error;
  Propriete? _propriete;
  Map<int, TypeBien> _typesById = const {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // 2 requêtes parallèles : fiche détail + référentiel types-bien.
      // types-bien sert à afficher le libellé du typeBienId — backend ne le
      // populate pas dans la réponse fiche (cf. Propriete.dart doc).
      final results = await Future.wait([
        _service.findByUuid(widget.proprieteUuid),
        _service.listTypesBien(),
      ]);
      if (!mounted) return;
      setState(() {
        _propriete = results[0] as Propriete;
        final types = results[1] as List<TypeBien>;
        _typesById = {for (final t in types) t.typeBienId: t};
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
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: AppColors.surface,
            iconTheme: const IconThemeData(color: AppColors.onSurface),
            title: Text(p.titre, maxLines: 1, overflow: TextOverflow.ellipsis),
            flexibleSpace: FlexibleSpaceBar(
              background: _GalerieHeader(photos: p.photos),
            ),
          ),
          SliverList(
            delegate: SliverChildListDelegate([
              _SectionPrixTitre(propriete: p),
              const _Divider(),
              _SectionSpecs(propriete: p, typeBien: typeBien),
              if (p.adresseComplete != null) ...[
                const _Divider(),
                _SectionAdresse(adresse: p.adresseComplete!),
              ],
              if (p.description != null && p.description!.trim().isNotEmpty) ...[
                const _Divider(),
                _SectionDescription(description: p.description!),
              ],
              if (p.commodites.isNotEmpty) ...[
                const _Divider(),
                _SectionCommodites(commodites: p.commodites),
              ],
              const _Divider(),
              _SectionVendeur(nomContactPublic: p.nomContactPublic),
              const SizedBox(height: 80), // futur FAB 15.2d-3
            ]),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Galerie photos (header SliverAppBar)
// ============================================================================

class _GalerieHeader extends StatefulWidget {
  final List<Photo> photos;
  const _GalerieHeader({required this.photos});

  @override
  State<_GalerieHeader> createState() => _GalerieHeaderState();
}

class _GalerieHeaderState extends State<_GalerieHeader> {
  int _index = 0;
  late final _controller = PageController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.photos.isEmpty) {
      return Container(
        color: AppColors.divider,
        alignment: Alignment.center,
        child: const Icon(Icons.image_not_supported_outlined, size: 48, color: AppColors.onBackground),
      );
    }
    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          controller: _controller,
          itemCount: widget.photos.length,
          onPageChanged: (i) => setState(() => _index = i),
          itemBuilder: (_, i) {
            final p = widget.photos[i];
            return GestureDetector(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => _FullscreenGallery(photos: widget.photos, initialIndex: i),
              )),
              child: CachedNetworkImage(
                imageUrl: p.url,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: AppColors.divider),
                errorWidget: (_, __, ___) => Container(
                  color: AppColors.divider,
                  alignment: Alignment.center,
                  child: const Icon(Icons.broken_image_outlined, size: 48, color: AppColors.onBackground),
                ),
              ),
            );
          },
        ),
        // Indicateur "N / M" — caché si une seule photo (esthétique).
        if (widget.photos.length >= 2)
          Positioned(
            right: 16,
            bottom: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${_index + 1} / ${widget.photos.length}',
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ),
      ],
    );
  }
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
  Widget build(BuildContext context) => const Divider(height: 1, thickness: 1, color: AppColors.divider);
}

class _SectionPrixTitre extends StatelessWidget {
  final Propriete propriete;
  const _SectionPrixTitre({required this.propriete});

  @override
  Widget build(BuildContext context) {
    final isLocation = propriete.typeAnnonce == 'LOCATION';
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
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
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5),
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
          // Duplication volontaire de _formatPrix() depuis ProprieteCard (15.2c) :
          // pas d'over-engineering tant que 2 usages. Note dette : à factoriser
          // dans lib/features/immo/utils/prix_formatter.dart au 3e usage.
          Text(
            _formatPrix(propriete),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            propriete.titre,
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ],
      ),
    );
  }

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
      case 'PAR_MOIS': return '/mois';
      case 'PAR_JOUR': return '/jour';
      case 'PAR_AN': return '/an';
      default: return '';
    }
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
    if (propriete.nombreChambres != null) {
      items.add(_SpecItem(Icons.bed_outlined, '${propriete.nombreChambres} ch.'));
    }
    if (propriete.nombreSallesBain != null) {
      items.add(_SpecItem(Icons.bathtub_outlined, '${propriete.nombreSallesBain} sdb'));
    }
    if (propriete.surfaceM2 != null) {
      items.add(_SpecItem(Icons.crop_outlined, '${propriete.surfaceM2!.toStringAsFixed(0)} m²'));
    }
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Wrap(
        spacing: 16,
        runSpacing: 8,
        children: items
            .map((s) => Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(s.icon, size: 18, color: AppColors.onBackground),
                    const SizedBox(width: 6),
                    Text(s.label, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ))
            .toList(),
      ),
    );
  }
}

class _SpecItem {
  final IconData icon;
  final String label;
  const _SpecItem(this.icon, this.label);
}

class _SectionAdresse extends StatelessWidget {
  final String adresse;
  const _SectionAdresse({required this.adresse});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.place_outlined, size: 20, color: AppColors.onBackground),
          const SizedBox(width: 8),
          Expanded(
            child: Text(adresse, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

class _SectionDescription extends StatelessWidget {
  final String description;
  const _SectionDescription({required this.description});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Description', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(description, style: Theme.of(context).textTheme.bodyMedium),
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
                avatar: Icon(_iconeFromCode(c.code), size: 18, color: AppColors.primary),
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
      case 'CLIMATISATION': return Icons.ac_unit;
      case 'PARKING':        return Icons.local_parking;
      case 'CHAUFFE_EAU':    return Icons.hot_tub_outlined;
      case 'RESERVOIR_EAU':  return Icons.water_outlined;
      case 'PISCINE':        return Icons.pool;
      case 'JARDIN':         return Icons.park_outlined;
      case 'ASCENSEUR':      return Icons.elevator_outlined;
      case 'INTERNET':       return Icons.wifi;
      default:               return Icons.check_circle_outline;
    }
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
          // Hint désactivé. Téléphone/email PAS exposés direct (RGPD) — les
          // actions Contacter / Visiter arriveront en 15.2d-3 via BottomAppBar
          // FAB sticky.
          Text(
            'Contactez via les boutons (à venir 15.2d-3)',
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

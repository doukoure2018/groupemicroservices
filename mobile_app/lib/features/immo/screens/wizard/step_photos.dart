import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../config/app_config.dart';
import '../../../../shared/http/api_exception.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../models/local_photo.dart';
import '../../models/photo.dart';
import '../../services/local_photo_storage_service.dart';
import '../../services/photo_upload_service.dart';

/// Étape 3 du wizard publication — sélection et organisation des photos.
///
/// Comportement clé :
///   - 2 boutons distincts : "Galerie" (pickMultiImage) et "Caméra" (pickImage).
///   - Compression `imageQuality: 80` au pick — économise ~70% du fichier sans
///     dégradation visible.
///   - Copie permanente vers `ApplicationDocumentsDirectory/wizard_photos/` via
///     [LocalPhotoStorageService] (option b validée — survie kill app).
///   - Limite 10 photos. Au-delà : SnackBar "Maximum atteint".
///   - 1ère photo ajoutée = couverture par défaut. Suppression de la couverture
///     promeut la 1ère restante.
///   - Cover = FLAG sur [LocalPhoto], PAS index. Reorder ne touche QUE l'ordre.
///   - Menu 3-dots : "Définir comme couverture" / "Supprimer".
///   - ReorderableListView native — long-press drag.
class StepPhotos extends StatefulWidget {
  final GlobalKey<StepPhotosState> stepKey;
  final Map<String, dynamic> initialValues;
  final void Function(List<LocalPhoto> photos) onChanged;

  /// Mode reprise REJETE (T3a) : photos déjà uploadées sur MinIO, affichées
  /// EN READ-ONLY au-dessus de la galerie LocalPhoto. Si non-vide, l'user
  /// voit qu'il a déjà des photos sur le backend ; il peut ajouter des
  /// nouvelles photos LOCAL via les boutons Galerie/Caméra (uploadées au
  /// submit final).
  ///
  /// En T3b (bonus si temps), permettra add/remove actif. Pour T3a strict :
  /// affichage seulement, suppression désactivée (créer nouvelle annonce
  /// pour changer photos — cf bandeau d'info).
  final List<Photo>? remotePhotos;

  StepPhotos({
    required this.stepKey,
    required this.initialValues,
    required this.onChanged,
    this.remotePhotos,
  }) : super(key: stepKey);

  @override
  State<StepPhotos> createState() => StepPhotosState();
}

class StepPhotosState extends State<StepPhotos>
    with AutomaticKeepAliveClientMixin {
  static const int _maxPhotos = 10;
  static const int _imageQuality = 80;

  final _picker = ImagePicker();
  final _storage = LocalPhotoStorageService();
  final _photoUploadService = PhotoUploadService();

  List<LocalPhoto> _photos = [];
  bool _pickingLoading = false;

  /// T3b : copie locale mutable des photos remote pour permettre suppression
  /// en live. Initialisée depuis widget.remotePhotos au mount. Au moment du
  /// submit final (T4), le wizard inspectera ce state pour savoir quelles
  /// photos backend doivent rester (les autres ont été DELETE en live).
  List<Photo> _remotePhotos = [];
  final Set<String> _remoteDeletingUuids = {};

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _remotePhotos = List<Photo>.from(widget.remotePhotos ?? const <Photo>[]);
    _loadInitial();
  }

  /// T4 hook : expose les photos remote restantes (non supprimées).
  List<Photo> get remainingRemotePhotos => List.unmodifiable(_remotePhotos);

  Future<void> _loadInitial() async {
    final raw = widget.initialValues['photos'] as List<dynamic>?;
    if (raw == null || raw.isEmpty) return;
    final parsed = raw.map((e) => LocalPhoto.fromJson(e as Map<String, dynamic>)).toList();
    // Filtre les disparus (théoriquement aucun en option b, mais défensif).
    final survivants = <LocalPhoto>[];
    int disparus = 0;
    for (final p in parsed) {
      if (await _storage.exists(p.path)) {
        survivants.add(p);
      } else {
        disparus += 1;
      }
    }
    if (!mounted) return;
    setState(() {
      _photos = _renumeroterOrdre(survivants);
    });
    if (disparus > 0) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('$disparus photo(s) non retrouvée(s) — re-ajoutez si besoin.'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  // ============================================================
  // API exposée au coordinateur via GlobalKey
  // ============================================================

  bool validate() {
    if (_photos.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Ajoutez au moins une photo'),
      ));
      return false;
    }
    return true;
  }

  List<LocalPhoto> collect() => List.unmodifiable(_photos);

  // ============================================================
  // Helpers de manipulation
  // ============================================================

  List<LocalPhoto> _renumeroterOrdre(List<LocalPhoto> in_) {
    return [
      for (int i = 0; i < in_.length; i++) in_[i].copyWith(ordre: i),
    ];
  }

  void _commitChanges(List<LocalPhoto> nouvelle) {
    final corrigee = _ensureCoverFlagIntegrity(_renumeroterOrdre(nouvelle));
    setState(() => _photos = corrigee);
    widget.onChanged(_photos);
  }

  /// Garantit l'invariant : si la liste n'est PAS vide, exactement UNE photo
  /// porte le flag estCouverture. Si aucune (cas du DELETE de la couverture),
  /// promeut la 1ère restante (par ordre).
  List<LocalPhoto> _ensureCoverFlagIntegrity(List<LocalPhoto> in_) {
    if (in_.isEmpty) return in_;
    final coverCount = in_.where((p) => p.estCouverture).length;
    if (coverCount == 1) return in_;
    if (coverCount == 0) {
      // Promeut la 1ère.
      return [
        in_.first.copyWith(estCouverture: true),
        ...in_.skip(1),
      ];
    }
    // > 1 couverture (incohérence import brouillon défensif) : garde la 1ère.
    bool seen = false;
    return in_.map((p) {
      if (!p.estCouverture) return p;
      if (seen) return p.copyWith(estCouverture: false);
      seen = true;
      return p;
    }).toList();
  }

  // ============================================================
  // Actions UI
  // ============================================================

  Future<void> _pickFromGallery() async {
    if (_pickingLoading) return;
    final remaining = _maxPhotos - _photos.length;
    if (remaining <= 0) {
      _showMaxReached();
      return;
    }
    setState(() => _pickingLoading = true);
    try {
      final xfiles = await _picker.pickMultiImage(imageQuality: _imageQuality);
      if (xfiles.isEmpty) return;
      final toCopy = xfiles.take(remaining).toList();
      final added = <LocalPhoto>[];
      for (final xf in toCopy) {
        final dest = await _storage.copyToAppDocs(xf);
        added.add(LocalPhoto(
          path: dest,
          ordre: _photos.length + added.length,
          estCouverture: false, // sera corrigé par _ensureCoverFlagIntegrity
          pickedAtMillis: DateTime.now().millisecondsSinceEpoch,
        ));
      }
      _commitChanges([..._photos, ...added]);
      if (xfiles.length > remaining && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Limite $_maxPhotos atteinte — ${xfiles.length - remaining} ignorée(s)'),
        ));
      }
    } finally {
      if (mounted) setState(() => _pickingLoading = false);
    }
  }

  Future<void> _pickFromCamera() async {
    if (_pickingLoading) return;
    if (_photos.length >= _maxPhotos) {
      _showMaxReached();
      return;
    }
    setState(() => _pickingLoading = true);
    try {
      final xfile = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: _imageQuality,
      );
      if (xfile == null) return;
      final dest = await _storage.copyToAppDocs(xfile);
      final added = LocalPhoto(
        path: dest,
        ordre: _photos.length,
        estCouverture: false,
        pickedAtMillis: DateTime.now().millisecondsSinceEpoch,
      );
      _commitChanges([..._photos, added]);
    } finally {
      if (mounted) setState(() => _pickingLoading = false);
    }
  }

  void _showMaxReached() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Maximum $_maxPhotos photos atteint')),
    );
  }

  void _setCouverture(LocalPhoto target) {
    // Flag-only : on touche estCouverture, pas l'ordre. La photo reste à sa
    // position actuelle dans la liste.
    final nouvelle = _photos
        .map((p) => p.copyWith(estCouverture: p.path == target.path))
        .toList();
    _commitChanges(nouvelle);
  }

  Future<void> _delete(LocalPhoto target) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer cette photo ?'),
        content: const Text('Cette action est définitive.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Supprimer')),
        ],
      ),
    );
    if (confirm != true) return;
    await _storage.deletePhoto(target.path);
    final nouvelle = _photos.where((p) => p.path != target.path).toList();
    _commitChanges(nouvelle);
  }

  void _onReorder(int oldIndex, int newIndex) {
    // Pattern Flutter standard : ajuste newIndex si oldIndex < newIndex.
    var nIdx = newIndex;
    if (oldIndex < nIdx) nIdx -= 1;
    final nouvelle = List<LocalPhoto>.from(_photos);
    final item = nouvelle.removeAt(oldIndex);
    nouvelle.insert(nIdx, item);
    // Reorder NE TOUCHE PAS estCouverture — le flag suit la photo, pas l'index.
    _commitChanges(nouvelle);
  }

  // ============================================================
  // Build
  // ============================================================

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final hasRemote = _remotePhotos.isNotEmpty;

    return Column(
      children: [
        // T3b : section interactive (preview + delete) des photos remote
        // en mode reprise REJETE. Vide sinon (flow normal).
        if (hasRemote) _remotePhotosSection(),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickingLoading ? null : _pickFromGallery,
                  icon: const Icon(Icons.photo_library_outlined),
                  label: Text(hasRemote ? 'Ajouter (galerie)' : 'Galerie'),
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickingLoading ? null : _pickFromCamera,
                  icon: const Icon(Icons.photo_camera_outlined),
                  label: Text(hasRemote ? 'Ajouter (caméra)' : 'Caméra'),
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Text(
                '${_photos.length} / $_maxPhotos photo(s)',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const Spacer(),
              if (_pickingLoading)
                const SizedBox(
                  width: 14, height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(child: _buildList()),
      ],
    );
  }

  /// Résout l'URL d'une photo backend. Le getter Photo.getUrl() côté Java
  /// est censé retourner du RELATIF ("/immo/photos/{uuid}") mais peut parfois
  /// renvoyer du absolu (cas historiques, fallback sur champ `url` BD). Ce
  /// helper gère les 2 cas : si déjà absolu, on l'utilise tel quel.
  String _resolvePhotoUrl(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return '${AppConfig.apiBaseUrl}$url';
  }

  /// T3b : section interactive des photos déjà uploadées (mode reprise REJETE).
  /// Tap = preview fullscreen avec pinch-zoom. Bouton X = DELETE backend.
  /// Suppression IMMÉDIATE côté backend (pas de tracking pour rollback).
  Widget _remotePhotosSection() {
    final remote = _remotePhotos;
    return Container(
      width: double.infinity,
      // Padding réduit pour éviter overflow 8px sur petits écrans.
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      color: AppColors.primaryContainer.withValues(alpha: 0.3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.cloud_done_outlined, size: 18, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(
                'Photos actuelles (${remote.length})',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: remote.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final p = remote[i];
                final url = _resolvePhotoUrl(p.url);
                final isDeleting = _remoteDeletingUuids.contains(p.photoUuid);
                return _remotePhotoTile(p, url, isDeleting);
              },
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Tapez pour agrandir · ✕ pour supprimer. Vous pouvez ajouter de '
            'nouvelles photos ci-dessous.',
            style: TextStyle(
              fontSize: 11,
              fontStyle: FontStyle.italic,
              color: AppColors.onBackground,
            ),
          ),
        ],
      ),
    );
  }

  Widget _remotePhotoTile(Photo p, String url, bool isDeleting) {
    return GestureDetector(
      onTap: isDeleting ? null : () => _previewRemote(url, p.estCouverture == true),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              url,
              width: 88,
              height: 88,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 88,
                height: 88,
                color: AppColors.divider,
                child: const Icon(
                  Icons.broken_image_outlined,
                  color: AppColors.onBackground,
                ),
              ),
            ),
          ),
          if (p.estCouverture == true)
            Positioned(
              top: 4,
              left: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.secondary.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.star, size: 12, color: AppColors.onSecondary),
                    SizedBox(width: 2),
                    Text(
                      'Cover',
                      style: TextStyle(
                        fontSize: 10,
                        color: AppColors.onSecondary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          Positioned(
            top: 0,
            right: 0,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: isDeleting ? null : () => _deleteRemotePhoto(p),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: isDeleting
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.close, size: 14, color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _previewRemote(String url, bool isCover) {
    return showDialog<void>(
      context: context,
      barrierColor: Colors.black87,
      builder: (ctx) => Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                minScale: 1,
                maxScale: 4,
                child: Image.network(url, fit: BoxFit.contain),
              ),
            ),
            if (isCover)
              Positioned(
                top: MediaQuery.of(ctx).padding.top + 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.star, size: 14, color: AppColors.onSecondary),
                      SizedBox(width: 4),
                      Text(
                        'Couverture',
                        style: TextStyle(color: AppColors.onSecondary, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            Positioned(
              top: MediaQuery.of(ctx).padding.top + 8,
              right: 8,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.of(ctx).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteRemotePhoto(Photo p) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer cette photo ?'),
        content: const Text(
          'La photo sera définitivement supprimée du serveur. '
          'Cette action est irréversible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    if (!mounted) return;

    setState(() => _remoteDeletingUuids.add(p.photoUuid));
    try {
      await _photoUploadService.deletePhoto(p.photoUuid);
      if (!mounted) return;
      setState(() {
        _remotePhotos.removeWhere((x) => x.photoUuid == p.photoUuid);
        _remoteDeletingUuids.remove(p.photoUuid);
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _remoteDeletingUuids.remove(p.photoUuid));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Suppression échouée : ${e.message}'),
          backgroundColor: AppColors.error,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _remoteDeletingUuids.remove(p.photoUuid));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Suppression échouée : $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Widget _buildList() {
    if (_photos.isEmpty) {
      // Mode reprise REJETE : si l'user a des photos remote en haut, pas
      // d'empty state ici (sinon overflow + UX bizarre "Aucune photo" alors
      // qu'il en a). Just shrink — les boutons Galerie/Caméra sont visibles
      // au-dessus et suffisent pour ajouter.
      if (_remotePhotos.isNotEmpty) {
        return const SizedBox.shrink();
      }
      // Mode normal : grand placeholder "Aucune photo".
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.photo_library_outlined, size: 64, color: AppColors.onBackground),
              const SizedBox(height: 12),
              Text('Aucune photo',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(
                'Ajoutez au moins une photo via Galerie ou Caméra.',
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }
    return Column(
      children: [
        Expanded(
          child: ReorderableListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _photos.length,
            onReorder: _onReorder,
            itemBuilder: (context, index) {
              final p = _photos[index];
              return _PhotoTile(
                key: ValueKey(p.path), // Key requise par ReorderableListView
                photo: p,
                index: index,
                onSetCouverture: () => _setCouverture(p),
                onDelete: () => _delete(p),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Text(
            'Long-press + glisser pour réordonner. L\'étoile ⭐ indique la couverture.',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }
}

class _PhotoTile extends StatelessWidget {
  final LocalPhoto photo;
  final int index;
  final VoidCallback onSetCouverture;
  final VoidCallback onDelete;

  const _PhotoTile({
    super.key,
    required this.photo,
    required this.index,
    required this.onSetCouverture,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: AppColors.divider),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: SizedBox(
            width: 56, height: 56,
            child: Image.file(
              File(photo.path),
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                color: AppColors.divider,
                child: const Icon(Icons.broken_image_outlined, color: AppColors.onBackground),
              ),
            ),
          ),
        ),
        title: Row(
          children: [
            Text('Photo ${index + 1}'),
            if (photo.estCouverture) ...[
              const SizedBox(width: 6),
              Icon(Icons.star, color: AppColors.secondary, size: 18),
            ],
          ],
        ),
        subtitle: photo.estCouverture
            ? const Text('Couverture',
                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w500))
            : null,
        trailing: PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert),
          onSelected: (v) {
            switch (v) {
              case 'cover': onSetCouverture(); break;
              case 'delete': onDelete(); break;
            }
          },
          itemBuilder: (_) => [
            if (!photo.estCouverture)
              const PopupMenuItem(value: 'cover', child: Row(children: [
                Icon(Icons.star_outline, size: 20),
                SizedBox(width: 8),
                Text('Définir comme couverture'),
              ])),
            const PopupMenuItem(value: 'delete', child: Row(children: [
              Icon(Icons.delete_outline, size: 20, color: AppColors.error),
              SizedBox(width: 8),
              Text('Supprimer', style: TextStyle(color: AppColors.error)),
            ])),
          ],
        ),
      ),
    );
  }
}

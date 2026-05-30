import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../shared/theme/app_colors.dart';
import '../../models/local_photo.dart';
import '../../services/local_photo_storage_service.dart';

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

  StepPhotos({
    required this.stepKey,
    required this.initialValues,
    required this.onChanged,
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

  List<LocalPhoto> _photos = [];
  bool _pickingLoading = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _loadInitial();
  }

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
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickingLoading ? null : _pickFromGallery,
                  icon: const Icon(Icons.photo_library_outlined),
                  label: const Text('Galerie'),
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickingLoading ? null : _pickFromCamera,
                  icon: const Icon(Icons.photo_camera_outlined),
                  label: const Text('Caméra'),
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

  Widget _buildList() {
    if (_photos.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
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
              const Icon(Icons.star, color: Colors.amber, size: 18),
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

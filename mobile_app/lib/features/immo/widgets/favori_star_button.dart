import 'package:flutter/material.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../services/favori_service.dart';

/// Bouton étoile favoris self-contained — gère son loading, optimistic
/// update, rollback sur erreur. Utilisé sur [ProprieteCard] (variante
/// overlay `light:true`) et [FicheProprieteScreen] (AppBar action).
///
/// Garanties UX :
///   - Race T30 : pendant qu'un toggle est en cours côté réseau, le bouton
///     est désactivé (`onPressed: null`) ET affiche un spinner discret —
///     un double-tap rapide ne peut PAS partir une 2e requête, l'état UI
///     reste cohérent avec la BD finale.
///   - Rollback T29 : sur AppException, le flag local revient à l'état
///     d'origine ET un SnackBar erreur s'affiche. L'étoile retourne
///     visuellement à où elle était avant le tap.
///   - Sync parent : si le parent push une nouvelle valeur `isFavorite`
///     via didUpdateWidget (ex: refresh liste), on resync.
///
/// La closure [onChanged] notifie le parent du nouvel état stable (après
/// succès réseau) — utile pour patcher une liste locale sans refetch.
class FavoriStarButton extends StatefulWidget {
  /// État initial — sera resync via didUpdateWidget si le parent push une
  /// nouvelle valeur.
  final bool isFavorite;

  /// UUID de la propriété — passé au [FavoriService].
  final String proprieteUuid;

  /// Notifié avec le nouvel état stable (post-succès réseau). Pas notifié
  /// si rollback (erreur).
  final ValueChanged<bool>? onChanged;

  /// Si `true`, icône blanche avec ombre — pour overlay sur photo couverture.
  /// Sinon icône colorée standard (AppBar).
  final bool light;

  /// Taille de l'icône (defaults 24 / 28 selon variante).
  final double? size;

  /// Variante réduite pour overlay sur les cards de liste (Recommandées /
  /// Toutes les annonces) : icône 16 + padding 6 → cercle ~28px au lieu de
  /// ~44px. Évite le "blob" gris qui domine les petites cards. Sans effet sur
  /// la fiche héro (qui reste en `light` non-compact, plus grand car la photo
  /// l'est aussi). Ignoré si `light` est false.
  final bool compact;

  const FavoriStarButton({
    super.key,
    required this.isFavorite,
    required this.proprieteUuid,
    this.onChanged,
    this.light = false,
    this.size,
    this.compact = false,
  });

  @override
  State<FavoriStarButton> createState() => _FavoriStarButtonState();
}

class _FavoriStarButtonState extends State<FavoriStarButton> {
  final _service = FavoriService();

  late bool _local = widget.isFavorite;
  bool _loading = false;

  @override
  void didUpdateWidget(FavoriStarButton old) {
    super.didUpdateWidget(old);
    // Si le parent push une nouvelle valeur (refresh liste, retour fiche),
    // resync — mais SEULEMENT si aucun toggle local n'est en cours.
    // Pendant un toggle, l'optimistic local a priorité jusqu'à résolution.
    if (!_loading && widget.isFavorite != old.isFavorite) {
      _local = widget.isFavorite;
    }
  }

  Future<void> _toggle() async {
    if (_loading) return; // double-tap garde (race T30)
    final wanted = !_local;
    setState(() {
      _local = wanted;
      _loading = true;
    });
    try {
      if (wanted) {
        await _service.ajouter(widget.proprieteUuid);
      } else {
        await _service.retirer(widget.proprieteUuid);
      }
      if (!mounted) return;
      setState(() => _loading = false);
      widget.onChanged?.call(wanted);
    } on AppException catch (e) {
      if (!mounted) return;
      // Rollback : l'étoile revient visuellement à l'état d'origine.
      setState(() {
        _local = !wanted;
        _loading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Favori : ${e.message}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final size =
        widget.size ?? (widget.light ? (widget.compact ? 16 : 28) : 24);
    // Padding interne du cercle overlay : réduit en compact pour un cercle
    // ~28px (vs ~44px). Sans effet hors variante light.
    final overlayPadding = widget.compact ? 6.0 : 8.0;
    final iconColor = widget.light
        ? (_local ? Colors.redAccent : Colors.white)
        : (_local ? Colors.redAccent : AppColors.onBackground);

    Widget icon = Icon(
      _local ? Icons.favorite : Icons.favorite_border,
      color: iconColor,
      size: size,
      shadows: widget.light
          ? const [Shadow(color: Colors.black54, blurRadius: 6, offset: Offset(0, 1))]
          : null,
    );

    // Variante overlay photo : fond circulaire semi-transparent pour
    // garantir le contraste sur n'importe quelle photo.
    if (widget.light) {
      return Material(
        color: Colors.black.withOpacity(0.35),
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: _loading ? null : _toggle,
          child: Padding(
            padding: EdgeInsets.all(overlayPadding),
            child: _loading
                ? SizedBox(
                    width: size, height: size,
                    child: const CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  )
                : icon,
          ),
        ),
      );
    }

    // Variante AppBar standard.
    return IconButton(
      onPressed: _loading ? null : _toggle,
      icon: _loading
          ? SizedBox(
              width: size, height: size,
              child: const CircularProgressIndicator(strokeWidth: 2),
            )
          : icon,
      tooltip: _local ? 'Retirer des favoris' : 'Ajouter aux favoris',
    );
  }
}

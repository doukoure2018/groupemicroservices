import 'package:flutter/material.dart';

import '../models/propriete.dart';
import '../services/share_service.dart';

/// Bouton "Partager" pour la SliverAppBar de [FicheProprieteScreen].
///
/// Self-contained : gère son loading pendant le download de la photo
/// couverture via [ShareService.sharePropriete] (~500ms à 2s selon le cache
/// `cached_network_image`).
///
/// Anti-race (pattern cohérent FavoriStarButton) : pendant le tap en cours,
/// `onPressed: null` + spinner remplace l'icône → double-tap rapide ne peut
/// pas lancer 2 bottom sheets OS simultanées.
class ShareButton extends StatefulWidget {
  final Propriete propriete;
  final double? size;

  /// Si `true`, icône blanche dans un fond circulaire semi-transparent —
  /// pour overlay flottant sur la photo héro (B2). Miroir exact de la
  /// variante `light` de FavoriStarButton. Sinon IconButton AppBar standard.
  final bool light;

  const ShareButton({
    super.key,
    required this.propriete,
    this.size,
    this.light = false,
  });

  @override
  State<ShareButton> createState() => _ShareButtonState();
}

class _ShareButtonState extends State<ShareButton> {
  bool _loading = false;

  Future<void> _handleShare() async {
    if (_loading) return;
    // Rect d'ancrage du popover de partage iOS/iPad (coordonnées globales),
    // calculé depuis le RenderBox du bouton. Capturé AVANT l'await (le widget
    // est monté et layouté ici). Null sur Android → ignoré.
    final box = context.findRenderObject() as RenderBox?;
    final origin = (box != null && box.hasSize)
        ? box.localToGlobal(Offset.zero) & box.size
        : null;
    setState(() => _loading = true);
    try {
      await ShareService.sharePropriete(widget.propriete, sharePositionOrigin: origin);
    } finally {
      // Pas de gestion d'erreur explicite : ShareService a son propre
      // fallback texte-seul silencieux. Le bouton reset le loading pour
      // permettre un re-tap immédiat.
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size ?? (widget.light ? 24 : 24);

    // Variante overlay photo (B2) : fond circulaire noir 0.35 + icône
    // blanche, identique à FavoriStarButton(light:true) pour cohérence
    // visuelle des 3 overlays héro.
    if (widget.light) {
      return Material(
        color: Colors.black.withValues(alpha: 0.35),
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: _loading ? null : _handleShare,
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: _loading
                ? SizedBox(
                    width: size, height: size,
                    child: const CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  )
                : Icon(Icons.share_outlined,
                    size: size,
                    color: Colors.white,
                    shadows: const [
                      Shadow(color: Colors.black54, blurRadius: 6, offset: Offset(0, 1)),
                    ]),
          ),
        ),
      );
    }

    // Variante AppBar standard.
    return IconButton(
      onPressed: _loading ? null : _handleShare,
      icon: _loading
          ? SizedBox(
              width: size, height: size,
              child: const CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(Icons.share_outlined, size: size),
      tooltip: 'Partager',
    );
  }
}

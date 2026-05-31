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

  const ShareButton({
    super.key,
    required this.propriete,
    this.size,
  });

  @override
  State<ShareButton> createState() => _ShareButtonState();
}

class _ShareButtonState extends State<ShareButton> {
  bool _loading = false;

  Future<void> _handleShare() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      await ShareService.sharePropriete(widget.propriete);
    } finally {
      // Pas de gestion d'erreur explicite : ShareService a son propre
      // fallback texte-seul silencieux. Le bouton reset le loading pour
      // permettre un re-tap immédiat.
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size ?? 24;
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

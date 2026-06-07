import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:share_plus/share_plus.dart';

import '../../../shared/utils/currency_formatter.dart';
import '../models/propriete.dart';

/// Service de partage statique pour les annonces immobilières.
///
/// Génère un texte de partage standard YIGUI + tente d'attacher la photo
/// couverture comme pièce jointe (téléchargée via le cache
/// `flutter_cache_manager` — la même instance utilisée par
/// `cached_network_image`, donc cache partagé : si l'utilisateur a déjà vu
/// la fiche, l'image est déjà sur disque, partage instantané).
///
/// Format texte V1 (PAS de deep-link `yigui://` car scheme non configuré
/// — décision Phase Partage C) :
///
///   "Découvre cette propriété sur SIRA Guinée : {titre} — {prix formaté}.
///    Télécharge l'app pour les détails."
///
/// Cas dégradés (silencieux, pas de dialog erreur) :
///   - Pas de photo couverture → `Share.share()` texte seul
///   - Erreur download (réseau down, 404 MinIO, URL invalide) → fallback
///     `Share.share()` texte seul. Pas de crash.
///
/// Dette : "Télécharge l'app pour les détails" sans lien Google Play /
/// App Store — à enrichir post-publication des apps. Voir mémoire
/// `wizard-publication-share-stores-urls-debt`.
class ShareService {
  /// Tente le partage avec image. Fallback texte seul si pas d'image ou
  /// erreur. Toujours `Future<void>` — pas de retour à gérer côté caller.
  static Future<void> sharePropriete(Propriete propriete) async {
    final text = _formatText(propriete);
    final subject = 'SIRA Guinée — ${propriete.titre}';
    final imageUrl = _coverUrl(propriete);

    if (imageUrl == null) {
      await Share.share(text, subject: subject);
      return;
    }

    try {
      final file = await DefaultCacheManager().getSingleFile(imageUrl);
      await Share.shareXFiles(
        [XFile(file.path)],
        text: text,
        subject: subject,
      );
    } catch (_) {
      // Fallback silencieux : on partage au moins le texte. Cas typiques :
      // - MinIO down (timeout 30s puis HttpException)
      // - URL malformée (404)
      // - Pas de permission disque (rare)
      await Share.share(text, subject: subject);
    }
  }

  /// Format texte standard. Duplique partiellement la logique `_formatPrix`
  /// de ProprieteCard / FicheProprieteScreen (3e usage maintenant —
  /// candidat refactor `prix_formatter.dart` en lib utils, dette tracée).
  static String _formatText(Propriete p) {
    return 'Découvre cette propriété sur SIRA Guinée : ${p.titre} — ${_formatPrix(p)}.\n'
        'Télécharge l\'app pour les détails.';
  }

  static String _formatPrix(Propriete p) {
    if (p.prixSurDemande) return 'Sur demande';
    final montant = CurrencyFormatter.format(p.prix, p.devise);
    if (p.typeAnnonce == 'LOCATION' && p.periode != null) {
      return '$montant ${_periodeLabel(p.periode!)}';
    }
    return montant;
  }

  static String _periodeLabel(String code) {
    switch (code) {
      case 'PAR_MOIS': return '/mois';
      case 'PAR_JOUR': return '/jour';
      case 'PAR_AN':   return '/an';
      default:         return '';
    }
  }

  /// Détermine l'URL de la photo à attacher. Priorité : photoCouverture,
  /// sinon 1ère photo de la liste, sinon null (texte seul).
  static String? _coverUrl(Propriete p) {
    final cover = p.photoCouverture;
    if (cover != null) return cover.url;
    if (p.photos.isNotEmpty) return p.photos.first.url;
    return null;
  }
}

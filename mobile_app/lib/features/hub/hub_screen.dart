import 'package:flutter/material.dart';

import '../../screens/main_screen.dart';
import '../../shared/http/api_exception.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_theme.dart';
import '../../shared/widgets/app_empty_state.dart';
import '../immo/models/propriete.dart';
import '../immo/services/propriete_service.dart';

/// Hub d'accueil YIGUI — point d'entrée pour l'utilisateur authentifié.
///
/// 3 tabs au niveau super-app :
///   - Billetterie : embarque [MainScreen(embedded: true)], palette orange
///     legacy intacte, nav interne déplacée en haut pour ne pas se
///     superposer à la NavigationBar du hub.
///   - Immobilier : placeholder YIGUI sarcelle en 15.2a, écran réel en 15.2c.
///   - Profil : placeholder YIGUI sarcelle en 15.2a, écran réel plus tard.
///
/// Le tab Billetterie hérite du theme orange root ([ColorManager.accent]
/// via MaterialApp dans main.dart). Les tabs Immobilier et Profil sont
/// enveloppés dans [Theme(data: AppTheme.light(), ...)] pour basculer en
/// palette YIGUI sarcelle SANS toucher le tab Billetterie.
class HubScreen extends StatefulWidget {
  const HubScreen({super.key});

  @override
  State<HubScreen> createState() => _HubScreenState();
}

class _HubScreenState extends State<HubScreen> {
  int _currentIndex = 0;

  late final List<Widget> _tabs = [
    const MainScreen(embedded: true), // tab 0 : palette orange legacy intacte
    Theme(data: AppTheme.light(), child: const _ImmoPlaceholder()),
    Theme(data: AppTheme.light(), child: const _ProfilPlaceholder()),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _tabs),
      // Styling explicite YIGUI — ne dépend pas du Theme parent (orange root)
      // pour ne pas changer de couleur quand le tab Billetterie est sélectionné.
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primaryContainer,
        surfaceTintColor: AppColors.surface,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.confirmation_number_outlined),
            selectedIcon: Icon(Icons.confirmation_number, color: AppColors.primary),
            label: 'Billetterie',
          ),
          NavigationDestination(
            icon: Icon(Icons.apartment_outlined),
            selectedIcon: Icon(Icons.apartment, color: AppColors.primary),
            label: 'Immobilier',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppColors.primary),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}

class _ImmoPlaceholder extends StatefulWidget {
  const _ImmoPlaceholder();

  @override
  State<_ImmoPlaceholder> createState() => _ImmoPlaceholderState();
}

class _ImmoPlaceholderState extends State<_ImmoPlaceholder> {
  // TODO 15.2c : retirer ce hardcode quand la vraie liste de recherche expose
  // des photos via cards. Cet uuid est le seul propriete en seed avec une
  // photo, utilisé en 15.2b pour valider Photo.fromJson runtime (sinon le
  // modèle aurait été compilé mais jamais parsé).
  static const String _testPhotoUuid = 'd7716ca9-ad5d-4ef4-a4fb-869f273cdbfd';

  bool _loading = false;

  Future<void> _testRechercher() async {
    setState(() => _loading = true);
    final service = ProprieteService();
    try {
      // 1. Search shape — Propriete sans nested
      final result = await service.rechercher(limit: 20);
      debugPrint('[15.2b TEST] rechercher → ${result.total} total, ${result.items.length} returned');
      for (final p in result.items.take(3)) {
        debugPrint('[15.2b TEST]   - ${p.titre} (${p.proprieteUuid})');
      }

      // 2. Fiche shape — Propriete avec photos[] possiblement vide
      Propriete? firstFiche;
      if (result.items.isNotEmpty) {
        firstFiche = await service.findByUuid(result.items.first.proprieteUuid);
        debugPrint('[15.2b TEST] findByUuid(${firstFiche.proprieteUuid.substring(0, 8)}…) '
            '→ photos=${firstFiche.photos.length}, '
            'couverture=${firstFiche.photoCouverture != null}');
      }

      // 3. Référentiel TypeBien
      final types = await service.listTypesBien();
      debugPrint('[15.2b TEST] listTypesBien → ${types.length} types');
      for (final t in types.take(5)) {
        debugPrint('[15.2b TEST]   - ${t.code} : ${t.libelle}');
      }

      // 4. Photo.fromJson runtime — uuid hardcodé garantit photos non-vides
      final fichePhoto = await service.findByUuid(_testPhotoUuid);
      debugPrint('[15.2b TEST] findByUuid(test photo) → photos=${fichePhoto.photos.length}');
      for (final ph in fichePhoto.photos.take(2)) {
        debugPrint('[15.2b TEST]   photo: order=${ph.ordreAffichage} cover=${ph.estCouverture} '
            'url=${ph.url}');
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('${result.total} props · ${types.length} types · '
            '${fichePhoto.photos.length} photo(s) test — détail console'),
        backgroundColor: AppColors.success,
      ));
    } on AppException catch (e) {
      debugPrint('[15.2b TEST] ÉCHEC: ${e.message}');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Erreur: ${e.message}'),
        backgroundColor: AppColors.error,
      ));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Immobilier')),
      body: Column(
        children: [
          const Expanded(
            child: AppEmptyState(
              icon: Icons.apartment_outlined,
              title: 'Section Immobilier',
              subtitle: 'Bientôt disponible.',
            ),
          ),
          // Dev-only 15.2b — sera retiré en 15.2c quand le vrai écran de
          // recherche remplacera ce placeholder.
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
            child: FilledButton.icon(
              onPressed: _loading ? null : _testRechercher,
              icon: _loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.api),
              label: const Text('Tester ProprieteService'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfilPlaceholder extends StatelessWidget {
  const _ProfilPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: const AppEmptyState(
        icon: Icons.person_outline,
        title: 'Section Profil',
        subtitle: 'Bientôt disponible.',
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../../screens/main_screen.dart';
import '../../shared/http/api_exception.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_theme.dart';
import '../immo/models/brouillon_save_request.dart';
import '../immo/models/profil_immo_request.dart';
import '../immo/screens/recherche_screen.dart';
import '../immo/screens/wizard/wizard_publication_screen.dart';
import '../immo/services/brouillon_service.dart';
import '../immo/services/profil_immo_service.dart';

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
    Theme(data: AppTheme.light(), child: const RechercheScreen()),
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

/// Placeholder Profil — surface temporaire pour les test buttons data layer
/// publication (15.2e-1). À supprimer en 15.2e-4 quand le wizard sera branché
/// via le FAB de RechercheScreen, et remplacé par un vrai écran Profil.
class _ProfilPlaceholder extends StatefulWidget {
  const _ProfilPlaceholder();

  @override
  State<_ProfilPlaceholder> createState() => _ProfilPlaceholderState();
}

class _ProfilPlaceholderState extends State<_ProfilPlaceholder> {
  final _profilService = ProfilImmoService();
  final _brouillonService = BrouillonService();

  bool _profilLoading = false;
  bool _brouillonLoading = false;
  String? _lastResult;

  Future<void> _testProfil() async {
    setState(() {
      _profilLoading = true;
      _lastResult = null;
    });
    final log = <String>[];
    try {
      // T1: POST profil PROPRIETAIRE_SIMPLE
      log.add('POST /immo/profils {typeProfil: PROPRIETAIRE_SIMPLE, bio, tel}…');
      final created = await _profilService.creer(
        const ProfilImmoRequest(
          typeProfil: 'PROPRIETAIRE_SIMPLE',
          bio: 'Test 15.2e-1 — profil seed visiteur',
          telephoneContact: '+224621091895',
        ),
      );
      log.add('  → 201 profilUuid=${created.profilUuid} statut=${created.statutVerification}');

      // T2: GET /me
      log.add('GET /immo/profils/me…');
      final mien = await _profilService.getMien();
      log.add(mien == null
          ? '  → null (??? attendu 200 après création)'
          : '  → 200 typeProfil=${mien.typeProfil} bio="${mien.bio}"');

      if (!mounted) return;
      setState(() {
        _profilLoading = false;
        _lastResult = '✓ Profil T1+T2\n${log.join('\n')}';
      });
    } on AppException catch (e) {
      log.add('  ✗ ${e.runtimeType} (${e.statusCode}) — ${e.message}');
      if (!mounted) return;
      setState(() {
        _profilLoading = false;
        _lastResult = '✗ Profil\n${log.join('\n')}';
      });
    }
  }

  Future<void> _testBrouillonCrud() async {
    setState(() {
      _brouillonLoading = true;
      _lastResult = null;
    });
    final log = <String>[];
    try {
      // T3: POST brouillon vide étape 1
      log.add('POST /immo/brouillons {etapeActuelle:1, donneesJson:{}}…');
      final created = await _brouillonService.creer(
        const BrouillonSaveRequest(etapeActuelle: 1, donneesJson: {}),
      );
      final uuid = created.brouillonUuid;
      log.add('  → 201 brouillonUuid=$uuid');

      // T4: PUT brouillon avec donnees étape 2
      log.add('PUT /immo/brouillons/$uuid {etapeActuelle:2, donneesJson:{etape1:{...}}}…');
      final updated = await _brouillonService.maj(
        uuid,
        const BrouillonSaveRequest(etapeActuelle: 2, donneesJson: {
          'etape1': {
            'typeAnnonce': 'LOCATION',
            'typeBienCode': 'MAISON',
          },
        }),
      );
      log.add('  → 200 etapeActuelle=${updated.etapeActuelle} donnees.etape1=${updated.donneesJson['etape1']}');

      // T5: GET mes + DELETE + GET mes vide
      log.add('GET /immo/brouillons…');
      var mes = await _brouillonService.mes();
      log.add('  → ${mes.length} brouillon(s)');
      log.add('DELETE /immo/brouillons/$uuid…');
      await _brouillonService.supprimer(uuid);
      log.add('  → 200');
      log.add('GET /immo/brouillons (post-DELETE)…');
      mes = await _brouillonService.mes();
      log.add('  → ${mes.length} brouillon(s)');

      if (!mounted) return;
      setState(() {
        _brouillonLoading = false;
        _lastResult = '✓ Brouillon T3+T4+T5\n${log.join('\n')}';
      });
    } on AppException catch (e) {
      log.add('  ✗ ${e.runtimeType} (${e.statusCode}) — ${e.message}');
      if (!mounted) return;
      setState(() {
        _brouillonLoading = false;
        _lastResult = '✗ Brouillon\n${log.join('\n')}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Dev-only — tests data layer publication 15.2e-1',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              'Upload photo PAS testé ici (vendeur=user 9 ≠ owner toute propriété existante → 403 attendu). Test en 15.2e-3.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _profilLoading ? null : _testProfil,
              icon: _profilLoading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.person_add_alt_outlined),
              label: const Text('Test Profil (POST + GET /me)'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _brouillonLoading ? null : _testBrouillonCrud,
              icon: _brouillonLoading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.drafts_outlined),
              label: const Text('Test Brouillon CRUD'),
            ),
            const SizedBox(height: 12),
            // Phase 15.2e-2 — lance le wizard publication (squelette).
            // FAB définitif viendra sur RechercheScreen en 15.2e-4.
            FilledButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const WizardPublicationScreen()),
              ),
              icon: const Icon(Icons.rocket_launch_outlined),
              label: const Text('Lancer wizard publication'),
            ),
            const SizedBox(height: 24),
            if (_lastResult != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _lastResult!.startsWith('✓')
                      ? AppColors.success.withOpacity(0.1)
                      : AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SelectableText(
                  _lastResult!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(fontFamily: 'monospace'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

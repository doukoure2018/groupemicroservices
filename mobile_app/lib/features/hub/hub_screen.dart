import 'package:flutter/material.dart';

import '../../screens/main_screen.dart';
import '../../shared/http/api_exception.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_theme.dart';
import '../immo/models/contact_create_request.dart';
import '../immo/models/visite_create_request.dart';
import '../immo/screens/recherche_screen.dart';
import '../immo/services/contact_service.dart';
import '../immo/services/visite_service.dart';

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

/// Placeholder Profil — sert temporairement de surface aux test buttons
/// data layer 15.2d-1 (POST contact + POST visite sur d7716ca9).
///
/// À supprimer en 15.2d-3 quand les vraies bottom sheets Contacter/Visiter
/// seront branchées depuis la fiche propriété, et remplacé par un vrai
/// écran Profil (phase ultérieure).
class _ProfilPlaceholder extends StatefulWidget {
  const _ProfilPlaceholder();

  @override
  State<_ProfilPlaceholder> createState() => _ProfilPlaceholderState();
}

class _ProfilPlaceholderState extends State<_ProfilPlaceholder> {
  // Propriété cible : seule annonce seed avec photo + commodités (d7716ca9).
  static const String _testProprieteUuid = 'd7716ca9-ad5d-4ef4-a4fb-869f273cdbfd';

  final _contactService = ContactService();
  final _visiteService = VisiteService();

  bool _contactLoading = false;
  bool _visiteLoading = false;
  String? _lastResult;

  Future<void> _testContact() async {
    setState(() {
      _contactLoading = true;
      _lastResult = null;
    });
    try {
      final contact = await _contactService.creer(
        _testProprieteUuid,
        const ContactCreateRequest(
          message: 'Test 15.2d-1 — POST contact data layer',
          typeDemande: 'INFO',
        ),
      );
      if (!mounted) return;
      setState(() {
        _contactLoading = false;
        _lastResult = '✓ Contact créé : ${contact.contactUuid}';
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _contactLoading = false;
        _lastResult = '✗ ${e.runtimeType} (${e.statusCode}) — ${e.message}';
      });
    }
  }

  Future<void> _testVisite() async {
    setState(() {
      _visiteLoading = true;
      _lastResult = null;
    });
    try {
      final demain = DateTime.now().add(const Duration(days: 1));
      final visite = await _visiteService.demander(
        _testProprieteUuid,
        VisiteCreateRequest(
          dateVisite: demain,
          heureVisite: '15:00:00',
          notesVisiteur: 'Test 15.2d-1 — POST visite data layer',
        ),
      );
      if (!mounted) return;
      setState(() {
        _visiteLoading = false;
        _lastResult = '✓ Visite créée : ${visite.visiteUuid} (${visite.statut})';
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _visiteLoading = false;
        _lastResult = '✗ ${e.runtimeType} (${e.statusCode}) — ${e.message}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Dev-only — tests data layer 15.2d-1',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              'Cible : $_testProprieteUuid',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _contactLoading ? null : _testContact,
              icon: _contactLoading
                  ? const SizedBox(
                      width: 16, height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.email_outlined),
              label: const Text('POST contact (INFO)'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _visiteLoading ? null : _testVisite,
              icon: _visiteLoading
                  ? const SizedBox(
                      width: 16, height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.event_outlined),
              label: const Text('POST visite (demain 15h)'),
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
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

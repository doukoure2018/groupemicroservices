import 'package:flutter/material.dart';

import '../../../../shared/http/api_exception.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/app_error.dart';
import '../../../../shared/widgets/app_loading.dart';
import '../../models/brouillon.dart';
import '../../models/brouillon_save_request.dart';
import '../../services/brouillon_service.dart';
import 'step_infos.dart';
import 'step_photos_placeholder.dart';
import 'step_profil.dart';
import 'step_validation_placeholder.dart';

/// Wizard publication d'annonce immobilière (Phase 15.2e-2 — squelette).
///
/// 4 étapes orchestrées via [PageView] avec [NeverScrollableScrollPhysics]
/// (la navigation est gouvernée par les boutons, pas par le swipe accidentel) :
///   1. Profil vendeur (check-or-create silencieux, cf. [StepProfil])
///   2. Infos du bien (long form, cf. [StepInfos])
///   3. Photos (placeholder en 15.2e-2, vrai écran en 15.2e-3)
///   4. Validation + Publication (placeholder en 15.2e-2, vrai écran en 15.2e-4)
///
/// Pattern brouillon :
/// - Au mount : GET /immo/brouillons → si liste non vide, dialog "Reprendre ou
///   Nouveau". Si vide, POST nouveau brouillon vide.
/// - À chaque Next d'une étape sauvegardable (≥2) : PUT /immo/brouillons/{uuid}
///   avec donneesJson mis à jour (sous-clés infosBien, photos, …).
/// - Le brouillon est consommé en 15.2e-4 via POST /materialiser, qui crée la
///   propriété en statut BROUILLON, puis on upload photos et publie.
///
/// AppBar back button : confirmation "Quitter sans publier ?" — le brouillon
/// reste en BD, l'utilisateur peut le reprendre plus tard.
class WizardPublicationScreen extends StatefulWidget {
  const WizardPublicationScreen({super.key});

  @override
  State<WizardPublicationScreen> createState() => _WizardPublicationScreenState();
}

class _WizardPublicationScreenState extends State<WizardPublicationScreen> {
  static const int _totalSteps = 4;

  final _brouillonService = BrouillonService();
  final _pageController = PageController();
  final _stepInfosKey = GlobalKey<StepInfosState>();

  // État global
  int _currentStep = 1;
  String? _brouillonUuid;
  Map<String, dynamic> _donneesJson = {};

  // UI states
  bool _bootLoading = true;
  AppException? _bootError;
  bool _stepActionLoading = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  // ============================================================
  // Bootstrap : reprise brouillon ou création nouveau
  // ============================================================

  Future<void> _bootstrap() async {
    setState(() {
      _bootLoading = true;
      _bootError = null;
    });
    try {
      final mes = await _brouillonService.mes();
      if (!mounted) return;
      if (mes.isEmpty) {
        await _createNewBrouillon();
      } else {
        final mostRecent = mes.first; // backend trie par derniere_modification DESC (à confirmer)
        final reprendre = await _askReprendreOuNouveau(mostRecent);
        if (!mounted) return;
        if (reprendre == true) {
          _adopterBrouillon(mostRecent);
        } else if (reprendre == false) {
          // Nouveau : supprimer l'ancien puis créer
          await _brouillonService.supprimer(mostRecent.brouillonUuid);
          if (!mounted) return;
          await _createNewBrouillon();
        } else {
          // null = dismiss : on quitte le wizard
          if (mounted) Navigator.of(context).pop();
          return;
        }
      }
      if (!mounted) return;
      setState(() => _bootLoading = false);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _bootError = e;
        _bootLoading = false;
      });
    }
  }

  Future<bool?> _askReprendreOuNouveau(Brouillon recent) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        title: const Text('Reprendre votre brouillon ?'),
        content: Text(
          'Vous avez un brouillon en cours (étape ${recent.etapeActuelle} sur $_totalSteps). '
          'Souhaitez-vous le reprendre ou en créer un nouveau ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Nouveau'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Reprendre'),
          ),
        ],
      ),
    );
  }

  Future<void> _createNewBrouillon() async {
    final created = await _brouillonService.creer(
      const BrouillonSaveRequest(etapeActuelle: 1, donneesJson: {}),
    );
    setState(() {
      _brouillonUuid = created.brouillonUuid;
      _donneesJson = {};
      _currentStep = 1;
    });
  }

  void _adopterBrouillon(Brouillon b) {
    setState(() {
      _brouillonUuid = b.brouillonUuid;
      _donneesJson = Map<String, dynamic>.from(b.donneesJson);
      _currentStep = b.etapeActuelle.clamp(1, _totalSteps);
    });
    // Saute à la page correspondante après le frame courant.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _pageController.hasClients) {
        _pageController.jumpToPage(_currentStep - 1);
      }
    });
  }

  // ============================================================
  // Navigation Next / Previous
  // ============================================================

  Future<void> _goNext() async {
    if (_currentStep == 2) {
      // Validation + collecte de l'étape Infos avant save.
      final state = _stepInfosKey.currentState;
      if (state == null || !state.validate()) return;
      _donneesJson['infosBien'] = state.collect();
    }
    // Étape 1 (profil) : pas de validation custom — le widget appelle déjà
    // onReady. Étapes 3-4 : placeholders, pas de save spécifique.

    final next = (_currentStep + 1).clamp(1, _totalSteps);
    await _persistAndGoTo(next);
  }

  Future<void> _persistAndGoTo(int targetStep) async {
    if (_brouillonUuid == null) return;
    setState(() => _stepActionLoading = true);
    try {
      final updated = await _brouillonService.maj(
        _brouillonUuid!,
        BrouillonSaveRequest(etapeActuelle: targetStep, donneesJson: _donneesJson),
      );
      if (!mounted) return;
      setState(() {
        _donneesJson = Map<String, dynamic>.from(updated.donneesJson);
        _currentStep = updated.etapeActuelle;
        _stepActionLoading = false;
      });
      _pageController.animateToPage(
        _currentStep - 1,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
      );
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _stepActionLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Sauvegarde brouillon : ${e.message}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  void _goPrevious() {
    if (_currentStep <= 1) return;
    // On ne sauvegarde PAS sur Previous (l'utilisateur revient corriger,
    // pas avancer). On met juste à jour etapeActuelle quand il sera reparti
    // vers l'avant via Next.
    setState(() => _currentStep -= 1);
    _pageController.animateToPage(
      _currentStep - 1,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
    );
  }

  Future<bool> _confirmExit() async {
    final r = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Quitter le wizard ?'),
        content: const Text(
          'Votre brouillon sera conservé. Vous pourrez le reprendre plus tard.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Quitter'),
          ),
        ],
      ),
    );
    return r ?? false;
  }

  // ============================================================
  // Build
  // ============================================================

  @override
  Widget build(BuildContext context) {
    final navigator = Navigator.of(context);
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (await _confirmExit() && mounted) navigator.pop();
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Publier une annonce'),
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () async {
              if (await _confirmExit() && mounted) navigator.pop();
            },
          ),
        ),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_bootLoading) return const AppLoading(label: 'Préparation du wizard…');
    if (_bootError != null) {
      return AppError(message: _bootError!.message, onRetry: _bootstrap);
    }
    return Column(
      children: [
        LinearProgressIndicator(
          value: _currentStep / _totalSteps,
          minHeight: 4,
          backgroundColor: AppColors.divider,
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              Text('Étape $_currentStep sur $_totalSteps',
                  style: Theme.of(context).textTheme.bodySmall),
              const Spacer(),
              if (_stepActionLoading)
                const SizedBox(
                  width: 14, height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
        ),
        Expanded(
          child: PageView(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            onPageChanged: (i) => setState(() => _currentStep = i + 1),
            children: [
              StepProfil(onReady: (_) {
                // Auto-advance UNIQUEMENT si on est encore sur l'étape 1
                // (sinon on déclencherait un saut intempestif si l'utilisateur
                // est revenu en arrière à des fins de re-vérification).
                if (_currentStep == 1) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted) _goNext();
                  });
                }
              }),
              StepInfos(
                stepKey: _stepInfosKey,
                initialValues: (_donneesJson['infosBien'] as Map<String, dynamic>?) ?? const {},
                onChanged: (infos) {
                  // Pas de save réseau à chaque keystroke — juste l'état local
                  // sera collecté au moment du Next.
                  _donneesJson['infosBien'] = infos;
                },
              ),
              const StepPhotosPlaceholder(),
              const StepValidationPlaceholder(),
            ],
          ),
        ),
        _bottomActions(),
      ],
    );
  }

  Widget _bottomActions() {
    final isLast = _currentStep == _totalSteps;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        child: Row(
          children: [
            if (_currentStep > 1)
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _stepActionLoading ? null : _goPrevious,
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Précédent'),
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                ),
              ),
            if (_currentStep > 1) const SizedBox(width: 12),
            Expanded(
              child: FilledButton.icon(
                onPressed: (_stepActionLoading || _currentStep == 1) ? null : _goNext,
                icon: Icon(isLast ? Icons.check : Icons.arrow_forward),
                label: Text(isLast ? 'Terminer (15.2e-4)' : 'Suivant'),
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

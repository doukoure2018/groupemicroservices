import 'package:flutter/material.dart';

import '../../../../shared/http/api_exception.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/app_error.dart';
import '../../../../shared/widgets/app_loading.dart';
import '../../models/brouillon.dart';
import '../../models/brouillon_save_request.dart';
import '../../models/propriete.dart';
import '../../services/brouillon_service.dart';
import '../../services/propriete_service.dart';
import 'step_infos.dart';
import 'step_photos.dart';
import 'step_profil.dart';
import 'step_validation_publication.dart';

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
  /// Si non-null, le wizard démarre en mode "reprise d'annonce rejetée" :
  /// - skip dialog "Reprendre / Nouveau" (on travaille sur cette propriété)
  /// - pré-remplit les 4 étapes depuis [repriseDepuisRejet] (T2)
  /// - à l'étape finale, appelle `updateAndPublier` au lieu de matérialiser (T4)
  final Propriete? repriseDepuisRejet;

  const WizardPublicationScreen({super.key, this.repriseDepuisRejet});

  @override
  State<WizardPublicationScreen> createState() => _WizardPublicationScreenState();
}

class _WizardPublicationScreenState extends State<WizardPublicationScreen> {
  static const int _totalSteps = 4;

  final _brouillonService = BrouillonService();
  final _proprieteService = ProprieteService();
  final _pageController = PageController();
  final _stepInfosKey = GlobalKey<StepInfosState>();
  final _stepPhotosKey = GlobalKey<StepPhotosState>();

  // État global
  int _currentStep = 1;
  String? _brouillonUuid;
  Map<String, dynamic> _donneesJson = {};

  /// Mode reprise REJETE : uuid de la Propriete sur laquelle re-publier à
  /// l'étape finale (cf T4 updateAndPublier vs matérialiser). Null en flow
  /// normal "création d'annonce".
  String? _repriseDepuisRejetUuid;

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
      // T1 : si mode reprise REJETE, on saute le dialog brouillons.
      if (widget.repriseDepuisRejet != null) {
        await _bootstrapReprise(widget.repriseDepuisRejet!);
      } else {
        await _bootstrapNormal();
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

  /// Flow standard : dialog "Reprendre / Nouveau" si brouillon existant.
  Future<void> _bootstrapNormal() async {
    final mes = await _brouillonService.mes();
    if (!mounted) return;
    if (mes.isEmpty) {
      await _createNewBrouillon();
    } else {
      final mostRecent = mes.first;
      final reprendre = await _askReprendreOuNouveau(mostRecent);
      if (!mounted) return;
      if (reprendre == true) {
        _adopterBrouillon(mostRecent);
      } else if (reprendre == false) {
        await _brouillonService.supprimer(mostRecent.brouillonUuid);
        if (!mounted) return;
        await _createNewBrouillon();
      } else {
        if (mounted) Navigator.of(context).pop();
        return;
      }
    }
  }

  /// Mode reprise REJETE (T1 + T2). Crée un brouillon temporaire avec
  /// donneesJson pré-rempli depuis [propriete] aux 4 étapes :
  ///   - etape1 : typeAnnonce, dureeLocation, typeBienCode
  ///   - etape2 : adresseComplete, lat, lng
  ///   - etape3 : prix, devise, periode, chambres, sdb, surface, commodites
  ///   - etape4 : titre, description, nomContactPublic
  /// On stocke l'uuid de la propriete pour T4 (updateAndPublier).
  /// On démarre directement à l'étape 2 (Infos), pas Profil — l'user a déjà
  /// publié donc son profil est validé.
  Future<void> _bootstrapReprise(Propriete propriete) async {
    _repriseDepuisRejetUuid = propriete.proprieteUuid;

    // Fetch typesBien pour mapper typeBienId → typeBienCode (StepInfos lit le code).
    final typesBien = await _proprieteService.listTypesBien();
    String? typeBienCode;
    for (final tb in typesBien) {
      if (tb.typeBienId == propriete.typeBienId) {
        typeBienCode = tb.code;
        break;
      }
    }

    final donneesJson = <String, dynamic>{
      'etape1': {
        'typeAnnonce': propriete.typeAnnonce,
        if (propriete.dureeLocation != null) 'dureeLocation': propriete.dureeLocation,
        if (typeBienCode != null) 'typeBienCode': typeBienCode,
      },
      'etape2': {
        if (propriete.adresseComplete != null) 'adresseComplete': propriete.adresseComplete,
        if (propriete.latitude != null) 'latitude': propriete.latitude,
        if (propriete.longitude != null) 'longitude': propriete.longitude,
      },
      'etape3': {
        'prix': propriete.prix,
        'devise': propriete.devise,
        if (propriete.periode != null) 'periode': propriete.periode,
        'prixSurDemande': propriete.prixSurDemande,
        'prixNegociable': propriete.prixNegociable,
        if (propriete.nombreChambres != null) 'nombreChambres': propriete.nombreChambres,
        if (propriete.nombreSallesBain != null) 'nombreSallesBain': propriete.nombreSallesBain,
        if (propriete.surfaceM2 != null) 'surfaceM2': propriete.surfaceM2,
        'commoditesCodes': propriete.commodites.map((c) => c.code).toList(),
      },
      'etape4': {
        'titre': propriete.titre,
        if (propriete.description != null) 'description': propriete.description,
        if (propriete.nomContactPublic != null) 'nomContactPublic': propriete.nomContactPublic,
      },
    };

    final created = await _brouillonService.creer(
      BrouillonSaveRequest(etapeActuelle: 2, donneesJson: donneesJson),
    );
    setState(() {
      _brouillonUuid = created.brouillonUuid;
      _donneesJson = donneesJson;
      _currentStep = 2; // skip Profil — déjà validé puisque l'user a publié
    });
    // Avance directement à la step 2 (Infos) après le frame.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _pageController.hasClients) {
        _pageController.jumpToPage(1); // index 1 = step 2 Infos
      }
    });
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
      // Validation + collecte de l'étape Infos avant save. Le `collect()`
      // retourne 4 sous-maps {etape1, etape2, etape3, etape4} conformes au
      // contrat backend `BrouillonServiceImpl.toCreateRequest`. On merge
      // CHAQUE clé à la racine de _donneesJson — PAS sous un wrapper
      // "infosBien", sinon materialiser() renvoie "Champ obligatoire
      // manquant : etape1.typeAnnonce".
      final state = _stepInfosKey.currentState;
      if (state == null || !state.validate()) return;
      final collected = state.collect();
      for (final entry in collected.entries) {
        _donneesJson[entry.key] = entry.value;
      }
    } else if (_currentStep == 3) {
      // Étape Photos : la liste est sérialisée en List<Map> et rangée sous
      // donneesJson.photos. Le backend l'ignore lors de materialiser (les
      // vraies photos sont uploadées via POST /immo/proprietes/{uuid}/photos
      // en étape 4), c'est juste pour la persistence brouillon mobile-side.
      final state = _stepPhotosKey.currentState;
      if (state == null || !state.validate()) return;
      _donneesJson['photos'] = state.collect().map((p) => p.toJson()).toList();
    }
    // Étape 1 (profil) : pas de validation custom — le widget appelle déjà
    // onReady. Étape 4 (validation) : le bouton Publier est dans la step.

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
                // initialValues = _donneesJson complet pour que StepInfos
                // lise etape1/2/3/4 directement (contrat backend).
                initialValues: _donneesJson,
                onChanged: (collected) {
                  // Pas de save réseau à chaque keystroke — juste l'état local
                  // sera collecté au moment du Next. Merge des 4 sous-maps
                  // à la racine.
                  for (final entry in collected.entries) {
                    _donneesJson[entry.key] = entry.value;
                  }
                },
              ),
              StepPhotos(
                stepKey: _stepPhotosKey,
                initialValues: {
                  'photos': _donneesJson['photos'] ?? const [],
                },
                onChanged: (photos) {
                  _donneesJson['photos'] = photos.map((p) => p.toJson()).toList();
                },
                // T3a : photos déjà uploadées sur MinIO en mode reprise REJETE,
                // affichées read-only. Null en flow normal.
                remotePhotos: widget.repriseDepuisRejet?.photos,
              ),
              StepValidationPublication(
                brouillonUuid: _brouillonUuid,
                donneesJson: _donneesJson,
                // T4 : mode reprise REJETE → updateAndPublier au lieu de
                // matérialiser + cleanup brouillon temp en fin de séquence.
                repriseDepuisRejetUuid: _repriseDepuisRejetUuid,
                onCompleted: () {
                  // Le wizard est terminé (succès ou message "brouillon
                  // sauvegardé"). On ferme l'écran et on revient à la recherche.
                  if (mounted) Navigator.of(context).pop();
                },
                onRetourPhotos: () {
                  // Retour à l'étape Photos suite à 0 upload réussi.
                  setState(() => _currentStep = 3);
                  _pageController.animateToPage(
                    2,
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeInOut,
                  );
                },
              ),
            ],
          ),
        ),
        _bottomActions(),
      ],
    );
  }

  Widget _bottomActions() {
    // Sur l'étape 4 (Validation), le bouton "Publier" est intégré DANS la step
    // — la bottom bar ne propose que "Précédent" pour repartir corriger.
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
            if (_currentStep > 1 && !isLast) const SizedBox(width: 12),
            if (!isLast)
              Expanded(
                child: FilledButton.icon(
                  onPressed: (_stepActionLoading || _currentStep == 1) ? null : _goNext,
                  icon: const Icon(Icons.arrow_forward),
                  label: const Text('Suivant'),
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

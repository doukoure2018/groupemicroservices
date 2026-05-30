import 'package:flutter/material.dart';

import '../../../../shared/http/api_exception.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/app_error.dart';
import '../../../../shared/widgets/app_loading.dart';
import '../../models/profil_immo.dart';
import '../../models/profil_immo_request.dart';
import '../../services/profil_immo_service.dart';

/// Étape 1 du wizard publication — Profil vendeur.
///
/// Comportement check-or-create SILENCIEUX (décision validée en 15.2e plan) :
///   - Au mount : GET /immo/profils/me
///   - Si profil existe → appelle [onReady] immédiatement → coordinateur
///     auto-advance étape 2.
///   - Si null (pas de profil) : POST /immo/profils typeProfil=PROPRIETAIRE_SIMPLE
///     en arrière-plan → onReady → auto-advance étape 2.
///   - Si POST échoue : affiche [AppError] avec retry (utilisateur peut tenter
///     à nouveau ; pas de formulaire manuel typeProfil en MVP — dette AGENT_AGENCE
///     hors scope).
///
/// L'utilisateur ne voit que [AppLoading] pendant le check (~500ms), ou [AppError]
/// si quelque chose plante. Pas de saisie sur cette étape — d'où le "silencieux".
class StepProfil extends StatefulWidget {
  /// Callback notifié quand le profil est en place. Le coordinateur peut alors
  /// auto-advance via PageController.nextPage().
  final void Function(ProfilImmo profil) onReady;

  const StepProfil({super.key, required this.onReady});

  @override
  State<StepProfil> createState() => _StepProfilState();
}

class _StepProfilState extends State<StepProfil>
    with AutomaticKeepAliveClientMixin {
  final _service = ProfilImmoService();

  bool _loading = true;
  AppException? _error;
  String? _statusText;

  @override
  bool get wantKeepAlive => true; // PageView garde le state sur swipe

  @override
  void initState() {
    super.initState();
    _ensureProfil();
  }

  Future<void> _ensureProfil() async {
    setState(() {
      _loading = true;
      _error = null;
      _statusText = 'Vérification du profil…';
    });
    try {
      var profil = await _service.getMien();
      if (profil == null) {
        if (!mounted) return;
        setState(() => _statusText = 'Création du profil vendeur…');
        profil = await _service.creer(const ProfilImmoRequest(
          typeProfil: 'PROPRIETAIRE_SIMPLE',
        ));
      }
      if (!mounted) return;
      setState(() => _loading = false);
      widget.onReady(profil);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_loading) {
      return AppLoading(label: _statusText ?? 'Préparation…');
    }
    if (_error != null) {
      return AppError(message: _error!.message, onRetry: _ensureProfil);
    }
    // Cas attendu : onReady a déjà déclenché un auto-advance et cette vue
    // ne sera affichée que brièvement. Fallback visuel discret.
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle_outline, color: AppColors.success, size: 48),
          const SizedBox(height: 12),
          Text('Profil prêt', style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}

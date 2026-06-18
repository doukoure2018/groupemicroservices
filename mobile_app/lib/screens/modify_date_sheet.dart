import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/commande.dart';
import '../models/offre.dart';
import '../services/billetterie_service.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

/// Bottom sheet de changement de date d'une réservation.
/// Liste les autres offres du même trajet (GET offres-alternatives) et déplace
/// la commande vers l'offre choisie (PUT modifier-date). Montant inchangé.
class ModifyDateSheet extends StatefulWidget {
  final Commande commande;

  const ModifyDateSheet({super.key, required this.commande});

  /// Renvoie `true` si la date a été modifiée.
  static Future<bool?> show(BuildContext context, Commande commande) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ModifyDateSheet(commande: commande),
    );
  }

  @override
  State<ModifyDateSheet> createState() => _ModifyDateSheetState();
}

class _ModifyDateSheetState extends State<ModifyDateSheet> {
  final BilletterieService _service = BilletterieService();
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _error;
  List<Offre> _offres = [];
  String? _selectedUuid;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final offres =
          await _service.getOffresAlternatives(widget.commande.commandeUuid);
      if (!mounted) return;
      setState(() {
        _offres = offres;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Impossible de charger les autres dates.';
        _isLoading = false;
      });
    }
  }

  Future<void> _submit() async {
    if (_selectedUuid == null || _isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      await _service.modifierDateCommande(
        commandeUuid: widget.commande.commandeUuid,
        nouvelleOffreUuid: _selectedUuid!,
      );
      if (!mounted) return;
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Date de voyage modifiée avec succès.'),
          backgroundColor: ColorManager.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_extractMessage(e)),
          backgroundColor: ColorManager.error,
        ),
      );
    }
  }

  String _extractMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] is String &&
          (data['message'] as String).isNotEmpty) {
        return data['message'] as String;
      }
    }
    return 'Modification impossible. Réessayez.';
  }

  String _formatDate(String? iso) {
    if (iso == null || iso.length < 10) return iso ?? '';
    final p = iso.substring(0, 10).split('-');
    return p.length == 3 ? '${p[2]}/${p[1]}/${p[0]}' : iso;
  }

  String _formatTime(String? t) =>
      (t != null && t.length >= 5) ? t.substring(0, 5) : (t ?? '');

  String _formatPrice(double p) => p.toInt().toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]} ',
      );

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
      ),
      decoration: const BoxDecoration(
        color: ColorManager.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(
          AppPadding.p20, AppPadding.p12, AppPadding.p20, AppPadding.p20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: ColorManager.grey1,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: AppSize.s16),
          Text(
            'Changer la date',
            style: getSemiBoldStyle(
              color: ColorManager.textPrimary,
              fontSize: FontSize.s20,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${widget.commande.villeDepartLibelle} → ${widget.commande.villeArriveeLibelle} · '
            '${widget.commande.nombrePlaces} place${widget.commande.nombrePlaces > 1 ? 's' : ''}',
            style: getRegularStyle(
              color: ColorManager.textSecondary,
              fontSize: FontSize.s14,
            ),
          ),
          const SizedBox(height: AppSize.s16),
          Flexible(child: _buildContent()),
          const SizedBox(height: AppSize.s12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed:
                  (_selectedUuid == null || _isSubmitting) ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: ColorManager.primary,
                foregroundColor: ColorManager.white,
                disabledBackgroundColor: ColorManager.grey1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: ColorManager.white),
                    )
                  : Text(
                      'Confirmer le changement',
                      style: getSemiBoldStyle(
                        color: ColorManager.white,
                        fontSize: FontSize.s16,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Le montant payé reste inchangé.',
            style: getRegularStyle(
              color: ColorManager.textTertiary,
              fontSize: FontSize.s11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(
            child: CircularProgressIndicator(color: ColorManager.primary)),
      );
    }
    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Column(
          children: [
            Text(_error!,
                textAlign: TextAlign.center,
                style: getRegularStyle(
                    color: ColorManager.textSecondary,
                    fontSize: FontSize.s14)),
            const SizedBox(height: 12),
            TextButton(onPressed: _load, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    if (_offres.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            const Icon(Icons.event_busy,
                size: 48, color: ColorManager.textTertiary),
            const SizedBox(height: 12),
            Text(
              'Aucune autre date disponible pour ce trajet.',
              textAlign: TextAlign.center,
              style: getMediumStyle(
                  color: ColorManager.textSecondary, fontSize: FontSize.s14),
            ),
          ],
        ),
      );
    }
    return ListView.separated(
      shrinkWrap: true,
      itemCount: _offres.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppSize.s8),
      itemBuilder: (_, i) => _buildOffreTile(_offres[i]),
    );
  }

  Widget _buildOffreTile(Offre offre) {
    final selected = _selectedUuid == offre.offreUuid;
    return GestureDetector(
      onTap: _isSubmitting
          ? null
          : () => setState(() => _selectedUuid = offre.offreUuid),
      child: Container(
        padding: const EdgeInsets.all(AppPadding.p14),
        decoration: BoxDecoration(
          color: selected ? ColorManager.infoLight : ColorManager.white,
          borderRadius: BorderRadius.circular(AppRadius.r12),
          border: Border.all(
            color: selected ? ColorManager.primary : ColorManager.grey1,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              selected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_unchecked,
              color: selected ? ColorManager.primary : ColorManager.grey2,
              size: 22,
            ),
            const SizedBox(width: AppSize.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Date/heure + prix
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${_formatDate(offre.dateDepart)} · ${_formatTime(offre.heureDepart)}',
                          style: getSemiBoldStyle(
                              color: ColorManager.textPrimary,
                              fontSize: FontSize.s14),
                        ),
                      ),
                      Text(
                        '${_formatPrice(offre.montant)} ${offre.devise ?? 'GNF'}',
                        style: getSemiBoldStyle(
                            color: ColorManager.primary, fontSize: FontSize.s14),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Véhicule · clim · note
                  Wrap(
                    spacing: 12,
                    runSpacing: 4,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      if (offre.typeVehiculeLibelle != null &&
                          offre.typeVehiculeLibelle!.isNotEmpty)
                        _infoChip(Icons.directions_bus_outlined,
                            offre.typeVehiculeLibelle!),
                      if (offre.vehiculeClimatise)
                        _infoChip(Icons.ac_unit, 'Clim',
                            color: ColorManager.info),
                      if (offre.noteMoyenne != null && offre.noteMoyenne! > 0)
                        _infoChip(Icons.star_rounded,
                            offre.noteMoyenne!.toStringAsFixed(1),
                            color: ColorManager.starRating),
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Chauffeur · places
                  Row(
                    children: [
                      if (offre.nomChauffeur != null &&
                          offre.nomChauffeur!.isNotEmpty) ...[
                        const Icon(Icons.person_outline,
                            size: 13, color: ColorManager.textTertiary),
                        const SizedBox(width: 3),
                        Flexible(
                          child: Text(
                            offre.nomChauffeur!,
                            overflow: TextOverflow.ellipsis,
                            style: getRegularStyle(
                                color: ColorManager.textSecondary,
                                fontSize: FontSize.s12),
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      const Icon(Icons.event_seat_outlined,
                          size: 13, color: ColorManager.textTertiary),
                      const SizedBox(width: 3),
                      Text(
                        '${offre.nombrePlacesDisponibles} dispo',
                        style: getRegularStyle(
                            color: ColorManager.textTertiary,
                            fontSize: FontSize.s12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoChip(IconData icon, String label, {Color? color}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color ?? ColorManager.textSecondary),
        const SizedBox(width: 3),
        Text(
          label,
          style: getRegularStyle(
              color: ColorManager.textSecondary, fontSize: FontSize.s12),
        ),
      ],
    );
  }
}

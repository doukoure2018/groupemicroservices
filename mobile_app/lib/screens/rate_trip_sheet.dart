import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/commande.dart';
import '../services/billetterie_service.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

/// Bottom sheet de notation d'un voyage terminé.
///
/// Branchée sur `POST /billetterie/avis` (note 1-5 + commentaire optionnel).
/// Renvoie `true` via [Navigator.pop] si l'avis a été soumis avec succès, afin
/// que l'écran appelant marque la commande comme notée.
class RateTripSheet extends StatefulWidget {
  final Commande commande;

  const RateTripSheet({super.key, required this.commande});

  /// Affiche la sheet et renvoie `true` si un avis a été enregistré.
  static Future<bool?> show(BuildContext context, Commande commande) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => RateTripSheet(commande: commande),
    );
  }

  @override
  State<RateTripSheet> createState() => _RateTripSheetState();
}

class _RateTripSheetState extends State<RateTripSheet> {
  final BilletterieService _billetterieService = BilletterieService();
  final TextEditingController _commentController = TextEditingController();
  int _note = 0;
  bool _isSubmitting = false;

  static const List<String> _labels = [
    '',
    'Très insatisfait',
    'Insatisfait',
    'Correct',
    'Satisfait',
    'Excellent',
  ];

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_note == 0 || _isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      await _billetterieService.createAvis(
        commandeUuid: widget.commande.commandeUuid,
        note: _note,
        commentaire: _commentController.text,
      );
      if (!mounted) return;
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Merci ! Votre avis a bien été enregistré.'),
          backgroundColor: ColorManager.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      final message = _extractMessage(e);
      // "Un avis a déjà été donné" => la commande est en réalité déjà notée :
      // on referme et on la marque côté appelant pour cacher le bouton.
      final alreadyRated = message.toLowerCase().contains('déjà');
      if (alreadyRated) {
        Navigator.pop(context, true);
      } else {
        setState(() => _isSubmitting = false);
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: alreadyRated
              ? ColorManager.warning
              : ColorManager.error,
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
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.connectionError) {
        return 'Connexion impossible. Vérifiez votre réseau.';
      }
    }
    return 'Impossible d’envoyer votre avis. Réessayez.';
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final commande = widget.commande;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        decoration: const BoxDecoration(
          color: ColorManager.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(
          AppPadding.p20,
          AppPadding.p12,
          AppPadding.p20,
          AppPadding.p20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Grab handle
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
            const SizedBox(height: AppSize.s20),

            Text(
              'Notez votre voyage',
              style: getSemiBoldStyle(
                color: ColorManager.textPrimary,
                fontSize: FontSize.s20,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${commande.villeDepartLibelle} → ${commande.villeArriveeLibelle}',
              style: getRegularStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s14,
              ),
            ),
            const SizedBox(height: AppSize.s20),

            // Star selector
            Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (i) {
                  final value = i + 1;
                  final selected = value <= _note;
                  return GestureDetector(
                    onTap: _isSubmitting
                        ? null
                        : () => setState(() => _note = value),
                    behavior: HitTestBehavior.opaque,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Icon(
                        selected ? Icons.star_rounded : Icons.star_outline_rounded,
                        size: 44,
                        color: selected
                            ? ColorManager.starRating
                            : ColorManager.grey2,
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: AppSize.s8),
            Center(
              child: Text(
                _note == 0 ? 'Touchez une étoile' : _labels[_note],
                style: getMediumStyle(
                  color: _note == 0
                      ? ColorManager.textTertiary
                      : ColorManager.textSecondary,
                  fontSize: FontSize.s14,
                ),
              ),
            ),
            const SizedBox(height: AppSize.s20),

            // Optional comment
            TextField(
              controller: _commentController,
              enabled: !_isSubmitting,
              maxLines: 3,
              maxLength: 500,
              textInputAction: TextInputAction.newline,
              style: getRegularStyle(
                color: ColorManager.textPrimary,
                fontSize: FontSize.s14,
              ),
              decoration: InputDecoration(
                hintText: 'Laissez un commentaire (optionnel)',
                hintStyle: getRegularStyle(
                  color: ColorManager.textTertiary,
                  fontSize: FontSize.s14,
                ),
                counterText: '',
                filled: true,
                fillColor: ColorManager.lightGrey,
                contentPadding: const EdgeInsets.all(AppPadding.p12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                  borderSide: const BorderSide(color: ColorManager.primary),
                ),
              ),
            ),
            const SizedBox(height: AppSize.s16),

            // Submit
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_note == 0 || _isSubmitting) ? null : _submit,
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
                          strokeWidth: 2,
                          color: ColorManager.white,
                        ),
                      )
                    : Text(
                        'Envoyer mon avis',
                        style: getSemiBoldStyle(
                          color: ColorManager.white,
                          fontSize: FontSize.s16,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

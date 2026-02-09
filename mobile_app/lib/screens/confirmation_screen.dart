import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

class ConfirmationScreen extends StatelessWidget {
  final String orderNumber;
  final String departure;
  final String destination;
  final DateTime date;
  final String time;
  final int passengerCount;
  final int amountPaid;
  final VoidCallback? onViewTickets;
  final VoidCallback? onGoHome;

  const ConfirmationScreen({
    super.key,
    required this.orderNumber,
    required this.departure,
    required this.destination,
    required this.date,
    required this.time,
    required this.passengerCount,
    required this.amountPaid,
    this.onViewTickets,
    this.onGoHome,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppPadding.p24),
          child: Column(
            children: [
              const SizedBox(height: AppSize.s32),

              // Success icon
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: ColorManager.primarySurface,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle,
                  color: ColorManager.primary,
                  size: 64,
                ),
              ),
              const SizedBox(height: AppSize.s24),

              // Success message
              Text(
                'Paiement réussi !',
                style: getBoldStyle(
                  color: ColorManager.textPrimary,
                  fontSize: 28,
                ),
              ),
              const SizedBox(height: AppSize.s8),
              Text(
                'Votre réservation est confirmée',
                style: getRegularStyle(
                  color: ColorManager.textSecondary,
                  fontSize: FontSize.s16,
                ),
              ),
              const SizedBox(height: AppSize.s32),

              // Order details card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppPadding.p20),
                decoration: BoxDecoration(
                  color: ColorManager.lightGrey,
                  borderRadius: BorderRadius.circular(AppRadius.r16),
                ),
                child: Column(
                  children: [
                    _buildDetailRow('N° Commande', orderNumber, isBold: true),
                    const SizedBox(height: AppSize.s12),
                    _buildDetailRow('Trajet', '$departure → $destination'),
                    const SizedBox(height: AppSize.s12),
                    _buildDetailRow(
                      'Date',
                      '${date.day}/${date.month}/${date.year} à $time',
                    ),
                    const SizedBox(height: AppSize.s12),
                    _buildDetailRow('Passagers', passengerCount.toString()),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: AppPadding.p12),
                      child: Divider(),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Montant payé',
                          style: getBoldStyle(
                            color: ColorManager.textPrimary,
                            fontSize: FontSize.s16,
                          ),
                        ),
                        Text(
                          '${_formatPrice(amountPaid)} GNF',
                          style: getBoldStyle(
                            color: ColorManager.primary,
                            fontSize: FontSize.s18,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSize.s20),

              // SMS notification
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppPadding.p16),
                decoration: BoxDecoration(
                  color: ColorManager.infoLight,
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.mail_outline,
                      color: ColorManager.info,
                      size: 20,
                    ),
                    const SizedBox(width: AppSize.s12),
                    Expanded(
                      child: Text(
                        'Un SMS de confirmation a été envoyé au +224 620 XX XX XX',
                        style: getRegularStyle(
                          color: ColorManager.info,
                          fontSize: FontSize.s14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSize.s32),

              // Buttons
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: onViewTickets,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorManager.primary,
                    foregroundColor: ColorManager.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'Voir mes billets',
                    style: getSemiBoldStyle(
                      color: ColorManager.white,
                      fontSize: FontSize.s16,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSize.s12),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: onGoHome,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: ColorManager.textSecondary,
                    side: const BorderSide(color: ColorManager.grey1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                  ),
                  child: Text(
                    'Retour à l\'accueil',
                    style: getSemiBoldStyle(
                      color: ColorManager.textSecondary,
                      fontSize: FontSize.s16,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: getRegularStyle(
            color: ColorManager.textSecondary,
            fontSize: FontSize.s14,
          ),
        ),
        Text(
          value,
          style: isBold
              ? getMediumStyle(
                  color: ColorManager.textPrimary,
                  fontSize: FontSize.s14,
                ).copyWith(fontFamily: 'monospace')
              : getMediumStyle(
                  color: ColorManager.textPrimary,
                  fontSize: FontSize.s14,
                ),
        ),
      ],
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]} ',
    );
  }
}

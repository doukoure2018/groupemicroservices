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
  final String billetCodes;
  final String referencePaiement;
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
    this.billetCodes = '',
    this.referencePaiement = '',
    this.onViewTickets,
    this.onGoHome,
  });

  String get _formattedDate =>
      '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

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

              // Success icon with accent ring
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: ColorManager.successLight,
                  shape: BoxShape.circle,
                  border: Border.all(color: ColorManager.success, width: 3),
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: ColorManager.success,
                  size: 56,
                ),
              ),
              const SizedBox(height: AppSize.s24),

              // Success message
              Text(
                'Paiement r\u00e9ussi !',
                style: getBoldStyle(
                  color: ColorManager.textPrimary,
                  fontSize: 26,
                ),
              ),
              const SizedBox(height: AppSize.s8),
              Text(
                'Votre r\u00e9servation est confirm\u00e9e',
                style: getRegularStyle(
                  color: ColorManager.textSecondary,
                  fontSize: FontSize.s16,
                ),
              ),
              const SizedBox(height: AppSize.s32),

              // Order details card
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: ColorManager.white,
                  borderRadius: BorderRadius.circular(AppRadius.r16),
                  boxShadow: [
                    BoxShadow(
                      color: ColorManager.primary.withValues(alpha: 0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Card header
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        vertical: 12,
                        horizontal: AppPadding.p20,
                      ),
                      decoration: const BoxDecoration(
                        gradient: ColorManager.cardGradient,
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(AppRadius.r16),
                          topRight: Radius.circular(AppRadius.r16),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.receipt_long,
                            color: ColorManager.white,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'D\u00e9tails de la commande',
                            style: getSemiBoldStyle(
                              color: ColorManager.white,
                              fontSize: FontSize.s14,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Accent line
                    Container(
                      width: double.infinity,
                      height: 3,
                      color: ColorManager.accent,
                    ),

                    // Details content
                    Padding(
                      padding: const EdgeInsets.all(AppPadding.p20),
                      child: Column(
                        children: [
                          _buildDetailRow(
                            Icons.tag,
                            'N\u00b0 Commande',
                            orderNumber,
                            isBold: true,
                          ),
                          const SizedBox(height: AppSize.s12),
                          _buildDetailRow(
                            Icons.route,
                            'Trajet',
                            '$departure - $destination',
                          ),
                          const SizedBox(height: AppSize.s12),
                          _buildDetailRow(
                            Icons.calendar_today_outlined,
                            'Date',
                            '$_formattedDate \u00e0 $time',
                          ),
                          const SizedBox(height: AppSize.s12),
                          _buildDetailRow(
                            Icons.people_outline,
                            'Passagers',
                            passengerCount.toString(),
                          ),
                          if (billetCodes.isNotEmpty) ...[
                            const SizedBox(height: AppSize.s12),
                            _buildDetailRow(
                              Icons.confirmation_number_outlined,
                              'Code(s) billet',
                              billetCodes,
                              isBold: true,
                              valueColor: ColorManager.primary,
                            ),
                          ],
                          if (referencePaiement.isNotEmpty) ...[
                            const SizedBox(height: AppSize.s12),
                            _buildDetailRow(
                              Icons.payment,
                              'Ref. paiement',
                              referencePaiement,
                            ),
                          ],
                          const Padding(
                            padding: EdgeInsets.symmetric(
                              vertical: AppPadding.p12,
                            ),
                            child: Divider(color: ColorManager.grey1),
                          ),
                          // Montant
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Montant pay\u00e9',
                                style: getBoldStyle(
                                  color: ColorManager.textPrimary,
                                  fontSize: FontSize.s16,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: ColorManager.primarySurface,
                                  borderRadius: BorderRadius.circular(
                                    AppRadius.r8,
                                  ),
                                ),
                                child: Text(
                                  '${_formatPrice(amountPaid)} GNF',
                                  style: getBoldStyle(
                                    color: ColorManager.primary,
                                    fontSize: FontSize.s18,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSize.s20),

              // Info notification
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppPadding.p16),
                decoration: BoxDecoration(
                  color: ColorManager.warningLight,
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                  border: Border.all(
                    color: ColorManager.warning.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.info_outline,
                      color: ColorManager.accentDark,
                      size: 20,
                    ),
                    const SizedBox(width: AppSize.s12),
                    Expanded(
                      child: Text(
                        'Pr\u00e9sentez votre code billet au chauffeur le jour du d\u00e9part. Un email et SMS de confirmation vous ont \u00e9t\u00e9 envoy\u00e9s.',
                        style: getMediumStyle(
                          color: ColorManager.accentDark,
                          fontSize: FontSize.s13,
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
                child: ElevatedButton.icon(
                  onPressed: onViewTickets,
                  icon: const Icon(
                    Icons.confirmation_number_outlined,
                    size: 20,
                  ),
                  label: Text(
                    'Voir mes billets',
                    style: getSemiBoldStyle(
                      color: ColorManager.white,
                      fontSize: FontSize.s16,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorManager.accent,
                    foregroundColor: ColorManager.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(height: AppSize.s12),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton.icon(
                  onPressed: onGoHome,
                  icon: const Icon(Icons.home_outlined, size: 20),
                  label: Text(
                    'Retour \u00e0 l\'accueil',
                    style: getSemiBoldStyle(
                      color: ColorManager.textSecondary,
                      fontSize: FontSize.s16,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: ColorManager.textSecondary,
                    side: const BorderSide(color: ColorManager.grey1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r16),
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

  Widget _buildDetailRow(
    IconData icon,
    String label,
    String value, {
    bool isBold = false,
    Color? valueColor,
  }) {
    return Row(
      children: [
        Icon(icon, color: ColorManager.textTertiary, size: 16),
        const SizedBox(width: 8),
        Text(
          label,
          style: getRegularStyle(
            color: ColorManager.textSecondary,
            fontSize: FontSize.s14,
          ),
        ),
        const Spacer(),
        Flexible(
          child: Text(
            value,
            style: isBold
                ? getMediumStyle(
                    color: valueColor ?? ColorManager.textPrimary,
                    fontSize: FontSize.s14,
                  ).copyWith(fontFamily: 'monospace', letterSpacing: 0.5)
                : getMediumStyle(
                    color: valueColor ?? ColorManager.textPrimary,
                    fontSize: FontSize.s14,
                  ),
            textAlign: TextAlign.right,
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

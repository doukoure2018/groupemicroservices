import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

class TicketScreen extends StatelessWidget {
  final String ticketCode;
  final String passengerName;
  final String departure;
  final String destination;
  final DateTime date;
  final String time;
  final String vehiclePlate;
  final String driverName;
  final String meetingPoint;

  const TicketScreen({
    super.key,
    required this.ticketCode,
    required this.passengerName,
    required this.departure,
    required this.destination,
    required this.date,
    required this.time,
    required this.vehiclePlate,
    required this.driverName,
    required this.meetingPoint,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      appBar: AppBar(
        backgroundColor: ColorManager.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: ColorManager.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Mon Billet',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s18,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share, color: ColorManager.textSecondary),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppPadding.p16),
        child: Column(
          children: [
            // Ticket card
            Container(
              decoration: BoxDecoration(
                color: ColorManager.white,
                borderRadius: BorderRadius.circular(AppRadius.r20),
                border: Border.all(
                  color: ColorManager.primary.withOpacity(0.3),
                  width: 2,
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                children: [
                  // Ticket header
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: AppPadding.p8),
                    decoration: BoxDecoration(
                      color: ColorManager.primary,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(AppRadius.r18),
                        topRight: Radius.circular(AppRadius.r18),
                      ),
                    ),
                    child: Text(
                      'BILLET ÉLECTRONIQUE',
                      textAlign: TextAlign.center,
                      style: getMediumStyle(
                        color: ColorManager.white,
                        fontSize: FontSize.s12,
                      ),
                    ),
                  ),

                  // Ticket content
                  Padding(
                    padding: const EdgeInsets.all(AppPadding.p20),
                    child: Column(
                      children: [
                        // Ticket code
                        Text(
                          'Code billet',
                          style: getRegularStyle(
                            color: ColorManager.textSecondary,
                            fontSize: FontSize.s12,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          ticketCode,
                          style: getBoldStyle(
                            color: ColorManager.primary,
                            fontSize: 24,
                          ).copyWith(
                            fontFamily: 'monospace',
                            letterSpacing: 2,
                          ),
                        ),
                        const SizedBox(height: AppSize.s20),

                        // QR Code placeholder
                        Container(
                          width: 160,
                          height: 160,
                          decoration: BoxDecoration(
                            color: ColorManager.textPrimary,
                            borderRadius: BorderRadius.circular(AppRadius.r12),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.qr_code_2,
                              color: ColorManager.white,
                              size: 120,
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSize.s20),

                        // Dashed divider
                        Row(
                          children: List.generate(
                            30,
                            (index) => Expanded(
                              child: Container(
                                height: 1,
                                color: index.isEven
                                    ? ColorManager.grey1
                                    : Colors.transparent,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSize.s20),

                        // Ticket details
                        _buildTicketRow('Passager', passengerName),
                        _buildTicketRow('Trajet', '$departure → $destination'),
                        _buildTicketRow(
                          'Date & Heure',
                          '${date.day}/${date.month}/${date.year} • $time',
                        ),
                        _buildTicketRow('Véhicule', vehiclePlate),
                        _buildTicketRow('Chauffeur', driverName),
                      ],
                    ),
                  ),

                  // Meeting point
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.fromLTRB(
                      AppPadding.p20,
                      0,
                      AppPadding.p20,
                      AppPadding.p20,
                    ),
                    padding: const EdgeInsets.all(AppPadding.p12),
                    decoration: BoxDecoration(
                      color: ColorManager.warningLight,
                      borderRadius: BorderRadius.circular(AppRadius.r8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.location_on,
                          color: ColorManager.accentDark,
                          size: 20,
                        ),
                        const SizedBox(width: AppSize.s8),
                        Expanded(
                          child: Text(
                            'RDV: $meetingPoint',
                            style: getMediumStyle(
                              color: ColorManager.accentDark,
                              fontSize: FontSize.s12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSize.s20),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.download),
                    label: const Text('PDF'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: ColorManager.textSecondary,
                      side: const BorderSide(color: ColorManager.grey1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.r12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
                const SizedBox(width: AppSize.s12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.share),
                    label: const Text('Partager'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: ColorManager.textSecondary,
                      side: const BorderSide(color: ColorManager.grey1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.r12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppPadding.p12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: getRegularStyle(
              color: ColorManager.textSecondary,
              fontSize: FontSize.s14,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: getMediumStyle(
                color: ColorManager.textPrimary,
                fontSize: FontSize.s14,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}

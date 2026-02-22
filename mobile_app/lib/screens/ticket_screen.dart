import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart' show Share;
import '../models/billet.dart';
import '../services/ticket_pdf_service.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

class TicketScreen extends StatelessWidget {
  final Billet billet;
  final String departure;
  final String destination;
  final DateTime date;
  final String time;
  final String vehiclePlate;
  final String driverName;
  final String meetingPoint;

  const TicketScreen({
    super.key,
    required this.billet,
    required this.departure,
    required this.destination,
    required this.date,
    required this.time,
    this.vehiclePlate = '',
    this.driverName = '',
    this.meetingPoint = '',
  });

  String get _formattedDate =>
      '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

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
            icon: const Icon(Icons.share, color: ColorManager.accent),
            onPressed: () async {
              await Share.share(
                'Mon billet YIGUI\n'
                'Code: ${billet.codeBillet}\n'
                'Trajet: $departure - $destination\n'
                'Date: $_formattedDate a $time\n'
                'Passager: ${billet.nomPassager}',
              );
            },
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
                boxShadow: [
                  BoxShadow(
                    color: ColorManager.primary.withValues(alpha: 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Header with gradient
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: const BoxDecoration(
                      gradient: ColorManager.cardGradient,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(AppRadius.r20),
                        topRight: Radius.circular(AppRadius.r20),
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'YIGUI',
                          style: getBoldStyle(
                            color: ColorManager.white,
                            fontSize: FontSize.s18,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'BILLET \u00c9LECTRONIQUE',
                          style: getRegularStyle(
                            color: ColorManager.white,
                            fontSize: FontSize.s10,
                          ).copyWith(letterSpacing: 2),
                        ),
                      ],
                    ),
                  ),

                  // Accent orange line
                  Container(
                    width: double.infinity,
                    height: 3,
                    color: ColorManager.accent,
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
                            color: ColorManager.textTertiary,
                            fontSize: FontSize.s12,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: ColorManager.primarySurface,
                            borderRadius: BorderRadius.circular(AppRadius.r8),
                          ),
                          child: Text(
                            billet.codeBillet,
                            style:
                                getBoldStyle(
                                  color: ColorManager.primary,
                                  fontSize: 22,
                                ).copyWith(
                                  fontFamily: 'monospace',
                                  letterSpacing: 3,
                                ),
                          ),
                        ),
                        const SizedBox(height: AppSize.s20),

                        // Real QR Code
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: ColorManager.white,
                            borderRadius: BorderRadius.circular(AppRadius.r12),
                            border: Border.all(
                              color: ColorManager.grey1,
                              width: 1,
                            ),
                          ),
                          child: QrImageView(
                            data: billet.qrContent,
                            version: QrVersions.auto,
                            size: 160,
                            backgroundColor: ColorManager.white,
                            eyeStyle: const QrEyeStyle(
                              eyeShape: QrEyeShape.square,
                              color: ColorManager.primary,
                            ),
                            dataModuleStyle: const QrDataModuleStyle(
                              dataModuleShape: QrDataModuleShape.square,
                              color: ColorManager.primaryDark,
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSize.s20),

                        // Dashed divider with cutouts
                        Row(
                          children: List.generate(
                            30,
                            (index) => Expanded(
                              child: Container(
                                height: 1,
                                color: index.isEven
                                    ? ColorManager.grey2
                                    : Colors.transparent,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSize.s20),

                        // Ticket details
                        _buildTicketRow(
                          Icons.person_outline,
                          'Passager',
                          billet.nomPassager,
                        ),
                        _buildTicketRow(
                          Icons.route,
                          'Trajet',
                          '$departure - $destination',
                        ),
                        _buildTicketRow(
                          Icons.calendar_today_outlined,
                          'Date & Heure',
                          '$_formattedDate - $time',
                        ),
                        if (vehiclePlate.isNotEmpty)
                          _buildTicketRow(
                            Icons.directions_bus_outlined,
                            'V\u00e9hicule',
                            vehiclePlate,
                          ),
                        if (driverName.isNotEmpty)
                          _buildTicketRow(
                            Icons.badge_outlined,
                            'Chauffeur',
                            driverName,
                          ),

                        // Status
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.verified_outlined,
                                  color: ColorManager.textTertiary,
                                  size: 16,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Statut',
                                  style: getRegularStyle(
                                    color: ColorManager.textSecondary,
                                    fontSize: FontSize.s14,
                                  ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: ColorManager.successLight,
                                borderRadius: BorderRadius.circular(
                                  AppRadius.r4,
                                ),
                              ),
                              child: Text(
                                billet.statut,
                                style: getMediumStyle(
                                  color: ColorManager.success,
                                  fontSize: FontSize.s12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Meeting point
                  if (meetingPoint.isNotEmpty)
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
                  child: ElevatedButton.icon(
                    onPressed: () => _handlePdf(context),
                    icon: const Icon(Icons.picture_as_pdf, size: 20),
                    label: const Text('T\u00e9l\u00e9charger PDF'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ColorManager.primary,
                      foregroundColor: ColorManager.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.r12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(width: AppSize.s12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _handleShare(context),
                    icon: const Icon(Icons.share, size: 20),
                    label: const Text('Partager'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: ColorManager.accent,
                      side: const BorderSide(color: ColorManager.accent),
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

  Future<void> _handlePdf(BuildContext context) async {
    try {
      final pdfBytes = await TicketPdfService.generateTicketPdf(
        billet: billet,
        departure: departure,
        destination: destination,
        date: _formattedDate,
        time: time,
        vehiclePlate: vehiclePlate,
        driverName: driverName,
        meetingPoint: meetingPoint,
      );
      await TicketPdfService.printPdf(pdfBytes);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur PDF: $e')));
      }
    }
  }

  Future<void> _handleShare(BuildContext context) async {
    try {
      final pdfBytes = await TicketPdfService.generateTicketPdf(
        billet: billet,
        departure: departure,
        destination: destination,
        date: _formattedDate,
        time: time,
        vehiclePlate: vehiclePlate,
        driverName: driverName,
        meetingPoint: meetingPoint,
      );
      await TicketPdfService.sharePdf(
        pdfBytes,
        'billet_${billet.codeBillet}.pdf',
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur partage: $e')));
      }
    }
  }

  Widget _buildTicketRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppPadding.p12),
      child: Row(
        children: [
          Icon(icon, color: ColorManager.textTertiary, size: 16),
          const SizedBox(width: 6),
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

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
              // sharePositionOrigin requis sur iOS/iPad (popover) — ancré sur le
              // rect courant, sinon PlatformException. Null sur Android (ignoré).
              final box = context.findRenderObject() as RenderBox?;
              final origin = (box != null && box.hasSize)
                  ? box.localToGlobal(Offset.zero) & box.size
                  : null;
              await Share.share(
                'Mon billet SIRA Guinée\n'
                'Code: ${billet.codeBillet}\n'
                'Trajet: $departure - $destination\n'
                'Date: $_formattedDate a $time\n'
                'Passager: ${billet.nomPassager}',
                sharePositionOrigin: origin,
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
                    color: ColorManager.primary.withValues(alpha: 0.10),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
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
                          'SIRA Guinée',
                          style: getBoldStyle(
                            color: ColorManager.white,
                            fontSize: FontSize.s18,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'BILLET ÉLECTRONIQUE',
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

                  // Route band (Départ → Arrivée + date/heure)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                        AppPadding.p20, AppPadding.p16, AppPadding.p20, 0),
                    child: _buildRouteBand(),
                  ),

                  // Top section : code billet + QR
                  Padding(
                    padding: const EdgeInsets.fromLTRB(AppPadding.p20,
                        AppPadding.p16, AppPadding.p20, AppPadding.p16),
                    child: Column(
                      children: [
                        Text(
                          'Code billet',
                          style: getRegularStyle(
                            color: ColorManager.textTertiary,
                            fontSize: FontSize.s11,
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
                            style: getBoldStyle(
                              color: ColorManager.primary,
                              fontSize: 20,
                            ).copyWith(
                              fontFamily: 'monospace',
                              letterSpacing: 3,
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSize.s16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: ColorManager.white,
                            borderRadius: BorderRadius.circular(AppRadius.r12),
                            border:
                                Border.all(color: ColorManager.grey1, width: 1),
                          ),
                          child: QrImageView(
                            data: billet.qrContent,
                            version: QrVersions.auto,
                            size: 158,
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
                        const SizedBox(height: 8),
                        Text(
                          'Présentez ce QR code à l’embarquement',
                          style: getRegularStyle(
                            color: ColorManager.textTertiary,
                            fontSize: FontSize.s11,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Perforation (tear line + side notches)
                  _buildPerforation(),

                  // Bottom section (stub) : details + status
                  Padding(
                    padding: const EdgeInsets.all(AppPadding.p20),
                    child: Column(
                      children: [
                        _buildTicketRow(
                          Icons.person_outline,
                          'Passager',
                          billet.nomPassager,
                        ),
                        if (billet.numeroSiege != null &&
                            billet.numeroSiege!.isNotEmpty)
                          _buildTicketRow(
                            Icons.event_seat_outlined,
                            'Siège',
                            billet.numeroSiege!,
                          ),
                        if (vehiclePlate.isNotEmpty)
                          _buildTicketRow(
                            Icons.directions_bus_outlined,
                            'Véhicule',
                            vehiclePlate,
                          ),
                        if (driverName.isNotEmpty)
                          _buildTicketRow(
                            Icons.badge_outlined,
                            'Chauffeur',
                            driverName,
                          ),

                        // Status
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
                                    fontSize: FontSize.s13,
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
                                borderRadius:
                                    BorderRadius.circular(AppRadius.r4),
                              ),
                              child: Text(
                                billet.statut,
                                style: getMediumStyle(
                                  color: ColorManager.success,
                                  fontSize: FontSize.s11,
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
                            size: 18,
                          ),
                          const SizedBox(width: AppSize.s8),
                          Expanded(
                            child: Text(
                              'Point de RDV : $meetingPoint',
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
                    icon: const Icon(Icons.picture_as_pdf, size: 18),
                    label: const Text('Télécharger PDF'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ColorManager.primary,
                      foregroundColor: ColorManager.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.r12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(width: AppSize.s12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _handleShare(context),
                    icon: const Icon(Icons.share, size: 18),
                    label: const Text('Partager'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: ColorManager.accent,
                      side: const BorderSide(color: ColorManager.accent),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.r12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 13),
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

  /// Bandeau Départ → Arrivée avec icône bus et date/heure centrées.
  Widget _buildRouteBand() {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    departure,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: getBoldStyle(
                      color: ColorManager.textPrimary,
                      fontSize: FontSize.s16,
                    ),
                  ),
                  Text(
                    'Départ',
                    style: getRegularStyle(
                      color: ColorManager.textTertiary,
                      fontSize: FontSize.s11,
                    ),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8),
              child: Icon(
                Icons.directions_bus_rounded,
                color: ColorManager.primary,
                size: 22,
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    destination,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.right,
                    style: getBoldStyle(
                      color: ColorManager.textPrimary,
                      fontSize: FontSize.s16,
                    ),
                  ),
                  Text(
                    'Arrivée',
                    style: getRegularStyle(
                      color: ColorManager.textTertiary,
                      fontSize: FontSize.s11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: ColorManager.primarySurface,
            borderRadius: BorderRadius.circular(AppRadius.r20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.calendar_today_outlined,
                  size: 13, color: ColorManager.primary),
              const SizedBox(width: 6),
              Text(
                '$_formattedDate · $time',
                style: getMediumStyle(
                  color: ColorManager.primary,
                  fontSize: FontSize.s12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Ligne de perforation avec encoches latérales (effet ticket détachable).
  Widget _buildPerforation() {
    return Row(
      children: [
        Transform.translate(
          offset: const Offset(-10, 0),
          child: _notch(),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Row(
              children: List.generate(
                26,
                (i) => Expanded(
                  child: Container(
                    height: 1.5,
                    color: i.isEven
                        ? ColorManager.grey2
                        : Colors.transparent,
                  ),
                ),
              ),
            ),
          ),
        ),
        Transform.translate(
          offset: const Offset(10, 0),
          child: _notch(),
        ),
      ],
    );
  }

  Widget _notch() => Container(
        width: 20,
        height: 20,
        decoration: const BoxDecoration(
          color: ColorManager.background,
          shape: BoxShape.circle,
        ),
      );

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
              fontSize: FontSize.s13,
            ),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              style: getMediumStyle(
                color: ColorManager.textPrimary,
                fontSize: FontSize.s13,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}

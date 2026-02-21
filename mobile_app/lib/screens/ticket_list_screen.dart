import 'package:flutter/material.dart';
import '../models/billet.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';
import 'ticket_screen.dart';

class TicketListScreen extends StatelessWidget {
  final List<Billet> billets;
  final String departure;
  final String destination;
  final DateTime date;
  final String time;
  final String vehiclePlate;
  final String driverName;
  final String meetingPoint;

  const TicketListScreen({
    super.key,
    required this.billets,
    required this.departure,
    required this.destination,
    required this.date,
    required this.time,
    this.vehiclePlate = '',
    this.driverName = '',
    this.meetingPoint = '',
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
          'Mes Billets (${billets.length})',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s18,
          ),
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(AppPadding.p16),
        itemCount: billets.length,
        itemBuilder: (context, index) {
          return _buildBilletCard(context, billets[index], index);
        },
      ),
    );
  }

  Widget _buildBilletCard(BuildContext context, Billet billet, int index) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TicketScreen(
              billet: billet,
              departure: departure,
              destination: destination,
              date: date,
              time: time,
              vehiclePlate: vehiclePlate,
              driverName: driverName,
              meetingPoint: meetingPoint,
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: AppPadding.p12),
        padding: const EdgeInsets.all(AppPadding.p16),
        decoration: BoxDecoration(
          color: ColorManager.white,
          borderRadius: BorderRadius.circular(AppRadius.r16),
          border: Border.all(color: ColorManager.grey1),
        ),
        child: Row(
          children: [
            // Passenger number
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: ColorManager.primarySurface,
                borderRadius: BorderRadius.circular(AppRadius.r12),
              ),
              child: Center(
                child: Text(
                  '${index + 1}',
                  style: getBoldStyle(
                    color: ColorManager.primary,
                    fontSize: FontSize.s16,
                  ),
                ),
              ),
            ),
            const SizedBox(width: AppSize.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    billet.nomPassager,
                    style: getSemiBoldStyle(
                      color: ColorManager.textPrimary,
                      fontSize: FontSize.s16,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    billet.codeBillet,
                    style: getMediumStyle(
                      color: ColorManager.primary,
                      fontSize: FontSize.s12,
                    ).copyWith(fontFamily: 'monospace', letterSpacing: 1),
                  ),
                ],
              ),
            ),
            // Status badge
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppPadding.p8,
                vertical: AppPadding.p4,
              ),
              decoration: BoxDecoration(
                color: ColorManager.successLight,
                borderRadius: BorderRadius.circular(AppRadius.r4),
              ),
              child: Text(
                billet.statut,
                style: getMediumStyle(
                  color: ColorManager.success,
                  fontSize: FontSize.s10,
                ),
              ),
            ),
            const SizedBox(width: AppSize.s8),
            const Icon(Icons.chevron_right, color: ColorManager.textTertiary),
          ],
        ),
      ),
    );
  }
}

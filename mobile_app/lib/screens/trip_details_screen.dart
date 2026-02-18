import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';
import 'search_results_screen.dart';

class TripDetailsScreen extends StatelessWidget {
  final TripOffer offer;
  final VoidCallback? onBook;

  const TripDetailsScreen({
    super.key,
    required this.offer,
    this.onBook,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      body: Column(
        children: [
          // Header with trip info
          Container(
            decoration: const BoxDecoration(
              gradient: ColorManager.primaryGradient,
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  // AppBar
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppPadding.p8,
                      vertical: AppPadding.p8,
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(
                            Icons.arrow_back,
                            color: ColorManager.white,
                          ),
                          onPressed: () => Navigator.pop(context),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(
                            Icons.share,
                            color: ColorManager.white,
                          ),
                          onPressed: () {},
                        ),
                      ],
                    ),
                  ),
                  // Trip times
                  Padding(
                    padding: const EdgeInsets.all(AppPadding.p20),
                    child: Row(
                      children: [
                        // Departure
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                offer.departureTime,
                                style: getBoldStyle(
                                  color: ColorManager.white,
                                  fontSize: 32,
                                ),
                              ),
                              Text(
                                offer.departureSite ?? offer.departureCity,
                                style: getRegularStyle(
                                  color: ColorManager.white.withValues(alpha: 0.8),
                                  fontSize: FontSize.s14,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Duration
                        Column(
                          children: [
                            Text(
                              offer.duration,
                              style: getRegularStyle(
                                color: ColorManager.white.withValues(alpha: 0.8),
                                fontSize: FontSize.s12,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  width: 32,
                                  height: 2,
                                  color: ColorManager.white.withValues(alpha: 0.5),
                                ),
                                const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 4),
                                  child: Icon(
                                    Icons.directions_bus,
                                    color: ColorManager.white,
                                    size: 20,
                                  ),
                                ),
                                Container(
                                  width: 32,
                                  height: 2,
                                  color: ColorManager.white.withValues(alpha: 0.5),
                                ),
                              ],
                            ),
                          ],
                        ),
                        // Arrival
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                offer.arrivalTime,
                                style: getBoldStyle(
                                  color: ColorManager.white,
                                  fontSize: 32,
                                ),
                              ),
                              Text(
                                offer.arrivalSite ?? offer.arrivalCity,
                                style: getRegularStyle(
                                  color: ColorManager.white.withValues(alpha: 0.8),
                                  fontSize: FontSize.s14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppPadding.p16),
              child: Column(
                children: [
                  // Vehicle info card
                  _buildInfoCard(
                    title: 'Informations véhicule',
                    icon: '🚐',
                    children: [
                      _buildInfoRow('Type', offer.vehicleFullName),
                      if (offer.vehicleRegistration != null)
                        _buildInfoRow('Immatriculation', offer.vehicleRegistration!),
                      _buildInfoRow(
                        'Capacité',
                        offer.totalSeats > 0
                            ? '${offer.totalSeats} places'
                            : '${offer.availableSeats} places disponibles',
                      ),
                      _buildInfoRow(
                        'Climatisation',
                        offer.hasAC ? '✓ Oui' : '✗ Non',
                        valueColor: offer.hasAC
                            ? ColorManager.success
                            : ColorManager.error,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSize.s16),

                  // Driver info card
                  _buildInfoCard(
                    title: 'Chauffeur',
                    icon: '👤',
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: const BoxDecoration(
                              color: ColorManager.grey1,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.person,
                              color: ColorManager.textSecondary,
                            ),
                          ),
                          const SizedBox(width: AppSize.s12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  offer.driverName ?? 'Non renseigné',
                                  style: getMediumStyle(
                                    color: ColorManager.textPrimary,
                                    fontSize: FontSize.s16,
                                  ),
                                ),
                                if (offer.driverPhone != null)
                                  Text(
                                    offer.driverPhone!,
                                    style: getRegularStyle(
                                      color: ColorManager.textSecondary,
                                      fontSize: FontSize.s14,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Row(
                            children: [
                              const Icon(
                                Icons.star,
                                color: ColorManager.starRating,
                                size: 18,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                offer.rating.toStringAsFixed(1),
                                style: getMediumStyle(
                                  color: ColorManager.textPrimary,
                                  fontSize: FontSize.s14,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSize.s16),

                  // Meeting point (if available)
                  if (offer.meetingPoint != null) ...[
                    _buildInfoCard(
                      title: 'Point de rendez-vous',
                      icon: '📍',
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on,
                              color: ColorManager.accent,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                offer.meetingPoint!,
                                style: getRegularStyle(
                                  color: ColorManager.textPrimary,
                                  fontSize: FontSize.s14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSize.s16),
                  ],

                  // Conditions card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppPadding.p16),
                    decoration: BoxDecoration(
                      color: ColorManager.warningLight,
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                      border: Border.all(
                        color: ColorManager.warning.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ℹ️ Conditions',
                          style: getSemiBoldStyle(
                            color: ColorManager.accentDark,
                            fontSize: FontSize.s16,
                          ),
                        ),
                        const SizedBox(height: AppSize.s12),
                        if (offer.conditions != null)
                          _buildConditionItem(offer.conditions!)
                        else ...[
                          _buildConditionItem('Bagages inclus (max 20kg)'),
                          _buildConditionItem('Supplément +50 000 GNF au-delà'),
                        ],
                        if (offer.cancellationAllowed)
                          _buildConditionItem(
                            offer.cancellationDeadlineHours != null
                                ? 'Annulation gratuite jusqu\'à ${offer.cancellationDeadlineHours}h avant'
                                : 'Annulation gratuite jusqu\'à 24h avant',
                          )
                        else
                          _buildConditionItem('Annulation non autorisée'),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSize.s16),

                  // Price card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppPadding.p16),
                    decoration: BoxDecoration(
                      color: ColorManager.primarySurface,
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Prix par place',
                          style: getMediumStyle(
                            color: ColorManager.textPrimary,
                            fontSize: FontSize.s16,
                          ),
                        ),
                        Text(
                          '${_formatPrice(offer.price)} GNF',
                          style: getBoldStyle(
                            color: ColorManager.primary,
                            fontSize: FontSize.s24,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSize.s24),
                ],
              ),
            ),
          ),

          // Bottom button
          Container(
            padding: const EdgeInsets.all(AppPadding.p16),
            decoration: BoxDecoration(
              color: ColorManager.white,
              boxShadow: [
                BoxShadow(
                  color: ColorManager.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: onBook,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorManager.primary,
                    foregroundColor: ColorManager.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'Réserver cette offre',
                    style: getSemiBoldStyle(
                      color: ColorManager.white,
                      fontSize: FontSize.s16,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required String icon,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppPadding.p16),
      decoration: BoxDecoration(
        color: ColorManager.white,
        borderRadius: BorderRadius.circular(AppRadius.r16),
        border: Border.all(color: ColorManager.grey1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$icon $title',
            style: getSemiBoldStyle(
              color: ColorManager.textPrimary,
              fontSize: FontSize.s16,
            ),
          ),
          const SizedBox(height: AppSize.s16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppPadding.p8),
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
                color: valueColor ?? ColorManager.textPrimary,
                fontSize: FontSize.s14,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConditionItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppPadding.p4),
      child: Text(
        '• $text',
        style: getRegularStyle(
          color: ColorManager.accentDark,
          fontSize: FontSize.s14,
        ),
      ),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]} ',
    );
  }
}

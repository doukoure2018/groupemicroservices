import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

class TripOffer {
  final String id;
  final String departureTime;
  final String arrivalTime;
  final String duration;
  final String departureCity;
  final String arrivalCity;
  final int price;
  final int availableSeats;
  final double rating;
  final int reviewCount;
  final bool hasAC;
  final String vehicleType;

  TripOffer({
    required this.id,
    required this.departureTime,
    required this.arrivalTime,
    required this.duration,
    required this.departureCity,
    required this.arrivalCity,
    required this.price,
    required this.availableSeats,
    required this.rating,
    required this.reviewCount,
    required this.hasAC,
    required this.vehicleType,
  });
}

class SearchResultsScreen extends StatelessWidget {
  final String departure;
  final String destination;
  final DateTime date;
  final int passengers;
  final Function(TripOffer)? onSelectOffer;

  SearchResultsScreen({
    super.key,
    required this.departure,
    required this.destination,
    required this.date,
    required this.passengers,
    this.onSelectOffer,
  });

  // Mock data - In real app, this would come from API
  final List<TripOffer> _offers = [
    TripOffer(
      id: '1',
      departureTime: '07:00',
      arrivalTime: '14:30',
      duration: '7h30',
      departureCity: 'Madina',
      arrivalCity: 'Labé',
      price: 150000,
      availableSeats: 12,
      rating: 4.2,
      reviewCount: 45,
      hasAC: true,
      vehicleType: 'Minibus',
    ),
    TripOffer(
      id: '2',
      departureTime: '08:30',
      arrivalTime: '16:00',
      duration: '7h30',
      departureCity: 'Madina',
      arrivalCity: 'Labé',
      price: 140000,
      availableSeats: 8,
      rating: 4.5,
      reviewCount: 67,
      hasAC: true,
      vehicleType: 'Minibus',
    ),
    TripOffer(
      id: '3',
      departureTime: '10:00',
      arrivalTime: '17:30',
      duration: '7h30',
      departureCity: 'Madina',
      arrivalCity: 'Labé',
      price: 130000,
      availableSeats: 15,
      rating: 3.8,
      reviewCount: 32,
      hasAC: false,
      vehicleType: 'Minibus',
    ),
  ];

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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$departure → $destination',
              style: getSemiBoldStyle(
                color: ColorManager.textPrimary,
                fontSize: FontSize.s16,
              ),
            ),
            Text(
              '${date.day}/${date.month}/${date.year} • $passengers place${passengers > 1 ? 's' : ''}',
              style: getRegularStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s12,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: AppPadding.p16),
            padding: const EdgeInsets.symmetric(
              horizontal: AppPadding.p12,
              vertical: AppPadding.p6,
            ),
            decoration: BoxDecoration(
              color: ColorManager.primarySurface,
              borderRadius: BorderRadius.circular(AppRadius.r20),
            ),
            child: Text(
              '${_offers.length} offres',
              style: getMediumStyle(
                color: ColorManager.primary,
                fontSize: FontSize.s12,
              ),
            ),
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(AppPadding.p16),
        itemCount: _offers.length,
        itemBuilder: (context, index) {
          return _buildOfferCard(_offers[index], context, index == 0);
        },
      ),
    );
  }

  Widget _buildOfferCard(TripOffer offer, BuildContext context, bool isPrimary) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppPadding.p16),
      decoration: BoxDecoration(
        color: ColorManager.white,
        borderRadius: BorderRadius.circular(AppRadius.r16),
        border: Border.all(color: ColorManager.grey1),
        boxShadow: [
          BoxShadow(
            color: ColorManager.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppPadding.p16),
        child: Column(
          children: [
            // Time and route info
            Row(
              children: [
                // Departure
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        offer.departureTime,
                        style: getBoldStyle(
                          color: ColorManager.textPrimary,
                          fontSize: FontSize.s20,
                        ),
                      ),
                      Text(
                        'Départ ${offer.departureCity}',
                        style: getRegularStyle(
                          color: ColorManager.textSecondary,
                          fontSize: FontSize.s12,
                        ),
                      ),
                    ],
                  ),
                ),
                // Duration indicator
                Column(
                  children: [
                    Text(
                      offer.duration,
                      style: getRegularStyle(
                        color: ColorManager.textTertiary,
                        fontSize: FontSize.s12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    SizedBox(
                      width: 60,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            height: 2,
                            color: ColorManager.primaryLight,
                          ),
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: ColorManager.white,
                            ),
                            child: const Icon(
                              Icons.directions_bus,
                              color: ColorManager.primary,
                              size: 16,
                            ),
                          ),
                        ],
                      ),
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
                          color: ColorManager.textPrimary,
                          fontSize: FontSize.s20,
                        ),
                      ),
                      Text(
                        'Arrivée ${offer.arrivalCity}',
                        style: getRegularStyle(
                          color: ColorManager.textSecondary,
                          fontSize: FontSize.s12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSize.s12),

            // Features row
            Row(
              children: [
                _buildFeatureChip(Icons.directions_bus, offer.vehicleType),
                const SizedBox(width: AppSize.s8),
                _buildFeatureChip(Icons.people, '${offer.availableSeats} places'),
                if (offer.hasAC) ...[
                  const SizedBox(width: AppSize.s8),
                  _buildFeatureChip(
                    Icons.ac_unit,
                    'Clim',
                    color: ColorManager.climatisation,
                  ),
                ],
              ],
            ),
            const SizedBox(height: AppSize.s12),

            // Rating and price row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Rating
                Row(
                  children: [
                    const Icon(
                      Icons.star,
                      color: ColorManager.starRating,
                      size: 18,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      offer.rating.toString(),
                      style: getMediumStyle(
                        color: ColorManager.textPrimary,
                        fontSize: FontSize.s14,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '(${offer.reviewCount} avis)',
                      style: getRegularStyle(
                        color: ColorManager.textTertiary,
                        fontSize: FontSize.s12,
                      ),
                    ),
                  ],
                ),
                // Price
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: '${_formatPrice(offer.price)} ',
                            style: getBoldStyle(
                              color: ColorManager.primary,
                              fontSize: FontSize.s20,
                            ),
                          ),
                          TextSpan(
                            text: 'GNF',
                            style: getRegularStyle(
                              color: ColorManager.primary,
                              fontSize: FontSize.s12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      'par place',
                      style: getRegularStyle(
                        color: ColorManager.textTertiary,
                        fontSize: FontSize.s10,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: AppSize.s16),

            // Action button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => onSelectOffer?.call(offer),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isPrimary
                      ? ColorManager.primary
                      : ColorManager.lightGrey,
                  foregroundColor: isPrimary
                      ? ColorManager.white
                      : ColorManager.textPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.r12),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  isPrimary ? 'Réserver' : 'Voir détails',
                  style: getSemiBoldStyle(
                    color: isPrimary
                        ? ColorManager.white
                        : ColorManager.textPrimary,
                    fontSize: FontSize.s14,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureChip(IconData icon, String label, {Color? color}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color ?? ColorManager.textSecondary),
        const SizedBox(width: 4),
        Text(
          label,
          style: getRegularStyle(
            color: color ?? ColorManager.textSecondary,
            fontSize: FontSize.s12,
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

import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

enum TripStatus { confirmed, inProgress, completed, cancelled }

class Trip {
  final String id;
  final String orderNumber;
  final String departure;
  final String destination;
  final DateTime date;
  final String time;
  final int ticketCount;
  final TripStatus status;
  final double fillPercentage;
  final int seatsBooked;
  final int totalSeats;

  Trip({
    required this.id,
    required this.orderNumber,
    required this.departure,
    required this.destination,
    required this.date,
    required this.time,
    required this.ticketCount,
    required this.status,
    required this.fillPercentage,
    required this.seatsBooked,
    required this.totalSeats,
  });
}

class Notification {
  final String message;
  final String time;

  Notification({required this.message, required this.time});
}

class MyTripsScreen extends StatefulWidget {
  final Function(Trip)? onViewTickets;
  final Function(Trip)? onContact;

  const MyTripsScreen({
    super.key,
    this.onViewTickets,
    this.onContact,
  });

  @override
  State<MyTripsScreen> createState() => _MyTripsScreenState();
}

class _MyTripsScreenState extends State<MyTripsScreen> {
  bool _showHistory = false;

  final List<Trip> _activeTrips = [
    Trip(
      id: '1',
      orderNumber: 'CMD-20260120-0042',
      departure: 'Madina',
      destination: 'Labé',
      date: DateTime(2026, 1, 20),
      time: '07:00',
      ticketCount: 2,
      status: TripStatus.confirmed,
      fillPercentage: 0.8,
      seatsBooked: 14,
      totalSeats: 18,
    ),
  ];

  final List<Trip> _historyTrips = [
    Trip(
      id: '2',
      orderNumber: 'CMD-20260115-0038',
      departure: 'Conakry',
      destination: 'Kindia',
      date: DateTime(2026, 1, 15),
      time: '09:00',
      ticketCount: 1,
      status: TripStatus.completed,
      fillPercentage: 1.0,
      seatsBooked: 18,
      totalSeats: 18,
    ),
  ];

  final List<Notification> _notifications = [
    Notification(message: '📊 Véhicule rempli à 80%!', time: 'Il y a 2h'),
    Notification(message: '✅ Réservation confirmée', time: 'Hier'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      appBar: AppBar(
        backgroundColor: ColorManager.white,
        elevation: 0,
        title: Text(
          'Mes Voyages',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s20,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.notifications_outlined,
              color: ColorManager.textSecondary,
            ),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppPadding.p16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tab buttons
            Row(
              children: [
                _buildTabButton('En cours', !_showHistory),
                const SizedBox(width: AppSize.s8),
                _buildTabButton('Historique', _showHistory),
              ],
            ),
            const SizedBox(height: AppSize.s20),

            // Trips list
            ...(_showHistory ? _historyTrips : _activeTrips)
                .map((trip) => _buildTripCard(trip)),

            // Notifications section (only show for active trips)
            if (!_showHistory) ...[
              const SizedBox(height: AppSize.s24),
              Row(
                children: [
                  const Icon(
                    Icons.notifications,
                    color: ColorManager.textPrimary,
                    size: 20,
                  ),
                  const SizedBox(width: AppSize.s8),
                  Text(
                    'Notifications récentes',
                    style: getSemiBoldStyle(
                      color: ColorManager.textPrimary,
                      fontSize: FontSize.s16,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSize.s12),
              ...(_notifications.map((notif) => _buildNotificationItem(notif))),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(String label, bool isActive) {
    return GestureDetector(
      onTap: () => setState(() => _showHistory = label == 'Historique'),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppPadding.p20,
          vertical: AppPadding.p10,
        ),
        decoration: BoxDecoration(
          color: isActive ? ColorManager.primary : ColorManager.lightGrey,
          borderRadius: BorderRadius.circular(AppRadius.r20),
        ),
        child: Text(
          label,
          style: getMediumStyle(
            color: isActive ? ColorManager.white : ColorManager.textSecondary,
            fontSize: FontSize.s14,
          ),
        ),
      ),
    );
  }

  Widget _buildTripCard(Trip trip) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppPadding.p16),
      decoration: BoxDecoration(
        color: ColorManager.white,
        borderRadius: BorderRadius.circular(AppRadius.r16),
        border: Border.all(color: ColorManager.grey1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppPadding.p16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and order number
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatusBadge(trip.status),
                Text(
                  trip.orderNumber,
                  style: getRegularStyle(
                    color: ColorManager.textSecondary,
                    fontSize: FontSize.s12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSize.s12),

            // Trip details
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${trip.departure} → ${trip.destination}',
                        style: getBoldStyle(
                          color: ColorManager.textPrimary,
                          fontSize: FontSize.s18,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${trip.date.day}/${trip.date.month}/${trip.date.year} à ${trip.time}',
                        style: getRegularStyle(
                          color: ColorManager.textSecondary,
                          fontSize: FontSize.s14,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '${trip.ticketCount} billet${trip.ticketCount > 1 ? 's' : ''}',
                  style: getBoldStyle(
                    color: ColorManager.primary,
                    fontSize: FontSize.s16,
                  ),
                ),
              ],
            ),

            // Fill progress (only for active trips)
            if (trip.status == TripStatus.confirmed ||
                trip.status == TripStatus.inProgress) ...[
              const SizedBox(height: AppSize.s16),
              Container(
                padding: const EdgeInsets.all(AppPadding.p12),
                decoration: BoxDecoration(
                  color: ColorManager.lightGrey,
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Remplissage du véhicule',
                      style: getRegularStyle(
                        color: ColorManager.textSecondary,
                        fontSize: FontSize.s12,
                      ),
                    ),
                    const SizedBox(height: AppSize.s8),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: trip.fillPercentage,
                              backgroundColor: ColorManager.grey1,
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                ColorManager.primary,
                              ),
                              minHeight: 8,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSize.s12),
                        Text(
                          '${(trip.fillPercentage * 100).round()}%',
                          style: getMediumStyle(
                            color: ColorManager.textPrimary,
                            fontSize: FontSize.s14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${trip.seatsBooked}/${trip.totalSeats} places réservées',
                      style: getRegularStyle(
                        color: ColorManager.textSecondary,
                        fontSize: FontSize.s10,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: AppSize.s16),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => widget.onViewTickets?.call(trip),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ColorManager.primary,
                      foregroundColor: ColorManager.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.r12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      elevation: 0,
                    ),
                    child: Text(
                      'Voir billets',
                      style: getMediumStyle(
                        color: ColorManager.white,
                        fontSize: FontSize.s14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSize.s12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => widget.onContact?.call(trip),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: ColorManager.textSecondary,
                      side: const BorderSide(color: ColorManager.grey1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.r12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(
                      'Contacter',
                      style: getMediumStyle(
                        color: ColorManager.textSecondary,
                        fontSize: FontSize.s14,
                      ),
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

  Widget _buildStatusBadge(TripStatus status) {
    String label;
    Color bgColor;
    Color textColor;

    switch (status) {
      case TripStatus.confirmed:
        label = '🟢 CONFIRMÉ';
        bgColor = ColorManager.successLight;
        textColor = ColorManager.success;
        break;
      case TripStatus.inProgress:
        label = '🔵 EN COURS';
        bgColor = ColorManager.infoLight;
        textColor = ColorManager.info;
        break;
      case TripStatus.completed:
        label = '✅ TERMINÉ';
        bgColor = ColorManager.lightGrey;
        textColor = ColorManager.textSecondary;
        break;
      case TripStatus.cancelled:
        label = '❌ ANNULÉ';
        bgColor = ColorManager.errorLight;
        textColor = ColorManager.error;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppPadding.p8,
        vertical: AppPadding.p4,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppRadius.r4),
      ),
      child: Text(
        label,
        style: getMediumStyle(
          color: textColor,
          fontSize: FontSize.s10,
        ),
      ),
    );
  }

  Widget _buildNotificationItem(Notification notif) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: AppPadding.p8),
      padding: const EdgeInsets.all(AppPadding.p12),
      decoration: BoxDecoration(
        color: ColorManager.lightGrey,
        borderRadius: BorderRadius.circular(AppRadius.r12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            notif.message,
            style: getRegularStyle(
              color: ColorManager.textPrimary,
              fontSize: FontSize.s14,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            notif.time,
            style: getRegularStyle(
              color: ColorManager.textTertiary,
              fontSize: FontSize.s12,
            ),
          ),
        ],
      ),
    );
  }
}

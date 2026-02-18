import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/styles_manager.dart';
import 'search_screen.dart';
import 'search_results_screen.dart';
import 'trip_details_screen.dart';
import 'passengers_screen.dart';
import 'payment_screen.dart';
import 'confirmation_screen.dart';
import 'ticket_screen.dart';
import 'my_trips_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [_buildSearchTab(), _buildTripsTab(), _buildProfileTab()],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: ColorManager.white,
          boxShadow: [
            BoxShadow(
              color: ColorManager.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Plus de Row indicateur ici !
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildNavItem(0, Icons.search, 'Réservation'),
                    _buildNavItem(
                      1,
                      Icons.confirmation_number_outlined,
                      'Billets',
                    ),
                    _buildNavItem(2, Icons.info_outline, 'Plus'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Indicateur aligné avec l'icône
            Container(
              height: 2.5, // était 2
              width: 32, // était 22
              decoration: BoxDecoration(
                color: isSelected ? ColorManager.accent : Colors.transparent,
                borderRadius: BorderRadius.circular(1),
              ),
            ),
            const SizedBox(height: 6),
            Icon(
              icon,
              size: 22,
              color: isSelected
                  ? ColorManager.accent
                  : ColorManager.textTertiary,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected
                    ? ColorManager.accent
                    : ColorManager.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchTab() {
    return SearchScreen(
      onSearch: (params) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => SearchResultsScreen(
              departure: params['departure'] as String,
              destination: params['destination'] as String,
              departureVilleUuid: params['departureVilleUuid'] as String?,
              destinationVilleUuid: params['destinationVilleUuid'] as String?,
              date: params['date'] as DateTime,
              passengers: params['passengers'] as int,
              onSelectOffer: (offer) =>
                  _navigateToDetails(offer, params['passengers'] as int),
            ),
          ),
        );
      },
    );
  }

  void _navigateToDetails(TripOffer offer, int passengers) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TripDetailsScreen(
          offer: offer,
          onBook: () => _navigateToPassengers(offer, passengers),
        ),
      ),
    );
  }

  void _navigateToPassengers(TripOffer offer, int passengers) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PassengersScreen(
          offer: offer,
          passengerCount: passengers,
          onProceedToPayment: () => _navigateToPayment(offer, passengers),
        ),
      ),
    );
  }

  void _navigateToPayment(TripOffer offer, int passengers) {
    final total = offer.price * passengers + 5000; // + service fee
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          totalAmount: total,
          onPaymentSuccess: () =>
              _navigateToConfirmation(offer, passengers, total),
        ),
      ),
    );
  }

  void _navigateToConfirmation(TripOffer offer, int passengers, int amount) {
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (context) => ConfirmationScreen(
          orderNumber:
              'CMD-${DateTime.now().year}${DateTime.now().month.toString().padLeft(2, '0')}${DateTime.now().day.toString().padLeft(2, '0')}-${DateTime.now().millisecond}',
          departure: offer.departureCity,
          destination: offer.arrivalCity,
          date: DateTime.now(),
          time: offer.departureTime,
          passengerCount: passengers,
          amountPaid: amount,
          onViewTickets: () => _navigateToTicket(offer),
          onGoHome: () {
            Navigator.pop(context);
            setState(() => _currentIndex = 0);
          },
        ),
      ),
      (route) => route.isFirst,
    );
  }

  void _navigateToTicket(TripOffer offer) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TicketScreen(
          ticketCode:
              'TKT-${DateTime.now().millisecondsSinceEpoch.toRadixString(16).toUpperCase()}',
          passengerName: 'Ibrahima Camara',
          departure: offer.departureCity,
          destination: offer.arrivalCity,
          date: DateTime.now(),
          time: offer.departureTime,
          vehiclePlate: offer.vehicleRegistration ?? '',
          driverName: offer.driverName ?? '',
          meetingPoint: offer.meetingPoint ?? offer.departureSite ?? 'Gare de ${offer.departureCity}',
        ),
      ),
    );
  }

  Widget _buildTripsTab() {
    return MyTripsScreen(
      onViewTickets: (trip) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TicketScreen(
              ticketCode: 'TKT-A3F82B1C',
              passengerName: 'Ibrahima Camara',
              departure: trip.departure,
              destination: trip.destination,
              date: trip.date,
              time: trip.time,
              vehiclePlate: 'RC 1234 AB',
              driverName: 'Mamadou Diallo',
              meetingPoint: 'Gare de ${trip.departure}, près du grand marché',
            ),
          ),
        );
      },
      onContact: (trip) {
        // Show contact dialog or phone call
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Contacter le chauffeur'),
            content: const Text('Mamadou Diallo\n+224 621 XX XX XX'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Fermer'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Appeler'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProfileTab() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.user;
        return Scaffold(
          backgroundColor: ColorManager.background,
          appBar: AppBar(
            backgroundColor: ColorManager.white,
            elevation: 0,
            title: Text(
              'Mon Profil',
              style: getSemiBoldStyle(
                color: ColorManager.textPrimary,
                fontSize: FontSize.s20,
              ),
            ),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Profile header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: ColorManager.cardGradient,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: ColorManager.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            user?.initials ?? '?',
                            style: getBoldStyle(
                              color: ColorManager.white,
                              fontSize: 24,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.fullName ?? 'Utilisateur',
                              style: getSemiBoldStyle(
                                color: ColorManager.white,
                                fontSize: FontSize.s18,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              user?.email ?? '',
                              style: getRegularStyle(
                                color: ColorManager.white.withOpacity(0.8),
                                fontSize: FontSize.s14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Menu items
                _buildMenuItem(
                  icon: Icons.person_outline,
                  title: 'Informations personnelles',
                  onTap: () {},
                ),
                _buildMenuItem(
                  icon: Icons.payment,
                  title: 'Moyens de paiement',
                  onTap: () {},
                ),
                _buildMenuItem(
                  icon: Icons.notifications_outlined,
                  title: 'Notifications',
                  onTap: () {},
                ),
                _buildMenuItem(
                  icon: Icons.help_outline,
                  title: 'Aide & Support',
                  onTap: () {},
                ),
                _buildMenuItem(
                  icon: Icons.info_outline,
                  title: 'À propos',
                  onTap: () {},
                ),
                const SizedBox(height: 16),
                _buildMenuItem(
                  icon: Icons.logout,
                  title: 'Déconnexion',
                  isDestructive: true,
                  onTap: () => _handleLogout(context),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: ColorManager.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isDestructive
              ? ColorManager.error
              : ColorManager.textSecondary,
        ),
        title: Text(
          title,
          style: getMediumStyle(
            color: isDestructive
                ? ColorManager.error
                : ColorManager.textPrimary,
            fontSize: FontSize.s16,
          ),
        ),
        trailing: Icon(
          Icons.chevron_right,
          color: isDestructive ? ColorManager.error : ColorManager.textTertiary,
        ),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Future<void> _handleLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Déconnexion',
              style: TextStyle(color: ColorManager.error),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.logout();
    }
  }
}

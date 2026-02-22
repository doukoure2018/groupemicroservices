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
import 'ticket_list_screen.dart';
import 'my_trips_screen.dart';
import 'scanner_screen.dart';
import '../models/billet.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isControleur = authProvider.user?.isControleur ?? false;

    final tabs = <Widget>[
      _buildSearchTab(),
      _buildTripsTab(),
      if (isControleur) const ScannerScreen(),
      _buildProfileTab(),
    ];

    // Adjust index if it's out of bounds (e.g. role changed)
    if (_currentIndex >= tabs.length) {
      _currentIndex = 0;
    }

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: tabs,
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
                    if (isControleur)
                      _buildNavItem(2, Icons.qr_code_scanner, 'Scanner'),
                    _buildNavItem(
                      isControleur ? 3 : 2,
                      Icons.info_outline,
                      'Plus',
                    ),
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
          onProceedToPayment: (passengerList) =>
              _navigateToPayment(offer, passengers, passengerList),
        ),
      ),
    );
  }

  void _navigateToPayment(
    TripOffer offer,
    int passengers,
    List<Passenger> passengerList,
  ) {
    final total = offer.price * passengers + 5000; // + service fee
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          offer: offer,
          totalAmount: total,
          passengers: passengerList,
          onPaymentSuccess: (commande) =>
              _navigateToConfirmation(offer, commande),
        ),
      ),
    );
  }

  /// Parse time from backend (can be String "06:00", List [6,0], or List [6,0,0]).
  String _parseTime(dynamic value, String fallback) {
    if (value is String)
      return value.length >= 5 ? value.substring(0, 5) : value;
    if (value is List && value.length >= 2) {
      final h = value[0].toString().padLeft(2, '0');
      final m = value[1].toString().padLeft(2, '0');
      return '$h:$m';
    }
    return fallback;
  }

  /// Parse date from backend (can be String "2026-02-19" or List [2026,2,19]).
  DateTime _parseDate(dynamic value) {
    if (value is String) return DateTime.tryParse(value) ?? DateTime.now();
    if (value is List && value.length >= 3) {
      return DateTime(value[0] as int, value[1] as int, value[2] as int);
    }
    return DateTime.now();
  }

  void _navigateToConfirmation(TripOffer offer, Map<String, dynamic> commande) {
    // Extract billets list for ticket navigation
    final billetsJson = commande['billets'] as List<dynamic>? ?? [];
    final billets = billetsJson
        .map((b) => Billet.fromJson(b as Map<String, dynamic>))
        .toList();

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (context) => ConfirmationScreen(
          orderNumber: commande['numeroCommande'] ?? '',
          departure: commande['villeDepartLibelle'] ?? offer.departureCity,
          destination: commande['villeArriveeLibelle'] ?? offer.arrivalCity,
          date: commande['dateDepart'] != null
              ? _parseDate(commande['dateDepart'])
              : DateTime.now(),
          time: _parseTime(commande['heureDepart'], offer.departureTime),
          passengerCount: commande['nombrePlaces'] ?? 1,
          amountPaid: (commande['montantPaye'] is num)
              ? (commande['montantPaye'] as num).toInt()
              : int.tryParse(commande['montantPaye']?.toString() ?? '0') ?? 0,
          billetCodes: billets
              .map((b) => b.codeBillet)
              .where((c) => c.isNotEmpty)
              .join(', '),
          referencePaiement: commande['referencePaiement'] ?? '',
          onViewTickets: () => _navigateToTickets(
            offer: offer,
            billets: billets,
            commande: commande,
          ),
          onGoHome: () {
            Navigator.pop(context);
            setState(() => _currentIndex = 0);
          },
        ),
      ),
      (route) => route.isFirst,
    );
  }

  void _navigateToTickets({
    required TripOffer offer,
    required List<Billet> billets,
    required Map<String, dynamic> commande,
  }) {
    final departure = commande['villeDepartLibelle'] ?? offer.departureCity;
    final destination = commande['villeArriveeLibelle'] ?? offer.arrivalCity;
    final date = commande['dateDepart'] != null
        ? _parseDate(commande['dateDepart'])
        : DateTime.now();
    final time = _parseTime(commande['heureDepart'], offer.departureTime);
    final vehiclePlate = offer.vehicleRegistration ?? '';
    final driverName = offer.driverName ?? '';
    final meetingPoint =
        commande['siteDepart'] ??
        offer.meetingPoint ??
        offer.departureSite ??
        'Gare de ${offer.departureCity}';

    if (billets.length == 1) {
      // Single billet → go directly to TicketScreen
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => TicketScreen(
            billet: billets.first,
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
    } else {
      // Multiple billets → show list first
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => TicketListScreen(
            billets: billets,
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
    }
  }

  Widget _buildTripsTab() {
    return MyTripsScreen(
      onViewTickets: (commande) {
        final billets = commande.billets;
        if (billets.isEmpty) return;

        final departure = commande.villeDepartLibelle;
        final destination = commande.villeArriveeLibelle;
        final date = commande.dateDepart;
        final time = commande.heureDepart;
        final vehiclePlate = commande.vehiculeImmatriculation ?? '';
        final driverName = commande.nomChauffeur ?? '';
        final meetingPoint = commande.siteDepart ?? 'Gare de $departure';

        if (billets.length == 1) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TicketScreen(
                billet: billets.first,
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
        } else {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TicketListScreen(
                billets: billets,
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
        }
      },
      onContact: (commande) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Text('D\u00e9tails commande'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('N\u00b0 ${commande.numeroCommande}'),
                const SizedBox(height: 8),
                Text(
                  '${commande.villeDepartLibelle} \u2192 ${commande.villeArriveeLibelle}',
                ),
                const SizedBox(height: 4),
                Text('${commande.nombrePlaces} place(s)'),
                if (commande.referencePaiement != null) ...[
                  const SizedBox(height: 4),
                  Text('Ref: ${commande.referencePaiement}'),
                ],
                if (commande.vehiculeImmatriculation != null) ...[
                  const SizedBox(height: 8),
                  Text('V\u00e9hicule: ${commande.vehiculeImmatriculation}'),
                ],
                if (commande.nomChauffeur != null) ...[
                  const SizedBox(height: 4),
                  Text('Chauffeur: ${commande.nomChauffeur}'),
                ],
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Fermer'),
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

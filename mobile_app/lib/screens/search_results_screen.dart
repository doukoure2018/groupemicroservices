import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';
import '../models/offre.dart';
import '../services/billetterie_service.dart';

enum SortOption { departure, price, rating }

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

  // Vehicle details
  final String? vehicleRegistration;
  final String? vehicleBrand;
  final String? vehicleModel;
  final int totalSeats;

  // Driver info
  final String? driverName;
  final String? driverPhone;

  // Conditions
  final String? conditions;
  final String? meetingPoint;
  final bool cancellationAllowed;
  final int? cancellationDeadlineHours;

  // Departure site
  final String? departureSite;
  final String? arrivalSite;

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
    this.vehicleRegistration,
    this.vehicleBrand,
    this.vehicleModel,
    this.totalSeats = 0,
    this.driverName,
    this.driverPhone,
    this.conditions,
    this.meetingPoint,
    this.cancellationAllowed = true,
    this.cancellationDeadlineHours,
    this.departureSite,
    this.arrivalSite,
  });

  String get vehicleFullName {
    if (vehicleBrand != null && vehicleModel != null) {
      return '$vehicleType $vehicleBrand $vehicleModel';
    }
    return vehicleType;
  }

  factory TripOffer.fromOffre(Offre offre) {
    return TripOffer(
      id: offre.offreUuid,
      departureTime: offre.heuresDepartFormatted,
      arrivalTime: offre.heuresArriveeFormatted,
      duration: offre.durationFormatted,
      departureCity: offre.villeDepartLibelle ?? offre.departLibelle ?? '',
      arrivalCity: offre.villeArriveeLibelle ?? offre.arriveeLibelle ?? '',
      price: offre.montantEffectif.toInt(),
      availableSeats: offre.nombrePlacesDisponibles,
      rating: offre.noteMoyenne ?? 0,
      reviewCount: offre.nombreAvis ?? 0,
      hasAC: offre.vehiculeClimatise,
      vehicleType: offre.typeVehiculeLibelle ?? offre.vehiculeDescription,
      vehicleRegistration: offre.vehiculeImmatriculation,
      vehicleBrand: offre.vehiculeMarque,
      vehicleModel: offre.vehiculeModele,
      totalSeats: offre.nombrePlacesTotal,
      driverName: offre.nomChauffeur,
      driverPhone: offre.contactChauffeur,
      conditions: offre.conditions,
      meetingPoint: offre.pointRendezvous,
      cancellationAllowed: offre.annulationAutorisee,
      cancellationDeadlineHours: offre.delaiAnnulationHeures,
      departureSite: offre.siteDepart ?? offre.departLibelle,
      arrivalSite: offre.siteArrivee ?? offre.arriveeLibelle,
    );
  }
}

class SearchResultsScreen extends StatefulWidget {
  final String departure;
  final String destination;
  final String? departureVilleUuid;
  final String? destinationVilleUuid;
  final DateTime date;
  final int passengers;
  final Function(TripOffer)? onSelectOffer;

  const SearchResultsScreen({
    super.key,
    required this.departure,
    required this.destination,
    this.departureVilleUuid,
    this.destinationVilleUuid,
    required this.date,
    required this.passengers,
    this.onSelectOffer,
  });

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  final BilletterieService _billetterieService = BilletterieService();
  List<TripOffer> _offers = [];
  bool _isLoading = true;
  String? _error;

  // Sort & filter state
  SortOption _sortOption = SortOption.departure;
  bool _filterAC = false;
  String? _filterVehicleType;

  @override
  void initState() {
    super.initState();
    _loadOffers();
  }

  Future<void> _loadOffers() async {
    if (widget.departureVilleUuid == null ||
        widget.departureVilleUuid!.isEmpty ||
        widget.destinationVilleUuid == null ||
        widget.destinationVilleUuid!.isEmpty) {
      setState(() {
        _offers = _getMockOffers();
        _isLoading = false;
      });
      return;
    }

    try {
      final dateStr =
          '${widget.date.year}-${widget.date.month.toString().padLeft(2, '0')}-${widget.date.day.toString().padLeft(2, '0')}';

      final offres = await _billetterieService.searchOffres(
        villeDepartUuid: widget.departureVilleUuid!,
        villeArriveeUuid: widget.destinationVilleUuid!,
        dateDepart: dateStr,
        passagers: widget.passengers,
      );

      setState(() {
        _offers = offres.map((o) => TripOffer.fromOffre(o)).toList();
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Search offers error: $e');
      setState(() {
        _error = 'Impossible de charger les offres. Vérifiez votre connexion.';
        _isLoading = false;
      });
    }
  }

  List<TripOffer> get _filteredOffers {
    var result = List<TripOffer>.from(_offers);

    // Apply filters
    if (_filterAC) {
      result = result.where((o) => o.hasAC).toList();
    }
    if (_filterVehicleType != null) {
      result = result.where((o) => o.vehicleType == _filterVehicleType).toList();
    }

    // Apply sort
    switch (_sortOption) {
      case SortOption.departure:
        result.sort((a, b) => a.departureTime.compareTo(b.departureTime));
        break;
      case SortOption.price:
        result.sort((a, b) => a.price.compareTo(b.price));
        break;
      case SortOption.rating:
        result.sort((a, b) => b.rating.compareTo(a.rating));
        break;
    }

    return result;
  }

  List<String> get _vehicleTypes {
    return _offers.map((o) => o.vehicleType).toSet().toList()..sort();
  }

  List<TripOffer> _getMockOffers() {
    return [
      TripOffer(
        id: '1',
        departureTime: '07:00',
        arrivalTime: '14:30',
        duration: '7h30',
        departureCity: widget.departure,
        arrivalCity: widget.destination,
        price: 150000,
        availableSeats: 12,
        rating: 4.2,
        reviewCount: 45,
        hasAC: true,
        vehicleType: 'Minibus',
        vehicleBrand: 'Toyota',
        vehicleModel: 'Hiace',
        vehicleRegistration: 'RC 1234 AB',
        totalSeats: 18,
        driverName: 'Mamadou Diallo',
        driverPhone: '+224 621 XX XX XX',
        departureSite: 'Gare de ${widget.departure}',
        arrivalSite: 'Gare de ${widget.destination}',
      ),
      TripOffer(
        id: '2',
        departureTime: '08:30',
        arrivalTime: '16:00',
        duration: '7h30',
        departureCity: widget.departure,
        arrivalCity: widget.destination,
        price: 140000,
        availableSeats: 8,
        rating: 4.5,
        reviewCount: 67,
        hasAC: true,
        vehicleType: 'Minibus',
        vehicleBrand: 'Toyota',
        vehicleModel: 'Hiace',
        vehicleRegistration: 'RC 5678 CD',
        totalSeats: 15,
        driverName: 'Ibrahima Bah',
        driverPhone: '+224 622 XX XX XX',
        departureSite: 'Gare de ${widget.departure}',
        arrivalSite: 'Gare de ${widget.destination}',
      ),
      TripOffer(
        id: '3',
        departureTime: '10:00',
        arrivalTime: '17:30',
        duration: '7h30',
        departureCity: widget.departure,
        arrivalCity: widget.destination,
        price: 130000,
        availableSeats: 15,
        rating: 3.8,
        reviewCount: 32,
        hasAC: false,
        vehicleType: 'Minibus',
        vehicleBrand: 'Mercedes',
        vehicleModel: 'Sprinter',
        vehicleRegistration: 'RC 9012 EF',
        totalSeats: 22,
        driverName: 'Ousmane Camara',
        driverPhone: '+224 623 XX XX XX',
        departureSite: 'Gare de ${widget.departure}',
        arrivalSite: 'Gare de ${widget.destination}',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredOffers;

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
              '${widget.departure} → ${widget.destination}',
              style: getSemiBoldStyle(
                color: ColorManager.textPrimary,
                fontSize: FontSize.s16,
              ),
            ),
            Text(
              '${widget.date.day}/${widget.date.month}/${widget.date.year} • ${widget.passengers} place${widget.passengers > 1 ? 's' : ''}',
              style: getRegularStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s12,
              ),
            ),
          ],
        ),
        actions: [
          if (!_isLoading)
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
                '${filtered.length} offre${filtered.length > 1 ? 's' : ''}',
                style: getMediumStyle(
                  color: ColorManager.primary,
                  fontSize: FontSize.s12,
                ),
              ),
            ),
        ],
      ),
      body: _buildBody(filtered),
    );
  }

  Widget _buildBody(List<TripOffer> filtered) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: ColorManager.accent),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: ColorManager.textTertiary),
              const SizedBox(height: 16),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: getRegularStyle(
                  color: ColorManager.textSecondary,
                  fontSize: FontSize.s14,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isLoading = true;
                    _error = null;
                  });
                  _loadOffers();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: ColorManager.accent,
                  foregroundColor: ColorManager.white,
                ),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    if (_offers.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.search_off, size: 48, color: ColorManager.textTertiary),
              const SizedBox(height: 16),
              Text(
                'Aucune offre disponible pour ce trajet',
                textAlign: TextAlign.center,
                style: getMediumStyle(
                  color: ColorManager.textSecondary,
                  fontSize: FontSize.s16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Essayez une autre date ou un autre itinéraire',
                textAlign: TextAlign.center,
                style: getRegularStyle(
                  color: ColorManager.textTertiary,
                  fontSize: FontSize.s14,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        // Sort & filter bar
        _buildSortFilterBar(),
        // Results list
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Text(
                      'Aucune offre ne correspond aux filtres',
                      textAlign: TextAlign.center,
                      style: getMediumStyle(
                        color: ColorManager.textSecondary,
                        fontSize: FontSize.s14,
                      ),
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(AppPadding.p16),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    return _buildOfferCard(filtered[index], context, index == 0);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildSortFilterBar() {
    final vehicleTypes = _vehicleTypes;

    return Container(
      color: ColorManager.white,
      padding: const EdgeInsets.only(bottom: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            // Sort chips
            _buildSortChip('Départ', SortOption.departure, Icons.access_time),
            const SizedBox(width: 8),
            _buildSortChip('Prix', SortOption.price, Icons.arrow_upward),
            const SizedBox(width: 8),
            _buildSortChip('Note', SortOption.rating, Icons.star_outline),

            // Divider
            Container(
              width: 1,
              height: 24,
              margin: const EdgeInsets.symmetric(horizontal: 12),
              color: ColorManager.grey1,
            ),

            // Filter: Climatisé
            _buildFilterChip(
              'Climatisé',
              Icons.ac_unit,
              _filterAC,
              () => setState(() => _filterAC = !_filterAC),
            ),

            // Filter: Vehicle types (if more than 1 type)
            if (vehicleTypes.length > 1) ...[
              const SizedBox(width: 8),
              ...vehicleTypes.map((type) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: _buildFilterChip(
                  type,
                  Icons.directions_bus,
                  _filterVehicleType == type,
                  () => setState(() {
                    _filterVehicleType = _filterVehicleType == type ? null : type;
                  }),
                ),
              )),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSortChip(String label, SortOption option, IconData icon) {
    final isSelected = _sortOption == option;
    return GestureDetector(
      onTap: () => setState(() => _sortOption = option),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? ColorManager.primary : ColorManager.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? ColorManager.primary : ColorManager.grey1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected ? ColorManager.white : ColorManager.textSecondary,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? ColorManager.white : ColorManager.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(
    String label,
    IconData icon,
    bool isActive,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isActive ? ColorManager.accent.withValues(alpha: 0.1) : ColorManager.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? ColorManager.accent : ColorManager.grey1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isActive ? ColorManager.accent : ColorManager.textSecondary,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? ColorManager.accent : ColorManager.textSecondary,
              ),
            ),
          ],
        ),
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
            color: ColorManager.black.withValues(alpha: 0.05),
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
                      offer.rating.toStringAsFixed(1),
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
                onPressed: () => widget.onSelectOffer?.call(offer),
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

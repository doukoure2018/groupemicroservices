import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../presentation/resource/color_manager.dart';

class SearchScreen extends StatefulWidget {
  final Function(Map<String, dynamic> searchParams)? onSearch;

  const SearchScreen({super.key, this.onSearch});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String? _departure;
  String? _destination;
  DateTime _selectedDate = DateTime.now();
  String _tripType = 'one_way';
  String _vehicleClass = 'Standard';

  final List<String> _cities = [
    'Conakry (CKY)',
    'Kindia (KND)',
    'Labé (LAB)',
    'Mamou (MAM)',
    'Kankan (KAN)',
    'N\'Zérékoré (NZR)',
    'Boké (BOK)',
    'Faranah (FAR)',
  ];

  final List<String> _classes = ['Standard', 'Confort', 'VIP'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with user info
              _buildHeader(),

              // Main content
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Réservez votre\nprochain voyage!",
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: ColorManager.textPrimary,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Search card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: ColorManager.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: ColorManager.black.withOpacity(0.05),
                            blurRadius: 20,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Trip type toggle
                          _buildTripTypeToggle(),
                          const SizedBox(height: 20),

                          // From field
                          _buildLocationField(
                            label: 'Départ',
                            value: _departure,
                            icon: Icons.trip_origin,
                            onChanged: (val) => setState(() => _departure = val),
                          ),
                          const SizedBox(height: 12),

                          // Swap button
                          Center(
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  final temp = _departure;
                                  _departure = _destination;
                                  _destination = temp;
                                });
                              },
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: ColorManager.primary.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.swap_vert,
                                  color: ColorManager.primary,
                                  size: 20,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // To field
                          _buildLocationField(
                            label: 'Destination',
                            value: _destination,
                            icon: Icons.location_on,
                            iconColor: ColorManager.accent,
                            onChanged: (val) => setState(() => _destination = val),
                          ),
                          const SizedBox(height: 16),

                          // Date field
                          _buildDateField(),
                          const SizedBox(height: 16),

                          // Class field
                          _buildClassField(),
                          const SizedBox(height: 24),

                          // Search button
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton(
                              onPressed: _handleSearch,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: ColorManager.primary,
                                foregroundColor: ColorManager.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                elevation: 0,
                              ),
                              child: const Text(
                                'Rechercher un billet',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // News section
                    _buildNewsSection(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.user;
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
          decoration: BoxDecoration(
            color: ColorManager.primary,
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(24),
              bottomRight: Radius.circular(24),
            ),
          ),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: ColorManager.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                  image: user?.imageUrl != null
                      ? DecorationImage(
                          image: NetworkImage(user!.imageUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: user?.imageUrl == null
                    ? Center(
                        child: Text(
                          user?.initials ?? '?',
                          style: const TextStyle(
                            color: ColorManager.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              // Greeting
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getGreeting(),
                      style: TextStyle(
                        color: ColorManager.white.withOpacity(0.8),
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      user?.fullName ?? 'Voyageur',
                      style: const TextStyle(
                        color: ColorManager.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ],
                ),
              ),
              // Notification icon
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: ColorManager.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Stack(
                  children: [
                    const Center(
                      child: Icon(
                        Icons.notifications_outlined,
                        color: ColorManager.white,
                      ),
                    ),
                    Positioned(
                      right: 10,
                      top: 10,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: ColorManager.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Bonjour!';
    if (hour < 18) return 'Bon après-midi!';
    return 'Bonsoir!';
  }

  Widget _buildTripTypeToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: ColorManager.lightGrey,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _tripType = 'one_way'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _tripType == 'one_way'
                      ? ColorManager.primary
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'Aller simple',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _tripType == 'one_way'
                        ? ColorManager.white
                        : ColorManager.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _tripType = 'round_trip'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _tripType == 'round_trip'
                      ? ColorManager.primary
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'Aller-retour',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _tripType == 'round_trip'
                        ? ColorManager.white
                        : ColorManager.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationField({
    required String label,
    required String? value,
    required IconData icon,
    Color? iconColor,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: ColorManager.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: ColorManager.lightGrey,
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonFormField<String>(
            value: value,
            decoration: InputDecoration(
              prefixIcon: Icon(
                icon,
                color: iconColor ?? ColorManager.primary,
                size: 20,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
            hint: Text(
              'Sélectionner $label',
              style: const TextStyle(color: ColorManager.textTertiary),
            ),
            items: _cities.map((city) {
              return DropdownMenuItem(value: city, child: Text(city));
            }).toList(),
            onChanged: onChanged,
            isExpanded: true,
            icon: const Icon(Icons.keyboard_arrow_down),
          ),
        ),
      ],
    );
  }

  Widget _buildDateField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Date de départ',
          style: TextStyle(
            fontSize: 12,
            color: ColorManager.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () async {
            final date = await showDatePicker(
              context: context,
              initialDate: _selectedDate,
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 90)),
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: const ColorScheme.light(
                      primary: ColorManager.primary,
                    ),
                  ),
                  child: child!,
                );
              },
            );
            if (date != null) {
              setState(() => _selectedDate = date);
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: ColorManager.lightGrey,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.calendar_today,
                  color: ColorManager.primary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Text(
                  _formatDate(_selectedDate),
                  style: const TextStyle(
                    color: ColorManager.textPrimary,
                    fontSize: 16,
                  ),
                ),
                const Spacer(),
                const Icon(
                  Icons.keyboard_arrow_down,
                  color: ColorManager.textSecondary,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildClassField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Classe',
          style: TextStyle(
            fontSize: 12,
            color: ColorManager.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: ColorManager.lightGrey,
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonFormField<String>(
            value: _vehicleClass,
            decoration: const InputDecoration(
              prefixIcon: Icon(
                Icons.airline_seat_recline_normal,
                color: ColorManager.primary,
                size: 20,
              ),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
            items: _classes.map((cls) {
              return DropdownMenuItem(value: cls, child: Text(cls));
            }).toList(),
            onChanged: (val) => setState(() => _vehicleClass = val ?? 'Standard'),
            isExpanded: true,
            icon: const Icon(Icons.keyboard_arrow_down),
          ),
        ),
      ],
    );
  }

  Widget _buildNewsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Actualités',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: ColorManager.textPrimary,
              ),
            ),
            TextButton(
              onPressed: () {},
              child: const Text(
                'Voir tout',
                style: TextStyle(color: ColorManager.primary),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: ColorManager.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: ColorManager.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: ColorManager.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.directions_bus,
                  color: ColorManager.primary,
                  size: 40,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Nouvelle ligne Conakry-Labé',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: ColorManager.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Voyagez confortablement avec nos nouveaux bus climatisés',
                      style: TextStyle(
                        color: ColorManager.textSecondary,
                        fontSize: 12,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${DateTime.now().day} ${_getMonthName(DateTime.now().month)} ${DateTime.now().year}',
                      style: const TextStyle(
                        color: ColorManager.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day} ${_getMonthName(date.month)} ${date.year}';
  }

  String _getMonthName(int month) {
    const months = [
      '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month];
  }

  void _handleSearch() {
    if (_departure == null || _destination == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner le départ et la destination'),
          backgroundColor: ColorManager.error,
        ),
      );
      return;
    }

    widget.onSearch?.call({
      'departure': _departure,
      'destination': _destination,
      'date': _selectedDate,
      'passengers': 1,
      'tripType': _tripType,
      'class': _vehicleClass,
    });
  }
}

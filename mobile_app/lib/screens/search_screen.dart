import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import 'city_search_screen.dart';

class SearchScreen extends StatefulWidget {
  final Function(Map<String, dynamic> searchParams)? onSearch;

  const SearchScreen({super.key, this.onSearch});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  Map<String, String>? _departureCity;
  Map<String, String>? _destinationCity;
  DateTime _departureDate = DateTime.now();
  DateTime? _returnDate;
  int _adults = 1;
  int _children = 0;

  void _swapCities() {
    setState(() {
      final temp = _departureCity;
      _departureCity = _destinationCity;
      _destinationCity = temp;
    });
  }

  void _selectDepartureDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _departureDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: ColorManager.accent),
          ),
          child: child!,
        );
      },
    );
    if (date != null) {
      setState(() => _departureDate = date);
    }
  }

  void _selectReturnDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _returnDate ?? _departureDate.add(const Duration(days: 1)),
      firstDate: _departureDate,
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: ColorManager.accent),
          ),
          child: child!,
        );
      },
    );
    if (date != null) {
      setState(() => _returnDate = date);
    }
  }

  void _showPassengerPicker() {
    int tempAdults = _adults;
    int tempChildren = _children;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Handle bar
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: ColorManager.grey2,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Title row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Passagers',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: ColorManager.textPrimary,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: ColorManager.lightGrey,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            size: 18,
                            color: ColorManager.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Adulte row
                  _buildCounterRow(
                    label: 'Adulte',
                    value: tempAdults,
                    min: 1,
                    max: 9,
                    onChanged: (val) {
                      setSheetState(() => tempAdults = val);
                    },
                  ),
                  const SizedBox(height: 20),
                  const Divider(color: ColorManager.grey1),
                  const SizedBox(height: 20),
                  // Enfant row
                  _buildCounterRow(
                    label: 'Enfant',
                    subtitle: 'Moins de 12 ans',
                    value: tempChildren,
                    min: 0,
                    max: 9,
                    onChanged: (val) {
                      setSheetState(() => tempChildren = val);
                    },
                  ),
                  const SizedBox(height: 28),
                  // Confirm button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _adults = tempAdults;
                          _children = tempChildren;
                        });
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ColorManager.accent,
                        foregroundColor: ColorManager.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Confirmer',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildCounterRow({
    required String label,
    String? subtitle,
    required int value,
    required int min,
    required int max,
    required Function(int) onChanged,
  }) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: ColorManager.textPrimary,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: ColorManager.textSecondary,
                  ),
                ),
            ],
          ),
        ),
        // Minus button
        GestureDetector(
          onTap: value > min ? () => onChanged(value - 1) : null,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              border: Border.all(
                color: value > min
                    ? ColorManager.textSecondary
                    : ColorManager.grey1,
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.remove,
              color: value > min
                  ? ColorManager.textPrimary
                  : ColorManager.grey1,
              size: 20,
            ),
          ),
        ),
        SizedBox(
          width: 48,
          child: Text(
            '$value',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: ColorManager.textPrimary,
            ),
          ),
        ),
        // Plus button
        GestureDetector(
          onTap: value < max ? () => onChanged(value + 1) : null,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              border: Border.all(
                color: value < max
                    ? ColorManager.textSecondary
                    : ColorManager.grey1,
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.add,
              color: value < max
                  ? ColorManager.textPrimary
                  : ColorManager.grey1,
              size: 20,
            ),
          ),
        ),
      ],
    );
  }

  void _showCityPicker({required bool isDeparture}) async {
    final otherCity = isDeparture ? _destinationCity : _departureCity;
    final excludeCity = otherCity?['name'];

    final result = await Navigator.push<Map<String, String>>(
      context,
      MaterialPageRoute(
        builder: (context) => CitySearchScreen(
          fieldLabel: isDeparture ? 'De' : 'Vers',
          excludeCity: excludeCity,
        ),
      ),
    );

    if (result != null) {
      setState(() {
        if (isDeparture) {
          _departureCity = result;
        } else {
          _destinationCity = result;
        }
      });
    }
  }

  String _formatDateShort(DateTime date) {
    const days = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
    return '${days[date.weekday - 1]} ${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year.toString().substring(2)}';
  }

  String get _passengersLabel {
    String label = 'Adulte $_adults';
    if (_children > 0) {
      label += ', Enfant $_children';
    }
    return label;
  }

  void _handleSearch() {
    if (_departureCity == null || _destinationCity == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Veuillez sélectionner le départ et la destination',
          ),
          backgroundColor: ColorManager.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
      return;
    }

    widget.onSearch?.call({
      'departure': _departureCity!['name'],
      'destination': _destinationCity!['name'],
      'departureVilleUuid': _departureCity!['villeUuid'],
      'destinationVilleUuid': _destinationCity!['villeUuid'],
      'date': _departureDate,
      'returnDate': _returnDate,
      'passengers': _adults + _children,
      'adults': _adults,
      'children': _children,
      'tripType': _returnDate != null ? 'round_trip' : 'one_way',
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Image + white sheet overlap
            Stack(
              children: [
                SizedBox(
                  width: double.infinity,
                  height: 340,
                  child: Image.asset(
                    'assets/images/billetterie-transport.jpg',
                    fit: BoxFit.cover,
                  ),
                ),
                // White sheet overlapping image bottom
                Container(
                  margin: const EdgeInsets.only(top: 310),
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: ColorManager.white,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  child: const SizedBox(height: 40),
                ),
              ],
            ),

            // Form content on white background
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Column(
                children: [
                  // De / Vers fields with swap
                  Stack(
                    children: [
                      Column(
                        children: [
                          _buildCityField(
                            label: 'De',
                            value: _departureCity?['name'],
                            onTap: () => _showCityPicker(isDeparture: true),
                          ),
                          const SizedBox(height: 10),
                          _buildCityField(
                            label: 'Vers',
                            value: _destinationCity?['name'],
                            onTap: () => _showCityPicker(isDeparture: false),
                          ),
                        ],
                      ),
                      Positioned(
                        right: 0,
                        top: 22,
                        child: GestureDetector(
                          onTap: (_departureCity != null || _destinationCity != null)
                              ? _swapCities
                              : null,
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: ColorManager.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: ColorManager.grey1),
                              boxShadow: [
                                BoxShadow(
                                  color: ColorManager.black.withOpacity(0.08),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.swap_vert,
                              color: ColorManager.textPrimary,
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Aller / Retour
                  Row(
                    children: [
                      Expanded(
                        child: _buildDateField(
                          label: 'Aller',
                          date: _departureDate,
                          onTap: _selectDepartureDate,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildDateField(
                          label: 'Retour',
                          date: _returnDate,
                          placeholder: 'Retour',
                          onTap: _selectReturnDate,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Passagers
                  _buildPassengersField(),
                  const SizedBox(height: 16),

                  // RECHERCHER
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _handleSearch,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ColorManager.accent,
                        foregroundColor: ColorManager.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'RECHERCHER',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCityField({
    required String label,
    required String? value,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(14, 8, 44, 10),
        decoration: BoxDecoration(
          border: Border.all(color: ColorManager.grey1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: ColorManager.textSecondary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value ?? 'Sélectionner',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: value != null
                    ? ColorManager.textPrimary
                    : ColorManager.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateField({
    required String label,
    DateTime? date,
    String? placeholder,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 8, 14, 10),
        decoration: BoxDecoration(
          border: Border.all(color: ColorManager.grey1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: ColorManager.textSecondary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              date != null ? _formatDateShort(date) : (placeholder ?? ''),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: date != null
                    ? ColorManager.textPrimary
                    : ColorManager.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPassengersField() {
    return GestureDetector(
      onTap: _showPassengerPicker,
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 8, 14, 10),
        decoration: BoxDecoration(
          border: Border.all(color: ColorManager.grey1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Passagers',
                    style: TextStyle(
                      fontSize: 11,
                      color: ColorManager.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _passengersLabel,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: ColorManager.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.keyboard_arrow_down,
              color: ColorManager.textSecondary,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

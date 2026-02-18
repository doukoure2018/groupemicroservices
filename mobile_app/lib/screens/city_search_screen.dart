import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';

class CitySearchScreen extends StatefulWidget {
  final String fieldLabel; // "De" or "Vers"
  final String? excludeCity;

  const CitySearchScreen({
    super.key,
    required this.fieldLabel,
    this.excludeCity,
  });

  @override
  State<CitySearchScreen> createState() => _CitySearchScreenState();
}

class _CitySearchScreenState extends State<CitySearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  List<Map<String, String>> _filteredCities = [];

  // Local cities data — will be replaced by API later
  static const List<Map<String, String>> _allCities = [
    {'name': 'Conakry', 'villeUuid': ''},
    {'name': 'Kindia', 'villeUuid': ''},
    {'name': 'Labé', 'villeUuid': ''},
    {'name': 'Mamou', 'villeUuid': ''},
    {'name': 'Kankan', 'villeUuid': ''},
    {'name': 'N\'Zérékoré', 'villeUuid': ''},
    {'name': 'Boké', 'villeUuid': ''},
    {'name': 'Faranah', 'villeUuid': ''},
  ];

  @override
  void initState() {
    super.initState();
    _filterCities('');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  void _filterCities(String query) {
    setState(() {
      _filteredCities = _allCities
          .where((city) =>
              city['name'] != widget.excludeCity &&
              city['name']!.toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.white,
      body: Column(
        children: [
          // Orange header
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 12,
              left: 16,
              right: 16,
              bottom: 20,
            ),
            decoration: const BoxDecoration(
              color: ColorManager.accent,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Back button
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.arrow_back_ios,
                        color: ColorManager.white,
                        size: 18,
                      ),
                      SizedBox(width: 4),
                      Text(
                        'Retour',
                        style: TextStyle(
                          color: ColorManager.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Title "De" or "Vers"
                Text(
                  widget.fieldLabel,
                  style: const TextStyle(
                    color: ColorManager.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                // Search field
                Container(
                  decoration: BoxDecoration(
                    color: ColorManager.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: TextField(
                    controller: _searchController,
                    focusNode: _searchFocusNode,
                    onChanged: _filterCities,
                    style: const TextStyle(
                      fontSize: 15,
                      color: ColorManager.textPrimary,
                    ),
                    decoration: const InputDecoration(
                      hintText: 'Rechercher une ville',
                      hintStyle: TextStyle(
                        color: ColorManager.textTertiary,
                        fontSize: 15,
                      ),
                      prefixIcon: Icon(
                        Icons.search,
                        color: ColorManager.textSecondary,
                        size: 20,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // City results list
          Expanded(
            child: _filteredCities.isEmpty
                ? Center(
                    child: Text(
                      'Aucune ville trouvée',
                      style: TextStyle(
                        color: ColorManager.textTertiary,
                        fontSize: 14,
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _filteredCities.length,
                    separatorBuilder: (_, __) => const Divider(
                      height: 1,
                      indent: 56,
                      color: ColorManager.grey1,
                    ),
                    itemBuilder: (context, index) {
                      final city = _filteredCities[index];
                      return ListTile(
                        leading: const Icon(
                          Icons.location_on_outlined,
                          color: ColorManager.textSecondary,
                          size: 22,
                        ),
                        title: Text(
                          city['name']!,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            color: ColorManager.textPrimary,
                          ),
                        ),
                        onTap: () => Navigator.pop(context, city),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../services/billetterie_service.dart';

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
  final BilletterieService _billetterieService = BilletterieService();

  List<Map<String, String>> _allCities = [];
  List<Map<String, String>> _filteredCities = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadVilles();
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

  Future<void> _loadVilles() async {
    try {
      final villes = await _billetterieService.getActiveVilles();
      setState(() {
        _allCities = villes
            .map(
              (v) => {
                'name': v['libelle']?.toString() ?? '',
                'villeUuid': v['villeUuid']?.toString() ?? '',
                'region': v['regionLibelle']?.toString() ?? '',
              },
            )
            .toList();
        _isLoading = false;
        _filterCities('');
      });
    } catch (e) {
      debugPrint('Load villes error: $e');
      setState(() {
        _error = 'Impossible de charger les villes';
        _isLoading = false;
      });
    }
  }

  void _filterCities(String query) {
    setState(() {
      _filteredCities = _allCities
          .where(
            (city) =>
                city['name'] != widget.excludeCity &&
                city['name']!.toLowerCase().contains(query.toLowerCase()),
          )
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
            decoration: const BoxDecoration(color: ColorManager.accent),
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
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildContent() {
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
              const Icon(
                Icons.wifi_off,
                size: 40,
                color: ColorManager.textTertiary,
              ),
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: ColorManager.textSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () {
                  setState(() {
                    _isLoading = true;
                    _error = null;
                  });
                  _loadVilles();
                },
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    if (_filteredCities.isEmpty) {
      return const Center(
        child: Text(
          'Aucune ville trouvée',
          style: TextStyle(color: ColorManager.textTertiary, fontSize: 14),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _filteredCities.length,
      separatorBuilder: (_, __) =>
          const Divider(height: 1, indent: 56, color: ColorManager.grey1),
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
          subtitle: city['region']!.isNotEmpty
              ? Text(
                  city['region']!,
                  style: const TextStyle(
                    fontSize: 12,
                    color: ColorManager.textTertiary,
                  ),
                )
              : null,
          onTap: () => Navigator.pop(context, city),
        );
      },
    );
  }
}

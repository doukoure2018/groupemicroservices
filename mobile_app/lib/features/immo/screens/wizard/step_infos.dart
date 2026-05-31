import 'package:flutter/material.dart';

import '../../../../shared/http/api_exception.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/app_error.dart';
import '../../../../shared/widgets/app_loading.dart';
import '../../models/commodite.dart';
import '../../models/type_bien.dart';
import '../../services/propriete_service.dart';

/// Étape 2 du wizard publication — Infos du bien.
///
/// Long formulaire qui peuple `donneesJson.infosBien` du brouillon. La structure
/// JSON sortante correspond à un sous-ensemble de [ProprieteCreateRequest] —
/// l'étape 4 du wizard (Validation/Publication) viendra reprendre ces valeurs
/// pour matérialiser le brouillon en propriété.
///
/// Le coordinateur appelle [validate]/[collect] via la [GlobalKey] passée en
/// `formKey`. La validation côté client porte sur les contraintes les plus
/// strictes du backend ([@NotBlank], [@Pattern], [@DecimalMin] sur prix).
class StepInfos extends StatefulWidget {
  final GlobalKey<StepInfosState> stepKey;
  final Map<String, dynamic> initialValues;

  /// Notifie le coordinateur à chaque changement local — utilisé pour le
  /// "draft pending" indicator (futur) et pour fournir l'état actuel au
  /// moment du Suivant.
  final void Function(Map<String, dynamic> infos) onChanged;

  StepInfos({
    required this.stepKey,
    required this.initialValues,
    required this.onChanged,
  }) : super(key: stepKey);

  @override
  State<StepInfos> createState() => StepInfosState();
}

class StepInfosState extends State<StepInfos>
    with AutomaticKeepAliveClientMixin {
  final _service = ProprieteService();
  final _formKey = GlobalKey<FormState>();

  // Helpers de lecture des étapes structurées (contrat backend
  // BrouillonServiceImpl.toCreateRequest). Si une étape est absente —
  // brouillon neuf — on retombe sur une map vide.
  Map<String, dynamic> get _e1 =>
      (widget.initialValues['etape1'] as Map<String, dynamic>?) ?? const {};
  Map<String, dynamic> get _e2 =>
      (widget.initialValues['etape2'] as Map<String, dynamic>?) ?? const {};
  Map<String, dynamic> get _e3 =>
      (widget.initialValues['etape3'] as Map<String, dynamic>?) ?? const {};
  Map<String, dynamic> get _e4 =>
      (widget.initialValues['etape4'] as Map<String, dynamic>?) ?? const {};

  // Controllers — préfèrent l'init depuis le brouillon structuré, sinon vides.
  late final _titreController = TextEditingController(text: _e4['titre'] as String? ?? '');
  late final _descriptionController = TextEditingController(text: _e4['description'] as String? ?? '');
  late final _prixController = TextEditingController(text: (_e3['prix'] as num?)?.toString() ?? '');
  late final _surfaceController = TextEditingController(text: (_e3['surfaceM2'] as num?)?.toString() ?? '');
  late final _adresseController = TextEditingController(text: _e2['adresseComplete'] as String? ?? '');
  late final _nomContactController = TextEditingController(text: _e4['nomContactPublic'] as String? ?? '');
  late final _telephoneController = TextEditingController(text: _e4['telephoneContact'] as String? ?? '');
  late final _latitudeController = TextEditingController(text: (_e2['latitude'] as num?)?.toString() ?? '');
  late final _longitudeController = TextEditingController(text: (_e2['longitude'] as num?)?.toString() ?? '');

  // State champs select
  String _typeAnnonce = 'LOCATION';
  String? _dureeLocation;
  String? _typeBienCode;
  String _devise = 'GNF';
  String? _periode = 'PAR_MOIS';
  bool _prixSurDemande = false;
  bool _prixNegociable = false;
  int _nombreChambres = 1;
  int _nombreSallesBain = 1;
  DateTime? _dateDisponibilite;
  Set<String> _selectedCommodites = {};
  bool _geoActive = false;

  // Référentiels (chargés une fois, asynchrones, en parallèle)
  bool _refsLoading = true;
  AppException? _refsError;
  List<TypeBien> _typesBien = const [];
  List<Commodite> _commodites = const [];

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _typeAnnonce = _e1['typeAnnonce'] as String? ?? 'LOCATION';
    _dureeLocation = _e1['dureeLocation'] as String?;
    _typeBienCode = _e1['typeBienCode'] as String?;
    _devise = _e3['devise'] as String? ?? 'GNF';
    // Défaut PAR_MOIS pour LOCATION (le plus courant). Bug 15.2e-4 : sans
    // le `??`, le brouillon neuf qui n'a pas encore de periode écrasait le
    // default UI 'PAR_MOIS' par null → backend rejette "periode est requise
    // pour une location" à materialiser.
    _periode = _e3['periode'] as String? ?? (_typeAnnonce == 'VENTE' ? 'UNIQUE' : 'PAR_MOIS');
    _prixSurDemande = _e3['prixSurDemande'] as bool? ?? false;
    _prixNegociable = _e3['prixNegociable'] as bool? ?? false;
    _nombreChambres = _e3['nombreChambres'] as int? ?? 1;
    _nombreSallesBain = _e3['nombreSallesBain'] as int? ?? 1;
    final dispo = _e3['dateDisponibilite'] as String?;
    if (dispo != null) {
      try { _dateDisponibilite = DateTime.parse(dispo); } catch (_) {}
    }
    final commoditesInit = _e3['commoditesCodes'] as List<dynamic>?;
    if (commoditesInit != null) {
      _selectedCommodites = commoditesInit.map((e) => e as String).toSet();
    }
    _geoActive = _e2['latitude'] != null || _e2['longitude'] != null;
    _loadRefs();
  }

  @override
  void dispose() {
    _titreController.dispose();
    _descriptionController.dispose();
    _prixController.dispose();
    _surfaceController.dispose();
    _adresseController.dispose();
    _nomContactController.dispose();
    _telephoneController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    super.dispose();
  }

  Future<void> _loadRefs() async {
    setState(() {
      _refsLoading = true;
      _refsError = null;
    });
    try {
      final results = await Future.wait([
        _service.listTypesBien(),
        _service.listCommodites(),
      ]);
      if (!mounted) return;
      setState(() {
        _typesBien = results[0] as List<TypeBien>;
        _commodites = results[1] as List<Commodite>;
        _refsLoading = false;
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _refsError = e;
        _refsLoading = false;
      });
    }
  }

  /// Appelé par le coordinateur au Next. Retourne true si validation OK.
  bool validate() {
    final formOk = _formKey.currentState?.validate() ?? false;
    if (!formOk) return false;
    if (_typeBienCode == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Sélectionnez un type de bien'),
      ));
      return false;
    }
    if (_typeAnnonce == 'LOCATION' && _dureeLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Sélectionnez la durée de location'),
      ));
      return false;
    }
    return true;
  }

  /// Snapshot structuré conforme au contrat backend `BrouillonServiceImpl.
  /// toCreateRequest` (lit `donneesJson.etape1/2/3/4`). Le coordinateur
  /// merge directement ces 4 sous-maps à la racine de `donneesJson` —
  /// PAS sous un wrapper "infosBien", sinon `materialiser()` renvoie
  /// "Champ obligatoire manquant : etape1.typeAnnonce".
  Map<String, dynamic> collect() {
    return {
      'etape1': {
        'typeAnnonce': _typeAnnonce,
        if (_dureeLocation != null) 'dureeLocation': _dureeLocation,
        if (_typeBienCode != null) 'typeBienCode': _typeBienCode,
      },
      'etape2': {
        if (_adresseController.text.trim().isNotEmpty)
          'adresseComplete': _adresseController.text.trim(),
        if (_geoActive && _latitudeController.text.trim().isNotEmpty)
          'latitude': double.tryParse(_latitudeController.text.trim()),
        if (_geoActive && _longitudeController.text.trim().isNotEmpty)
          'longitude': double.tryParse(_longitudeController.text.trim()),
      },
      'etape3': {
        if (!_prixSurDemande && _prixController.text.trim().isNotEmpty)
          'prix': double.tryParse(_prixController.text.trim()) ?? 0,
        'devise': _devise,
        if (_periode != null && _typeAnnonce == 'LOCATION') 'periode': _periode,
        'prixSurDemande': _prixSurDemande,
        'prixNegociable': _prixNegociable,
        'nombreChambres': _nombreChambres,
        'nombreSallesBain': _nombreSallesBain,
        if (_surfaceController.text.trim().isNotEmpty)
          'surfaceM2': double.tryParse(_surfaceController.text.trim()) ?? 0,
        if (_dateDisponibilite != null)
          'dateDisponibilite': _formatDate(_dateDisponibilite!),
        if (_selectedCommodites.isNotEmpty)
          'commoditesCodes': _selectedCommodites.toList(),
      },
      'etape4': {
        if (_titreController.text.trim().isNotEmpty) 'titre': _titreController.text.trim(),
        if (_descriptionController.text.trim().isNotEmpty)
          'description': _descriptionController.text.trim(),
        if (_nomContactController.text.trim().isNotEmpty)
          'nomContactPublic': _nomContactController.text.trim(),
        if (_telephoneController.text.trim().isNotEmpty)
          'telephoneContact': _telephoneController.text.trim(),
      },
    };
  }

  static String _formatDate(DateTime d) {
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }

  String _formatDateFr(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  void _notifyChanged() => widget.onChanged(collect());

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_refsLoading) return const AppLoading(label: 'Chargement…');
    if (_refsError != null) {
      return AppError(message: _refsError!.message, onRetry: _loadRefs);
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        onChanged: _notifyChanged,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _sectionTitle('Type d\'annonce'),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'LOCATION', label: Text('Location')),
                ButtonSegment(value: 'VENTE', label: Text('Vente')),
              ],
              selected: {_typeAnnonce},
              onSelectionChanged: (s) {
                setState(() {
                  _typeAnnonce = s.first;
                  if (_typeAnnonce == 'VENTE') {
                    _dureeLocation = null;
                    _periode = 'UNIQUE';
                  } else if (_periode == 'UNIQUE') {
                    _periode = 'PAR_MOIS';
                  }
                });
                _notifyChanged();
              },
            ),
            if (_typeAnnonce == 'LOCATION') ...[
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _dureeLocation,
                decoration: const InputDecoration(
                  labelText: 'Durée *',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'COURT_SEJOUR', child: Text('Court séjour')),
                  DropdownMenuItem(value: 'LONG_SEJOUR', child: Text('Long séjour')),
                ],
                onChanged: (v) {
                  setState(() => _dureeLocation = v);
                  _notifyChanged();
                },
              ),
            ],
            const SizedBox(height: 16),
            _sectionTitle('Type de bien *'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _typesBien
                  .map((t) => ChoiceChip(
                        label: Text(t.libelle),
                        avatar: Icon(_iconeTypeBien(t.code), size: 18,
                            color: _typeBienCode == t.code ? AppColors.primary : AppColors.onBackground),
                        selected: _typeBienCode == t.code,
                        onSelected: (sel) {
                          setState(() => _typeBienCode = sel ? t.code : null);
                          _notifyChanged();
                        },
                      ))
                  .toList(),
            ),
            const SizedBox(height: 16),
            _sectionTitle('Titre'),
            TextFormField(
              controller: _titreController,
              maxLength: 200,
              decoration: const InputDecoration(
                hintText: 'Maison 4 chambres avec jardin, Kipé',
                border: OutlineInputBorder(),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Titre requis';
                return null;
              },
            ),
            _sectionTitle('Prix'),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Prix sur demande'),
              value: _prixSurDemande,
              onChanged: (v) {
                setState(() => _prixSurDemande = v);
                _notifyChanged();
              },
            ),
            if (!_prixSurDemande) ...[
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _prixController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Montant *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) {
                        if (_prixSurDemande) return null;
                        if (v == null || v.trim().isEmpty) return 'Prix requis';
                        final n = double.tryParse(v.trim());
                        if (n == null || n <= 0) return 'Prix > 0';
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _devise,
                      decoration: const InputDecoration(
                        labelText: 'Devise',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'GNF', child: Text('GNF')),
                        DropdownMenuItem(value: 'USD', child: Text('USD')),
                        DropdownMenuItem(value: 'EUR', child: Text('EUR')),
                      ],
                      onChanged: (v) {
                        setState(() => _devise = v ?? 'GNF');
                        _notifyChanged();
                      },
                    ),
                  ),
                ],
              ),
              if (_typeAnnonce == 'LOCATION') ...[
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _periode,
                  decoration: const InputDecoration(
                    labelText: 'Période',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'PAR_MOIS', child: Text('Par mois')),
                    DropdownMenuItem(value: 'PAR_AN', child: Text('Par an')),
                  ],
                  onChanged: (v) {
                    setState(() => _periode = v);
                    _notifyChanged();
                  },
                ),
              ],
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Prix négociable'),
                value: _prixNegociable,
                onChanged: (v) {
                  setState(() => _prixNegociable = v);
                  _notifyChanged();
                },
              ),
            ],
            _sectionTitle('Caractéristiques'),
            _stepperRow('Chambres', _nombreChambres, 0, 50, (v) {
              setState(() => _nombreChambres = v);
              _notifyChanged();
            }),
            _stepperRow('Salles de bain', _nombreSallesBain, 0, 50, (v) {
              setState(() => _nombreSallesBain = v);
              _notifyChanged();
            }),
            const SizedBox(height: 12),
            TextFormField(
              controller: _surfaceController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Surface (m²)',
                border: OutlineInputBorder(),
              ),
            ),
            _sectionTitle('Localisation'),
            TextFormField(
              controller: _adresseController,
              maxLength: 500,
              decoration: const InputDecoration(
                labelText: 'Adresse',
                hintText: 'Quartier, ville',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: () async {
                final now = DateTime.now();
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _dateDisponibilite ?? now,
                  firstDate: DateTime(now.year - 1),
                  lastDate: now.add(const Duration(days: 365 * 3)),
                );
                if (picked != null && mounted) {
                  setState(() => _dateDisponibilite = picked);
                  _notifyChanged();
                }
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Date de disponibilité',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _dateDisponibilite != null
                      ? _formatDateFr(_dateDisponibilite!)
                      : 'Sélectionner une date',
                  style: TextStyle(
                    color: _dateDisponibilite != null ? null : AppColors.onBackground,
                  ),
                ),
              ),
            ),
            _sectionTitle('Géolocalisation'),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Inclure la position GPS'),
              subtitle: const Text('Aide les acheteurs à situer le bien sur une carte'),
              value: _geoActive,
              onChanged: (v) {
                setState(() => _geoActive = v);
                _notifyChanged();
              },
            ),
            if (_geoActive) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _latitudeController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                      decoration: const InputDecoration(
                        labelText: 'Latitude',
                        hintText: '9.6412',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _longitudeController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                      decoration: const InputDecoration(
                        labelText: 'Longitude',
                        hintText: '-13.5784',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'GPS auto (geolocator) à venir — saisie manuelle pour l\'instant.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.onBackground,
                      fontStyle: FontStyle.italic,
                    ),
              ),
            ],
            _sectionTitle('Commodités'),
            if (_commodites.isEmpty)
              Text('Aucune commodité disponible.',
                  style: Theme.of(context).textTheme.bodySmall)
            else
              ..._buildCommoditesGroupees(),
            _sectionTitle('Description'),
            TextFormField(
              controller: _descriptionController,
              maxLines: 5,
              maxLength: 1500,
              decoration: const InputDecoration(
                hintText: 'Détails du bien, points forts, environnement…',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
            ),
            _sectionTitle('Contact public'),
            TextFormField(
              controller: _nomContactController,
              maxLength: 150,
              decoration: const InputDecoration(
                labelText: 'Nom affiché sur l\'annonce',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _telephoneController,
              keyboardType: TextInputType.phone,
              maxLength: 20,
              decoration: const InputDecoration(
                labelText: 'Téléphone',
                hintText: '+224621091895',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String t) => Padding(
        padding: const EdgeInsets.only(top: 20, bottom: 8),
        child: Text(t, style: Theme.of(context).textTheme.titleSmall),
      );

  Widget _stepperRow(String label, int value, int min, int max, ValueChanged<int> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          IconButton(
            onPressed: value > min ? () => onChanged(value - 1) : null,
            icon: const Icon(Icons.remove_circle_outline),
          ),
          SizedBox(width: 28, child: Text('$value', textAlign: TextAlign.center)),
          IconButton(
            onPressed: value < max ? () => onChanged(value + 1) : null,
            icon: const Icon(Icons.add_circle_outline),
          ),
        ],
      ),
    );
  }

  /// Regroupe les commodités par catégorie (CONFORT / SECURITE / EXTERIEUR /
  /// fallback "Autres") avec un libellé de sous-section + Wrap de FilterChip
  /// multi-select.
  List<Widget> _buildCommoditesGroupees() {
    const ordreCategories = ['CONFORT', 'SECURITE', 'EXTERIEUR'];
    final groupes = <String, List<Commodite>>{};
    for (final c in _commodites) {
      final cat = c.categorie ?? 'AUTRES';
      groupes.putIfAbsent(cat, () => []).add(c);
    }
    final keysOrdered = [
      ...ordreCategories.where(groupes.containsKey),
      ...groupes.keys.where((k) => !ordreCategories.contains(k)),
    ];
    return keysOrdered
        .expand((cat) => [
              Padding(
                padding: const EdgeInsets.only(top: 12, bottom: 6),
                child: Text(
                  _labelCategorie(cat),
                  style: Theme.of(context).textTheme.labelMedium,
                ),
              ),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: groupes[cat]!
                    .map((c) => FilterChip(
                          label: Text(c.libelle),
                          avatar: Icon(_iconeCommodite(c.code), size: 18,
                              color: _selectedCommodites.contains(c.code)
                                  ? AppColors.primary : AppColors.onBackground),
                          selected: _selectedCommodites.contains(c.code),
                          onSelected: (sel) {
                            setState(() {
                              if (sel) {
                                _selectedCommodites = {..._selectedCommodites, c.code};
                              } else {
                                _selectedCommodites = _selectedCommodites
                                    .where((k) => k != c.code).toSet();
                              }
                            });
                            _notifyChanged();
                          },
                        ))
                    .toList(),
              ),
            ])
        .toList();
  }

  String _labelCategorie(String code) {
    switch (code) {
      case 'CONFORT':   return 'Confort';
      case 'SECURITE':  return 'Sécurité';
      case 'EXTERIEUR': return 'Extérieur';
      default:          return 'Autres';
    }
  }

  /// Mapping codes types bien → icônes Material. Fallback Icons.home_outlined
  /// pour les codes inattendus.
  IconData _iconeTypeBien(String code) {
    switch (code) {
      case 'MAISON':      return Icons.house_outlined;
      case 'APPARTEMENT': return Icons.apartment_outlined;
      case 'IMMEUBLE':    return Icons.business_outlined;
      case 'TERRAIN':     return Icons.terrain_outlined;
      case 'BUREAU':      return Icons.business_center_outlined;
      case 'BOUTIQUE':    return Icons.store_outlined;
      case 'CHAMBRE':     return Icons.bed_outlined;
      default:            return Icons.home_outlined;
    }
  }

  /// Mapping codes commodités → icônes (réutilise _iconeFromCode de la fiche).
  IconData _iconeCommodite(String code) {
    switch (code) {
      case 'CLIMATISATION':     return Icons.ac_unit;
      case 'PARKING':           return Icons.local_parking;
      case 'CHAUFFE_EAU':       return Icons.hot_tub_outlined;
      case 'RESERVOIR_EAU':     return Icons.water_outlined;
      case 'ASCENSEUR':         return Icons.elevator_outlined;
      case 'GENERATEUR':        return Icons.bolt_outlined;
      case 'PANNEAUX_SOLAIRES': return Icons.solar_power_outlined;
      case 'MEUBLE':            return Icons.chair_outlined;
      case 'SECURITE_PRIVEE':   return Icons.shield_outlined;
      default:                  return Icons.check_circle_outline;
    }
  }
}

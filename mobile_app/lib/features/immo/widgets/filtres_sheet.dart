import 'package:flutter/material.dart';

import '../../../shared/theme/app_colors.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../models/recherche_filtres.dart';
import '../models/type_bien.dart';

/// Bottom sheet de filtres 15.2c. Retourne le nouveau [RechercheFiltres]
/// au caller via [Navigator.pop] quand l'utilisateur tape "Appliquer".
/// Bouton "Réinitialiser" remet à zéro le draft local sans fermer.
class FiltresSheet extends StatefulWidget {
  final RechercheFiltres initial;
  final List<TypeBien> typesBien;

  const FiltresSheet({
    super.key,
    required this.initial,
    required this.typesBien,
  });

  @override
  State<FiltresSheet> createState() => _FiltresSheetState();
}

class _FiltresSheetState extends State<FiltresSheet> {
  late RechercheFiltres _draft;
  late final TextEditingController _qController;

  // Bornes du RangeSlider prix (en GNF). Volontairement larges pour couvrir
  // le marché guinéen sans saisie manuelle des bornes. Ajustables plus tard.
  static const double _prixMin = 0;
  static const double _prixMax = 100000000; // 100M GNF
  late RangeValues _prixRange;

  @override
  void initState() {
    super.initState();
    _draft = widget.initial;
    _qController = TextEditingController(text: widget.initial.q ?? '');
    _prixRange = RangeValues(
      (widget.initial.prixMin ?? _prixMin.toInt()).toDouble(),
      (widget.initial.prixMax ?? _prixMax.toInt()).toDouble(),
    );
  }

  @override
  void dispose() {
    _qController.dispose();
    super.dispose();
  }

  void _reset() {
    setState(() {
      _draft = const RechercheFiltres();
      _qController.clear();
      _prixRange = const RangeValues(_prixMin, _prixMax);
    });
  }

  void _apply() {
    // Capture les changements de prix et q dans le draft avant pop.
    final usePrix = _prixRange.start > _prixMin || _prixRange.end < _prixMax;
    final qText = _qController.text.trim();
    final finalised = _draft.copyWith(
      prixMin: usePrix ? _prixRange.start.toInt() : null,
      prixMax: usePrix ? _prixRange.end.toInt() : null,
      q: qText.isEmpty ? null : qText,
    );
    Navigator.of(context).pop(finalised);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
              child: Row(
                children: [
                  Text('Filtres', style: theme.textTheme.titleLarge),
                  const Spacer(),
                  TextButton(
                    onPressed: _draft.isEmpty && _prixRange == const RangeValues(_prixMin, _prixMax) && _qController.text.isEmpty
                        ? null
                        : _reset,
                    child: const Text('Réinitialiser'),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.divider),
            // Body scrollable
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                children: [
                  _section('Type d\'annonce'),
                  Wrap(
                    spacing: 8,
                    children: [
                      _choiceChip('Toutes', _draft.typeAnnonce == null,
                          () => setState(() => _draft = _draft.copyWith(typeAnnonce: null))),
                      _choiceChip('Location', _draft.typeAnnonce == 'LOCATION',
                          () => setState(() => _draft = _draft.copyWith(typeAnnonce: 'LOCATION'))),
                      _choiceChip('Vente', _draft.typeAnnonce == 'VENTE',
                          () => setState(() => _draft = _draft.copyWith(typeAnnonce: 'VENTE'))),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _section('Type de bien'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: widget.typesBien.map((t) {
                      final selected = _draft.typeBienCodes.contains(t.code);
                      return _choiceChip(t.libelle, selected, () {
                        setState(() {
                          final list = List<String>.from(_draft.typeBienCodes);
                          if (selected) {
                            list.remove(t.code);
                          } else {
                            list.add(t.code);
                          }
                          _draft = _draft.copyWith(typeBienCodes: list);
                        });
                      });
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                  _section('Prix (GNF)'),
                  RangeSlider(
                    values: _prixRange,
                    min: _prixMin,
                    max: _prixMax,
                    divisions: 100,
                    labels: RangeLabels(
                      CurrencyFormatter.gnf(_prixRange.start.toInt()),
                      CurrencyFormatter.gnf(_prixRange.end.toInt()),
                    ),
                    onChanged: (v) => setState(() => _prixRange = v),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(CurrencyFormatter.gnf(_prixRange.start.toInt()),
                            style: theme.textTheme.bodySmall),
                        Text(CurrencyFormatter.gnf(_prixRange.end.toInt()),
                            style: theme.textTheme.bodySmall),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  _section('Chambres min'),
                  Wrap(
                    spacing: 8,
                    children: [
                      _choiceChip('Indifférent', _draft.chambresMin == null,
                          () => setState(() => _draft = _draft.copyWith(chambresMin: null))),
                      for (final n in [1, 2, 3, 4])
                        _choiceChip('$n+', _draft.chambresMin == n,
                            () => setState(() => _draft = _draft.copyWith(chambresMin: n))),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _section('Recherche libre'),
                  TextField(
                    controller: _qController,
                    decoration: const InputDecoration(
                      hintText: 'ex: villa Nongo, près mosquée…',
                      prefixIcon: Icon(Icons.search),
                    ),
                    onChanged: (_) => setState(() {}), // refresh reset button state
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
            // Footer : Appliquer
            Container(
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.divider)),
              ),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _apply,
                  child: const Text('Appliquer'),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _section(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: Theme.of(context).textTheme.titleSmall),
    );
  }

  Widget _choiceChip(String label, bool selected, VoidCallback onTap) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../models/commodite.dart';
import '../models/demande_besoin.dart';
import '../models/geo_referentiel.dart';
import '../models/type_bien.dart';
import '../services/demande_service.dart';
import '../services/profil_immo_service.dart';
import '../services/propriete_service.dart';
import 'mes_demandes_screen.dart';

/// « Déclarer mon besoin » : le client décrit ce qu'il recherche
/// (ex. chambre à Nongo/Ratoma, cour fermée, budget 2 000 000–2 500 000 GNF).
/// La demande est diffusée par email aux agences vérifiées de la zone et
/// visible dans leur backoffice « Demandes clients ».
///
/// UX (2026-07-07) : commodités et chambres masquées pour un TERRAIN,
/// chambres en stepper, budgets formatés par milliers, commune/quartier en
/// auto-complétion avec saisie libre conservée si hors référentiel.
class DeclarerBesoinScreen extends StatefulWidget {
  const DeclarerBesoinScreen({super.key});

  @override
  State<DeclarerBesoinScreen> createState() => _DeclarerBesoinScreenState();
}

/// Formate la saisie numérique en groupes de milliers : 800000 → « 800 000 ».
class _MilliersInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) return const TextEditingValue(text: '');
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      buffer.write(digits[i]);
      final restant = digits.length - 1 - i;
      if (restant > 0 && restant % 3 == 0) buffer.write(' ');
    }
    final text = buffer.toString();
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}

class _DeclarerBesoinScreenState extends State<DeclarerBesoinScreen> {
  final _demandeService = DemandeService();
  final _proprieteService = ProprieteService();
  final _profilService = ProfilImmoService();
  final _formKey = GlobalKey<FormState>();

  // Référentiel
  List<TypeBien> _typesBien = [];
  List<Commodite> _commodites = [];
  List<CommuneRef> _communes = [];
  List<QuartierRef> _quartiers = [];
  bool _loadingReferentiel = true;
  String? _erreurReferentiel;

  // Saisie
  String _typeAnnonce = 'LOCATION';
  int? _typeBienId;
  CommuneRef? _commune; // sélectionnée dans le référentiel (sinon texte libre)
  QuartierRef? _quartier;
  final _communeController = TextEditingController();
  final _quartierController = TextEditingController();
  final _communeFocus = FocusNode();
  final _quartierFocus = FocusNode();
  bool _loadingQuartiers = false;
  final _budgetMinController = TextEditingController();
  final _budgetMaxController = TextEditingController();
  int _nbChambresMin = 0; // 0 = indifférent
  final _descriptionController = TextEditingController();
  final _telephoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  Set<int> _commoditesSelectionnees = {};

  bool _submitting = false;
  String? _erreurSoumission;

  /// TERRAIN : commodités et nombre de chambres sans objet.
  bool get _isTerrain {
    final type = _typesBien.where((t) => t.typeBienId == _typeBienId).firstOrNull;
    return type?.code == 'TERRAIN';
  }

  @override
  void initState() {
    super.initState();
    _chargerReferentiel();
    _prefillContact();
  }

  @override
  void dispose() {
    _communeController.dispose();
    _quartierController.dispose();
    _communeFocus.dispose();
    _quartierFocus.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    _descriptionController.dispose();
    _telephoneController.dispose();
    _whatsappController.dispose();
    super.dispose();
  }

  Future<void> _chargerReferentiel() async {
    setState(() {
      _loadingReferentiel = true;
      _erreurReferentiel = null;
    });
    try {
      final results = await Future.wait([
        _proprieteService.listTypesBien(),
        _proprieteService.listCommodites(),
        _demandeService.communesActives(),
      ]);
      if (!mounted) return;
      setState(() {
        _typesBien = (results[0] as List<TypeBien>)..sort((a, b) => a.libelle.compareTo(b.libelle));
        _commodites = results[1] as List<Commodite>;
        _communes = (results[2] as List<CommuneRef>)..sort((a, b) => a.libelle.compareTo(b.libelle));
        _loadingReferentiel = false;
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingReferentiel = false;
        _erreurReferentiel = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingReferentiel = false;
        _erreurReferentiel = 'Impossible de charger le référentiel. Réessayez.';
      });
    }
  }

  /// Pré-remplit le téléphone depuis le profil immo s'il existe (best-effort).
  Future<void> _prefillContact() async {
    try {
      final profil = await _profilService.getMien();
      if (!mounted || profil == null) return;
      final tel = profil.telephoneContact;
      if (tel != null && tel.isNotEmpty && _telephoneController.text.isEmpty) {
        _telephoneController.text = tel;
      }
    } catch (_) {
      // Silencieux : le client saisira son contact manuellement.
    }
  }

  Future<void> _chargerQuartiers(CommuneRef commune) async {
    setState(() {
      _loadingQuartiers = true;
      _quartiers = [];
      _quartier = null;
      _quartierController.clear();
    });
    try {
      final quartiers = await _demandeService.quartiersDeCommune(commune.communeUuid);
      if (!mounted) return;
      setState(() {
        _quartiers = quartiers..sort((a, b) => a.libelle.compareTo(b.libelle));
        _loadingQuartiers = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingQuartiers = false);
    }
  }

  num? _parseMontant(String raw) {
    final cleaned = raw.replaceAll(RegExp(r'[^0-9]'), '');
    return cleaned.isEmpty ? null : num.tryParse(cleaned);
  }

  Future<void> _soumettre() async {
    if (!_formKey.currentState!.validate()) return;

    final communeTexte = _communeController.text.trim();
    if (_commune == null && communeTexte.isEmpty) {
      setState(() => _erreurSoumission = 'Indiquez la commune de votre recherche.');
      return;
    }
    final budgetMin = _parseMontant(_budgetMinController.text);
    final budgetMax = _parseMontant(_budgetMaxController.text);
    if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
      setState(() => _erreurSoumission = 'Le budget minimum dépasse le budget maximum.');
      return;
    }

    final quartierTexte = _quartierController.text.trim();

    setState(() {
      _submitting = true;
      _erreurSoumission = null;
    });
    try {
      final demande = await _demandeService.creer(DemandeCreateRequest(
        typeAnnonce: _typeAnnonce,
        typeBienId: _typeBienId,
        communeId: _commune?.communeId,
        communeTexte: _commune == null ? communeTexte : null,
        quartierId: _quartier?.quartierId,
        quartierTexte: _quartier == null && quartierTexte.isNotEmpty ? quartierTexte : null,
        budgetMin: budgetMin,
        budgetMax: budgetMax,
        nbChambresMin: _isTerrain || _nbChambresMin == 0 ? null : _nbChambresMin,
        commoditeIds: _isTerrain ? const [] : _commoditesSelectionnees.toList(),
        description: _descriptionController.text.trim(),
        contactTelephone: _telephoneController.text.trim(),
        contactWhatsapp: _whatsappController.text.trim(),
      ));
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          icon: const Icon(Icons.check_circle, color: AppColors.success, size: 48),
          title: const Text('Besoin transmis !'),
          content: Text(
            'Votre demande ${demande.reference} a été envoyée aux agences '
            'immobilières de votre zone. Elles vous contacteront directement.',
            textAlign: TextAlign.center,
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        ),
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MesDemandesScreen()),
      );
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _erreurSoumission = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _erreurSoumission = 'Une erreur est survenue. Réessayez.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Déclarer mon besoin')),
      body: _loadingReferentiel
          ? const Center(child: CircularProgressIndicator())
          : _erreurReferentiel != null
              ? _buildErreurReferentiel()
              : _buildForm(),
    );
  }

  Widget _buildErreurReferentiel() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off, size: 48, color: AppColors.onBackground),
            const SizedBox(height: 12),
            Text(_erreurReferentiel!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _chargerReferentiel,
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primaryContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              children: [
                Icon(Icons.campaign_outlined, color: AppColors.primary),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Décrivez ce que vous cherchez : les agences de votre zone '
                    'recevront votre demande et vous contacteront.',
                    style: TextStyle(fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          _section('Je cherche à'),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'LOCATION', label: Text('Louer'), icon: Icon(Icons.key_outlined)),
              ButtonSegment(value: 'ACHAT', label: Text('Acheter'), icon: Icon(Icons.sell_outlined)),
            ],
            selected: {_typeAnnonce},
            onSelectionChanged: (s) => setState(() => _typeAnnonce = s.first),
          ),
          const SizedBox(height: 20),

          _section('Type de bien'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _typesBien.map((t) {
              final selected = _typeBienId == t.typeBienId;
              return ChoiceChip(
                label: Text(t.libelle),
                selected: selected,
                onSelected: (_) => setState(() {
                  _typeBienId = selected ? null : t.typeBienId;
                  if (_isTerrain) {
                    // Un terrain n'a ni chambres ni commodités.
                    _nbChambresMin = 0;
                    _commoditesSelectionnees = {};
                  }
                }),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          _section('Où ?'),
          _buildCommuneAutocomplete(),
          const SizedBox(height: 12),
          _buildQuartierAutocomplete(),
          const SizedBox(height: 20),

          _section('Budget (GNF)'),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _budgetMinController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [_MilliersInputFormatter()],
                  decoration: const InputDecoration(
                    labelText: 'Minimum',
                    hintText: '800 000',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _budgetMaxController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [_MilliersInputFormatter()],
                  decoration: const InputDecoration(
                    labelText: 'Maximum',
                    hintText: '2 500 000',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
            ],
          ),

          if (!_isTerrain) ...[
            const SizedBox(height: 12),
            _buildChambresStepper(),
          ],
          const SizedBox(height: 20),

          if (!_isTerrain && _commodites.isNotEmpty) ...[
            _section('Commodités souhaitées'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _commodites.where((c) => c.commoditeId != null).map((c) {
                final id = c.commoditeId!;
                final selected = _commoditesSelectionnees.contains(id);
                return FilterChip(
                  label: Text(c.libelle),
                  selected: selected,
                  onSelected: (sel) => setState(() {
                    if (sel) {
                      _commoditesSelectionnees = {..._commoditesSelectionnees, id};
                    } else {
                      _commoditesSelectionnees =
                          _commoditesSelectionnees.where((x) => x != id).toSet();
                    }
                  }),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
          ],

          _section('Autres précisions'),
          TextFormField(
            controller: _descriptionController,
            maxLines: 3,
            maxLength: 2000,
            decoration: const InputDecoration(
              hintText: 'Ex. : cour fermée, rez-de-chaussée, proche d\'une école…',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),

          _section('Comment vous joindre'),
          TextFormField(
            controller: _telephoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Téléphone *',
              hintText: '+224 6XX XX XX XX',
              border: OutlineInputBorder(),
            ),
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Le téléphone est obligatoire' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _whatsappController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'WhatsApp (optionnel)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),

          if (_erreurSoumission != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(_erreurSoumission!, style: const TextStyle(color: AppColors.error)),
            ),
            const SizedBox(height: 12),
          ],

          FilledButton.icon(
            onPressed: _submitting ? null : _soumettre,
            icon: _submitting
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.send_outlined),
            label: Text(_submitting ? 'Envoi en cours…' : 'Envoyer aux agences'),
          ),
        ],
      ),
    );
  }

  /// Commune : auto-complétion sur le référentiel, saisie libre conservée
  /// si la valeur tapée n'existe pas (ex. commune de l'intérieur du pays).
  Widget _buildCommuneAutocomplete() {
    return RawAutocomplete<CommuneRef>(
      textEditingController: _communeController,
      focusNode: _communeFocus,
      displayStringForOption: (c) => c.libelle,
      optionsBuilder: (TextEditingValue value) {
        final saisie = value.text.trim().toLowerCase();
        if (saisie.isEmpty) return _communes;
        return _communes.where((c) => c.libelle.toLowerCase().contains(saisie));
      },
      onSelected: (commune) {
        setState(() => _commune = commune);
        _chargerQuartiers(commune);
      },
      fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
        return TextFormField(
          controller: controller,
          focusNode: focusNode,
          decoration: InputDecoration(
            labelText: 'Commune *',
            hintText: 'Ex. : Ratoma, Matoto…',
            border: const OutlineInputBorder(),
            helperText: _commune == null && controller.text.trim().isNotEmpty
                ? 'Hors référentiel — sera transmis tel quel aux agences'
                : null,
            suffixIcon: _commune != null
                ? const Icon(Icons.check_circle, color: AppColors.success, size: 20)
                : const Icon(Icons.search, size: 20),
          ),
          onChanged: (text) {
            // Toute modification manuelle invalide la sélection référentiel.
            if (_commune != null && text.trim() != _commune!.libelle) {
              setState(() {
                _commune = null;
                _quartiers = [];
                _quartier = null;
                _quartierController.clear();
              });
            } else {
              setState(() {});
            }
          },
          validator: (v) => (v == null || v.trim().isEmpty) ? 'La commune est obligatoire' : null,
        );
      },
      optionsViewBuilder: (context, onSelected, options) =>
          _buildOptionsList<CommuneRef>(options, onSelected, (c) => c.libelle,
              sousTitre: (c) => c.villeLibelle),
    );
  }

  /// Quartier : auto-complétion sur les quartiers de la commune sélectionnée,
  /// saisie libre conservée sinon (ex. « Nongo »).
  Widget _buildQuartierAutocomplete() {
    return RawAutocomplete<QuartierRef>(
      textEditingController: _quartierController,
      focusNode: _quartierFocus,
      displayStringForOption: (q) => q.libelle,
      optionsBuilder: (TextEditingValue value) {
        if (_quartiers.isEmpty) return const Iterable<QuartierRef>.empty();
        final saisie = value.text.trim().toLowerCase();
        if (saisie.isEmpty) return _quartiers;
        return _quartiers.where((q) => q.libelle.toLowerCase().contains(saisie));
      },
      onSelected: (quartier) => setState(() => _quartier = quartier),
      fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
        return TextFormField(
          controller: controller,
          focusNode: focusNode,
          decoration: InputDecoration(
            labelText: 'Quartier (optionnel)',
            hintText: 'Ex. : Nongo…',
            border: const OutlineInputBorder(),
            helperText: _quartier == null && controller.text.trim().isNotEmpty
                ? 'Hors référentiel — sera transmis tel quel aux agences'
                : null,
            suffixIcon: _loadingQuartiers
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                  )
                : _quartier != null
                    ? const Icon(Icons.check_circle, color: AppColors.success, size: 20)
                    : null,
          ),
          onChanged: (text) {
            if (_quartier != null && text.trim() != _quartier!.libelle) {
              setState(() => _quartier = null);
            } else {
              setState(() {});
            }
          },
        );
      },
      optionsViewBuilder: (context, onSelected, options) =>
          _buildOptionsList<QuartierRef>(options, onSelected, (q) => q.libelle),
    );
  }

  Widget _buildOptionsList<T extends Object>(
    Iterable<T> options,
    AutocompleteOnSelected<T> onSelected,
    String Function(T) libelle, {
    String? Function(T)? sousTitre,
  }) {
    return Align(
      alignment: Alignment.topLeft,
      child: Material(
        elevation: 4,
        borderRadius: BorderRadius.circular(8),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 240, maxWidth: 360),
          child: ListView.builder(
            padding: EdgeInsets.zero,
            shrinkWrap: true,
            itemCount: options.length,
            itemBuilder: (context, index) {
              final option = options.elementAt(index);
              final sub = sousTitre?.call(option);
              return ListTile(
                dense: true,
                title: Text(libelle(option)),
                subtitle: sub != null && sub.isNotEmpty ? Text(sub) : null,
                onTap: () => onSelected(option),
              );
            },
          ),
        ),
      ),
    );
  }

  /// Nombre de chambres minimum : stepper − / + (0 = indifférent).
  Widget _buildChambresStepper() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.divider),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Text('Chambres minimum', style: TextStyle(fontSize: 15)),
          ),
          IconButton.outlined(
            onPressed: _nbChambresMin > 0 ? () => setState(() => _nbChambresMin--) : null,
            icon: const Icon(Icons.remove),
            visualDensity: VisualDensity.compact,
          ),
          SizedBox(
            width: 82,
            child: Text(
              _nbChambresMin == 0 ? 'Indifférent' : '$_nbChambresMin+',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          IconButton.outlined(
            onPressed: _nbChambresMin < 20 ? () => setState(() => _nbChambresMin++) : null,
            icon: const Icon(Icons.add),
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }

  Widget _section(String titre) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(titre, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
      );
}

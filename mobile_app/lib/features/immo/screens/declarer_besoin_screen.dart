import 'package:flutter/material.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/utils/currency_formatter.dart';
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
class DeclarerBesoinScreen extends StatefulWidget {
  const DeclarerBesoinScreen({super.key});

  @override
  State<DeclarerBesoinScreen> createState() => _DeclarerBesoinScreenState();
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
  CommuneRef? _commune;
  QuartierRef? _quartier;
  bool _loadingQuartiers = false;
  final _budgetMinController = TextEditingController();
  final _budgetMaxController = TextEditingController();
  final _chambresController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _telephoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  Set<int> _commoditesSelectionnees = {};

  bool _submitting = false;
  String? _erreurSoumission;

  @override
  void initState() {
    super.initState();
    _chargerReferentiel();
    _prefillContact();
  }

  @override
  void dispose() {
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    _chambresController.dispose();
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
    final cleaned = raw.replaceAll(RegExp(r'[\s.,]'), '');
    return cleaned.isEmpty ? null : num.tryParse(cleaned);
  }

  Future<void> _soumettre() async {
    if (!_formKey.currentState!.validate()) return;
    final commune = _commune;
    if (commune == null) {
      setState(() => _erreurSoumission = 'Choisissez la commune de votre recherche.');
      return;
    }
    final budgetMin = _parseMontant(_budgetMinController.text);
    final budgetMax = _parseMontant(_budgetMaxController.text);
    if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
      setState(() => _erreurSoumission = 'Le budget minimum dépasse le budget maximum.');
      return;
    }

    setState(() {
      _submitting = true;
      _erreurSoumission = null;
    });
    try {
      final demande = await _demandeService.creer(DemandeCreateRequest(
        typeAnnonce: _typeAnnonce,
        typeBienId: _typeBienId,
        communeId: commune.communeId,
        quartierId: _quartier?.quartierId,
        budgetMin: budgetMin,
        budgetMax: budgetMax,
        nbChambresMin: int.tryParse(_chambresController.text.trim()),
        commoditeIds: _commoditesSelectionnees.toList(),
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
                onSelected: (_) => setState(() => _typeBienId = selected ? null : t.typeBienId),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          _section('Où ?'),
          DropdownButtonFormField<CommuneRef>(
            initialValue: _commune,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Commune *', border: OutlineInputBorder()),
            items: _communes
                .map((c) => DropdownMenuItem(
                      value: c,
                      child: Text(
                        c.villeLibelle != null ? '${c.libelle} (${c.villeLibelle})' : c.libelle,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ))
                .toList(),
            onChanged: (c) {
              setState(() => _commune = c);
              if (c != null) _chargerQuartiers(c);
            },
            validator: (v) => v == null ? 'La commune est obligatoire' : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<QuartierRef>(
            initialValue: _quartier,
            isExpanded: true,
            decoration: InputDecoration(
              labelText: 'Quartier (optionnel)',
              border: const OutlineInputBorder(),
              suffixIcon: _loadingQuartiers
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                    )
                  : null,
            ),
            items: _quartiers
                .map((q) => DropdownMenuItem(value: q, child: Text(q.libelle, overflow: TextOverflow.ellipsis)))
                .toList(),
            onChanged: _quartiers.isEmpty ? null : (q) => setState(() => _quartier = q),
          ),
          const SizedBox(height: 20),

          _section('Budget (GNF)'),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _budgetMinController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Minimum', border: OutlineInputBorder()),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _budgetMaxController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Maximum', border: OutlineInputBorder()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _chambresController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Nombre de chambres minimum (optionnel)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),

          if (_commodites.isNotEmpty) ...[
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
          const SizedBox(height: 8),
          Text(
            _budgetHint(),
            style: const TextStyle(fontSize: 12, color: AppColors.onBackground),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  String _budgetHint() {
    final min = _parseMontant(_budgetMinController.text);
    final max = _parseMontant(_budgetMaxController.text);
    if (min == null && max == null) return '';
    final minTxt = min != null ? CurrencyFormatter.gnf(min.toInt()) : '—';
    final maxTxt = max != null ? CurrencyFormatter.gnf(max.toInt()) : '—';
    return 'Budget : $minTxt à $maxTxt';
  }

  Widget _section(String titre) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(titre, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
      );
}

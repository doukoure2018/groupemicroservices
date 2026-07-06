import 'package:flutter/material.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../../../shared/widgets/app_empty_state.dart';
import '../../../shared/widgets/app_error.dart';
import '../../../shared/widgets/app_loading.dart';
import '../models/demande_besoin.dart';
import '../services/demande_service.dart';
import 'declarer_besoin_screen.dart';

/// Suivi des besoins déclarés par le client (référence, zone, statut),
/// avec annulation possible tant que la demande est ACTIVE.
class MesDemandesScreen extends StatefulWidget {
  const MesDemandesScreen({super.key});

  @override
  State<MesDemandesScreen> createState() => _MesDemandesScreenState();
}

class _MesDemandesScreenState extends State<MesDemandesScreen> {
  final _service = DemandeService();

  List<DemandeBesoin> _demandes = [];
  bool _loading = true;
  String? _erreur;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _erreur = null;
    });
    try {
      final demandes = await _service.mesDemandes();
      if (!mounted) return;
      setState(() {
        _demandes = demandes;
        _loading = false;
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _erreur = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _erreur = 'Impossible de charger vos demandes.';
      });
    }
  }

  Future<void> _annuler(DemandeBesoin demande) async {
    final confirme = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Annuler cette demande ?'),
        content: Text('Les agences ne verront plus votre demande ${demande.reference}.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Non')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Oui, annuler')),
        ],
      ),
    );
    if (confirme != true) return;
    try {
      await _service.annuler(demande.demandeUuid);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Demande annulée')),
      );
      _load();
    } on AppException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes demandes')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const DeclarerBesoinScreen()),
          );
          _load();
        },
        icon: const Icon(Icons.add),
        label: const Text('Nouveau besoin'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const AppLoading(label: 'Chargement de vos demandes…');
    if (_erreur != null) return AppError(message: _erreur!, onRetry: _load);
    if (_demandes.isEmpty) {
      return AppEmptyState(
        icon: Icons.campaign_outlined,
        title: 'Aucune demande',
        subtitle: 'Déclarez votre besoin : les agences de votre zone vous contacteront.',
        action: FilledButton.icon(
          onPressed: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const DeclarerBesoinScreen()),
            );
            _load();
          },
          icon: const Icon(Icons.add),
          label: const Text('Déclarer mon besoin'),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        itemCount: _demandes.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) => _DemandeCard(
          demande: _demandes[index],
          onAnnuler: () => _annuler(_demandes[index]),
        ),
      ),
    );
  }
}

class _DemandeCard extends StatelessWidget {
  const _DemandeCard({required this.demande, required this.onAnnuler});

  final DemandeBesoin demande;
  final VoidCallback onAnnuler;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${demande.typeBienLibelle ?? 'Bien'} — '
                    '${demande.typeAnnonce == 'LOCATION' ? 'Location' : 'Achat'}',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
                _StatutChip(statut: demande.statut),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.place_outlined, size: 16, color: AppColors.onBackground),
                const SizedBox(width: 4),
                Expanded(child: Text(demande.zoneLibelle, style: const TextStyle(fontSize: 13))),
              ],
            ),
            if (demande.budgetMin != null || demande.budgetMax != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.payments_outlined, size: 16, color: AppColors.onBackground),
                  const SizedBox(width: 4),
                  Text(
                    '${demande.budgetMin != null ? CurrencyFormatter.gnf(demande.budgetMin!.toInt()) : '—'}'
                    ' à ${demande.budgetMax != null ? CurrencyFormatter.gnf(demande.budgetMax!.toInt()) : '—'}',
                    style: const TextStyle(fontSize: 13),
                  ),
                ],
              ),
            ],
            if (demande.description != null && demande.description!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                demande.description!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, color: AppColors.onBackground),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  demande.reference,
                  style: const TextStyle(fontSize: 12, color: AppColors.onBackground),
                ),
                const Spacer(),
                if (demande.estActive)
                  TextButton.icon(
                    onPressed: onAnnuler,
                    icon: const Icon(Icons.close, size: 16),
                    label: const Text('Annuler'),
                    style: TextButton.styleFrom(foregroundColor: AppColors.error),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatutChip extends StatelessWidget {
  const _StatutChip({required this.statut});

  final String statut;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (statut) {
      'ACTIVE' => ('Active', AppColors.success),
      'POURVUE' => ('Pourvue', AppColors.info),
      'ANNULEE' => ('Annulée', AppColors.onBackground),
      'EXPIREE' => ('Expirée', AppColors.warning),
      _ => (statut, AppColors.onBackground),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
    );
  }
}

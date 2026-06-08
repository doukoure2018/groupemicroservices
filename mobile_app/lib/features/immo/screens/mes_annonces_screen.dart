import 'package:flutter/material.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/app_empty_state.dart';
import '../../../shared/widgets/app_error.dart';
import '../../../shared/widgets/app_loading.dart';
import '../services/mes_annonces_service.dart';
import '../widgets/mes_annonce_card.dart';
import 'fiche_propriete_screen.dart';
import 'wizard/wizard_publication_screen.dart';

/// Écran "Mes annonces" — point d'entrée vendeur pour voir/gérer ses
/// propres annonces. 4e tab du HubScreen.
///
/// 3 sections (filtre via ChoiceChip) :
///   - Brouillons : `BrouillonService.mes()`
///   - En cours : EN_ATTENTE_VALIDATION + PUBLIE + RESERVE
///   - Rejetées : RETIRE (avec motif admin)
///
/// Tap card :
///   - Brouillon → WizardPublicationScreen (reprend depuis brouillonUuid)
///   - En cours → FichePropriété (lecture seule pour l'instant)
///   - Rejetée → AnnonceRejetScreen (montre motif + bouton Republier)
class MesAnnoncesScreen extends StatefulWidget {
  const MesAnnoncesScreen({super.key});

  @override
  State<MesAnnoncesScreen> createState() => _MesAnnoncesScreenState();
}

enum _Filter { brouillons, enCours, rejetees }

class _MesAnnoncesScreenState extends State<MesAnnoncesScreen> {
  final _service = MesAnnoncesService();
  _Filter _filter = _Filter.brouillons;
  late Future<MesAnnoncesData> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.fetchAll();
  }

  Future<void> _refresh() async {
    final fresh = _service.fetchAll();
    setState(() => _future = fresh);
    await fresh;
  }

  void _setFilter(_Filter f) {
    if (f != _filter) setState(() => _filter = f);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes annonces')),
      body: FutureBuilder<MesAnnoncesData>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const AppLoading();
          }
          if (snapshot.hasError) {
            return AppError(
              message: snapshot.error is AppException
                  ? (snapshot.error as AppException).message
                  : 'Impossible de charger vos annonces',
              onRetry: _refresh,
            );
          }
          final data = snapshot.data ?? MesAnnoncesData.empty;
          return Column(
            children: [
              _chipsBar(data),
              Expanded(child: _listForFilter(data)),
            ],
          );
        },
      ),
    );
  }

  Widget _chipsBar(MesAnnoncesData data) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Wrap(
        spacing: 8,
        children: [
          ChoiceChip(
            label: Text('Brouillons (${data.brouillons.length})'),
            selected: _filter == _Filter.brouillons,
            onSelected: (_) => _setFilter(_Filter.brouillons),
          ),
          ChoiceChip(
            label: Text('En cours (${data.enCours.length})'),
            selected: _filter == _Filter.enCours,
            onSelected: (_) => _setFilter(_Filter.enCours),
          ),
          ChoiceChip(
            label: Text('Rejetées (${data.rejetees.length})'),
            selected: _filter == _Filter.rejetees,
            onSelected: (_) => _setFilter(_Filter.rejetees),
          ),
        ],
      ),
    );
  }

  Widget _listForFilter(MesAnnoncesData data) {
    return RefreshIndicator(
      onRefresh: _refresh,
      color: AppColors.primary,
      child: switch (_filter) {
        _Filter.brouillons => _brouillonsList(data),
        _Filter.enCours => _enCoursList(data),
        _Filter.rejetees => _rejeteesList(data),
      },
    );
  }

  Widget _brouillonsList(MesAnnoncesData data) {
    if (data.brouillons.isEmpty) {
      return _emptyState(
        icon: Icons.edit_note,
        title: 'Aucun brouillon',
        subtitle: 'Démarrez une nouvelle annonce depuis l\'onglet Immobilier.',
      );
    }
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: data.brouillons.length,
      itemBuilder: (_, i) {
        final b = data.brouillons[i];
        return MesAnnonceCard.brouillon(
          brouillon: b,
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => const WizardPublicationScreen(),
              ),
            );
            _refresh();
          },
        );
      },
    );
  }

  Widget _enCoursList(MesAnnoncesData data) {
    if (data.enCours.isEmpty) {
      return _emptyState(
        icon: Icons.inbox_outlined,
        title: 'Aucune annonce en cours',
        subtitle:
            'Vos annonces publiées ou en attente de validation apparaîtront ici.',
      );
    }
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: data.enCours.length,
      itemBuilder: (_, i) {
        final p = data.enCours[i];
        return MesAnnonceCard.propriete(
          propriete: p,
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => FicheProprieteScreen(proprieteUuid: p.proprieteUuid),
              ),
            );
            _refresh();
          },
        );
      },
    );
  }

  Widget _rejeteesList(MesAnnoncesData data) {
    if (data.rejetees.isEmpty) {
      return _emptyState(
        icon: Icons.check_circle_outline,
        title: 'Aucune annonce rejetée',
        subtitle: 'Aucune action requise — vous êtes à jour.',
      );
    }
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: data.rejetees.length,
      itemBuilder: (_, i) {
        final p = data.rejetees[i];
        return MesAnnonceCard.propriete(
          propriete: p,
          onTap: () async {
            // Mode reprise REJETE : on ouvre le wizard 4 étapes pré-rempli
            // depuis cette propriété. À la fin, updateAndPublier au lieu de
            // matérialiser un nouveau brouillon.
            await Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => WizardPublicationScreen(repriseDepuisRejet: p),
              ),
            );
            _refresh();
          },
        );
      },
    );
  }

  Widget _emptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    // ListView wrapper pour permettre le pull-to-refresh même quand vide.
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.5,
          child: AppEmptyState(
            icon: icon,
            title: title,
            subtitle: subtitle,
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';

import '../../screens/main_screen.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_theme.dart';
import '../immo/screens/declarer_besoin_screen.dart';
import '../immo/screens/mes_annonces_screen.dart';
import '../immo/screens/mes_demandes_screen.dart';
import '../immo/screens/mes_favoris_screen.dart';
import '../immo/screens/recherche_screen.dart';
import '../immo/screens/wizard/wizard_publication_screen.dart';

/// Hub d'accueil YIGUI — point d'entrée pour l'utilisateur authentifié.
///
/// 3 tabs au niveau super-app :
///   - Billetterie : embarque [MainScreen(embedded: true)], palette orange
///     legacy intacte, nav interne déplacée en haut pour ne pas se
///     superposer à la NavigationBar du hub.
///   - Immobilier : placeholder YIGUI sarcelle en 15.2a, écran réel en 15.2c.
///   - Profil : placeholder YIGUI sarcelle en 15.2a, écran réel plus tard.
///
/// Le tab Billetterie hérite du theme orange root ([ColorManager.accent]
/// via MaterialApp dans main.dart). Les tabs Immobilier et Profil sont
/// enveloppés dans [Theme(data: AppTheme.light(), ...)] pour basculer en
/// palette YIGUI sarcelle SANS toucher le tab Billetterie.
class HubScreen extends StatefulWidget {
  const HubScreen({super.key});

  @override
  State<HubScreen> createState() => _HubScreenState();
}

class _HubScreenState extends State<HubScreen> {
  int _currentIndex = 0;

  late final List<Widget> _tabs = [
    Theme(data: AppTheme.light(), child: const RechercheScreen()), // tab 0 : Immobilier (1er au démarrage)
    Theme(data: AppTheme.light(), child: const MesAnnoncesScreen()),
    const MainScreen(embedded: true), // Billetterie : palette orange legacy intacte
    Theme(data: AppTheme.light(), child: const _ProfilPlaceholder()),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _tabs),
      // Styling explicite YIGUI — ne dépend pas du Theme parent (orange root)
      // pour ne pas changer de couleur quand le tab Billetterie est sélectionné.
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primaryContainer,
        surfaceTintColor: AppColors.surface,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.apartment_outlined),
            selectedIcon: Icon(Icons.apartment, color: AppColors.primary),
            label: 'Immobilier',
          ),
          NavigationDestination(
            icon: Icon(Icons.list_alt_outlined),
            selectedIcon: Icon(Icons.list_alt, color: AppColors.primary),
            label: 'Mes annonces',
          ),
          NavigationDestination(
            icon: Icon(Icons.confirmation_number_outlined),
            selectedIcon: Icon(Icons.confirmation_number, color: AppColors.primary),
            label: 'Billetterie',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppColors.primary),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}

/// Placeholder Profil — devient un menu extensible. En MVP : un seul item
/// "Mes favoris" (Phase Favoris). Items futurs prévus : "Mes annonces"
/// (15.2f), "Mes contacts envoyés", "Mes demandes de visite", "Mon profil
/// vendeur" (édition), "Déconnexion".
class _ProfilPlaceholder extends StatelessWidget {
  const _ProfilPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          // CTA principal : publier une annonce — déplacé depuis le FAB de
          // l'écran recherche pour alléger la vue acheteur et mettre en avant
          // la publication côté hôtes/vendeurs.
          _PublierCard(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const WizardPublicationScreen()),
            ),
          ),
          const SizedBox(height: 12),
          // CTA acheteur : déclarer un besoin — diffusé aux agences de la zone.
          _DeclarerBesoinCard(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const DeclarerBesoinScreen()),
            ),
          ),
          const SizedBox(height: 18),
          Material(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            child: ListTile(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              leading: const Icon(Icons.favorite_outline,
                  color: AppColors.primary),
              title: const Text('Mes favoris'),
              subtitle: const Text('Annonces que vous avez sauvegardées'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const MesFavorisScreen()),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Material(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            child: ListTile(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              leading: const Icon(Icons.campaign_outlined,
                  color: AppColors.primary),
              title: const Text('Mes demandes'),
              subtitle: const Text('Vos besoins déclarés aux agences'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const MesDemandesScreen()),
              ),
            ),
          ),
          // Items futurs : Mes contacts, Mon profil vendeur, Déconnexion.
        ],
      ),
    );
  }
}

/// CTA « Déclarer mon besoin » — pendant acheteur de [_PublierCard] :
/// le client décrit sa recherche, les agences vérifiées de la zone la
/// reçoivent par email et le recontactent.
class _DeclarerBesoinCard extends StatelessWidget {
  final VoidCallback onTap;
  const _DeclarerBesoinCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.primary,
      borderRadius: BorderRadius.circular(16),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.campaign_outlined,
                    color: Colors.white, size: 26),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Déclarer mon besoin',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Décrivez votre recherche, les agences vous contactent',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}

class _PublierCard extends StatelessWidget {
  final VoidCallback onTap;
  const _PublierCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.secondary,
      borderRadius: BorderRadius.circular(16),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.add, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Publier une annonce',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Mettez votre bien en location ou en vente',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}

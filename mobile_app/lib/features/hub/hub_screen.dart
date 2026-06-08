import 'package:flutter/material.dart';

import '../../screens/main_screen.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_theme.dart';
import '../immo/screens/mes_annonces_screen.dart';
import '../immo/screens/mes_favoris_screen.dart';
import '../immo/screens/recherche_screen.dart';

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
    const MainScreen(embedded: true), // tab 0 : palette orange legacy intacte
    Theme(data: AppTheme.light(), child: const RechercheScreen()),
    Theme(data: AppTheme.light(), child: const MesAnnoncesScreen()),
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
            icon: Icon(Icons.confirmation_number_outlined),
            selectedIcon: Icon(Icons.confirmation_number, color: AppColors.primary),
            label: 'Billetterie',
          ),
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
        children: [
          ListTile(
            leading: const Icon(Icons.favorite_outline, color: AppColors.primary),
            title: const Text('Mes favoris'),
            subtitle: const Text('Annonces que vous avez sauvegardées'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const MesFavorisScreen()),
            ),
          ),
          const Divider(height: 1),
          // Items futurs : Mes annonces (15.2f), Mes contacts, etc.
        ],
      ),
    );
  }
}

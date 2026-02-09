import { Routes } from '@angular/router';

export default [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        data: { breadcrumb: 'Home' },
        loadComponent: () => import('./home/home.component').then((c) => c.HomeComponent)
    },

    // ===== ROUTES ADMIN =====
    {
        path: 'admin',
        data: { breadcrumb: 'Administrateur' },
        loadComponent: () => import('./admin/admin.component').then((c) => c.AdminComponent)
    },

    // 1. Données Géographiques
    {
        path: 'admin/regions',
        data: { breadcrumb: 'Gestion des Régions' },
        loadComponent: () => import('./admin/regions/regions.component').then((c) => c.RegionsComponent)
    },
    {
        path: 'admin/villes',
        data: { breadcrumb: 'Villes/Préfectures' },
        loadComponent: () => import('./admin/villes/villes.component').then((c) => c.VillesComponent)
    },
    {
        path: 'admin/communes',
        data: { breadcrumb: 'Communes' },
        loadComponent: () => import('./admin/communes/communes.component').then((c) => c.CommunesComponent)
    },
    {
        path: 'admin/quartiers',
        data: { breadcrumb: 'Quartiers' },
        loadComponent: () => import('./admin/quartiers/quartiers.component').then((c) => c.QuartiersComponent)
    },
    {
        path: 'admin/localisations',
        data: { breadcrumb: 'Localisations' },
        loadComponent: () => import('./admin/localisations/localisations.component').then((c) => c.LocalisationsComponent)
    },

    // 2. Infrastructure Transport
    {
        path: 'admin/sites-gares',
        data: { breadcrumb: 'Sites/Gares' },
        loadComponent: () => import('./admin/sites-gares/sites-gares.component').then((c) => c.SitesGaresComponent)
    },
    {
        path: 'admin/points-depart',
        data: { breadcrumb: 'Points de Départ' },
        loadComponent: () => import('./admin/points-depart/points-depart.component').then((c) => c.PointsDepartComponent)
    },
    {
        path: 'admin/points-arrivee',
        data: { breadcrumb: "Points d'Arrivée" },
        loadComponent: () => import('./admin/points-arrivee/points-arrivee.component').then((c) => c.PointsArriveeComponent)
    },
    {
        path: 'admin/trajets',
        data: { breadcrumb: 'Trajets' },
        loadComponent: () => import('./admin/trajets/trajets.component').then((c) => c.TrajetsComponent)
    },

    // 3. Véhicules
    {
        path: 'admin/types-vehicules',
        data: { breadcrumb: 'Types de Véhicules' },
        loadComponent: () => import('./admin/types-vehicules/types-vehicules.component').then((c) => c.TypesVehiculesComponent)
    },
    {
        path: 'admin/vehicules',
        data: { breadcrumb: 'Véhicules' },
        loadComponent: () => import('./admin/vehicules/vehicules.component').then((c) => c.VehiculesComponent)
    },

    // 4. Configuration Commerciale
    {
        path: 'admin/modes-reglement',
        data: { breadcrumb: 'Modes de Règlement' },
        loadComponent: () => import('./admin/modes-reglement/modes-reglement.component').then((c) => c.ModesReglementComponent)
    },
    {
        path: 'admin/partenaires',
        data: { breadcrumb: 'Partenaires' },
        loadComponent: () => import('./admin/partenaires/partenaires.component').then((c) => c.PartenairesComponent)
    },

    // 5. Offres de Transport
    {
        path: 'admin/offres-transport',
        data: { breadcrumb: 'Offres de Transport' },
        loadComponent: () => import('./admin/offres-transport/offres-transport.component').then((c) => c.OffresTransportComponent)
    },

    // 6. Utilisateurs
    {
        path: 'admin/utilisateurs',
        data: { breadcrumb: 'Liste des Utilisateurs' },
        loadComponent: () => import('./admin/utilisateurs/utilisateurs.component').then((c) => c.UtilisateursComponent)
    },
    {
        path: 'admin/utilisateurs/create',
        data: { breadcrumb: 'Créer un Utilisateur' },
        loadComponent: () => import('./admin/create-user/create-user.component').then((c) => c.CreateUserComponent)
    },

    // ===== AUTRES ROUTES =====
    {
        path: 'createUser',
        data: { breadcrumb: 'Creation de Compte' },
        loadComponent: () => import('./admin/create-user/create-user.component').then((c) => c.CreateUserComponent)
    },
    {
        path: 'analytics',
        data: { breadcrumb: 'Analytics Dashboard' },
        loadComponent: () => import('./analytics/dashboardanalytics').then((c) => c.DashboardAnalytics)
    },
    {
        path: 'sales',
        data: { breadcrumb: 'Sales Dashboard' },
        loadComponent: () => import('./sales/dashboardsales').then((c) => c.DashboardSales)
    },
    {
        path: 'saas',
        data: { breadcrumb: 'Saas Dashboard' },
        loadComponent: () => import('./saas/dashboardsaas').then((c) => c.DashboardSaas)
    }
] as Routes;

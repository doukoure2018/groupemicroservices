/**
 * Guide de voyage statique de la page d'accueil : distances routières depuis
 * Conakry, durées estimées en taxi-brousse et tarifs indicatifs par préfecture.
 *
 * ⚠️ Données INDICATIVES (état des routes et carburant fluctuants) : les prix
 * réels sont ceux des offres publiées par les transporteurs (recherche du hero).
 * Distances arrondies ; durées hors saison des pluies (juin-octobre : prévoir
 * une marge, surtout vers la Guinée Forestière).
 */

export type RegionNaturelle = 'Basse Guinée' | 'Moyenne Guinée' | 'Haute Guinée' | 'Guinée Forestière';

export const REGIONS_NATURELLES: RegionNaturelle[] = ['Basse Guinée', 'Moyenne Guinée', 'Haute Guinée', 'Guinée Forestière'];

export interface PrefectureInfo {
    nom: string;
    region: RegionNaturelle;
    /** Distance routière approximative depuis Conakry */
    distance: string;
    /** Durée indicative en taxi-brousse, hors saison des pluies */
    duree: string;
    /** Tarif indicatif taxi-brousse depuis Conakry (GNF) */
    tarif: string;
    note?: string;
}

export const PREFECTURES: PrefectureInfo[] = [
    // ===== Basse Guinée (Guinée Maritime) =====
    { nom: 'Coyah', region: 'Basse Guinée', distance: '~50 km', duree: '~1 h', tarif: '15 000' },
    { nom: 'Dubréka', region: 'Basse Guinée', distance: '~50 km', duree: '~1 h', tarif: '15 000' },
    { nom: 'Forécariah', region: 'Basse Guinée', distance: '~100 km', duree: '~2 h', tarif: '25 000' },
    { nom: 'Kindia', region: 'Basse Guinée', distance: '~135 km', duree: '~2 h 30', tarif: '50 000' },
    { nom: 'Boffa', region: 'Basse Guinée', distance: '~150 km', duree: '~3 h', tarif: '35 000' },
    { nom: 'Fria', region: 'Basse Guinée', distance: '~160 km', duree: '~3 h', tarif: '35 000' },
    { nom: 'Télimélé', region: 'Basse Guinée', distance: '~270 km', duree: '~6 h', tarif: '130 000', note: 'Tronçons de piste' },
    { nom: 'Boké', region: 'Basse Guinée', distance: '~300 km', duree: '~5 h 30', tarif: '70 000' },
    // ===== Moyenne Guinée (Fouta Djallon) =====
    { nom: 'Mamou', region: 'Moyenne Guinée', distance: '~270 km', duree: '~4 h 30', tarif: '100 000', note: 'Carrefour du pays' },
    { nom: 'Dalaba', region: 'Moyenne Guinée', distance: '~340 km', duree: '~5 h 30', tarif: '140 000' },
    { nom: 'Pita', region: 'Moyenne Guinée', distance: '~390 km', duree: '~6 h 30', tarif: '150 000' },
    { nom: 'Labé', region: 'Moyenne Guinée', distance: '~440 km', duree: '~7 h', tarif: '160 000 – 200 000', note: 'Tarif en hausse fin 2025' },
    { nom: 'Gaoual', region: 'Moyenne Guinée', distance: '~450 km', duree: '~8 h', tarif: '200 000' },
    { nom: 'Lélouma', region: 'Moyenne Guinée', distance: '~490 km', duree: '~8 h 30', tarif: '180 000' },
    { nom: 'Koubia', region: 'Moyenne Guinée', distance: '~510 km', duree: '~9 h', tarif: '180 000' },
    { nom: 'Mali', region: 'Moyenne Guinée', distance: '~550 km', duree: '~10 h', tarif: '250 000' },
    { nom: 'Tougué', region: 'Moyenne Guinée', distance: '~550 km', duree: '~10 h', tarif: '180 000' },
    { nom: 'Koundara', region: 'Moyenne Guinée', distance: '~600 km', duree: '~10 h', tarif: '250 000' },
    // ===== Haute Guinée =====
    { nom: 'Dabola', region: 'Haute Guinée', distance: '~430 km', duree: '~7 h', tarif: '140 000' },
    { nom: 'Faranah', region: 'Haute Guinée', distance: '~460 km', duree: '~7 h 30', tarif: '160 000' },
    { nom: 'Dinguiraye', region: 'Haute Guinée', distance: '~530 km', duree: '~9 h', tarif: '160 000' },
    { nom: 'Kouroussa', region: 'Haute Guinée', distance: '~585 km', duree: '~9 h', tarif: '180 000' },
    { nom: 'Kankan', region: 'Haute Guinée', distance: '~660 km', duree: '~10 h', tarif: '200 000' },
    { nom: 'Kérouané', region: 'Haute Guinée', distance: '~750 km', duree: '~12 h', tarif: '310 000' },
    { nom: 'Mandiana', region: 'Haute Guinée', distance: '~780 km', duree: '~12 h 30', tarif: '260 000' },
    { nom: 'Siguiri', region: 'Haute Guinée', distance: '~800 km', duree: '~12 h', tarif: '250 000', note: 'Via Kankan ou Dabola-Kouroussa' },
    // ===== Guinée Forestière =====
    { nom: 'Kissidougou', region: 'Guinée Forestière', distance: '~575 km', duree: '~9 h', tarif: '180 000' },
    { nom: 'Guéckédou', region: 'Guinée Forestière', distance: '~665 km', duree: '~11 h', tarif: '250 000' },
    { nom: 'Macenta', region: 'Guinée Forestière', distance: '~750 km', duree: '~13 h', tarif: '280 000' },
    { nom: 'Beyla', region: 'Guinée Forestière', distance: '~900 km', duree: '~15 h', tarif: '280 000' },
    { nom: 'Nzérékoré', region: 'Guinée Forestière', distance: '860 – 960 km', duree: '15 – 20 h', tarif: '280 000 – 350 000', note: "Selon l'itinéraire ; nuit possible à Kissidougou" },
    { nom: 'Yomou', region: 'Guinée Forestière', distance: '~1 000 km', duree: '~17 h', tarif: '325 000' },
    { nom: 'Lola', region: 'Guinée Forestière', distance: '~1 000 km', duree: '~17 h', tarif: '295 000' }
];

/** Distances indicatives entre villes de l'intérieur (hors Conakry). */
export interface AxeInterVilles {
    de: string;
    vers: string;
    distance: string;
    duree: string;
}

export const AXES_INTERVILLES: AxeInterVilles[] = [
    { de: 'Mamou', vers: 'Labé', distance: '~170 km', duree: '~3 h' },
    { de: 'Mamou', vers: 'Faranah', distance: '~190 km', duree: '~3 h' },
    { de: 'Mamou', vers: 'Dabola', distance: '~160 km', duree: '~2 h 30' },
    { de: 'Labé', vers: 'Koundara', distance: '~160 km', duree: '~4 h' },
    { de: 'Labé', vers: 'Mali', distance: '~110 km', duree: '~3 h' },
    { de: 'Kankan', vers: 'Siguiri', distance: '~140 km', duree: '~2 h 30' },
    { de: 'Kankan', vers: 'Kérouané', distance: '~90 km', duree: '~2 h' },
    { de: 'Kankan', vers: 'Kouroussa', distance: '~85 km', duree: '~1 h 30' },
    { de: 'Kissidougou', vers: 'Guéckédou', distance: '~90 km', duree: '~2 h' },
    { de: 'Guéckédou', vers: 'Macenta', distance: '~85 km', duree: '~2 h' },
    { de: 'Macenta', vers: 'Nzérékoré', distance: '~115 km', duree: '~3 h' },
    { de: 'Nzérékoré', vers: 'Lola', distance: '~40 km', duree: '~1 h' }
];

/** Fiches détaillées des grands axes longue distance. */
export interface GrandAxe {
    titre: string;
    itineraire: string;
    distance: string;
    duree: string;
    tarif: string;
    points: string[];
}

export const GRANDS_AXES: GrandAxe[] = [
    {
        titre: 'Conakry → Nzérékoré',
        itineraire: 'Coyah · Kindia · Mamou · Faranah · Kissidougou · Guéckédou · Macenta',
        distance: '860 – 960 km selon l’itinéraire',
        duree: '15 à 20 h réelles (11 h théoriques)',
        tarif: '280 000 – 350 000 GNF + bagages',
        points: [
            'Le plus long trajet du pays — partez avant 7 h pour éviter de rouler de nuit',
            'Tronçon dégradé entre Kissidougou et Nzérékoré, surtout en saison des pluies',
            'Beaucoup de voyageurs coupent le trajet avec une nuit à Kissidougou ou Faranah',
            'Place à l’avant : supplément de 20 000 à 50 000 GNF'
        ]
    },
    {
        titre: 'Conakry → Labé',
        itineraire: 'Coyah · Kindia · Mamou · Dalaba · Pita',
        distance: '~440 km',
        duree: '7 à 9 h',
        tarif: '160 000 – 200 000 GNF',
        points: [
            'L’axe bitumé du Fouta Djallon, le plus fréquenté vers la Moyenne Guinée',
            'Prudence sur les hauteurs de Dalaba (brouillard fréquent au petit matin)',
            'Correspondances à Labé vers Mali, Lélouma, Tougué et Koundara'
        ]
    },
    {
        titre: 'Conakry → Kankan',
        itineraire: 'Coyah · Kindia · Mamou · Dabola · Kouroussa',
        distance: '~660 km',
        duree: '10 à 12 h',
        tarif: '~200 000 GNF',
        points: [
            'La porte d’entrée de la Haute Guinée, prolongement possible vers Siguiri (~140 km)',
            'Départs tôt le matin depuis les gares routières de Matam et Madina',
            'Trajet long : prévoyez eau, encas et petites coupures'
        ]
    }
];

export interface ConseilPratique {
    icone: string; // classe PrimeIcons
    titre: string;
    texte: string;
}

export const CONSEILS_PRATIQUES: ConseilPratique[] = [
    {
        icone: 'pi-map-marker',
        titre: 'Départ des gares routières',
        texte: 'À Conakry, les véhicules interurbains partent principalement des gares de Madina et Matam. Un taxi-brousse classique ne démarre que lorsque toutes les places sont vendues : arrivez avant 7 h pour partir dans la matinée. Les offres publiées sur SYNERGIA ont un horaire planifié et des places réservées — pas d’attente de remplissage.'
    },
    {
        icone: 'pi-briefcase',
        titre: 'Bagages',
        texte: 'Demandez toujours si le prix inclut le chargement des bagages avant de payer. Sur SYNERGIA, le supplément bagages du trajet est affiché sur l’offre — pas de surprise au moment du départ.'
    },
    {
        icone: 'pi-user',
        titre: 'Place à l’avant',
        texte: 'La place à côté du chauffeur est plus confortable et coûte souvent un supplément (20 000 à 50 000 GNF sur les longs trajets). Précisez votre préférence au moment de la réservation.'
    },
    {
        icone: 'pi-cloud',
        titre: 'Saison des pluies (juin – octobre)',
        texte: 'Les durées s’allongent nettement, surtout vers la Guinée Forestière (tronçon Kissidougou – Nzérékoré). Ajoutez une marge d’une demi-journée à votre planning et évitez de rouler de nuit.'
    },
    {
        icone: 'pi-wallet',
        titre: 'Sur la route',
        texte: 'Prévoyez de l’eau, de quoi manger et du liquide en petites coupures. Gardez vos papiers d’identité accessibles pour les postes de contrôle.'
    },
    {
        icone: 'pi-calendar',
        titre: 'Périodes de fêtes',
        texte: 'À l’approche des fêtes, les prix grimpent et les véhicules se remplissent vite : réservez plusieurs jours à l’avance pour garantir votre place.'
    }
];

/** Sites (gares), points de départ/arrivée et trajets — référentiel transport. */

export interface Site {
    siteId?: number;
    siteUuid?: string;
    localisationId?: number;
    nom: string;
    description?: string;
    typeSite?: string;
    capaciteVehicules?: number;
    telephone?: string;
    email?: string;
    horaireOuverture?: string;
    horaireFermeture?: string;
    imageUrl?: string;
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;

    // Jointures Localisation + hiérarchie géographique
    localisationUuid?: string;
    adresseComplete?: string;
    latitude?: number;
    longitude?: number;
    quartierUuid?: string;
    quartierLibelle?: string;
    communeUuid?: string;
    communeLibelle?: string;
    villeUuid?: string;
    villeLibelle?: string;
    regionUuid?: string;
    regionLibelle?: string;
}

export interface SiteRequest {
    localisationUuid: string;
    /** V35 : ville directe du site — obligatoire à la création. */
    villeUuid?: string;
    nom: string;
    description?: string;
    typeSite?: string;
    capaciteVehicules?: number;
    telephone?: string;
    email?: string;
    horaireOuverture?: string;
    horaireFermeture?: string;
    imageUrl?: string;
    actif?: boolean;
}

export const TYPE_SITES = [
    { label: 'Gare Routière', value: 'GARE_ROUTIERE' },
    { label: 'Aéroport', value: 'AEROPORT' },
    { label: 'Port', value: 'PORT' },
    { label: 'Gare Ferroviaire', value: 'GARE_FERROVIAIRE' },
    { label: 'Station', value: 'STATION' },
    { label: 'Arrêt', value: 'ARRET' },
    { label: 'Autre', value: 'AUTRE' }
] as const;

export interface Depart {
    departId?: number;
    departUuid?: string;
    siteId?: number;
    libelle: string;
    description?: string;
    ordreAffichage?: number;
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;

    siteUuid?: string;
    siteNom?: string;
    siteTypeSite?: string;
    localisationUuid?: string;
    adresseComplete?: string;
    latitude?: number;
    longitude?: number;
    quartierLibelle?: string;
    communeLibelle?: string;
    villeUuid?: string;
    villeLibelle?: string;
    regionLibelle?: string;
}

export interface DepartRequest {
    siteUuid: string;
    libelle: string;
    description?: string;
    ordreAffichage?: number;
    actif?: boolean;
}

export interface Arrivee {
    arriveeId?: number;
    arriveeUuid?: string;
    siteId?: number;
    departId?: number;
    libelle: string;
    libelleDepart?: string;
    description?: string;
    ordreAffichage?: number;
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;

    // Site d'arrivée + sa localisation/hiérarchie
    siteUuid?: string;
    siteNom?: string;
    siteTypeSite?: string;
    localisationUuid?: string;
    adresseComplete?: string;
    latitude?: number;
    longitude?: number;
    quartierLibelle?: string;
    communeLibelle?: string;
    villeUuid?: string;
    villeLibelle?: string;
    regionLibelle?: string;

    // Départ lié
    departUuid?: string;
    departLibelle?: string;
    departSiteUuid?: string;
    departSiteNom?: string;
    departVilleUuid?: string;
    departVilleLibelle?: string;
    departAdresseComplete?: string;
    departLatitude?: number;
    departLongitude?: number;
}

export interface ArriveeRequest {
    siteUuid: string;
    departUuid: string;
    libelle: string;
    libelleDepart?: string;
    description?: string;
    ordreAffichage?: number;
    actif?: boolean;
}

export interface Trajet {
    trajetId?: number;
    trajetUuid?: string;
    departId?: number;
    arriveeId?: number;
    userId?: number;
    libelleTrajet?: string;
    description?: string;
    instructions?: string;
    distanceKm?: number;
    dureeEstimeeMinutes?: number;
    montantBase?: number;
    montantBagages?: number;
    devise?: string;
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;

    departUuid?: string;
    departLibelle?: string;
    departSiteId?: number;
    departSiteUuid?: string;
    departSiteNom?: string;
    departAdresseComplete?: string;
    departLatitude?: number;
    departLongitude?: number;
    departVilleUuid?: string;
    departVilleLibelle?: string;
    departRegionLibelle?: string;

    arriveeUuid?: string;
    arriveeLibelle?: string;
    arriveeSiteId?: number;
    arriveeSiteUuid?: string;
    arriveeSiteNom?: string;
    arriveeAdresseComplete?: string;
    arriveeLatitude?: number;
    arriveeLongitude?: number;
    arriveeVilleUuid?: string;
    arriveeVilleLibelle?: string;
    arriveeRegionLibelle?: string;

    userUuid?: string;
    userUsername?: string;
    userFullName?: string;
}

export interface TrajetRequest {
    departUuid: string;
    arriveeUuid: string;
    libelleTrajet?: string;
    description?: string;
    distanceKm?: number;
    dureeEstimeeMinutes?: number;
    montantBase?: number;
    montantBagages?: number;
    devise?: string;
    actif?: boolean;
}

export const DEVISES = [
    { label: 'Franc Guinéen (GNF)', value: 'GNF' },
    { label: 'Dollar US (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' },
    { label: 'Franc CFA (XOF)', value: 'XOF' }
] as const;

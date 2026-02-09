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

    // Champs joints depuis Localisation
    localisationUuid?: string;
    adresseComplete?: string;
    latitude?: number;
    longitude?: number;

    // Champs joints depuis la hiérarchie géographique
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
];

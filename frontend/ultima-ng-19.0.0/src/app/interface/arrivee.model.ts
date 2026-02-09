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

    // Champs joints depuis Site (arrivée)
    siteUuid?: string;
    siteNom?: string;
    siteTypeSite?: string;

    // Champs joints depuis Localisation du Site d'arrivée
    localisationUuid?: string;
    adresseComplete?: string;
    latitude?: number;
    longitude?: number;

    // Hiérarchie du site d'arrivée
    quartierLibelle?: string;
    communeLibelle?: string;
    villeUuid?: string;
    villeLibelle?: string;
    regionLibelle?: string;

    // Champs joints depuis Depart
    departUuid?: string;
    departLibelle?: string;

    // Champs joints depuis Site du départ
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

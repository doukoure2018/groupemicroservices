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

    // Champs joints depuis Site
    siteUuid?: string;
    siteNom?: string;
    siteTypeSite?: string;

    // Champs joints depuis Localisation (via Site)
    localisationUuid?: string;
    adresseComplete?: string;
    latitude?: number;
    longitude?: number;

    // Champs joints depuis la hiérarchie géographique
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

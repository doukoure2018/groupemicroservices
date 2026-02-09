export interface ILocalisation {
    localisationId: number;
    localisationUuid: string;
    adresseComplete: string;
    latitude: number | null;
    longitude: number | null;
    description: string | null;
    quartierId: number | null;
    quartierUuid: string | null;
    quartierLibelle: string | null;
    communeUuid: string | null;
    communeLibelle: string | null;
    villeUuid: string | null;
    villeLibelle: string | null;
    regionUuid: string | null;
    regionLibelle: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface ILocalisationCreateRequest {
    quartierUuid?: string | null;
    adresseComplete: string;
    latitude?: number | null;
    longitude?: number | null;
    description?: string | null;
}

export interface ILocalisationUpdateRequest {
    quartierUuid?: string | null;
    removeQuartier?: boolean;
    adresseComplete: string;
    latitude?: number | null;
    longitude?: number | null;
    description?: string | null;
}

// Pour OpenStreetMap/Nominatim Autocomplete
export interface IPlacePrediction {
    placeId: string;
    description: string;
    latitude?: number;
    longitude?: number;
    type?: string;
    category?: string;
    // Champs spécifiques Guinée
    quartier?: string;
    commune?: string;
    ville?: string;
    region?: string;
}

export interface IPlaceDetails {
    address: string;
    latitude: number;
    longitude: number;
}

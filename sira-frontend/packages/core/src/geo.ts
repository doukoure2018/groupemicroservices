export interface Region {
    regionId: number;
    regionUuid: string;
    libelle: string;
    code: string;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RegionCreateRequest {
    libelle: string;
    code?: string;
}
export type RegionUpdateRequest = RegionCreateRequest;

export interface Ville {
    villeId: number;
    villeUuid: string;
    libelle: string;
    codePostal: string;
    actif: boolean;
    regionId: number;
    regionUuid: string;
    regionLibelle: string;
    createdAt: string;
    updatedAt: string;
}

export interface VilleCreateRequest {
    regionUuid: string;
    libelle: string;
    codePostal?: string;
}
export interface VilleUpdateRequest {
    libelle: string;
    codePostal?: string;
    regionUuid?: string;
}

export interface Commune {
    communeId: number;
    communeUuid: string;
    libelle: string;
    actif: boolean;
    villeId: number;
    villeUuid: string;
    villeLibelle: string;
    regionUuid: string;
    regionLibelle: string;
    createdAt: string;
    updatedAt: string;
}

export interface CommuneCreateRequest {
    villeUuid: string;
    libelle: string;
}
export interface CommuneUpdateRequest {
    libelle: string;
    villeUuid?: string;
}

export interface Quartier {
    quartierId: number;
    quartierUuid: string;
    libelle: string;
    actif: boolean;
    communeId: number;
    communeUuid: string;
    communeLibelle: string;
    villeUuid: string;
    villeLibelle: string;
    regionUuid: string;
    regionLibelle: string;
    createdAt: string;
    updatedAt: string;
}

export interface QuartierCreateRequest {
    communeUuid: string;
    libelle: string;
}
export interface QuartierUpdateRequest {
    libelle: string;
    communeUuid?: string;
}

export interface Localisation {
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
    createdAt: string;
    updatedAt: string;
}

export interface LocalisationCreateRequest {
    quartierUuid?: string | null;
    adresseComplete: string;
    latitude?: number | null;
    longitude?: number | null;
    description?: string | null;
}
export interface LocalisationUpdateRequest extends LocalisationCreateRequest {
    removeQuartier?: boolean;
}

/** Autocomplete OpenStreetMap/Nominatim (proxy `/billetterie/osm`). */
export interface PlacePrediction {
    placeId: string;
    description: string;
    latitude?: number;
    longitude?: number;
    type?: string;
    category?: string;
    quartier?: string;
    commune?: string;
    ville?: string;
    region?: string;
}

export interface PlaceDetails {
    address: string;
    latitude: number;
    longitude: number;
}

/**
 * Libellé lisible d'une localisation pour les listes déroulantes (partenaires, sites).
 * Cascade : adresse complète, sinon quartier/commune/ville, sinon repli technique sur l'uuid.
 */
export function getLocalisationLabel(loc: Pick<Localisation, 'adresseComplete' | 'quartierLibelle' | 'communeLibelle' | 'villeLibelle' | 'localisationUuid'>): string {
    if (loc.adresseComplete) return loc.adresseComplete;
    const parts = [loc.quartierLibelle, loc.communeLibelle, loc.villeLibelle].filter(Boolean);
    if (parts.length) return parts.join(', ');
    return `Loc. ${(loc.localisationUuid ?? '').slice(0, 8)}`;
}

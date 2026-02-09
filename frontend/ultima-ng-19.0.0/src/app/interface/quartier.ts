export interface IQuartier {
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
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IQuartierCreateRequest {
    communeUuid: string;
    libelle: string;
}

export interface IQuartierUpdateRequest {
    libelle: string;
    communeUuid?: string;
}

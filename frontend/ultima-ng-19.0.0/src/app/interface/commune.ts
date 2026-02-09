export interface ICommune {
    communeId: number;
    communeUuid: string;
    libelle: string;
    actif: boolean;
    villeId: number;
    villeUuid: string;
    villeLibelle: string;
    regionUuid: string;
    regionLibelle: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface ICommuneCreateRequest {
    villeUuid: string;
    libelle: string;
}

export interface ICommuneUpdateRequest {
    libelle: string;
    villeUuid?: string;
}

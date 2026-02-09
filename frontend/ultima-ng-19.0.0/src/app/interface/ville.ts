export interface IVille {
    villeId: number;
    villeUuid: string;
    libelle: string;
    codePostal: string;
    actif: boolean;
    regionId: number;
    regionUuid: string;
    regionLibelle: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IVilleCreateRequest {
    regionUuid: string;
    libelle: string;
    codePostal?: string;
}

export interface IVilleUpdateRequest {
    libelle: string;
    codePostal?: string;
    regionUuid?: string;
}

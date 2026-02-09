export interface IRegion {
    regionId: number;
    regionUuid: string;
    libelle: string;
    code: string;
    actif: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IRegionCreateRequest {
    libelle: string;
    code?: string;
}

export interface IRegionUpdateRequest {
    libelle: string;
    code?: string;
}

export interface IRegionStatusRequest {
    actif: boolean;
}

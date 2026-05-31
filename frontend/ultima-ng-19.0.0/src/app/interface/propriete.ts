export interface IPhoto {
    photoId: number;
    photoUuid: string;
    url: string;
    urlThumbnail: string;
    ordre: number;
    couverture: boolean;
}

export interface ICommodite {
    commoditeId: number;
    code: string;
    libelle: string;
    categorie: string;
    icone: string;
}

export interface IPropriete {
    proprieteId: number;
    proprieteUuid: string;
    reference: string;
    profilId: number;
    agenceId: number | null;
    typeAnnonce: 'VENTE' | 'LOCATION';
    dureeLocation: string | null;
    titre: string;
    description: string;
    prix: number;
    devise: string;
    periode: string | null;
    prixSurDemande: boolean;
    prixNegociable: boolean;
    nombreChambres: number | null;
    nombreSallesBain: number | null;
    surfaceM2: number | null;
    adresseComplete: string | null;
    latitude: number | null;
    longitude: number | null;
    statut: string;
    datePublication: string | null;
    dateExpiration: string | null;
    motifRejet: string | null;
    nomContactPublic: string;
    telephoneContact: string;
    nombreVues: number;
    nombreFavoris: number;
    nombreContacts: number;
    photos: IPhoto[];
    commodites: ICommodite[];
    photoCouverture: IPhoto | null;
    createdAt: string;
    updatedAt: string;
}

export interface IRejeterRequest {
    motif: string;
}

export interface IVendeur {
    profilId?: number;
    profilUuid?: string;
    typeProfil?: string;
    statutVerification?: string;
    noteMoyenne?: number;
    nombreAvis?: number;
    nombreProprietesActives?: number;
    bio?: string;
    telephoneContactProfil?: string;
    userId?: number;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    email?: string;
    userLookupError?: boolean;
}

export interface IProprieteDetail {
    propriete: IPropriete;
    vendeur: IVendeur;
}

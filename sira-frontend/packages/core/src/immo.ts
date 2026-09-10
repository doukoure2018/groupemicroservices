/** Domaine immobilier (immobilierservice, routes /immo). */

export interface Photo {
    photoId: number;
    photoUuid: string;
    url: string;
    urlThumbnail: string;
    ordre: number;
    couverture: boolean;
}

export interface Commodite {
    commoditeId: number;
    code: string;
    libelle: string;
    categorie: string;
    icone: string;
}

export interface TypeBien {
    typeBienId?: number;
    code?: string;
    libelle?: string;
    categorie?: string;
}

export type TypeAnnonce = 'VENTE' | 'LOCATION';

export interface Propriete {
    proprieteId: number;
    proprieteUuid: string;
    reference: string;
    profilId: number;
    agenceId: number | null;
    typeAnnonce: TypeAnnonce;
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
    photos: Photo[];
    commodites: Commodite[];
    photoCouverture: Photo | null;
    createdAt: string;
    updatedAt: string;
}

export interface Vendeur {
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

export interface ProprieteDetail {
    propriete: Propriete;
    vendeur: Vendeur;
}

export interface RechercheProprietesParams {
    typeAnnonce?: TypeAnnonce;
    typeBienCode?: string;
    villeLibelle?: string;
    prixMin?: number;
    prixMax?: number;
    nombreChambresMin?: number;
    surfaceMin?: number;
    commodites?: string[];
    latitude?: number;
    longitude?: number;
    rayonKm?: number;
    tri?: string;
    limit?: number;
    offset?: number;
    q?: string;
}

// ---- Leads back-office (intermédiation) ----

export interface LeadContact {
    contactId: number;
    contactUuid: string;
    proprieteId: number;
    demandeurUserId: number;
    nomDemandeur: string;
    telephoneDemandeur: string;
    emailDemandeur: string;
    message: string;
    typeDemande: string;
    statut: string;
    vuParVendeur: boolean;
    createdAt: string;
    leadStatut: string;
    noteAdmin: string | null;
    traitePar: number | null;
    traiteAt: string | null;
}

export interface LeadVisite {
    visiteId: number;
    visiteUuid: string;
    proprieteId: number;
    visiteurUserId: number;
    dateVisite: string;
    heureVisite: string | null;
    statut: string;
    notesVisiteur: string | null;
    notesVendeur: string | null;
    motifAnnulation: string | null;
    createdAt: string;
    updatedAt: string;
    leadStatut: string;
    noteAdmin: string | null;
    traitePar: number | null;
    traiteAt: string | null;
}

export interface LeadContactView {
    contact: LeadContact;
    proprieteUuid: string;
    proprieteReference: string;
    proprieteTitre: string;
}

export interface LeadVisiteView {
    visite: LeadVisite;
    proprieteUuid: string;
    proprieteReference: string;
    proprieteTitre: string;
}

export interface TraiterLeadRequest {
    action: 'TRAITE' | 'REJETE';
    noteAdmin?: string;
}

export interface Proprietaire {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    address: string;
    typeProfil: string;
}

export interface RejeterRequest {
    motif: string;
}

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

// ---------------------------------------------------------------------------
// Agences : onboarding (V31), back-office admin et conformité
// ---------------------------------------------------------------------------

/** Cycle de vie d'un dossier d'agence, du profil incomplet à la validation. */
export type StatutVerificationAgence = 'PROFIL_INCOMPLET' | 'EN_ATTENTE' | 'EN_VALIDATION' | 'VERIFIE' | 'REJETE';

export interface AgenceOnboarding {
    agenceId?: number;
    agenceUuid?: string;
    nom?: string;
    raisonSociale?: string;
    numeroRegistre?: string;
    logoUrl?: string;
    telephone?: string;
    email?: string;
    localisationId?: number;
    description?: string;
    siteWeb?: string;
    proprietaireUserId?: number;
    statutVerification?: StatutVerificationAgence | string;
    documentsKycUrl?: string;
    dateCreationAgence?: string;
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;

    // Champs d'onboarding conformité (V31)
    adresse?: string;
    communeId?: number;
    regionId?: number;
    telephoneWhatsapp?: string;
    motifRejet?: string;
    dateSoumissionConformite?: string;
}

export interface AgenceOnboardingRequest {
    nom: string;
    raisonSociale?: string;
    numeroRegistre: string;
    adresse: string;
    communeId: number;
    regionId: number;
    email: string;
    telephone: string;
    telephoneWhatsapp?: string;
    description?: string;
    [k: string]: unknown;
}

/** Agence enrichie de ses compteurs, écran admin « Agences ». */
export interface AgenceAdmin extends AgenceOnboarding {
    communeLibelle?: string;
    regionLibelle?: string;
    nbAnnoncesTotal?: number;
    nbAnnoncesPubliees?: number;
    nbAgents?: number;
    representantNom?: string;
}

/** Agent rattaché à une agence (profil immobilier). */
export interface AgenceAgent {
    profilId?: number;
    profilUuid?: string;
    userId?: number;
    typeProfil?: string;
    agenceId?: number;
    statutVerification?: string;
    bio?: string;
    telephoneContact?: string;
    noteMoyenne?: number;
    nombreAvis?: number;
    nombreProprietesActives?: number;
    actif?: boolean;
}

/** Annonce listée dans le détail d'activité d'une agence. */
export type AgenceAnnonce = Propriete;

export const STATUTS_AGENCE: { label: string; value: StatutVerificationAgence }[] = [
    { label: 'Profil incomplet', value: 'PROFIL_INCOMPLET' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'En validation', value: 'EN_VALIDATION' },
    { label: 'Vérifiée', value: 'VERIFIE' },
    { label: 'Rejetée', value: 'REJETE' }
];

export function getStatutAgenceLabel(statut: string | undefined): string {
    return STATUTS_AGENCE.find((s) => s.value === statut)?.label ?? statut ?? 'Inconnu';
}

export function getStatutAgenceSeverity(statut: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (statut) {
        case 'VERIFIE':
            return 'success';
        case 'EN_VALIDATION':
            return 'info';
        case 'EN_ATTENTE':
            return 'warn';
        case 'REJETE':
            return 'danger';
        default:
            return 'secondary';
    }
}

// ---------------------------------------------------------------------------
// Déclarations de besoin (V32/V34) — demandes clients vues par les agences
// ---------------------------------------------------------------------------

export interface DemandeBesoin {
    demandeId?: number;
    demandeUuid?: string;
    /** Référence lisible au format DEM-AAAAMMJJ-XXXX. */
    reference?: string;
    userId?: number;
    typeAnnonce?: string;
    typeBienId?: number;
    communeId?: number;
    /** Saisie libre quand la commune n'est pas au référentiel (V34). */
    communeTexte?: string;
    quartierId?: number;
    quartierTexte?: string;
    budgetMin?: number;
    budgetMax?: number;
    devise?: string;
    nbChambresMin?: number;
    description?: string;
    contactTelephone?: string;
    contactWhatsapp?: string;
    statut?: string;
    createdAt?: string;
    updatedAt?: string;

    // Jointures référentiel, lecture seule
    communeLibelle?: string;
    quartierLibelle?: string;
    typeBienLibelle?: string;
    regionId?: number;
    regionLibelle?: string;
}

/** Zone de diffusion consultée par une agence. */
export type ScopeDemandes = 'ZONE' | 'TOUTES';

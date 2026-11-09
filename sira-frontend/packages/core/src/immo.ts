/** Domaine immobilier (immobilierservice, routes /immo). */

export interface Photo {
    photoId: number;
    photoUuid: string;
    url: string;
    urlThumbnail: string;
    ordreAffichage?: number;
    estCouverture?: boolean;
}

export interface Commodite {
    commoditeId: number;
    commoditeUuid?: string;
    code: string;
    libelle: string;
    categorie?: string;
    icone?: string;
    ordreAffichage?: number;
    actif?: boolean;
}

export interface TypeBien {
    typeBienId?: number;
    typeBienUuid?: string;
    code?: string;
    libelle?: string;
    description?: string;
    icone?: string;
    ordreAffichage?: number;
    actif?: boolean;
}

export type TypeAnnonce = 'VENTE' | 'LOCATION';
export type DureeLocation = 'COURT_SEJOUR' | 'LONG_SEJOUR';

/** « 4 500 000 GNF / mois » : le prix tel qu'il se dit, période comprise. */
export function libellePeriode(periode: string | null | undefined): string | null {
    if (!periode) return null;
    return { PAR_MOIS: '/ mois', PAR_AN: '/ an', PAR_JOUR: '/ jour', PAR_NUIT: '/ nuit', UNIQUE: null }[periode] ?? null;
}

/** Ce qui se dit d'un bien en une ligne : « 85 m² · 2 chambres · 1 salle de bain ». */
export function resumeBien(p: Pick<Propriete, 'surfaceM2' | 'nombreChambres' | 'nombreSallesBain'>): string {
    const bouts: string[] = [];
    if (p.surfaceM2) bouts.push(`${p.surfaceM2} m²`);
    if (p.nombreChambres) bouts.push(`${p.nombreChambres} chambre${p.nombreChambres > 1 ? 's' : ''}`);
    if (p.nombreSallesBain) bouts.push(`${p.nombreSallesBain} salle${p.nombreSallesBain > 1 ? 's' : ''} de bain`);
    return bouts.join(' · ');
}

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
    typeBienId?: number | null;
    typeBien?: TypeBien | null;
    nombreChambres: number | null;
    nombreSallesBain: number | null;
    surfaceM2: number | null;
    nombreEtages?: number | null;
    etageSituation?: number | null;
    anneeConstruction?: number | null;
    /** Location : ce que le locataire avance à l'entrée, en mois de loyer. */
    moisCaution?: number | null;
    moisAvance?: number | null;
    moisHonoraire?: number | null;
    dateDisponibilite?: string | number[] | null;
    localisationId?: number | null;
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
    premium?: boolean;
    /** Distance au point de recherche, en mètres, quand la recherche est géolocalisée. */
    distanceM?: number | null;
    /** Renseigné seulement si la recherche est faite avec un jeton ; null sinon. */
    isFavorite?: boolean | null;
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

/**
 * Critères de `GET /immo/proprietes/recherche`. Les noms sont ceux que le
 * serveur attend, au caractère près : les listes sont répétées en paramètres
 * (`typeBienCodes=MAISON&typeBienCodes=VILLA`), la ville se désigne par son
 * identifiant et non par son nom, et le tri s'appelle « trier ».
 */
export interface RechercheProprietesParams {
    typeAnnonce?: TypeAnnonce;
    dureeLocation?: DureeLocation;
    typeBienCodes?: string[];
    villeUuid?: string;
    communeUuid?: string;
    quartierUuid?: string;
    prixMin?: number;
    prixMax?: number;
    devise?: string;
    chambresMin?: number;
    surfaceMin?: number;
    commoditesCodes?: string[];
    q?: string;
    lat?: number;
    lng?: number;
    rayonKm?: number;
    trier?: TriProprietes;
    limit?: number;
    offset?: number;
}

/** Les valeurs que `trier` accepte côté serveur ; toute autre est refusée en 400. */
export type TriProprietes = 'DATE_DESC' | 'PRIX_ASC' | 'PRIX_DESC' | 'PERTINENCE' | 'DISTANCE_ASC';

/** Les tris proposés au client ; « pertinence » et « distance » supposent une recherche textuelle ou géolocalisée. */
export const TRIS_PROPRIETES: { valeur: TriProprietes; libelle: string }[] = [
    { valeur: 'DATE_DESC', libelle: 'Les plus récents' },
    { valeur: 'PRIX_ASC', libelle: 'Prix croissant' },
    { valeur: 'PRIX_DESC', libelle: 'Prix décroissant' }
];

// ---- Entrer en relation : contacter, visiter, signaler, déclarer un besoin ----

/** Ce que le demandeur veut en écrivant : un renseignement, une visite, une offre. */
export type TypeDemandeContact = 'INFO' | 'VISITE' | 'OFFRE';
export const TYPES_DEMANDE_CONTACT: { valeur: TypeDemandeContact; libelle: string }[] = [
    { valeur: 'INFO', libelle: 'Un renseignement' },
    { valeur: 'VISITE', libelle: 'Une visite' },
    { valeur: 'OFFRE', libelle: 'Une offre' }
];

/** `POST /immo/proprietes/{uuid}/contact`. Le serveur prend nom, téléphone et email dans le jeton : rien à envoyer. */
export interface ContactCreateRequest {
    message: string;
    typeDemande?: TypeDemandeContact;
}

/** `POST /immo/proprietes/{uuid}/visites`. La date est un jour civil AAAA-MM-JJ, aujourd'hui ou plus tard ; l'heure « HH:mm ». */
export interface VisiteCreateRequest {
    dateVisite: string;
    heureVisite?: string;
    notesVisiteur?: string;
}

export type MotifSignalement = 'FAUX' | 'INAPPROPRIE' | 'DEJA_VENDU' | 'ARNAQUE' | 'AUTRE';
export const MOTIFS_SIGNALEMENT: { valeur: MotifSignalement; libelle: string }[] = [
    { valeur: 'DEJA_VENDU', libelle: 'Déjà vendu ou loué' },
    { valeur: 'FAUX', libelle: 'Annonce fausse' },
    { valeur: 'ARNAQUE', libelle: 'Tentative d’arnaque' },
    { valeur: 'INAPPROPRIE', libelle: 'Contenu inapproprié' },
    { valeur: 'AUTRE', libelle: 'Autre chose' }
];

/** `POST /immo/proprietes/{uuid}/signaler`. */
export interface SignalementCreateRequest {
    motif: MotifSignalement;
    description?: string;
}

/**
 * `POST /immo/demandes` : un besoin déclaré, diffusé aux agences de la zone.
 * Attention, ici « acheter » se dit `ACHAT`, pas `VENTE` comme sur une annonce.
 */
export interface DemandeCreateRequest {
    typeAnnonce: 'LOCATION' | 'ACHAT';
    typeBienId?: number;
    communeId?: number;
    /** Saisie libre quand la commune n'est pas au référentiel. */
    communeTexte?: string;
    quartierId?: number;
    quartierTexte?: string;
    budgetMin?: number;
    budgetMax?: number;
    devise?: string;
    nbChambresMin?: number;
    commoditeIds?: number[];
    description?: string;
    contactTelephone?: string;
    contactWhatsapp?: string;
}

/** Statuts tels que le serveur les écrit, et comment on les dit au client. */
export function libelleStatutVisite(statut: string | null | undefined): string {
    return { DEMANDEE: 'En attente', CONFIRMEE: 'Confirmée', EFFECTUEE: 'Effectuée', ANNULEE: 'Annulée' }[statut ?? ''] ?? statut ?? '';
}
export function libelleStatutContact(statut: string | null | undefined): string {
    return { NOUVEAU: 'Envoyé', TRAITE: 'Répondu', CLOS: 'Clos' }[statut ?? ''] ?? statut ?? '';
}
export function libelleStatutBesoin(statut: string | null | undefined): string {
    return { ACTIVE: 'En cours', POURVUE: 'Pourvue', ANNULEE: 'Annulée', EXPIREE: 'Expirée' }[statut ?? ''] ?? statut ?? '';
}

// ---- Publier : profil, brouillon par étapes, cycle de vie d'une annonce ----

export type TypeProfilImmo = 'PROPRIETAIRE_SIMPLE' | 'DEMARCHEUR' | 'AGENT_AGENCE';
/** Les deux profils qu'un particulier peut se donner seul ; l'agent d'agence passe par l'invitation de son agence. */
export const TYPES_PROFIL_IMMO: { valeur: TypeProfilImmo; libelle: string; aide: string }[] = [
    { valeur: 'PROPRIETAIRE_SIMPLE', libelle: 'Je loue ou je vends mon bien', aide: 'Un particulier, pour un ou quelques biens à lui.' },
    { valeur: 'DEMARCHEUR', libelle: 'Je suis démarcheur', aide: 'Vous proposez des biens pour le compte d’autres personnes.' }
];

/** Le profil immobilier d'un utilisateur : qui publie, et s'il a été vérifié. */
export interface ProfilImmo {
    profilId?: number;
    profilUuid: string;
    userId?: number;
    typeProfil: TypeProfilImmo;
    agenceId?: number | null;
    statutVerification: 'EN_ATTENTE' | 'VERIFIE' | 'REJETE';
    documentsKycUrl?: string | null;
    bio?: string | null;
    telephoneContact?: string | null;
    noteMoyenne?: number | null;
    nombreAvis?: number;
    nombreProprietesActives?: number;
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
export interface ProfilImmoRequest {
    typeProfil: TypeProfilImmo;
    agenceUuid?: string;
    documentsKycUrl?: string;
    bio?: string;
    telephoneContact?: string;
}

/**
 * Le contenu d'un brouillon d'annonce, organisé par étapes exactement comme
 * le serveur le relit pour créer l'annonce (`BrouillonServiceImpl`) : les
 * clés et leur étape ne se choisissent pas côté client.
 */
export interface DonneesBrouillon {
    etape1?: { typeAnnonce?: TypeAnnonce; dureeLocation?: DureeLocation; typeBienCode?: string };
    etape2?: { localisationUuid?: string; adresseComplete?: string; latitude?: number; longitude?: number; afficherAdresseExacte?: boolean };
    etape3?: {
        prix?: number;
        devise?: string;
        periode?: PeriodePrix;
        prixSurDemande?: boolean;
        prixNegociable?: boolean;
        nombreChambres?: number;
        nombreSallesBain?: number;
        surfaceM2?: number;
        nombreEtages?: number;
        etageSituation?: number;
        anneeConstruction?: number;
        moisCaution?: number;
        moisAvance?: number;
        moisHonoraire?: number;
        /** AAAA-MM-JJ. */
        dateDisponibilite?: string;
        commoditesCodes?: string[];
    };
    etape4?: { titre?: string; description?: string; nomContactPublic?: string; telephoneContact?: string };
}
export interface Brouillon {
    brouillonId?: number;
    brouillonUuid: string;
    userId?: number;
    donneesJson: DonneesBrouillon;
    etapeActuelle: number;
    /** Renseigné une fois le brouillon transformé en annonce. */
    proprieteId?: number | null;
    derniereModification?: string;
    createdAt?: string;
}
export interface BrouillonSaveRequest {
    etapeActuelle: number;
    donneesJson: DonneesBrouillon;
}

export type PeriodePrix = 'PAR_MOIS' | 'PAR_AN' | 'UNIQUE';
export const PERIODES_PRIX: { valeur: PeriodePrix; libelle: string }[] = [
    { valeur: 'PAR_MOIS', libelle: 'Par mois' },
    { valeur: 'PAR_AN', libelle: 'Par an' },
    { valeur: 'UNIQUE', libelle: 'Prix total' }
];

/** Statuts d'une annonce tels que le serveur les écrit, et comment on les dit au publieur. */
export function libelleStatutAnnonce(statut: string | null | undefined): string {
    return (
        {
            BROUILLON: 'Brouillon',
            EN_ATTENTE_VALIDATION: 'En attente de validation',
            PUBLIE: 'Publiée',
            RESERVE: 'Réservée',
            RETIRE: 'Retirée',
            VENDU: 'Vendue',
            LOUE: 'Louée',
            REJETE: 'Refusée',
            EXPIRE: 'Expirée'
        }[statut ?? ''] ?? statut ?? ''
    );
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

/** Ce que l'utilisateur accepte de recevoir par SMS côté logement ; miroir de `PreferencesNotification` d'immobilierservice. */
export interface PreferencesNotificationImmo {
    /** Quand quelqu'un écrit au sujet d'un bien que l'utilisateur a publié. */
    contactSms: boolean;
    /** Quand une visite demandée est confirmée. */
    visiteConfirmeeSms: boolean;
}

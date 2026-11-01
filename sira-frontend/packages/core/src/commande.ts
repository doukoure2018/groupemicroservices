import type { HeureLocale } from './format.js';

/** Commande de voyage (réservation) — miroir du domaine billetterieservice. */

export type StatutCommande = 'EN_ATTENTE' | 'PAYEE' | 'CONFIRMEE' | 'ANNULEE' | 'UTILISEE' | 'REMBOURSEE' | string;

export const STATUTS_COMMANDE: { label: string; value: StatutCommande }[] = [
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Payée', value: 'PAYEE' },
    { label: 'Confirmée', value: 'CONFIRMEE' },
    { label: 'Annulée', value: 'ANNULEE' },
    { label: 'Utilisée', value: 'UTILISEE' },
    { label: 'Remboursée', value: 'REMBOURSEE' }
];

export function getStatutCommandeLabel(statut: string | undefined): string {
    const found = STATUTS_COMMANDE.find((s) => s.value === statut);
    return found ? found.label : statut || 'Inconnu';
}

export function getStatutCommandeSeverity(statut: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (statut) {
        case 'PAYEE':
        case 'CONFIRMEE':
            return 'success';
        case 'EN_ATTENTE':
            return 'warn';
        case 'UTILISEE':
            return 'info';
        case 'ANNULEE':
            return 'danger';
        case 'REMBOURSEE':
            return 'secondary';
        default:
            return 'info';
    }
}

/** L'UI ne propose l'annulation que sur ces statuts — le backend reste le juge final. */
export function isCommandeAnnulable(statut: string | undefined): boolean {
    return statut === 'EN_ATTENTE' || statut === 'PAYEE' || statut === 'CONFIRMEE';
}

export type TypePassager = 'ADULTE' | 'ENFANT';

export interface BilletClient {
    billetUuid?: string;
    codeBillet?: string;
    numeroSiege?: string;
    nomPassager?: string;
    telephonePassager?: string;
    pieceIdentite?: string;
    typePassager?: TypePassager | string;
    dateNaissance?: string;
    /** Ce que ce billet a coûté dans la commande. */
    montant?: number;
    statut?: string;
    qrCodeData?: string;
}

/** Billet tel que le serveur le renvoie après validation à l'embarquement. */
export interface BilletValide extends BilletClient {
    billetId?: number;
    commandeId?: number;
    dateValidation?: string;
    createdAt?: string;
}

export interface CommandeClient {
    commandeUuid?: string;
    numeroCommande?: string;
    statut?: StatutCommande;
    nombrePlaces?: number;
    nombreAdultes?: number;
    nombreEnfants?: number;
    nombreBagages?: number;
    montantBagages?: number;
    /** Frais de service de la commande. */
    montantFrais?: number;
    montantTotal?: number;
    /** Total réellement réglé : total + frais du mode de règlement. */
    montantPaye?: number;
    devise?: string;
    contactEmail?: string;
    contactTelephone?: string;
    /** Instant où une commande en attente sera abandonnée faute de paiement ; vide sinon. */
    expireLe?: string;
    referencePaiement?: string;
    /** Lien du prestataire, présent uniquement tant qu'un paiement en ligne reste à faire. */
    urlPaiement?: string;
    createdAt?: string;

    // Offre / trajet joints
    offreUuid?: string;
    dateDepart?: string;
    heureDepart?: HeureLocale;
    villeDepartLibelle?: string;
    villeArriveeLibelle?: string;
    siteDepart?: string;
    siteArrivee?: string;
    pointRencontre?: string;
    niveauRemplissage?: number;

    billets?: BilletClient[];
}

export interface PassagerRequest {
    nom: string;
    prenom: string;
    /** Facultatif pour un enfant ; le contact de la commande reste obligatoire. */
    telephone?: string;
    pieceIdentite?: string;
    /** ADULTE par défaut. */
    typePassager?: TypePassager;
    /** AAAA-MM-JJ, exigée pour un enfant. */
    dateNaissance?: string;
    /** Siège souhaité ; vide = attribué automatiquement par le serveur. */
    numeroSiege?: string;
}

export interface CommandeCreateRequest {
    offreUuid: string;
    passagers: PassagerRequest[];
    modeReglementCode: string;
    /** Le total à payer tel que le devis l'a montré ; le serveur refuse s'il a changé. */
    montantTotal: number;
    nombreBagages?: number;
    contactEmail?: string;
    contactTelephone?: string;
}

/** Composition d'une réservation à chiffrer. */
export interface DevisRequest {
    offreUuid: string;
    nombreAdultes: number;
    nombreEnfants: number;
    nombreBagages: number;
    modeReglementCode?: string;
}

export interface LigneDevis {
    code: 'ADULTES' | 'ENFANTS' | 'BAGAGES' | 'FRAIS_SERVICE' | 'FRAIS_PAIEMENT' | string;
    libelle: string;
    quantite: number;
    montantUnitaire: number;
    montant: number;
}

/** Le prix calculé par le serveur, à afficher tel quel et à renvoyer à la création. */
export interface Devis {
    offreUuid: string;
    devise: string;
    nombreAdultes: number;
    nombreEnfants: number;
    nombreBagages: number;
    bagagesInclus: number;
    bagagesAutorises: boolean;
    montantAdulte: number;
    montantEnfant: number;
    montantBagage: number;
    lignes: LigneDevis[];
    montantPlaces: number;
    montantBagages: number;
    montantFraisService: number;
    montantTotal: number;
    montantFraisPaiement: number;
    montantAPayer: number;
    ageAdulteMinimum: number;
}

/** Âge révolu à une date, à partir de deux dates AAAA-MM-JJ ; null si la naissance est invalide. */
export function ageALaDate(naissanceIso: string, jourIso: string): number | null {
    const [na, nm, nj] = naissanceIso.split('-').map(Number);
    const [ja, jm, jj] = jourIso.slice(0, 10).split('-').map(Number);
    if (!na || !nm || !nj || !ja || !jm || !jj) return null;
    if (Number.isNaN(new Date(na, nm - 1, nj).getTime())) return null;
    let age = ja - na;
    if (jm < nm || (jm === nm && jj < nj)) age -= 1;
    return age;
}

/** La même règle que le serveur : enfant tant qu'il n'a pas l'âge adulte le jour du voyage. */
export function estEnfant(naissanceIso: string, jourVoyageIso: string, ageAdulteMinimum: number): boolean | null {
    const age = ageALaDate(naissanceIso, jourVoyageIso);
    return age === null ? null : age < ageAdulteMinimum;
}

export interface ModifierDateRequest {
    nouvelleOffreUuid: string;
}

/**
 * Un règlement en ligne interrompu peut être reprise tant que la commande
 * attend son paiement et que le lien du prestataire est connu. Les modes hors
 * ligne (espèces, virement) n'ont pas de lien et ne passent jamais ici.
 */
export function peutReprendrePaiement(commande: CommandeClient): boolean {
    return commande.statut === 'EN_ATTENTE' && !!commande.urlPaiement;
}

/** Une commande en attente de paiement n'a pas encore de billets utilisables. */
export function attendPaiement(commande: CommandeClient): boolean {
    return commande.statut === 'EN_ATTENTE';
}

/** Avis laissé par le voyageur sur une commande, note de 1 à 5. */
export interface AvisRequest {
    commandeUuid: string;
    note: number;
    commentaire?: string;
}

export interface AvisClient {
    avisUuid?: string;
    commandeUuid?: string;
    note?: number;
    commentaire?: string;
    createdAt?: string;
}

/**
 * Un voyage se note une fois parti : le serveur accepte les commandes
 * confirmées, payées ou utilisées, et refuse un second avis. L'application
 * n'a pas le moyen de savoir d'avance si un avis existe déjà, elle s'en remet
 * au refus du serveur.
 */
export function peutNoterVoyage(commande: CommandeClient, aujourdhuiIso: string = new Date().toISOString().slice(0, 10)): boolean {
    if (!['CONFIRMEE', 'PAYEE', 'UTILISEE', 'TERMINEE'].includes(commande.statut ?? '')) return false;
    if (!commande.dateDepart) return false;
    return String(commande.dateDepart).slice(0, 10) < aujourdhuiIso;
}

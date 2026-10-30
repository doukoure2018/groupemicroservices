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

export interface BilletClient {
    billetUuid?: string;
    codeBillet?: string;
    numeroSiege?: string;
    nomPassager?: string;
    telephonePassager?: string;
    pieceIdentite?: string;
    statut?: string;
    qrCodeData?: string;
}

export interface CommandeClient {
    commandeUuid?: string;
    numeroCommande?: string;
    statut?: StatutCommande;
    nombrePlaces?: number;
    montantTotal?: number;
    montantPaye?: number;
    devise?: string;
    referencePaiement?: string;
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
    telephone: string;
    pieceIdentite?: string;
}

export interface CommandeCreateRequest {
    offreUuid: string;
    passagers: PassagerRequest[];
    modeReglementCode: string;
    montantTotal: number;
}

export interface ModifierDateRequest {
    nouvelleOffreUuid: string;
}

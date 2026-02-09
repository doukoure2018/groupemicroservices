/**
 * Interface représentant un partenaire avec jointures
 */
export interface Partenaire {
    // Champs de base
    partenaireId?: number;
    partenaireUuid?: string;
    localisationId?: number;
    nom?: string;
    typePartenaire?: string;
    raisonSociale?: string;
    numeroRegistre?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    logoUrl?: string;
    commissionPourcentage?: number;
    commissionFixe?: number;
    responsableNom?: string;
    responsableTelephone?: string;
    statut?: string;
    dateDebutPartenariat?: string;
    dateFinPartenariat?: string;
    createdAt?: string;
    updatedAt?: string;

    // Jointure Localisation
    localisationUuid?: string;
    localisationAdresseComplete?: string;
    localisationLatitude?: number;
    localisationLongitude?: number;
    quartierLibelle?: string;
    communeLibelle?: string;
    villeLibelle?: string;
    villeUuid?: string;
    regionLibelle?: string;
}

/**
 * DTO pour la création et mise à jour d'un partenaire
 */
export interface PartenaireRequest {
    localisationUuid?: string;
    nom: string;
    typePartenaire?: string;
    raisonSociale?: string;
    numeroRegistre?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    logoUrl?: string;
    commissionPourcentage?: number;
    commissionFixe?: number;
    responsableNom?: string;
    responsableTelephone?: string;
    dateDebutPartenariat?: string;
    dateFinPartenariat?: string;
}

/**
 * Types de partenaires
 */
export const TYPES_PARTENAIRE = [
    { label: 'Agence', value: 'AGENCE' },
    { label: 'Microfinance', value: 'MICROFINANCE' },
    { label: 'Commerce', value: 'COMMERCE' },
    { label: 'Point de vente', value: 'POINT_VENTE' },
    { label: 'Transporteur', value: 'TRANSPORTEUR' },
    { label: 'Revendeur', value: 'REVENDEUR' },
    { label: 'Guichet', value: 'GUICHET' },
    { label: 'Autre', value: 'AUTRE' }
];

/**
 * Statuts possibles d'un partenaire
 */
export const STATUTS_PARTENAIRE = [
    { label: 'Actif', value: 'ACTIF' },
    { label: 'Inactif', value: 'INACTIF' },
    { label: 'Suspendu', value: 'SUSPENDU' },
    { label: 'En attente', value: 'EN_ATTENTE' }
];

/**
 * Retourne la sévérité du tag selon le statut
 */
export function getStatutPartenaireSeverity(statut: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (statut) {
        case 'ACTIF':
            return 'success';
        case 'INACTIF':
            return 'secondary';
        case 'SUSPENDU':
            return 'danger';
        case 'EN_ATTENTE':
            return 'warn';
        default:
            return 'info';
    }
}

/**
 * Retourne le libellé du type de partenaire
 */
export function getTypePartenaireLabel(type: string | undefined): string {
    const found = TYPES_PARTENAIRE.find((t) => t.value === type);
    return found ? found.label : type || 'Inconnu';
}

/**
 * Formate les commissions pour affichage
 */
export function formatCommission(pourcentage?: number, fixe?: number): string {
    const parts: string[] = [];
    if (pourcentage && pourcentage > 0) {
        parts.push(`${pourcentage}%`);
    }
    if (fixe && fixe > 0) {
        parts.push(`${fixe.toLocaleString('fr-GN')} GNF`);
    }
    return parts.length > 0 ? parts.join(' + ') : 'Aucune';
}

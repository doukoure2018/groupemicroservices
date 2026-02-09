/**
 * Interface représentant un trajet complet avec jointures
 * Aligné avec la réponse du backend
 */
export interface Trajet {
    // Champs de base
    trajetId?: number;
    trajetUuid?: string;
    departId?: number;
    arriveeId?: number;
    userId?: number;
    libelleTrajet?: string;
    description?: string;
    instructions?: string;
    distanceKm?: number;
    dureeEstimeeMinutes?: number;
    montantBase?: number;
    montantBagages?: number;
    devise?: string;
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;

    // Champs du Départ (jointure)
    departUuid?: string;
    departLibelle?: string;
    departSiteId?: number;
    departSiteUuid?: string;
    departSiteNom?: string;
    departAdresseComplete?: string;
    departLatitude?: number;
    departLongitude?: number;
    departVilleUuid?: string;
    departVilleLibelle?: string;
    departRegionLibelle?: string;

    // Champs de l'Arrivée (jointure)
    arriveeUuid?: string;
    arriveeLibelle?: string;
    arriveeSiteId?: number;
    arriveeSiteUuid?: string;
    arriveeSiteNom?: string;
    arriveeAdresseComplete?: string;
    arriveeLatitude?: number;
    arriveeLongitude?: number;
    arriveeVilleUuid?: string;
    arriveeVilleLibelle?: string;
    arriveeRegionLibelle?: string;

    // Champs de l'Utilisateur (jointure)
    userUuid?: string;
    userUsername?: string;
    userFullName?: string;
}

/**
 * DTO pour la création et mise à jour d'un trajet
 */
export interface TrajetRequest {
    departUuid: string;
    arriveeUuid: string;
    libelleTrajet?: string;
    description?: string;
    distanceKm?: number;
    dureeEstimeeMinutes?: number;
    montantBase?: number;
    montantBagages?: number;
    devise?: string;
    actif?: boolean;
}

/**
 * Interface pour les statistiques des trajets
 */
export interface TrajetStats {
    total: number;
    actifs: number;
    inactifs: number;
}

/**
 * Options de devise disponibles
 */
export const DEVISES = [
    { label: 'Franc Guinéen (GNF)', value: 'GNF' },
    { label: 'Dollar US (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' },
    { label: 'Franc CFA (XOF)', value: 'XOF' }
];

/**
 * Formatte la durée en heures et minutes
 */
export function formatDuree(minutes: number | undefined): string {
    if (!minutes) return '-';
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (heures === 0) return `${mins} min`;
    if (mins === 0) return `${heures}h`;
    return `${heures}h ${mins}min`;
}

/**
 * Formatte la distance en km
 */
export function formatDistance(km: number | undefined): string {
    if (!km) return '-';
    return `${km.toFixed(1)} km`;
}

/**
 * Formatte le montant avec devise
 */
export function formatMontant(montant: number | undefined, devise: string = 'GNF'): string {
    if (!montant) return '-';
    return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: devise,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(montant);
}

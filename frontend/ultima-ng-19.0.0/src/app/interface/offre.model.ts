/**
 * Interface représentant une offre de transport avec jointures
 */
export interface Offre {
    // Champs de base
    offreId?: number;
    offreUuid?: string;
    tokenOffre?: string;
    trajetId?: number;
    vehiculeId?: number;
    userId?: number;
    dateDepart?: string;
    heureDepart?: string | number[];  // Peut être "HH:mm:ss" ou [heure, minute, seconde]
    heureArriveeEstimee?: string | number[];  // Peut être "HH:mm:ss" ou [heure, minute, seconde]
    nombrePlacesTotal?: number;
    nombrePlacesDisponibles?: number;
    nombrePlacesReservees?: number;
    montant?: number;
    montantPromotion?: number;
    devise?: string;
    statut?: string;
    niveauRemplissage?: number;
    pointRendezvous?: string;
    conditions?: string;
    annulationAutorisee?: boolean;
    delaiAnnulationHeures?: number;
    datePublication?: string;
    dateCloture?: string;
    dateDepartEffectif?: string;
    dateArriveeEffective?: string;
    createdAt?: string;
    updatedAt?: string;

    // Jointure Trajet
    trajetUuid?: string;
    trajetLibelle?: string;
    trajetDistanceKm?: number;
    trajetDureeMinutes?: number;

    // Jointure Départ
    departUuid?: string;
    departLibelle?: string;
    siteDepart?: string;
    villeDepartLibelle?: string;
    villeDepartUuid?: string;
    regionDepartLibelle?: string;

    // Jointure Arrivée
    arriveeUuid?: string;
    arriveeLibelle?: string;
    siteArrivee?: string;
    villeArriveeLibelle?: string;
    villeArriveeUuid?: string;
    regionArriveeLibelle?: string;

    // Jointure Véhicule
    vehiculeUuid?: string;
    vehiculeImmatriculation?: string;
    vehiculeMarque?: string;
    vehiculeModele?: string;
    vehiculeCouleur?: string;
    vehiculeNombrePlaces?: number;
    vehiculeClimatise?: boolean;
    vehiculeStatut?: string;
    typeVehiculeLibelle?: string;
    nomChauffeur?: string;
    contactChauffeur?: string;

    // Jointure Utilisateur
    userUuid?: string;
    userUsername?: string;
    userFullName?: string;
    userEmail?: string;
    userPhone?: string;
}

/**
 * DTO pour la création et mise à jour d'une offre
 */
export interface OffreRequest {
    trajetUuid: string;
    vehiculeUuid: string;
    dateDepart: string;
    heureDepart: string;
    heureArriveeEstimee?: string;
    nombrePlacesTotal: number;
    montant: number;
    montantPromotion?: number;
    devise?: string;
    pointRendezvous?: string;
    conditions?: string;
    annulationAutorisee?: boolean;
    delaiAnnulationHeures?: number;
}

/**
 * Interface pour les statistiques des offres
 */
export interface OffreStats {
    total: number;
    enAttente: number;
    ouvertes: number;
    fermees: number;
    enCours: number;
    terminees: number;
    annulees: number;
    suspendues: number;
    aujourd_hui: number;
}

/**
 * Statuts possibles d'une offre
 */
export const STATUTS_OFFRE = [
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Ouverte', value: 'OUVERT' },
    { label: 'Fermée', value: 'FERME' },
    { label: 'Clôturée', value: 'CLOTURE' },
    { label: 'En cours', value: 'EN_COURS' },
    { label: 'Terminée', value: 'TERMINE' },
    { label: 'Annulée', value: 'ANNULE' },
    { label: 'Suspendue', value: 'SUSPENDU' }
];

/**
 * Options de devise disponibles
 */
export const DEVISES_OFFRE = [
    { label: 'Franc Guinéen (GNF)', value: 'GNF' },
    { label: 'Dollar US (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' },
    { label: 'Franc CFA (XOF)', value: 'XOF' }
];

/**
 * Retourne la sévérité du tag selon le statut
 */
export function getStatutOffreSeverity(statut: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (statut) {
        case 'EN_ATTENTE':
            return 'warn';
        case 'OUVERT':
            return 'success';
        case 'FERME':
            return 'secondary';
        case 'CLOTURE':
            return 'secondary';
        case 'EN_COURS':
            return 'info';
        case 'TERMINE':
            return 'contrast';
        case 'ANNULE':
            return 'danger';
        case 'SUSPENDU':
            return 'danger';
        default:
            return 'info';
    }
}

/**
 * Retourne le libellé du statut
 */
export function getStatutOffreLabel(statut: string | undefined): string {
    const found = STATUTS_OFFRE.find((s) => s.value === statut);
    return found ? found.label : statut || 'Inconnu';
}

/**
 * Formatte le montant avec devise
 */
export function formatMontantOffre(montant: number | undefined, devise: string = 'GNF'): string {
    if (montant === undefined || montant === null) return '-';
    return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: devise,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(montant);
}

/**
 * Formatte la date au format français
 */
export function formatDateOffre(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Formatte l'heure - gère différents formats d'entrée
 * @param heure - peut être une string "HH:mm:ss", un tableau [heure, minute, seconde], ou un objet
 */
export function formatHeureOffre(heure: string | number[] | unknown | undefined): string {
    if (!heure) return '-';

    // Si c'est un tableau [heure, minute, seconde] (format Java LocalTime sérialisé)
    if (Array.isArray(heure)) {
        const h = String(heure[0] || 0).padStart(2, '0');
        const m = String(heure[1] || 0).padStart(2, '0');
        return `${h}:${m}`;
    }

    // Si c'est une chaîne de caractères
    if (typeof heure === 'string') {
        // Format "HH:mm:ss" ou "HH:mm"
        return heure.substring(0, 5);
    }

    // Si c'est un objet avec hour/minute (autre format possible)
    if (typeof heure === 'object' && heure !== null) {
        const obj = heure as { hour?: number; minute?: number };
        if ('hour' in obj || 'minute' in obj) {
            const h = String(obj.hour || 0).padStart(2, '0');
            const m = String(obj.minute || 0).padStart(2, '0');
            return `${h}:${m}`;
        }
    }

    return '-';
}

/**
 * Calcule le montant effectif (avec ou sans promotion)
 */
export function getMontantEffectif(offre: Offre): number {
    if (offre.montantPromotion && offre.montantPromotion > 0 && offre.montantPromotion < (offre.montant || 0)) {
        return offre.montantPromotion;
    }
    return offre.montant || 0;
}

/**
 * Vérifie si une offre a une promotion active
 */
export function hasPromotion(offre: Offre): boolean {
    return !!(offre.montantPromotion && offre.montantPromotion > 0 && offre.montantPromotion < (offre.montant || 0));
}

/**
 * Calcule le pourcentage de réduction
 */
export function getPourcentageReduction(offre: Offre): number {
    if (!hasPromotion(offre) || !offre.montant) return 0;
    return Math.round(((offre.montant - (offre.montantPromotion || 0)) / offre.montant) * 100);
}

/**
 * Calcule le taux de remplissage
 */
export function getTauxRemplissage(offre: Offre): number {
    if (!offre.nombrePlacesTotal || offre.nombrePlacesTotal === 0) return 0;
    const reservees = offre.nombrePlacesReservees || 0;
    return Math.round((reservees / offre.nombrePlacesTotal) * 100);
}

/**
 * Retourne la sévérité selon le taux de remplissage
 */
export function getRemplissageSeverity(offre: Offre): 'success' | 'info' | 'warn' | 'danger' {
    const taux = getTauxRemplissage(offre);
    if (taux >= 80) return 'success';
    if (taux >= 50) return 'info';
    if (taux >= 25) return 'warn';
    return 'danger';
}

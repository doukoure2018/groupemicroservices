import type { HeureLocale } from './format.js';

/** Statuts de la machine à états des offres (billetterieservice). */
export type StatutOffre =
    | 'EN_ATTENTE'
    | 'OUVERT'
    | 'FERME'
    | 'CLOTURE'
    | 'EN_COURS'
    | 'TERMINE'
    | 'ANNULE'
    | 'SUSPENDU';

export const STATUTS_OFFRE: { label: string; value: StatutOffre }[] = [
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Ouverte', value: 'OUVERT' },
    { label: 'Fermée', value: 'FERME' },
    { label: 'Clôturée', value: 'CLOTURE' },
    { label: 'En cours', value: 'EN_COURS' },
    { label: 'Terminée', value: 'TERMINE' },
    { label: 'Annulée', value: 'ANNULE' },
    { label: 'Suspendue', value: 'SUSPENDU' }
];

export interface Offre {
    offreId?: number;
    offreUuid?: string;
    tokenOffre?: string;
    trajetId?: number;
    vehiculeId?: number;
    userId?: number;
    dateDepart?: string;
    heureDepart?: HeureLocale;
    heureArriveeEstimee?: HeureLocale;
    nombrePlacesTotal?: number;
    nombrePlacesDisponibles?: number;
    nombrePlacesReservees?: number;
    montant?: number;
    montantPromotion?: number;
    devise?: string;
    statut?: StatutOffre | string;
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

    // Jointure Utilisateur (transporteur)
    userUuid?: string;
    userUsername?: string;
    userFullName?: string;
    userEmail?: string;
    userPhone?: string;
}

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

export type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export function getStatutOffreSeverity(statut: string | undefined): Severity {
    switch (statut) {
        case 'EN_ATTENTE':
            return 'warn';
        case 'OUVERT':
            return 'success';
        case 'FERME':
        case 'CLOTURE':
            return 'secondary';
        case 'EN_COURS':
            return 'info';
        case 'TERMINE':
            return 'contrast';
        case 'ANNULE':
        case 'SUSPENDU':
            return 'danger';
        default:
            return 'info';
    }
}

export function getStatutOffreLabel(statut: string | undefined): string {
    const found = STATUTS_OFFRE.find((s) => s.value === statut);
    return found ? found.label : statut || 'Inconnu';
}

export function getMontantEffectif(offre: Offre): number {
    if (hasPromotion(offre)) return offre.montantPromotion ?? 0;
    return offre.montant ?? 0;
}

export function hasPromotion(offre: Offre): boolean {
    return !!(offre.montantPromotion && offre.montantPromotion > 0 && offre.montantPromotion < (offre.montant ?? 0));
}

export function getPourcentageReduction(offre: Offre): number {
    if (!hasPromotion(offre) || !offre.montant) return 0;
    return Math.round(((offre.montant - (offre.montantPromotion ?? 0)) / offre.montant) * 100);
}

export function getTauxRemplissage(offre: Offre): number {
    if (!offre.nombrePlacesTotal) return 0;
    return Math.round(((offre.nombrePlacesReservees ?? 0) / offre.nombrePlacesTotal) * 100);
}

export function getRemplissageSeverity(offre: Offre): 'success' | 'info' | 'warn' | 'danger' {
    const taux = getTauxRemplissage(offre);
    if (taux >= 80) return 'success';
    if (taux >= 50) return 'info';
    if (taux >= 25) return 'warn';
    return 'danger';
}

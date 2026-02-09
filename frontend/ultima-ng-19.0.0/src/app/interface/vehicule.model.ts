/**
 * Interface représentant un véhicule avec jointures
 */
export interface Vehicule {
    // Champs de base
    vehiculeId?: number;
    vehiculeUuid?: string;
    userId?: number;
    typeVehiculeId?: number;
    immatriculation?: string;
    marque?: string;
    modele?: string;
    anneeFabrication?: number;
    nombrePlaces?: number;
    nomChauffeur?: string;
    contactChauffeur?: string;
    contactProprietaire?: string;
    description?: string;
    couleur?: string;
    climatise?: boolean;
    imageUrl?: string;
    imageData?: string; // Base64
    imageType?: string;
    documentAssuranceUrl?: string;
    dateExpirationAssurance?: string;
    documentVisiteTechniqueUrl?: string;
    dateExpirationVisite?: string;
    statut?: string;
    noteMoyenne?: number;
    nombreAvis?: number;
    createdAt?: string;
    updatedAt?: string;

    // Jointure Type de Véhicule
    typeVehiculeUuid?: string;
    typeVehiculeLibelle?: string;
    typeVehiculeDescription?: string;
    typeVehiculeCapaciteMin?: number;
    typeVehiculeCapaciteMax?: number;

    // Jointure Utilisateur propriétaire
    userUuid?: string;
    userUsername?: string;
    userFullName?: string;
    userEmail?: string;
    userPhone?: string;
}

/**
 * DTO pour la création et mise à jour d'un véhicule
 */
export interface VehiculeRequest {
    typeVehiculeUuid?: string;
    immatriculation: string;
    marque?: string;
    modele?: string;
    anneeFabrication?: number;
    nombrePlaces: number;
    nomChauffeur: string;
    contactChauffeur: string;
    contactProprietaire?: string;
    description?: string;
    couleur?: string;
    climatise?: boolean;
    imageUrl?: string;
    documentAssuranceUrl?: string;
    dateExpirationAssurance?: string;
    documentVisiteTechniqueUrl?: string;
    dateExpirationVisite?: string;
}

/**
 * Statuts possibles d'un véhicule
 */
export const STATUTS_VEHICULE = [
    { label: 'Actif', value: 'ACTIF' },
    { label: 'Inactif', value: 'INACTIF' },
    { label: 'En maintenance', value: 'EN_MAINTENANCE' },
    { label: 'Suspendu', value: 'SUSPENDU' }
];

/**
 * Couleurs courantes
 */
export const COULEURS_VEHICULE = [
    { label: 'Blanc', value: 'Blanc' },
    { label: 'Noir', value: 'Noir' },
    { label: 'Gris', value: 'Gris' },
    { label: 'Bleu', value: 'Bleu' },
    { label: 'Rouge', value: 'Rouge' },
    { label: 'Vert', value: 'Vert' },
    { label: 'Jaune', value: 'Jaune' },
    { label: 'Orange', value: 'Orange' },
    { label: 'Marron', value: 'Marron' },
    { label: 'Beige', value: 'Beige' }
];

/**
 * Retourne la sévérité du tag selon le statut
 */
export function getStatutVehiculeSeverity(statut: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (statut) {
        case 'ACTIF':
            return 'success';
        case 'INACTIF':
            return 'secondary';
        case 'EN_MAINTENANCE':
            return 'warn';
        case 'SUSPENDU':
            return 'danger';
        default:
            return 'info';
    }
}

/**
 * Retourne le libellé du statut
 */
export function getStatutVehiculeLabel(statut: string | undefined): string {
    const found = STATUTS_VEHICULE.find((s) => s.value === statut);
    return found ? found.label : statut || 'Inconnu';
}

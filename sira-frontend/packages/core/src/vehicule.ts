export type StatutVehicule = 'ACTIF' | 'INACTIF' | 'EN_MAINTENANCE' | 'SUSPENDU';

export const STATUTS_VEHICULE: { label: string; value: StatutVehicule }[] = [
    { label: 'Actif', value: 'ACTIF' },
    { label: 'Inactif', value: 'INACTIF' },
    { label: 'En maintenance', value: 'EN_MAINTENANCE' },
    { label: 'Suspendu', value: 'SUSPENDU' }
];

export const COULEURS_VEHICULE = ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Orange', 'Marron', 'Beige'] as const;

export interface Vehicule {
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
    /** Base64 */
    imageData?: string;
    imageType?: string;
    documentAssuranceUrl?: string;
    dateExpirationAssurance?: string;
    documentVisiteTechniqueUrl?: string;
    dateExpirationVisite?: string;
    statut?: StatutVehicule | string;
    noteMoyenne?: number;
    nombreAvis?: number;
    createdAt?: string;
    updatedAt?: string;

    // Jointure Type de véhicule
    typeVehiculeUuid?: string;
    typeVehiculeLibelle?: string;
    typeVehiculeDescription?: string;
    typeVehiculeCapaciteMin?: number;
    typeVehiculeCapaciteMax?: number;

    // Jointure propriétaire
    userUuid?: string;
    userUsername?: string;
    userFullName?: string;
    userEmail?: string;
    userPhone?: string;
}

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

export interface TypeVehicule {
    typeVehiculeId?: number;
    typeVehiculeUuid?: string;
    libelle?: string;
    description?: string;
    capaciteMin?: number;
    capaciteMax?: number;
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface TypeVehiculeRequest {
    libelle: string;
    description?: string;
    capaciteMin?: number;
    capaciteMax?: number;
    actif?: boolean;
}

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

export function getStatutVehiculeLabel(statut: string | undefined): string {
    const found = STATUTS_VEHICULE.find((s) => s.value === statut);
    return found ? found.label : statut || 'Inconnu';
}

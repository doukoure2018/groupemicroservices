/**
 * Interface représentant un type de véhicule
 */
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

/**
 * DTO pour la création et mise à jour d'un type de véhicule
 */
export interface TypeVehiculeRequest {
    libelle: string;
    description?: string;
    capaciteMin?: number;
    capaciteMax?: number;
    actif?: boolean;
}

/**
 * Interface pour les statistiques
 */
export interface TypeVehiculeStats {
    total: number;
    actifs: number;
    inactifs: number;
}

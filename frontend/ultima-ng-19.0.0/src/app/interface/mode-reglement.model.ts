/**
 * Interface représentant un mode de règlement
 */
export interface ModeReglement {
    modeReglementId?: number;
    modeReglementUuid?: string;
    libelle?: string;
    code?: string;
    description?: string;
    iconeUrl?: string;
    fraisPourcentage?: number;
    fraisFixe?: number;
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * DTO pour la création et mise à jour d'un mode de règlement
 */
export interface ModeReglementRequest {
    libelle: string;
    code: string;
    description?: string;
    iconeUrl?: string;
    fraisPourcentage?: number;
    fraisFixe?: number;
    actif?: boolean;
}

/**
 * Codes prédéfinis pour les modes de règlement
 */
export const CODES_MODE_REGLEMENT = [
    { label: 'Espèces', value: 'CASH', icon: 'pi pi-money-bill' },
    { label: 'Orange Money', value: 'OM', icon: 'pi pi-mobile' },
    { label: 'MTN Mobile Money', value: 'MOMO', icon: 'pi pi-mobile' },
    { label: 'Carte Bancaire', value: 'CB', icon: 'pi pi-credit-card' },
    { label: 'Virement', value: 'VIREMENT', icon: 'pi pi-building' },
    { label: 'Wave', value: 'WAVE', icon: 'pi pi-mobile' }
];

/**
 * Retourne l'icône selon le code
 */
export function getModeReglementIcon(code: string | undefined): string {
    const found = CODES_MODE_REGLEMENT.find((m) => m.value === code);
    return found ? found.icon : 'pi pi-wallet';
}

/**
 * Formate les frais pour affichage
 */
export function formatFrais(fraisPourcentage?: number, fraisFixe?: number): string {
    const parts: string[] = [];
    if (fraisPourcentage && fraisPourcentage > 0) {
        parts.push(`${fraisPourcentage}%`);
    }
    if (fraisFixe && fraisFixe > 0) {
        parts.push(`${fraisFixe.toLocaleString('fr-GN')} GNF`);
    }
    return parts.length > 0 ? parts.join(' + ') : 'Gratuit';
}

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
    /**
     * Calculé par le serveur : vrai si un prestataire traite ce mode, donc si
     * le client sera redirigé pour payer avant d'obtenir ses billets.
     */
    enLigne?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ModeReglementRequest {
    libelle: string;
    code: string;
    description?: string;
    iconeUrl?: string;
    fraisPourcentage?: number;
    fraisFixe?: number;
    actif?: boolean;
}

export const CODES_MODE_REGLEMENT = [
    { label: 'Espèces', value: 'CASH' },
    { label: 'Orange Money', value: 'OM' },
    { label: 'MTN Mobile Money', value: 'MOMO' },
    { label: 'Carte Bancaire', value: 'CB' },
    { label: 'Virement', value: 'VIREMENT' },
    { label: 'Wave', value: 'WAVE' }
] as const;

export function formatFrais(fraisPourcentage?: number, fraisFixe?: number): string {
    const parts: string[] = [];
    if (fraisPourcentage && fraisPourcentage > 0) parts.push(`${fraisPourcentage}%`);
    if (fraisFixe && fraisFixe > 0) parts.push(`${fraisFixe.toLocaleString('fr-GN')} GNF`);
    return parts.length > 0 ? parts.join(' + ') : 'Gratuit';
}

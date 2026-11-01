/**
 * Plan de sièges d'une offre, tel que le serveur le génère (ou tel que le
 * véhicule le déclare). Les clients ne font que le dessiner : chaque rangée a
 * exactement `colonnes` cases, la rangée 0 est celle du chauffeur.
 */

export type TypeCase = 'SIEGE' | 'ALLEE' | 'VIDE' | 'CHAUFFEUR';

export interface CaseSiege {
    type: TypeCase | string;
    numero?: string | null;
}

export interface RangeeSieges {
    numero: number;
    cases: CaseSiege[];
}

export type GabaritVehicule = 'BUS' | 'MINIBUS' | 'VOITURE';

export const GABARITS_VEHICULE: { code: GabaritVehicule; libelle: string }[] = [
    { code: 'BUS', libelle: 'Bus — 2 + 2 autour de l’allée' },
    { code: 'MINIBUS', libelle: 'Minibus — 2 + 1' },
    { code: 'VOITURE', libelle: 'Voiture, 4x4, taxi-brousse — 3 par rang' }
];

export function libelleGabarit(code: string | undefined): string {
    return GABARITS_VEHICULE.find((g) => g.code === code)?.libelle ?? 'Bus — 2 + 2 autour de l’allée';
}

export interface PlanSieges {
    gabarit: GabaritVehicule | string;
    colonnes: number;
    rangees: RangeeSieges[];
}

/** Réponse de GET /billetterie/offres/{uuid}/sieges. */
export interface SiegesOffre {
    plan: PlanSieges;
    /** Sièges des billets non annulés, commandes en attente de paiement comprises. */
    occupes: string[];
    placesDisponibles: number;
}

export function estSiege(c: CaseSiege): c is CaseSiege & { numero: string } {
    return c.type === 'SIEGE' && !!c.numero;
}

/** Numéros dans l'ordre de lecture, rangée par rangée. */
export function numerosSieges(plan: PlanSieges): string[] {
    return plan.rangees.flatMap((r) => r.cases.filter(estSiege).map((c) => c.numero));
}

export function nombreSiegesLibres(sieges: SiegesOffre): number {
    const occupes = new Set(sieges.occupes);
    return numerosSieges(sieges.plan).filter((n) => !occupes.has(n)).length;
}

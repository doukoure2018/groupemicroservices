import type { RechercheProprietesParams, TriProprietes, TypeAnnonce } from '@sira/core';

/**
 * Les critères voyagent d'un écran à l'autre en paramètres d'adresse, donc en
 * chaînes. Ici on les écrit et on les relit, en bornant ce qui doit l'être :
 * une adresse peut toujours être forgée à la main.
 */
export interface ParamsRecherche {
    typeAnnonce?: string;
    villeUuid?: string;
    villeLibelle?: string;
    typeBienCodes?: string;
    prixMax?: string;
    chambresMin?: string;
    commoditesCodes?: string;
    trier?: string;
    q?: string;
}

const TYPES_ANNONCE: TypeAnnonce[] = ['LOCATION', 'VENTE'];
const TRIS: TriProprietes[] = ['DATE_DESC', 'PRIX_ASC', 'PRIX_DESC'];

function liste(v: string | undefined): string[] {
    return (v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function entier(v: string | undefined, max: number): number | undefined {
    const n = Number.parseInt((v ?? '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? Math.min(n, max) : undefined;
}

export function criteresDepuisParams(p: ParamsRecherche): RechercheProprietesParams {
    const typeAnnonce = TYPES_ANNONCE.find((t) => t === p.typeAnnonce);
    const trier = TRIS.find((t) => t === p.trier);
    return {
        ...(typeAnnonce ? { typeAnnonce } : {}),
        ...(p.villeUuid ? { villeUuid: p.villeUuid } : {}),
        ...(liste(p.typeBienCodes).length ? { typeBienCodes: liste(p.typeBienCodes) } : {}),
        ...(entier(p.prixMax, 1_000_000_000_000) ? { prixMax: entier(p.prixMax, 1_000_000_000_000) } : {}),
        ...(entier(p.chambresMin, 20) ? { chambresMin: entier(p.chambresMin, 20) } : {}),
        ...(liste(p.commoditesCodes).length ? { commoditesCodes: liste(p.commoditesCodes) } : {}),
        ...(p.q?.trim() ? { q: p.q.trim() } : {}),
        trier: trier ?? 'DATE_DESC'
    };
}

export function paramsDepuisCriteres(c: RechercheProprietesParams, villeLibelle?: string): Record<string, string> {
    const p: Record<string, string> = {};
    if (c.typeAnnonce) p.typeAnnonce = c.typeAnnonce;
    if (c.villeUuid) p.villeUuid = c.villeUuid;
    if (villeLibelle) p.villeLibelle = villeLibelle;
    if (c.typeBienCodes?.length) p.typeBienCodes = c.typeBienCodes.join(',');
    if (c.prixMax) p.prixMax = String(c.prixMax);
    if (c.chambresMin) p.chambresMin = String(c.chambresMin);
    if (c.commoditesCodes?.length) p.commoditesCodes = c.commoditesCodes.join(',');
    if (c.q) p.q = c.q;
    if (c.trier) p.trier = c.trier;
    return p;
}

/** Combien de filtres sont posés en plus de la recherche de base : le nombre sur le bouton « Filtres ». */
export function nombreDeFiltres(c: RechercheProprietesParams): number {
    return (
        (c.typeBienCodes?.length ? 1 : 0) +
        (c.prixMax ? 1 : 0) +
        (c.chambresMin ? 1 : 0) +
        (c.commoditesCodes?.length ?? 0)
    );
}

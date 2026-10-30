import { request, type APIRequestContext } from '@playwright/test';
import { compteTest } from './helpers';

/**
 * Accès direct à l'API (même gateway que la page) pour préparer et vérifier les
 * données des tests. Jamais utilisé pour remplacer un parcours UI à tester.
 */
export async function apiConnectee(baseURL: string): Promise<APIRequestContext> {
    const { email, password } = compteTest();
    const anonyme = await request.newContext({ baseURL });
    const res = await anonyme.post('/authorization/api/auth/token', { data: { email, password } });
    if (!res.ok()) throw new Error(`Connexion API impossible : HTTP ${res.status()}`);
    const { access_token } = (await res.json()) as { access_token: string };
    await anonyme.dispose();
    return request.newContext({ baseURL, extraHTTPHeaders: { Authorization: `Bearer ${access_token}` } });
}

export async function lireData<T>(ctx: APIRequestContext, path: string): Promise<T> {
    const res = await ctx.get(path);
    if (!res.ok()) throw new Error(`GET ${path} → HTTP ${res.status()}`);
    return ((await res.json()) as { data: T }).data;
}

/** Garantit la région et la ville de test (préfixe ZZ E2E), utilisées par les écrans transport. */
export async function assurerVilleE2E(ctx: APIRequestContext, region: string, ville: string): Promise<void> {
    const { regions } = await lireData<{ regions: Array<{ regionUuid: string; libelle: string }> }>(ctx, '/billetterie/regions');
    let r = regions.find((x) => x.libelle === region);
    if (!r) {
        const res = await ctx.post('/billetterie/regions', { data: { libelle: region, code: 'E2E' } });
        if (!res.ok()) throw new Error(`Création région E2E : HTTP ${res.status()}`);
        r = ((await res.json()) as { data: { region: { regionUuid: string; libelle: string } } }).data.region;
    }
    const { villes } = await lireData<{ villes: Array<{ villeUuid: string; libelle: string }> }>(ctx, '/billetterie/villes');
    if (!villes.some((v) => v.libelle === ville)) {
        const res = await ctx.post('/billetterie/villes', { data: { regionUuid: r.regionUuid, libelle: ville } });
        if (!res.ok()) throw new Error(`Création ville E2E : HTTP ${res.status()}`);
    }
}

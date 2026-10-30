import { expect, type Page, type Request, type Response } from '@playwright/test';

/**
 * Compte utilisé pour les parcours connectés. Jamais en dur : fourni par
 * l'environnement (E2E_EMAIL / E2E_PASSWORD).
 */
export function compteTest(): { email: string; password: string } {
    const email = process.env['E2E_EMAIL'];
    const password = process.env['E2E_PASSWORD'];
    if (!email || !password) throw new Error('E2E_EMAIL et E2E_PASSWORD doivent être définis pour les parcours connectés.');
    return { email, password };
}

/** Connexion par le formulaire React (POST /authorization/api/auth/token). */
export async function connecter(page: Page, redirect = '/'): Promise<void> {
    const { email, password } = compteTest();
    await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Mot de passe').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    // La topbar affiche « Se déconnecter » dès que le profil est chargé.
    await expect(page.getByRole('button', { name: 'Se déconnecter' })).toBeVisible({ timeout: 20_000 });
}

export interface Journal {
    erreursJs: string[];
    erreursConsole: string[];
    reponsesEchec: string[];
    requetesEchouees: string[];
}

/**
 * Journalise tout ce qui doit rester vide pendant un parcours : exceptions non
 * rattrapées, console.error, réponses API >= 400 et requêtes réseau avortées.
 * Les URL ignorées (favicon, sourcemaps, tuiles OSM) sont filtrées.
 */
export function surveiller(page: Page, options: { ignorer?: RegExp[] } = {}): Journal {
    const journal: Journal = { erreursJs: [], erreursConsole: [], reponsesEchec: [], requetesEchouees: [] };
    const ignorer = options.ignorer ?? [];
    const estIgnore = (url: string) => ignorer.some((re) => re.test(url)) || /favicon|\.map$|openstreetmap|tile\./.test(url);

    page.on('pageerror', (err) => journal.erreursJs.push(err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') journal.erreursConsole.push(msg.text());
    });
    page.on('response', (res: Response) => {
        if (res.status() >= 400 && !estIgnore(res.url())) {
            journal.reponsesEchec.push(`${res.status()} ${res.request().method()} ${res.url().replace(/^https?:\/\/[^/]+/, '')}`);
        }
    });
    page.on('requestfailed', (req: Request) => {
        if (!estIgnore(req.url())) journal.requetesEchouees.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
    });
    return journal;
}

/** Filtre les bruits connus de la console (React DevTools, avertissements PrimeReact). */
export function erreursConsoleSignificatives(journal: Journal): string[] {
    return journal.erreursConsole.filter((t) => !/DevTools|Download the React DevTools/i.test(t));
}

export function rapport(journal: Journal): string {
    return [
        journal.erreursJs.length ? `JS: ${journal.erreursJs.join(' | ')}` : '',
        journal.reponsesEchec.length ? `HTTP: ${journal.reponsesEchec.join(' | ')}` : '',
        journal.requetesEchouees.length ? `Réseau: ${journal.requetesEchouees.join(' | ')}` : '',
        erreursConsoleSignificatives(journal).length ? `Console: ${erreursConsoleSignificatives(journal).join(' | ')}` : ''
    ]
        .filter(Boolean)
        .join('\n');
}

/**
 * À appeler en tête d'un fichier de tests : chaque test reçoit un journal réseau
 * et, en cas d'échec, le rapport (JS, HTTP >= 400, réseau, console) est attaché
 * au résultat Playwright et imprimé — c'est ce qui permet de distinguer un bug
 * front d'un refus serveur.
 */
export function journaliserEchecs(test: typeof import('@playwright/test').test): void {
    const journaux = new WeakMap<Page, Journal>();
    test.beforeEach(async ({ page }) => {
        journaux.set(page, surveiller(page));
    });
    test.afterEach(async ({ page }, testInfo) => {
        const journal = journaux.get(page);
        if (!journal || testInfo.status === testInfo.expectedStatus) return;
        const texte = rapport(journal) || '(aucune anomalie réseau/JS journalisée)';
        await testInfo.attach('journal-reseau', { body: texte, contentType: 'text/plain' });
        console.log(`\n[journal ${testInfo.title}]\n${texte}\n`);
    });
}

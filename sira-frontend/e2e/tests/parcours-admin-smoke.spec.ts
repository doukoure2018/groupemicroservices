import { expect, test } from '@playwright/test';
import { connecter, rapport, surveiller } from './helpers';

/**
 * Parcours connecté (SUPER_ADMIN) : chaque écran doit monter sans exception JS,
 * sans appel API en échec et afficher son titre. C'est le filet de sécurité
 * large avant les tests fonctionnels écran par écran.
 */
const ECRANS: Array<{ route: string; titre: RegExp | string; httpAttendu?: RegExp; texteAttendu?: RegExp }> = [
    { route: '/tableau-de-bord', titre: /bonjour/i },
    { route: '/mes-voyages', titre: 'Mes voyages' },
    { route: '/admin', titre: /bonjour/i },
    { route: '/admin/profil', titre: /mon profil/i },
    { route: '/admin/offres', titre: /offres/i },
    { route: '/admin/nouvelle-liaison', titre: /nouvelle liaison/i },
    { route: '/admin/sites', titre: /sites/i },
    { route: '/admin/departs', titre: /départ/i },
    { route: '/admin/arrivees', titre: /arrivée/i },
    { route: '/admin/trajets', titre: /trajets/i },
    { route: '/admin/types-vehicules', titre: /types de véhicules/i },
    { route: '/admin/vehicules', titre: /véhicules/i },
    { route: '/admin/regions', titre: /régions/i },
    { route: '/admin/villes', titre: /villes/i },
    { route: '/admin/communes', titre: /communes/i },
    { route: '/admin/quartiers', titre: /quartiers/i },
    { route: '/admin/localisations', titre: /localisations/i },
    { route: '/admin/modes-reglement', titre: /modes de règlement/i },
    { route: '/admin/partenaires', titre: /partenaires/i },
    { route: '/admin/moderation', titre: /modération/i },
    { route: '/admin/leads', titre: /demandes|leads/i },
    { route: '/admin/agences', titre: /agences/i },
    { route: '/admin/utilisateurs', titre: /utilisateurs/i },
    { route: '/agence', titre: /agence/i },
    // Le compte de test n'a pas d'agence : le backend répond 400 et l'écran doit afficher le bloc d'accès refusé.
    { route: '/agence/demandes', titre: /demandes clients/i, httpAttendu: /400 GET \/immo\/demandes/, texteAttendu: /agence|accès|introuvable|vérifi/i },
    { route: '/conformite', titre: /dossiers agence/i }
];

test.describe.configure({ mode: 'serial' });

test('tous les écrans connectés montent sans erreur', async ({ page }) => {
    test.setTimeout(240_000);
    const journal = surveiller(page);
    await connecter(page);

    const echecs: string[] = [];
    for (const ecran of ECRANS) {
        const avant = { js: journal.erreursJs.length, http: journal.reponsesEchec.length, net: journal.requetesEchouees.length };
        await page.goto(ecran.route);
        await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);

        const titreVisible = await expect(page.getByRole('heading', { name: ecran.titre }).first())
            .toBeVisible({ timeout: 20_000 })
            .then(() => true)
            .catch(() => false);
        const refus = await page.getByText(/pas les droits nécessaires/i).isVisible().catch(() => false);

        const nouveaux = {
            js: journal.erreursJs.slice(avant.js),
            http: journal.reponsesEchec.slice(avant.http).filter((h) => !ecran.httpAttendu?.test(h)),
            net: journal.requetesEchouees.slice(avant.net)
        };
        const problemes: string[] = [];
        if (!titreVisible) problemes.push(`titre ${String(ecran.titre)} absent (url finale ${page.url()})`);
        if (refus) problemes.push('accès refusé');
        if (ecran.texteAttendu && !(await page.getByText(ecran.texteAttendu).first().isVisible().catch(() => false))) problemes.push(`texte ${String(ecran.texteAttendu)} absent`);
        if (nouveaux.js.length) problemes.push(`JS: ${nouveaux.js.join(' | ')}`);
        if (nouveaux.http.length) problemes.push(`HTTP: ${nouveaux.http.join(' | ')}`);
        if (nouveaux.net.length) problemes.push(`Réseau: ${nouveaux.net.join(' | ')}`);
        if (problemes.length) echecs.push(`${ecran.route}\n    ${problemes.join('\n    ')}`);
    }

    expect(echecs, `Écrans en défaut :\n${echecs.join('\n')}\n\n${rapport(journal)}`).toHaveLength(0);
});

test('la déconnexion ramène à l’état anonyme', async ({ page }) => {
    await connecter(page, '/mes-voyages');
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    // Le pied de page propose aussi « Se connecter » : on vise la barre du haut,
    // seule à refléter l'état de session.
    await expect(page.getByRole('banner').getByRole('link', { name: 'Se connecter' })).toBeVisible();
    await page.goto('/mes-voyages');
    await page.waitForURL(/\/login\?redirect=/);
});

test('un mauvais mot de passe affiche l’erreur serveur sans quitter la page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('personne@example.com');
    await page.getByLabel('Mot de passe').fill('mauvais-mot-de-passe');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.locator('p.error')).toBeVisible({ timeout: 15_000 });
    expect(page.url()).toContain('/login');
});

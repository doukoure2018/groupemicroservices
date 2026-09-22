import { expect, test } from '@playwright/test';

/**
 * Parité — chaque route protégée, visitée sans session, doit renvoyer vers
 * /login en mémorisant la destination, et ne jamais afficher de contenu métier.
 */
const ROUTES_PROTEGEES = [
    '/tableau-de-bord',
    '/mes-voyages',
    '/reserver/00000000-0000-0000-0000-000000000000',
    '/agence',
    '/agence/demandes',
    '/conformite',
    '/admin',
    '/admin/offres',
    '/admin/utilisateurs',
    '/admin/moderation'
];

for (const route of ROUTES_PROTEGEES) {
    test(`sans session, ${route} redirige vers /login`, async ({ page }) => {
        await page.goto(route);
        await page.waitForURL(/\/login\?redirect=/, { timeout: 15_000 });
        expect(decodeURIComponent(page.url())).toContain(`redirect=${route}`);
        await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    });
}

test('une route inconnue renvoie vers la home', async ({ page }) => {
    await page.goto('/cette-page-n-existe-pas');
    await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Commencez votre voyage/ })).toBeVisible();
});

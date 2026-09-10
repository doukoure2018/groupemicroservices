import { expect, test } from '@playwright/test';

/**
 * Parité — home publique : ce que la home DOIT offrir sans authentification,
 * quel que soit le framework qui la rend.
 */

test.describe('Home publique', () => {
    test('la page se charge sans erreur console bloquante', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto('/');
        await expect(page.locator('body')).not.toBeEmpty();

        expect(errors, `Erreurs JS au chargement : ${errors.join(' | ')}`).toHaveLength(0);
    });

    test('les villes actives sont chargées via l’API publique (sans Bearer)', async ({ page }) => {
        const villesRequest = page.waitForRequest(
            (req) => req.url().includes('/billetterie/villes/active') && req.method() === 'GET',
            { timeout: 15_000 }
        );
        await page.goto('/');
        const req = await villesRequest;

        // Invariant de sécurité : cet endpoint public ne doit PAS recevoir de token.
        expect(req.headers()['authorization']).toBeUndefined();
    });

    test('le formulaire de recherche de voyage est visible', async ({ page }) => {
        await page.goto('/');
        // La home expose une recherche départ/arrivée/date (libellés FR).
        await expect(page.getByText(/départ/i).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/arrivée/i).first()).toBeVisible();
    });
});

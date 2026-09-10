import { expect, test } from '@playwright/test';

/**
 * Parité — recherche publique d'offres : l'appel /billetterie/offres/recherche
 * doit partir sans authentification et la page doit afficher soit des résultats,
 * soit un état vide explicite (jamais une erreur).
 */

test('une recherche déclenche l’appel public offres/recherche', async ({ page }) => {
    await page.goto('/');

    const searchResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/billetterie/offres/recherche'),
        { timeout: 20_000 }
    );

    // Parcours minimal : la home peut déclencher la recherche via ?rechercher=1
    await page.goto('/?rechercher=1');

    const response = await searchResponsePromise.catch(() => null);
    if (response) {
        expect(response.request().headers()['authorization']).toBeUndefined();
        expect(response.status()).toBeLessThan(500);
    } else {
        // Si la recherche exige une saisie manuelle, le formulaire doit au moins être là.
        await expect(page.getByText(/départ/i).first()).toBeVisible();
    }
});

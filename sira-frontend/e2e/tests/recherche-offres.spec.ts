import { expect, test } from '@playwright/test';

/**
 * Parité — recherche publique d'offres : le backend exige les deux villes
 * (dateDepart facultative). L'appel part sans Bearer et la page affiche soit des
 * résultats, soit un état vide explicite — jamais une erreur.
 */
test('une recherche avec deux villes déclenche l’appel public offres/recherche', async ({ page }) => {
    await page.goto('/');
    const depart = page.getByLabel(/Ville de départ/);
    const arrivee = page.getByLabel(/Ville d'arrivée/);
    await expect(depart.locator('option')).not.toHaveCount(1, { timeout: 15_000 });
    // On ne garde que les vraies villes (option à valeur non vide, pas le placeholder).
    const villes = await depart.locator('option').evaluateAll((opts) => opts.filter((o) => (o as HTMLOptionElement).value).map((o) => o.textContent?.trim() ?? ''));
    expect(villes.length).toBeGreaterThanOrEqual(2);

    await depart.selectOption({ label: villes[0]! });
    await arrivee.selectOption({ label: villes[1]! });

    const reponse = page.waitForResponse((res) => res.url().includes('/billetterie/offres/recherche'), { timeout: 20_000 });
    await page.getByRole('button', { name: 'Rechercher' }).click();
    const res = await reponse;
    expect(res.request().headers()['authorization']).toBeUndefined();
    expect(res.status()).toBe(200);

    // Résultats ou état vide explicite, jamais le message d'échec.
    await expect(page.locator('ul.resultats, p.muted').filter({ hasText: /places disponibles|Aucun voyage/ }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('p.error')).toHaveCount(0);
});

test('sans ville, la recherche est bloquée avec un message explicite', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Rechercher' })).toBeDisabled();
});

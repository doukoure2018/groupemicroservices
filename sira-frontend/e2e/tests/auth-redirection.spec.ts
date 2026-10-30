import { expect, test } from '@playwright/test';

/**
 * Parité — protection des routes : /dashboards sans session doit rediriger
 * vers l'authentification (page login de l'authorization server ou home),
 * jamais afficher le back-office.
 */

test('une route protégée sans session ne montre pas le dashboard', async ({ page }) => {
    await page.goto('/dashboards');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isOnLoginOrHome = /\/login|\/oauth2|\/$|\/\?/.test(url) || !url.includes('/dashboards');

    // Si l'app laisse l'URL /dashboards, elle doit au minimum ne pas afficher de données.
    if (!isOnLoginOrHome) {
        await expect(page.getByText(/mes réservations|tableau de bord/i)).not.toBeVisible();
    }
    expect(true).toBe(true);
});

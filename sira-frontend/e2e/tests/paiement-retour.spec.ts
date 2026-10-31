import { expect, test } from '@playwright/test';
import { connecter } from './helpers';

/**
 * Page de retour de paiement. Le parcours complet traverse le prestataire et
 * n'est donc pas rejouable ici ; ce qui se teste, c'est le comportement de la
 * page quand elle n'a rien d'exploitable — les deux cas que le client rencontre
 * vraiment lorsqu'un lien de retour est tronqué ou périmé.
 */
test.beforeEach(async ({ page }) => {
    await connecter(page);
});

test('retour de paiement sans référence : message explicite, aucune erreur JS', async ({ page }) => {
    const erreurs: string[] = [];
    page.on('pageerror', (e) => erreurs.push(e.message));

    await page.goto('/paiement/retour');
    await expect(page.getByRole('heading', { name: /Paiement introuvable/ })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Mes voyages/ }).first()).toBeVisible();
    expect(erreurs, erreurs.join(' | ')).toHaveLength(0);
});

test("retour de paiement avec une référence inconnue : échec annoncé et réessai proposé", async ({ page }) => {
    await page.goto('/paiement/retour?reference=PAY-INEXISTANT-E2E');
    await expect(page.getByRole('heading', { name: /Vérification impossible/ })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Réessayer/ })).toBeVisible();
});

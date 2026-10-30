import { expect, test } from '@playwright/test';
import { journaliserEchecs } from './helpers';

/**
 * Pages d'authentification publiques : inscription (validation, sans soumission
 * pour ne pas créer de compte ni envoyer d'email), mot de passe oublié, et les
 * trois pages de vérification dont les chemins sont imposés par les emails.
 */
journaliserEchecs(test);

test('inscription : choix du type de compte, validation, aucune soumission tant que le formulaire est incomplet', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible();
    const soumettre = page.getByRole('button', { name: "S'inscrire" });
    await expect(soumettre).toBeDisabled();

    await page.getByLabel(/^Prénom/).fill('Zz');
    await page.getByLabel(/^Nom$|^Nom du représentant/).fill('E2E');
    await page.getByLabel('Email').fill('pas-un-email');
    await page.getByLabel("Nom d'utilisateur").fill('abc');
    await page.getByLabel('Mot de passe').fill('123');
    await expect(soumettre).toBeDisabled();

    // Le mode agence renomme les champs du représentant
    await page.locator('label.carte-choix').filter({ hasText: /agence/i }).click();
    await expect(page.getByText('Prénom du représentant')).toBeVisible();
    await page.locator('label.carte-choix').filter({ hasText: /particulier/i }).click();
    await expect(page.getByText('Prénom du représentant')).toHaveCount(0);

    await page.getByLabel('Email').fill('zz.e2e@example.com');
    await page.getByLabel("Nom d'utilisateur").fill('zze2euser');
    await page.getByLabel('Mot de passe').fill('motdepasse6');
    await expect(soumettre).toBeEnabled();
    await expect(page.getByRole('button', { name: /Continuer avec Google/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Se connecter' }).last()).toBeVisible();
});

test('mot de passe oublié : validation de l’email puis réponse serveur affichée sans erreur JS', async ({ page }) => {
    await page.goto('/auth/forgotpassword');
    await expect(page.getByRole('heading', { name: 'Réinitialisation de mot de passe' })).toBeVisible();
    await page.getByLabel('Email').fill('pas-un-email');
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();
    await expect(page.locator('.texte-danger')).toBeVisible();

    const reponse = page.waitForResponse((r) => r.url().includes('/user/resetpassword'), { timeout: 20_000 });
    await page.getByLabel('Email').fill('zz.e2e.inconnu@example.com');
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();
    const res = await reponse;
    expect(res.request().headers()['authorization']).toBeUndefined();
    // Compte inconnu : le serveur répond (succès neutre ou refus), la page affiche son message.
    await expect(page.locator('p.error, p.succes').filter({ hasText: /email|lien|compte|introuvable|envoy/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Retour à la connexion' })).toBeVisible();
});

test('pages de vérification : jeton absent → message explicite, jeton invalide → erreur serveur', async ({ page }) => {
    await page.goto('/auth/verify/account');
    await expect(page.getByRole('heading', { name: 'Activation du compte' })).toBeVisible();
    await expect(page.getByText(/Lien invalide/)).toBeVisible();

    await page.goto('/auth/verify/password');
    await expect(page.getByRole('heading', { name: 'Nouveau mot de passe' })).toBeVisible();
    await expect(page.getByText(/Lien invalide/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Demander un nouveau lien' })).toBeVisible();

    await page.goto('/auth/verify/account?token=jeton-e2e-invalide');
    await expect(page.locator('p.error')).toBeVisible({ timeout: 20_000 });

    await page.goto('/auth/verify/password?token=jeton-e2e-invalide');
    await expect(page.locator('p.error')).toBeVisible({ timeout: 20_000 });

    await page.goto('/auth/verify/mobile?token=jeton-e2e-invalide');
    await expect(page.getByRole('heading', { name: /Vérification impossible|Compte vérifié/ })).toBeVisible({ timeout: 20_000 });
});

import { expect, test } from '@playwright/test';
import { apiConnectee, lireData } from './api';
import { connecter, journaliserEchecs } from './helpers';
import { accepterConfirmation, attendreTableau, attendreToastSucces, boutonIcone, champSousLabel, choisirDropdown, choisirPremiereOption, dialogVisible, dropdownSousLabel, ligneTableau, ouvrirDropdown } from './outils-prime';

/**
 * Localisations (création manuelle avec GPS, garde « sans quartier », carte,
 * modification, suppression) et assistant Nouvelle liaison (5 étapes, exécution
 * réelle sans offre, réutilisation des référentiels E2E).
 */
const ADRESSE = 'ZZ E2E Adresse de test, Conakry';
const VILLE = 'ZZ E2E Ville';
const SITE = 'ZZ E2E Gare';

test.describe.configure({ mode: 'serial' });
journaliserEchecs(test);

test.beforeEach(async ({ page }) => {
    await connecter(page, '/admin/localisations');
});

test('localisations : création sans quartier (confirmation), carte, modification, suppression', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Gestion des Localisations' })).toBeVisible();
    await expect(page.locator('.stat-carte')).toHaveCount(4);

    await attendreTableau(page);
    const recherche = page.locator('.barre-filtres input').first();
    await recherche.fill('ZZ E2E Adresse');
    while ((await ligneTableau(page, 'ZZ E2E Adresse').count()) > 0) {
        await boutonIcone(ligneTableau(page, 'ZZ E2E Adresse'), 'pi-trash').click();
        await accepterConfirmation(page, 'Supprimer');
        await attendreToastSucces(page);
        await expect(ligneTableau(page, 'ZZ E2E Adresse')).toHaveCount(0);
    }

    await page.getByRole('button', { name: 'Nouvelle localisation' }).click();
    const dialog = page.locator('.p-dialog:visible').first();
    await expect(dialog.getByRole('button', { name: 'Créer' })).toBeDisabled();
    await dialog.locator('label').filter({ hasText: 'Adresse sélectionnée' }).locator('textarea').fill(ADRESSE);
    await champSousLabel(dialog, /^Latitude/).fill('9.6412');
    await champSousLabel(dialog, /^Longitude/).fill('-13.5784');
    await expect(dialog.getByText('✓ Récupérées')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Créer' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Créer' }).click();
    // Garde « sans quartier » : retour au formulaire puis enregistrement
    const garde = page.locator('.p-confirm-dialog:visible').last();
    await expect(garde).toContainText('Localisation sans quartier');
    await garde.getByRole('button', { name: 'Revenir au formulaire' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Créer' }).click();
    await accepterConfirmation(page, 'Enregistrer sans quartier');
    await attendreToastSucces(page);

    await recherche.fill('ZZ E2E Adresse');
    let ligne = ligneTableau(page, 'ZZ E2E Adresse');
    await expect(ligne).toBeVisible();
    await boutonIcone(ligne, 'pi-map').click();
    const carte = dialogVisible(page, 'Localisation sur la carte');
    await expect(carte).toContainText('9.6412');
    await expect(carte.locator('iframe')).toBeVisible();
    await carte.locator('.p-dialog-header-close, .p-dialog-header-icon').first().click();
    await expect(carte).toBeHidden();

    await boutonIcone(ligne, 'pi-pencil').click();
    const edition = page.locator('.p-dialog:visible').first();
    await edition.locator('label').filter({ hasText: /^Description/ }).locator('textarea').fill('Repère E2E');
    await edition.getByRole('button', { name: 'Modifier' }).click();
    await accepterConfirmation(page, 'Enregistrer sans quartier');
    await attendreToastSucces(page);
    ligne = ligneTableau(page, 'ZZ E2E Adresse');
    await expect(ligne).toContainText('Repère E2E');

    await boutonIcone(ligne, 'pi-trash').click();
    await accepterConfirmation(page, 'Supprimer');
    await attendreToastSucces(page);
    await expect(ligneTableau(page, 'ZZ E2E Adresse')).toHaveCount(0);
});

test('assistant Nouvelle liaison : 5 étapes, validation de chaque étape, exécution sans offre', async ({ page, baseURL }) => {
    test.setTimeout(150_000);
    await page.goto('/admin/nouvelle-liaison');
    await expect(page.getByRole('heading', { name: 'Assistant Nouvelle liaison' })).toBeVisible();
    const suivant = page.getByRole('button', { name: 'Suivant' });
    const precedent = page.getByRole('button', { name: 'Précédent' });
    await expect(suivant).toBeDisabled();
    await expect(precedent).toBeDisabled();

    // Étape 1 : départ = ville et site E2E existants
    await expect(page.getByRole('heading', { name: /D'où part la liaison/ })).toBeVisible();
    await choisirDropdown(page, dropdownSousLabel(page.locator('main'), /^Ville/), VILLE);
    await choisirDropdown(page, dropdownSousLabel(page.locator('main'), /^Site \*/), SITE);
    await expect(suivant).toBeEnabled();
    await suivant.click();

    // Étape 2 : arrivée = une ville QUI A DÉJÀ UN SITE (déterministe), lue via l'API,
    // pour rester en mode « Site existant » quel que soit le jeu de données.
    await expect(precedent).toBeEnabled();
    const ctx = await apiConnectee(baseURL!);
    const { sites } = await lireData<{ sites: Array<{ nom: string; villeLibelle?: string; actif?: boolean }> }>(ctx, '/billetterie/sites');
    await ctx.dispose();
    const siteArrivee = sites.find((x) => x.villeLibelle && x.villeLibelle !== VILLE && x.actif !== false);
    expect(siteArrivee, 'il faut un site actif dans une autre ville').toBeTruthy();
    await choisirDropdown(page, dropdownSousLabel(page.locator('main'), /^Ville/), siteArrivee!.villeLibelle!);
    await expect(page.getByRole('button', { name: 'Site existant' })).toBeVisible();
    await page.getByRole('button', { name: 'Site existant' }).click();
    await choisirDropdown(page, dropdownSousLabel(page.locator('main'), /^Site \*/), siteArrivee!.nom);
    await expect(suivant).toBeEnabled();
    await suivant.click();

    // Étape 3 : caractéristiques (libellé pré-rempli, durée et montant obligatoires)
    await expect(page.getByRole('heading', { name: 'Caractéristiques du trajet' })).toBeVisible();
    await expect(champSousLabel(page.locator('main'), /^Libellé du trajet/)).not.toHaveValue('');
    await expect(suivant).toBeDisabled();
    await champSousLabel(page.locator('main'), /^Durée estimée/).fill('90');
    await champSousLabel(page.locator('main'), /^Montant de base/).fill('45000');
    await expect(suivant).toBeEnabled();
    await suivant.click();

    // Étape 4 : pas d'offre
    await expect(page.getByRole('heading', { name: /Première offre/ })).toBeVisible();
    const caseOffre = page.locator('.p-checkbox').first();
    if ((await caseOffre.locator('.p-checkbox-box.p-highlight').count()) > 0) await caseOffre.click();
    await expect(page.getByText(/créer des offres plus tard/)).toBeVisible();
    await suivant.click();

    // Étape 5 : récapitulatif et exécution
    await expect(page.getByRole('heading', { name: 'Récapitulatif' })).toBeVisible();
    await expect(page.locator('main')).toContainText(VILLE);
    await page.getByRole('button', { name: 'Créer la liaison' }).click();
    await expect(page.getByRole('button', { name: 'Créer une autre liaison' })).toBeVisible({ timeout: 60_000 });
    const lignes = page.locator('main li').filter({ has: page.locator('.p-tag') });
    await expect(lignes.first()).toBeVisible();
    await expect(page.locator('main').getByText(/erreur|échec/i)).toHaveCount(0);
});

import { expect, test } from '@playwright/test';
import { connecter } from './helpers';
import { accepterConfirmation, attendreTableau, attendreToastSucces, boutonIcone, champSousLabel, choisirDropdown, choisirPremiereOption, dialogVisible, dropdownSousLabel, ligneTableau } from './outils-prime';

/**
 * Référentiel géographique — CRUD générique (ReferentielCrud) exercé sur les
 * régions, la cascade région → ville, et la saisie en lot des quartiers.
 * Les enregistrements créés sont préfixés « ZZ E2E » et laissés inactifs.
 */
const REGION = 'ZZ E2E Région';
const VILLE = 'ZZ E2E Ville';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
    await connecter(page, '/admin/regions');
});

test('régions : validation, création (ou reprise), modification, désactivation, réactivation', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Gestion des Régions' })).toBeVisible();
    await expect(page.locator('.stat-carte').first()).toContainText(/\d+/);

    // Validation du formulaire
    await page.getByRole('button', { name: 'Nouvelle Région' }).click();
    const dialog = dialogVisible(page, 'Nouvelle région');
    await expect(dialog.getByRole('button', { name: 'Créer' })).toBeDisabled();
    await champSousLabel(dialog, 'Libellé').fill('A');
    await champSousLabel(dialog, 'Libellé').blur();
    await expect(dialog.getByText('Minimum 2 caractères')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Créer' })).toBeDisabled();

    // Création idempotente
    await attendreTableau(page);
    await page.locator('.barre-filtres input').first().fill(REGION);
    const dejaLa = (await ligneTableau(page, REGION).count()) > 0;
    if (!dejaLa) {
        await champSousLabel(dialog, 'Libellé').fill(REGION);
        await champSousLabel(dialog, 'Code').fill('E2E');
        await dialog.getByRole('button', { name: 'Créer' }).click();
        await attendreToastSucces(page, /créée/);
    } else {
        await dialog.getByRole('button', { name: 'Annuler' }).click();
    }
    await page.locator('.barre-filtres input').first().fill(REGION);
    const ligne = ligneTableau(page, REGION);
    await expect(ligne).toBeVisible();
    await expect(ligne.locator('.code-badge')).toHaveText('E2E');

    // Modification
    await boutonIcone(ligne, 'pi-pencil').click();
    const edition = dialogVisible(page, 'Modifier la région');
    await expect(champSousLabel(edition, 'Libellé')).toHaveValue(REGION);
    await champSousLabel(edition, 'Libellé').fill(`${REGION} modifiée`);
    await edition.getByRole('button', { name: 'Modifier' }).click();
    await attendreToastSucces(page, /modifiée/);
    await expect(ligneTableau(page, `${REGION} modifiée`)).toBeVisible();
    // Retour au libellé initial
    await boutonIcone(ligneTableau(page, `${REGION} modifiée`), 'pi-pencil').click();
    await champSousLabel(dialogVisible(page, 'Modifier la région'), 'Libellé').fill(REGION);
    await dialogVisible(page, 'Modifier la région').getByRole('button', { name: 'Modifier' }).click();
    await attendreToastSucces(page);

    // Activation / désactivation : on termine ACTIVE pour que la ville puisse s'y rattacher
    const statut = ligneTableau(page, REGION).locator('.p-tag');
    const etaitActive = (await statut.textContent())?.includes('Actif');
    await boutonIcone(ligneTableau(page, REGION), etaitActive ? 'pi-lock' : 'pi-lock-open').click();
    await accepterConfirmation(page, 'Oui');
    await attendreToastSucces(page, etaitActive ? /désactivée/ : /activée/);
    await expect(ligneTableau(page, REGION).locator('.p-tag')).toHaveText(etaitActive ? 'Inactif' : 'Actif');
    if (etaitActive) {
        await boutonIcone(ligneTableau(page, REGION), 'pi-lock-open').click();
        await accepterConfirmation(page, 'Oui');
        await attendreToastSucces(page, /activée/);
        await expect(ligneTableau(page, REGION).locator('.p-tag')).toHaveText('Actif');
    }
});

test('villes : création rattachée à la région (dropdown filtrable) et filtre par région', async ({ page }) => {
    await page.goto('/admin/villes');
    await expect(page.getByRole('heading', { name: 'Villes / Préfectures' })).toBeVisible();
    await attendreTableau(page);

    await page.locator('.barre-filtres input').first().fill(VILLE);
    if ((await ligneTableau(page, VILLE).count()) === 0) {
        await page.getByRole('button', { name: 'Nouvelle Ville' }).click();
        const dialog = dialogVisible(page, 'Nouvelle ville');
        await expect(dialog.getByRole('button', { name: 'Créer' })).toBeDisabled();
        await choisirDropdown(page, dropdownSousLabel(dialog, 'Région'), REGION);
        await champSousLabel(dialog, 'Libellé').fill(VILLE);
        await dialog.getByRole('button', { name: 'Créer' }).click();
        await attendreToastSucces(page, /créée/);
    }
    await page.locator('.barre-filtres input').first().fill(VILLE);
    const ligne = ligneTableau(page, VILLE);
    await expect(ligne).toBeVisible();
    await expect(ligne).toContainText(REGION);

    // Filtre par région : seule notre ville est rattachée à la région E2E
    await page.locator('.barre-filtres input').first().fill('');
    await choisirDropdown(page, page.locator('.barre-filtres .p-dropdown').first(), REGION);
    await expect(page.locator('.p-datatable-tbody > tr')).toHaveCount(1);
    await expect(page.locator('.p-datatable-tbody > tr').first()).toContainText(VILLE);
    await page.getByRole('button', { name: 'Effacer les filtres' }).click();
    await expect(page.locator('.p-datatable-tbody > tr').count().then((n) => n > 1)).resolves.toBe(true);
});

test('quartiers : ajout en lot avec cascade ville → commune et doublons ignorés', async ({ page }) => {
    await page.goto('/admin/quartiers');
    await expect(page.getByRole('heading', { name: 'Gestion des Quartiers' })).toBeVisible();

    await attendreTableau(page);
    // Libellés uniques par exécution (les quartiers n'ont pas de suppression) : pas de collision entre runs.
    // La commune est choisie dans le menu du dialogue (peuplé par le référentiel), pas dans une ligne existante.
    await page.getByRole('button', { name: 'Ajout en lot' }).click();
    const dialog = dialogVisible(page, /Ajout en lot/);
    await expect(dialog.getByRole('button', { name: /^Créer/ })).toBeDisabled();
    const commune = await choisirPremiereOption(page, dropdownSousLabel(dialog, /^Commune/));
    expect(commune).not.toBe('');

    const saisie = dialog.locator('.tags-saisie input');
    const suffixe = Date.now().toString(36);
    await saisie.fill(`ZZ E2E Quartier ${suffixe} A`);
    await saisie.press('Enter');
    await saisie.fill(`ZZ E2E Quartier ${suffixe} B`);
    await saisie.press('Enter');
    await expect(dialog.locator('.tag-libelle')).toHaveCount(2);
    // Un libellé en double dans la saisie n'est ajouté qu'une fois
    await saisie.fill(`zz e2e quartier ${suffixe} a`);
    await saisie.press('Enter');
    await expect(dialog.locator('.tag-libelle')).toHaveCount(2);

    await dialog.getByRole('button', { name: /^Créer 2/ }).click();
    await expect(dialog.locator('.lot-lignes li')).toHaveCount(2);
    await expect(dialog.locator('.lot-lignes li.lot-attente')).toHaveCount(0, { timeout: 30_000 });
    await expect(dialog.locator('.lot-lignes li.lot-erreur')).toHaveCount(0);
    await attendreToastSucces(page);
    await dialog.getByRole('button', { name: 'Fermer' }).click();

    await page.locator('.barre-filtres input').first().fill(`ZZ E2E Quartier ${suffixe}`);
    await expect(page.locator('.p-datatable-tbody > tr')).toHaveCount(2);
});

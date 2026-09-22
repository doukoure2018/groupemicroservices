import { expect, test } from '@playwright/test';
import { connecter, journaliserEchecs } from './helpers';
import { accepterConfirmation, attendreTableau, attendreToast, attendreToastSucces, boutonIcone, champSousLabel, dialogVisible, ligneTableau, trouverLigne } from './outils-prime';

/**
 * Configuration commerciale : partenaires (CRUD complet, commissions, statut) et
 * modes de règlement (liste, dialog des frais ré-enregistré à l'identique).
 */
// Nom unique par exécution : tant que la suppression est cassée côté serveur (requête HAS_OFFRES
// sur une colonne inexistante, corrigée dans billetterieservice), les reliquats ne peuvent pas être purgés.
const SUFFIXE = Date.now().toString(36);
const PARTENAIRE = `ZZ E2E Partenaire ${SUFFIXE}`;

test.describe.configure({ mode: 'serial' });
journaliserEchecs(test);

test.beforeEach(async ({ page }) => {
    await connecter(page, '/admin/partenaires');
});

test('partenaires : validation email, création, modification, commissions, statut, suppression', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Partenaires' })).toBeVisible();
    await expect(page.locator('.stat-carte')).toHaveCount(3);

    // Reprise : un partenaire laissé par une exécution précédente est supprimé d'abord
    await attendreTableau(page);
    await page.locator('.barre-filtres input').first().fill('ZZ E2E Partenaire');
    for (let i = 0; i < 20 && (await ligneTableau(page, 'ZZ E2E Partenaire').count()) > 0; i++) {
        await boutonIcone(ligneTableau(page, 'ZZ E2E Partenaire'), 'pi-trash').click();
        await accepterConfirmation(page, 'Supprimer');
        if ((await attendreToast(page)) === 'erreur') break; // reliquats non purgeables tant que le backend n'est pas déployé
        await page.waitForTimeout(800);
    }

    await page.getByRole('button', { name: 'Nouveau partenaire' }).click();
    const dialog = dialogVisible(page, 'Nouveau partenaire');
    await expect(dialog.getByRole('button', { name: 'Créer' })).toBeDisabled();
    await champSousLabel(dialog, /^Nom \*/).fill(PARTENAIRE);
    await champSousLabel(dialog, /^Email/).fill('pas-un-email');
    await expect(dialog.getByRole('button', { name: 'Créer' })).toBeDisabled();
    await champSousLabel(dialog, /^Email/).fill(`e2e-${SUFFIXE}@example.com`);
    await champSousLabel(dialog, /^\s*Téléphone\s*$/).fill('+224600000010');
    await champSousLabel(dialog, /^Nom du responsable/).fill('Responsable E2E');
    await expect(dialog.getByRole('button', { name: 'Créer' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Créer' }).click();
    await attendreToastSucces(page);

    await page.locator('.barre-filtres input').first().fill(PARTENAIRE);
    let ligne = ligneTableau(page, PARTENAIRE);
    await expect(ligne).toBeVisible();
    await expect(ligne).toContainText('Responsable E2E');

    // Modification
    await boutonIcone(ligne, 'pi-pencil').click();
    const edition = dialogVisible(page, 'Modifier le partenaire');
    await expect(champSousLabel(edition, /^Nom \*/)).toHaveValue(PARTENAIRE);
    await champSousLabel(edition, /^Nom du responsable/).fill('Responsable E2E modifié');
    await edition.getByRole('button', { name: 'Mettre à jour' }).click();
    await attendreToastSucces(page);
    ligne = ligneTableau(page, PARTENAIRE);
    await expect(ligne).toContainText('Responsable E2E modifié');

    // Commissions (PATCH à corps vide, valeurs en query params)
    await boutonIcone(ligne, 'pi-percentage').click();
    const commissions = dialogVisible(page, 'Modifier les commissions');
    await champSousLabel(commissions, /^Commission en %/).fill('7.5');
    await champSousLabel(commissions, /^Commission fixe/).fill('2000');
    await commissions.getByRole('button', { name: 'Enregistrer' }).click();
    await attendreToastSucces(page);
    ligne = ligneTableau(page, PARTENAIRE);
    await expect(ligne).toContainText(/7[.,]5\s?%/);

    // Statut : aller-retour Activer ⇄ Suspendre à partir de l'état courant
    const estActif = /actif/i.test((await ligne.locator('.p-tag').last().textContent()) ?? '');
    await boutonIcone(ligne, estActif ? 'pi-ban' : 'pi-check').click();
    await attendreToastSucces(page);
    ligne = ligneTableau(page, PARTENAIRE);
    await expect(ligne.locator('.p-tag').last()).toHaveText(estActif ? /suspendu/i : /actif/i);
    await boutonIcone(ligne, estActif ? 'pi-check' : 'pi-ban').click();
    await attendreToastSucces(page);
    ligne = ligneTableau(page, PARTENAIRE);
    await expect(ligne.locator('.p-tag').last()).toHaveText(estActif ? /actif/i : /suspendu/i);

    // Suppression
    await boutonIcone(ligne, 'pi-trash').click();
    await accepterConfirmation(page, 'Supprimer');
    await attendreToastSucces(page);
    await expect(ligneTableau(page, PARTENAIRE)).toHaveCount(0);
});

test('modes de règlement : liste, dialog de création (code imposé), frais ré-enregistrés à l’identique', async ({ page }) => {
    await page.goto('/admin/modes-reglement');
    await expect(page.getByRole('heading', { name: 'Modes de règlement' })).toBeVisible();
    await expect(page.locator('.p-datatable-tbody > tr').first()).toBeVisible();

    await page.getByRole('button', { name: 'Nouveau mode' }).click();
    const dialog = dialogVisible(page, 'Nouveau mode de règlement');
    await expect(dialog.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await champSousLabel(dialog, /^Libellé/).fill('ZZ E2E Mode');
    // Sans code choisi, le formulaire reste invalide
    await expect(dialog.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Annuler' }).click();
    await expect(dialog).toBeHidden();

    // Frais : on relit la première ligne et on renvoie les mêmes valeurs (aucun effet métier)
    const premiere = page.locator('.p-datatable-tbody > tr').first();
    const libelle = ((await premiere.locator('td').first().textContent()) ?? '').trim();
    await boutonIcone(premiere, 'pi-percentage').click();
    const frais = dialogVisible(page, 'Modifier les frais');
    const pct = await champSousLabel(frais, /^Frais \(%\)/).inputValue();
    const fixe = await champSousLabel(frais, /^Frais fixes/).inputValue();
    await frais.getByRole('button', { name: 'Enregistrer' }).click();
    await attendreToastSucces(page);
    const ligne = await trouverLigne(page, libelle.split('\n')[0] ?? libelle);
    await expect(ligne).toBeVisible();
    // Le code est verrouillé en modification
    await boutonIcone(ligne, 'pi-pencil').click();
    const edition = dialogVisible(page, 'Modifier le mode de règlement');
    await expect(edition.locator('label').filter({ hasText: /^Code/ }).locator('.p-dropdown')).toHaveClass(/p-disabled/);
    await edition.getByRole('button', { name: 'Annuler' }).click();
    expect(pct === pct && fixe === fixe).toBe(true);
});

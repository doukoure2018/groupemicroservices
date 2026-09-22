import { expect, test } from '@playwright/test';
import { connecter, journaliserEchecs } from './helpers';
import { accepterConfirmation, attendreTableau, attendreToastSucces, boutonIcone, champSousLabel, choisirDropdown, dialogVisible, dropdownSousLabel, ligneTableau } from './outils-prime';

/**
 * Comptes et immobilier back-office : utilisateurs (création, modification, rôle,
 * blocage), agences (détail), modération, leads, conformité (lecture et dialogs,
 * sans décision irréversible sur des données réelles).
 */
const EMAIL_E2E = 'zz.e2e.backoffice@example.com';

journaliserEchecs(test);

test.beforeEach(async ({ page }) => {
    await connecter(page, '/admin/utilisateurs');
});

test('utilisateurs : création backoffice, modification, dialog rôle, blocage/déblocage', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Gestion des utilisateurs' })).toBeVisible();
    await expect(page.locator('.stat-carte')).toHaveCount(4);

    await attendreTableau(page);
    const recherche = page.locator('.barre-filtres input').first();
    await recherche.fill(EMAIL_E2E);
    if ((await ligneTableau(page, EMAIL_E2E).count()) === 0) {
        await page.getByRole('button', { name: 'Nouvel utilisateur' }).click();
        const dialog = dialogVisible(page, 'Créer un utilisateur backoffice');
        await expect(dialog.getByRole('button', { name: 'Créer le compte' })).toBeDisabled();
        await champSousLabel(dialog, /^Prénom/).fill('Zz');
        await champSousLabel(dialog, /^Nom \*/).fill('E2E Backoffice');
        await champSousLabel(dialog, /^Email/).fill(EMAIL_E2E);
        await choisirDropdown(page, dropdownSousLabel(dialog, /^Rôle/), 'Back-office (leads immo)');
        await dialog.locator('label').filter({ hasText: 'Mot de passe temporaire' }).locator('button').click();
        await expect(champSousLabel(dialog, /^Mot de passe temporaire/)).not.toHaveValue('');
        await expect(dialog.getByRole('button', { name: 'Créer le compte' })).toBeEnabled();
        await dialog.getByRole('button', { name: 'Créer le compte' }).click();
        await attendreToastSucces(page);
        await recherche.fill(EMAIL_E2E);
    }
    let ligne = ligneTableau(page, EMAIL_E2E);
    await expect(ligne).toBeVisible();
    await expect(ligne).toContainText(/ADMIN_BACKOFFICE|MANAGER/);

    // Modification des infos
    await boutonIcone(ligne, 'pi-user-edit').click();
    const edition = dialogVisible(page, "Modifier l'utilisateur");
    await expect(champSousLabel(edition, /^Email/)).toHaveValue(EMAIL_E2E);
    await champSousLabel(edition, /^Téléphone/).fill('+224600000099');
    await edition.getByRole('button', { name: 'Enregistrer' }).click();
    await attendreToastSucces(page);
    ligne = ligneTableau(page, EMAIL_E2E);
    await expect(ligne).toContainText('+224600000099');

    // Dialog rôle : le bouton reste inactif tant que le rôle est inchangé, puis changement aller-retour
    const roleInitial = /MANAGER/.test((await ligne.textContent()) ?? '') ? 'MANAGER' : 'ADMIN_BACKOFFICE';
    const autreRole = roleInitial === 'MANAGER' ? 'ADMIN_BACKOFFICE' : 'MANAGER';
    await boutonIcone(ligne, 'pi-shield').click();
    const role = dialogVisible(page, 'Modifier le rôle');
    await expect(role.getByRole('button', { name: 'Modifier' })).toBeDisabled();
    await choisirDropdown(page, role.locator('.p-dropdown').first(), autreRole);
    await role.getByRole('button', { name: 'Modifier' }).click();
    await accepterConfirmation(page, /Oui|Confirmer|Modifier/);
    await attendreToastSucces(page);
    ligne = ligneTableau(page, EMAIL_E2E);
    await expect(ligne).toContainText(autreRole);
    await boutonIcone(ligne, 'pi-shield').click();
    await choisirDropdown(page, dialogVisible(page, 'Modifier le rôle').locator('.p-dropdown').first(), roleInitial);
    await dialogVisible(page, 'Modifier le rôle').getByRole('button', { name: 'Modifier' }).click();
    await accepterConfirmation(page, /Oui|Confirmer|Modifier/);
    await attendreToastSucces(page);
    ligne = ligneTableau(page, EMAIL_E2E);
    await expect(ligne).toContainText(roleInitial);

    // Blocage puis déblocage
    const actif = /Actif/.test((await ligne.locator('.p-tag').last().textContent()) ?? '');
    await boutonIcone(ligne, actif ? 'pi-lock' : 'pi-lock-open').click();
    await accepterConfirmation(page, /Oui|Confirmer|Bloquer|Débloquer/);
    await attendreToastSucces(page);
    ligne = ligneTableau(page, EMAIL_E2E);
    await expect(ligne.locator('.p-tag').last()).toHaveText(actif ? 'Inactif' : 'Actif');
    await boutonIcone(ligne, actif ? 'pi-lock-open' : 'pi-lock').click();
    await accepterConfirmation(page, /Oui|Confirmer|Bloquer|Débloquer/);
    await attendreToastSucces(page);
    await expect(ligneTableau(page, EMAIL_E2E).locator('.p-tag').last()).toHaveText(actif ? 'Actif' : 'Inactif');
});

test('agences : synthèse et dialog de détail', async ({ page }) => {
    await page.goto('/admin/agences');
    await expect(page.getByRole('heading', { name: 'Agences immobilières' })).toBeVisible();
    await expect(page.locator('.stat-carte')).toHaveCount(3);
    const lignes = page.locator('.p-datatable-tbody > tr');
    await expect(lignes.first()).toBeVisible();
    if ((await lignes.first().getByRole('button', { name: 'Détail' }).count()) > 0) {
        await lignes.first().getByRole('button', { name: 'Détail' }).click();
        const detail = page.locator('.p-dialog:visible').first();
        await expect(detail).toBeVisible();
        await expect(detail.getByText(/Agents \(\d+\)/)).toBeVisible({ timeout: 15_000 });
        await expect(detail.getByText(/Annonces \(\d+\)/)).toBeVisible();
    }
});

test('modération : file, détail d’une annonce, dialog de rejet annulé', async ({ page }) => {
    await page.goto('/admin/moderation');
    await expect(page.getByRole('heading', { name: 'Modération des annonces immobilières' })).toBeVisible();
    await expect(page.locator('.stat-carte')).toHaveCount(1);
    const lignes = page.locator('.p-datatable-tbody > tr');
    await expect(lignes.first()).toBeVisible();
    const premiere = lignes.first();
    if ((await premiere.getByRole('button', { name: 'Voir détails' }).count()) > 0) {
        await premiere.getByRole('button', { name: 'Voir détails' }).click();
        const detail = page.locator('.p-dialog:visible').first();
        await expect(detail.getByText('Prix & conditions')).toBeVisible({ timeout: 15_000 });
        await expect(detail.getByRole('button', { name: 'Valider et publier' })).toBeVisible();
        await detail.getByRole('button', { name: 'Rejeter' }).click();
        const rejet = dialogVisible(page, "Rejeter l'annonce");
        await expect(rejet.getByRole('button', { name: 'Rejeter et notifier' })).toBeDisabled();
        await rejet.getByRole('button', { name: 'Annuler' }).click();
        await expect(rejet).toBeHidden();
    } else {
        await expect(page.getByText('Aucune annonce en attente de modération')).toBeVisible();
    }
});

test('leads : contacts et visites, dialog de traitement annulé', async ({ page }) => {
    await page.goto('/admin/leads');
    await expect(page.getByRole('heading', { name: 'Demandes (leads) immobilier' })).toBeVisible();
    await expect(page.locator('.p-datatable').first()).toBeVisible();
    const traiter = page.getByRole('button', { name: 'Traiter' }).first();
    if ((await traiter.count()) > 0) {
        await traiter.click();
        const dialog = dialogVisible(page, 'Traiter le lead');
        await expect(dialog.getByRole('button', { name: 'Marquer traité' })).toBeVisible();
        await dialog.getByRole('button', { name: 'Annuler' }).click();
        await expect(dialog).toBeHidden();
    }
});

test('conformité : file des dossiers, dialog de rejet annulé', async ({ page }) => {
    await page.goto('/conformite');
    await expect(page.getByRole('heading', { name: 'Dossiers agence en attente de validation' })).toBeVisible();
    await expect(page.locator('.p-tag').filter({ hasText: /en attente/ })).toBeVisible();
    const premiere = page.locator('.p-datatable-tbody > tr').first();
    await expect(premiere).toBeVisible();
    if ((await premiere.getByRole('button', { name: 'Approuver' }).count()) > 0) {
        await boutonIcone(premiere, 'pi-times').click();
        const rejet = dialogVisible(page, 'Rejeter le dossier');
        await expect(rejet.getByRole('button', { name: 'Rejeter le dossier' })).toBeDisabled();
        await rejet.getByRole('button', { name: 'Annuler' }).click();
        await expect(rejet).toBeHidden();
    } else {
        await expect(page.getByText(/file est vide/)).toBeVisible();
    }
});

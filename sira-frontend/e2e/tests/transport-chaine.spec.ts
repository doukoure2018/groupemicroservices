import { expect, test, type Page } from '@playwright/test';
import { apiConnectee, assurerVilleE2E, lireData } from './api';
import { connecter, journaliserEchecs } from './helpers';
import {
    accepterConfirmation,
    attendreToast,
    attendreToastSucces,
    boutonIcone,
    champSousLabel,
    choisirDropdown,
    choisirPremiereOption,
    dateFr,
    dateIso,
    dialogVisible,
    dropdownSousLabel,
    attendreTableau,
    ligneTableau,
    ouvrirDropdown,
    trouverLigne
} from './outils-prime';

/**
 * Chaîne transport de bout en bout, dans l'ordre métier :
 * site → point de départ → point d'arrivée → trajet → type de véhicule → véhicule
 * → offre (transitions, promotion) → recherche publique → réservation → mes voyages
 * → annulation → annulation de l'offre. Tout est préfixé « ZZ E2E » et réutilisé
 * d'une exécution à l'autre.
 */
const REGION = 'ZZ E2E Région';
const VILLE = 'ZZ E2E Ville';
const SITE = 'ZZ E2E Gare';
const DEPART = 'ZZ E2E Départ';
const ARRIVEE = 'ZZ E2E Arrivée';
const TRAJET = 'ZZ E2E Trajet';
const TYPE_VEHICULE = 'ZZ E2E Type';
const IMMAT = 'E2E-0001';
const DATE_OFFRE = dateIso(45);

test.describe.configure({ mode: 'serial' });
journaliserEchecs(test);

test.beforeAll(async ({ baseURL }) => {
    const ctx = await apiConnectee(baseURL!);
    await assurerVilleE2E(ctx, REGION, VILLE);
    await ctx.dispose();
});

test.beforeEach(async ({ page }) => {
    await connecter(page, '/admin');
});

test('site : validation email, création rattachée à la ville et à une localisation', async ({ page }) => {
    await page.goto('/admin/sites');
    await expect(page.getByRole('heading', { name: 'Sites & Gares' })).toBeVisible();
    await attendreTableau(page);
    await page.locator('.barre-filtres input').first().fill(SITE);
    if ((await ligneTableau(page, SITE).count()) === 0) {
        await page.getByRole('button', { name: 'Nouveau site' }).click();
        const dialog = dialogVisible(page, 'Nouveau site');
        await expect(dialog.getByRole('button', { name: 'Créer' })).toBeDisabled();
        await choisirDropdown(page, dropdownSousLabel(dialog, /^Ville/), VILLE);
        await choisirPremiereOption(page, dropdownSousLabel(dialog, /^Localisation/));
        await champSousLabel(dialog, 'Nom du site').fill(SITE);
        await champSousLabel(dialog, /^Email/).fill('pas-un-email');
        await expect(dialog.getByRole('button', { name: 'Créer' })).toBeDisabled();
        await champSousLabel(dialog, /^Email/).fill('');
        await champSousLabel(dialog, /^Téléphone/).fill('+224600000001');
        await expect(dialog.getByRole('button', { name: 'Créer' })).toBeEnabled();
        await dialog.getByRole('button', { name: 'Créer' }).click();
        await attendreToastSucces(page);
    }
    await page.locator('.barre-filtres input').first().fill(SITE);
    const ligne = ligneTableau(page, SITE);
    await expect(ligne).toBeVisible();
    await expect(ligne).toContainText(VILLE);
    await expect(ligne.locator('.p-tag').filter({ hasText: 'Actif' })).toBeVisible();
});

test('points de départ : création sur le site, suppression d’un point temporaire', async ({ page }) => {
    await page.goto('/admin/departs');
    await expect(page.getByRole('heading', { name: 'Points de départ' })).toBeVisible();
    await attendreTableau(page);
    await page.locator('.barre-filtres input').first().fill(DEPART);
    if ((await ligneTableau(page, DEPART).count()) === 0) {
        await page.getByRole('button', { name: 'Nouveau départ' }).click();
        const dialog = dialogVisible(page, 'Nouveau point de départ');
        await choisirDropdown(page, dropdownSousLabel(dialog, /^Site/), SITE);
        await champSousLabel(dialog, /^Libellé/).fill(DEPART);
        await dialog.getByRole('button', { name: 'Créer' }).click();
        await attendreToastSucces(page);
    }
    await page.locator('.barre-filtres input').first().fill(DEPART);
    await expect(ligneTableau(page, DEPART)).toContainText(SITE);

    // Filtre par site : seul notre départ y est rattaché (ou au moins il y figure)
    await page.locator('.barre-filtres input').first().fill('');
    await choisirDropdown(page, page.locator('.barre-filtres .p-dropdown').first(), SITE);
    await expect(ligneTableau(page, DEPART)).toBeVisible();
    await page.getByRole('button', { name: 'Effacer filtres' }).click();

    // Cycle complet sur un point temporaire : création puis suppression (reliquat purgé d'abord)
    const TEMP = 'ZZ E2E Départ temporaire';
    await page.locator('.barre-filtres input').first().fill(TEMP);
    while ((await ligneTableau(page, TEMP).count()) > 0) {
        await boutonIcone(ligneTableau(page, TEMP), 'pi-trash').click();
        await accepterConfirmation(page, 'Supprimer');
        await attendreToastSucces(page);
        await expect(ligneTableau(page, TEMP)).toHaveCount(0);
    }
    await page.locator('.barre-filtres input').first().fill('');
    await page.getByRole('button', { name: 'Nouveau départ' }).click();
    const dialog = dialogVisible(page, 'Nouveau point de départ');
    await choisirDropdown(page, dropdownSousLabel(dialog, /^Site/), SITE);
    await champSousLabel(dialog, /^Libellé/).fill(TEMP);
    await dialog.getByRole('button', { name: 'Créer' }).click();
    await attendreToastSucces(page);
    await page.locator('.barre-filtres input').first().fill(TEMP);
    await boutonIcone(ligneTableau(page, TEMP), 'pi-trash').click();
    await accepterConfirmation(page, 'Supprimer');
    await attendreToastSucces(page);
    await expect(ligneTableau(page, TEMP)).toHaveCount(0);
});

test('points d’arrivée : refus du même site, création vers un autre site', async ({ page, baseURL }) => {
    const ctx = await apiConnectee(baseURL!);
    const { sites } = await lireData<{ sites: Array<{ nom: string; actif?: boolean }> }>(ctx, '/billetterie/sites');
    await ctx.dispose();
    const autreSite = sites.find((s) => s.nom !== SITE && s.actif !== false)?.nom;
    expect(autreSite, 'il faut au moins un autre site actif').toBeTruthy();

    await page.goto('/admin/arrivees');
    await expect(page.getByRole('heading', { name: "Points d'arrivée" })).toBeVisible();
    await attendreTableau(page);
    await page.locator('.barre-filtres input').first().fill(ARRIVEE);
    if ((await ligneTableau(page, ARRIVEE).count()) === 0) {
        await page.getByRole('button', { name: 'Nouvelle arrivée' }).click();
        const dialog = dialogVisible(page, "Nouveau point d'arrivée");
        await choisirDropdown(page, dropdownSousLabel(dialog, /^Point de départ/), DEPART);
        await champSousLabel(dialog, /^Libellé \*/).fill(ARRIVEE);
        // Le site du départ choisi est exclu de la liste des sites d'arrivée
        const siteDd = dropdownSousLabel(dialog, /^Site d'arrivée/);
        const panel = await ouvrirDropdown(page, siteDd);
        await panel.locator('input.p-dropdown-filter').fill(SITE);
        await expect(panel.locator('li.p-dropdown-item')).toHaveCount(0);
        // (Échap fermerait le Dialog entier : on referme le panneau par son déclencheur)
        await siteDd.locator('.p-dropdown-trigger').click();
        await expect(panel).toBeHidden();
        await expect(dialog.getByRole('button', { name: 'Créer' })).toBeDisabled();
        await choisirDropdown(page, siteDd, autreSite!);
        await expect(dialog.getByRole('button', { name: 'Créer' })).toBeEnabled();
        await dialog.getByRole('button', { name: 'Créer' }).click();
        await attendreToastSucces(page);
    }
    await page.locator('.barre-filtres input').first().fill(ARRIVEE);
    await expect(ligneTableau(page, ARRIVEE)).toContainText(DEPART);
});

test('trajets : arrivées filtrées par départ, création, modification', async ({ page }) => {
    await page.goto('/admin/trajets');
    await expect(page.getByRole('heading', { name: 'Trajets' })).toBeVisible();
    const existe = (await trouverLigne(page, TRAJET).catch(() => null)) !== null;
    if (!existe) {
        await page.getByRole('button', { name: 'Nouveau trajet' }).click();
        const dialog = dialogVisible(page, 'Nouveau trajet');
        const arriveeDd = dropdownSousLabel(dialog, /^Point d'arrivée/);
        await expect(arriveeDd).toHaveClass(/p-disabled/);
        await choisirDropdown(page, dropdownSousLabel(dialog, /^Point de départ/), DEPART);
        await expect(arriveeDd).not.toHaveClass(/p-disabled/);
        await choisirDropdown(page, arriveeDd, ARRIVEE);
        await champSousLabel(dialog, 'Libellé du trajet').fill(TRAJET);
        await champSousLabel(dialog, 'Durée estimée').fill('120');
        await champSousLabel(dialog, 'Montant de base').fill('50000');
        await dialog.getByRole('button', { name: 'Enregistrer' }).click();
        await attendreToastSucces(page);
    }
    const ligne = await trouverLigne(page, TRAJET);
    await expect(ligne).toContainText('50');
    await boutonIcone(ligne, 'pi-pencil').click();
    const edition = dialogVisible(page, 'Modifier le trajet');
    await expect(champSousLabel(edition, 'Libellé du trajet')).toHaveValue(TRAJET);
    await champSousLabel(edition, 'Distance').fill('250');
    await edition.getByRole('button', { name: 'Enregistrer' }).click();
    await attendreToastSucces(page);
    await expect(await trouverLigne(page, TRAJET)).toContainText('250');
});

test('types de véhicules : cohérence des capacités, création, suppression d’un type temporaire', async ({ page }) => {
    await page.goto('/admin/types-vehicules');
    await expect(page.getByRole('heading', { name: 'Types de véhicules' })).toBeVisible();
    const existe = (await trouverLigne(page, TYPE_VEHICULE).catch(() => null)) !== null;
    if (!existe) {
        await page.getByRole('button', { name: 'Nouveau type' }).click();
        const dialog = dialogVisible(page, 'Nouveau type de véhicule');
        await champSousLabel(dialog, /^Libellé/).fill(TYPE_VEHICULE);
        await champSousLabel(dialog, 'Capacité minimale').fill('20');
        await champSousLabel(dialog, 'Capacité maximale').fill('10');
        await expect(dialog.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
        await champSousLabel(dialog, 'Capacité minimale').fill('2');
        await champSousLabel(dialog, 'Capacité maximale').fill('8');
        await dialog.getByRole('button', { name: 'Enregistrer' }).click();
        await attendreToastSucces(page);
    }
    await expect(await trouverLigne(page, TYPE_VEHICULE)).toBeVisible();

    const TEMP = 'ZZ E2E Type temporaire';
    while ((await ligneTableau(page, TEMP).count()) > 0) {
        await boutonIcone(ligneTableau(page, TEMP), 'pi-trash').click();
        await accepterConfirmation(page, 'Supprimer');
        await attendreToastSucces(page);
        await expect(ligneTableau(page, TEMP)).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Nouveau type' }).click();
    const dialog = dialogVisible(page, 'Nouveau type de véhicule');
    await champSousLabel(dialog, /^Libellé/).fill(TEMP);
    await dialog.getByRole('button', { name: 'Enregistrer' }).click();
    await attendreToastSucces(page);
    await boutonIcone(await trouverLigne(page, TEMP), 'pi-trash').click();
    await accepterConfirmation(page, 'Supprimer');
    await attendreToastSucces(page);
    await expect(ligneTableau(page, TEMP)).toHaveCount(0);
});

test('véhicules : création et transitions de statut (maintenance → remise en service)', async ({ page }) => {
    await page.goto('/admin/vehicules');
    await expect(page.getByRole('heading', { name: 'Véhicules' })).toBeVisible();
    let ligne = await trouverLigne(page, IMMAT).catch(() => null);
    if (!ligne) {
        await page.getByRole('button', { name: 'Nouveau véhicule' }).click();
        const dialog = dialogVisible(page, 'Nouveau véhicule');
        await expect(dialog.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
        await champSousLabel(dialog, /^Immatriculation/).fill(IMMAT);
        await choisirDropdown(page, dropdownSousLabel(dialog, /^Type de véhicule/), TYPE_VEHICULE);
        await champSousLabel(dialog, /^Marque/).fill('Toyota');
        await champSousLabel(dialog, /^Modèle/).fill('Hiace E2E');
        await champSousLabel(dialog, /^Nombre de places/).fill('4');
        await champSousLabel(dialog, /^Nom du chauffeur/).fill('Chauffeur E2E');
        await champSousLabel(dialog, /^Contact du chauffeur/).fill('+224600000002');
        await champSousLabel(dialog, /^Expiration assurance/).fill(dateIso(365));
        await champSousLabel(dialog, /^Expiration visite technique/).fill(dateIso(365));
        await dialog.getByRole('button', { name: 'Enregistrer' }).click();
        await attendreToastSucces(page);
        ligne = await trouverLigne(page, IMMAT);
    }
    await expect(ligne).toContainText(TYPE_VEHICULE);

    // Remet le véhicule à l'état ACTIF quel que soit son état de départ
    const statut = ligne.locator('.p-tag');
    if (!/^Actif$/.test(((await statut.textContent()) ?? '').trim())) {
        await boutonIcone(ligne, 'pi-check').or(boutonIcone(ligne, 'pi-power-off')).first().click();
        await attendreToastSucces(page);
        ligne = await trouverLigne(page, IMMAT);
    }
    await expect(ligne.locator('.p-tag')).toHaveText('Actif');
    await boutonIcone(ligne, 'pi-wrench').click();
    await attendreToastSucces(page);
    ligne = await trouverLigne(page, IMMAT);
    await expect(ligne.locator('.p-tag')).toHaveText('En maintenance');
    await boutonIcone(ligne, 'pi-check').click();
    await attendreToastSucces(page);
    ligne = await trouverLigne(page, IMMAT);
    await expect(ligne.locator('.p-tag')).toHaveText('Actif');
});

async function ligneOffreE2E(page: Page) {
    // Ligne de l'offre E2E VIVANTE : on ignore les offres annulées laissées par les runs précédents
    // (même ville, même date), sinon la réutilisation tomberait sur une offre en état terminal.
    await attendreTableau(page);
    const cible = new RegExp(`${VILLE}[\\s\\S]*${dateFr(DATE_OFFRE)}`);
    for (let passe = 0; passe < 3; passe++) {
        const premiere = page.locator('.p-paginator-first').first();
        if ((await premiere.count()) && (await premiere.isEnabled())) await premiere.click();
        for (let i = 0; i < 30; i++) {
            await expect(page.locator('.p-datatable-loading-overlay')).toHaveCount(0);
            const ligne = page.locator('.p-datatable-tbody > tr').filter({ hasText: cible }).filter({ hasNotText: 'Annulée' }).first();
            if ((await ligne.count()) > 0) return ligne;
            const suivant = page.locator('.p-paginator-next').first();
            if (!(await suivant.count()) || !(await suivant.isEnabled())) break;
            await suivant.click();
        }
        await page.waitForTimeout(1000);
    }
    throw new Error(`Aucune offre E2E vivante (${VILLE}, ${dateFr(DATE_OFFRE)})`);
}

test('offres : création, ouverture, promotion appliquée puis retirée', async ({ page }) => {
    await page.goto('/admin/offres');
    await expect(page.getByRole('heading', { name: 'Offres de transport' })).toBeVisible();
    let ligne = await ligneOffreE2E(page).catch(() => null);
    if (!ligne) {
        await page.getByRole('button', { name: 'Nouvelle offre' }).click();
        const dialog = dialogVisible(page, 'Nouvelle offre');
        await expect(dialog.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
        await choisirDropdown(page, dropdownSousLabel(dialog, /^Trajet/), TRAJET);
        await choisirDropdown(page, dropdownSousLabel(dialog, /^Véhicule/), IMMAT);
        await champSousLabel(dialog, 'Date de départ').fill(DATE_OFFRE);
        await champSousLabel(dialog, 'Heure de départ').fill('08:00');
        await champSousLabel(dialog, 'Nombre de places').fill('4');
        await champSousLabel(dialog, /^Montant/).fill('50000');
        await dialog.getByRole('button', { name: 'Enregistrer' }).click();
        await attendreToastSucces(page);
        ligne = await ligneOffreE2E(page);
    }
    await expect(ligne).toContainText(IMMAT);

    // Ouverture si nécessaire (EN_ATTENTE → OUVERT)
    if ((await boutonIcone(ligne, 'pi-play').count()) && /attente/i.test((await ligne.locator('.p-tag').textContent()) ?? '')) {
        await boutonIcone(ligne, 'pi-play').click();
        await attendreToastSucces(page);
        ligne = await ligneOffreE2E(page);
    }
    await expect(ligne.locator('.p-tag')).toHaveText(/ouvert/i);

    // Promotion : montant ≥ prix refusé, montant inférieur accepté
    if ((await boutonIcone(ligne, 'pi-tag').count()) === 0) {
        await boutonIcone(ligne, 'pi-percentage').click();
        await attendreToastSucces(page, /retirée/);
        ligne = await ligneOffreE2E(page);
    }
    await boutonIcone(ligne, 'pi-tag').click();
    const promo = dialogVisible(page, /^Promotion/);
    await promo.locator('input[type=number]').fill('50000');
    await expect(promo.getByRole('button', { name: 'Appliquer' })).toBeDisabled();
    await promo.locator('input[type=number]').fill('40000');
    await promo.getByRole('button', { name: 'Appliquer' }).click();
    await attendreToastSucces(page, /appliquée/);
    ligne = await ligneOffreE2E(page);
    await expect(ligne.locator('s')).toBeVisible();
    await expect(ligne).toContainText(/40[\s  ]?000/);
    await boutonIcone(ligne, 'pi-percentage').click();
    await attendreToastSucces(page, /retirée/);
    ligne = await ligneOffreE2E(page);
    await expect(ligne.locator('s')).toHaveCount(0);
});

test('parcours voyageur : recherche publique, réservation, billets, annulation', async ({ page, baseURL }) => {
    // La ville d'arrivée de l'offre de test dépend du site choisi pour l'arrivée : on la lit via l'API.
    const ctx = await apiConnectee(baseURL!);
    const { offres } = await lireData<{ offres: Array<{ villeDepartLibelle: string; villeArriveeLibelle: string; statut: string }> }>(ctx, '/billetterie/offres');
    await ctx.dispose();
    const villeArrivee = offres.find((o) => o.villeDepartLibelle === VILLE && o.statut === 'OUVERT')?.villeArriveeLibelle;
    expect(villeArrivee, 'une offre E2E ouverte doit exister').toBeTruthy();

    // Places déjà réservées sur l'offre avant ce parcours (exécutions précédentes incluses)
    await page.goto('/admin/offres');
    const placesAvant = Number(/(\d+)\/4/.exec((await (await ligneOffreE2E(page)).textContent()) ?? '')?.[1] ?? '0');

    await page.goto('/');
    const rechercher = page.getByRole('button', { name: 'Rechercher' });
    await expect(rechercher).toBeDisabled();
    await page.getByLabel(/Ville de départ/).selectOption({ label: VILLE });
    await page.getByLabel(/Ville d'arrivée/).selectOption({ label: VILLE });
    await expect(page.locator('p.error')).toContainText(/différente/);
    await expect(rechercher).toBeDisabled();
    await page.getByLabel(/Ville d'arrivée/).selectOption({ label: villeArrivee! });
    await expect(page.locator('p.error')).toHaveCount(0);
    await page.getByLabel('Date de départ').fill(DATE_OFFRE);
    await expect(rechercher).toBeEnabled();
    await rechercher.click();
    const offre = page.locator('li.offre').filter({ hasText: VILLE }).first();
    await expect(offre).toBeVisible({ timeout: 20_000 });
    await expect(offre).toContainText(dateFr(DATE_OFFRE));
    await offre.getByRole('button', { name: 'Réserver' }).click();
    await page.waitForURL(/\/reserver\//);

    await expect(page.getByRole('heading', { name: 'Finaliser la réservation' })).toBeVisible();
    const confirmer = page.getByRole('button', { name: 'Confirmer la réservation' });
    await expect(confirmer).toBeDisabled();
    await page.getByRole('button', { name: '+ Ajouter un passager' }).click();
    await expect(page.locator('fieldset.passager')).toHaveCount(2);
    await page.getByRole('button', { name: 'Retirer ce passager' }).last().click();
    await expect(page.locator('fieldset.passager')).toHaveCount(1);
    const passager = page.locator('fieldset.passager').first();
    await champSousLabel(passager, /^Nom/).fill('Doe');
    await champSousLabel(passager, /^Prénom/).fill('E2E');
    await champSousLabel(passager, /^Téléphone/).fill('+224600000003');
    await expect(confirmer).toBeDisabled();
    // Mode choisi explicitement : « Espèces » se règle hors de la plateforme, donc
    // la commande est confirmée sur-le-champ et les billets sont émis. Un mode en
    // ligne redirigerait vers le prestataire, parcours que ce test ne peut pas suivre.
    await page.locator('.modes label').filter({ hasText: 'Espèces' }).locator('input[type=radio]').check();
    await expect(page.locator('.bandeau-info')).toContainText(/Règlement sur place/);
    await expect(page.locator('.total-bar')).toContainText(/50[\s  ]?000/);
    await expect(confirmer).toBeEnabled();
    await confirmer.click();

    await expect(page.getByRole('heading', { name: /Réservation confirmée/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('li.billet')).toHaveCount(1);
    await expect(page.locator('li.billet svg')).toBeVisible();
    const numero = (await page.locator('p strong').first().textContent())?.trim() ?? '';
    expect(numero).not.toBe('');

    // L'offre côté admin reflète la place réservée
    await page.goto('/admin/offres');
    await expect(await ligneOffreE2E(page)).toContainText(`${placesAvant + 1}/4`);

    // Mes voyages : billets dépliables puis annulation
    await page.goto('/mes-voyages');
    const carte = page.locator('li.commande').filter({ hasText: numero }).first();
    await expect(carte).toBeVisible({ timeout: 20_000 });
    await carte.getByRole('button', { name: /Voir les billets \(1\)/ }).click();
    await expect(carte.locator('li.billet')).toHaveCount(1);
    await carte.getByRole('button', { name: 'Annuler la réservation' }).click();
    await carte.getByRole('button', { name: 'Non, conserver' }).click();
    await expect(carte.getByRole('button', { name: 'Annuler la réservation' })).toBeVisible();
    await carte.getByRole('button', { name: 'Annuler la réservation' }).click();
    await carte.getByRole('button', { name: 'Oui, annuler' }).click();
    await expect(carte.locator('.badge')).toHaveText(/annulée/i, { timeout: 20_000 });
    await expect(carte.getByRole('button', { name: 'Annuler la réservation' })).toHaveCount(0);

    await page.goto('/admin/offres');
    await expect(await ligneOffreE2E(page)).toContainText(`${placesAvant}/4`);
});

test('offres : annulation finale de l’offre de test', async ({ page }) => {
    // Le backend refuse d'annuler une offre qui a encore des réservations actives :
    // on annule d'abord toutes les réservations E2E restantes depuis « Mes voyages ».
    await page.goto('/mes-voyages');
    await expect(page.locator('li.commande, .etat-vide').first()).toBeVisible({ timeout: 20_000 });
    for (let i = 0; i < 10; i++) {
        const carte = page.locator('li.commande').filter({ hasText: VILLE }).filter({ has: page.getByRole('button', { name: 'Annuler la réservation' }) }).first();
        if ((await carte.count()) === 0) break;
        await carte.getByRole('button', { name: 'Annuler la réservation' }).click();
        await carte.getByRole('button', { name: 'Oui, annuler' }).click();
        await expect(carte.getByRole('button', { name: /Oui, annuler|Annuler la réservation/ })).toHaveCount(0, { timeout: 20_000 });
    }

    await page.goto('/admin/offres');
    const ligne = await ligneOffreE2E(page); // offre vivante (annulées ignorées)
    const cible = new RegExp(`${VILLE}[\\s\\S]*${dateFr(DATE_OFFRE)}`);
    await boutonIcone(ligne, 'pi-times').click();
    expect(await attendreToast(page)).toBe('succes');
    // Après annulation, plus aucune offre VIVANTE à cette date, et une ligne annulée est visible.
    await expect(page.locator('.p-datatable-tbody > tr').filter({ hasText: cible }).filter({ hasNotText: 'Annulée' })).toHaveCount(0);
    await expect(page.locator('.p-datatable-tbody > tr').filter({ hasText: cible }).filter({ hasText: 'Annulée' }).first()).toBeVisible();
});

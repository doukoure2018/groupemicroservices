import { expect, type Locator, type Page } from '@playwright/test';

/** Sélectionne une option dans un Dropdown PrimeReact (avec filtre) situé sous un label donné. */
export async function choisirDropdown(page: Page, dropdown: Locator, texte: string): Promise<void> {
    const panel = await ouvrirDropdown(page, dropdown);
    const filtre = panel.locator('input.p-dropdown-filter');
    if (await filtre.count()) await filtre.fill(texte);
    const item = panel.locator('li.p-dropdown-item').filter({ hasText: texte }).first();
    await expect(item).toBeVisible();
    await item.click();
    await expect(panel).toBeHidden();
}

/** Dropdown rendu à l'intérieur d'un <label>texte…</label> (convention des écrans admin). */
export function dropdownSousLabel(scope: Locator, label: string | RegExp): Locator {
    return scope.locator('label').filter({ hasText: label }).locator('.p-dropdown').first();
}

/** Champ input/textarea rendu à l'intérieur d'un <label>texte…</label>. */
export function champSousLabel(scope: Locator, label: string | RegExp): Locator {
    return scope.locator('label').filter({ hasText: label }).locator('input, textarea').first();
}

export function dialogVisible(page: Page, titre: string | RegExp): Locator {
    return page.locator('.p-dialog:visible').filter({ has: page.locator('.p-dialog-title').filter({ hasText: titre }) }).first();
}

/** Attend le Toast de succès PrimeReact et le ferme. */
export async function attendreToastSucces(page: Page, detail?: string | RegExp): Promise<void> {
    // Un toast en cours de disparition (classe -exit) n'est jamais pris en compte.
    let toast = page.locator('.p-toast-message-success:not(.p-toast-message-exit)');
    if (detail) toast = toast.filter({ hasText: detail });
    toast = toast.last();
    const erreur = page.locator('.p-toast-message-error:not(.p-toast-message-exit)').last();
    await expect(toast.or(erreur)).toBeVisible({ timeout: 20_000 });
    if (await erreur.isVisible().catch(() => false)) {
        throw new Error(`Toast d'erreur reçu au lieu du succès : ${((await erreur.textContent()) ?? '').trim()}`);
    }
    await toast.locator('.p-toast-icon-close').click({ timeout: 2000 }).catch(() => undefined);
}

export async function attendreToastErreur(page: Page): Promise<string> {
    const toast = page.locator('.p-toast-message-error:not(.p-toast-message-exit)').last();
    await expect(toast).toBeVisible({ timeout: 20_000 });
    const texte = (await toast.textContent()) ?? '';
    await toast.locator('.p-toast-icon-close').click({ timeout: 2000 }).catch(() => undefined);
    return texte;
}

/** Répond « Oui » / « Supprimer » à la ConfirmDialog PrimeReact. */
export async function accepterConfirmation(page: Page, libelle: string | RegExp = /^(Oui|Supprimer)$/): Promise<void> {
    const dialog = page.locator('.p-confirm-dialog:visible').last();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: libelle }).click();
    await expect(dialog).toBeHidden();
}

/** Ligne de DataTable contenant un texte. */
export function ligneTableau(page: Page, texte: string | RegExp): Locator {
    return page.locator('.p-datatable-tbody > tr').filter({ hasText: texte }).first();
}

/** Bouton icône-seule PrimeReact repéré par sa classe d'icône (pi-pencil, pi-lock…). */
export function boutonIcone(scope: Locator, icone: string): Locator {
    return scope.locator(`button:has(.${icone})`).first();
}

export function dateIso(joursDepuisAujourdhui: number): string {
    const d = new Date();
    d.setDate(d.getDate() + joursDepuisAujourdhui);
    return d.toISOString().slice(0, 10);
}

/** Date au format affiché par formatDateFr de @sira/core (ex. « ven. 30 oct. 2026 »). */
export function dateFr(iso: string): string {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Ouvre le panneau d'un Dropdown. Pendant `loading`, PrimeReact ignore le clic sur
 * le déclencheur : on réessaie jusqu'à ce que le panneau apparaisse.
 */
export async function ouvrirDropdown(page: Page, dropdown: Locator): Promise<Locator> {
    const panel = page.locator('.p-dropdown-panel:visible').last();
    for (let essai = 0; essai < 10; essai++) {
        await dropdown.locator('.p-dropdown-trigger').first().click();
        if (await panel.isVisible().catch(() => false)) return panel;
        await page.waitForTimeout(400);
        if (await panel.isVisible().catch(() => false)) return panel;
    }
    await expect(panel).toBeVisible();
    return panel;
}

/** Choisit la première option d'un Dropdown (sans filtre). */
export async function choisirPremiereOption(page: Page, dropdown: Locator): Promise<string> {
    const panel = await ouvrirDropdown(page, dropdown);
    const item = panel.locator('li.p-dropdown-item').first();
    await expect(item).toBeVisible();
    const texte = (await item.textContent()) ?? '';
    await item.click();
    await expect(panel).toBeHidden();
    return texte.trim();
}

/** Parcourt les pages d'une DataTable jusqu'à trouver une ligne contenant le texte. */
export async function trouverLigne(page: Page, texte: string | RegExp): Promise<Locator> {
    // Attend que le tableau ait fini de charger (lignes présentes ou message « vide »).
    await expect(page.locator('.p-datatable-tbody > tr')).not.toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('.p-datatable-loading-overlay')).toHaveCount(0);
    // Trois passes : la liste peut être en cours de rafraîchissement juste après une mutation.
    for (let passe = 0; passe < 3; passe++) {
        const premiere = page.locator('.p-paginator-first').first();
        if ((await premiere.count()) && (await premiere.isEnabled())) await premiere.click();
        for (let i = 0; i < 30; i++) {
            await expect(page.locator('.p-datatable-loading-overlay')).toHaveCount(0);
            const ligne = ligneTableau(page, texte);
            if ((await ligne.count()) > 0) return ligne;
            const suivant = page.locator('.p-paginator-next').first();
            if (!(await suivant.count()) || !(await suivant.isEnabled())) break;
            await suivant.click();
        }
        await page.waitForTimeout(1000);
    }
    throw new Error(`Aucune ligne contenant ${String(texte)}`);
}

/** Attend un Toast (succès ou erreur) et renvoie sa nature : utile quand le serveur peut légitimement refuser. */
export async function attendreToast(page: Page): Promise<'succes' | 'erreur'> {
    const toast = page.locator('.p-toast-message-success:not(.p-toast-message-exit), .p-toast-message-error:not(.p-toast-message-exit)').last();
    await expect(toast).toBeVisible({ timeout: 20_000 });
    const classes = (await toast.getAttribute('class')) ?? '';
    await toast.locator('.p-toast-icon-close').click({ timeout: 2000 }).catch(() => undefined);
    return classes.includes('success') ? 'succes' : 'erreur';
}

/**
 * Attend qu'une DataTable ait fini de charger (lignes ou message « vide »), sans exiger de ligne.
 * On attend d'abord que le tableau soit monté puis que l'overlay de chargement disparaisse : pendant
 * un refetch (après une mutation), le tbody est momentanément vide sans message « vide », ce qui
 * faisait expirer l'attente d'une ligne.
 */
export async function attendreTableau(page: Page): Promise<void> {
    await expect(page.locator('.p-datatable').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.p-datatable-loading-overlay')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('.p-datatable-tbody > tr, .p-datatable-emptymessage').first()).toBeVisible({ timeout: 20_000 });
}

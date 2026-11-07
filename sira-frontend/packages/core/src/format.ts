/** Helpers de formatage partagés web/mobile (montants GNF, durées, heures LocalTime). */

export function formatMontant(montant: number | undefined | null, devise = 'GNF'): string {
    if (montant === undefined || montant === null) return '-';
    return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: devise,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(montant);
}

export function formatDuree(minutes: number | undefined | null): string {
    if (!minutes) return '-';
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (heures === 0) return `${mins} min`;
    if (mins === 0) return `${heures}h`;
    return `${heures}h ${mins}min`;
}

export function formatDistance(km: number | undefined | null): string {
    if (!km) return '-';
    return `${km.toFixed(1)} km`;
}

/**
 * Dates et instants côté backend, tels que Jackson les sérialise ici :
 *
 *   LocalDate      → tableau [année, mois, jour]
 *   OffsetDateTime → nombre de secondes depuis 1970, avec décimales
 *   et parfois une chaîne ISO, selon le service et sa configuration.
 *
 * Les trois formes circulent réellement dans les réponses : une commande
 * porte `dateDepart` en tableau et `createdAt` en nombre. Tout ce qui lit une
 * date du serveur passe donc par ici plutôt que par `new Date(valeur)`, qui
 * ne sait pas lire un tableau, ni par `valeur.slice()`, qui casse sur un nombre.
 */
export type DateLocale = string | number | number[] | null | undefined;

function deuxChiffres(n: number): string {
    return String(n).padStart(2, '0');
}

function jourDeLaDate(d: Date): string | null {
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${deuxChiffres(d.getMonth() + 1)}-${deuxChiffres(d.getDate())}`;
}

/**
 * Instant en millisecondes depuis 1970, ou null si la valeur est inexploitable.
 * Un nombre inférieur à 10^11 est lu comme des secondes : une date en
 * millisecondes de cet ordre tomberait en 1973, ce qu'aucune donnée de la
 * plateforme ne contient.
 */
export function instantMs(valeur: DateLocale): number | null {
    if (valeur === null || valeur === undefined || valeur === '') return null;
    if (typeof valeur === 'number') {
        if (!Number.isFinite(valeur)) return null;
        return valeur < 1e11 ? Math.round(valeur * 1000) : Math.round(valeur);
    }
    if (Array.isArray(valeur)) {
        const [a, m, j, h, mi, s] = valeur;
        if (!a || !m || !j) return null;
        return new Date(a, m - 1, j, h ?? 0, mi ?? 0, s ?? 0).getTime();
    }
    const t = new Date(valeur).getTime();
    return Number.isNaN(t) ? null : t;
}

/** Jour civil AAAA-MM-JJ, quelle que soit la forme reçue ; null si inexploitable. */
export function jourIso(valeur: DateLocale): string | null {
    if (valeur === null || valeur === undefined || valeur === '') return null;
    if (Array.isArray(valeur)) {
        const [a, m, j] = valeur;
        if (!a || !m || !j) return null;
        return `${a}-${deuxChiffres(m)}-${deuxChiffres(j)}`;
    }
    if (typeof valeur === 'string') {
        const jour = valeur.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(jour)) return jour;
    }
    const ms = instantMs(valeur);
    return ms === null ? null : jourDeLaDate(new Date(ms));
}

export function formatDateFr(valeur: DateLocale): string {
    const jour = jourIso(valeur);
    if (!jour) return '-';
    // Date construite en heure locale : "new Date('2026-11-01')" vaut minuit UTC
    // et reculerait d'un jour dans les fuseaux à l'ouest.
    const [a, m, j] = jour.split('-').map(Number);
    const date = new Date(a!, m! - 1, j!);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * « sam. 8 nov. » : la date telle que le mobile la montre, sans zéro initial.
 * L'année n'apparaît que si elle n'est pas celle en cours (« sam. 2 janv. 2027 »).
 * Voir docs/charte-typographique-mobile.md, § 7.
 */
export function formatDateCourte(valeur: DateLocale, maintenant: Date = new Date()): string {
    const jour = jourIso(valeur);
    if (!jour) return '-';
    const [a, m, j] = jour.split('-').map(Number);
    const date = new Date(a!, m! - 1, j!);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        ...(date.getFullYear() !== maintenant.getFullYear() ? { year: 'numeric' as const } : {})
    });
}

/**
 * Heure côté backend = Java LocalTime, sérialisé selon le service en "HH:mm:ss",
 * en tableau [heure, minute, seconde] ou en objet {hour, minute}.
 */
export type HeureLocale = string | number[] | { hour?: number; minute?: number } | null | undefined;

export function formatHeure(heure: HeureLocale): string {
    if (!heure) return '-';
    if (Array.isArray(heure)) {
        const h = String(heure[0] ?? 0).padStart(2, '0');
        const m = String(heure[1] ?? 0).padStart(2, '0');
        return `${h}:${m}`;
    }
    if (typeof heure === 'string') return heure.substring(0, 5);
    if (typeof heure === 'object') {
        const h = String(heure.hour ?? 0).padStart(2, '0');
        const m = String(heure.minute ?? 0).padStart(2, '0');
        return `${h}:${m}`;
    }
    return '-';
}

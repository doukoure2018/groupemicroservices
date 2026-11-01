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
 * Date côté backend = Java LocalDate. Selon le service, elle arrive en
 * "AAAA-MM-JJ", en "AAAA-MM-JJTHH:mm:ss" ou en tableau [année, mois, jour] —
 * c'est ce dernier cas qui affichait « Invalid Date » quand on la traitait
 * comme une chaîne.
 */
export type DateLocale = string | number[] | null | undefined;

/** Jour civil AAAA-MM-JJ, quel que soit le format reçu ; null si la date est inexploitable. */
export function jourIso(valeur: DateLocale): string | null {
    if (!valeur) return null;
    if (Array.isArray(valeur)) {
        const [a, m, j] = valeur;
        if (!a || !m || !j) return null;
        return `${a}-${String(m).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
    }
    const jour = valeur.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour : null;
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

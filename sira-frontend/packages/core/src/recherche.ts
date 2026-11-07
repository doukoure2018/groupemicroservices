import type { HeureLocale } from './format.js';
import { getMontantEffectif, type Offre } from './offre.js';

/**
 * Recherche de voyages : qui voyage, tri, filtres et étiquettes des résultats.
 * Tout se calcule sur le client à partir de ce que la recherche publique
 * renvoie déjà ; le serveur reste le juge du prix et des places.
 */

/** Qui voyage, choisi sur l'accueil avant la recherche. */
export interface Voyageurs {
    adultes: number;
    enfants: number;
    /** Bagages en soute à déclarer, en plus de ce que chaque passager emporte. */
    bagages: number;
}

export const VOYAGEURS_DEFAUT: Voyageurs = { adultes: 1, enfants: 0, bagages: 0 };
/** Places par commande : la même borne que l'écran de réservation. */
export const PLACES_MAX = 8;
export const BAGAGES_MAX = 10;
/**
 * Âge à partir duquel on paie plein tarif, tel que le tarificateur du serveur
 * le fixe aujourd'hui (`billetterie.age-adulte`). Le devis renvoie la valeur
 * réelle ; celle-ci ne sert qu'avant le devis, dans la feuille des passagers.
 */
export const AGE_ADULTE_DEFAUT = 15;

export function nombrePlaces(v: Voyageurs): number {
    return v.adultes + v.enfants;
}

export function libelleVoyageurs(v: Voyageurs): string {
    const parts = [`${v.adultes} adulte${v.adultes > 1 ? 's' : ''}`];
    if (v.enfants > 0) parts.push(`${v.enfants} enfant${v.enfants > 1 ? 's' : ''}`);
    if (v.bagages > 0) parts.push(`${v.bagages} bagage${v.bagages > 1 ? 's' : ''}`);
    return parts.join(', ');
}

/** Relit des paramètres d'URL (chaînes) en bornant chaque compteur. */
export function voyageursDepuisParams(params: { adultes?: string; enfants?: string; bagages?: string }): Voyageurs {
    const lire = (s: string | undefined, min: number, max: number, defaut: number) => {
        const n = Number.parseInt(s ?? '', 10);
        if (Number.isNaN(n)) return defaut;
        return Math.min(max, Math.max(min, n));
    };
    const adultes = lire(params.adultes, 1, PLACES_MAX, 1);
    const enfants = lire(params.enfants, 0, PLACES_MAX - adultes, 0);
    const bagages = lire(params.bagages, 0, BAGAGES_MAX, 0);
    return { adultes, enfants, bagages };
}

// ---------------------------------------------------------------------------
// Dates (AAAA-MM-JJ en heure locale, jamais en UTC : un voyage part un jour
// civil, pas à un instant).

export function dateIsoLocale(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function aujourdhuiIso(): string {
    return dateIsoLocale(new Date());
}

export function ajouterJours(iso: string, jours: number): string {
    const [a, m, j] = iso.split('-').map(Number);
    const d = new Date(a ?? 1970, (m ?? 1) - 1, (j ?? 1) + jours);
    return dateIsoLocale(d);
}

export function dateDepuisIso(iso: string): Date {
    const [a, m, j] = iso.split('-').map(Number);
    return new Date(a ?? 1970, (m ?? 1) - 1, j ?? 1);
}

// ---------------------------------------------------------------------------
// Heures et durées

/** Minutes depuis minuit, quel que soit le format dans lequel le serveur sérialise une LocalTime. */
export function minutesDepuisMinuit(heure: HeureLocale): number | null {
    if (!heure) return null;
    if (Array.isArray(heure)) return (heure[0] ?? 0) * 60 + (heure[1] ?? 0);
    if (typeof heure === 'string') {
        const [h, m] = heure.split(':').map(Number);
        if (h === undefined || Number.isNaN(h)) return null;
        return h * 60 + (m && !Number.isNaN(m) ? m : 0);
    }
    if (typeof heure === 'object') return (heure.hour ?? 0) * 60 + (heure.minute ?? 0);
    return null;
}

function heureDepuisMinutes(minutes: number): string {
    const m = ((minutes % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Durée du voyage en minutes : celle du trajet, sinon déduite des heures (une arrivée avant le départ est le lendemain). */
export function dureeOffreMinutes(offre: Offre): number | null {
    if (offre.trajetDureeMinutes && offre.trajetDureeMinutes > 0) return offre.trajetDureeMinutes;
    const depart = minutesDepuisMinuit(offre.heureDepart);
    const arrivee = minutesDepuisMinuit(offre.heureArriveeEstimee);
    if (depart === null || arrivee === null) return null;
    const duree = arrivee - depart;
    return duree >= 0 ? duree : duree + 1440;
}

export interface ArriveeOffre {
    heure: string;
    /** Le voyage se termine le jour civil suivant celui du départ. */
    lendemain: boolean;
}

/** Heure d'arrivée affichée : départ + durée quand on la connaît, sinon l'estimation du serveur. */
export function arriveeOffre(offre: Offre): ArriveeOffre | null {
    const depart = minutesDepuisMinuit(offre.heureDepart);
    const duree = dureeOffreMinutes(offre);
    if (depart !== null && duree !== null) {
        return { heure: heureDepuisMinutes(depart + duree), lendemain: depart + duree >= 1440 };
    }
    const arrivee = minutesDepuisMinuit(offre.heureArriveeEstimee);
    if (arrivee === null) return null;
    return { heure: heureDepuisMinutes(arrivee), lendemain: depart !== null && arrivee < depart };
}

export function estComplete(offre: Offre): boolean {
    return (offre.nombrePlacesDisponibles ?? 0) <= 0;
}

/** Le libellé du type de véhicule tel que l'administration l'a saisi (Bus, Minibus, Taxi-brousse…). */
export function typeVehiculeOffre(offre: Offre): string {
    return offre.typeVehiculeLibelle?.trim() || 'Véhicule';
}

// ---------------------------------------------------------------------------
// Tri, filtres, étiquettes

export type TriOffres = 'depart' | 'prix' | 'duree';

export const TRIS_OFFRES: { code: TriOffres; libelle: string }[] = [
    { code: 'depart', libelle: 'Départ le plus tôt' },
    { code: 'prix', libelle: 'Prix le plus bas' },
    { code: 'duree', libelle: 'Durée la moins longue' }
];

export interface PlageHoraire {
    code: string;
    libelle: string;
    /** Heures, bornes [de, a[. */
    de: number;
    a: number;
}

export const PLAGES_HORAIRES: PlageHoraire[] = [
    { code: 'nuit', libelle: 'Avant 6 h', de: 0, a: 6 },
    { code: 'matin', libelle: '6 h – 12 h', de: 6, a: 12 },
    { code: 'apres-midi', libelle: '12 h – 18 h', de: 12, a: 18 },
    { code: 'soir', libelle: 'Après 18 h', de: 18, a: 24 }
];

export interface FiltresOffres {
    tri: TriOffres;
    plagesDepart: string[];
    plagesArrivee: string[];
    typesVehicule: string[];
}

export const FILTRES_DEFAUT: FiltresOffres = { tri: 'depart', plagesDepart: [], plagesArrivee: [], typesVehicule: [] };

export function nombreFiltresActifs(f: FiltresOffres): number {
    return (f.tri !== 'depart' ? 1 : 0) + (f.plagesDepart.length ? 1 : 0) + (f.plagesArrivee.length ? 1 : 0) + (f.typesVehicule.length ? 1 : 0);
}

function dansPlages(minutes: number | null, codes: string[]): boolean {
    if (codes.length === 0) return true;
    if (minutes === null) return false;
    const heure = minutes / 60;
    return PLAGES_HORAIRES.some((p) => codes.includes(p.code) && heure >= p.de && heure < p.a);
}

export function filtrerOffres(offres: Offre[], f: FiltresOffres): Offre[] {
    return offres.filter((o) => {
        if (!dansPlages(minutesDepuisMinuit(o.heureDepart), f.plagesDepart)) return false;
        if (f.plagesArrivee.length) {
            const arrivee = arriveeOffre(o);
            if (!dansPlages(arrivee ? minutesDepuisMinuit(arrivee.heure) : null, f.plagesArrivee)) return false;
        }
        if (f.typesVehicule.length && !f.typesVehicule.includes(typeVehiculeOffre(o))) return false;
        return true;
    });
}

/** Copie triée ; les voyages complets vont en fin de liste quel que soit le tri. */
export function trierOffres(offres: Offre[], tri: TriOffres): Offre[] {
    const cle = (o: Offre): number => {
        if (tri === 'prix') return getMontantEffectif(o);
        if (tri === 'duree') return dureeOffreMinutes(o) ?? Number.MAX_SAFE_INTEGER;
        return minutesDepuisMinuit(o.heureDepart) ?? Number.MAX_SAFE_INTEGER;
    };
    return [...offres].sort((a, b) => {
        const ca = estComplete(a) ? 1 : 0;
        const cb = estComplete(b) ? 1 : 0;
        if (ca !== cb) return ca - cb;
        return cle(a) - cle(b);
    });
}

/** Types de véhicule présents dans les résultats, pour proposer un filtre qui a un sens. */
export function typesVehiculePresents(offres: Offre[]): string[] {
    return [...new Set(offres.map(typeVehiculeOffre))].sort((a, b) => a.localeCompare(b, 'fr'));
}

export const ETIQUETTE_MOINS_CHER = 'Le moins cher';
export const ETIQUETTE_PLUS_RAPIDE = 'Le plus rapide';

/**
 * Étiquettes par offre (clé : offreUuid) parmi les voyages encore ouverts.
 * Rien tant qu'il n'y a pas au moins deux voyages à comparer ; les ex æquo
 * portent tous l'étiquette.
 */
export function etiquettesOffres(offres: Offre[]): Map<string, string[]> {
    const resultat = new Map<string, string[]>();
    const ouvertes = offres.filter((o) => !estComplete(o) && o.offreUuid);
    if (ouvertes.length < 2) return resultat;

    const prixMin = Math.min(...ouvertes.map(getMontantEffectif));
    const durees = ouvertes.map(dureeOffreMinutes).filter((d): d is number => d !== null);
    const dureeMin = durees.length ? Math.min(...durees) : null;

    for (const o of ouvertes) {
        const etiquettes: string[] = [];
        if (getMontantEffectif(o) === prixMin) etiquettes.push(ETIQUETTE_MOINS_CHER);
        if (dureeMin !== null && dureeOffreMinutes(o) === dureeMin) etiquettes.push(ETIQUETTE_PLUS_RAPIDE);
        if (etiquettes.length) resultat.set(o.offreUuid!, etiquettes);
    }
    return resultat;
}

/** « sam. 31 oct. » — le jour tel que le bandeau de dates et les feuilles le nomment. */
export function libelleJourCourt(iso: string): string {
    return dateDepuisIso(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import type { ImageRequireSource } from 'react-native';

/**
 * L'univers courant : Voyager (le transport) ou Me loger (l'immobilier).
 * Un seul état, lu par l'aiguillage du démarrage, la barre d'onglets et le
 * sélecteur de l'en-tête ; retenu sur l'appareil, car l'application rouvre
 * le dernier univers utilisé et ne redemande jamais le choix du premier
 * lancement (docs/proposition-application-unique.md, § 3).
 */
export type Univers = 'voyager' | 'loger';

export const UNIVERS: Record<Univers, { libelle: string; accroche: string; accueil: '/(tabs)' | '/(tabs)/biens' }> = {
    voyager: {
        libelle: 'Voyager',
        accroche: 'Trouver un départ, réserver sa place, garder ses billets sur le téléphone.',
        accueil: '/(tabs)'
    },
    loger: {
        libelle: 'Me loger',
        accroche: 'Chercher un appartement, une villa ou un bureau, à louer ou à acheter, et publier le sien.',
        accueil: '/(tabs)/biens'
    }
};

/** L'emblème dit l'univers : le bus pour Voyager, les bâtiments (l'emblème de marque) pour Me loger. */
export const EMBLEMES: Record<Univers, ImageRequireSource> = {
    voyager: require('../assets/logo-trans-emblem.png'),
    loger: require('../assets/logo-emblem.png')
};

const CLE = 'synergia.univers';
let courant: Univers | null = null;
let pret = false;
let chargement: Promise<Univers | null> | null = null;
const abonnes = new Set<() => void>();

function prevenir() {
    abonnes.forEach((f) => f());
}
function abonner(f: () => void) {
    abonnes.add(f);
    return () => {
        abonnes.delete(f);
    };
}

/** Relit l'univers mémorisé ; une seule lecture, partagée par tous les appelants. */
export function chargerUnivers(): Promise<Univers | null> {
    if (pret) return Promise.resolve(courant);
    if (!chargement) {
        chargement = SecureStore.getItemAsync(CLE)
            .then((v) => (v === 'voyager' || v === 'loger' ? v : null))
            // Trousseau indisponible : on redemandera le choix, rien de pire.
            .catch(() => null)
            .then((v) => {
                courant = v;
                pret = true;
                prevenir();
                return v;
            });
    }
    return chargement;
}

/** Retient l'univers : tout de suite pour l'écran, durablement pour la prochaine ouverture. */
export function choisirUnivers(u: Univers): void {
    if (pret && courant === u) return;
    courant = u;
    pret = true;
    prevenir();
    SecureStore.setItemAsync(CLE, u).catch(() => undefined);
}

export function useUnivers(): { univers: Univers | null; pret: boolean } {
    const univers = useSyncExternalStore(abonner, () => courant, () => courant);
    const estPret = useSyncExternalStore(abonner, () => pret, () => pret);
    return { univers, pret: estPret };
}

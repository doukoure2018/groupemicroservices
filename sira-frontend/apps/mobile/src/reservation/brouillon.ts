import type { TypePassager } from '@sira/core';

export interface PassagerForm {
    typePassager: TypePassager;
    nom: string;
    prenom: string;
    telephone: string;
    pieceIdentite: string;
    /** JJ/MM/AAAA, saisie au clavier numérique. */
    naissance: string;
}

export interface BrouillonReservation {
    passagers: PassagerForm[];
    bagages: number;
    sieges: string[];
    contactEmail: string;
    contactTelephone: string;
    modeCode: string;
}

/**
 * Ce que le voyageur a déjà saisi dans le tunnel, le temps d'aller se
 * connecter et de revenir. Gardé en mémoire vive seulement : des noms et des
 * téléphones n'ont rien à faire sur le disque, et un brouillon n'a de sens
 * que dans la session en cours.
 */
const brouillons = new Map<string, BrouillonReservation>();

export function lireBrouillon(offreUuid: string): BrouillonReservation | undefined {
    return brouillons.get(offreUuid);
}

export function ecrireBrouillon(offreUuid: string, brouillon: BrouillonReservation): void {
    brouillons.set(offreUuid, brouillon);
}

export function effacerBrouillon(offreUuid: string): void {
    brouillons.delete(offreUuid);
}

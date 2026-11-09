import type { DonneesBrouillon } from '@sira/core';

/**
 * Ce que chaque étape de l'assistant exige avant de passer à la suivante.
 * Le serveur n'impose que le type d'annonce et le type de bien ; nous
 * demandons davantage, parce qu'une annonce sans prix, sans adresse ni titre
 * ne sert personne.
 */
export const ETAPES = [
    { numero: 1, titre: 'Le bien', question: 'Que proposez-vous ?' },
    { numero: 2, titre: 'Où', question: 'Où se trouve-t-il ?' },
    { numero: 3, titre: 'Prix et détails', question: 'À quel prix, et comment est-il ?' },
    { numero: 4, titre: 'Annonce', question: 'Comment le présenter ?' }
] as const;

export function manquesEtape(etape: number, d: DonneesBrouillon): string[] {
    const m: string[] = [];
    if (etape === 1) {
        if (!d.etape1?.typeAnnonce) m.push('louer ou vendre');
        if (d.etape1?.typeAnnonce === 'LOCATION' && !d.etape1?.dureeLocation) m.push('la durée de location');
        if (!d.etape1?.typeBienCode) m.push('le type de bien');
    }
    if (etape === 2) {
        if (!d.etape2?.adresseComplete?.trim()) m.push("l'adresse");
    }
    if (etape === 3) {
        if (!d.etape3?.prixSurDemande && !(d.etape3?.prix && d.etape3.prix > 0)) m.push('le prix, ou « prix sur demande »');
    }
    if (etape === 4) {
        if (!d.etape4?.titre?.trim()) m.push('le titre');
        if (!d.etape4?.nomContactPublic?.trim()) m.push('le nom affiché');
        if (!d.etape4?.telephoneContact?.trim()) m.push('le téléphone');
    }
    return m;
}

/** Un nombre lu d'un champ texte : les espaces et les points de milliers s'effacent. */
export function nombreDepuis(texte: string): number | undefined {
    const n = Number.parseFloat(texte.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : undefined;
}

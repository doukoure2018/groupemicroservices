/**
 * La référence du paiement que l'application vient d'envoyer chez le
 * prestataire. Le retour peut arriver par une adresse dépourvue de référence
 * — tous les prestataires ne la renvoient pas — et c'est alors ici qu'on la
 * retrouve. En mémoire vive seulement : elle n'a de sens que le temps de
 * l'aller-retour.
 */
let referenceEnCours: string | null = null;

export function retenirPaiementEnCours(reference: string): void {
    referenceEnCours = reference;
}

export function paiementEnCours(): string | null {
    return referenceEnCours;
}

export function oublierPaiementEnCours(): void {
    referenceEnCours = null;
}

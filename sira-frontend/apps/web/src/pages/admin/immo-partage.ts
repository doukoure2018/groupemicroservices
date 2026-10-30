import type { Propriete } from '@sira/core';

/** Suffixe de période affiché après un loyer. `UNIQUE` n'en produit aucun. */
const PERIODES: Record<string, string> = {
    PAR_MOIS: 'mois',
    PAR_JOUR: 'jour',
    PAR_SEMAINE: 'semaine',
    PAR_ANNEE: 'an',
    UNIQUE: ''
};

/**
 * Prix d'une annonce. `avecPeriode` ajoute « / mois » sur les locations, comme
 * l'écran de modération ; l'écran des leads l'omet.
 */
export function formatPrixImmo(p: Propriete, avecPeriode = true): string {
    if (p.prixSurDemande) return 'Prix sur demande';
    if (p.prix == null) return '—';
    const montant = new Intl.NumberFormat('fr-FR').format(p.prix);
    const base = `${montant} ${p.devise ?? 'GNF'}`;
    if (!avecPeriode || p.typeAnnonce !== 'LOCATION' || !p.periode) return base;
    const suffixe = PERIODES[p.periode] ?? p.periode.toLowerCase();
    return suffixe ? `${base} / ${suffixe}` : base;
}

/**
 * URL de la photo de couverture. La liste de modération privilégie la miniature,
 * le détail privilégie l'image pleine taille.
 */
export function photoPrincipale(p: Propriete, preference: 'url' | 'thumbnail'): string | null {
    const photo = p.photoCouverture ?? p.photos?.[0];
    if (!photo) return null;
    return preference === 'thumbnail' ? (photo.urlThumbnail ?? photo.url ?? null) : (photo.url ?? photo.urlThumbnail ?? null);
}

/** Lien de repérage sur une carte, seulement si la géolocalisation est renseignée. */
export function lienCarte(p: Propriete): string | null {
    if (p.latitude == null || p.longitude == null) return null;
    return `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
}

export function libelleTypeProfil(type: string | undefined): string {
    switch (type) {
        case 'PROPRIETAIRE_SIMPLE':
            return 'Propriétaire';
        case 'DEMARCHEUR':
            return 'Démarcheur';
        case 'AGENT_AGENCE':
            return 'Agent agence';
        default:
            return type || '—';
    }
}

export function severiteVerification(statut: string | undefined): 'success' | 'warning' | 'danger' | 'secondary' {
    switch (statut) {
        case 'VERIFIE':
            return 'success';
        case 'EN_ATTENTE':
            return 'warning';
        case 'REJETE':
            return 'danger';
        default:
            return 'secondary';
    }
}

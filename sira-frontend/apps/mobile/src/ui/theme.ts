import type { TextStyle } from 'react-native';

/**
 * Charte reprise des variables CSS du web, pour que les deux se ressemblent.
 * Les couleurs de texte sont plus foncées que sur le web : le téléphone se lit
 * dehors, en plein soleil (docs/charte-typographique-mobile.md, § 4).
 */
export const couleurs = {
    vert: '#1b5e3b',
    vertFonce: '#14472c',
    vertPale: '#e6f1ea',
    or: '#c9a227',
    /** L'or n'est jamais une couleur de texte (2,4:1 sur blanc) ; celle-ci tient à 7:1. */
    orTexte: '#6e560d',
    fond: '#f7f8f5',
    blanc: '#ffffff',
    encre: '#1d2721',
    /** Texte secondaire : 8,4:1 sur blanc. Le gris du web (#55635a) n'atteint que 6,3:1. */
    gris: '#44504a',
    /** Texte secondaire posé sur le vert : 6,9:1. */
    surVertSecondaire: '#edf4ef',
    ligne: '#dce2d8',
    danger: '#a1382a',
    dangerPale: '#fbe9e5',
    alerte: '#7d510f',
    alertePale: '#fff4dc',
    succes: '#1b5e3b',
    succesPale: '#e6f1ea'
} as const;

export const espaces = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const rayons = { sm: 8, md: 12, lg: 16 } as const;

/**
 * Échelle typographique (docs/charte-typographique-mobile.md, § 3) : police du
 * système, trois graisses, corps à 16, rien d'utile sous 14. Les chiffres
 * forts sont tabulaires pour ne pas sauter quand ils changent.
 */
export const texte: Record<'titre' | 'section' | 'chiffre' | 'prix' | 'corps' | 'appuye' | 'libelle' | 'secondaire' | 'mention' | 'bouton', TextStyle> = {
    titre: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
    section: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
    chiffre: { fontSize: 20, lineHeight: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
    prix: { fontSize: 18, lineHeight: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
    corps: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
    appuye: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
    libelle: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
    secondaire: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    mention: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
    bouton: { fontSize: 16, lineHeight: 20, fontWeight: '700' }
};

/** Zoom système maximal des titres, onglets et boutons : la mise en page tient jusqu'au réglage « Très grand ». */
export const zoomMax = 1.6;

/**
 * Environnement cible, choisi à la construction par EXPO_PUBLIC_ENV.
 *
 *   EXPO_PUBLIC_ENV=test  npx expo start      → environnement de test
 *   EXPO_PUBLIC_ENV=prod  eas build …          → production
 *
 * Le défaut est le test et non la production : une application lancée sans
 * rien préciser ne doit jamais toucher aux vrais paiements. Pas de mode
 * « localhost » : un téléphone ne voit pas la machine de développement, et le
 * backend de test est joignable de partout.
 */
export type Environnement = 'test' | 'prod';

interface ConfigEnvironnement {
    nom: Environnement;
    apiBase: string;
    authBase: string;
    siteWeb: string;
}

const ENVIRONNEMENTS: Record<Environnement, ConfigEnvironnement> = {
    test: {
        nom: 'test',
        apiBase: 'https://api-test.synergia-guinee.com',
        authBase: 'https://api-test.synergia-guinee.com/authorization',
        siteWeb: 'https://test.synergia-guinee.com'
    },
    prod: {
        nom: 'prod',
        apiBase: 'https://api.synergia-guinee.com',
        authBase: 'https://api.synergia-guinee.com/authorization',
        siteWeb: 'https://synergia-guinee.com'
    }
};

const demande = process.env.EXPO_PUBLIC_ENV;
export const config: ConfigEnvironnement = demande === 'prod' ? ENVIRONNEMENTS.prod : ENVIRONNEMENTS.test;

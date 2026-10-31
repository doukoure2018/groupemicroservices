import type { TokenStore } from '@sira/auth';
import type { TokenSet } from '@sira/core';
import * as SecureStore from 'expo-secure-store';

const CLE = 'synergia.session';

/**
 * Jetons dans le trousseau du téléphone (Keychain iOS, Keystore Android),
 * jamais dans un stockage lisible par une autre application. Contrairement au
 * web, où l'access token ne survit pas au rechargement, le mobile garde le jeu
 * complet : fermer l'application ne doit pas déconnecter.
 */
export class SecureStoreTokenStore implements TokenStore {
    async load(): Promise<TokenSet | null> {
        try {
            const brut = await SecureStore.getItemAsync(CLE);
            return brut ? (JSON.parse(brut) as TokenSet) : null;
        } catch {
            // Trousseau indisponible ou contenu illisible : repartir déconnecté
            // vaut mieux qu'un plantage au démarrage.
            return null;
        }
    }

    async save(tokens: TokenSet): Promise<void> {
        await SecureStore.setItemAsync(CLE, JSON.stringify(tokens));
    }

    async clear(): Promise<void> {
        await SecureStore.deleteItemAsync(CLE);
    }
}

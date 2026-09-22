import type { TokenSet } from '@sira/core';

/**
 * Abstraction de stockage des jetons.
 * - Web : `MemoryTokenStore` (l'access token ne touche jamais localStorage ;
 *   au rechargement de page, la session est reconstruite via le refresh token).
 * - React Native : implémentation adossée à expo-secure-store (Keychain/Keystore),
 *   à fournir dans l'app mobile.
 */
export interface TokenStore {
    load(): Promise<TokenSet | null>;
    save(tokens: TokenSet): Promise<void>;
    clear(): Promise<void>;
}

export class MemoryTokenStore implements TokenStore {
    private tokens: TokenSet | null = null;

    async load(): Promise<TokenSet | null> {
        return this.tokens;
    }
    async save(tokens: TokenSet): Promise<void> {
        this.tokens = tokens;
    }
    async clear(): Promise<void> {
        this.tokens = null;
    }
}

/**
 * Variante web : le TokenSet complet est persisté en sessionStorage (par onglet,
 * effacé à la fermeture). Le refresh token — plus puissant que l'access token —
 * y était déjà ; persister aussi l'access token évite un refresh (avec rotation)
 * à CHAQUE chargement de page, source de déconnexions quand une navigation
 * interrompait la requête. Un cookie httpOnly côté BFF reste la cible à terme.
 */
export class WebSessionTokenStore implements TokenStore {
    private cache: TokenSet | null = null;

    constructor(
        private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
        private readonly key = 'sira.session'
    ) {}

    async load(): Promise<TokenSet | null> {
        if (this.cache) return this.cache;
        try {
            const brut = this.storage.getItem(this.key);
            if (!brut) return null;
            const t = JSON.parse(brut) as Partial<TokenSet>;
            if (typeof t.accessToken !== 'string' || typeof t.expiresAt !== 'number') return null;
            this.cache = { accessToken: t.accessToken, tokenType: t.tokenType ?? 'Bearer', expiresAt: t.expiresAt, refreshToken: t.refreshToken };
            return this.cache;
        } catch {
            // stockage indisponible (navigation privée…) ou contenu corrompu : session mémoire uniquement
            return this.cache;
        }
    }

    async save(tokens: TokenSet): Promise<void> {
        this.cache = tokens;
        try {
            this.storage.setItem(this.key, JSON.stringify(tokens));
        } catch {
            // best effort
        }
    }

    async clear(): Promise<void> {
        this.cache = null;
        try {
            this.storage.removeItem(this.key);
        } catch {
            // best effort
        }
    }
}

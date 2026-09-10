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
 * Variante web transitoire : seul le refresh token est persisté (sessionStorage
 * par défaut), l'access token reste en mémoire. Compromis documenté : mieux que
 * l'ancien localStorage intégral, en attendant un éventuel cookie httpOnly côté BFF.
 */
export class WebSessionTokenStore implements TokenStore {
    private accessPart: Omit<TokenSet, 'refreshToken'> | null = null;

    constructor(
        private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
        private readonly key = 'sira.refresh_token'
    ) {}

    async load(): Promise<TokenSet | null> {
        let refreshToken: string | null = null;
        try {
            refreshToken = this.storage.getItem(this.key);
        } catch {
            // stockage indisponible (navigation privée…) : session mémoire uniquement
        }
        if (this.accessPart) return { ...this.accessPart, refreshToken: refreshToken ?? undefined };
        if (refreshToken) {
            // Access token perdu (rechargement de page) : expiré d'office, le
            // TokenProvider déclenchera un refresh immédiat.
            return { accessToken: '', tokenType: 'Bearer', expiresAt: 0, refreshToken };
        }
        return null;
    }

    async save(tokens: TokenSet): Promise<void> {
        const { refreshToken, ...rest } = tokens;
        this.accessPart = rest;
        try {
            if (refreshToken) this.storage.setItem(this.key, refreshToken);
        } catch {
            // best effort
        }
    }

    async clear(): Promise<void> {
        this.accessPart = null;
        try {
            this.storage.removeItem(this.key);
        } catch {
            // best effort
        }
    }
}

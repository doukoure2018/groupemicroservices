import { isExpired, type TokenSet } from '@sira/core';
import { AuthHttpError, refreshTokens, type OAuthConfig } from './oauth.js';
import type { TokenStore } from './token-store.js';

/**
 * Session d'authentification partagée web/mobile.
 * Implémente le contrat `TokenProvider` de @sira/api-client :
 * - `getAccessToken()` rafraîchit proactivement si le token approche de l'expiration ;
 * - `refresh()` est appelé par le client HTTP sur un 401 (refresh + rejeu automatique).
 * Un seul refresh concurrent à la fois (mutex par promesse partagée).
 */
export class AuthSession {
    private refreshing: Promise<boolean> | null = null;
    private listeners = new Set<(authenticated: boolean) => void>();

    constructor(
        private readonly config: OAuthConfig,
        private readonly store: TokenStore,
        /** Stratégie de refresh : `refreshTokens` (OAuth2) par défaut, `mobileRefresh` pour les jetons du login REST. */
        private readonly refreshFn: (config: OAuthConfig, refreshToken: string) => Promise<TokenSet> = refreshTokens
    ) {}

    onChange(listener: (authenticated: boolean) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(authenticated: boolean): void {
        for (const l of this.listeners) l(authenticated);
    }

    async setTokens(tokens: TokenSet): Promise<void> {
        await this.store.save(tokens);
        this.notify(true);
    }

    async logout(): Promise<void> {
        await this.store.clear();
        this.notify(false);
    }

    async isAuthenticated(): Promise<boolean> {
        return (await this.getAccessToken()) !== null;
    }

    async getAccessToken(): Promise<string | null> {
        const tokens = await this.store.load();
        if (!tokens) return null;
        if (!isExpired(tokens)) return tokens.accessToken;
        const refreshed = await this.refresh();
        if (!refreshed) return null;
        const fresh = await this.store.load();
        return fresh?.accessToken ?? null;
    }

    async refresh(): Promise<boolean> {
        if (this.refreshing) return this.refreshing;
        this.refreshing = this.doRefresh().finally(() => {
            this.refreshing = null;
        });
        return this.refreshing;
    }

    private async doRefresh(): Promise<boolean> {
        const tokens = await this.store.load();
        if (!tokens?.refreshToken) return false;
        try {
            const fresh = await this.refreshFn(this.config, tokens.refreshToken);
            // Certains serveurs ne renvoient pas de nouveau refresh token : on garde l'ancien.
            if (!fresh.refreshToken) fresh.refreshToken = tokens.refreshToken;
            await this.store.save(fresh);
            return true;
        } catch (err) {
            // Seul un refus explicite du serveur (jeton révoqué/expiré) invalide la session.
            // Une requête avortée (navigation pendant le refresh) ou hors-ligne conserve les
            // jetons : sans cela, cliquer un lien juste après un chargement déconnectait l'utilisateur.
            if (estRefusDefinitif(err)) {
                await this.store.clear();
                this.notify(false);
            }
            return false;
        }
    }
}

function estRefusDefinitif(err: unknown): boolean {
    return err instanceof AuthHttpError && (err.status === 400 || err.status === 401 || err.status === 403);
}

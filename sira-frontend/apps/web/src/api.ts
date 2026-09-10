import { createSiraApi } from '@sira/api-client';
import { AuthSession, mobileRefresh, WebSessionTokenStore, type OAuthConfig } from '@sira/auth';

/**
 * En dev, les chemins relatifs passent par le proxy Vite → gateway :9000.
 * En prod, le même code passera par le proxy nginx (comme l'Angular actuel).
 * L'auth server est joint via la route gateway /authorization.
 */
export const oauthConfig: OAuthConfig = {
    authBaseUrl: `${window.location.origin}/authorization`,
    clientId: 'client',
    redirectUri: `${window.location.origin}/`
};

/**
 * Session partagée : access token en mémoire uniquement, refresh token en
 * sessionStorage. Refresh silencieux + rejeu automatique sur 401 via le client.
 */
export const session = new AuthSession(oauthConfig, new WebSessionTokenStore(window.sessionStorage), mobileRefresh);

export const api = createSiraApi({
    baseUrl: window.location.origin,
    tokenProvider: session,
    onSessionExpired: () => {
        void session.logout();
    }
});

import { createSiraApi } from '@sira/api-client';
import { AuthSession, mobileRefresh, type OAuthConfig } from '@sira/auth';
import { SecureStoreTokenStore } from './auth/secure-store';
import { config } from './config';

export const oauthConfig: OAuthConfig = {
    authBaseUrl: config.authBase,
    clientId: 'client',
    redirectUri: 'sira://auth'
};

/** Session partagée : refresh silencieux et rejeu automatique sur 401. */
export const session = new AuthSession(oauthConfig, new SecureStoreTokenStore(), mobileRefresh);

export const api = createSiraApi({
    baseUrl: config.apiBase,
    tokenProvider: session,
    onSessionExpired: () => {
        void session.logout();
    }
});

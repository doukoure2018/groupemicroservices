import { tokenSetFromResponse, type OAuthTokenResponse, type TokenSet } from '@sira/core';
import { computeCodeChallenge, generateCodeVerifier, generateState } from './pkce.js';

export interface OAuthConfig {
    /** Base de l'authorization server, ex. https://api.sira-guinee.com/authorization ou http://localhost:8090 */
    authBaseUrl: string;
    clientId: string;
    redirectUri: string;
    scopes?: string[];
    /** Endpoint token accessible depuis le front (proxy same-origin en prod web : /token-proxy/token). */
    tokenEndpoint?: string;
    fetchImpl?: typeof fetch;
}

export interface AuthorizeRequest {
    url: string;
    /** À conserver (sessionStorage web / mémoire mobile) pour l'échange du code. */
    codeVerifier: string;
    state: string;
}

/** Erreur HTTP d'authentification : porte le statut et le message renvoyé par le serveur. */
export class AuthHttpError extends Error {
    constructor(
        public readonly status: number,
        /** Message métier du serveur (ex. « Compte non activé. Vérifiez votre email. ») si disponible. */
        public readonly serverMessage: string | undefined,
        rawBody: string
    ) {
        super(serverMessage ?? `Erreur HTTP ${status}: ${rawBody.slice(0, 200)}`);
        this.name = 'AuthHttpError';
    }
}

function parseServerMessage(text: string): string | undefined {
    try {
        const json = JSON.parse(text) as { message?: unknown };
        return typeof json.message === 'string' ? json.message : undefined;
    } catch {
        return undefined;
    }
}

function tokenEndpointOf(config: OAuthConfig): string {
    return config.tokenEndpoint ?? `${config.authBaseUrl.replace(/\/$/, '')}/oauth2/token`;
}

/** Construit l'URL /oauth2/authorize avec un vrai PKCE S256 + state anti-CSRF. */
export async function buildAuthorizeRequest(config: OAuthConfig): Promise<AuthorizeRequest> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await computeCodeChallenge(codeVerifier);
    const state = generateState();

    const url = new URL(`${config.authBaseUrl.replace(/\/$/, '')}/oauth2/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('scope', (config.scopes ?? ['openid', 'profile', 'email']).join(' '));
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);

    return { url: url.toString(), codeVerifier, state };
}

async function postTokenForm(config: OAuthConfig, form: Record<string, string>): Promise<TokenSet> {
    const fetchImpl = config.fetchImpl ?? fetch;
    const response = await fetchImpl(tokenEndpointOf(config), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(form).toString()
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Échec token endpoint (${response.status}): ${text.slice(0, 300)}`);
    }
    const json = (await response.json()) as OAuthTokenResponse;
    return tokenSetFromResponse(json);
}

/** Échange le code d'autorisation contre des jetons (avec le verifier PKCE). */
export function exchangeCode(config: OAuthConfig, code: string, codeVerifier: string): Promise<TokenSet> {
    return postTokenForm(config, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        code_verifier: codeVerifier
    });
}

/** Rafraîchit les jetons — le backend fait tourner le refresh token (rotation V26). */
export function refreshTokens(config: OAuthConfig, refreshToken: string): Promise<TokenSet> {
    return postTokenForm(config, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId
    });
}

/**
 * Refresh via l'API REST mobile : POST /api/auth/refresh, JSON {refreshToken}.
 * À utiliser avec les jetons issus de `passwordLogin` (MobileTokenService fait
 * la rotation du jti côté serveur — l'ancien refresh token est révoqué).
 */
export async function mobileRefresh(config: OAuthConfig, refreshToken: string): Promise<TokenSet> {
    const fetchImpl = config.fetchImpl ?? fetch;
    const response = await fetchImpl(`${config.authBaseUrl.replace(/\/$/, '')}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Échec du refresh (${response.status}): ${text.slice(0, 300)}`);
    }
    const json = (await response.json()) as OAuthTokenResponse;
    return tokenSetFromResponse(json);
}

/** Login direct REST (chemin mobile : POST /api/auth/token, JSON email/password). */
export async function passwordLogin(config: OAuthConfig, email: string, password: string): Promise<TokenSet> {
    const fetchImpl = config.fetchImpl ?? fetch;
    const response = await fetchImpl(`${config.authBaseUrl.replace(/\/$/, '')}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const text = await response.text();
        throw new AuthHttpError(response.status, parseServerMessage(text), text);
    }
    const json = (await response.json()) as OAuthTokenResponse;
    return tokenSetFromResponse(json);
}

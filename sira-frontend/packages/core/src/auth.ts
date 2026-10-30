/** Réponse brute du token endpoint OAuth2 (snake_case, ex-`IAuthentication`). */
export interface OAuthTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
    scope?: string;
    token_type: string;
}

/** Jeu de jetons normalisé, avec l'instant d'expiration absolu pré-calculé. */
export interface TokenSet {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    tokenType: string;
    scope?: string;
    /** Timestamp epoch ms auquel l'access token expire. */
    expiresAt: number;
}

export function tokenSetFromResponse(res: OAuthTokenResponse, now: number = Date.now()): TokenSet {
    return {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        idToken: res.id_token,
        tokenType: res.token_type,
        scope: res.scope,
        expiresAt: now + res.expires_in * 1000
    };
}

/** Marge de sécurité : on considère le token expiré N secondes avant l'échéance réelle. */
export function isExpired(tokens: TokenSet, skewSeconds = 30, now: number = Date.now()): boolean {
    return now >= tokens.expiresAt - skewSeconds * 1000;
}

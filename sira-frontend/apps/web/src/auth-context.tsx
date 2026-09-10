import { buildAuthorizeRequest, exchangeCode, passwordLogin } from '@sira/auth';
import type { User } from '@sira/core';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, oauthConfig, session } from './api';

interface AuthState {
    /** undefined = vérification en cours, null = non connecté. */
    user: User | null | undefined;
    login: (email: string, password: string) => Promise<void>;
    /** Démarre le flux Authorization Code + PKCE (bouton « Continuer avec Google »). */
    loginWithOAuth: () => Promise<void>;
    logout: () => Promise<void>;
    rafraichirProfil: () => Promise<void>;
}

/**
 * Le verifier PKCE et le state anti-CSRF vivent le temps de l'aller-retour vers
 * l'auth server. sessionStorage suffit : l'onglet revient sur la même origine.
 */
const CLE_VERIFIER = 'sira.pkce.verifier';
const CLE_STATE = 'sira.pkce.state';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null | undefined>(undefined);

    const loadProfile = useCallback(async () => {
        try {
            const res = await api.users.profile();
            setUser(res.data.user ?? null);
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        // Au chargement : si un refresh token survit en sessionStorage, la session
        // se reconstruit silencieusement ; sinon on reste déconnecté.
        void (async () => {
            if (await consommerRetourOAuth()) {
                await loadProfile();
                return;
            }
            const authenticated = await session.isAuthenticated();
            if (authenticated) await loadProfile();
            else setUser(null);
        })();

        return session.onChange((authenticated) => {
            if (!authenticated) setUser(null);
        });
    }, [loadProfile]);

    const login = useCallback(
        async (email: string, password: string) => {
            const tokens = await passwordLogin(oauthConfig, email, password);
            await session.setTokens(tokens);
            await loadProfile();
        },
        [loadProfile]
    );

    const loginWithOAuth = useCallback(async () => {
        const { url, codeVerifier, state } = await buildAuthorizeRequest(oauthConfig);
        window.sessionStorage.setItem(CLE_VERIFIER, codeVerifier);
        window.sessionStorage.setItem(CLE_STATE, state);
        window.location.href = url;
    }, []);

    const logout = useCallback(async () => {
        await session.logout();
        setUser(null);
    }, []);

    return <AuthContext.Provider value={{ user, login, loginWithOAuth, logout, rafraichirProfil: loadProfile }}>{children}</AuthContext.Provider>;
}

/**
 * Traite le retour de l'auth server : ?code=…&state=… sur l'URL de redirection.
 * Retourne true si des jetons ont été obtenus. Le state est comparé avant tout
 * échange, et l'URL est nettoyée pour ne pas laisser le code dans l'historique.
 */
async function consommerRetourOAuth(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code) return false;

    const verifier = window.sessionStorage.getItem(CLE_VERIFIER);
    const stateAttendu = window.sessionStorage.getItem(CLE_STATE);
    window.sessionStorage.removeItem(CLE_VERIFIER);
    window.sessionStorage.removeItem(CLE_STATE);
    nettoyerUrl();

    if (!verifier || !stateAttendu || state !== stateAttendu) return false;

    try {
        const tokens = await exchangeCode(oauthConfig, code, verifier);
        await session.setTokens(tokens);
        return true;
    } catch {
        return false;
    }
}

function nettoyerUrl() {
    const url = new URL(window.location.href);
    for (const cle of ['code', 'state', 'session_state', 'iss']) url.searchParams.delete(cle);
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit être utilisé sous <AuthProvider>');
    return ctx;
}

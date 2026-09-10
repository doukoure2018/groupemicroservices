import { passwordLogin } from '@sira/auth';
import type { User } from '@sira/core';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, oauthConfig, session } from './api';

interface AuthState {
    /** undefined = vérification en cours, null = non connecté. */
    user: User | null | undefined;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

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

    const logout = useCallback(async () => {
        await session.logout();
        setUser(null);
    }, []);

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit être utilisé sous <AuthProvider>');
    return ctx;
}

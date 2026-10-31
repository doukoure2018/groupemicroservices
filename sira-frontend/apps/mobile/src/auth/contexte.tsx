import { passwordLogin } from '@sira/auth';
import type { User } from '@sira/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, oauthConfig, session } from '../api';
import { deconnecterGoogle, seConnecterAvecGoogle } from './google';

interface EtatAuth {
    /** undefined tant que la session n'a pas été relue au démarrage. */
    user: User | null | undefined;
    login(email: string, motDePasse: string): Promise<void>;
    loginGoogle(): Promise<void>;
    logout(): Promise<void>;
    rafraichirProfil(): Promise<void>;
}

const Contexte = createContext<EtatAuth | null>(null);

/**
 * Même logique que le web : au démarrage, si des jetons survivent dans le
 * trousseau, la session se reconstruit en silence ; sinon on reste déconnecté.
 * La connexion passe par le point d'entrée REST du serveur d'autorisation,
 * le même que celui du formulaire web.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null | undefined>(undefined);

    const rafraichirProfil = useCallback(async () => {
        try {
            const res = await api.users.profile();
            setUser(res.data.user ?? null);
        } catch {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            if (await session.isAuthenticated()) await rafraichirProfil();
            else setUser(null);
        })();
        return session.onChange((authentifie) => {
            if (!authentifie) setUser(null);
        });
    }, [rafraichirProfil]);

    const login = useCallback(
        async (email: string, motDePasse: string) => {
            const tokens = await passwordLogin(oauthConfig, email, motDePasse);
            await session.setTokens(tokens);
            await rafraichirProfil();
        },
        [rafraichirProfil]
    );

    const loginGoogle = useCallback(async () => {
        const tokens = await seConnecterAvecGoogle();
        await session.setTokens(tokens);
        await rafraichirProfil();
    }, [rafraichirProfil]);

    const logout = useCallback(async () => {
        await deconnecterGoogle();
        await session.logout();
        setUser(null);
    }, []);

    const valeur = useMemo(() => ({ user, login, loginGoogle, logout, rafraichirProfil }), [user, login, loginGoogle, logout, rafraichirProfil]);
    return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth(): EtatAuth {
    const ctx = useContext(Contexte);
    if (!ctx) throw new Error('useAuth doit être utilisé sous AuthProvider');
    return ctx;
}

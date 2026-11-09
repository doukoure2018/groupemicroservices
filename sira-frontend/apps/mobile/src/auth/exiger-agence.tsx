import { hasRole } from '@sira/core';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Bouton, EtatVide } from '../ui/base';
import { useAuth } from './contexte';
import { ExigerSession } from './exiger-session';

/** Les comptes qui portent une agence : les mêmes droits que les pages « agence » du site. */
export function estCompteAgence(user: Parameters<typeof hasRole>[0]): boolean {
    return hasRole(user, 'ADMIN_IMMO') || hasRole(user, 'SUPER_ADMIN');
}

/** Session requise, puis un compte d'agence ; sinon on explique, sans écran vide. */
export function ExigerAgence({ children }: { children: ReactNode }) {
    return (
        <ExigerSession>
            <Garde>{children}</Garde>
        </ExigerSession>
    );
}

function Garde({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    if (!estCompteAgence(user)) {
        return (
            <EtatVide
                titre="Réservé aux agences"
                texte="Cet espace s'ouvre avec un compte d'agence. L'inscription d'une agence se fait sur le site, rubrique « Agences »."
                action={<Bouton libelle="Retour" variante="secondaire" onPress={() => router.back()} />}
            />
        );
    }
    return <>{children}</>;
}

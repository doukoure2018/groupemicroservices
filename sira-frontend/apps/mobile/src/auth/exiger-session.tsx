import { Redirect, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { Chargement } from '../ui/base';
import { useAuth } from './contexte';

/**
 * N'enveloppe que les écrans qui ont besoin d'un compte : réserver, les
 * billets d'une commande, le changement de date, la notation, les
 * notifications. Tout le reste de l'application se parcourt sans session.
 * Sans compte, la connexion s'ouvre à la place de l'écran et y revient une
 * fois faite : le voyageur ne perd pas le voyage qu'il visait. Seul le chemin
 * est conservé, pas les paramètres de requête — aucun écran gardé n'en dépend
 * pour s'afficher.
 */
export function ExigerSession({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const chemin = usePathname();
    if (user === undefined) return <Chargement />;
    if (user === null) return <Redirect href={{ pathname: '/connexion', params: { suite: chemin } }} />;
    return <>{children}</>;
}

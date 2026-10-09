import { ApiError } from '@sira/api-client';
import type { ReactNode } from 'react';

interface CarteAuthProps {
    /** Titre de l'écran (h1) — les tests e2e et les emails s'appuient sur ces libellés. */
    titre: string;
    sousTitre?: ReactNode;
    /** Variante plus large pour les formulaires à deux colonnes (inscription). */
    large?: boolean;
    children: ReactNode;
}

/**
 * Coquille commune des écrans d'authentification (connexion, inscription, mot de
 * passe oublié, vérifications) : emblème SYNERGIA, titre, sous-titre, contenu.
 */
export function CarteAuth({ titre, sousTitre, large, children }: CarteAuthProps) {
    return (
        <section className={large ? 'auth-carte auth-carte-large' : 'auth-carte'}>
            <img className="auth-logo" src="/brand/synergia-emblem-512x512.png" alt="SYNERGIA" width={64} height={64} />
            <h1>{titre}</h1>
            {sousTitre && <p className="auth-sous">{sousTitre}</p>}
            {children}
        </section>
    );
}

/**
 * Le userservice répond « You are not logged in » / « Your session has expired »
 * dès qu'une exception est levée sur un endpoint public (jeton inconnu, email
 * inconnu…) : le libellé technique ne décrit pas la situation de l'utilisateur.
 */
export function estMessageAuthGenerique(err: unknown): boolean {
    return err instanceof ApiError && /not logged in|session has expired/i.test(err.message ?? '');
}

/** Message serveur à afficher, ou `secours` s'il est absent ou générique. */
export function messageServeur(err: unknown, secours: string): string {
    if (err instanceof ApiError && err.message && !estMessageAuthGenerique(err)) return err.message;
    return secours;
}

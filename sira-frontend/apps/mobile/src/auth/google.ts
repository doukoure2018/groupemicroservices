import { googleLogin } from '@sira/auth';
import type { TokenSet } from '@sira/core';
import { GOOGLE_WEB_CLIENT_ID } from '../config';
import { oauthConfig } from '../api';

/**
 * Connexion Google native. La boîte de dialogue du système rend un jeton
 * d'identité dont l'audience est l'identifiant client web : c'est ce que le
 * serveur vérifie avant de retrouver ou créer le compte.
 *
 * Le module natif n'existe pas dans Expo Go. Il n'est donc jamais importé au
 * démarrage, seulement au moment où l'utilisateur touche le bouton : dans
 * Expo Go le bouton échoue avec un message clair, et tout le reste de
 * l'application vit normalement. Un import en tête de fichier aurait fait
 * planter l'application au premier écran.
 */

/** Annulation par l'utilisateur : ni erreur, ni message, on revient simplement. */
export class ConnexionGoogleAnnulee extends Error {
    constructor() {
        super('Connexion Google annulée');
    }
}

/** Module absent de l'exécutable courant, typiquement Expo Go. */
export class ConnexionGoogleIndisponible extends Error {
    constructor() {
        super("La connexion Google demande l'application complète, pas Expo Go. Utilisez votre email en attendant.");
    }
}

type ModuleGoogle = typeof import('@react-native-google-signin/google-signin');

let module: ModuleGoogle | null = null;

async function chargerModule(): Promise<ModuleGoogle> {
    if (module) return module;
    try {
        const m = await import('@react-native-google-signin/google-signin');
        // Le module JavaScript se charge toujours ; c'est la partie native qui
        // manque dans Expo Go, et elle se manifeste au premier appel.
        m.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: false });
        module = m;
        return m;
    } catch {
        throw new ConnexionGoogleIndisponible();
    }
}

export async function seConnecterAvecGoogle(): Promise<TokenSet> {
    const m = await chargerModule();
    let reponse: Awaited<ReturnType<typeof m.GoogleSignin.signIn>>;
    try {
        await m.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        reponse = await m.GoogleSignin.signIn();
    } catch (e) {
        // Dans Expo Go, l'appel natif échoue ici plutôt qu'au chargement.
        if (e instanceof Error && /native|module|RNGoogleSignin/i.test(e.message)) throw new ConnexionGoogleIndisponible();
        throw e;
    }
    if (m.isCancelledResponse(reponse)) throw new ConnexionGoogleAnnulee();
    if (!m.isSuccessResponse(reponse) || !reponse.data.idToken) {
        throw new Error("Google n'a pas rendu de jeton d'identité.");
    }
    return googleLogin(oauthConfig, reponse.data.idToken);
}

/** À la déconnexion, oublier aussi le compte Google choisi, sinon il se reconnecte sans demander. */
export async function deconnecterGoogle(): Promise<void> {
    if (!module) return; // jamais utilisé dans cette session : rien à oublier
    try {
        await module.GoogleSignin.signOut();
    } catch {
        // Aucun compte Google en cours : rien à faire.
    }
}

import { googleLogin } from '@sira/auth';
import type { TokenSet } from '@sira/core';
import { GoogleSignin, isCancelledResponse, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../config';
import { oauthConfig } from '../api';

/**
 * Connexion Google native. La boîte de dialogue du système rend un jeton
 * d'identité dont l'audience est l'identifiant client web : c'est ce que le
 * serveur vérifie avant de retrouver ou créer le compte. Ce module natif ne
 * fonctionne pas dans Expo Go, il faut une construction de développement.
 */
let configure = false;

function preparer() {
    if (configure) return;
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: false });
    configure = true;
}

/** Annulation par l'utilisateur : ni erreur, ni message, on revient simplement. */
export class ConnexionGoogleAnnulee extends Error {
    constructor() {
        super('Connexion Google annulée');
    }
}

export async function seConnecterAvecGoogle(): Promise<TokenSet> {
    preparer();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const reponse = await GoogleSignin.signIn();
    if (isCancelledResponse(reponse)) throw new ConnexionGoogleAnnulee();
    if (!isSuccessResponse(reponse) || !reponse.data.idToken) {
        throw new Error("Google n'a pas rendu de jeton d'identité.");
    }
    return googleLogin(oauthConfig, reponse.data.idToken);
}

/** À la déconnexion, oublier aussi le compte Google choisi, sinon il se reconnecte sans demander. */
export async function deconnecterGoogle(): Promise<void> {
    try {
        preparer();
        await GoogleSignin.signOut();
    } catch {
        // Aucun compte Google en cours : rien à faire.
    }
}

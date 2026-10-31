import { ApiError } from '@sira/api-client';
import { tokenSetFromResponse, type OAuthTokenResponse, type TokenSet } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { api, session } from '../api';
import { useAuth } from '../auth/contexte';
import { Bouton, Chargement, EtatVide, styles as base } from '../ui/base';
import { espaces } from '../ui/theme';

/**
 * Arrivée par lien profond `sira://verify`, après le clic sur le courriel
 * d'activation. Deux formes de lien sont acceptées.
 *
 * La page du site qui reçoit le courriel active le compte elle-même puis
 * redirige ici avec les jetons déjà émis (`accessToken`, `refreshToken`,
 * `idToken`). C'est la forme qu'attend encore l'application Flutter publiée,
 * on la garde tant qu'elle existe. Elle fait transiter des jetons dans une
 * adresse, ce qui est une dette connue.
 *
 * La forme saine ne porte que le jeton de vérification à usage unique
 * (`token`) : c'est alors l'application qui appelle le serveur, qui active le
 * compte et répond par des jetons. Aucun secret durable ne circule dans
 * l'adresse. La page du site pourra basculer sur cette forme dès que le
 * Flutter sera retiré.
 */
export default function Verify() {
    const params = useLocalSearchParams<{ token?: string; accessToken?: string; refreshToken?: string; idToken?: string }>();
    const { rafraichirProfil } = useAuth();
    const [erreur, setErreur] = useState<{ titre: string; texte: string; dejaUtilise: boolean } | null>(null);
    const lance = useRef(false);

    useEffect(() => {
        // Un seul passage : le jeton de vérification est à usage unique, et un
        // second appel renverrait « déjà utilisé » alors que tout s'est bien passé.
        if (lance.current) return;
        lance.current = true;

        void (async () => {
            try {
                let tokens: TokenSet;
                if (params.token) {
                    const reponse = await api.users.verifyMobile(params.token);
                    tokens = tokenSetFromResponse(reponse as OAuthTokenResponse);
                } else if (params.accessToken && params.refreshToken) {
                    tokens = tokenSetDepuisLien(params.accessToken, params.refreshToken, params.idToken);
                } else {
                    setErreur({
                        titre: 'Lien incomplet',
                        texte: "Ce lien ne contient pas ce qu'il faut pour activer votre compte. Ouvrez-le depuis le courriel reçu, ou connectez-vous si votre compte est déjà actif.",
                        dejaUtilise: false
                    });
                    return;
                }
                await session.setTokens(tokens);
                await rafraichirProfil();
                router.replace('/(tabs)');
            } catch (e) {
                const message = e instanceof ApiError ? e.message : '';
                const dejaUtilise = /déjà utilisé|invalide/i.test(message);
                setErreur({
                    titre: dejaUtilise ? 'Lien déjà utilisé' : 'Activation impossible',
                    texte: dejaUtilise
                        ? 'Ce lien a déjà servi : votre compte est sans doute déjà actif. Connectez-vous avec votre email et votre mot de passe.'
                        : message || "Le lien a expiré ou le serveur n'est pas joignable. Si le lien est périmé, recommencez l'inscription avec la même adresse.",
                    dejaUtilise
                });
            }
        })();
    }, [params.token, params.accessToken, params.refreshToken, params.idToken, rafraichirProfil]);

    if (!erreur) return <Chargement texte="Activation de votre compte…" />;

    return (
        <View style={base.ecran}>
            <EtatVide
                titre={erreur.titre}
                texte={erreur.texte}
                action={
                    <View style={{ gap: espaces.sm }}>
                        <Bouton libelle="Se connecter" onPress={() => router.replace('/connexion')} />
                        {!erreur.dejaUtilise && <Bouton libelle="Créer un compte" variante="secondaire" onPress={() => router.replace('/inscription')} />}
                    </View>
                }
            />
        </View>
    );
}

/**
 * Jeu de jetons à partir du lien du site. L'adresse ne dit pas quand l'access
 * token expire : on lit l'échéance dans le jeton lui-même, et à défaut on
 * suppose l'heure que le serveur accorde, pour que le rafraîchissement
 * silencieux se déclenche au bon moment.
 */
function tokenSetDepuisLien(accessToken: string, refreshToken: string, idToken?: string): TokenSet {
    return {
        accessToken,
        refreshToken,
        idToken,
        tokenType: 'Bearer',
        expiresAt: echeanceJwt(accessToken) ?? Date.now() + 3600 * 1000
    };
}

function echeanceJwt(jwt: string): number | null {
    try {
        const charge = jwt.split('.')[1];
        if (!charge) return null;
        const base64 = charge.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(charge.length / 4) * 4, '=');
        const json = JSON.parse(globalThis.atob(base64)) as { exp?: number };
        return typeof json.exp === 'number' ? json.exp * 1000 : null;
    } catch {
        return null;
    }
}

import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useAuth } from '../../auth/contexte';
import { config } from '../../config';
import { Bouton, Carte, LigneMenu, styles as base } from '../../ui/base';
import { couleurs, espaces, texte, zoomMax } from '../../ui/theme';
import { UNIVERS, useUnivers } from '../../univers';

/**
 * « Compte » est commun aux deux univers : un seul profil, une seule session.
 * Il se visite sans session : la carte du haut invite alors à s'identifier et
 * le menu reste visible, pour montrer ce que le compte apporte. Les entrées
 * se groupent par univers ; les pages légales et l'aide vivent sur le site.
 */
export default function Compte() {
    const { user, logout } = useAuth();
    const { univers } = useUnivers();
    const version = Constants.expoConfig?.version ?? '';
    const ouvrirSite = (chemin: string) => void WebBrowser.openBrowserAsync(`${config.siteWeb}${chemin}`).catch(() => undefined);

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            {user ? (
                <Carte style={{ gap: espaces.xs }}>
                    <Text maxFontSizeMultiplier={zoomMax} style={base.titre}>
                        {user.firstName} {user.lastName}
                    </Text>
                    <Text style={base.sousTitre}>{user.email}</Text>
                    {user.phone ? <Text style={base.attenue}>{user.phone}</Text> : null}
                </Carte>
            ) : (
                <Carte style={styles.invitation}>
                    <Text style={styles.invitationTitre}>Votre compte</Text>
                    <Text style={styles.invitationTexte}>
                        Réservez en ligne, retrouvez vos billets et suivez vos départs, sur ce téléphone comme sur le site.
                    </Text>
                    <Bouton
                        libelle="S'identifier ou s'inscrire"
                        variante="secondaire"
                        onPress={() => router.push({ pathname: '/connexion', params: { suite: '/compte' } })}
                        style={{ marginTop: espaces.lg }}
                    />
                </Carte>
            )}

            <Text style={base.sectionTitre}>Général</Text>
            <Carte style={styles.menu}>
                <LigneMenu libelle="Univers" valeur={univers ? UNIVERS[univers].libelle : undefined} onPress={() => router.push('/choisir-univers')} />
                <LigneMenu libelle="Notifications" onPress={() => router.push('/notifications')} />
                <LigneMenu libelle="Préférences de notification" onPress={() => router.push('/preferences-notification')} />
                <LigneMenu libelle="Paramètres" onPress={() => router.push('/parametres')} />
                <LigneMenu libelle="Besoin d'aide ?" onPress={() => ouvrirSite('/#contact')} dernier />
            </Carte>

            <Text style={base.sectionTitre}>Voyages</Text>
            <Carte style={styles.menu}>
                <LigneMenu libelle="Retrouver une réservation" onPress={() => router.push('/reservation-consultation')} />
                <LigneMenu libelle="Villes desservies" onPress={() => router.push('/villes-desservies')} dernier />
            </Carte>

            <Text style={base.sectionTitre}>Logement</Text>
            <Carte style={styles.menu}>
                <LigneMenu libelle="Mes annonces" onPress={() => router.push('/mes-annonces')} />
                <LigneMenu libelle="Mes favoris" onPress={() => router.navigate('/(tabs)/favoris')} />
                <LigneMenu libelle="Mes demandes" onPress={() => router.navigate('/(tabs)/demandes')} dernier />
            </Carte>

            <Text style={base.sectionTitre}>Mentions légales</Text>
            <Carte style={styles.menu}>
                <LigneMenu libelle="Conditions générales" onPress={() => ouvrirSite('/#conditions')} />
                <LigneMenu libelle="Confidentialité des données" onPress={() => ouvrirSite('/#confidentialite')} dernier />
            </Carte>

            <Text style={base.sectionTitre}>À propos</Text>
            <Carte style={styles.menu}>
                <LigneMenu libelle="Version" valeur={version} />
                <LigneMenu libelle="Environnement" valeur={config.nom === 'prod' ? 'Production' : 'Test'} dernier />
            </Carte>

            {user && (
                <Bouton
                    libelle="Se déconnecter"
                    variante="secondaire"
                    onPress={() => {
                        void logout().then(() => router.replace(UNIVERS[univers ?? 'voyager'].accueil));
                    }}
                />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    invitation: { backgroundColor: couleurs.vert, borderColor: couleurs.vert, padding: espaces.xl },
    invitationTitre: { ...texte.titre, color: couleurs.blanc },
    invitationTexte: { ...texte.secondaire, color: couleurs.surVertSecondaire, marginTop: espaces.sm },
    menu: { paddingVertical: 0 }
});

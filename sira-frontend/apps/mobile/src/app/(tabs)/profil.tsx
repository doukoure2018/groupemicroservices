import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useAuth } from '../../auth/contexte';
import { config } from '../../config';
import { Bouton, Carte, LigneMenu, styles as base } from '../../ui/base';
import { couleurs, espaces } from '../../ui/theme';

/**
 * « Mon compte » se visite sans session : la carte du haut invite alors à
 * s'identifier et le menu reste visible, pour montrer ce que le compte
 * apporte. Les pages légales et l'aide vivent sur le site, qui fait foi.
 */
export default function MonCompte() {
    const { user, logout } = useAuth();
    const version = Constants.expoConfig?.version ?? '';
    const ouvrirSite = (chemin: string) => void WebBrowser.openBrowserAsync(`${config.siteWeb}${chemin}`).catch(() => undefined);

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            {user ? (
                <Carte style={{ gap: espaces.xs }}>
                    <Text style={base.titre}>
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
                        onPress={() => router.push({ pathname: '/connexion', params: { suite: '/profil' } })}
                        style={{ marginTop: espaces.lg }}
                    />
                </Carte>
            )}

            <Text style={base.sectionTitre}>Général</Text>
            <Carte style={styles.menu}>
                <LigneMenu libelle="Notifications" onPress={() => router.push('/notifications')} />
                <LigneMenu libelle="Paramètres" onPress={() => router.push('/parametres')} />
                <LigneMenu libelle="Préférences de notification" onPress={() => router.push('/preferences-notification')} dernier />
            </Carte>

            <Text style={base.sectionTitre}>Services</Text>
            <Carte style={styles.menu}>
                <LigneMenu libelle="Retrouver une réservation" onPress={() => router.push('/reservation-consultation')} />
                <LigneMenu libelle="Villes desservies" onPress={() => router.push('/villes-desservies')} />
                <LigneMenu libelle="Besoin d'aide ?" onPress={() => ouvrirSite('/#contact')} dernier />
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
                        void logout().then(() => router.replace('/(tabs)'));
                    }}
                />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    invitation: { backgroundColor: couleurs.vert, borderColor: couleurs.vert, padding: espaces.xl },
    invitationTitre: { color: couleurs.blanc, fontSize: 22, fontWeight: '800' },
    invitationTexte: { color: '#d7e6dc', lineHeight: 22, marginTop: espaces.sm },
    menu: { paddingVertical: 0 }
});

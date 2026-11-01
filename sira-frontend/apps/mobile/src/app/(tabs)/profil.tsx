import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useAuth } from '../../auth/contexte';
import { config } from '../../config';
import { Bouton, Carte, LigneMenu, styles as base } from '../../ui/base';
import { couleurs, espaces } from '../../ui/theme';

/**
 * « Mon compte » se visite sans session : la carte du haut invite alors à
 * s'identifier et le menu reste visible, pour montrer ce que le compte
 * apporte. Chaque rang qui a besoin d'une session la demande lui-même.
 */
export default function MonCompte() {
    const { user, logout } = useAuth();
    const version = Constants.expoConfig?.version ?? '';

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
                <LigneMenu libelle="Notifications" onPress={() => router.push('/notifications')} dernier />
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

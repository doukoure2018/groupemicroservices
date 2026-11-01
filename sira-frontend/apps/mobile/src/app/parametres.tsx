import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useAuth } from '../auth/contexte';
import { config } from '../config';
import { Bandeau, Bouton, Carte, LigneMenu, styles as base } from '../ui/base';
import { couleurs, espaces } from '../ui/theme';

/**
 * Monnaie et langue ne sont pas encore des choix : la Guinée paie en francs
 * guinéens et l'application ne parle que français. Ils figurent ici pour que
 * le voyageur sache à quoi s'attendre, et deviendront des réglages le jour où
 * il y aura autre chose à choisir.
 */
export default function Parametres() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [confirmer, setConfirmer] = useState(false);
    const [efface, setEfface] = useState(false);

    async function effacerDonnees() {
        // Tout ce qui est propre à cet appareil : la session du trousseau et
        // les réponses mises en cache. Les réservations, elles, vivent sur le
        // serveur et se retrouvent à la prochaine connexion.
        if (user) await logout();
        queryClient.clear();
        setConfirmer(false);
        setEfface(true);
        router.replace('/(tabs)');
    }

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <Carte style={styles.menu}>
                <LigneMenu libelle="Monnaie" valeur="Franc guinéen (GNF)" />
                <LigneMenu libelle="Langue de l'application" valeur="Français" />
                <LigneMenu
                    libelle="Paramètres de confidentialité"
                    onPress={() => void WebBrowser.openBrowserAsync(`${config.siteWeb}/#confidentialite`).catch(() => undefined)}
                    dernier
                />
            </Carte>

            <Text style={base.sectionTitre}>Gérer vos données</Text>
            <Carte style={{ gap: espaces.md }}>
                <Text style={base.attenue}>
                    Efface de ce téléphone votre session et les données mises en cache. Vos réservations restent sur votre compte et reviendront à la prochaine connexion.
                </Text>
                {efface && <Bandeau type="succes">Les données de cet appareil ont été effacées.</Bandeau>}
                {confirmer ? (
                    <>
                        <Bandeau type="alerte">Vous serez déconnecté de ce téléphone. Confirmez-vous ?</Bandeau>
                        <Bouton libelle="Oui, effacer" variante="danger" onPress={() => void effacerDonnees()} />
                        <Bouton libelle="Annuler" variante="discret" onPress={() => setConfirmer(false)} />
                    </>
                ) : (
                    <Bouton libelle="Supprimer les données stockées localement" variante="secondaire" onPress={() => setConfirmer(true)} />
                )}
            </Carte>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    menu: { paddingVertical: 0, borderColor: couleurs.ligne }
});

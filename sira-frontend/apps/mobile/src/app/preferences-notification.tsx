import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PreferencesNotification } from '@sira/core';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth/contexte';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../ui/base';
import { couleurs, espaces, texte } from '../ui/theme';

/**
 * Deux interrupteurs, comme l'écran de référence. Ils ne taisent que les
 * notifications poussées : la liste des notifications reste tenue, et les
 * courriels de confirmation d'une commande partent de toute façon.
 */
export default function PreferencesNotificationEcran() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const prefs = useQuery({
        queryKey: ['preferences-notification'],
        queryFn: async () => (await api.notifications.preferences()).data.preferences,
        enabled: !!user
    });

    const enregistrer = useMutation({
        mutationFn: async (valeurs: PreferencesNotification) => (await api.notifications.majPreferences(valeurs)).data.preferences,
        // Le réglage suit le doigt ; le serveur ne fait que confirmer.
        onMutate: (valeurs) => queryClient.setQueryData(['preferences-notification'], valeurs),
        onError: () => void prefs.refetch()
    });

    if (!user) {
        return (
            <EtatVide
                titre="Connectez-vous"
                texte="Vos préférences de notification sont rattachées à votre compte."
                action={<Bouton libelle="S'identifier" onPress={() => router.push({ pathname: '/connexion', params: { suite: '/preferences-notification' } })} />}
            />
        );
    }
    if (prefs.isPending) return <Chargement />;
    if (prefs.isError || !prefs.data) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={() => void prefs.refetch()} />} />;
    }

    const valeurs = prefs.data;
    const basculer = (champ: keyof PreferencesNotification) => enregistrer.mutate({ ...valeurs, [champ]: !valeurs[champ] });

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <Carte style={{ gap: espaces.lg }}>
                <Reglage
                    libelle="Mises à jour du trajet"
                    aide="Confirmation, paiement, changement de départ et demande d'avis."
                    valeur={valeurs.misesAJourTrajet}
                    onChange={() => basculer('misesAJourTrajet')}
                />
                <Reglage
                    libelle="Remises et promos"
                    aide="Offres spéciales et réductions sur vos trajets habituels."
                    valeur={valeurs.promotions}
                    onChange={() => basculer('promotions')}
                />
            </Carte>
            <Bandeau type="info">
                Ces réglages ne concernent que les notifications poussées. Vos billets et les courriels de confirmation vous parviennent dans tous les cas, et la liste des
                notifications reste consultable.
            </Bandeau>
            {enregistrer.isError && <Bandeau type="erreur">L'enregistrement a échoué. Vérifiez votre réseau puis réessayez.</Bandeau>}
        </ScrollView>
    );
}

function Reglage({ libelle, aide, valeur, onChange }: { libelle: string; aide: string; valeur: boolean; onChange: () => void }) {
    return (
        <View style={styles.ligne}>
            <View style={{ flex: 1 }}>
                <Text style={styles.libelle}>{libelle}</Text>
                <Text style={base.attenue}>{aide}</Text>
            </View>
            <Switch
                value={valeur}
                onValueChange={onChange}
                accessibilityLabel={libelle}
                trackColor={{ true: couleurs.vert, false: couleurs.ligne }}
                thumbColor={couleurs.blanc}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    ligne: { flexDirection: 'row', alignItems: 'center', gap: espaces.lg },
    libelle: { ...texte.appuye, color: couleurs.encre, marginBottom: 2 }
});

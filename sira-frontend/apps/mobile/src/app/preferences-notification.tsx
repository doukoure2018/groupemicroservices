import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PreferencesNotification, PreferencesNotificationImmo } from '@sira/core';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth/contexte';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../ui/base';
import { couleurs, espaces, texte } from '../ui/theme';

/**
 * Deux sections, une par univers. Côté Voyages, les interrupteurs ne taisent
 * que les notifications poussées : la liste reste tenue et les courriels de
 * confirmation partent de toute façon. Côté Logement, ce sont les SMS que
 * le service immobilier envoie, avec les réglages qu'il tient déjà.
 */
export default function PreferencesNotificationEcran() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const voyages = useQuery({
        queryKey: ['preferences-notification'],
        queryFn: async () => (await api.notifications.preferences()).data.preferences,
        enabled: !!user
    });
    const enregistrerVoyages = useMutation({
        mutationFn: async (valeurs: PreferencesNotification) => (await api.notifications.majPreferences(valeurs)).data.preferences,
        // Le réglage suit le doigt ; le serveur ne fait que confirmer.
        onMutate: (valeurs) => queryClient.setQueryData(['preferences-notification'], valeurs),
        onError: () => void voyages.refetch()
    });

    const logement = useQuery({
        queryKey: ['preferences-notification-immo'],
        queryFn: async () => (await api.immo.clientSide.preferences()).data.preferences,
        enabled: !!user
    });
    const enregistrerLogement = useMutation({
        mutationFn: async (valeurs: PreferencesNotificationImmo) => (await api.immo.clientSide.majPreferences(valeurs)).data.preferences,
        onMutate: (valeurs) => queryClient.setQueryData(['preferences-notification-immo'], valeurs),
        onError: () => void logement.refetch()
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
    if (voyages.isPending) return <Chargement />;
    if (voyages.isError || !voyages.data) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={() => void voyages.refetch()} />} />;
    }

    const v = voyages.data;
    const basculerVoyage = (champ: keyof PreferencesNotification) => enregistrerVoyages.mutate({ ...v, [champ]: !v[champ] });
    const l = logement.data;
    const basculerLogement = (champ: keyof PreferencesNotificationImmo) => {
        if (l) enregistrerLogement.mutate({ ...l, [champ]: !l[champ] });
    };
    const erreur = enregistrerVoyages.isError || enregistrerLogement.isError;

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <Text style={base.sectionTitre}>Voyages</Text>
            <Carte style={{ gap: espaces.lg }}>
                <Reglage
                    libelle="Mises à jour du trajet"
                    aide="Confirmation, paiement, changement de départ et demande d'avis."
                    valeur={v.misesAJourTrajet}
                    onChange={() => basculerVoyage('misesAJourTrajet')}
                />
                <Reglage libelle="Remises et promos" aide="Offres spéciales et réductions sur vos trajets habituels." valeur={v.promotions} onChange={() => basculerVoyage('promotions')} />
            </Carte>

            <Text style={base.sectionTitre}>Logement</Text>
            <Carte style={{ gap: espaces.lg }}>
                {logement.isPending && <Text style={base.attenue}>Chargement…</Text>}
                {logement.isError && (
                    <View style={{ gap: espaces.sm }}>
                        <Bandeau type="alerte">Les réglages du logement n'ont pas pu être chargés.</Bandeau>
                        <Bouton libelle="Réessayer" variante="discret" onPress={() => void logement.refetch()} />
                    </View>
                )}
                {l && (
                    <>
                        <Reglage libelle="Nouveau contact" aide="Par SMS, quand quelqu'un vous écrit au sujet d'un bien que vous avez publié." valeur={l.contactSms} onChange={() => basculerLogement('contactSms')} />
                        <Reglage libelle="Visite confirmée" aide="Par SMS, quand une visite que vous avez demandée est confirmée." valeur={l.visiteConfirmeeSms} onChange={() => basculerLogement('visiteConfirmeeSms')} />
                    </>
                )}
            </Carte>

            <Bandeau type="info">
                Ces réglages ne concernent que les notifications poussées et les SMS. Vos billets et les courriels de confirmation vous parviennent dans tous les cas, et la
                liste des notifications reste consultable.
            </Bandeau>
            {erreur && <Bandeau type="erreur">L'enregistrement a échoué. Vérifiez votre réseau puis réessayez.</Bandeau>}
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
            <Switch value={valeur} onValueChange={onChange} accessibilityLabel={libelle} trackColor={{ true: couleurs.vert, false: couleurs.ligne }} thumbColor={couleurs.blanc} />
        </View>
    );
}

const styles = StyleSheet.create({
    ligne: { flexDirection: 'row', alignItems: 'center', gap: espaces.lg },
    libelle: { ...texte.appuye, color: couleurs.encre, marginBottom: 2 }
});

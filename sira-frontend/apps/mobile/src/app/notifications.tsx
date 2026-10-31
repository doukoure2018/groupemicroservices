import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateFr, type AppNotification } from '@sira/core';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { destinationNotification } from '../notifications/push';
import { Bouton, Chargement, EtatVide, styles as base } from '../ui/base';
import { couleurs, espaces, rayons } from '../ui/theme';

/** Centre de notifications in-app : la même liste que celle que le serveur pousse. */
export default function NotificationsEcran() {
    const queryClient = useQueryClient();
    const liste = useQuery({ queryKey: ['notifications'], queryFn: async () => (await api.notifications.list()).data.notifications ?? [] });

    const invalider = () => {
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications-non-lues'] });
    };
    const lire = useMutation({ mutationFn: async (id: number) => api.notifications.markRead(id), onSuccess: invalider });
    const toutLire = useMutation({ mutationFn: async () => api.notifications.markAllRead(), onSuccess: invalider });

    if (liste.isPending) return <Chargement texte="Chargement des notifications…" />;
    if (liste.isError) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={() => void liste.refetch()} />} />;
    }

    const notifications = liste.data;
    const nonLues = notifications.filter((n) => !n.lue).length;

    function ouvrir(n: AppNotification) {
        if (!n.lue && n.notificationId) lire.mutate(n.notificationId);
        const cible = destinationNotification(n);
        if (cible && cible !== '/notifications') router.push(cible as never);
    }

    return (
        <FlatList
            style={base.ecran}
            contentContainerStyle={base.contenu}
            data={notifications}
            keyExtractor={(n) => n.notificationUuid ?? String(n.notificationId)}
            refreshControl={<RefreshControl refreshing={liste.isFetching} onRefresh={() => void liste.refetch()} tintColor={couleurs.vert} />}
            ListHeaderComponent={
                nonLues > 0 ? (
                    <View style={base.ligne}>
                        <Text style={base.attenue}>
                            {nonLues} non lue{nonLues > 1 ? 's' : ''}
                        </Text>
                        <Bouton libelle="Tout marquer comme lu" variante="discret" onPress={() => toutLire.mutate()} enCours={toutLire.isPending} />
                    </View>
                ) : undefined
            }
            ListEmptyComponent={<EtatVide titre="Aucune notification" texte="Confirmations de paiement, rappels de départ et demandes d'avis apparaîtront ici." />}
            renderItem={({ item }) => (
                <Pressable accessibilityRole="button" onPress={() => ouvrir(item)} style={[styles.ligne, !item.lue && styles.ligneNonLue]}>
                    <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.titre, !item.lue && styles.titreNonLu]}>{item.titre ?? item.categorie ?? 'Notification'}</Text>
                        <Text style={styles.message}>{item.message}</Text>
                        <Text style={styles.date}>{formatDateFr(item.dateEnvoi ?? item.createdAt)}</Text>
                    </View>
                    {!item.lue && <View style={styles.point} accessibilityLabel="Non lue" />}
                </Pressable>
            )}
        />
    );
}

const styles = StyleSheet.create({
    ligne: { flexDirection: 'row', alignItems: 'center', gap: espaces.md, backgroundColor: couleurs.blanc, borderRadius: rayons.lg, padding: espaces.lg, borderWidth: 1, borderColor: couleurs.ligne },
    ligneNonLue: { borderColor: couleurs.vert },
    titre: { fontWeight: '600', color: couleurs.encre },
    titreNonLu: { fontWeight: '800' },
    message: { color: couleurs.gris, lineHeight: 20 },
    date: { color: couleurs.gris, fontSize: 12, marginTop: 2 },
    point: { width: 10, height: 10, borderRadius: 5, backgroundColor: couleurs.vert }
});

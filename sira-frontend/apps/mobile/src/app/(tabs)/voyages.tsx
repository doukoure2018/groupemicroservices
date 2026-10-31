import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    formatDateFr,
    formatHeure,
    formatMontant,
    getStatutCommandeLabel,
    getStatutCommandeSeverity,
    isCommandeAnnulable,
    peutReprendrePaiement,
    type CommandeClient
} from '@sira/core';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces } from '../../ui/theme';

export default function MesVoyages() {
    const commandesQuery = useQuery({ queryKey: ['mes-commandes'], queryFn: async () => (await api.commandes.mesCommandes()).data.commandes ?? [] });

    if (commandesQuery.isPending) return <Chargement texte="Chargement de vos réservations…" />;
    if (commandesQuery.isError) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={() => void commandesQuery.refetch()} />} />;
    }

    return (
        <FlatList
            style={base.ecran}
            contentContainerStyle={base.contenu}
            data={commandesQuery.data}
            keyExtractor={(c) => c.commandeUuid ?? c.numeroCommande ?? ''}
            refreshControl={<RefreshControl refreshing={commandesQuery.isFetching} onRefresh={() => void commandesQuery.refetch()} tintColor={couleurs.vert} />}
            ListEmptyComponent={
                <EtatVide
                    titre="Aucune réservation"
                    texte="Vos voyages et vos billets apparaîtront ici."
                    action={<Bouton libelle="Rechercher un voyage" onPress={() => router.navigate('/(tabs)')} />}
                />
            }
            renderItem={({ item }) => <CarteCommande commande={item} />}
        />
    );
}

function CarteCommande({ commande }: { commande: CommandeClient }) {
    const queryClient = useQueryClient();
    const [confirmer, setConfirmer] = useState(false);
    const severite = getStatutCommandeSeverity(commande.statut);

    const annuler = useMutation({
        mutationFn: async () => api.commandes.annuler(commande.commandeUuid!),
        onSuccess: () => {
            setConfirmer(false);
            void queryClient.invalidateQueries({ queryKey: ['mes-commandes'] });
        }
    });

    return (
        <Carte style={{ gap: espaces.sm }}>
            <View style={base.ligne}>
                <Text style={[base.gras, { flexShrink: 1 }]}>
                    {commande.villeDepartLibelle ?? commande.siteDepart} → {commande.villeArriveeLibelle ?? commande.siteArrivee}
                </Text>
                <Text style={[styles.badge, styles[`badge_${severite}`]]}>{getStatutCommandeLabel(commande.statut)}</Text>
            </View>
            <Text style={base.attenue}>
                {formatDateFr(commande.dateDepart)} à {formatHeure(commande.heureDepart)}
            </Text>
            <Text style={base.attenue}>
                Commande {commande.numeroCommande} · {commande.nombrePlaces} {(commande.nombrePlaces ?? 1) > 1 ? 'places' : 'place'} · {formatMontant(commande.montantTotal, commande.devise)}
            </Text>

            {commande.statut === 'EN_ATTENTE' && (
                <Bandeau type="alerte">Paiement non terminé. Les billets seront émis après règlement, et les places remises en vente si le paiement n'aboutit pas.</Bandeau>
            )}

            <View style={{ gap: espaces.sm, marginTop: espaces.xs }}>
                {peutReprendrePaiement(commande) && (
                    <Bouton libelle="Reprendre le paiement" onPress={() => void WebBrowser.openBrowserAsync(commande.urlPaiement!).catch(() => undefined)} />
                )}
                {commande.statut === 'EN_ATTENTE' && commande.referencePaiement && (
                    <Bouton
                        libelle="Vérifier le paiement"
                        variante="secondaire"
                        onPress={() => router.push({ pathname: '/paiement/[reference]', params: { reference: commande.referencePaiement! } })}
                    />
                )}
                {commande.statut !== 'EN_ATTENTE' && (commande.billets?.length ?? 0) > 0 && (
                    <Bouton
                        libelle={`Voir les billets (${commande.billets!.length})`}
                        variante="secondaire"
                        onPress={() => router.push({ pathname: '/commande/[uuid]', params: { uuid: commande.commandeUuid! } })}
                    />
                )}
                {isCommandeAnnulable(commande.statut) && !confirmer && <Bouton libelle="Annuler la réservation" variante="discret" onPress={() => setConfirmer(true)} />}
                {confirmer && (
                    <Carte style={{ gap: espaces.sm, backgroundColor: couleurs.dangerPale, borderColor: couleurs.dangerPale }}>
                        <Text style={base.gras}>Annuler définitivement cette réservation ?</Text>
                        <Bouton libelle="Oui, annuler" variante="danger" onPress={() => annuler.mutate()} enCours={annuler.isPending} />
                        <Bouton libelle="Non, conserver" variante="discret" onPress={() => setConfirmer(false)} />
                        {annuler.isError && <Text style={{ color: couleurs.danger }}>L'annulation a été refusée (délai dépassé ou voyage déjà commencé).</Text>}
                    </Carte>
                )}
            </View>
        </Carte>
    );
}

const styles = StyleSheet.create({
    badge: { paddingHorizontal: espaces.sm, paddingVertical: 2, borderRadius: 999, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
    badge_success: { backgroundColor: couleurs.succesPale, color: couleurs.vertFonce },
    badge_warn: { backgroundColor: couleurs.alertePale, color: couleurs.alerte },
    badge_danger: { backgroundColor: couleurs.dangerPale, color: couleurs.danger },
    badge_info: { backgroundColor: couleurs.vertPale, color: couleurs.vertFonce },
    badge_secondary: { backgroundColor: couleurs.ligne, color: couleurs.gris }
});

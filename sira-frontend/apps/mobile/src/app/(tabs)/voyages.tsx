import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    formatDateCourte,
    formatHeure,
    formatMontant,
    getStatutCommandeLabel,
    getStatutCommandeSeverity,
    isCommandeAnnulable,
    aujourdhuiIso,
    jourIso,
    peutNoterVoyage,
    peutReprendrePaiement,
    type CommandeClient
} from '@sira/core';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { IllustrationBillet } from '../../ui/illustrations';
import { couleurs, espaces } from '../../ui/theme';

/** L'onglet Billets se visite sans compte ; les billets, eux, sont ceux du compte. */
export default function Billets() {
    const { user } = useAuth();
    const connecte = !!user;
    const commandesQuery = useQuery({
        queryKey: ['mes-commandes'],
        queryFn: async () => (await api.commandes.mesCommandes()).data.commandes ?? [],
        enabled: connecte
    });

    if (!connecte) return <BilletsSansCompte />;
    if (commandesQuery.isPending) return <Chargement texte="Chargement de vos billets…" />;
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

function BilletsSansCompte() {
    return (
        <View style={styles.sansCompte}>
            <IllustrationBillet />
            <Text style={base.etatVideTitre}>Vous n'avez pas encore de billets</Text>
            <Text style={base.etatVideTexte}>Connectez-vous pour retrouver ici les billets achetés avec votre compte, sur ce téléphone comme sur le site.</Text>
            <Bouton
                libelle="S'identifier ou s'inscrire"
                onPress={() => router.push({ pathname: '/connexion', params: { suite: '/voyages' } })}
                style={{ alignSelf: 'stretch', marginTop: espaces.xl }}
            />
            <Bouton
                libelle="Rechercher une réservation"
                variante="secondaire"
                onPress={() => router.push('/reservation-consultation')}
                style={{ alignSelf: 'stretch' }}
            />
        </View>
    );
}

/** Le serveur n'accepte que les commandes confirmées ou payées dont le départ est à venir. */
function peutChangerDeDate(commande: CommandeClient): boolean {
    if (commande.statut !== 'CONFIRMEE' && commande.statut !== 'PAYEE') return false;
    const jour = jourIso(commande.dateDepart);
    return jour !== null && jour >= aujourdhuiIso();
}

function CarteCommande({ commande }: { commande: CommandeClient }) {
    const queryClient = useQueryClient();
    const [confirmer, setConfirmer] = useState(false);
    const severite = getStatutCommandeSeverity(commande.statut);
    const avisDonne = queryClient.getQueryData<boolean>(['avis-donne', commande.commandeUuid]) === true;

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
                {formatDateCourte(commande.dateDepart)} à {formatHeure(commande.heureDepart)}
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
                {peutNoterVoyage(commande) && !avisDonne && (
                    <Bouton libelle="Noter ce voyage" variante="secondaire" onPress={() => router.push({ pathname: '/noter/[uuid]', params: { uuid: commande.commandeUuid! } })} />
                )}
                {avisDonne && <Text style={[base.attenue, { textAlign: 'center' }]}>Merci, votre avis a été enregistré.</Text>}
                {peutChangerDeDate(commande) && (
                    <Bouton
                        libelle="Changer de date"
                        variante="secondaire"
                        onPress={() => router.push({ pathname: '/modifier-date/[uuid]', params: { uuid: commande.commandeUuid! } })}
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
    sansCompte: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaces.xl, gap: espaces.sm },
    badge: { paddingHorizontal: espaces.sm, paddingVertical: 2, borderRadius: 999, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
    badge_success: { backgroundColor: couleurs.succesPale, color: couleurs.vertFonce },
    badge_warn: { backgroundColor: couleurs.alertePale, color: couleurs.alerte },
    badge_danger: { backgroundColor: couleurs.dangerPale, color: couleurs.danger },
    badge_info: { backgroundColor: couleurs.vertPale, color: couleurs.vertFonce },
    badge_secondary: { backgroundColor: couleurs.ligne, color: couleurs.gris }
});

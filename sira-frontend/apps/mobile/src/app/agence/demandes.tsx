import { ApiError } from '@sira/api-client';
import { useQuery } from '@tanstack/react-query';
import { formatDateCourte, formatMontant, libelleStatutBesoin, type DemandeBesoin, type ScopeDemandes } from '@sira/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { ExigerAgence } from '../../auth/exiger-agence';
import { messageErreur } from '../../immo/feuilles-relation';
import { Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { Puce, Puces } from '../../ui/formulaire';
import { couleurs, espaces, rayons, texte } from '../../ui/theme';

/**
 * Les besoins déclarés par les clients, pour l'agence vérifiée : ceux de sa
 * zone d'abord, tous si elle le souhaite. Un appel ou un message WhatsApp
 * part d'ici ; la mise en relation se fait ensuite entre eux.
 */
function DemandesClientsEcran() {
    const [scope, setScope] = useState<ScopeDemandes>('ZONE');
    const demandes = useQuery({
        queryKey: ['demandes-clients', scope],
        queryFn: async () => (await api.immo.clientSide.mesDemandes({ scope, limit: 50, offset: 0 })).data.demandes ?? [],
        // Un refus du serveur (pas d'agence, agence non vérifiée) ne se réessaie pas : il s'explique.
        retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 2
    });

    if (demandes.isPending) return <Chargement texte="Chargement des demandes…" />;
    if (demandes.isError) {
        const refus = demandes.error instanceof ApiError && demandes.error.status >= 400 && demandes.error.status < 500;
        return (
            <EtatVide
                titre={refus ? 'Demandes indisponibles' : 'Chargement impossible'}
                texte={
                    refus
                        ? messageErreur(demandes.error, "Les demandes clients s'ouvrent une fois le dossier de l'agence validé par la conformité.")
                        : 'Vérifiez votre réseau puis réessayez.'
                }
                action={<Bouton libelle={refus ? 'Mon agence' : 'Réessayer'} onPress={() => (refus ? router.replace('/agence') : void demandes.refetch())} />}
            />
        );
    }

    return (
        <FlatList
            style={base.ecran}
            contentContainerStyle={{ padding: espaces.lg, gap: espaces.md, paddingBottom: espaces.xxl }}
            data={demandes.data}
            keyExtractor={(d) => d.demandeUuid ?? String(d.demandeId)}
            refreshControl={<RefreshControl refreshing={demandes.isFetching} onRefresh={() => void demandes.refetch()} tintColor={couleurs.vert} />}
            ListHeaderComponent={
                <Puces>
                    <Puce role="radio" libelle="Ma zone" actif={scope === 'ZONE'} onPress={() => setScope('ZONE')} />
                    <Puce role="radio" libelle="Toutes les demandes" actif={scope === 'TOUTES'} onPress={() => setScope('TOUTES')} />
                </Puces>
            }
            ListEmptyComponent={
                <EtatVide
                    titre="Aucune demande"
                    texte={scope === 'ZONE' ? "Aucun client ne cherche dans votre zone pour le moment. Regardez toutes les demandes." : 'Aucune demande active pour le moment.'}
                />
            }
            renderItem={({ item }) => <CarteDemande d={item} />}
        />
    );
}

function CarteDemande({ d }: { d: DemandeBesoin }) {
    const ou = [d.quartierLibelle ?? d.quartierTexte, d.communeLibelle ?? d.communeTexte, d.regionLibelle].filter(Boolean).join(', ');
    const budget =
        d.budgetMin != null && d.budgetMax != null
            ? `${formatMontant(d.budgetMin, d.devise ?? 'GNF')} à ${formatMontant(d.budgetMax, d.devise ?? 'GNF')}`
            : d.budgetMax != null
              ? `jusqu'à ${formatMontant(d.budgetMax, d.devise ?? 'GNF')}`
              : d.budgetMin != null
                ? `à partir de ${formatMontant(d.budgetMin, d.devise ?? 'GNF')}`
                : null;
    const telephone = d.contactTelephone?.trim();
    const whatsapp = d.contactWhatsapp?.replace(/[^0-9]/g, '');

    return (
        <Carte style={{ gap: espaces.xs }}>
            <View style={base.ligne}>
                <Text style={styles.etiquette}>
                    {d.typeAnnonce === 'ACHAT' ? 'Acheter' : 'Louer'}
                    {d.typeBienLibelle ? ` · ${d.typeBienLibelle}` : ''}
                </Text>
                <Text style={styles.statut}>{libelleStatutBesoin(d.statut)}</Text>
            </View>
            {!!ou && <Text style={styles.titre}>{ou}</Text>}
            <Text style={base.attenue}>
                {[budget, d.nbChambresMin ? `${d.nbChambresMin} chambre${d.nbChambresMin > 1 ? 's' : ''} au moins` : null].filter(Boolean).join(' · ') || 'Sans précision de budget'}
            </Text>
            {!!d.description && <Text style={base.sousTitre}>{d.description}</Text>}
            <Text style={base.attenue}>
                {d.reference ? `${d.reference} · ` : ''}
                {d.createdAt ? `déclaré le ${formatDateCourte(d.createdAt)}` : ''}
            </Text>
            <View style={styles.actions}>
                {telephone ? <Bouton libelle="Appeler" onPress={() => void Linking.openURL(`tel:${telephone}`)} style={{ flex: 1 }} /> : null}
                {whatsapp ? <Bouton libelle="WhatsApp" variante="secondaire" onPress={() => void Linking.openURL(`https://wa.me/${whatsapp}`)} style={{ flex: 1 }} /> : null}
                {!telephone && !whatsapp && <Text style={base.attenue}>Aucun moyen de contact laissé.</Text>}
            </View>
        </Carte>
    );
}

export default function Ecran() {
    return (
        <ExigerAgence>
            <DemandesClientsEcran />
        </ExigerAgence>
    );
}

const styles = StyleSheet.create({
    etiquette: { ...texte.libelle, color: couleurs.vertFonce },
    statut: { ...texte.mention, backgroundColor: couleurs.vertPale, color: couleurs.vertFonce, borderRadius: rayons.sm, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
    titre: { ...texte.appuye, color: couleurs.encre },
    actions: { flexDirection: 'row', gap: espaces.sm, marginTop: espaces.xs, alignItems: 'center' }
});

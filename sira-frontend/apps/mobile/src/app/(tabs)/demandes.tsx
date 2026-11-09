import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import {
    formatDateCourte,
    formatMontant,
    instantMs,
    libelleStatutBesoin,
    libelleStatutContact,
    libelleStatutVisite,
    type DemandeBesoin,
    type LeadContactView,
    type LeadVisiteView
} from '@sira/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { ExigerSession } from '../../auth/exiger-session';
import { messageErreur } from '../../immo/feuilles-relation';
import { Bouton, Chargement, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces, rayons, texte, zoomMax } from '../../ui/theme';

type Filtre = 'toutes' | 'visites' | 'contacts' | 'besoins';

/** Une ligne de la liste, quelle que soit sa nature : ce qu'on lit d'un coup d'œil. */
interface Ligne {
    cle: string;
    nature: 'visite' | 'contact' | 'besoin';
    etiquette: string;
    titre: string;
    detail: string;
    statut: string;
    actif: boolean;
    quand: number;
    proprieteUuid?: string;
    annuler?: () => void;
}

/**
 * Tout ce que j'ai demandé, au même endroit : visites, contacts envoyés et
 * besoins déclarés. Le hub Flutter dispersait cela dans l'onglet Profil.
 */
function DemandesEcran() {
    const queryClient = useQueryClient();
    const [filtre, setFiltre] = useState<Filtre>('toutes');

    const [visites, contacts, besoins] = useQueries({
        queries: [
            { queryKey: ['mes-demandes', 'visites'], queryFn: async () => (await api.immo.clientSide.mesVisites({ limit: 50 })).data.visites ?? [] },
            { queryKey: ['mes-demandes', 'contacts'], queryFn: async () => (await api.immo.clientSide.mesContactsEnvoyes({ limit: 50 })).data.contacts ?? [] },
            { queryKey: ['mes-demandes', 'besoins'], queryFn: async () => (await api.immo.clientSide.mesBesoins()).data.demandes ?? [] }
        ]
    });

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['mes-demandes'] });
    const annulationVisite = useMutation({
        mutationFn: async (uuid: string) => api.immo.clientSide.annulerVisite(uuid),
        onSuccess: rafraichir,
        onError: (e) => Alert.alert('Annulation impossible', messageErreur(e, 'Vérifiez votre réseau puis réessayez.'))
    });
    const annulationBesoin = useMutation({
        mutationFn: async (uuid: string) => api.immo.clientSide.annulerBesoin(uuid),
        onSuccess: rafraichir,
        onError: (e) => Alert.alert('Annulation impossible', messageErreur(e, 'Vérifiez votre réseau puis réessayez.'))
    });

    const confirmerAnnulation = (quoi: string, faire: () => void) =>
        Alert.alert(`Annuler ${quoi} ?`, 'Le publieur en sera informé.', [
            { text: 'Garder', style: 'cancel' },
            { text: 'Annuler la demande', style: 'destructive', onPress: faire }
        ]);

    const lignes = useMemo<Ligne[]>(() => {
        const l: Ligne[] = [];
        for (const v of (visites.data ?? []) as LeadVisiteView[]) {
            const enCours = v.visite.statut === 'DEMANDEE' || v.visite.statut === 'CONFIRMEE';
            l.push({
                cle: `v-${v.visite.visiteUuid}`,
                nature: 'visite',
                etiquette: 'Visite',
                titre: v.proprieteTitre,
                detail: `${formatDateCourte(v.visite.dateVisite)}${v.visite.heureVisite ? ` à ${String(v.visite.heureVisite).slice(0, 5)}` : ''}`,
                statut: libelleStatutVisite(v.visite.statut),
                actif: enCours,
                quand: instantMs(v.visite.createdAt) ?? 0,
                proprieteUuid: v.proprieteUuid,
                annuler: enCours ? () => confirmerAnnulation('cette visite', () => annulationVisite.mutate(v.visite.visiteUuid)) : undefined
            });
        }
        for (const c of (contacts.data ?? []) as LeadContactView[]) {
            l.push({
                cle: `c-${c.contact.contactUuid}`,
                nature: 'contact',
                etiquette: 'Contact',
                titre: c.proprieteTitre,
                detail: `Envoyé le ${formatDateCourte(c.contact.createdAt)}${c.contact.vuParVendeur ? ' · lu par le publieur' : ''}`,
                statut: libelleStatutContact(c.contact.statut),
                actif: c.contact.statut === 'NOUVEAU',
                quand: instantMs(c.contact.createdAt) ?? 0,
                proprieteUuid: c.proprieteUuid
            });
        }
        for (const b of (besoins.data ?? []) as DemandeBesoin[]) {
            const ou = b.quartierLibelle ?? b.quartierTexte ?? b.communeLibelle ?? b.communeTexte;
            const budget = b.budgetMax ? `jusqu'à ${formatMontant(b.budgetMax, b.devise ?? 'GNF')}` : null;
            l.push({
                cle: `b-${b.demandeUuid}`,
                nature: 'besoin',
                etiquette: 'Besoin déclaré',
                titre: [b.typeAnnonce === 'ACHAT' ? 'Acheter' : 'Louer', b.typeBienLibelle?.toLowerCase(), ou ? `à ${ou}` : null].filter(Boolean).join(' '),
                detail: [budget, b.nbChambresMin ? `${b.nbChambresMin} chambre${b.nbChambresMin > 1 ? 's' : ''} au moins` : null].filter(Boolean).join(' · ') || (b.description ?? ''),
                statut: libelleStatutBesoin(b.statut),
                actif: b.statut === 'ACTIVE',
                quand: instantMs(b.createdAt) ?? 0,
                annuler: b.statut === 'ACTIVE' && b.demandeUuid ? () => confirmerAnnulation('ce besoin', () => annulationBesoin.mutate(b.demandeUuid!)) : undefined
            });
        }
        return l.sort((a, b) => b.quand - a.quand);
    }, [visites.data, contacts.data, besoins.data]); // eslint-disable-line react-hooks/exhaustive-deps

    const chargement = visites.isPending || contacts.isPending || besoins.isPending;
    const erreur = visites.isError || contacts.isError || besoins.isError;
    const visibles = lignes.filter((l) => filtre === 'toutes' || `${l.nature}s` === filtre);
    const compte = (n: Ligne['nature']) => lignes.filter((l) => l.nature === n).length;

    if (chargement) return <Chargement texte="Chargement de vos demandes…" />;
    if (erreur && lignes.length === 0) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={rafraichir} />} />;
    }

    return (
        <FlatList
            style={base.ecran}
            contentContainerStyle={{ padding: espaces.lg, gap: espaces.md, paddingBottom: espaces.xxl }}
            data={visibles}
            keyExtractor={(l) => l.cle}
            refreshControl={<RefreshControl refreshing={visites.isFetching || contacts.isFetching || besoins.isFetching} onRefresh={rafraichir} tintColor={couleurs.vert} />}
            ListHeaderComponent={
                <View style={styles.filtres}>
                    {(
                        [
                            ['toutes', `Toutes · ${lignes.length}`],
                            ['visites', `Visites · ${compte('visite')}`],
                            ['contacts', `Contacts · ${compte('contact')}`],
                            ['besoins', `Besoins · ${compte('besoin')}`]
                        ] as [Filtre, string][]
                    ).map(([f, libelle]) => (
                        <Pressable key={f} accessibilityRole="button" accessibilityState={{ selected: filtre === f }} onPress={() => setFiltre(f)} style={[styles.puce, filtre === f && styles.puceActive]}>
                            <Text maxFontSizeMultiplier={zoomMax} style={[styles.puceTexte, filtre === f && styles.puceTexteActif]}>
                                {libelle}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            }
            ListEmptyComponent={
                <EtatVide
                    titre={lignes.length === 0 ? 'Aucune demande' : 'Rien dans cette catégorie'}
                    texte={
                        lignes.length === 0
                            ? 'Vos demandes de visite, vos messages aux publieurs et vos besoins déclarés apparaîtront ici.'
                            : 'Changez de catégorie, ou déclarez un besoin.'
                    }
                    action={<Bouton libelle="Chercher un bien" onPress={() => router.navigate('/(tabs)/biens')} />}
                />
            }
            ListFooterComponent={
                <Bouton libelle="Déclarer un nouveau besoin" variante="secondaire" onPress={() => router.push('/declarer-besoin')} style={{ marginTop: espaces.md }} />
            }
            renderItem={({ item }) => (
                <Pressable
                    accessibilityRole={item.proprieteUuid ? 'button' : undefined}
                    disabled={!item.proprieteUuid}
                    onPress={() => item.proprieteUuid && router.push({ pathname: '/bien/[uuid]', params: { uuid: item.proprieteUuid } })}
                    style={styles.carte}
                >
                    <View style={base.ligne}>
                        <Text style={styles.etiquette}>{item.etiquette}</Text>
                        <Text style={[styles.statut, item.actif ? styles.statutActif : styles.statutPasse]}>{item.statut}</Text>
                    </View>
                    <Text style={styles.titre}>{item.titre}</Text>
                    {!!item.detail && <Text style={base.attenue}>{item.detail}</Text>}
                    {item.annuler && <Bouton libelle="Annuler la demande" variante="discret" onPress={item.annuler} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />}
                </Pressable>
            )}
        />
    );
}

/** Les demandes suivent le compte : sans session, la connexion s'ouvre et revient ici. */
export default function Ecran() {
    return (
        <ExigerSession>
            <DemandesEcran />
        </ExigerSession>
    );
}

const styles = StyleSheet.create({
    filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.sm },
    puce: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: couleurs.blanc, minHeight: 44, justifyContent: 'center' },
    puceActive: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    puceTexte: { ...texte.libelle, color: couleurs.encre },
    puceTexteActif: { color: couleurs.vertFonce },
    carte: { backgroundColor: couleurs.blanc, borderRadius: rayons.lg, borderWidth: 1, borderColor: couleurs.ligne, padding: espaces.lg, gap: espaces.xs },
    etiquette: { ...texte.libelle, color: couleurs.gris },
    statut: { ...texte.mention, borderRadius: rayons.sm, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
    statutActif: { backgroundColor: couleurs.vertPale, color: couleurs.vertFonce },
    statutPasse: { backgroundColor: couleurs.fond, color: couleurs.gris },
    titre: { ...texte.appuye, color: couleurs.encre }
});

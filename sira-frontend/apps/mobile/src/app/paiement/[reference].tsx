import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommandeClient } from '@sira/core';
import * as Linking from 'expo-linking';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { api } from '../../api';
import { ExigerSession } from '../../auth/exiger-session';
import { oublierPaiementEnCours, retenirPaiementEnCours } from '../../reservation/paiement-en-cours';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { CompteARebours } from '../../ui/compte-a-rebours';
import { couleurs, espaces } from '../../ui/theme';

/** Trois secondes pendant une minute trente : au-delà, une réponse franche. */
const INTERVALLE_MS = 3000;
const TENTATIVES_MAX = 30;

/**
 * Le retour du prestataire, quelle que soit sa forme : l'adresse du site
 * (« /paiement/retour… », la référence dans le chemin ou en requête) ou le
 * schéma de l'application. Le domaine n'entre pas en ligne de compte — la
 * configuration du serveur et celle de l'application peuvent diverger d'un
 * environnement à l'autre, le chemin, lui, ne change pas.
 */
function estUnRetour(url: string): boolean {
    if (/^(sira|synergia):\/\//i.test(url)) return true;
    try {
        return new URL(url).pathname.startsWith('/paiement/retour');
    } catch {
        return false;
    }
}

/** Ce qu'une page web sait afficher elle-même ; le reste est remis au téléphone. */
function estUnePageWeb(url: string): boolean {
    return /^https?:\/\//i.test(url) || url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:');
}

/**
 * Le règlement est entre les mains du prestataire — mais sa page s'affiche
 * ICI, dans l'écran, et non dans le navigateur du téléphone.
 *
 * Le navigateur refusait de rendre la main sans un geste du voyageur : une
 * redirection que l'opérateur déclenche lui-même n'en est pas un, et Chrome
 * répond par une page puis une demande de permission. Dans l'application,
 * c'est nous qui voyons passer l'adresse de retour et fermons la page du
 * prestataire au bon moment ; rien à confirmer, aucun écran étranger. Et
 * l'application restant au premier plan, l'interrogation de l'état continue
 * pendant que le voyageur paie : une confirmation donnée sur la demande
 * Orange Money, sans passer par la page, suffit à faire apparaître les billets.
 *
 * Chaque interrogation fait vérifier le paiement auprès du prestataire côté
 * serveur : la commande se confirme même si sa notification s'est perdue.
 */
function AttentePaiement() {
    const { reference, url, mode } = useLocalSearchParams<{ reference: string; url?: string; mode?: string }>();
    const queryClient = useQueryClient();
    const [tentatives, setTentatives] = useState(0);
    // La page du prestataire s'ouvre d'emblée quand on arrive avec son adresse ;
    // « attente » quand on revient ici plus tard, ou une fois la page refermée.
    const [phase, setPhase] = useState<'prestataire' | 'attente'>(url ? 'prestataire' : 'attente');
    const [pageEnErreur, setPageEnErreur] = useState(false);
    const expire = tentatives >= TENTATIVES_MAX;

    const etatQuery = useQuery({
        queryKey: ['paiement-etat', reference],
        queryFn: async () => (await api.paiements.etat(reference)).data.commande,
        enabled: !!reference,
        refetchInterval: (q) => {
            const c = q.state.data as CommandeClient | undefined;
            if (expire || !c || c.statut !== 'EN_ATTENTE') return false;
            return INTERVALLE_MS;
        },
        retry: 1
    });

    const commande = etatQuery.data;
    const enAttente = commande?.statut === 'EN_ATTENTE';

    useEffect(() => {
        if (url) retenirPaiementEnCours(reference);
    }, [url, reference]);

    // Retour au premier plan — après une application Orange Money, par exemple :
    // vérifier sans attendre le prochain tour.
    useEffect(() => {
        const abonnement = AppState.addEventListener('change', (etat) => {
            if (etat === 'active' && enAttente) void etatQuery.refetch();
        });
        return () => abonnement.remove();
    }, [enAttente, etatQuery]);

    // Compte les passages encore en attente pour savoir quand cesser d'espérer.
    const dernierHorodatage = useRef(0);
    useEffect(() => {
        if (!enAttente || etatQuery.dataUpdatedAt === dernierHorodatage.current) return;
        dernierHorodatage.current = etatQuery.dataUpdatedAt;
        setTentatives((n) => n + 1);
    }, [enAttente, etatQuery.dataUpdatedAt]);

    // Tranché : la liste des voyages doit se recharger à la prochaine visite.
    useEffect(() => {
        if (commande && commande.statut !== 'EN_ATTENTE') void queryClient.invalidateQueries({ queryKey: ['mes-commandes'] });
    }, [commande, queryClient]);

    // Paiement encaissé : droit aux billets, sans bouton à toucher — même si la
    // page du prestataire est encore affichée, la confirmation ayant pu venir
    // du téléphone. L'écran « Paiement reçu » ne sert plus que de filet.
    useEffect(() => {
        if (!commande?.commandeUuid) return;
        if (commande.statut !== 'EN_ATTENTE') oublierPaiementEnCours();
        if (commande.statut === 'CONFIRMEE' || commande.statut === 'PAYEE') {
            router.replace({ pathname: '/commande/[uuid]', params: { uuid: commande.commandeUuid } });
        }
    }, [commande]);

    /** La page du prestataire veut aller quelque part : on décide si c'est à elle, au téléphone, ou à nous. */
    function autoriserNavigation(demande: ShouldStartLoadRequest): boolean {
        if (estUnRetour(demande.url)) {
            setPhase('attente');
            void etatQuery.refetch();
            return false;
        }
        if (!estUnePageWeb(demande.url)) {
            // tel:, sms:, intent:, orangemoney:… — l'affaire d'une autre application.
            void Linking.openURL(demande.url).catch(() => undefined);
            return false;
        }
        return true;
    }

    /** Certaines pages changent d'adresse sans recharger : on surveille aussi ce chemin-là. */
    function surveillerNavigation(etat: WebViewNavigation): void {
        if (etat.url && estUnRetour(etat.url)) {
            setPhase('attente');
            void etatQuery.refetch();
        }
    }

    function abandonner(): void {
        Alert.alert('Quitter le paiement ?', "Si le règlement n'aboutit pas, la réservation sera annulée et les places remises en vente.", [
            { text: 'Rester', style: 'cancel' },
            { text: 'Quitter', style: 'destructive', onPress: () => router.replace('/(tabs)/voyages') }
        ]);
    }

    if (etatQuery.isPending) return <Chargement texte="Vérification du paiement…" />;

    if (etatQuery.isError) {
        return (
            <EtatVide
                titre="Vérification impossible"
                texte="Nous ne parvenons pas à vérifier ce paiement pour l'instant. Si vous avez été débité, votre réservation sera confirmée automatiquement."
                action={<Bouton libelle="Réessayer" onPress={() => void etatQuery.refetch()} />}
            />
        );
    }

    if (commande?.statut === 'CONFIRMEE' || commande?.statut === 'PAYEE') {
        return (
            <EtatVide
                titre="Paiement reçu"
                texte={`Commande ${commande.numeroCommande} confirmée. Vos billets sont prêts.`}
                action={<Bouton libelle="Voir mes billets" onPress={() => router.replace({ pathname: '/commande/[uuid]', params: { uuid: commande.commandeUuid! } })} />}
            />
        );
    }

    if (commande?.statut === 'ANNULEE') {
        return (
            <EtatVide
                titre="Paiement non abouti"
                texte="Votre opérateur n'a pas confirmé le règlement : la réservation a été annulée et les places remises en vente. Vous n'avez pas été débité."
                action={<Bouton libelle="Chercher un autre voyage" onPress={() => router.replace('/(tabs)')} />}
            />
        );
    }

    if (phase === 'prestataire' && url && enAttente) {
        return (
            <View style={base.ecran}>
                <Stack.Screen
                    options={{
                        title: mode ? `Paiement ${mode}` : 'Paiement',
                        headerRight: () => (
                            <Pressable onPress={abandonner} accessibilityRole="button" hitSlop={12} style={{ paddingHorizontal: espaces.md }}>
                                <Text style={styles.annuler}>Quitter</Text>
                            </Pressable>
                        )
                    }}
                />
                {pageEnErreur ? (
                    <EtatVide
                        titre="La page de paiement ne répond pas"
                        texte="Vérifiez votre réseau puis réessayez. Si vous avez déjà validé le règlement sur votre téléphone, vérifiez-le simplement."
                        action={
                            <View style={{ gap: espaces.sm }}>
                                <Bouton libelle="Réessayer" onPress={() => setPageEnErreur(false)} />
                                <Bouton libelle="J'ai payé, vérifier" variante="secondaire" onPress={() => setPhase('attente')} />
                            </View>
                        }
                    />
                ) : (
                    <WebView
                        source={{ uri: url }}
                        style={{ flex: 1, backgroundColor: couleurs.fond }}
                        onShouldStartLoadWithRequest={autoriserNavigation}
                        onNavigationStateChange={surveillerNavigation}
                        onError={() => setPageEnErreur(true)}
                        onHttpError={(e) => {
                            if (e.nativeEvent.statusCode >= 500) setPageEnErreur(true);
                        }}
                        startInLoadingState
                        renderLoading={() => (
                            <View style={styles.chargementPage}>
                                <Chargement texte={`Ouverture de la page ${mode ?? 'de paiement'}…`} />
                            </View>
                        )}
                        // Une seule page à la fois : un lien « nouvelle fenêtre » s'ouvre ici même.
                        setSupportMultipleWindows={false}
                        javaScriptEnabled
                        domStorageEnabled
                        sharedCookiesEnabled
                        allowsBackForwardNavigationGestures={false}
                    />
                )}
                {commande?.expireLe && (
                    <View style={styles.piedPage}>
                        <CompteARebours jusqua={commande.expireLe} />
                    </View>
                )}
            </View>
        );
    }

    return (
        <ScrollView style={base.ecran} contentContainerStyle={[base.contenu, { flexGrow: 1, justifyContent: 'center' }]}>
            <Stack.Screen options={{ title: 'Paiement', headerRight: undefined }} />
            {!expire && <Chargement />}
            <Text style={[base.titre, { textAlign: 'center' }]}>{expire ? 'Paiement toujours en attente' : `Paiement en cours${mode ? ` chez ${mode}` : ''}`}</Text>
            {commande?.expireLe && !expire && <CompteARebours jusqua={commande.expireLe} />}
            <Text style={[base.sousTitre, { textAlign: 'center' }]}>
                {expire
                    ? "Votre opérateur n'a pas encore répondu. Si le règlement aboutit, votre réservation sera confirmée automatiquement et vous recevrez un email. Vous pouvez suivre son statut dans Billets."
                    : "Validez la demande de confirmation reçue sur votre téléphone. Cet écran se mettra à jour de lui-même, et vos billets s'ouvriront dès que l'opérateur aura confirmé."}
            </Text>
            <Carte style={{ gap: espaces.md }}>
                <Bouton
                    libelle={expire ? 'Vérifier encore' : "J'ai payé, vérifier"}
                    onPress={() => {
                        setTentatives(0);
                        void etatQuery.refetch();
                    }}
                    enCours={etatQuery.isFetching}
                />
                {url && (
                    <Bouton
                        libelle="Rouvrir la page de paiement"
                        variante="secondaire"
                        onPress={() => {
                            setPageEnErreur(false);
                            setPhase('prestataire');
                        }}
                    />
                )}
                <Bouton libelle="Mes billets" variante="discret" onPress={() => router.replace('/(tabs)/voyages')} />
            </Carte>
            <Bandeau type="info">Ne payez pas deux fois : si l'opérateur vous dit que c'est fait, utilisez « J'ai payé, vérifier ».</Bandeau>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    annuler: { color: couleurs.blanc, fontWeight: '700', fontSize: 15 },
    chargementPage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: couleurs.fond },
    piedPage: { paddingVertical: espaces.sm, paddingHorizontal: espaces.lg, borderTopWidth: 1, borderTopColor: couleurs.ligne, backgroundColor: couleurs.blanc }
});

/** Sans compte, la connexion s'ouvre et revient ici une fois faite. */
export default function Ecran() {
    return (
        <ExigerSession>
            <AttentePaiement />
        </ExigerSession>
    );
}

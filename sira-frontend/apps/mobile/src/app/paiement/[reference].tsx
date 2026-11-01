import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommandeClient } from '@sira/core';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, Text } from 'react-native';
import { api } from '../../api';
import { oublierPaiementEnCours, retenirPaiementEnCours } from '../../reservation/paiement-en-cours';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { CompteARebours } from '../../ui/compte-a-rebours';
import { espaces } from '../../ui/theme';
import { ExigerSession } from '../../auth/exiger-session';

/** Le navigateur du téléphone ; à défaut (adresse refusée), l'onglet interne. */
async function ouvrirChezLePrestataire(url: string): Promise<void> {
    try {
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
            return;
        }
    } catch {
        /* on retombe sur l'onglet interne */
    }
    await WebBrowser.openBrowserAsync(url).catch(() => undefined);
}

/** Trois secondes pendant une minute trente : au-delà, une réponse franche. */
const INTERVALLE_MS = 3000;
const TENTATIVES_MAX = 30;

/**
 * Le règlement est entre les mains du prestataire. On ouvre sa page dans le
 * navigateur du système, pour que les applications Orange Money et MTN
 * puissent s'enchaîner, puis on interroge l'état jusqu'à décision. Chaque
 * interrogation fait vérifier le paiement auprès du prestataire côté serveur :
 * la commande se confirme même si la notification serveur à serveur s'est
 * perdue.
 */
function AttentePaiement() {
    const { reference, url, mode } = useLocalSearchParams<{ reference: string; url?: string; mode?: string }>();
    const queryClient = useQueryClient();
    const [tentatives, setTentatives] = useState(0);
    const [pageOuverte, setPageOuverte] = useState(false);
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

    // Ouvre la page du prestataire une seule fois, dès l'arrivée sur l'écran,
    // dans le navigateur du téléphone et non dans un onglet interne : Chrome
    // ne relance pas l'application qui a ouvert son propre onglet, il y
    // affiche la page de retour puis une invite « Ouvrir l'application ».
    // Depuis le navigateur lui-même, l'adresse de retour — un lien
    // d'application vérifié — rend la main à l'application d'un seul geste,
    // sans rien montrer. Le secours reste le rebond de la page du site vers
    // « sira:// », pour une installation dont les liens ne seraient pas vérifiés.
    useEffect(() => {
        if (!url || pageOuverte) return;
        setPageOuverte(true);
        retenirPaiementEnCours(reference);
        void ouvrirChezLePrestataire(url);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, pageOuverte, reference]);

    // Retour au premier plan : vérifier sans attendre le prochain tour.
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

    // Paiement encaissé : droit aux billets, sans bouton à toucher. L'écran
    // « Paiement reçu » ci-dessous ne sert plus que de filet si la navigation
    // n'a pas eu lieu. Tranché dans un sens ou l'autre, le paiement n'est
    // plus « en cours ».
    useEffect(() => {
        if (!commande?.commandeUuid) return;
        if (commande.statut !== 'EN_ATTENTE') oublierPaiementEnCours();
        if (commande.statut === 'CONFIRMEE' || commande.statut === 'PAYEE') {
            router.replace({ pathname: '/commande/[uuid]', params: { uuid: commande.commandeUuid } });
        }
    }, [commande]);

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

    return (
        <ScrollView style={base.ecran} contentContainerStyle={[base.contenu, { flexGrow: 1, justifyContent: 'center' }]}>
            {!expire && <Chargement />}
            <Text style={[base.titre, { textAlign: 'center' }]}>{expire ? 'Paiement toujours en attente' : `Paiement en cours${mode ? ` chez ${mode}` : ''}`}</Text>
            {commande?.expireLe && !expire && <CompteARebours jusqua={commande.expireLe} />}
            <Text style={[base.sousTitre, { textAlign: 'center' }]}>
                {expire
                    ? "Votre opérateur n'a pas encore répondu. Si le règlement aboutit, votre réservation sera confirmée automatiquement et vous recevrez un email. Vous pouvez suivre son statut dans Mes voyages."
                    : "Validez le règlement — dans la page de l'opérateur, ou sur la demande de confirmation reçue sur votre téléphone. Cet écran se mettra à jour de lui-même, et vos billets s'ouvriront dès que l'opérateur aura confirmé."}
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
                {url && <Bouton libelle="Rouvrir la page de paiement" variante="secondaire" onPress={() => void ouvrirChezLePrestataire(url)} />}
                <Bouton libelle="Mes voyages" variante="discret" onPress={() => router.replace('/(tabs)/voyages')} />
            </Carte>
            <Bandeau type="info">Ne payez pas deux fois : si la page du prestataire vous dit que c'est fait, utilisez « J'ai payé, vérifier ».</Bandeau>
        </ScrollView>
    );
}

/** Sans compte, la connexion s'ouvre et revient ici une fois faite. */
export default function Ecran() {
    return (
        <ExigerSession>
            <AttentePaiement />
        </ExigerSession>
    );
}

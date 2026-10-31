import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommandeClient } from '@sira/core';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, Text } from 'react-native';
import { api } from '../../api';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { espaces } from '../../ui/theme';

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
export default function AttentePaiement() {
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

    // Ouvre la page du prestataire une seule fois, dès l'arrivée sur l'écran.
    useEffect(() => {
        if (!url || pageOuverte) return;
        setPageOuverte(true);
        void WebBrowser.openBrowserAsync(url).catch(() => undefined);
    }, [url, pageOuverte]);

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
            <Text style={[base.sousTitre, { textAlign: 'center' }]}>
                {expire
                    ? "Votre opérateur n'a pas encore répondu. Si le règlement aboutit, votre réservation sera confirmée automatiquement et vous recevrez un email. Vous pouvez suivre son statut dans Mes voyages."
                    : 'Terminez le règlement dans la page qui vient de s\'ouvrir, puis revenez ici : vos billets apparaîtront dès que le paiement est confirmé.'}
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
                {url && <Bouton libelle="Rouvrir la page de paiement" variante="secondaire" onPress={() => void WebBrowser.openBrowserAsync(url).catch(() => undefined)} />}
                <Bouton libelle="Mes voyages" variante="discret" onPress={() => router.replace('/(tabs)/voyages')} />
            </Carte>
            <Bandeau type="info">Ne payez pas deux fois : si la page du prestataire vous dit que c'est fait, utilisez « J'ai payé, vérifier ».</Bandeau>
        </ScrollView>
    );
}

import { useMutation, useQuery } from '@tanstack/react-query';
import type { Commune, TypeBien } from '@sira/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth/contexte';
import { ExigerSession } from '../auth/exiger-session';
import { messageErreur } from '../immo/feuilles-relation';
import { Bandeau, Bouton, Carte, ChampChoix, styles as base } from '../ui/base';
import { FeuilleBasse } from '../ui/feuille';
import { ChampSaisie, Option, Puce, Puces } from '../ui/formulaire';
import { espaces } from '../ui/theme';

/**
 * Quand la recherche ne trouve rien : dire ce que l'on cherche, et laisser
 * les agences de la zone revenir vers soi. Le serveur diffuse la demande aux
 * agences concernées ; elle se suit dans Demandes et s'annule d'un geste.
 */
function DeclarerBesoinEcran() {
    const { user } = useAuth();
    const [typeAnnonce, setTypeAnnonce] = useState<'LOCATION' | 'ACHAT'>('LOCATION');
    const [typeBien, setTypeBien] = useState<TypeBien | null>(null);
    const [commune, setCommune] = useState<Commune | null>(null);
    const [quartier, setQuartier] = useState('');
    const [budget, setBudget] = useState('');
    const [chambres, setChambres] = useState(0);
    const [description, setDescription] = useState('');
    const [telephone, setTelephone] = useState(user?.phone ?? '');
    const [feuille, setFeuille] = useState<'type' | 'commune' | null>(null);

    const typesBien = useQuery({ queryKey: ['types-bien'], queryFn: async () => (await api.immo.proprietes.typesBien()).data.types ?? [] });
    const communes = useQuery({ queryKey: ['communes-actives'], queryFn: async () => (await api.geo.communesActives()).data.communes ?? [] });

    const envoi = useMutation({
        mutationFn: async () => {
            const budgetNombre = Number.parseInt(budget.replace(/\D/g, ''), 10);
            return (
                await api.immo.clientSide.declarerBesoin({
                    typeAnnonce,
                    ...(typeBien?.typeBienId ? { typeBienId: typeBien.typeBienId } : {}),
                    ...(commune ? { communeId: commune.communeId } : {}),
                    ...(quartier.trim() ? { quartierTexte: quartier.trim() } : {}),
                    ...(Number.isFinite(budgetNombre) && budgetNombre > 0 ? { budgetMax: budgetNombre, devise: 'GNF' } : {}),
                    ...(chambres > 0 ? { nbChambresMin: chambres } : {}),
                    ...(description.trim() ? { description: description.trim() } : {}),
                    ...(telephone.trim() ? { contactTelephone: telephone.trim() } : {})
                })
            ).data;
        },
        onSuccess: () => router.replace('/(tabs)/demandes')
    });

    const pret = !!commune && telephone.trim().length >= 8;

    return (
        <>
            <ScrollView style={base.ecran} contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <Text style={base.sousTitre}>Dites ce que vous cherchez : les agences de la zone vous contactent si elles ont ce qu'il faut.</Text>

                <Carte style={{ gap: espaces.sm }}>
                    <Puces>
                        <Puce role="radio" libelle="Louer" actif={typeAnnonce === 'LOCATION'} onPress={() => setTypeAnnonce('LOCATION')} />
                        <Puce role="radio" libelle="Acheter" actif={typeAnnonce === 'ACHAT'} onPress={() => setTypeAnnonce('ACHAT')} />
                    </Puces>
                    <ChampChoix libelle="Type de bien" valeur={typeBien?.libelle} vide="Peu importe" onPress={() => setFeuille('type')} />
                    <ChampChoix libelle="Commune" valeur={commune ? `${commune.libelle} (${commune.villeLibelle})` : undefined} vide="Choisir une commune" onPress={() => setFeuille('commune')} />
                    <ChampSaisie libelle="Quartier" valeur={quartier} onChange={setQuartier} attendu="Facultatif" />
                    <ChampSaisie libelle="Budget maximal" valeur={budget} onChange={setBudget} attendu="En GNF, facultatif" clavier="numerique" />
                    <Text style={base.sectionTitre}>Chambres, au moins</Text>
                    <Puces>
                        {[0, 1, 2, 3, 4].map((n) => (
                            <Puce key={n} role="radio" libelle={n === 0 ? 'Peu importe' : `${n}+`} actif={chambres === n} onPress={() => setChambres(n)} />
                        ))}
                    </Puces>
                    <ChampSaisie libelle="Autres précisions" valeur={description} onChange={setDescription} attendu="Cour fermée, rez-de-chaussée, proche d'une école…" multiligne longueurMax={2000} />
                </Carte>

                <Carte style={{ gap: espaces.sm }}>
                    <Text style={base.sectionTitre}>Pour vous joindre</Text>
                    <ChampSaisie libelle="Téléphone" valeur={telephone} onChange={setTelephone} attendu="+224 6XX XX XX XX" clavier="telephone" />
                    <Text style={base.attenue}>Les agences vous appelleront à ce numéro. Votre nom leur est transmis avec la demande.</Text>
                </Carte>

                {envoi.isError && <Bandeau type="erreur">{messageErreur(envoi.error, "La demande n'a pas pu partir. Vérifiez votre réseau puis réessayez.")}</Bandeau>}
                <Bouton libelle="Déclarer mon besoin" onPress={() => envoi.mutate()} desactive={!pret} enCours={envoi.isPending} />
                {!pret && <Text style={[base.attenue, { textAlign: 'center' }]}>Une commune et un téléphone suffisent.</Text>}
            </ScrollView>

            <FeuilleBasse visible={feuille === 'type'} titre="Type de bien" onFermer={() => setFeuille(null)}>
                <Option libelle="Peu importe" actif={typeBien === null} onPress={() => { setTypeBien(null); setFeuille(null); }} />
                {typesBien.isPending && <Text style={base.attenue}>Chargement…</Text>}
                {(typesBien.data ?? []).map((t) => (
                    <Option key={t.code ?? String(t.typeBienId)} libelle={t.libelle ?? ''} actif={typeBien?.code === t.code} onPress={() => { setTypeBien(t); setFeuille(null); }} />
                ))}
            </FeuilleBasse>

            <FeuilleBasse visible={feuille === 'commune'} titre="Commune" onFermer={() => setFeuille(null)}>
                {communes.isPending && <Text style={base.attenue}>Chargement des communes…</Text>}
                {communes.isError && <Bandeau type="erreur">Impossible de charger les communes. Vérifiez votre réseau.</Bandeau>}
                {(communes.data ?? []).map((c) => (
                    <Option key={c.communeUuid} libelle={`${c.libelle} · ${c.villeLibelle}`} actif={commune?.communeUuid === c.communeUuid} onPress={() => { setCommune(c); setFeuille(null); }} />
                ))}
            </FeuilleBasse>
        </>
    );
}

export default function Ecran() {
    return (
        <ExigerSession>
            <DeclarerBesoinEcran />
        </ExigerSession>
    );
}

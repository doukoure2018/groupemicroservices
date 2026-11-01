import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ajouterJours,
    aujourdhuiIso,
    etiquettesOffres,
    FILTRES_DEFAUT,
    filtrerOffres,
    nombreFiltresActifs,
    trierOffres,
    typesVehiculePresents,
    voyageursDepuisParams,
    type FiltresOffres,
    type Offre
} from '@sira/core';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { BandeauDates } from '../recherche/bandeau-dates';
import { CarteOffre } from '../recherche/carte-offre';
import { DetailOffre } from '../recherche/detail-offre';
import { FiltresEcran } from '../recherche/filtres';
import { Bouton, EtatVide, styles as base } from '../ui/base';
import { SqueletteRecherche } from '../ui/squelette';
import { couleurs, espaces, rayons } from '../ui/theme';

/**
 * Les départs d'une journée pour un trajet. Le bandeau de dates change de
 * jour sans repasser par l'accueil ; tri, filtres et étiquettes se calculent
 * ici, sur ce que la recherche publique renvoie.
 */
export default function Recherche() {
    const params = useLocalSearchParams<{
        depart: string;
        arrivee: string;
        date?: string;
        departLibelle?: string;
        arriveeLibelle?: string;
        adultes?: string;
        enfants?: string;
        bagages?: string;
    }>();
    const { depart, arrivee, departLibelle, arriveeLibelle } = params;
    const date = params.date ?? aujourdhuiIso();
    const voyageurs = voyageursDepuisParams(params);
    const queryClient = useQueryClient();

    const cle = (jour: string) => ['offres', depart, arrivee, jour];
    const charger = (jour: string) => async () =>
        (await api.offres.recherche({ villeDepartUuid: depart, villeArriveeUuid: arrivee, dateDepart: jour })).data.offres ?? [];

    const offresQuery = useQuery({ queryKey: cle(date), queryFn: charger(date), enabled: !!depart && !!arrivee });

    // Les jours voisins se chargent en avance : changer de date est alors immédiat.
    useEffect(() => {
        if (!depart || !arrivee) return;
        for (const jour of [ajouterJours(date, -1), ajouterJours(date, 1)]) {
            if (jour >= aujourdhuiIso()) void queryClient.prefetchQuery({ queryKey: cle(jour), queryFn: charger(jour), staleTime: 30_000 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, depart, arrivee]);

    const [filtres, setFiltres] = useState<FiltresOffres>(FILTRES_DEFAUT);
    const [filtresOuverts, setFiltresOuverts] = useState(false);
    const [detail, setDetail] = useState<Offre | null>(null);

    const toutes = useMemo(() => offresQuery.data ?? [], [offresQuery.data]);
    const visibles = useMemo(() => trierOffres(filtrerOffres(toutes, filtres), filtres.tri), [toutes, filtres]);
    const etiquettes = useMemo(() => etiquettesOffres(toutes), [toutes]);
    const actifs = nombreFiltresActifs(filtres);

    function continuer() {
        const offre = detail;
        if (!offre?.offreUuid) return;
        setDetail(null);
        router.push({
            pathname: '/reserver/[uuid]',
            params: { uuid: offre.offreUuid, adultes: String(voyageurs.adultes), enfants: String(voyageurs.enfants), bagages: String(voyageurs.bagages) }
        });
    }

    let contenu;
    if (offresQuery.isPending) {
        contenu = <SqueletteRecherche />;
    } else if (offresQuery.isError) {
        contenu = <EtatVide titre="Recherche impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={() => void offresQuery.refetch()} />} />;
    } else {
        contenu = (
            <FlatList
                style={base.ecran}
                contentContainerStyle={[base.contenu, { flexGrow: 1 }]}
                data={visibles}
                keyExtractor={(o) => o.offreUuid ?? String(o.offreId)}
                ListHeaderComponent={
                    <View style={styles.resume}>
                        <Text style={base.attenue}>
                            {visibles.length === 0 ? 'Aucun voyage' : `${visibles.length} voyage${visibles.length > 1 ? 's' : ''}`}
                            {actifs > 0 && toutes.length !== visibles.length ? ` sur ${toutes.length}` : ''}
                        </Text>
                        {toutes.length > 0 && (
                            <Pressable accessibilityRole="button" onPress={() => setFiltresOuverts(true)} style={[styles.filtres, actifs > 0 && styles.filtresActifs]}>
                                <Text style={[styles.filtresTexte, actifs > 0 && styles.filtresTexteActifs]}>Filtres{actifs > 0 ? ` · ${actifs}` : ''}</Text>
                            </Pressable>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    toutes.length === 0 ? (
                        <EtatVide
                            titre="Aucun voyage ce jour-là"
                            texte="Choisissez un autre jour en haut de l'écran : les transporteurs publient leurs départs quelques jours à l'avance."
                            action={<Bouton libelle="Modifier la recherche" variante="secondaire" onPress={() => router.back()} />}
                        />
                    ) : (
                        <EtatVide
                            titre="Aucun voyage ne correspond"
                            texte="Vos filtres ne laissent passer aucun départ de cette journée."
                            action={<Bouton libelle="Effacer les filtres" variante="secondaire" onPress={() => setFiltres(FILTRES_DEFAUT)} />}
                        />
                    )
                }
                renderItem={({ item }) => <CarteOffre offre={item} etiquettes={etiquettes.get(item.offreUuid ?? '') ?? []} onPress={() => setDetail(item)} />}
            />
        );
    }

    return (
        <View style={base.ecran}>
            <Stack.Screen options={{ title: `${departLibelle ?? 'Départ'} → ${arriveeLibelle ?? 'Arrivée'}` }} />
            <BandeauDates date={date} onChoisir={(jour) => router.setParams({ date: jour })} />
            {contenu}
            <DetailOffre offre={detail} voyageurs={voyageurs} onFermer={() => setDetail(null)} onContinuer={continuer} />
            <FiltresEcran
                visible={filtresOuverts}
                filtres={filtres}
                typesVehicule={typesVehiculePresents(toutes)}
                compter={(f) => filtrerOffres(toutes, f).length}
                onAppliquer={(f) => {
                    setFiltres(f);
                    setFiltresOuverts(false);
                }}
                onFermer={() => setFiltresOuverts(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    resume: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaces.sm },
    filtres: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: rayons.md, paddingHorizontal: espaces.md, paddingVertical: espaces.sm, backgroundColor: couleurs.blanc },
    filtresActifs: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    filtresTexte: { color: couleurs.encre, fontWeight: '700' },
    filtresTexteActifs: { color: couleurs.vertFonce }
});

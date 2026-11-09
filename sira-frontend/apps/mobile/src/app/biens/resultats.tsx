import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { TRIS_PROPRIETES, type Commodite, type RechercheProprietesParams, type TriProprietes, type TypeBien } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../api';
import { CarteBien } from '../../immo/carte-bien';
import { criteresDepuisParams, nombreDeFiltres, type ParamsRecherche } from '../../immo/criteres';
import { useFavori } from '../../immo/favoris';
import { Bandeau, Bouton, EtatVide, styles as base } from '../../ui/base';
import { FeuilleBasse } from '../../ui/feuille';
import { Puce, Puces } from '../../ui/formulaire';
import { SqueletteRecherche } from '../../ui/squelette';
import { couleurs, espaces, texte, zoomMax } from '../../ui/theme';

const PAR_PAGE = 20;

/**
 * Les biens qui répondent aux critères. Les filtres se posent ici, pas sur
 * l'accueil : on cherche large, puis on resserre en voyant ce qui sort.
 */
export default function Resultats() {
    const params = useLocalSearchParams() as ParamsRecherche;
    const [criteres, setCriteres] = useState<RechercheProprietesParams>(() => criteresDepuisParams(params));
    const [feuille, setFeuille] = useState<'filtres' | 'tri' | null>(null);
    const favori = useFavori('/biens/resultats');

    const biens = useInfiniteQuery({
        queryKey: ['biens', criteres],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => (await api.immo.proprietes.recherche({ ...criteres, limit: PAR_PAGE, offset: pageParam })).data,
        getNextPageParam: (derniere) => {
            const vus = derniere.offset + derniere.proprietes.length;
            return vus < derniere.total ? vus : undefined;
        }
    });

    const resultats = useMemo(() => biens.data?.pages.flatMap((p) => p.proprietes) ?? [], [biens.data]);
    const total = biens.data?.pages[0]?.total ?? 0;
    const nbFiltres = nombreDeFiltres(criteres);
    const ville = params.villeLibelle;

    if (biens.isPending) return <SqueletteRecherche univers="loger" />;
    if (biens.isError) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={() => void biens.refetch()} />} />;
    }

    return (
        <>
            <FlatList
                style={base.ecran}
                contentContainerStyle={{ padding: espaces.lg, gap: espaces.md, paddingBottom: espaces.xxl }}
                data={resultats}
                keyExtractor={(b) => b.proprieteUuid}
                onEndReachedThreshold={0.4}
                onEndReached={() => {
                    if (biens.hasNextPage && !biens.isFetchingNextPage) void biens.fetchNextPage();
                }}
                ListHeaderComponent={
                    <View style={{ gap: espaces.md }}>
                        <View style={styles.barre}>
                            <Pressable accessibilityRole="button" onPress={() => setFeuille('filtres')} style={styles.bouton}>
                                <Text style={styles.boutonTexte}>Filtres{nbFiltres > 0 ? ` · ${nbFiltres}` : ''}</Text>
                            </Pressable>
                            <Pressable accessibilityRole="button" onPress={() => setFeuille('tri')} style={styles.bouton}>
                                <Text style={styles.boutonTexte}>{TRIS_PROPRIETES.find((t) => t.valeur === criteres.trier)?.libelle ?? 'Trier'}</Text>
                            </Pressable>
                        </View>
                        <Text style={base.attenue}>
                            {total} bien{total > 1 ? 's' : ''}
                            {ville ? ` à ${ville}` : ''}
                            {criteres.typeAnnonce === 'VENTE' ? ', à vendre' : criteres.typeAnnonce === 'LOCATION' ? ', à louer' : ''}
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <EtatVide
                        titre="Aucun bien ne correspond"
                        texte="Élargissez la recherche : enlevez un filtre, ou cherchez dans une autre ville."
                        action={<Bouton libelle="Modifier la recherche" onPress={() => router.back()} />}
                    />
                }
                ListFooterComponent={biens.isFetchingNextPage ? <Text style={[base.attenue, { textAlign: 'center' }]}>Chargement…</Text> : undefined}
                renderItem={({ item }) => <CarteBien bien={item} onFavori={favori.basculer} />}
            />

            <FeuilleTri
                visible={feuille === 'tri'}
                valeur={criteres.trier ?? 'DATE_DESC'}
                onChoisir={(trier) => {
                    setCriteres((c) => ({ ...c, trier }));
                    setFeuille(null);
                }}
                onFermer={() => setFeuille(null)}
            />
            <FeuilleFiltres visible={feuille === 'filtres'} criteres={criteres} onAppliquer={setCriteres} onFermer={() => setFeuille(null)} />
        </>
    );
}

function FeuilleTri({ visible, valeur, onChoisir, onFermer }: { visible: boolean; valeur: TriProprietes; onChoisir: (t: TriProprietes) => void; onFermer: () => void }) {
    return (
        <FeuilleBasse visible={visible} titre="Trier" onFermer={onFermer}>
            {TRIS_PROPRIETES.map((t) => (
                <Pressable key={t.valeur} accessibilityRole="radio" accessibilityState={{ checked: valeur === t.valeur }} onPress={() => onChoisir(t.valeur)} style={styles.option}>
                    <Text style={[styles.optionTexte, valeur === t.valeur && { color: couleurs.vert }]}>{t.libelle}</Text>
                    {valeur === t.valeur && <Text style={styles.coche}>✓</Text>}
                </Pressable>
            ))}
        </FeuilleBasse>
    );
}

/** Type de bien, budget, chambres, commodités : tout ce qui resserre une liste trop longue. */
function FeuilleFiltres({
    visible,
    criteres,
    onAppliquer,
    onFermer
}: {
    visible: boolean;
    criteres: RechercheProprietesParams;
    onAppliquer: (c: RechercheProprietesParams) => void;
    onFermer: () => void;
}) {
    const [types, setTypes] = useState<string[]>(criteres.typeBienCodes ?? []);
    const [prixMax, setPrixMax] = useState(criteres.prixMax ? String(criteres.prixMax) : '');
    const [chambres, setChambres] = useState(criteres.chambresMin ?? 0);
    const [commodites, setCommodites] = useState<string[]>(criteres.commoditesCodes ?? []);

    const typesBien = useQuery({ queryKey: ['types-bien'], queryFn: async () => (await api.immo.proprietes.typesBien()).data.types ?? [], enabled: visible });
    const listeCommodites = useQuery({ queryKey: ['commodites'], queryFn: async () => (await api.immo.proprietes.commodites()).data.commodites ?? [], enabled: visible });

    const basculer = (liste: string[], code: string) => (liste.includes(code) ? liste.filter((c) => c !== code) : [...liste, code]);

    function appliquer() {
        const budget = Number.parseInt(prixMax.replace(/\D/g, ''), 10);
        onAppliquer({
            ...criteres,
            typeBienCodes: types.length ? types : undefined,
            prixMax: Number.isFinite(budget) && budget > 0 ? budget : undefined,
            chambresMin: chambres > 0 ? chambres : undefined,
            commoditesCodes: commodites.length ? commodites : undefined
        });
        onFermer();
    }

    function toutEffacer() {
        setTypes([]);
        setPrixMax('');
        setChambres(0);
        setCommodites([]);
    }

    return (
        <FeuilleBasse
            visible={visible}
            titre="Filtres"
            onFermer={onFermer}
            pied={
                <View style={{ gap: espaces.sm }}>
                    <Bouton libelle="Voir les biens" onPress={appliquer} />
                    <Bouton libelle="Tout effacer" variante="discret" onPress={toutEffacer} />
                </View>
            }
        >
            <Text style={base.sectionTitre}>Type de bien</Text>
            <Puces>
                {(typesBien.data ?? []).map((t: TypeBien) => (
                    <Puce key={t.code} libelle={t.libelle ?? ''} actif={types.includes(t.code ?? '')} onPress={() => setTypes(basculer(types, t.code ?? ''))} />
                ))}
                {typesBien.isPending && <Text style={base.attenue}>Chargement…</Text>}
            </Puces>

            <Text style={base.sectionTitre}>Budget maximal</Text>
            <View style={base.choix}>
                <Text style={base.choixLibelle}>En GNF</Text>
                <TextInput
                    value={prixMax}
                    onChangeText={setPrixMax}
                    placeholder="Sans limite"
                    placeholderTextColor={couleurs.gris}
                    keyboardType="number-pad"
                    accessibilityLabel="Budget maximal en francs guinéens"
                    style={styles.saisie}
                />
            </View>

            <Text style={base.sectionTitre}>Chambres, au moins</Text>
            <Puces>
                {[0, 1, 2, 3, 4].map((n) => (
                    <Puce key={n} libelle={n === 0 ? 'Peu importe' : `${n}+`} actif={chambres === n} onPress={() => setChambres(n)} />
                ))}
            </Puces>

            <Text style={base.sectionTitre}>Commodités</Text>
            <Puces>
                {(listeCommodites.data ?? []).map((c: Commodite) => (
                    <Puce key={c.code} libelle={c.libelle} actif={commodites.includes(c.code)} onPress={() => setCommodites(basculer(commodites, c.code))} />
                ))}
                {listeCommodites.isPending && <Text style={base.attenue}>Chargement…</Text>}
                {listeCommodites.isError && <Bandeau type="alerte">Les commodités n'ont pas pu être chargées.</Bandeau>}
            </Puces>
        </FeuilleBasse>
    );
}

const styles = StyleSheet.create({
    barre: { flexDirection: 'row', gap: espaces.sm },
    bouton: { borderWidth: 1, borderColor: couleurs.vert, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16, backgroundColor: couleurs.blanc, minHeight: 44, justifyContent: 'center' },
    boutonTexte: { ...texte.libelle, color: couleurs.vertFonce },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: espaces.md, borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
    optionTexte: { ...texte.appuye, color: couleurs.encre },
    coche: { ...texte.appuye, color: couleurs.vert },
    saisie: { ...texte.appuye, color: couleurs.encre, padding: 0, marginTop: 2 }
});

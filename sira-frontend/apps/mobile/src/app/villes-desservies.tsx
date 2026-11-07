import { useQuery } from '@tanstack/react-query';
import type { Ville } from '@sira/core';
import { router } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Bouton, Chargement, EtatVide, styles as base } from '../ui/base';
import { couleurs, espaces, texte } from '../ui/theme';

/** Où SYNERGIA dessert, groupé par région. Liste publique, utile avant même de chercher. */
export default function VillesDesservies() {
    const villesQuery = useQuery({
        queryKey: ['villes-actives'],
        queryFn: async () => (await api.geo.villesActives()).data.villes ?? []
    });
    const desserviesQuery = useQuery({
        queryKey: ['villes-desservies'],
        queryFn: async () => (await api.geo.villesDesservies()).data.villes ?? []
    });

    if (villesQuery.isPending) return <Chargement />;
    if (villesQuery.isError) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={() => void villesQuery.refetch()} />} />;
    }

    // Une ville du référentiel n'est pas forcément reliée à quelque chose : on
    // le dit, plutôt que de laisser croire qu'on y voyage.
    const desservies = new Set((desserviesQuery.data ?? []).map((v) => v.villeUuid));
    const parRegion = new Map<string, Ville[]>();
    for (const v of villesQuery.data) {
        const region = v.regionLibelle || 'Autres';
        if (!parRegion.has(region)) parRegion.set(region, []);
        parRegion.get(region)!.push(v);
    }
    const sections = [...parRegion.entries()]
        .map(([title, data]) => ({ title, data: data.sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr')) }))
        .sort((a, b) => a.title.localeCompare(b.title, 'fr'));

    return (
        <SectionList
            style={base.ecran}
            contentContainerStyle={base.contenu}
            sections={sections}
            keyExtractor={(v) => v.villeUuid}
            ListHeaderComponent={
                <Text style={base.sousTitre}>
                    {desservies.size} ville{desservies.size > 1 ? 's' : ''} desservie{desservies.size > 1 ? 's' : ''} sur {villesQuery.data.length}. Les autres rejoindront
                    le réseau à mesure que des transporteurs y ouvrent une liaison.
                </Text>
            }
            renderSectionHeader={({ section }) => <Text style={styles.region}>{section.title}</Text>}
            renderItem={({ item }) => {
                const desservie = desservies.has(item.villeUuid);
                return (
                    <View style={styles.ville}>
                        <Text style={[styles.villeNom, !desservie && styles.villeNomAVenir]}>{item.libelle}</Text>
                        {!desservie && <Text style={styles.aVenir}>Bientôt</Text>}
                    </View>
                );
            }}
            ListFooterComponent={<Bouton libelle="Chercher un voyage" onPress={() => router.navigate('/(tabs)')} style={{ marginTop: espaces.lg }} />}
        />
    );
}

const styles = StyleSheet.create({
    region: { ...texte.section, color: couleurs.vert, marginTop: espaces.md },
    ville: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: espaces.md, borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
    villeNom: { fontSize: 16, color: couleurs.encre },
    villeNomAVenir: { color: couleurs.gris },
    aVenir: { ...texte.mention, color: couleurs.gris }
});

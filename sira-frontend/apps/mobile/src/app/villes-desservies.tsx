import { useQuery } from '@tanstack/react-query';
import type { Ville } from '@sira/core';
import { router } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Bouton, Chargement, EtatVide, styles as base } from '../ui/base';
import { couleurs, espaces } from '../ui/theme';

/** Où SYNERGIA dessert, groupé par région. Liste publique, utile avant même de chercher. */
export default function VillesDesservies() {
    const villesQuery = useQuery({
        queryKey: ['villes-actives'],
        queryFn: async () => (await api.geo.villesActives()).data.villes ?? []
    });

    if (villesQuery.isPending) return <Chargement />;
    if (villesQuery.isError) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={() => void villesQuery.refetch()} />} />;
    }

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
                    {villesQuery.data.length} ville{villesQuery.data.length > 1 ? 's' : ''} desservie{villesQuery.data.length > 1 ? 's' : ''}. Touchez-en une pour chercher un
                    départ.
                </Text>
            }
            renderSectionHeader={({ section }) => <Text style={styles.region}>{section.title}</Text>}
            renderItem={({ item }) => (
                <View style={styles.ville}>
                    <Text style={styles.villeNom}>{item.libelle}</Text>
                </View>
            )}
            ListFooterComponent={<Bouton libelle="Chercher un voyage" onPress={() => router.navigate('/(tabs)')} style={{ marginTop: espaces.lg }} />}
        />
    );
}

const styles = StyleSheet.create({
    region: { fontSize: 13, fontWeight: '800', color: couleurs.vert, textTransform: 'uppercase', letterSpacing: 1, marginTop: espaces.md },
    ville: { paddingVertical: espaces.md, borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
    villeNom: { fontSize: 16, color: couleurs.encre }
});

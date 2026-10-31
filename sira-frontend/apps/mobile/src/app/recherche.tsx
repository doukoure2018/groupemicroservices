import { useQuery } from '@tanstack/react-query';
import { formatDateFr, formatHeure, formatMontant, getMontantEffectif, hasPromotion, type Offre } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Bouton, Carte, Chargement, EtatVide, styles as base } from '../ui/base';
import { couleurs, espaces } from '../ui/theme';

export default function Recherche() {
    const { depart, arrivee, date, departLibelle, arriveeLibelle } = useLocalSearchParams<{
        depart: string;
        arrivee: string;
        date: string;
        departLibelle?: string;
        arriveeLibelle?: string;
    }>();

    const offresQuery = useQuery({
        queryKey: ['offres', depart, arrivee, date],
        queryFn: async () => (await api.offres.recherche({ villeDepartUuid: depart, villeArriveeUuid: arrivee, dateDepart: date })).data.offres ?? [],
        enabled: !!depart && !!arrivee
    });

    if (offresQuery.isPending) return <Chargement texte="Recherche des voyages…" />;
    if (offresQuery.isError) {
        return (
            <EtatVide
                titre="Recherche impossible"
                texte="Vérifiez votre réseau puis réessayez."
                action={<Bouton libelle="Réessayer" onPress={() => void offresQuery.refetch()} />}
            />
        );
    }

    const offres = offresQuery.data;
    return (
        <FlatList
            style={base.ecran}
            contentContainerStyle={base.contenu}
            data={offres}
            keyExtractor={(o) => o.offreUuid ?? String(o.offreId)}
            ListHeaderComponent={
                <View>
                    <Text style={base.titre}>
                        {departLibelle ?? 'Départ'} → {arriveeLibelle ?? 'Arrivée'}
                    </Text>
                    <Text style={base.sousTitre}>
                        {offres.length === 0 ? 'Aucun voyage' : `${offres.length} voyage${offres.length > 1 ? 's' : ''}`} le {formatDateFr(date)}
                    </Text>
                </View>
            }
            ListEmptyComponent={
                <EtatVide
                    titre="Aucun voyage ce jour-là"
                    texte="Essayez une autre date : les transporteurs publient leurs départs quelques jours à l'avance."
                    action={<Bouton libelle="Modifier la recherche" variante="secondaire" onPress={() => router.back()} />}
                />
            }
            renderItem={({ item }) => <CarteOffre offre={item} />}
        />
    );
}

function CarteOffre({ offre }: { offre: Offre }) {
    const prix = getMontantEffectif(offre);
    const places = offre.nombrePlacesDisponibles ?? 0;
    const complet = places <= 0;
    return (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/offre/[uuid]', params: { uuid: offre.offreUuid! } })}>
            <Carte style={styles.carte}>
                <View style={base.ligne}>
                    <Text style={styles.heure}>{formatHeure(offre.heureDepart)}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        {hasPromotion(offre) && <Text style={styles.prixBarre}>{formatMontant(offre.montant, offre.devise)}</Text>}
                        <Text style={styles.prix}>{formatMontant(prix, offre.devise)}</Text>
                    </View>
                </View>
                <Text style={base.attenue}>
                    {offre.siteDepart} → {offre.siteArrivee}
                </Text>
                <View style={[base.ligne, { marginTop: espaces.sm }]}>
                    <Text style={[styles.places, complet && styles.placesComplet]}>
                        {complet ? 'Complet' : `${places} place${places > 1 ? 's' : ''} disponible${places > 1 ? 's' : ''}`}
                    </Text>
                    <Text style={styles.lien}>{complet ? 'Voir' : 'Réserver ›'}</Text>
                </View>
            </Carte>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    carte: { gap: espaces.xs },
    heure: { fontSize: 22, fontWeight: '800', color: couleurs.encre },
    prix: { fontSize: 18, fontWeight: '800', color: couleurs.vert },
    prixBarre: { color: couleurs.gris, textDecorationLine: 'line-through', fontSize: 13 },
    places: { color: couleurs.vertFonce, fontWeight: '600' },
    placesComplet: { color: couleurs.danger },
    lien: { color: couleurs.vert, fontWeight: '700' }
});

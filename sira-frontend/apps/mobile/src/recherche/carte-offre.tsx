import { arriveeOffre, dureeOffreMinutes, estComplete, formatDuree, formatHeure, formatMontant, getMontantEffectif, hasPromotion, typeVehiculeOffre, type Offre } from '@sira/core';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Carte } from '../ui/base';
import { couleurs, espaces, rayons } from '../ui/theme';

const PLACES_RARES = 5;

/**
 * Un départ en un coup d'œil : heures, durée, gares, véhicule, prix par
 * personne, et les étiquettes qui le distinguent des autres de la journée.
 */
export function CarteOffre({ offre, etiquettes, onPress }: { offre: Offre; etiquettes: string[]; onPress: () => void }) {
    const arrivee = arriveeOffre(offre);
    const duree = dureeOffreMinutes(offre);
    const complet = estComplete(offre);
    const prix = getMontantEffectif(offre);
    const places = offre.nombrePlacesDisponibles ?? 0;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Départ ${formatHeure(offre.heureDepart)} de ${offre.siteDepart ?? ''}, arrivée ${arrivee?.heure ?? ''} à ${offre.siteArrivee ?? ''}, ${complet ? 'complet' : `${formatMontant(prix, offre.devise)} par personne`}`}
            onPress={onPress}
            style={({ pressed }) => pressed && { opacity: 0.85 }}
        >
            <Carte style={[styles.carte, complet && styles.carteComplete]}>
                <View style={styles.horaires}>
                    <View style={styles.bout}>
                        <Text style={styles.heure}>{formatHeure(offre.heureDepart)}</Text>
                        <Text style={styles.gare} numberOfLines={1}>
                            {offre.siteDepart ?? offre.villeDepartLibelle}
                        </Text>
                    </View>
                    <View style={styles.milieu}>
                        <Text style={styles.duree}>{duree ? formatDuree(duree) : ' '}</Text>
                        <View style={styles.trait} />
                    </View>
                    <View style={[styles.bout, { alignItems: 'flex-end' }]}>
                        <View style={styles.arrivee}>
                            <Text style={styles.heure}>{arrivee?.heure ?? '—'}</Text>
                            {arrivee?.lendemain && <Text style={styles.lendemain}>+1 jour</Text>}
                        </View>
                        <Text style={[styles.gare, { textAlign: 'right' }]} numberOfLines={1}>
                            {offre.siteArrivee ?? offre.villeArriveeLibelle}
                        </Text>
                    </View>
                </View>

                <View style={styles.bas}>
                    <View style={{ gap: espaces.xs }}>
                        <View style={styles.pastille}>
                            <Text style={styles.pastilleTexte}>{typeVehiculeOffre(offre)}</Text>
                        </View>
                        {!complet && places <= PLACES_RARES && (
                            <Text style={styles.places}>
                                {places} place{places > 1 ? 's' : ''} restante{places > 1 ? 's' : ''}
                            </Text>
                        )}
                    </View>
                    <View style={styles.prixBloc}>
                        {complet ? (
                            <Text style={styles.complet}>Complet</Text>
                        ) : (
                            <>
                                {hasPromotion(offre) && <Text style={styles.prixBarre}>{formatMontant(offre.montant, offre.devise)}</Text>}
                                <Text style={styles.prix}>{formatMontant(prix, offre.devise)}</Text>
                                <Text style={styles.parPersonne}>par personne</Text>
                            </>
                        )}
                    </View>
                    <View style={[styles.chevron, complet && styles.chevronInactif]}>
                        <Text style={styles.chevronTexte}>›</Text>
                    </View>
                </View>

                {etiquettes.length > 0 && <Text style={styles.etiquettes}>{etiquettes.join(' · ')}</Text>}
            </Carte>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    carte: { gap: espaces.md },
    carteComplete: { opacity: 0.7 },
    horaires: { flexDirection: 'row', alignItems: 'flex-start', gap: espaces.sm },
    bout: { flex: 3 },
    milieu: { flex: 2, alignItems: 'center', paddingTop: 4 },
    heure: { fontSize: 22, fontWeight: '800', color: couleurs.encre },
    arrivee: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    lendemain: { color: couleurs.orTexte, fontSize: 11, fontWeight: '700', marginTop: 3 },
    gare: { color: couleurs.gris, fontSize: 13, marginTop: 2 },
    duree: { color: couleurs.gris, fontSize: 12 },
    trait: { height: 1, alignSelf: 'stretch', backgroundColor: couleurs.ligne, marginTop: 4 },
    bas: { flexDirection: 'row', alignItems: 'center', gap: espaces.md },
    pastille: { alignSelf: 'flex-start', borderWidth: 1, borderColor: couleurs.ligne, borderRadius: rayons.sm, paddingHorizontal: espaces.sm, paddingVertical: 4 },
    pastilleTexte: { color: couleurs.encre, fontWeight: '600', fontSize: 13 },
    places: { color: couleurs.alerte, fontSize: 12, fontWeight: '600' },
    prixBloc: { flex: 1, alignItems: 'flex-end' },
    prix: { fontSize: 20, fontWeight: '800', color: couleurs.encre },
    prixBarre: { color: couleurs.gris, textDecorationLine: 'line-through', fontSize: 12 },
    parPersonne: { color: couleurs.gris, fontSize: 12 },
    complet: { color: couleurs.danger, fontWeight: '700', fontSize: 16 },
    chevron: { width: 40, height: 40, borderRadius: 20, backgroundColor: couleurs.vert, alignItems: 'center', justifyContent: 'center' },
    chevronInactif: { backgroundColor: couleurs.ligne },
    chevronTexte: { color: couleurs.blanc, fontSize: 26, lineHeight: 28, fontWeight: '700', marginTop: -2 },
    etiquettes: { color: couleurs.vert, fontWeight: '800', fontSize: 13, textAlign: 'right' }
});

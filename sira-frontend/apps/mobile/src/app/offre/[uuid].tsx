import { useQuery } from '@tanstack/react-query';
import { formatDateFr, formatHeure, formatMontant, getMontantEffectif, hasPromotion } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces } from '../../ui/theme';

export default function DetailOffre() {
    const { uuid } = useLocalSearchParams<{ uuid: string }>();
    const offreQuery = useQuery({
        queryKey: ['offre', uuid],
        queryFn: async () => (await api.offres.byUuid(uuid)).data.offre,
        enabled: !!uuid
    });

    if (offreQuery.isPending) return <Chargement />;
    if (offreQuery.isError || !offreQuery.data) {
        return <EtatVide titre="Voyage introuvable" texte="Ce voyage n'est plus disponible." action={<Bouton libelle="Retour" variante="secondaire" onPress={() => router.back()} />} />;
    }

    const offre = offreQuery.data;
    const places = offre.nombrePlacesDisponibles ?? 0;
    const prix = getMontantEffectif(offre);

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <View>
                <Text style={base.titre}>
                    {offre.villeDepartLibelle} → {offre.villeArriveeLibelle}
                </Text>
                <Text style={base.sousTitre}>
                    {formatDateFr(offre.dateDepart)} à {formatHeure(offre.heureDepart)}
                </Text>
            </View>

            <Carte style={{ gap: espaces.md }}>
                <Ligne libelle="Départ" valeur={offre.siteDepart ?? ''} />
                <Ligne libelle="Arrivée" valeur={offre.siteArrivee ?? ''} />
                {offre.pointRendezvous && <Ligne libelle="Point de rendez-vous" valeur={offre.pointRendezvous} />}
                {offre.vehiculeImmatriculation && <Ligne libelle="Véhicule" valeur={`${offre.typeVehiculeLibelle ?? ''} ${offre.vehiculeImmatriculation}`.trim()} />}
                <Ligne libelle="Places disponibles" valeur={String(places)} />
                <View style={[base.ligne, { borderTopWidth: 1, borderTopColor: couleurs.ligne, paddingTop: espaces.md }]}>
                    <Text style={base.gras}>Prix par place</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        {hasPromotion(offre) && <Text style={styles.prixBarre}>{formatMontant(offre.montant, offre.devise)}</Text>}
                        <Text style={styles.prix}>{formatMontant(prix, offre.devise)}</Text>
                    </View>
                </View>
            </Carte>

            {places <= 0 ? (
                <Bandeau type="alerte">Ce départ est complet. Essayez un autre horaire ou une autre date.</Bandeau>
            ) : (
                <Bouton libelle="Réserver" onPress={() => router.push({ pathname: '/reserver/[uuid]', params: { uuid: offre.offreUuid! } })} />
            )}
        </ScrollView>
    );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
    return (
        <View style={base.ligne}>
            <Text style={base.attenue}>{libelle}</Text>
            <Text style={[base.gras, { flexShrink: 1, textAlign: 'right' }]}>{valeur}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    prix: { fontSize: 20, fontWeight: '800', color: couleurs.vert },
    prixBarre: { color: couleurs.gris, textDecorationLine: 'line-through', fontSize: 13 }
});

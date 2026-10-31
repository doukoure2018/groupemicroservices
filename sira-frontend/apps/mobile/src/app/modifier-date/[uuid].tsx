import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { formatDateFr, formatHeure, formatMontant, getMontantEffectif, type Offre } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces, rayons } from '../../ui/theme';

/**
 * Déplacer une réservation vers un autre départ du même trajet. Le serveur ne
 * propose que des départs ouverts, à venir, avec assez de places ; il garde le
 * montant déjà réglé tel quel, sans supplément ni remboursement, et l'écran
 * le dit avant la confirmation plutôt que de laisser le client le découvrir.
 */
export default function ModifierDate() {
    const { uuid } = useLocalSearchParams<{ uuid: string }>();
    const queryClient = useQueryClient();
    const [choix, setChoix] = useState<Offre | null>(null);

    const commandeQuery = useQuery({ queryKey: ['commande', uuid], queryFn: async () => (await api.commandes.byUuid(uuid)).data.commande, enabled: !!uuid });
    const alternativesQuery = useQuery({
        queryKey: ['offres-alternatives', uuid],
        queryFn: async () => (await api.commandes.offresAlternatives(uuid)).data.offres ?? [],
        enabled: !!uuid
    });

    const modifier = useMutation({
        mutationFn: async (offre: Offre) => (await api.commandes.modifierDate(uuid, { nouvelleOffreUuid: offre.offreUuid! })).data.commande,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['mes-commandes'] });
            void queryClient.invalidateQueries({ queryKey: ['commande', uuid] });
            router.replace({ pathname: '/commande/[uuid]', params: { uuid } });
        }
    });

    if (commandeQuery.isPending || alternativesQuery.isPending) return <Chargement texte="Recherche des autres départs…" />;
    if (commandeQuery.isError || !commandeQuery.data) {
        return <EtatVide titre="Commande introuvable" action={<Bouton libelle="Retour" variante="secondaire" onPress={() => router.back()} />} />;
    }
    if (alternativesQuery.isError) {
        return (
            <EtatVide
                titre="Autres départs indisponibles"
                texte={alternativesQuery.error instanceof ApiError ? alternativesQuery.error.message : 'Vérifiez votre réseau puis réessayez.'}
                action={<Bouton libelle="Réessayer" onPress={() => void alternativesQuery.refetch()} />}
            />
        );
    }

    const commande = commandeQuery.data;
    const alternatives = alternativesQuery.data;
    const nombrePlaces = commande.nombrePlaces ?? 1;

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <View>
                <Text style={base.titre}>Changer de date</Text>
                <Text style={base.sousTitre}>
                    {commande.villeDepartLibelle} → {commande.villeArriveeLibelle}, actuellement le {formatDateFr(commande.dateDepart)} à {formatHeure(commande.heureDepart)}.
                </Text>
            </View>

            {alternatives.length === 0 ? (
                <EtatVide
                    titre="Aucun autre départ"
                    texte="Aucun départ à venir avec assez de places sur ce trajet pour le moment. Réessayez plus tard, ou annulez la réservation si vos plans ont changé."
                    action={<Bouton libelle="Retour" variante="secondaire" onPress={() => router.back()} />}
                />
            ) : (
                <>
                    <Text style={base.sectionTitre}>
                        Nouveau départ pour {nombrePlaces} {nombrePlaces > 1 ? 'places' : 'place'}
                    </Text>
                    {alternatives.map((o) => {
                        const actif = choix?.offreUuid === o.offreUuid;
                        const places = o.nombrePlacesDisponibles ?? 0;
                        return (
                            <Pressable
                                key={o.offreUuid}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: actif }}
                                onPress={() => setChoix(o)}
                                style={[styles.option, actif && styles.optionActive]}
                            >
                                <View style={base.ligne}>
                                    <Text style={styles.optionDate}>
                                        {formatDateFr(o.dateDepart)} à {formatHeure(o.heureDepart)}
                                    </Text>
                                    <Text style={[styles.optionPlaces, places < nombrePlaces && { color: couleurs.danger }]}>
                                        {places} {places > 1 ? 'places' : 'place'}
                                    </Text>
                                </View>
                                <Text style={base.attenue}>
                                    {o.siteDepart} → {o.siteArrivee} · tarif affiché {formatMontant(getMontantEffectif(o), o.devise)}
                                </Text>
                            </Pressable>
                        );
                    })}

                    <Bandeau type="info">
                        Le montant déjà réglé, {formatMontant(commande.montantTotal, commande.devise)}, est conservé tel quel : aucun supplément ni remboursement, même si le tarif
                        affiché de la nouvelle date diffère. Vos billets restent valables et sont simplement reportés.
                    </Bandeau>

                    {modifier.isError && (
                        <Bandeau type="erreur">{modifier.error instanceof ApiError ? modifier.error.message : 'Le changement de date a échoué. Réessayez.'}</Bandeau>
                    )}

                    <Bouton
                        libelle={choix ? `Confirmer le ${formatDateFr(choix.dateDepart)} à ${formatHeure(choix.heureDepart)}` : 'Choisissez un départ'}
                        onPress={() => choix && modifier.mutate(choix)}
                        desactive={!choix}
                        enCours={modifier.isPending}
                    />
                    <Bouton libelle="Garder ma date" variante="discret" onPress={() => router.back()} />
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    option: { backgroundColor: couleurs.blanc, borderWidth: 1, borderColor: couleurs.ligne, borderRadius: rayons.lg, padding: espaces.lg, gap: espaces.xs },
    optionActive: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    optionDate: { fontSize: 17, fontWeight: '700', color: couleurs.encre, textTransform: 'capitalize' },
    optionPlaces: { fontWeight: '600', color: couleurs.vertFonce }
});

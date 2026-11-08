import { useQuery } from '@tanstack/react-query';
import { AGE_ADULTE_DEFAUT, ajouterJours, aujourdhuiIso, BAGAGES_MAX, libelleJourCourt, libelleVoyageurs, PLACES_MAX, VOYAGEURS_DEFAUT, type Ville, type Voyageurs } from '@sira/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { Bandeau, Bouton, Carte, ChampChoix, styles as base } from '../../ui/base';
import { Calendrier } from '../../ui/calendrier';
import { Compteur } from '../../ui/compteur';
import { FeuilleBasse } from '../../ui/feuille';
import { SelecteurVille } from '../../ui/selecteur-ville';
import { couleurs, espaces, texte, zoomMax } from '../../ui/theme';

/** Jusqu'où l'on peut réserver à l'avance : les transporteurs publient rarement au-delà. */
const JOURS_A_L_AVANCE = 60;

/**
 * L'accueil : d'où, vers où, quand, qui. Aucun compte n'est demandé pour
 * chercher ; la connexion n'intervient qu'au moment de réserver.
 */
export default function Accueil() {
    const { user } = useAuth();
    // Seules les villes qu'une liaison relie sont proposées : choisir une ville
    // sans liaison ne mènerait jamais à un départ. Si le serveur n'en renvoie
    // aucune (référentiel encore vide), on retombe sur les villes actives
    // plutôt que de présenter une recherche inutilisable.
    const villesQuery = useQuery({
        queryKey: ['villes-desservies'],
        queryFn: async () => {
            const desservies = (await api.geo.villesDesservies()).data.villes ?? [];
            if (desservies.length > 0) return desservies;
            return (await api.geo.villesActives()).data.villes ?? [];
        }
    });

    const aujourdhui = aujourdhuiIso();
    const [depart, setDepart] = useState<Ville | null>(null);
    const [arrivee, setArrivee] = useState<Ville | null>(null);
    const [date, setDate] = useState(aujourdhui);
    const [voyageurs, setVoyageurs] = useState<Voyageurs>(VOYAGEURS_DEFAUT);
    const [selecteur, setSelecteur] = useState<'depart' | 'arrivee' | null>(null);
    const [feuille, setFeuille] = useState<'date' | 'voyageurs' | null>(null);

    const memeVille = !!depart && !!arrivee && depart.villeUuid === arrivee.villeUuid;
    const valide = !!depart && !!arrivee && !memeVille;

    function rechercher() {
        if (!valide) return;
        router.push({
            pathname: '/recherche',
            params: {
                depart: depart!.villeUuid,
                arrivee: arrivee!.villeUuid,
                date,
                departLibelle: depart!.libelle,
                arriveeLibelle: arrivee!.libelle,
                adultes: String(voyageurs.adultes),
                enfants: String(voyageurs.enfants),
                bagages: String(voyageurs.bagages)
            }
        });
    }

    return (
        <>
            <ScrollView style={base.ecran} contentContainerStyle={{ paddingBottom: espaces.xl }} keyboardShouldPersistTaps="handled">
                <View style={styles.bandeau}>
                    <Text style={styles.salut} maxFontSizeMultiplier={zoomMax}>
                        {user ? `Bonjour ${user.firstName ?? ''}`.trim() : 'Où allez-vous ?'}
                    </Text>
                    <Text style={styles.sousSalut}>{user ? 'Choisissez votre prochain départ.' : 'Aucun compte n’est demandé pour chercher.'}</Text>
                </View>

                <View style={styles.formulaire}>
                    <Carte style={{ gap: espaces.sm }}>
                        {/* Les mots de la gare routière, qui se comprennent isolés : docs/charte-typographique-mobile.md, § 7. */}
                        <ChampChoix libelle="Départ" valeur={depart?.libelle} vide="Choisir une ville" onPress={() => setSelecteur('depart')} />
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Inverser départ et destination"
                            onPress={() => {
                                setDepart(arrivee);
                                setArrivee(depart);
                            }}
                            style={styles.inverser}
                        >
                            <Text style={styles.inverserTexte}>⇅</Text>
                        </Pressable>
                        <ChampChoix libelle="Destination" valeur={arrivee?.libelle} vide="Choisir une ville" onPress={() => setSelecteur('arrivee')} />
                        {memeVille && <Bandeau type="erreur">La destination doit être différente du départ.</Bandeau>}

                        <ChampChoix libelle="Date" valeur={libelleJourCourt(date)} onPress={() => setFeuille('date')} />
                        <ChampChoix libelle="Passagers et bagages" valeur={libelleVoyageurs(voyageurs)} onPress={() => setFeuille('voyageurs')} />

                        {villesQuery.isError && <Bandeau type="erreur">Impossible de charger les villes. Vérifiez votre réseau.</Bandeau>}
                        <Bouton libelle="Rechercher" onPress={rechercher} desactive={!valide} style={{ marginTop: espaces.sm }} />
                    </Carte>
                </View>
            </ScrollView>

            <SelecteurVille
                visible={selecteur !== null}
                titre={selecteur === 'depart' ? 'Départ' : 'Destination'}
                villes={villesQuery.data ?? []}
                chargement={villesQuery.isPending}
                onChoisir={(v) => {
                    if (selecteur === 'depart') setDepart(v);
                    else setArrivee(v);
                    setSelecteur(null);
                }}
                onFermer={() => setSelecteur(null)}
            />

            <FeuilleBasse visible={feuille === 'date'} titre="Date" onFermer={() => setFeuille(null)}>
                <Calendrier
                    valeur={date}
                    min={aujourdhui}
                    max={ajouterJours(aujourdhui, JOURS_A_L_AVANCE)}
                    onChoisir={(d) => {
                        setDate(d);
                        setFeuille(null);
                    }}
                />
            </FeuilleBasse>

            <FeuilleBasse
                visible={feuille === 'voyageurs'}
                titre="Passagers et bagages"
                onFermer={() => setFeuille(null)}
                pied={<Bouton libelle="Valider" onPress={() => setFeuille(null)} />}
            >
                {/* La ligne nomme la catégorie, le compte dit le nombre ; l'aide est une phrase, sous la ligne qu'elle concerne. */}
                <Compteur
                    libelle="Adulte"
                    aide={`${AGE_ADULTE_DEFAUT} ans et plus.`}
                    valeur={voyageurs.adultes}
                    min={1}
                    max={PLACES_MAX - voyageurs.enfants}
                    onChange={(adultes) => setVoyageurs((v) => ({ ...v, adultes }))}
                />
                <Compteur
                    libelle="Enfant"
                    aide={`De 0 à ${AGE_ADULTE_DEFAUT - 1} ans, accompagné d'un adulte.`}
                    valeur={voyageurs.enfants}
                    min={0}
                    max={PLACES_MAX - voyageurs.adultes}
                    onChange={(enfants) => setVoyageurs((v) => ({ ...v, enfants }))}
                />
                <Compteur
                    libelle="Bagage"
                    aide="En soute, en plus du sac gardé avec soi."
                    valeur={voyageurs.bagages}
                    min={0}
                    max={BAGAGES_MAX}
                    onChange={(bagages) => setVoyageurs((v) => ({ ...v, bagages }))}
                />
                <Text style={styles.aidePlaces}>Jusqu'à {PLACES_MAX} places par réservation.</Text>
            </FeuilleBasse>
        </>
    );
}

const styles = StyleSheet.create({
    bandeau: { backgroundColor: couleurs.vert, paddingHorizontal: espaces.lg, paddingTop: espaces.lg, paddingBottom: 56 },
    salut: { ...texte.titre, color: couleurs.blanc },
    sousSalut: { ...texte.secondaire, color: couleurs.surVertSecondaire, marginTop: espaces.xs },
    formulaire: { marginTop: -40, paddingHorizontal: espaces.lg },
    inverser: { alignSelf: 'flex-end', width: 40, height: 28, alignItems: 'center', justifyContent: 'center', marginVertical: -espaces.xs },
    inverserTexte: { color: couleurs.vert, fontWeight: '700', fontSize: 20 },
    aidePlaces: { ...texte.secondaire, color: couleurs.gris, marginTop: espaces.sm }
});

import { useQuery } from '@tanstack/react-query';
import { ajouterJours, aujourdhuiIso, BAGAGES_MAX, libelleJourCourt, libelleVoyageurs, PLACES_MAX, VOYAGEURS_DEFAUT, type Ville, type Voyageurs } from '@sira/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { Bandeau, Bouton, Carte, styles as base } from '../../ui/base';
import { Calendrier } from '../../ui/calendrier';
import { Compteur } from '../../ui/compteur';
import { FeuilleBasse } from '../../ui/feuille';
import { couleurs, espaces, rayons } from '../../ui/theme';

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
                    <Text style={styles.salut}>{user ? `Bonjour ${user.firstName ?? ''}`.trim() : 'Où allez-vous ?'}</Text>
                    <Text style={styles.sousSalut}>
                        {user ? 'Choisissez votre prochain départ.' : 'Cherchez un départ et réservez votre place. Aucun compte n’est demandé pour chercher.'}
                    </Text>
                </View>

                <View style={styles.formulaire}>
                    <Carte style={{ gap: espaces.sm }}>
                        <ChampChoix libelle="De" valeur={depart?.libelle} vide="Ville de départ" onPress={() => setSelecteur('depart')} />
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Inverser départ et arrivée"
                            onPress={() => {
                                setDepart(arrivee);
                                setArrivee(depart);
                            }}
                            style={styles.inverser}
                        >
                            <Text style={styles.inverserTexte}>⇅</Text>
                        </Pressable>
                        <ChampChoix libelle="Vers" valeur={arrivee?.libelle} vide="Ville d'arrivée" onPress={() => setSelecteur('arrivee')} />
                        {memeVille && <Bandeau type="erreur">La ville d'arrivée doit être différente de la ville de départ.</Bandeau>}

                        <View style={styles.rangee}>
                            <ChampChoix libelle="Aller" valeur={libelleJourCourt(date)} onPress={() => setFeuille('date')} style={{ flex: 1 }} />
                            <ChampChoix libelle="Passagers / Bagages" valeur={libelleVoyageurs(voyageurs)} onPress={() => setFeuille('voyageurs')} style={{ flex: 1 }} />
                        </View>

                        {villesQuery.isError && <Bandeau type="erreur">Impossible de charger les villes. Vérifiez votre réseau.</Bandeau>}
                        <Bouton libelle="Rechercher" onPress={rechercher} desactive={!valide} style={{ marginTop: espaces.sm }} />
                    </Carte>
                </View>
            </ScrollView>

            <SelecteurVille
                visible={selecteur !== null}
                titre={selecteur === 'depart' ? 'Ville de départ' : "Ville d'arrivée"}
                villes={villesQuery.data ?? []}
                chargement={villesQuery.isPending}
                onChoisir={(v) => {
                    if (selecteur === 'depart') setDepart(v);
                    else setArrivee(v);
                    setSelecteur(null);
                }}
                onFermer={() => setSelecteur(null)}
            />

            <FeuilleBasse visible={feuille === 'date'} titre="Date de départ" onFermer={() => setFeuille(null)}>
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
                titre="Passagers / Bagages"
                onFermer={() => setFeuille(null)}
                pied={<Bouton libelle="Valider" onPress={() => setFeuille(null)} />}
            >
                <Compteur
                    libelle="Adultes"
                    aide="15 ans et plus"
                    valeur={voyageurs.adultes}
                    min={1}
                    max={PLACES_MAX - voyageurs.enfants}
                    onChange={(adultes) => setVoyageurs((v) => ({ ...v, adultes }))}
                />
                <Compteur
                    libelle="Enfants"
                    aide="Moins de 15 ans, accompagnés d'un adulte"
                    valeur={voyageurs.enfants}
                    min={0}
                    max={PLACES_MAX - voyageurs.adultes}
                    onChange={(enfants) => setVoyageurs((v) => ({ ...v, enfants }))}
                />
                <Compteur
                    libelle="Bagages"
                    aide="Bagages en soute à déclarer, en plus du sac que chacun garde avec lui"
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

function ChampChoix({ libelle, valeur, vide, onPress, style }: { libelle: string; valeur?: string; vide?: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel={`${libelle} : ${valeur ?? vide ?? ''}`} onPress={onPress} style={[styles.choix, style]}>
            <Text style={styles.choixLibelle}>{libelle}</Text>
            <Text style={[styles.choixValeur, !valeur && styles.choixVide]} numberOfLines={1}>
                {valeur ?? vide}
            </Text>
        </Pressable>
    );
}

/** Liste filtrable plein écran : plus lisible qu'une liste déroulante sur un téléphone. */
function SelecteurVille({
    visible,
    titre,
    villes,
    chargement,
    onChoisir,
    onFermer
}: {
    visible: boolean;
    titre: string;
    villes: Ville[];
    chargement: boolean;
    onChoisir: (v: Ville) => void;
    onFermer: () => void;
}) {
    const [filtre, setFiltre] = useState('');
    const normaliser = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const visibles = villes.filter((v) => normaliser(v.libelle).includes(normaliser(filtre)));

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onFermer}>
            <View style={[base.ecran, { padding: espaces.lg, paddingTop: espaces.xxl }]}>
                <View style={base.ligne}>
                    <Text style={base.titre}>{titre}</Text>
                    <Bouton libelle="Fermer" variante="discret" onPress={onFermer} />
                </View>
                <TextInput
                    value={filtre}
                    onChangeText={setFiltre}
                    placeholder="Rechercher une ville"
                    placeholderTextColor={couleurs.gris}
                    autoFocus
                    style={[base.champSaisie, { marginVertical: espaces.md }]}
                    accessibilityLabel="Filtrer les villes"
                />
                <ScrollView keyboardShouldPersistTaps="handled">
                    {chargement && <Text style={base.attenue}>Chargement des villes…</Text>}
                    {!chargement && visibles.length === 0 && <Text style={base.attenue}>Aucune ville ne correspond.</Text>}
                    {visibles.map((v) => (
                        <Pressable key={v.villeUuid} accessibilityRole="button" onPress={() => onChoisir(v)} style={styles.villeLigne}>
                            <Text style={styles.villeNom}>{v.libelle}</Text>
                            <Text style={base.attenue}>{v.regionLibelle}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    bandeau: { backgroundColor: couleurs.vert, paddingHorizontal: espaces.lg, paddingTop: espaces.lg, paddingBottom: 56 },
    salut: { color: couleurs.blanc, fontSize: 26, fontWeight: '800' },
    sousSalut: { color: '#d7e6dc', lineHeight: 22, marginTop: espaces.xs },
    formulaire: { marginTop: -40, paddingHorizontal: espaces.lg },
    choix: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: rayons.md, padding: espaces.md, backgroundColor: couleurs.blanc },
    choixLibelle: { color: couleurs.gris, fontSize: 12 },
    choixValeur: { color: couleurs.encre, fontSize: 17, fontWeight: '700', marginTop: 2 },
    choixVide: { color: couleurs.gris, fontWeight: '400' },
    rangee: { flexDirection: 'row', gap: espaces.sm, marginTop: espaces.xs },
    inverser: { alignSelf: 'flex-end', width: 40, height: 28, alignItems: 'center', justifyContent: 'center', marginVertical: -espaces.xs },
    inverserTexte: { color: couleurs.vert, fontWeight: '800', fontSize: 20 },
    aidePlaces: { color: couleurs.gris, fontSize: 13, marginTop: espaces.sm },
    villeLigne: { paddingVertical: espaces.md, borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
    villeNom: { fontSize: 17, fontWeight: '600', color: couleurs.encre }
});

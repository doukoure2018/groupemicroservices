import { useQuery } from '@tanstack/react-query';
import type { Ville } from '@sira/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { Bandeau, Bouton, Carte, styles as base } from '../../ui/base';
import { couleurs, espaces, rayons } from '../../ui/theme';

/** Date du jour au format attendu par l'API (AAAA-MM-JJ), en heure locale. */
function dateIso(decalageJours = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + decalageJours);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function libelleDate(iso: string): string {
    const [a, m, j] = iso.split('-').map(Number);
    return new Date(a!, m! - 1, j!).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Accueil() {
    const { user } = useAuth();
    const villesQuery = useQuery({
        queryKey: ['villes-actives'],
        queryFn: async () => (await api.geo.villesActives()).data.villes ?? []
    });

    const [depart, setDepart] = useState<Ville | null>(null);
    const [arrivee, setArrivee] = useState<Ville | null>(null);
    const [date, setDate] = useState(dateIso());
    const [selecteur, setSelecteur] = useState<'depart' | 'arrivee' | null>(null);

    const memeVille = !!depart && !!arrivee && depart.villeUuid === arrivee.villeUuid;
    const valide = !!depart && !!arrivee && !memeVille;

    function rechercher() {
        if (!valide) return;
        router.push({
            pathname: '/recherche',
            params: { depart: depart!.villeUuid, arrivee: arrivee!.villeUuid, date, departLibelle: depart!.libelle, arriveeLibelle: arrivee!.libelle }
        });
    }

    // Sept prochains jours : assez pour un voyage interurbain, sans calendrier
    // natif dont la configuration varie d'une plateforme à l'autre.
    const jours = useMemo(() => Array.from({ length: 7 }, (_, i) => dateIso(i)), []);

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
            <View>
                <Text style={base.titre}>Bonjour {user?.firstName ?? ''}</Text>
                <Text style={base.sousTitre}>Où allez-vous aujourd'hui ?</Text>
            </View>

            <Carte>
                <ChoixVille libelle="Ville de départ" valeur={depart} onPress={() => setSelecteur('depart')} />
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Inverser départ et arrivée"
                    onPress={() => {
                        setDepart(arrivee);
                        setArrivee(depart);
                    }}
                    style={styles.inverser}
                >
                    <Text style={styles.inverserTexte}>⇅ Inverser</Text>
                </Pressable>
                <ChoixVille libelle="Ville d'arrivée" valeur={arrivee} onPress={() => setSelecteur('arrivee')} />
                {memeVille && <Bandeau type="erreur">La ville d'arrivée doit être différente de la ville de départ.</Bandeau>}

                <Text style={[base.sectionTitre, { marginTop: espaces.lg }]}>Date de départ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaces.sm, paddingVertical: espaces.sm }}>
                    {jours.map((j) => (
                        <Pressable
                            key={j}
                            accessibilityRole="button"
                            accessibilityState={{ selected: j === date }}
                            onPress={() => setDate(j)}
                            style={[styles.jour, j === date && styles.jourActif]}
                        >
                            <Text style={[styles.jourTexte, j === date && styles.jourTexteActif]}>{libelleDate(j)}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {villesQuery.isError && <Bandeau type="erreur">Impossible de charger les villes. Vérifiez votre réseau.</Bandeau>}
                <Bouton libelle="Rechercher" onPress={rechercher} desactive={!valide} style={{ marginTop: espaces.lg }} />
            </Carte>

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
        </ScrollView>
    );
}

function ChoixVille({ libelle, valeur, onPress }: { libelle: string; valeur: Ville | null; onPress: () => void }) {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel={libelle} onPress={onPress} style={styles.choix}>
            <Text style={styles.choixLibelle}>{libelle}</Text>
            <Text style={[styles.choixValeur, !valeur && styles.choixVide]}>{valeur?.libelle ?? 'Choisir une ville'}</Text>
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
    choix: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: rayons.md, padding: espaces.md, backgroundColor: couleurs.blanc },
    choixLibelle: { color: couleurs.gris, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    choixValeur: { color: couleurs.encre, fontSize: 18, fontWeight: '700', marginTop: 2 },
    choixVide: { color: couleurs.gris, fontWeight: '400' },
    inverser: { alignSelf: 'center', paddingVertical: espaces.sm },
    inverserTexte: { color: couleurs.vert, fontWeight: '700' },
    jour: { paddingHorizontal: espaces.md, paddingVertical: espaces.sm, borderRadius: 999, borderWidth: 1, borderColor: couleurs.ligne, backgroundColor: couleurs.blanc },
    jourActif: { backgroundColor: couleurs.vert, borderColor: couleurs.vert },
    jourTexte: { color: couleurs.encre, textTransform: 'capitalize' },
    jourTexteActif: { color: couleurs.blanc, fontWeight: '700' },
    villeLigne: { paddingVertical: espaces.md, borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
    villeNom: { fontSize: 17, fontWeight: '600', color: couleurs.encre }
});

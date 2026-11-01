import { ajouterJours, dateDepuisIso, dateIsoLocale } from '@sira/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, espaces } from './theme';

const JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

/**
 * Un mois à la fois, du jour même à la borne haute. Aucun composant natif :
 * le même rendu sur les deux plateformes, et rien à configurer.
 */
export function Calendrier({ valeur, min, max, onChoisir }: { valeur: string; min: string; max: string; onChoisir: (iso: string) => void }) {
    const [mois, setMois] = useState(() => {
        const d = dateDepuisIso(valeur);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const premierJour = new Date(mois.getFullYear(), mois.getMonth(), 1);
    const nbJours = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate();
    const decalage = (premierJour.getDay() + 6) % 7; // lundi en tête
    const cases: (string | null)[] = [...Array<null>(decalage).fill(null), ...Array.from({ length: nbJours }, (_, i) => dateIsoLocale(new Date(mois.getFullYear(), mois.getMonth(), i + 1)))];
    while (cases.length % 7 !== 0) cases.push(null);

    const moisPrecedent = new Date(mois.getFullYear(), mois.getMonth() - 1, 1);
    const moisSuivant = new Date(mois.getFullYear(), mois.getMonth() + 1, 1);
    const peutReculer = dateIsoLocale(new Date(mois.getFullYear(), mois.getMonth(), 0)) >= min;
    const peutAvancer = dateIsoLocale(moisSuivant) <= max;
    const aujourdhui = dateIsoLocale(new Date());
    const titre = mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
        <View>
            <View style={styles.entete}>
                <Fleche symbole="‹" actif={peutReculer} libelle="Mois précédent" onPress={() => setMois(moisPrecedent)} />
                <Text style={styles.titre}>{titre.charAt(0).toUpperCase() + titre.slice(1)}</Text>
                <Fleche symbole="›" actif={peutAvancer} libelle="Mois suivant" onPress={() => setMois(moisSuivant)} />
            </View>
            <View style={styles.grille}>
                {JOURS.map((j) => (
                    <Text key={j} style={styles.jourSemaine}>
                        {j}
                    </Text>
                ))}
                {cases.map((iso, i) => {
                    if (!iso) return <View key={`v${i}`} style={styles.case} />;
                    const hors = iso < min || iso > max;
                    const choisi = iso === valeur;
                    return (
                        <Pressable
                            key={iso}
                            accessibilityRole="button"
                            accessibilityLabel={dateDepuisIso(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            accessibilityState={{ disabled: hors, selected: choisi }}
                            disabled={hors}
                            onPress={() => onChoisir(iso)}
                            style={[styles.case, choisi && styles.caseChoisie]}
                        >
                            <Text style={[styles.jour, hors && styles.jourHors, iso === aujourdhui && !choisi && styles.jourAujourdhui, choisi && styles.jourChoisi]}>
                                {dateDepuisIso(iso).getDate()}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            <Text style={styles.aide}>Jusqu'au {dateDepuisIso(max).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}. Vous pourrez changer de jour sur l'écran des résultats.</Text>
        </View>
    );
}

function Fleche({ symbole, actif, libelle, onPress }: { symbole: string; actif: boolean; libelle: string; onPress: () => void }) {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel={libelle} accessibilityState={{ disabled: !actif }} disabled={!actif} onPress={onPress} hitSlop={8} style={styles.fleche}>
            <Text style={[styles.flecheTexte, !actif && { color: couleurs.ligne }]}>{symbole}</Text>
        </Pressable>
    );
}

// Sept colonnes ; la largeur en pourcentage évite tout calcul de mise en page.
const styles = StyleSheet.create({
    entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: espaces.sm },
    titre: { fontSize: 17, fontWeight: '700', color: couleurs.encre },
    fleche: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    flecheTexte: { fontSize: 28, lineHeight: 30, color: couleurs.vert },
    grille: { flexDirection: 'row', flexWrap: 'wrap' },
    jourSemaine: { width: '14.28%', textAlign: 'center', color: couleurs.gris, fontSize: 12, paddingVertical: espaces.xs },
    case: { width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
    caseChoisie: { backgroundColor: couleurs.vert },
    jour: { fontSize: 16, color: couleurs.encre },
    jourHors: { color: couleurs.ligne },
    jourAujourdhui: { fontWeight: '800', color: couleurs.vert },
    jourChoisi: { color: couleurs.blanc, fontWeight: '700' },
    aide: { color: couleurs.gris, fontSize: 13, lineHeight: 18, marginTop: espaces.md }
});

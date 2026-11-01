import { ajouterJours, aujourdhuiIso, libelleJourCourt } from '@sira/core';
import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { couleurs, espaces } from '../ui/theme';

const LARGEUR = 104;
const ESPACE = espaces.sm;
const JOURS_VISIBLES = 31;

/**
 * Les prochains jours sous l'en-tête des résultats : un geste pour voir les
 * autres départs du même trajet, sans repasser par l'accueil.
 */
export function BandeauDates({ date, onChoisir }: { date: string; onChoisir: (iso: string) => void }) {
    const jours = useMemo(() => {
        const liste = Array.from({ length: JOURS_VISIBLES }, (_, i) => ajouterJours(aujourdhuiIso(), i));
        // Une date hors fenêtre (lien partagé, retour tardif) reste visible et choisie.
        return liste.includes(date) ? liste : [date, ...liste].sort();
    }, [date]);
    const ref = useRef<ComponentRef<typeof ScrollView>>(null);
    const index = jours.indexOf(date);

    useEffect(() => {
        if (index < 0) return;
        ref.current?.scrollTo({ x: Math.max(0, index * (LARGEUR + ESPACE) - ESPACE * 2), animated: true });
    }, [index]);

    return (
        <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={styles.bandeau} contentContainerStyle={styles.contenu} accessibilityRole="tablist">
            {jours.map((j) => {
                const actif = j === date;
                return (
                    <Pressable
                        key={j}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: actif }}
                        onPress={() => onChoisir(j)}
                        style={[styles.jour, actif && styles.jourActif]}
                    >
                        <Text style={[styles.jourTexte, actif && styles.jourTexteActif]} numberOfLines={1}>
                            {libelleJourCourt(j)}
                        </Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    bandeau: { flexGrow: 0, backgroundColor: couleurs.vert },
    contenu: { paddingHorizontal: espaces.lg, paddingBottom: espaces.md, paddingTop: espaces.xs, gap: ESPACE },
    jour: { width: LARGEUR, paddingVertical: espaces.sm, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', alignItems: 'center' },
    jourActif: { backgroundColor: couleurs.blanc, borderColor: couleurs.blanc },
    jourTexte: { color: couleurs.blanc, fontWeight: '600', textTransform: 'capitalize', fontSize: 13 },
    jourTexteActif: { color: couleurs.vertFonce, fontWeight: '800' }
});

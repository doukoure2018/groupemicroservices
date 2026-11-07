import { estSiege, type PlanSieges } from '@sira/core';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, espaces, texte } from '../ui/theme';

const CASE = 44;
const ESPACE = 6;

/**
 * Le véhicule vu de dessus : le chauffeur en haut à gauche, les rangées
 * numérotées dans l'allée, chaque siège libre, pris ou choisi. Le plan vient
 * du serveur ; ici on ne fait que le dessiner et répondre au doigt.
 */
export function PlanSiegesVue({
    plan,
    occupes,
    choisis,
    onBasculer
}: {
    plan: PlanSieges;
    occupes: string[];
    choisis: string[];
    onBasculer: (numero: string) => void;
}) {
    const pris = new Set(occupes);
    const largeur = plan.colonnes * CASE + (plan.colonnes - 1) * ESPACE;
    return (
        <View style={[styles.carrosserie, { width: largeur + espaces.xl * 2 }]}>
            {plan.rangees.map((rangee) => (
                <View key={rangee.numero} style={styles.rangee}>
                    {rangee.cases.map((c, i) => {
                        if (estSiege(c)) {
                            const occupe = pris.has(c.numero);
                            const choisi = choisis.includes(c.numero);
                            return (
                                <Pressable
                                    key={i}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Siège ${c.numero}${occupe ? ', pris' : choisi ? ', choisi' : ', libre'}`}
                                    accessibilityState={{ disabled: occupe, selected: choisi }}
                                    disabled={occupe}
                                    onPress={() => onBasculer(c.numero)}
                                    style={[styles.siege, occupe && styles.siegePris, choisi && styles.siegeChoisi]}
                                >
                                    <Text style={[styles.siegeTexte, occupe && styles.siegeTextePris, choisi && styles.siegeTexteChoisi]}>{occupe ? '✕' : c.numero}</Text>
                                </Pressable>
                            );
                        }
                        if (c.type === 'CHAUFFEUR') {
                            return (
                                <View key={i} style={[styles.case, styles.chauffeur]} accessibilityLabel="Chauffeur">
                                    <Text style={styles.chauffeurTexte}>◎</Text>
                                </View>
                            );
                        }
                        if (c.type === 'ALLEE') {
                            return (
                                <View key={i} style={styles.case}>
                                    {rangee.numero > 0 && <Text style={styles.numeroRangee}>{rangee.numero}</Text>}
                                </View>
                            );
                        }
                        return <View key={i} style={styles.case} />;
                    })}
                </View>
            ))}
        </View>
    );
}

export function LegendeSieges() {
    return (
        <View style={styles.legende}>
            <Echantillon style={styles.siege} libelle="Libre" />
            <Echantillon style={[styles.siege, styles.siegePris]} libelle="Pris" />
            <Echantillon style={[styles.siege, styles.siegeChoisi]} libelle="Votre choix" />
        </View>
    );
}

function Echantillon({ style, libelle }: { style: object; libelle: string }) {
    return (
        <View style={styles.legendeItem}>
            <View style={[style, { width: 22, height: 22, borderTopLeftRadius: 7, borderTopRightRadius: 7 }]} />
            <Text style={styles.legendeTexte}>{libelle}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    carrosserie: {
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: couleurs.ligne,
        borderRadius: 28,
        borderTopLeftRadius: 48,
        borderTopRightRadius: 48,
        paddingHorizontal: espaces.xl,
        paddingVertical: espaces.xl,
        gap: ESPACE,
        backgroundColor: couleurs.blanc
    },
    rangee: { flexDirection: 'row', gap: ESPACE },
    case: { width: CASE, height: CASE, alignItems: 'center', justifyContent: 'center' },
    siege: {
        width: CASE,
        height: CASE,
        borderRadius: 8,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        borderWidth: 1.5,
        borderColor: couleurs.vert,
        backgroundColor: couleurs.blanc,
        alignItems: 'center',
        justifyContent: 'center'
    },
    siegePris: { borderColor: couleurs.ligne, backgroundColor: couleurs.fond },
    siegeChoisi: { backgroundColor: couleurs.vert, borderColor: couleurs.vert },
    siegeTexte: { color: couleurs.vertFonce, fontWeight: '700', fontSize: 13 },
    siegeTextePris: { color: couleurs.gris },
    siegeTexteChoisi: { color: couleurs.blanc },
    chauffeur: { borderWidth: 1.5, borderColor: couleurs.ligne, borderRadius: 22 },
    chauffeurTexte: { color: couleurs.gris, fontSize: 22 },
    numeroRangee: { ...texte.mention, color: couleurs.gris },
    legende: { flexDirection: 'row', justifyContent: 'center', gap: espaces.lg, paddingVertical: espaces.md },
    legendeItem: { flexDirection: 'row', alignItems: 'center', gap: espaces.sm },
    legendeTexte: { ...texte.secondaire, color: couleurs.gris }
});

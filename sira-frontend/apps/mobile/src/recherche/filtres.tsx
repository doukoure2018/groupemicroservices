import { FILTRES_DEFAUT, nombreFiltresActifs, PLAGES_HORAIRES, TRIS_OFFRES, type FiltresOffres } from '@sira/core';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bouton, styles as base } from '../ui/base';
import { couleurs, espaces, rayons } from '../ui/theme';

/**
 * Tri et filtres des résultats. Les choix se font sur un brouillon : le
 * bouton du bas annonce combien de voyages resteront, et n'applique qu'à la
 * validation. Fermer sans valider ne change rien.
 */
export function FiltresEcran({
    visible,
    filtres,
    typesVehicule,
    compter,
    onAppliquer,
    onFermer
}: {
    visible: boolean;
    filtres: FiltresOffres;
    typesVehicule: string[];
    compter: (f: FiltresOffres) => number;
    onAppliquer: (f: FiltresOffres) => void;
    onFermer: () => void;
}) {
    const insets = useSafeAreaInsets();
    const [brouillon, setBrouillon] = useState<FiltresOffres>(filtres);
    useEffect(() => {
        if (visible) setBrouillon(filtres);
    }, [visible, filtres]);

    const basculer = (cle: 'plagesDepart' | 'plagesArrivee' | 'typesVehicule', code: string) =>
        setBrouillon((b) => ({ ...b, [cle]: b[cle].includes(code) ? b[cle].filter((c) => c !== code) : [...b[cle], code] }));
    const nombre = compter(brouillon);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onFermer} presentationStyle="pageSheet">
            <View style={[base.ecran, { paddingTop: Math.max(insets.top, espaces.md) }]}>
                <View style={styles.entete}>
                    <View style={{ width: 40 }} />
                    <Text style={styles.titre}>Filtres</Text>
                    <Pressable onPress={onFermer} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={12} style={styles.fermer}>
                        <Text style={styles.fermerTexte}>✕</Text>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.contenu}>
                    <Text style={base.sectionTitre}>Trier selon</Text>
                    {TRIS_OFFRES.map((t) => {
                        const actif = brouillon.tri === t.code;
                        return (
                            <Pressable
                                key={t.code}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: actif }}
                                onPress={() => setBrouillon((b) => ({ ...b, tri: t.code }))}
                                style={styles.radio}
                            >
                                <View style={[styles.rond, actif && styles.rondActif]}>{actif && <View style={styles.rondCoeur} />}</View>
                                <Text style={styles.radioTexte}>{t.libelle}</Text>
                            </Pressable>
                        );
                    })}

                    <Text style={base.sectionTitre}>Heure de départ</Text>
                    <View style={styles.puces}>
                        {PLAGES_HORAIRES.map((p) => (
                            <Puce key={p.code} libelle={p.libelle} actif={brouillon.plagesDepart.includes(p.code)} onPress={() => basculer('plagesDepart', p.code)} />
                        ))}
                    </View>

                    <Text style={base.sectionTitre}>Heure d'arrivée</Text>
                    <View style={styles.puces}>
                        {PLAGES_HORAIRES.map((p) => (
                            <Puce key={p.code} libelle={p.libelle} actif={brouillon.plagesArrivee.includes(p.code)} onPress={() => basculer('plagesArrivee', p.code)} />
                        ))}
                    </View>

                    {typesVehicule.length > 1 && (
                        <>
                            <Text style={base.sectionTitre}>Véhicule</Text>
                            <View style={styles.puces}>
                                {typesVehicule.map((t) => (
                                    <Puce key={t} libelle={t} actif={brouillon.typesVehicule.includes(t)} onPress={() => basculer('typesVehicule', t)} />
                                ))}
                            </View>
                        </>
                    )}
                </ScrollView>

                <View style={[styles.pied, { paddingBottom: Math.max(insets.bottom, espaces.lg) }]}>
                    {nombreFiltresActifs(brouillon) > 0 && <Bouton libelle="Tout effacer" variante="discret" onPress={() => setBrouillon(FILTRES_DEFAUT)} />}
                    <Bouton libelle={`Afficher les voyages (${nombre})`} desactive={nombre === 0} onPress={() => onAppliquer(brouillon)} />
                </View>
            </View>
        </Modal>
    );
}

function Puce({ libelle, actif, onPress }: { libelle: string; actif: boolean; onPress: () => void }) {
    return (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: actif }} onPress={onPress} style={[styles.puce, actif && styles.puceActive]}>
            <Text style={[styles.puceTexte, actif && styles.puceTexteActive]}>{libelle}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: espaces.lg, paddingVertical: espaces.sm },
    titre: { fontSize: 18, fontWeight: '700', color: couleurs.encre },
    fermer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    fermerTexte: { fontSize: 18, color: couleurs.encre, fontWeight: '700' },
    contenu: { padding: espaces.lg, gap: espaces.sm, paddingBottom: espaces.xxl },
    radio: { flexDirection: 'row', alignItems: 'center', gap: espaces.md, paddingVertical: espaces.md },
    rond: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: couleurs.ligne, alignItems: 'center', justifyContent: 'center' },
    rondActif: { borderColor: couleurs.vert },
    rondCoeur: { width: 12, height: 12, borderRadius: 6, backgroundColor: couleurs.vert },
    radioTexte: { fontSize: 16, color: couleurs.encre },
    puces: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.sm, marginBottom: espaces.sm },
    puce: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: rayons.md, paddingHorizontal: espaces.md, paddingVertical: espaces.sm, backgroundColor: couleurs.blanc },
    puceActive: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    puceTexte: { color: couleurs.encre, fontWeight: '600' },
    puceTexteActive: { color: couleurs.vertFonce },
    pied: { paddingHorizontal: espaces.lg, paddingTop: espaces.md, borderTopWidth: 1, borderTopColor: couleurs.ligne, backgroundColor: couleurs.blanc, gap: espaces.sm }
});

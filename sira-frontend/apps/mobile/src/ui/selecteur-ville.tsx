import type { Ville } from '@sira/core';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bouton, styles as base } from './base';
import { couleurs, espaces, texte, zoomMax } from './theme';

/**
 * Liste filtrable plein écran : plus lisible qu'une liste déroulante sur un
 * téléphone, et le filtre ignore les accents. Les deux univers s'en servent,
 * pour le départ d'un voyage comme pour la ville d'un bien.
 */
export function SelecteurVille({
    visible,
    titre,
    villes,
    chargement,
    toutes,
    onChoisir,
    onFermer
}: {
    visible: boolean;
    titre: string;
    villes: Ville[];
    chargement: boolean;
    /** Libellé d'une entrée « sans filtre » en tête de liste ; absente si omis. */
    toutes?: string;
    onChoisir: (v: Ville | null) => void;
    onFermer: () => void;
}) {
    const [filtre, setFiltre] = useState('');
    const normaliser = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const visibles = villes.filter((v) => normaliser(v.libelle).includes(normaliser(filtre)));

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onFermer}>
            <View style={[base.ecran, { padding: espaces.lg, paddingTop: espaces.xxl }]}>
                <View style={base.ligne}>
                    <Text maxFontSizeMultiplier={zoomMax} style={base.titre}>
                        {titre}
                    </Text>
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
                    {toutes ? (
                        <Pressable accessibilityRole="button" onPress={() => onChoisir(null)} style={styles.ligne}>
                            <Text style={styles.nom}>{toutes}</Text>
                        </Pressable>
                    ) : null}
                    {chargement && <Text style={base.attenue}>Chargement des villes…</Text>}
                    {!chargement && visibles.length === 0 && <Text style={base.attenue}>Aucune ville ne correspond.</Text>}
                    {visibles.map((v) => (
                        <Pressable key={v.villeUuid} accessibilityRole="button" onPress={() => onChoisir(v)} style={styles.ligne}>
                            <Text style={styles.nom}>{v.libelle}</Text>
                            <Text style={base.attenue}>{v.regionLibelle}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    ligne: { paddingVertical: espaces.md, borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
    nom: { ...texte.appuye, color: couleurs.encre }
});

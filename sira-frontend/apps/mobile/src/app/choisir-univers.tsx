import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bouton, styles as base } from '../ui/base';
import { couleurs, espaces, rayons, texte, zoomMax } from '../ui/theme';
import { choisirUnivers, EMBLEMES, UNIVERS, useUnivers, type Univers } from '../univers';

/**
 * Premier lancement : deux cartes, un geste. L'application s'en souvient et
 * ne le redemande jamais ; on revient ici depuis Compte pour changer d'avis.
 */
export default function ChoisirUnivers() {
    const insets = useSafeAreaInsets();
    const { univers } = useUnivers();
    const premier = univers === null;
    const [choix, setChoix] = useState<Univers>(univers ?? 'voyager');

    function continuer() {
        choisirUnivers(choix);
        router.replace(UNIVERS[choix].accueil);
    }

    return (
        <View style={base.ecran}>
            <View style={[styles.bandeau, { paddingTop: insets.top + espaces.lg }]}>
                <Image source={require('../../assets/logo-synergia-blanc.png')} style={styles.logo} accessibilityLabel="SYNERGIA" accessibilityIgnoresInvertColors />
                <Text style={styles.titre} maxFontSizeMultiplier={zoomMax}>
                    Que venez-vous faire ?
                </Text>
                <Text style={styles.sousTitre}>Vous pourrez changer à tout moment.</Text>
            </View>
            <ScrollView contentContainerStyle={[base.contenu, { paddingBottom: insets.bottom + espaces.xl }]}>
                {(['voyager', 'loger'] as const).map((u) => {
                    const actif = choix === u;
                    return (
                        <Pressable
                            key={u}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: actif }}
                            onPress={() => setChoix(u)}
                            style={[styles.carte, actif && styles.carteActive]}
                        >
                            <Image source={EMBLEMES[u]} style={styles.embleme} accessibilityIgnoresInvertColors />
                            <Text style={styles.carteTitre}>{UNIVERS[u].libelle}</Text>
                            <Text style={styles.carteTexte}>{UNIVERS[u].accroche}</Text>
                        </Pressable>
                    );
                })}
                <Bouton libelle={premier ? 'Continuer' : `Ouvrir ${UNIVERS[choix].libelle}`} onPress={continuer} />
                {premier ? (
                    <Text style={[base.attenue, { textAlign: 'center' }]}>Aucun compte n’est demandé pour chercher.</Text>
                ) : (
                    <Bouton libelle="Annuler" variante="discret" onPress={() => router.back()} />
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    bandeau: { backgroundColor: couleurs.vert, paddingHorizontal: espaces.lg, paddingBottom: espaces.xl, gap: espaces.sm },
    logo: { width: 176, height: 32, resizeMode: 'contain', marginBottom: espaces.sm },
    titre: { ...texte.titre, color: couleurs.blanc },
    sousTitre: { ...texte.secondaire, color: couleurs.surVertSecondaire },
    carte: { backgroundColor: couleurs.blanc, borderRadius: rayons.lg, borderWidth: 2, borderColor: couleurs.ligne, padding: espaces.lg, gap: espaces.sm },
    carteActive: { borderColor: couleurs.vert },
    embleme: { width: 72, height: 56, resizeMode: 'contain' },
    carteTitre: { ...texte.section, color: couleurs.encre },
    carteTexte: { ...texte.secondaire, color: couleurs.gris }
});

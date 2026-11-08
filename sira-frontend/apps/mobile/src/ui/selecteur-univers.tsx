import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { choisirUnivers, EMBLEMES, UNIVERS, useUnivers, type Univers } from '../univers';
import { couleurs, texte, zoomMax } from './theme';

/** Change d'univers et ouvre son accueil ; le choix est retenu pour la prochaine ouverture. */
export function ouvrirUnivers(u: Univers) {
    choisirUnivers(u);
    router.replace(UNIVERS[u].accueil);
}

/**
 * « Voyager | Me loger » dans l'en-tête des deux accueils. L'univers se
 * reconnaît à son emblème et à son mot, jamais à une autre couleur de fond.
 */
export function SelecteurUnivers() {
    const { univers } = useUnivers();
    return (
        <View style={styles.seg} accessibilityRole="tablist">
            {(['voyager', 'loger'] as const).map((u) => {
                const actif = univers === u;
                return (
                    <Pressable
                        key={u}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: actif }}
                        accessibilityLabel={`Univers ${UNIVERS[u].libelle}`}
                        onPress={() => {
                            if (!actif) ouvrirUnivers(u);
                        }}
                        style={[styles.bouton, actif && styles.boutonActif]}
                    >
                        <Image source={EMBLEMES[u]} style={styles.embleme} accessibilityIgnoresInvertColors />
                        <Text style={[styles.libelle, actif && styles.libelleActif]} maxFontSizeMultiplier={zoomMax}>
                            {UNIVERS[u].libelle}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    seg: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, padding: 3 },
    bouton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, minHeight: 36 },
    boutonActif: { backgroundColor: couleurs.blanc },
    embleme: { width: 22, height: 18, resizeMode: 'contain' },
    libelle: { ...texte.libelle, color: couleurs.blanc },
    libelleActif: { color: couleurs.vertFonce }
});

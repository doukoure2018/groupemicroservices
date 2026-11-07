import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { couleurs, espaces, texte, zoomMax } from './theme';

/**
 * Feuille qui monte du bas de l'écran : un choix court (date, passagers,
 * détail d'un voyage) sans quitter l'écran qui l'a demandée. Toucher le voile
 * ou la croix la referme ; le pied reste visible quand le contenu défile.
 */
export function FeuilleBasse({
    visible,
    titre,
    onFermer,
    children,
    pied
}: {
    visible: boolean;
    titre: string;
    onFermer: () => void;
    children: ReactNode;
    pied?: ReactNode;
}) {
    const insets = useSafeAreaInsets();
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer} statusBarTranslucent>
            <View style={styles.fond}>
                <Pressable style={styles.voile} onPress={onFermer} accessibilityRole="button" accessibilityLabel="Fermer" />
                <View style={[styles.feuille, { paddingBottom: Math.max(insets.bottom, espaces.lg) }]}>
                    <View style={styles.poignee} />
                    <View style={styles.entete}>
                        <Text style={styles.titre} numberOfLines={2} maxFontSizeMultiplier={zoomMax}>
                            {titre}
                        </Text>
                        <Pressable onPress={onFermer} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={12} style={styles.fermer}>
                            <Text style={styles.fermerTexte}>✕</Text>
                        </Pressable>
                    </View>
                    <ScrollView style={styles.defilement} contentContainerStyle={styles.contenu} bounces={false} keyboardShouldPersistTaps="handled">
                        {children}
                    </ScrollView>
                    {pied ? <View style={styles.pied}>{pied}</View> : null}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fond: { flex: 1, justifyContent: 'flex-end' },
    voile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 71, 44, 0.45)' },
    feuille: { backgroundColor: couleurs.blanc, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', paddingTop: espaces.sm },
    poignee: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: couleurs.ligne, marginBottom: espaces.sm },
    entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaces.md, paddingHorizontal: espaces.lg, paddingVertical: espaces.sm },
    titre: { ...texte.titre, flex: 1, color: couleurs.encre },
    fermer: { width: 32, height: 32, borderRadius: 16, backgroundColor: couleurs.fond, alignItems: 'center', justifyContent: 'center' },
    fermerTexte: { fontSize: 16, color: couleurs.encre, fontWeight: '700' },
    defilement: { flexGrow: 0 },
    contenu: { paddingHorizontal: espaces.lg, paddingBottom: espaces.lg, gap: espaces.md },
    pied: { paddingHorizontal: espaces.lg, paddingTop: espaces.md, borderTopWidth: 1, borderTopColor: couleurs.ligne }
});

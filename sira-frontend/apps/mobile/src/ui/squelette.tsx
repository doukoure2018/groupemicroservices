import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Image, StyleSheet, View } from 'react-native';
import { couleurs, espaces, rayons } from './theme';

/**
 * Pendant la recherche : la silhouette des résultats à venir, et l'emblème au
 * centre. Le battement s'arrête si le système demande moins d'animations.
 */
export function SqueletteRecherche() {
    const opacite = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let boucle: Animated.CompositeAnimation | undefined;
        let monte = true;
        void AccessibilityInfo.isReduceMotionEnabled().then((reduit) => {
            if (reduit || !monte) return;
            boucle = Animated.loop(
                Animated.sequence([
                    Animated.timing(opacite, { toValue: 0.45, duration: 700, useNativeDriver: true }),
                    Animated.timing(opacite, { toValue: 1, duration: 700, useNativeDriver: true })
                ])
            );
            boucle.start();
        });
        return () => {
            monte = false;
            boucle?.stop();
        };
    }, [opacite]);

    return (
        <View style={styles.ecran} accessibilityRole="progressbar" accessibilityLabel="Recherche des voyages en cours">
            <Animated.View style={{ opacity: opacite, gap: espaces.lg }}>
                {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={styles.carte}>
                        <View style={styles.rangee}>
                            <View style={[styles.bloc, { width: 64, height: 22 }]} />
                            <View style={[styles.bloc, { width: 72, height: 22 }]} />
                        </View>
                        <View style={[styles.bloc, { width: '70%', height: 12 }]} />
                        <View style={styles.rangee}>
                            <View style={[styles.bloc, { width: 110, height: 28, borderRadius: 999 }]} />
                            <View style={[styles.bloc, { width: 56, height: 16 }]} />
                        </View>
                    </View>
                ))}
            </Animated.View>
            <View style={styles.voile} pointerEvents="none">
                <View style={styles.cadre}>
                    <Image source={require('../../assets/logo-emblem.png')} style={styles.logo} accessibilityIgnoresInvertColors />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    ecran: { flex: 1, backgroundColor: couleurs.fond, padding: espaces.lg },
    carte: { backgroundColor: couleurs.blanc, borderRadius: rayons.lg, borderWidth: 1, borderColor: couleurs.ligne, padding: espaces.lg, gap: espaces.md },
    rangee: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bloc: { backgroundColor: '#e3e8e0', borderRadius: rayons.sm },
    voile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    cadre: {
        width: 112,
        height: 112,
        borderRadius: 24,
        backgroundColor: couleurs.blanc,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: couleurs.vertFonce,
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6
    },
    logo: { width: 84, height: 84, resizeMode: 'contain' }
});

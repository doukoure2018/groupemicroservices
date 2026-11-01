import { useEffect, useState } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { couleurs } from './theme';

function secondesRestantes(iso: string): number {
    return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

/** Le temps qu'il reste avant que le serveur n'abandonne la commande : le sien, pas une minuterie locale. */
export function CompteARebours({ jusqua, style }: { jusqua: string; style?: StyleProp<TextStyle> }) {
    const [restant, setRestant] = useState(() => secondesRestantes(jusqua));

    useEffect(() => {
        setRestant(secondesRestantes(jusqua));
        const minuterie = setInterval(() => setRestant(secondesRestantes(jusqua)), 1000);
        return () => clearInterval(minuterie);
    }, [jusqua]);

    if (restant <= 0) return <Text style={[styles.texte, styles.ecoule, style]}>Délai de paiement écoulé</Text>;
    const minutes = Math.floor(restant / 60);
    const secondes = restant % 60;
    return (
        <Text style={[styles.texte, restant < 120 && styles.presse, style]} accessibilityLiveRegion="polite">
            Il vous reste {minutes}:{String(secondes).padStart(2, '0')} pour payer
        </Text>
    );
}

const styles = StyleSheet.create({
    texte: { textAlign: 'center', fontWeight: '700', color: couleurs.vertFonce, fontVariant: ['tabular-nums'] },
    presse: { color: couleurs.alerte },
    ecoule: { color: couleurs.danger }
});

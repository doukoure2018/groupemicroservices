import { Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, espaces } from './theme';

/** Un nombre que l'on règle au pouce : − valeur +, borné, avec une aide en dessous du libellé. */
export function Compteur({
    libelle,
    aide,
    valeur,
    min,
    max,
    onChange
}: {
    libelle: string;
    aide?: string;
    valeur: number;
    min: number;
    max: number;
    onChange: (valeur: number) => void;
}) {
    const peutRetirer = valeur > min;
    const peutAjouter = valeur < max;
    return (
        <View style={styles.ligne}>
            <View style={{ flex: 1 }}>
                <Text style={styles.libelle}>{libelle}</Text>
                {aide ? <Text style={styles.aide}>{aide}</Text> : null}
            </View>
            <View style={styles.commandes}>
                <Rond symbole="−" actif={peutRetirer} libelle={`Retirer ${libelle.toLowerCase()}`} onPress={() => onChange(valeur - 1)} />
                <Text style={styles.valeur} accessibilityLiveRegion="polite">
                    {valeur}
                </Text>
                <Rond symbole="+" actif={peutAjouter} libelle={`Ajouter ${libelle.toLowerCase()}`} onPress={() => onChange(valeur + 1)} />
            </View>
        </View>
    );
}

function Rond({ symbole, actif, libelle, onPress }: { symbole: string; actif: boolean; libelle: string; onPress: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={libelle}
            accessibilityState={{ disabled: !actif }}
            disabled={!actif}
            onPress={onPress}
            hitSlop={6}
            style={({ pressed }) => [styles.rond, !actif && styles.rondInactif, pressed && actif && { opacity: 0.7 }]}
        >
            <Text style={[styles.rondTexte, !actif && styles.rondTexteInactif]}>{symbole}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    ligne: { flexDirection: 'row', alignItems: 'center', gap: espaces.md, paddingVertical: espaces.md, borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
    libelle: { fontSize: 17, fontWeight: '600', color: couleurs.encre },
    aide: { color: couleurs.gris, fontSize: 13, lineHeight: 18, marginTop: 2 },
    commandes: { flexDirection: 'row', alignItems: 'center', gap: espaces.md },
    valeur: { minWidth: 24, textAlign: 'center', fontSize: 18, fontWeight: '700', color: couleurs.encre },
    rond: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: couleurs.vert, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.blanc },
    rondInactif: { borderColor: couleurs.ligne },
    rondTexte: { fontSize: 22, lineHeight: 24, color: couleurs.vert, fontWeight: '600' },
    rondTexteInactif: { color: couleurs.ligne }
});

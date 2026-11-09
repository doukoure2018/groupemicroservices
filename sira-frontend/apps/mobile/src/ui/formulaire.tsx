import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { styles as base } from './base';
import { couleurs, espaces, rayons, texte, zoomMax } from './theme';

/**
 * Les briques des formulaires, les mêmes partout : la puce que l'on choisit,
 * la ligne d'option d'une feuille, le champ de saisie dessiné comme un champ
 * de choix. Toutes respectent la charte (44 dp au moins, 14 sp au moins).
 */

export function Puce({ libelle, actif, onPress, role = 'button' }: { libelle: string; actif: boolean; onPress: () => void; role?: 'button' | 'radio' }) {
    return (
        <Pressable
            accessibilityRole={role}
            accessibilityState={role === 'radio' ? { checked: actif } : { selected: actif }}
            onPress={onPress}
            style={[styles.puce, actif && styles.puceActive]}
        >
            <Text maxFontSizeMultiplier={zoomMax} style={[styles.puceTexte, actif && styles.puceTexteActif]}>
                {libelle}
            </Text>
        </Pressable>
    );
}

/** Une rangée de puces qui passe à la ligne. */
export function Puces({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
    return <View style={[styles.puces, style]}>{children}</View>;
}

export function Option({ libelle, actif, onPress }: { libelle: string; actif: boolean; onPress: () => void }) {
    return (
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: actif }} onPress={onPress} style={styles.option}>
            <Text style={[styles.optionTexte, actif && { color: couleurs.vert }]}>{libelle}</Text>
            {actif && <Text style={[styles.optionTexte, { color: couleurs.vert }]}>✓</Text>}
        </Pressable>
    );
}

/** Même dessin qu'un champ de choix : libellé au-dessus, valeur en dessous, et toute la case donne le focus. */
export function ChampSaisie({
    libelle,
    valeur,
    onChange,
    attendu,
    clavier = 'texte',
    multiligne,
    longueurMax,
    style
}: {
    libelle: string;
    valeur: string;
    onChange: (v: string) => void;
    attendu: string;
    clavier?: 'texte' | 'numerique' | 'telephone' | 'decimal';
    multiligne?: boolean;
    longueurMax?: number;
    style?: StyleProp<ViewStyle>;
}) {
    const saisie = useRef<ComponentRef<typeof TextInput>>(null);
    const keyboardType = { texte: 'default', numerique: 'number-pad', telephone: 'phone-pad', decimal: 'decimal-pad' } as const;
    return (
        <Pressable style={[base.choix, multiligne && styles.zoneTexte, style]} onPress={() => saisie.current?.focus()} accessible={false}>
            <Text style={base.choixLibelle}>{libelle}</Text>
            <TextInput
                ref={saisie}
                value={valeur}
                onChangeText={onChange}
                placeholder={attendu}
                placeholderTextColor={couleurs.gris}
                keyboardType={keyboardType[clavier]}
                multiline={multiligne}
                maxLength={longueurMax}
                accessibilityLabel={libelle}
                style={[styles.saisie, multiligne && styles.saisieLongue]}
            />
        </Pressable>
    );
}

export const styles = StyleSheet.create({
    puces: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.sm },
    puce: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: couleurs.blanc, minHeight: 44, justifyContent: 'center' },
    puceActive: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    puceTexte: { ...texte.libelle, color: couleurs.encre },
    puceTexteActif: { color: couleurs.vertFonce },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: espaces.md, borderBottomWidth: 1, borderBottomColor: couleurs.ligne, borderRadius: rayons.sm },
    optionTexte: { ...texte.appuye, color: couleurs.encre },
    saisie: { ...texte.appuye, color: couleurs.encre, padding: 0, marginTop: 2 },
    zoneTexte: { minHeight: 96, justifyContent: 'flex-start' },
    saisieLongue: { ...texte.corps, minHeight: 64, textAlignVertical: 'top' }
});

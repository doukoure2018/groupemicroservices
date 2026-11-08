import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { couleurs, espaces, rayons, texte, zoomMax } from './theme';

/** Bouton plein, secondaire ou discret, avec état d'attente. */
export function Bouton({
    libelle,
    onPress,
    variante = 'plein',
    desactive,
    enCours,
    style
}: {
    libelle: string;
    onPress: () => void;
    variante?: 'plein' | 'secondaire' | 'danger' | 'discret';
    desactive?: boolean;
    enCours?: boolean;
    style?: StyleProp<ViewStyle>;
}) {
    const inactif = desactive || enCours;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !!inactif }}
            onPress={onPress}
            disabled={inactif}
            style={({ pressed }) => [
                styles.bouton,
                variante === 'plein' && styles.boutonPlein,
                variante === 'secondaire' && styles.boutonSecondaire,
                variante === 'danger' && styles.boutonDanger,
                variante === 'discret' && styles.boutonDiscret,
                inactif && styles.boutonInactif,
                pressed && !inactif && styles.boutonPresse,
                style
            ]}
        >
            {enCours ? (
                <ActivityIndicator color={variante === 'plein' || variante === 'danger' ? couleurs.blanc : couleurs.vert} />
            ) : (
                <Text
                    maxFontSizeMultiplier={zoomMax}
                    style={[
                        styles.boutonTexte,
                        (variante === 'secondaire' || variante === 'discret') && styles.boutonTexteVert
                    ]}
                >
                    {libelle}
                </Text>
            )}
        </Pressable>
    );
}

/** Champ de saisie avec libellé et message d'erreur facultatif. */
export function Champ({
    libelle,
    erreur,
    ...props
}: { libelle: string; erreur?: string | null } & TextInputProps) {
    return (
        <View style={styles.champ}>
            <Text style={styles.champLibelle}>{libelle}</Text>
            <TextInput
                placeholderTextColor={couleurs.gris}
                style={[styles.champSaisie, erreur ? styles.champSaisieErreur : null]}
                accessibilityLabel={libelle}
                {...props}
            />
            {erreur ? <Text style={styles.champErreur}>{erreur}</Text> : null}
        </View>
    );
}

export function Carte({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
    return <View style={[styles.carte, style]}>{children}</View>;
}

/**
 * Champ que l'on touche pour choisir (ville, date, passagers, type de bien) :
 * le libellé au-dessus de la valeur, tous deux toujours visibles ; vide, il
 * garde son libellé et dit ce qu'il attend (charte typographique, § 7).
 */
export function ChampChoix({ libelle, valeur, vide, onPress, style }: { libelle: string; valeur?: string; vide?: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel={`${libelle} : ${valeur ?? vide ?? ''}`} onPress={onPress} style={[styles.choix, style]}>
            <Text style={styles.choixLibelle}>{libelle}</Text>
            <Text style={[styles.choixValeur, !valeur && styles.choixVide]} numberOfLines={2}>
                {valeur ?? vide}
            </Text>
        </Pressable>
    );
}

/** Écran vide ou d'erreur : icône texte, titre, explication, action. */
export function EtatVide({ titre, texte, action }: { titre: string; texte?: string; action?: ReactNode }) {
    return (
        <View style={styles.etatVide}>
            <Text style={styles.etatVideTitre}>{titre}</Text>
            {texte ? <Text style={styles.etatVideTexte}>{texte}</Text> : null}
            {action ? <View style={{ marginTop: espaces.lg }}>{action}</View> : null}
        </View>
    );
}

export function Chargement({ texte }: { texte?: string }) {
    return (
        <View style={styles.chargement}>
            <ActivityIndicator size="large" color={couleurs.vert} />
            {texte ? <Text style={styles.etatVideTexte}>{texte}</Text> : null}
        </View>
    );
}

/** Rang d'un menu : libellé, valeur facultative, chevron si l'on peut l'ouvrir. */
export function LigneMenu({ libelle, valeur, onPress, dernier }: { libelle: string; valeur?: string; onPress?: () => void; dernier?: boolean }) {
    return (
        <Pressable
            accessibilityRole={onPress ? 'button' : undefined}
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [styles.ligneMenu, !dernier && styles.ligneMenuBordure, pressed && !!onPress && styles.boutonPresse]}
        >
            <Text style={styles.ligneMenuLibelle}>{libelle}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaces.sm }}>
                {valeur ? <Text style={styles.attenue}>{valeur}</Text> : null}
                {onPress ? <Text style={styles.ligneMenuChevron}>›</Text> : null}
            </View>
        </Pressable>
    );
}

export function Bandeau({ type, children }: { type: 'info' | 'alerte' | 'erreur' | 'succes'; children: ReactNode }) {
    const fond = { info: couleurs.vertPale, alerte: couleurs.alertePale, erreur: couleurs.dangerPale, succes: couleurs.succesPale }[type];
    const encre = { info: couleurs.vertFonce, alerte: couleurs.alerte, erreur: couleurs.danger, succes: couleurs.vertFonce }[type];
    return (
        <View style={[styles.bandeau, { backgroundColor: fond }]}>
            <Text style={[styles.bandeauTexte, { color: encre }]}>{children}</Text>
        </View>
    );
}

export const styles = StyleSheet.create({
    bouton: {
        minHeight: 50,
        paddingHorizontal: espaces.lg,
        borderRadius: rayons.md,
        alignItems: 'center',
        justifyContent: 'center'
    },
    boutonPlein: { backgroundColor: couleurs.vert },
    boutonSecondaire: { backgroundColor: couleurs.blanc, borderWidth: 1, borderColor: couleurs.vert },
    boutonDanger: { backgroundColor: couleurs.danger },
    boutonDiscret: { backgroundColor: 'transparent' },
    boutonInactif: { opacity: 0.5 },
    boutonPresse: { opacity: 0.85 },
    boutonTexte: { ...texte.bouton, color: couleurs.blanc },
    boutonTexteVert: { color: couleurs.vert },

    champ: { marginBottom: espaces.lg },
    champLibelle: { ...texte.libelle, color: couleurs.encre, marginBottom: espaces.xs },
    champSaisie: {
        borderWidth: 1,
        borderColor: couleurs.ligne,
        borderRadius: rayons.md,
        paddingHorizontal: espaces.md,
        paddingVertical: 12,
        fontSize: 16,
        color: couleurs.encre,
        backgroundColor: couleurs.blanc
    },
    champSaisieErreur: { borderColor: couleurs.danger },
    champErreur: { ...texte.secondaire, color: couleurs.danger, marginTop: espaces.xs },

    carte: {
        backgroundColor: couleurs.blanc,
        borderRadius: rayons.lg,
        padding: espaces.lg,
        borderWidth: 1,
        borderColor: couleurs.ligne
    },

    choix: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: rayons.md, padding: espaces.md, backgroundColor: couleurs.blanc, minHeight: 56, justifyContent: 'center' },
    choixLibelle: { ...texte.libelle, color: couleurs.gris },
    choixValeur: { ...texte.appuye, color: couleurs.encre, marginTop: 2 },
    choixVide: { color: couleurs.gris, fontWeight: '400' },

    etatVide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaces.xl },
    etatVideTitre: { ...texte.titre, color: couleurs.encre, textAlign: 'center' },
    etatVideTexte: { ...texte.corps, color: couleurs.gris, textAlign: 'center', marginTop: espaces.sm },
    chargement: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaces.xl, gap: espaces.md },

    ligneMenu: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaces.sm, minHeight: 52, paddingVertical: espaces.md },
    ligneMenuBordure: { borderBottomWidth: 1, borderBottomColor: couleurs.ligne },
    ligneMenuLibelle: { ...texte.appuye, color: couleurs.encre },
    ligneMenuChevron: { fontSize: 24, lineHeight: 24, color: couleurs.gris },

    bandeau: { borderRadius: rayons.md, padding: espaces.md },
    bandeauTexte: { ...texte.corps },

    // Styles partagés par les écrans, exprimés avec les rôles de la charte (ui/theme.ts).
    ecran: { flex: 1, backgroundColor: couleurs.fond },
    contenu: { padding: espaces.lg, gap: espaces.lg },
    titre: { ...texte.titre, color: couleurs.encre },
    sousTitre: { ...texte.corps, color: couleurs.gris },
    sectionTitre: { ...texte.section, color: couleurs.encre, marginTop: espaces.sm },
    ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaces.sm },
    attenue: { ...texte.secondaire, color: couleurs.gris },
    gras: { fontWeight: '600', color: couleurs.encre }
});

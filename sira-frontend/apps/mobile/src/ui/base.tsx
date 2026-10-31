import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { couleurs, espaces, rayons } from './theme';

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
    boutonTexte: { color: couleurs.blanc, fontWeight: '700', fontSize: 16 },
    boutonTexteVert: { color: couleurs.vert },

    champ: { marginBottom: espaces.lg },
    champLibelle: { color: couleurs.encre, fontWeight: '600', marginBottom: espaces.xs },
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
    champErreur: { color: couleurs.danger, marginTop: espaces.xs, fontSize: 13 },

    carte: {
        backgroundColor: couleurs.blanc,
        borderRadius: rayons.lg,
        padding: espaces.lg,
        borderWidth: 1,
        borderColor: couleurs.ligne
    },

    etatVide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaces.xl },
    etatVideTitre: { fontSize: 20, fontWeight: '700', color: couleurs.encre, textAlign: 'center' },
    etatVideTexte: { color: couleurs.gris, textAlign: 'center', marginTop: espaces.sm, lineHeight: 22 },
    chargement: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaces.xl, gap: espaces.md },

    bandeau: { borderRadius: rayons.md, padding: espaces.md },
    bandeauTexte: { lineHeight: 20 },

    // Styles partagés par les écrans.
    ecran: { flex: 1, backgroundColor: couleurs.fond },
    contenu: { padding: espaces.lg, gap: espaces.lg },
    titre: { fontSize: 24, fontWeight: '800', color: couleurs.encre },
    sousTitre: { color: couleurs.gris, lineHeight: 22 },
    sectionTitre: { fontSize: 17, fontWeight: '700', color: couleurs.encre, marginTop: espaces.sm },
    ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaces.sm },
    attenue: { color: couleurs.gris },
    gras: { fontWeight: '700', color: couleurs.encre }
});

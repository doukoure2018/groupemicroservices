import { useQuery } from '@tanstack/react-query';
import { formatMontant, type TypeAnnonce, type TypeBien } from '@sira/core';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { Bandeau, Bouton, Carte, ChampChoix, styles as base } from '../../ui/base';
import { FeuilleBasse } from '../../ui/feuille';
import { couleurs, espaces, rayons, texte, zoomMax } from '../../ui/theme';

/**
 * L'accueil de Me loger : louer ou acheter, où, quoi, pour quel budget.
 * Lot I0 : le socle et le formulaire. Les résultats, la fiche d'un bien et
 * les favoris arrivent avec le lot I1 (docs/proposition-application-unique.md).
 */
export default function AccueilLoger() {
    const { user } = useAuth();
    const [typeAnnonce, setTypeAnnonce] = useState<TypeAnnonce>('LOCATION');
    const [ville, setVille] = useState('');
    const [typeBien, setTypeBien] = useState<TypeBien | null>(null);
    const [budget, setBudget] = useState('');
    const [feuille, setFeuille] = useState<'type' | null>(null);
    const [recapitulatif, setRecapitulatif] = useState<string | null>(null);

    // Référentiel public, le même que celui du site.
    const typesBien = useQuery({
        queryKey: ['types-bien'],
        queryFn: async () => (await api.immo.proprietes.typesBien()).data.types ?? []
    });

    function rechercher() {
        const budgetNombre = Number.parseInt(budget.replace(/\D/g, ''), 10);
        const criteres = [
            typeAnnonce === 'LOCATION' ? 'Location' : 'Achat',
            ville.trim() || 'toutes les villes',
            typeBien?.libelle ?? 'tous les types de bien',
            Number.isFinite(budgetNombre) ? `jusqu’à ${formatMontant(budgetNombre)}` : null
        ].filter(Boolean);
        setRecapitulatif(criteres.join(', '));
    }

    return (
        <>
            <ScrollView style={base.ecran} contentContainerStyle={{ paddingBottom: espaces.xl }} keyboardShouldPersistTaps="handled">
                <View style={styles.bandeau}>
                    <Text style={styles.salut} maxFontSizeMultiplier={zoomMax}>
                        {user ? `Bonjour ${user.firstName ?? ''}`.trim() : 'Où voulez-vous vivre ?'}
                    </Text>
                    <Text style={styles.sousSalut}>Louer ou acheter, sans compte pour chercher.</Text>
                </View>

                <View style={styles.formulaire}>
                    <Carte style={{ gap: espaces.sm }}>
                        <View style={styles.puces} accessibilityRole="radiogroup">
                            <Puce libelle="Louer" actif={typeAnnonce === 'LOCATION'} onPress={() => setTypeAnnonce('LOCATION')} />
                            <Puce libelle="Acheter" actif={typeAnnonce === 'VENTE'} onPress={() => setTypeAnnonce('VENTE')} />
                        </View>
                        <ChampSaisie libelle="Ville ou quartier" valeur={ville} onChange={setVille} attendu="Conakry, Ratoma, Kindia…" />
                        <View style={styles.rangee}>
                            <ChampChoix libelle="Type de bien" valeur={typeBien?.libelle} vide="Tous" onPress={() => setFeuille('type')} style={{ flex: 1 }} />
                            <ChampSaisie libelle="Budget maximal" valeur={budget} onChange={setBudget} attendu="En GNF" numerique style={{ flex: 1 }} />
                        </View>
                        <Bouton libelle="Rechercher" onPress={rechercher} style={{ marginTop: espaces.sm }} />
                        {recapitulatif && (
                            <Bandeau type="info">La recherche de biens arrive avec le prochain lot. Vos critères : {recapitulatif}.</Bandeau>
                        )}
                    </Carte>
                </View>
            </ScrollView>

            <FeuilleBasse visible={feuille === 'type'} titre="Type de bien" onFermer={() => setFeuille(null)}>
                <Option
                    libelle="Tous"
                    actif={typeBien === null}
                    onPress={() => {
                        setTypeBien(null);
                        setFeuille(null);
                    }}
                />
                {typesBien.isPending && <Text style={base.attenue}>Chargement des types de bien…</Text>}
                {typesBien.isError && <Bandeau type="erreur">Impossible de charger les types de bien. Vérifiez votre réseau.</Bandeau>}
                {(typesBien.data ?? []).map((t) => (
                    <Option
                        key={t.code ?? t.libelle ?? String(t.typeBienId)}
                        libelle={t.libelle ?? t.code ?? ''}
                        actif={typeBien?.code === t.code}
                        onPress={() => {
                            setTypeBien(t);
                            setFeuille(null);
                        }}
                    />
                ))}
            </FeuilleBasse>
        </>
    );
}

function Puce({ libelle, actif, onPress }: { libelle: string; actif: boolean; onPress: () => void }) {
    return (
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: actif }} onPress={onPress} style={[styles.puce, actif && styles.puceActive]}>
            <Text style={[styles.puceTexte, actif && styles.puceTexteActif]}>{libelle}</Text>
        </Pressable>
    );
}

/** Même dessin que les champs de choix : libellé au-dessus, valeur saisie en dessous. */
function ChampSaisie({
    libelle,
    valeur,
    onChange,
    attendu,
    numerique,
    style
}: {
    libelle: string;
    valeur: string;
    onChange: (v: string) => void;
    attendu: string;
    numerique?: boolean;
    style?: object;
}) {
    const saisie = useRef<ComponentRef<typeof TextInput>>(null);
    return (
        <Pressable style={[base.choix, style]} onPress={() => saisie.current?.focus()} accessible={false}>
            <Text style={base.choixLibelle}>{libelle}</Text>
            <TextInput
                ref={saisie}
                value={valeur}
                onChangeText={onChange}
                placeholder={attendu}
                placeholderTextColor={couleurs.gris}
                keyboardType={numerique ? 'number-pad' : 'default'}
                accessibilityLabel={libelle}
                style={styles.saisie}
            />
        </Pressable>
    );
}

function Option({ libelle, actif, onPress }: { libelle: string; actif: boolean; onPress: () => void }) {
    return (
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: actif }} onPress={onPress} style={styles.option}>
            <Text style={[styles.optionTexte, actif && { color: couleurs.vert }]}>{libelle}</Text>
            {actif && <Text style={{ color: couleurs.vert, fontWeight: '700' }}>✓</Text>}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    bandeau: { backgroundColor: couleurs.vert, paddingHorizontal: espaces.lg, paddingTop: espaces.lg, paddingBottom: 56 },
    salut: { ...texte.titre, color: couleurs.blanc },
    sousSalut: { ...texte.secondaire, color: couleurs.surVertSecondaire, marginTop: espaces.xs },
    formulaire: { marginTop: -40, paddingHorizontal: espaces.lg },
    puces: { flexDirection: 'row', gap: espaces.sm },
    puce: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: couleurs.blanc },
    puceActive: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    puceTexte: { ...texte.libelle, color: couleurs.encre },
    puceTexteActif: { color: couleurs.vertFonce },
    rangee: { flexDirection: 'row', gap: espaces.sm },
    saisie: { ...texte.appuye, color: couleurs.encre, padding: 0, marginTop: 2 },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: espaces.md, borderBottomWidth: 1, borderBottomColor: couleurs.ligne, borderRadius: rayons.sm },
    optionTexte: { ...texte.appuye, color: couleurs.encre }
});

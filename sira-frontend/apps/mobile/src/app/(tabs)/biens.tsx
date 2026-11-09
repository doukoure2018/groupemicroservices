import { useQuery } from '@tanstack/react-query';
import type { TypeAnnonce, TypeBien, Ville } from '@sira/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { paramsDepuisCriteres } from '../../immo/criteres';
import { Bandeau, Bouton, Carte, ChampChoix, styles as base } from '../../ui/base';
import { FeuilleBasse } from '../../ui/feuille';
import { ChampSaisie, Option, Puce, Puces } from '../../ui/formulaire';
import { SelecteurVille } from '../../ui/selecteur-ville';
import { couleurs, espaces, texte, zoomMax } from '../../ui/theme';

/**
 * L'accueil de Me loger : louer ou acheter, où, quoi, pour quel budget. On
 * cherche large ici ; les filtres fins se posent sur les résultats, en voyant
 * ce qui sort. Aucun compte n'est demandé pour chercher.
 */
export default function AccueilLoger() {
    const { user } = useAuth();
    const [typeAnnonce, setTypeAnnonce] = useState<TypeAnnonce>('LOCATION');
    const [ville, setVille] = useState<Ville | null>(null);
    const [typeBien, setTypeBien] = useState<TypeBien | null>(null);
    const [budget, setBudget] = useState('');
    const [feuille, setFeuille] = useState<'type' | null>(null);
    const [selecteurVille, setSelecteurVille] = useState(false);

    // Référentiels publics, les mêmes que ceux du site.
    const typesBien = useQuery({ queryKey: ['types-bien'], queryFn: async () => (await api.immo.proprietes.typesBien()).data.types ?? [] });
    const villes = useQuery({ queryKey: ['villes-actives'], queryFn: async () => (await api.geo.villesActives()).data.villes ?? [] });

    function rechercher() {
        const budgetNombre = Number.parseInt(budget.replace(/\D/g, ''), 10);
        router.push({
            pathname: '/biens/resultats',
            params: paramsDepuisCriteres(
                {
                    typeAnnonce,
                    ...(ville ? { villeUuid: ville.villeUuid } : {}),
                    ...(typeBien?.code ? { typeBienCodes: [typeBien.code] } : {}),
                    ...(Number.isFinite(budgetNombre) && budgetNombre > 0 ? { prixMax: budgetNombre } : {}),
                    trier: 'DATE_DESC'
                },
                ville?.libelle
            )
        });
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
                        <Puces>
                            <Puce role="radio" libelle="Louer" actif={typeAnnonce === 'LOCATION'} onPress={() => setTypeAnnonce('LOCATION')} />
                            <Puce role="radio" libelle="Acheter" actif={typeAnnonce === 'VENTE'} onPress={() => setTypeAnnonce('VENTE')} />
                        </Puces>
                        <ChampChoix libelle="Ville" valeur={ville?.libelle} vide="Toutes les villes" onPress={() => setSelecteurVille(true)} />
                        <View style={styles.rangee}>
                            <ChampChoix libelle="Type de bien" valeur={typeBien?.libelle} vide="Tous" onPress={() => setFeuille('type')} style={{ flex: 1 }} />
                            <ChampSaisie libelle="Budget maximal" valeur={budget} onChange={setBudget} attendu="En GNF" clavier="numerique" style={{ flex: 1 }} />
                        </View>
                        {villes.isError && <Bandeau type="erreur">Impossible de charger les villes. Vérifiez votre réseau.</Bandeau>}
                        <Bouton libelle="Rechercher" onPress={rechercher} style={{ marginTop: espaces.sm }} />
                    </Carte>
                    <Carte style={[styles.publier, { marginTop: espaces.lg }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.publierTitre}>Vous avez un bien à proposer ?</Text>
                            <Text style={base.attenue}>Quatre étapes, vos photos, et l'annonce est en ligne.</Text>
                        </View>
                        <Bouton libelle="Publier" variante="secondaire" onPress={() => router.push('/mes-annonces')} />
                    </Carte>
                </View>
            </ScrollView>

            <SelecteurVille
                visible={selecteurVille}
                titre="Ville"
                villes={villes.data ?? []}
                chargement={villes.isPending}
                toutes="Toutes les villes"
                onChoisir={(v) => {
                    setVille(v);
                    setSelecteurVille(false);
                }}
                onFermer={() => setSelecteurVille(false)}
            />

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
                        key={t.code ?? String(t.typeBienId)}
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

const styles = StyleSheet.create({
    bandeau: { backgroundColor: couleurs.vert, paddingHorizontal: espaces.lg, paddingTop: espaces.lg, paddingBottom: 56 },
    salut: { ...texte.titre, color: couleurs.blanc },
    sousSalut: { ...texte.secondaire, color: couleurs.surVertSecondaire, marginTop: espaces.xs },
    formulaire: { marginTop: -40, paddingHorizontal: espaces.lg },
    rangee: { flexDirection: 'row', gap: espaces.sm },
    publier: { flexDirection: 'row', alignItems: 'center', gap: espaces.md },
    publierTitre: { ...texte.appuye, color: couleurs.encre }
});

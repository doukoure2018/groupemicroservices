import { useQuery } from '@tanstack/react-query';
import { nombreSiegesLibres } from '@sira/core';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';
import { Bandeau, Bouton, Chargement, EtatVide, styles as base } from '../ui/base';
import { couleurs, espaces } from '../ui/theme';
import { LegendeSieges, PlanSiegesVue } from './plan-sieges';

/**
 * Choisir ses sièges, ou ne pas choisir : « Ignorer la sélection » laisse le
 * serveur attribuer les premiers sièges libres, côte à côte si possible. Le
 * plan se recharge à chaque ouverture : un siège libre il y a une minute ne
 * l'est peut-être plus.
 */
export function SelecteurSieges({
    offreUuid,
    nombre,
    choisis,
    visible,
    onConfirmer,
    onIgnorer,
    onFermer
}: {
    offreUuid: string;
    nombre: number;
    choisis: string[];
    visible: boolean;
    onConfirmer: (sieges: string[]) => void;
    onIgnorer: () => void;
    onFermer: () => void;
}) {
    const insets = useSafeAreaInsets();
    const [selection, setSelection] = useState<string[]>(choisis);
    useEffect(() => {
        if (visible) setSelection(choisis);
    }, [visible, choisis]);

    const siegesQuery = useQuery({
        queryKey: ['sieges', offreUuid],
        queryFn: async () => (await api.offres.sieges(offreUuid)).data.sieges,
        enabled: visible && !!offreUuid,
        staleTime: 0
    });
    const sieges = siegesQuery.data;
    const libres = sieges ? nombreSiegesLibres(sieges) : 0;

    function basculer(numero: string) {
        setSelection((prev) => {
            if (prev.includes(numero)) return prev.filter((n) => n !== numero);
            // Au complet : le plus ancien choix cède sa place au nouveau.
            const suivant = prev.length >= nombre ? prev.slice(1) : prev;
            return [...suivant, numero];
        });
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onFermer} presentationStyle="pageSheet">
            <View style={[base.ecran, { paddingTop: Math.max(insets.top, espaces.md) }]}>
                <View style={styles.entete}>
                    <View style={{ width: 40 }} />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.titre}>Sélectionner des sièges</Text>
                        <Text style={base.attenue}>
                            {nombre} siège{nombre > 1 ? 's' : ''} à choisir
                        </Text>
                    </View>
                    <Pressable onPress={onFermer} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={12} style={styles.fermer}>
                        <Text style={styles.fermerTexte}>✕</Text>
                    </Pressable>
                </View>

                {siegesQuery.isPending ? (
                    <Chargement texte="Chargement du plan…" />
                ) : siegesQuery.isError || !sieges ? (
                    <EtatVide
                        titre="Plan indisponible"
                        texte="Le plan du véhicule n'a pas pu être chargé. Vous pouvez laisser les sièges s'attribuer automatiquement."
                        action={<Bouton libelle="Réessayer" onPress={() => void siegesQuery.refetch()} />}
                    />
                ) : (
                    <ScrollView contentContainerStyle={styles.contenu}>
                        <LegendeSieges />
                        {libres < nombre && <Bandeau type="alerte">Il ne reste que {libres} siège{libres > 1 ? 's' : ''} libre{libres > 1 ? 's' : ''} sur ce véhicule.</Bandeau>}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: espaces.lg }}>
                            <PlanSiegesVue plan={sieges.plan} occupes={sieges.occupes} choisis={selection} onBasculer={basculer} />
                        </ScrollView>
                    </ScrollView>
                )}

                <View style={[styles.pied, { paddingBottom: Math.max(insets.bottom, espaces.lg) }]}>
                    <Text style={base.gras}>
                        {selection.length === 0 ? 'Aucun siège sélectionné' : `${selection.length} siège${selection.length > 1 ? 's' : ''} sur ${nombre} : ${[...selection].sort((a, b) => Number(a) - Number(b)).join(', ')}`}
                    </Text>
                    <Text style={base.attenue}>Sans choix, nous vous attribuons les premiers sièges libres, côte à côte si possible, sans frais.</Text>
                    <Bouton libelle="Confirmer" desactive={selection.length !== nombre} onPress={() => onConfirmer(selection)} />
                    <Bouton libelle="Ignorer la sélection" variante="discret" onPress={onIgnorer} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: espaces.lg, paddingVertical: espaces.sm },
    titre: { fontSize: 18, fontWeight: '700', color: couleurs.encre },
    fermer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    fermerTexte: { fontSize: 18, color: couleurs.encre, fontWeight: '700' },
    contenu: { paddingBottom: espaces.xl, gap: espaces.md },
    pied: { paddingHorizontal: espaces.lg, paddingTop: espaces.md, borderTopWidth: 1, borderTopColor: couleurs.ligne, backgroundColor: couleurs.blanc, gap: espaces.sm }
});

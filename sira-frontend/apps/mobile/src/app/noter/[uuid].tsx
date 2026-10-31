import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { formatDateFr } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../api';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces, rayons } from '../../ui/theme';

const LIBELLES: Record<number, string> = { 1: 'Très mauvais', 2: 'Mauvais', 3: 'Correct', 4: 'Bien', 5: 'Excellent' };
const COMMENTAIRE_MAX = 500;

/**
 * Note de 1 à 5 et commentaire facultatif sur un voyage effectué. Le serveur
 * n'accepte qu'un avis par commande : s'il refuse pour cette raison, l'écran
 * le dit et retient le refus pour la session, faute d'un moyen de le savoir
 * d'avance.
 */
export default function Noter() {
    const { uuid } = useLocalSearchParams<{ uuid: string }>();
    const queryClient = useQueryClient();
    const [note, setNote] = useState(0);
    const [commentaire, setCommentaire] = useState('');

    const commandeQuery = useQuery({ queryKey: ['commande', uuid], queryFn: async () => (await api.commandes.byUuid(uuid)).data.commande, enabled: !!uuid });

    const envoyer = useMutation({
        mutationFn: async () => api.avis.creer({ commandeUuid: uuid, note, commentaire: commentaire.trim() || undefined }),
        onSuccess: () => {
            queryClient.setQueryData(['avis-donne', uuid], true);
            router.replace({ pathname: '/(tabs)/voyages' });
        },
        onError: (e) => {
            if (e instanceof ApiError && /déjà/i.test(e.message)) queryClient.setQueryData(['avis-donne', uuid], true);
        }
    });

    if (commandeQuery.isPending) return <Chargement />;
    if (commandeQuery.isError || !commandeQuery.data) {
        return <EtatVide titre="Commande introuvable" action={<Bouton libelle="Retour" variante="secondaire" onPress={() => router.back()} />} />;
    }
    const c = commandeQuery.data;

    return (
        <KeyboardAvoidingView style={base.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <View>
                    <Text style={base.titre}>Comment s'est passé votre voyage ?</Text>
                    <Text style={base.sousTitre}>
                        {c.villeDepartLibelle} → {c.villeArriveeLibelle}, le {formatDateFr(c.dateDepart)}. Votre avis aide les autres voyageurs et le transporteur.
                    </Text>
                </View>

                <Carte style={{ alignItems: 'center', gap: espaces.md }}>
                    <View style={styles.etoiles} accessibilityRole="radiogroup" accessibilityLabel="Note sur cinq">
                        {[1, 2, 3, 4, 5].map((v) => (
                            <Pressable
                                key={v}
                                accessibilityRole="radio"
                                accessibilityLabel={`${v} sur 5, ${LIBELLES[v]}`}
                                accessibilityState={{ checked: note === v }}
                                onPress={() => setNote(v)}
                                hitSlop={8}
                            >
                                <Text style={[styles.etoile, v <= note && styles.etoilePleine]}>★</Text>
                            </Pressable>
                        ))}
                    </View>
                    <Text style={[styles.libelle, note === 0 && base.attenue]}>{note === 0 ? 'Touchez une étoile' : LIBELLES[note]}</Text>
                </Carte>

                <View>
                    <Text style={base.champLibelle}>Commentaire (facultatif)</Text>
                    <TextInput
                        value={commentaire}
                        onChangeText={setCommentaire}
                        placeholder="Ponctualité, confort, conduite, accueil…"
                        placeholderTextColor={couleurs.gris}
                        multiline
                        maxLength={COMMENTAIRE_MAX}
                        style={[base.champSaisie, styles.commentaire]}
                        accessibilityLabel="Commentaire"
                    />
                    <Text style={[base.attenue, { textAlign: 'right', fontSize: 12 }]}>
                        {commentaire.length}/{COMMENTAIRE_MAX}
                    </Text>
                </View>

                {envoyer.isError && (
                    <Bandeau type={envoyer.error instanceof ApiError && /déjà/i.test(envoyer.error.message) ? 'info' : 'erreur'}>
                        {envoyer.error instanceof ApiError ? envoyer.error.message : "L'envoi a échoué. Vérifiez votre réseau puis réessayez."}
                    </Bandeau>
                )}

                <Bouton libelle="Envoyer mon avis" onPress={() => envoyer.mutate()} desactive={note === 0} enCours={envoyer.isPending} />
                <Bouton libelle="Plus tard" variante="discret" onPress={() => router.back()} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    etoiles: { flexDirection: 'row', gap: espaces.sm },
    etoile: { fontSize: 44, color: couleurs.ligne },
    etoilePleine: { color: couleurs.or },
    libelle: { fontSize: 17, fontWeight: '700', color: couleurs.encre },
    commentaire: { minHeight: 110, textAlignVertical: 'top', borderRadius: rayons.md }
});

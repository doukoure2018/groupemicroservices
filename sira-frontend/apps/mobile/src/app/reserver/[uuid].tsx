import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { formatDateFr, formatHeure, formatMontant, getMontantEffectif, type CommandeClient, type PassagerRequest } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { Bandeau, Bouton, Carte, Champ, Chargement, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces, rayons } from '../../ui/theme';

const MAX_PLACES = 8;
const passagerVide = (): PassagerRequest => ({ nom: '', prenom: '', telephone: '', pieceIdentite: '' });

/**
 * Passagers, mode de règlement, confirmation. Deux issues, décidées par le
 * serveur : un mode servi par un prestataire renvoie une adresse de paiement
 * et la commande attend les fonds ; un règlement sur place confirme tout de
 * suite et les billets sont émis.
 */
export default function Reserver() {
    const { uuid } = useLocalSearchParams<{ uuid: string }>();
    const offreQuery = useQuery({ queryKey: ['offre', uuid], queryFn: async () => (await api.offres.byUuid(uuid)).data.offre, enabled: !!uuid });
    const modesQuery = useQuery({ queryKey: ['modes-reglement'], queryFn: async () => (await api.commercial.modesReglement()).data.modesReglement ?? [] });

    const [passagers, setPassagers] = useState<PassagerRequest[]>([passagerVide()]);
    const [modeCode, setModeCode] = useState('');

    const offre = offreQuery.data;
    const prixUnitaire = offre ? getMontantEffectif(offre) : 0;
    const total = prixUnitaire * passagers.length;
    const maxPassagers = Math.min(MAX_PLACES, offre?.nombrePlacesDisponibles ?? MAX_PLACES);
    const modes = (modesQuery.data ?? []).filter((m) => m.actif !== false);
    const modeChoisi = modes.find((m) => m.code === modeCode);
    const enLigne = modeChoisi?.enLigne === true;

    const reserver = useMutation({
        mutationFn: async () =>
            (
                await api.commandes.create({
                    offreUuid: uuid,
                    passagers: passagers.map((p) => ({ ...p, pieceIdentite: p.pieceIdentite || undefined })),
                    modeReglementCode: modeCode,
                    montantTotal: total
                })
            ).data.commande,
        onSuccess: (commande: CommandeClient) => {
            if (commande.urlPaiement && commande.referencePaiement) {
                router.replace({
                    pathname: '/paiement/[reference]',
                    params: { reference: commande.referencePaiement, url: commande.urlPaiement, mode: modeChoisi?.libelle ?? '' }
                });
                return;
            }
            router.replace({ pathname: '/commande/[uuid]', params: { uuid: commande.commandeUuid! } });
        }
    });

    if (offreQuery.isPending) return <Chargement />;
    if (offreQuery.isError || !offre) {
        return <EtatVide titre="Voyage introuvable" action={<Bouton libelle="Retour" variante="secondaire" onPress={() => router.back()} />} />;
    }

    function setPassager(i: number, champ: keyof PassagerRequest, valeur: string) {
        setPassagers((prev) => prev.map((p, j) => (j === i ? { ...p, [champ]: valeur } : p)));
    }

    const formulaireValide = modeCode !== '' && passagers.every((p) => p.nom.trim() && p.prenom.trim() && p.telephone.trim());
    const messageErreur =
        reserver.error instanceof ApiError
            ? reserver.error.message
            : enLigne
              ? "Le paiement n'a pas pu être ouvert. Aucune place n'a été retenue, réessayez dans un instant."
              : 'La réservation a échoué. Vérifiez les places disponibles et réessayez.';

    return (
        <KeyboardAvoidingView style={base.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <Carte style={{ gap: espaces.xs }}>
                    <Text style={base.gras}>
                        {offre.villeDepartLibelle} → {offre.villeArriveeLibelle}
                    </Text>
                    <Text style={base.attenue}>
                        {formatDateFr(offre.dateDepart)} à {formatHeure(offre.heureDepart)}
                    </Text>
                    <Text style={base.attenue}>{formatMontant(prixUnitaire, offre.devise)} par place</Text>
                </Carte>

                <Text style={base.sectionTitre}>Passagers ({passagers.length})</Text>
                {passagers.map((p, i) => (
                    <Carte key={i}>
                        <View style={base.ligne}>
                            <Text style={base.gras}>Passager {i + 1}</Text>
                            {passagers.length > 1 && (
                                <Pressable accessibilityRole="button" onPress={() => setPassagers((prev) => prev.filter((_, j) => j !== i))}>
                                    <Text style={{ color: couleurs.danger, fontWeight: '600' }}>Retirer</Text>
                                </Pressable>
                            )}
                        </View>
                        <Champ libelle="Nom *" value={p.nom} onChangeText={(v) => setPassager(i, 'nom', v)} autoCapitalize="words" />
                        <Champ libelle="Prénom *" value={p.prenom} onChangeText={(v) => setPassager(i, 'prenom', v)} autoCapitalize="words" />
                        <Champ libelle="Téléphone *" value={p.telephone} onChangeText={(v) => setPassager(i, 'telephone', v)} keyboardType="phone-pad" placeholder="+224 6XX XX XX XX" />
                        <Champ libelle="Pièce d'identité" value={p.pieceIdentite ?? ''} onChangeText={(v) => setPassager(i, 'pieceIdentite', v)} />
                    </Carte>
                ))}
                {passagers.length < maxPassagers && (
                    <Bouton libelle="+ Ajouter un passager" variante="secondaire" onPress={() => setPassagers((prev) => [...prev, passagerVide()])} />
                )}

                <Text style={base.sectionTitre}>Mode de règlement</Text>
                {modesQuery.isError && <Bandeau type="erreur">Impossible de charger les modes de règlement.</Bandeau>}
                <View style={styles.modes}>
                    {modes.map((m) => (
                        <Pressable
                            key={m.code}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: modeCode === m.code }}
                            onPress={() => setModeCode(m.code ?? '')}
                            style={[styles.mode, modeCode === m.code && styles.modeActif]}
                        >
                            <Text style={[styles.modeTexte, modeCode === m.code && styles.modeTexteActif]}>{m.libelle}</Text>
                        </Pressable>
                    ))}
                </View>
                {modeChoisi && (
                    <Bandeau type="info">
                        {enLigne
                            ? `Vous serez redirigé vers ${modeChoisi.libelle} pour régler. Vos billets sont émis dès que le paiement est confirmé.`
                            : 'Règlement sur place, au départ. Vos billets sont émis immédiatement.'}
                    </Bandeau>
                )}

                <Carte style={base.ligne}>
                    <Text style={base.gras}>
                        Total ({passagers.length} {passagers.length > 1 ? 'places' : 'place'})
                    </Text>
                    <Text style={styles.total}>{formatMontant(total, offre.devise)}</Text>
                </Carte>

                {reserver.isError && <Bandeau type="erreur">{messageErreur}</Bandeau>}
                <Bouton
                    libelle={enLigne ? 'Payer et confirmer' : 'Confirmer la réservation'}
                    onPress={() => reserver.mutate()}
                    desactive={!formulaireValide}
                    enCours={reserver.isPending}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    modes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.sm },
    mode: { paddingHorizontal: espaces.lg, paddingVertical: espaces.md, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.ligne, backgroundColor: couleurs.blanc },
    modeActif: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    modeTexte: { color: couleurs.encre, fontWeight: '600' },
    modeTexteActif: { color: couleurs.vertFonce },
    total: { fontSize: 20, fontWeight: '800', color: couleurs.vert }
});
